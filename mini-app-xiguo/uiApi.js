/**
 * uiApi.js
 * ---------------------------
 * 脚本逻辑部分
 */

let { safeClick } = require("./utils/clickUtils.js");
let { openApp, closeApp, openMiniProgram } = require("./utils/app.js");
let { safeInput } = require("./utils/inputUtils.js");
let { loopRunner } = require("./utils/loop.js");
global.hasCapturePermission = false;

function mainLogic() {
    loopRunner(重启西瓜, 100000, 10000);
}

function 重复评论() {
    safeClick(text("游戏").findOnce(0), "游戏tab", 5000);
    safeClick(id("gpl").findOnce(0), "评论");
    safeClick(descContains("发送图片").findOnce(0), "发送图片");
    safeClick(id("cwn").findOnce(0), "图片");
    safeClick(text("完成").findOnce(0), "完成");
    safeInput(className("android.widget.EditText").findOnce(0), "这个好难QaQ，能不能教教", "评论框");
    safeClick(text("发送").findOnce(0), "发生");
    back();
}

function 重启西瓜() {
    closeApp("西瓜视频");
    openApp("西瓜视频");
    safeClick(text("游戏").findOnce(0), "游戏tab", 5000);
    loopRunner(重复评论, 10, 10000);
    safeInput(className("android.widget.EditText").findOnce(0), miniProgramName, "搜索框");
}

module.exports = {
    mainLogic
};