/**
 * ui.js
 * ---------------------------
 * ui脚本
 */

"ui";

// 布局：两个按钮
ui.layout(
    <vertical padding="16">
        <text textSize="16sp" textColor="#000000" text="这是配置页面，仅包含两个按钮：" margin="0 0 0 16"/>
        <button id="btn_start" text="启动脚本" margin="0 16"/>
        <button id="btn_stop" text="停止脚本" margin="0 16"/>
    </vertical>
);

// 用于保存执行脚本的 engine 对象
let engine = null;

// 启动脚本
ui.btn_start.on("click", () => {
    // 如果已经有脚本在运行，可以先做个提示或先停止再启动
    if (engine) {
        toast("脚本已经在运行，无需重复启动~");
        return;
    }
    toast("启动主脚本...");
    // 请注意将这里的 "main.js" 修改成你的主脚本路径或名称
    engine = engines.execScriptFile("main.js");
});

// 停止脚本
ui.btn_stop.on("click", () => {
    if (!engine) {
        toast("当前没有正在运行的脚本~");
        return;
    }
    toast("停止脚本...");
    // 强制停止脚本
    engine.forceStop();
    engine = null;
});
