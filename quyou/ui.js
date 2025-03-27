/**
 * ui.js
 * ---------------------------
 * 仅包含 UI 布局与按钮事件
 */

"ui";
require("./utils/log.js") ;
initLog();

// 布局：两个按钮
ui.layout(
    <vertical padding="16">
        <text textSize="16sp" textColor="#000000" text="这是配置页面，仅包含两个按钮：" margin="0 0 0 16"/>
        <button id="btn_start" text="启动脚本" margin="0 16"/>
        <button id="btn_stop" text="停止脚本" margin="0 16"/>
    </vertical>
);

// ==================================================
// 用于管理脚本循环的变量和线程
// ==================================================
let isRunning = false;     // 表示脚本是否在运行
let scriptThread = null;   // 保存启动的线程，后面可以停止

// ===================== 启动脚本 =====================
ui.btn_start.on("click", () => {
    if (isRunning) {
        toast("脚本已在运行中，无需重复启动");
        return;
    }

    // 标志位置为运行中
    isRunning = true;

    // 启动一个新线程，去执行我们的无限循环任务
    scriptThread = threads.start(function() {
        // 用 while(isRunning) 来代替 while(true)，以便实现可控停止
        while (isRunning) {
            try {
                mainLogic(); 
            } catch (e) {
                console.error("【主脚本捕获到异常】:", e);
            }
        }
        // 整个循环结束后
        console.log("脚本已停止运行");
    });
});

// ===================== 停止脚本 =====================
ui.btn_stop.on("click", () => {
    if (!isRunning) {
        toast("脚本当前并未在运行");
        return;
    }

    // 将运行标记设为 false，让循环退出
    isRunning = false;

    // 如果脚本线程存在，也可以直接打断
    if (scriptThread) {
        scriptThread.interrupt();
        scriptThread = null;
    }

    toast("脚本已停止");
});
