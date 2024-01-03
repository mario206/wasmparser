var parseWasmToText = require("./parseWasmToText");
var unzipBr = require("./unzipBr");
const fs = require("fs");
const path = require("path");

var allWasmLines = null;

const readline = require("readline");
const { once } = require("events");

// 封装一个阻塞式的逐行读取函数
async function readLinesFromWat(filePath) {
  if (allWasmLines != null) {
    return;
  }
  const lines = [];

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    output: process.stdout,
    terminal: false
  });

  rl.on("line", (line) => {
    lines.push(line);
  });

  await once(rl, "close");

  allWasmLines = lines;
}

async function GetFuncNameByAddress(address, watPath, symbols) {
  var pattern = address + ":";

  var index = -1;

  for (var i = 0; i < allWasmLines.length; ++i) {
    if (allWasmLines[i].startsWith(pattern)) {
      //找到指令所在行
      index = i;
      break;
    }
  }

  if (index != -1) {
    // 找到指令所在函数
    var funcNum = null;
    for (var j = index - 1; j >= 0; --j) {
      var line = allWasmLines[j];
      var match = line.match("^0x[0-9a-z]+:.*\\(func \\$func([0-9]+) ");
      if (match && match.length == 2) {
        funcNum = match[1];
        break;
      }
    }
    if (funcNum) {
      if (symbols[funcNum]) {
        return symbols[funcNum];
      } else {
        return `error:${funcNum} not in symbol file`;
      }
    }
  }

  return `error:${address} can't found funName`;
}

async function processLines(lines, watPath, symbols) {

  for (var i = 0; i < lines.length; ++i) {
    var line = lines[i];
    var match = line.match("\s*([0-9a-z]+):(0x[0-9a-z]+)$");
    if (match && match.length == 3) {
      var address = match[2];
      var lineNum = parseInt(address, 16);
      await readLinesFromWat(watPath);

      var funName = await GetFuncNameByAddress(address, watPath, symbols);
      console.log(`${address} -> ${funName}`);
    }
  }
}

async function main() {
  if (process.argv.length < 3) {
    console.error("error main");
  }

  const dir = process.argv[2];

  var wasmPath = path.join(dir, "webgl.wasm");
  var wasmTextPath = wasmPath + ".wat";

  if (!fs.existsSync(wasmTextPath)) {
    console.log(`${wasmTextPath} not exist`);
    const files = fs.readdirSync(path.join(dir, "wasmcode"));
    const brFiles = files.filter((file) => path.extname(file) === ".br");
    if (brFiles.length !== 1) {
      console.error(`Expected 1 .br file, found ${brFiles.length}`);
      return;
    }
    var brPath = path.join(dir, "wasmcode", brFiles[0]);
    unzipBr(brPath, wasmPath);

    parseWasmToText(wasmPath, wasmTextPath);
  }

  const symbolPath = fs.readFileSync(path.join(dir, "webgl.wasm.symbols.unityweb"), "utf8");

  const symbols = JSON.parse(symbolPath);

  const readline = require("readline").createInterface({
    input: process.stdin, output: process.stdout
  });

  var lines = [];

  console.log("please input stack trace here and then ctrl+c to finish : ");
  readline.on("line", (line) => {
    lines.push(line);
  });

  readline.on("close", async () => {
    console.log("start parse....");
    //lines = ["(anonymous)\t@\t107c01ba:0x483501"];
    console.log(await processLines(lines, wasmTextPath, symbols));
  });

}

main();
