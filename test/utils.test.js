const { verify, remove, hasYarn, hasGit } = require("../lib/git-utils");
const { resolve } = require("path");
const { mkdirSync, writeFileSync } = require("fs");

function pathResolve(...arg) {
  return resolve(__dirname, '../test-static', ...arg)
}

test("verify function", () => {
  expect(verify(pathResolve(''))).toBe(true);
  expect(verify(pathResolve('test.dir'))).toBe(true);
  expect(verify(pathResolve('test.file'))).toBe(true);
  expect(verify(pathResolve('symlink'))).toBe(true);
  expect(verify(pathResolve('symlinks'))).toBe(false);
})

test("remove function", () => {
  let tempPath = (...path) => pathResolve('temp', ...path);
  if (!verify(tempPath(''))) {
    mkdirSync(tempPath(''));
  }
  let filePath = tempPath('temp.file');
  writeFileSync(filePath, "temp content");
  remove(filePath);
  expect(verify(filePath)).toBe(false)
})

test("hasYarn function", () => {
  expect(hasYarn()).toBe(true)
})

test("hasGit function", () => {
  expect(hasGit()).toBe(true)
})
