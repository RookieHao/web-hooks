const dayjs = require('dayjs');
const chalk = require("chalk");
const ora = require('ora');

let spinner;

require("consola");

function getTime() {
  return dayjs().format('HH:mm:ss')
}
function formatMessage(message, chalkType = "greenBright") {
  return `${chalk[chalkType](getTime())} : ${chalk[chalkType](message)}`
}
module.exports = {
  runSpinner(message) {
    return ora(message).start();
  },
  logSilent(message) {
    return consola.silent({ message: formatMessage(message, "gray"), badge: true });
  },
  logFatal(message) {
    return consola.fatal({ message: formatMessage(message, "redBright"), badge: true });
  },
  logError(message) {
    return consola.error({ message: formatMessage(message, "redBright"), badge: true });
  },
  logWarn(message) {
    return consola.warn({ message: formatMessage(message, "yellowBright"), badge: true });
  },
  logLog(message) {
    return consola.log({ message: formatMessage(message, "magentaBright"), badge: false });
  },
  logInfo(message) {
    return consola.info({ message: formatMessage(message, "cyanBright"), badge: false });
  },
  logSuccess(message) {
    return consola.success({ message: formatMessage(message, "greenBright"), badge: false });
  },
  logReady(message) {
    spinner && spinner.stop();
    return consola.ready({ message: formatMessage(message, "greenBright"), badge: true });
  },
  logStart(message = 'running...', loading = true) {
    if (spinner) spinner.stop();
    consola.start({ message: formatMessage(``, "greenBright"), badge: true });
    if (loading) {
      spinner = module.exports.runSpinner(message);
    }
  }
}