const fs = require("fs-extra");
const { execSync, spawn } = require("child_process");
const { logSuccess, logError, logFatal, runSpinner } = require('./logger');
const { logInfo } = require("./logger");
let _hasYarn;
let _hasGit;

// 下载项目
exports.clone = (src, dest, projectName = null) => {
  return new Promise((resolve, reject) => {
    if (!exports.hasGit()) {
      logFatal("Git Not Found");
      return reject("Git Not Found");
    }

    if (!exports.verify(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    let downloadProcess = spawn("git", ["clone", src, projectName], {
      cwd: dest,
      detached: true,
      shell: "/bin/bash",
      stdio: ["pipe", process.stdout, process.stderr],
    });
    downloadProcess.on("exit", (code, signal) => {
      if (~~code !== 0) {
        logFatal("下载失败");
        return reject();
      }
      logSuccess("下载完成");
      resolve();
    });
  });
};

// 检查目录方法
exports.verify = (source) => {
  return fs.existsSync(source);
};

// 删除文件
exports.remove = (source) => {
  let spinner = runSpinner(`removing:${source}`);
  fs.removeSync(source);
  spinner.stop();
  logSuccess(`${source} be removed`);
};

// 通过commitID切换分支
exports.gitCheckout = (cwd, commitId) => {
  return new Promise((resolve, reject) => {
    if (!exports.hasGit()) {
      logFatal("Git Not Found");
      return reject("Git Not Found");
    }
    let checkoutBranch = spawn("git", ["checkout", commitId, "--detach"], {
      cwd,
      detached: true,
      shell: "/bin/bash",
      stdio: ["pipe", process.stdout, process.stderr],
    });
    checkoutBranch.on("exit", (code, signal) => {
      if (~~code !== 0) {
        logFatal(`checkout to commit:${commitId} failed`);
        return reject();
      }
      logSuccess(`checkout to commit:${commitId} success`);
      resolve();
    });
  });
};

// 是否安装yarn
exports.hasYarn = () => {
  if (_hasYarn != null) {
    return _hasYarn;
  }
  try {
    execSync("yarn --version", { stdio: "ignore" });
    return (_hasYarn = true);
  } catch (e) {
    return (_hasYarn = false);
  }
};

// 是否安装git
exports.hasGit = () => {
  if (_hasGit != null) {
    return _hasGit;
  }
  try {
    execSync("git --version", { stdio: "ignore" });
    return (_hasGit = true);
  } catch (e) {
    return (_hasGit = false);
  }
};

// 安装依赖
exports.installDependcies = (cwd, installedModules, pkgManageTool) => {
  return new Promise((resolve, reject) => {
    if (exports.verify(installedModules)) {
      exports.copyModules(
        installedModules,
        cwd + "/node_modules",
        { recursive: true },
        (err) => {
          if (err) {
            logFatal(`Copy Error> from: "${installedModules}" to: "${cwd}/node_modules"。`)
            logError(err);
            return reject();
          }
          logSuccess(`Copy Success> from: "${installedModules}" to: "${cwd}/node_modules"。`)
          resolve("copy");
        }
      );
    } else {
      install(cwd, pkgManageTool, resolve, reject);
    }
  });
};

// 执行脚本
exports.runScript = (cwd, script, pkgManageTool) => {
  return new Promise((resolve, reject) => {
    pkgManageTool = pkgManageTool || exports.hasYarn() ? "yarn" : "npm";
    let scriptParams = pkgManageTool === "yarn" ? script : `run ${script}`
    let scriptProcess = spawn(
      pkgManageTool,
      [scriptParams],
      {
        cwd,
        detached: true,
        shell: "/bin/bash",
        stdio: ["pipe", process.stdout, process.stderr],
      }
    );
    let spinner = runSpinner(`runing script ${pkgManageTool} ${scriptParams}`);
    scriptProcess.on("exit", (code, signal) => {
      spinner.stop();
      if (~~code !== 0) {
        logFatal(`runing script ${pkgManageTool} ${scriptParams} failed`);
        return reject();
      }
      logSuccess(`runing script ${pkgManageTool} ${scriptParams} complete`);
      resolve();
    });
  });
};

// 创建软连接
exports.softLink = (target, path, type = "dir") => {
  try {
    exports.remove(path)
  } catch (error) {
    let dir = require("path").dirname(path);
    if (!exports.verify(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }
  return fs.symlinkSync(target, path, type);
};

// 安装依赖
const install = function (cwd, pkgManageTool, resolve, reject) {
  pkgManageTool = pkgManageTool || exports.hasYarn() ? "yarn" : "npm";
  let script = pkgManageTool === "yarn" ? null : "install";
  let installProcess = spawn(
    pkgManageTool,
    [script],
    {
      cwd,
      detached: true,
      shell: "/bin/bash",
      stdio: ["pipe", process.stdout, process.stderr],
    }
  );
  let spinner = runSpinner(`runing script ${pkgManageTool} ${script}`);
  installProcess.on("exit", (code, signal) => {
    spinner.stop();
    if (~~code !== 0) {
      logFatal(`runing script ${pkgManageTool} ${script} failed`);
      return reject();
    }
    logFatal(`runing script ${pkgManageTool} ${script} success`);
    resolve();
  });
};

// 复制目录
exports.copyModules = (src, dest, options, cb) => {
  logInfo(`copy > from: "${src}" to: "${dest}"`);
  if (typeof options === "function") {
    cb = options;
    options = null;
  }
  fs.copy(src, dest, options, cb);
};

// 压缩包
exports.compressProject = (cwd) => {
  return new Promise((resolve, reject) => {
    let compressProcess = spawn(
      "tar",
      [
        "-cvzf",
        `${cwd}.tar.gz`,
        "--exclude=node_modules",
        "--exclude=dist",
        "--exclude=.git",
        `-C`,
        `${cwd}`,
        ".",
      ],
      { cwd, detached: true, stdio: ["pipe", process.stdout, process.stderr] }
    );
    let spinner = runSpinner(`running compressProcess`)
    compressProcess.on("exit", (code) => {
      spinner.stop();
      if (~~code !== 0) {
        logFatal("compress failed");
        return reject();
      }
      logSuccess(`compress complete.path:${cwd}.tar.gz`);
      resolve();
    });
  });
};

// clean 7d ago
exports.cleanDir = function (cwd, regExp = /^release-.*/, time = 604800000) {
  fs.readdir(cwd, (err, files) => {
    if (err) {
      return logError(err);
    }
    let { resolve } = require("path");
    let expriseFiles = files.filter(
      (file) => regExp.test(file) && fs.statSync(resolve(cwd, file)).mtimeMs + time < Date.now()
    );
    if (expriseFiles.length) {
      expriseFiles.map(file => resolve(cwd, file)).forEach(exports.remove);
    }
  });
};
