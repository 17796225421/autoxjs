/**
 * log.js
 * ---------------------------
 * 封装日志悬浮窗的功能
 */

// 加上"ui"注解，让脚本识别ui环境
"ui";

(function () {
    // 用于保存悬浮窗对象和日志展示控件
    let floatyWindow = null;
    let logTextView = null;

    /**
     * 初始化日志悬浮窗
     * @param {Object} options 可选参数对象
     *  - closeOnExit {Boolean} 关闭悬浮窗时是否退出脚本，默认 false
     *  - bgColor {String} 背景颜色(含透明度)，默认 "#AA000000"
     */
    function init(options) {
        options = options || {};
        const bgColor = options.bgColor || "#AA000000";
        const closeOnExit = options.closeOnExit || false;

        // 检查悬浮窗权限
        if (!floaty.checkPermission()) {
            toast("需要悬浮窗权限，请授予后重新运行。");
            floaty.requestPermission();
            return;
        }

        // 创建原始悬浮窗
        floatyWindow = floaty.rawWindow(
            <vertical bg={bgColor} padding="8">
                <text textColor="#FFFFFF" textSize="16sp" margin="0 0 0 8">运行日志</text>
                <scroll id="logScroll">
                    <text id="logText" textSize="14sp" textColor="#FFFFFF" />
                </scroll>
                <button id="closeBtn" text="关闭悬浮窗" textSize="14sp" />
            </vertical>
        );

        // 设置悬浮窗大小、位置（可按需修改）
        floatyWindow.setSize(-2, -2); // 自适应大小
        floatyWindow.setPosition(100, 100); // 设置默认位置

        // 如果需要在关闭时退出脚本
        if (closeOnExit) {
            floatyWindow.exitOnClose();
        }

        // 绑定控件
        ui.run(() => {
            floatyWindow.closeBtn.setOnClickListener(() => {
                close();
            });
        });
        logTextView = floatyWindow.logText;
    }

    /**
     * 输出日志到悬浮窗
     * @param {String} msg 要输出的文本
     */
    function log(msg) {
        // 如果未初始化或悬浮窗已被关闭
        if (!floatyWindow || !logTextView) {
            console.warn("浮窗未初始化或已关闭，无法输出日志。");
            return;
        }

        ui.run(() => {
            const currentText = logTextView.getText() || "";
            // 拼接新的日志
            logTextView.setText(currentText + (currentText ? "\n" : "") + msg);

            // 让滚动条自动到底部（可选）
            let scrollView = floatyWindow.logScroll;
            scrollView.scrollTo(0, logTextView.getHeight());
        });
    }

    /**
     * 关闭日志悬浮窗
     */
    function close() {
        if (floatyWindow) {
            floatyWindow.close();
            floatyWindow = null;
            logTextView = null;
        }
    }

    // 导出给外部使用
    global.log = log;  // 全局暴露log方法，无需每次导入
    global.initLog = init;
    global.closeLog = close;
})();
