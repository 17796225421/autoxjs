/**
 * main.js
 * ---------------------------
 * 包含 UI 布局与按钮事件，已添加“打开无障碍服务”的按钮
 */

"ui";

require("./utils/log.js");
initLog();

let { mainLogic } = require("./uiApi.js");

// ========= 1. 布局：添加第三个按钮“打开无障碍服务” =========
ui.layout(
    <vertical padding="16">
        <text textSize="16sp" textColor="#000000"
              text="这是配置页面，包含三个按钮：" />
        <button id="btn_access" text="打开无障碍服务" margin="0 16"/>
        <button id="btn_start" text="启动脚本" margin="0 16"/>
        <button id="btn_stop" text="停止脚本" margin="0 16"/>
    </vertical>
);

// 管理脚本的标记与线程
let isRunning = false;
let scriptThread = null;

/**
 * 2. [打开无障碍服务] 按钮点击事件
 *    - 如果无障碍权限尚未开启，引导用户前往设置页面
 *    - 如果已经开启，就提示已开启
 */
ui.btn_access.on("click", () => {
    if (!auto.service) {
        toast("请在无障碍设置中授予本应用无障碍权限");
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
    } else {
        toast("无障碍服务已开启");
    }
});

/**
 * 3. [启动脚本] 按钮点击事件
 *    - 判断是否已经在运行，避免重复启动
 *    - 启动一个子线程，循环执行 mainLogic()
 */
ui.btn_start.on("click", () => {
    if (isRunning) {
        toast("脚本已在运行中，无需重复启动");
        return;
    }
    // 尝试等待无障碍服务就绪（如果用户已打开）
    if (!auto.service) {
        toast("请先开启无障碍服务再启动脚本");
        return;
    }

    isRunning = true;
    scriptThread = threads.start(function() {
        while (isRunning) {
            try {
                mainLogic();
            } catch (e) {
                log("【主脚本捕获到异常】:", e);
            }
        }
        // 循环结束
        log("脚本已停止运行");
    });
});

/**
 * 4. [停止脚本] 按钮点击事件
 *    - 将运行标记置为 false，让循环停止
 *    - 如果脚本线程存在，也可以直接打断
 */
ui.btn_stop.on("click", () => {
    if (!isRunning) {
        toast("脚本当前并未在运行");
        return;
    }

    isRunning = false;
    if (scriptThread) {
        scriptThread.interrupt();
        scriptThread = null;
    }
    toast("脚本已停止");
});
