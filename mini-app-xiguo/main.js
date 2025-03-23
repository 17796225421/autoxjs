/**
 * main.js
 * ---------------------------
 * 主脚本
 */

// "ui";
// require("./utils/log.js") ;
// initLog();

// // 布局：两个按钮
// ui.layout(
//     <vertical padding="16">
//         <text textSize="16sp" textColor="#000000" text="这是配置页面，仅包含两个按钮：" margin="0 0 0 16"/>
//         <button id="btn_start" text="启动脚本" margin="0 16"/>
//         <button id="btn_stop" text="停止脚本" margin="0 16"/>
//     </vertical>
// );

// // ==================================================
// // 用于管理脚本循环的变量和线程
// // ==================================================
// let isRunning = false;     // 表示脚本是否在运行
// let scriptThread = null;   // 保存启动的线程，后面可以停止

// // ===================== 启动脚本 =====================
// ui.btn_start.on("click", () => {
//     if (isRunning) {
//         toast("脚本已在运行中，无需重复启动");
//         return;
//     }

//     // 标志位置为运行中
//     isRunning = true;

//     // 启动一个新线程，去执行我们的无限循环任务
//     scriptThread = threads.start(function() {
//         // 用 while(isRunning) 来代替 while(true)，以便实现可控停止
//         while (isRunning) {
//             try {
//                 重复评论();
//             } catch (e) {
//                 console.error("【主脚本捕获到异常】:", e);
//             }
//         }
//         // 整个循环结束后
//         console.log("脚本已停止运行");
//     });
// });

// // ===================== 停止脚本 =====================
// ui.btn_stop.on("click", () => {
//     if (!isRunning) {
//         toast("脚本当前并未在运行");
//         return;
//     }

//     // 将运行标记设为 false，让循环退出
//     isRunning = false;

//     // 如果脚本线程存在，也可以直接打断
//     if (scriptThread) {
//         scriptThread.interrupt();
//         scriptThread = null;
//     }

//     toast("脚本已停止");
// });


// let { startMonitor } = require("./utils/monitor.js");
// startMonitor(text("发送"));
// let { findTextByOcr } = require("./utils/ocr.js");
// let uiObjects = findTextByOcr("乐享大智");

let { safeClick } = require("../quyou/utils/clickUtils.js");
let { openApp, closeApp, openMiniProgram } = require("../quyou/utils/app.js");
let { findTextByOcr } = require("../quyou/utils/ocr.js");
let { safeInput } = require("../quyou/utils/inputUtils.js");
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

mainLogic();

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

