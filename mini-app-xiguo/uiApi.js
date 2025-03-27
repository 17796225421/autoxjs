/**
 * uiApi.js
 * ---------------------------
 * 脚本逻辑部分
 */

let { safeClick } = require("./utils/clickUtils.js");
let { openApp, closeApp, openMiniProgram } = require("./utils/app.js");
let { safeInput } = require("./utils/inputUtils.js");
global.hasCapturePermission = false;
/**
 * 循环执行指定任务
 * @param {Function} taskFunction 需要执行的函数（如果有多条任务逻辑，可自行封装成一个函数再传进来）
 * @param {number} loopCount 循环次数
 * @param {number} waitTime 循环结束后等待的时间(毫秒)
 */
function loopRunner(taskFunction, loopCount, waitTime) {
    // 如果函数是匿名函数，那么 taskFunction.name 可能是空字符串，这里做个兜底处理
    const functionName = taskFunction.name || "匿名函数";

    log(`【${functionName}】开始循环，共循环 ${loopCount} 次`);

    for (let i = 1; i <= loopCount; i++) {
        log(`【${functionName}】第 ${i} 次开始执行`);

        // 执行传入的具体任务
        taskFunction();

        // 本次循环结束后等待
        log(`【${functionName}】第 ${i} 次循环结束，等待 ${waitTime} 毫秒`);
        sleep(waitTime);
    }

    log(`【${functionName}】循环执行结束`);
}


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