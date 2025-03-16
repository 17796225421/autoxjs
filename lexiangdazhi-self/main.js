/**
 * main.js
 * ---------------------------
 * 主脚本
 */

// let { startMonitor } = require("../utils/monitor.js");
// startMonitor(id("gk"), "测试", 1000);

// let { findTextByOcr } = require("../utils/ocr.js");
// let uiObjects = findTextByOcr("乐享大智");

let { safeClick } = require("../utils/clickUtils.js");
let { closeApp, openMiniProgram } = require("../utils/app.js");

global.hasCapturePermission = false;

while (true) {
    try {
        mainLogic();
    } catch (e) {
        console.error("【主脚本捕获到异常】:", e);
    }
}

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
