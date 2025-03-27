/**
 * main.js
 * ---------------------------
 * 仅包含 UI 布局与按钮事件
 */

"ui";

require("./utils/log.js");
initLog();

let { mainLogic } = require("./uiApi.js");

// 布局：两个按钮
ui.layout(
    <vertical padding="16">
        <text textSize="16sp" textColor="#000000"
              text="这是配置页面，仅包含两个按钮：" />
        <button id="btn_start" text="启动脚本" margin="0 16"/>
        <button id="btn_stop" text="停止脚本" margin="0 16"/>
    </vertical>
);

// 管理脚本的标记与线程
let isRunning = false;
let scriptThread = null;

// [启动脚本] 按钮点击
ui.btn_start.on("click", () => {
    if (isRunning) {
        toast("脚本已在运行中，无需重复启动");
        return;
    }
    isRunning = true;

    // 启动一个新线程，执行我们在 driver.js 中的逻辑
    scriptThread = threads.start(function() {
        while (isRunning) {
            try {
                mainLogic();
            } catch (e) {
                console.error("【主脚本捕获到异常】:", e);
            }
        }
        // 循环结束
        console.log("脚本已停止运行");
    });
});

// [停止脚本] 按钮点击
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
