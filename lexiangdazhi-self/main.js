/**
 * main.js
 * ---------------------------
 * 主脚本
 */

// let { startMonitor } = require("../utils/monitor.js");
// startMonitor(id("m7g").indexInParent(3).depth(12), "重新进入小程序", 1000);

let { safeClick } = require("../utils/clickUtils.js");

loopRunner(重进小程序, 10, 10000);

function 重进小程序() {
    safeClick(desc("更多"), "更多");
    safeClick(id("m7g").indexInParent(3).depth(12), "重新进入小程序", 1);
}

/**
 * 循环执行指定任务
 * @param {Function} taskFunction 需要执行的函数（如果有多条任务逻辑，可自行封装成一个函数再传进来）
 * @param {number} loopCount 循环次数
 * @param {number} waitTime 循环结束后等待的时间(毫秒)
 */
function loopRunner(taskFunction, loopCount, waitTime) {
    log(`开始循环，共循环 ${loopCount} 次`);
    
    for (let i = 1; i <= loopCount; i++) {
        log(`第 ${i} 次开始执行`);
        
        // 执行传入的具体任务
        taskFunction();
        
        // 本次循环结束后等待
        log(`第 ${i} 次循环结束，等待 ${waitTime} 毫秒`);
        sleep(waitTime);
    }
    
    log("循环执行结束");
}