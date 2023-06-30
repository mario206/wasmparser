/* Copyright 2016 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Demo of streaming of the data: it pushes data byte-by-byte to the buffer
// (which is feed to the BinaryReader) and WasmDisassembler attempts to pull
// all available entries from the imcomplete data.
// See also ../disassemble-wasm.js file.

var wasmparser = require("../dist/cjs/WasmParser.js");
var wasmdis = require("../dist/cjs/WasmDis.js");
var fs = require("fs");

var wasmPath = process.argv[2];
var outputFile = wasmPath + ".txt";

var data = new Uint8Array(fs.readFileSync(wasmPath));

console.log("output file : " + outputFile);

if (fs.existsSync(outputFile)) {
  console.log("delete old out file");
  fs.unlinkSync(outputFile);
}

let writeBuffer = Buffer.alloc(1024 * 1024 * 500); // 500M create a buffer to hold data
let offset = 0;

var fd = fs.openSync(outputFile, "w");

function writeLine(line) {
  const len = writeBuffer.write(line, offset); // write data to buffer
  offset += len;
  // if buffer is full, write to file
  if (offset >= writeBuffer.length) {
    fs.writeSync(fd, writeBuffer); // write buffer to file
    offset = 0;
  }
}

let num = 0;
var parser = new wasmparser.BinaryReader();
var dis = new wasmdis.WasmDisassembler();
dis.addOffsets = true;

var lastProgress = 0;

// Buffer to hold pending data.
var buffer = new Uint8Array(data.length + 1);
var pendingSize = 0;
var offsetInModule = 0;
for (var i = 0; i < data.length; i++) {
  var nextByte = data[i];
  var bufferSize = pendingSize + 1;
  // Ensure we can fit the next byte.
  if (buffer.byteLength < bufferSize) {
    var newBuffer = new Uint8Array(bufferSize);
    newBuffer.set(buffer);
    buffer = newBuffer;
  }
  // Moving single byte from the input data
  buffer[pendingSize] = nextByte;

  // Setting parser buffer and signaling it's not complete.
  var done = i == data.length - 1;
  parser.setData(buffer.buffer, 0, bufferSize, done);

  // The disassemble will attemp to fetch the data as much as possible.
  var finished = dis.disassembleChunk(parser, offsetInModule);

  var result = dis.getResult();
  result.lines.forEach(function(line, index) {
    var pos = `0x${result.offsets[index].toString(16)}`;
    var str = `${pos}:${index > 0 ? "." : " "} ${line}\n`;
    writeLine(str);
  });

  var currProgress = Math.floor((i * 100) / data.length);
  if (currProgress > lastProgress) {
    console.log(`${currProgress}%`);
    lastProgress = currProgress;
  }

  if (parser.position == 0) {
    // Parser did not consume anything.
    pendingSize = bufferSize;
    continue;
  }
  // Shift the data to the beginning of the buffer.
  var pending = parser.data.subarray(parser.position, parser.length);
  pendingSize = pending.length;
  buffer.set(pending);
  offsetInModule += parser.position;
}

if (offset > 0) {
  fs.writeSync(fd, writeBuffer.slice(0, offset));
}
fs.closeSync(fd);

console.log("output file : " + outputFile);
