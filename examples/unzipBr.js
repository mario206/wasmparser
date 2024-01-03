const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

module.exports = function unzipBr(brPath, outPath) {
  const stdout = execSync(
    `${__dirname}/Brotli/macos/brotli --force --decompress --input ${brPath} -o ${outPath}`
  );
  console.log(stdout.toString());
};
