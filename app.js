const { join } = require("path");
const App = require("express")();
const BodyParser = require("body-parser");
const chalk = require("chalk");
const { logReady, logSuccess, logWarn, logError, logFatal, runSpinner, logLog } = require('./lib/logger')
const {
  verify,
  remove,
  clone,
  gitCheckout,
  installDependcies,
  runScript,
  softLink,
  copyModules,
  compressProject,
  cleanDir,
} = require("./lib/git-utils");

const dest = "/srv/publish/github/vuepress";
const sitePath = "/srv/www/document";

App.use(BodyParser.json());
App.use(BodyParser.urlencoded({ extended: false }));

App.post("/", async (req, res) => {
  res.end("OK");

  let commit_id = getCommitId(req.body);
  let repoURL = getRepoURL(req.body);
  if (!commit_id) {
    chalk.stderr.bgYellow("commit_id Not Found!");
  }

  let releaseVersion = join(dest, `release-${commit_id}`);

  if (verify(releaseVersion)) {
    logWarn(`${releaseVersion} is exists,to be remove`);
    remove(releaseVersion);
  }

  try {
    logLog('1. download project');
    await clone(repoURL, dest, `release-${commit_id}`);
    logLog('2. check branch');
    await gitCheckout(releaseVersion, commit_id);
    logLog('3. install dependcies');
    let installed = await installDependcies(
      releaseVersion,
      join(dest, "node_modules")
    );
    logLog('4. build project');
    await runScript(releaseVersion, "build");
    logLog('5. create symlink');
    softLink(join(releaseVersion, "dist"), sitePath);
    if (installed !== "copy") {
      logLog('6. save node_modules');
      copyModules(
        join(releaseVersion, "node_modules"),
        join(dest, "node_modules"),
        { recursive: true },
        (err) => {
          if (err) return logError("move node_modules error");
          logSuccess("moved node_modules to:" + join(dest, "node_modules"));
        }
      );
    } else { logLog('6. skip save node_modules'); }
    logLog('7. compress project');
    await compressProject(releaseVersion);
    logLog('8. clean old project');
    cleanDir(dest);
    logReady(`${commit_id} > deployed`);
  } catch (error) {
    logFatal(error);
  }
});

App.listen(8088, function () {
  logReady("App listening on port 8088!");
});

const getCommitId = ({ head_commit: { id = "" } } = {}) => id;
const getRepoURL = ({ repository: { ssh_url = "" } } = {}) => ssh_url;
