/**
 * uiApi.js
 * ---------------------------
 * 脚本逻辑部分
 */

let { safeClick } = require("./utils/clickUtils.js");
let { closeApp, openMiniProgram } = require("./utils/app.js");
let { loopRunner } = require("./utils/loop.js");

global.hasCapturePermission = false;

function mainLogic() {
    loopRunner(重启小程序, 100000, 10000);
}

function 重进小程序() {
    safeClick(id("gk").findOnce(0).child(0), "更多");
    safeClick(id("m7g").indexInParent(3).depth(12).findOnce(1), "重新进入小程序");
}

function 重启小程序() {
    closeApp("微信"); 
    openMiniProgram("乐享大智");
    loopRunner(重进小程序, 10, 10000);
}

module.exports = {
    mainLogic
};
