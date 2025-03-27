/**
 * log.js
 * ---------------------------
 * 封装日志悬浮窗的功能（示例：带最小化、全屏、关闭、可拖动/可调大小）。
 */
// 加上"ui"注解，让脚本识别ui环境
"ui";

(function () {
    let floatyWindow = null;
    let logTextView = null;

    // 记录最大化/还原前的位置信息与大小，用于切换全屏状态
    let isMaximized = false;
    let restoreX = 0, restoreY = 0, restoreWidth = 0, restoreHeight = 0;

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
            <frame>
                <vertical bg={bgColor}>
                    {/* 顶部标题栏：最小化、全屏、关闭 */}
                    <horizontal id="titleBar" bg="#444444" padding="8" gravity="right">
                        {/* 运行日志标题(可选) */}
                        <text text="运行日志" textSize="16sp" textColor="#FFFFFF" layout_weight="1"/>
                        <text id="minBtn" text="—" textSize="18sp" textColor="#FFFFFF" margin="4"/>
                        <text id="maxBtn" text="❐" textSize="18sp" textColor="#FFFFFF" margin="4"/>
                        <text id="closeBtn" text="✕" textSize="18sp" textColor="#FFFFFF" margin="4"/>
                    </horizontal>

                    {/* 中间滚动区域 */}
                    <scroll id="logScroll" layout_weight="1">
                        <text id="logText" textSize="14sp" textColor="#FFFFFF" />
                    </scroll>

                    {/* 右下角用于拖动缩放 */}
                    <frame layout_width="match_parent" layout_height="wrap_content">
                        <text id="resizeHandle" 
                              layout_gravity="right|bottom"
                              text="◢" 
                              textSize="18sp" 
                              textColor="#FFFFFF" 
                              padding="4"/>
                    </frame>
                </vertical>
            </frame>
        );

        // 设置悬浮窗初始大小、位置（可根据需求修改）
        // -1表示全屏，-2表示自适应
        floatyWindow.setSize(600, 400); 
        floatyWindow.setPosition(100, 100);

        // 如果需要在关闭时退出脚本
        if (closeOnExit) {
            floatyWindow.exitOnClose();
        }

        // 绑定控件引用
        ui.run(() => {
            logTextView = floatyWindow.logText;

            // 按住标题栏可拖动
            let downX, downY, windowX, windowY;
            floatyWindow.titleBar.setOnTouchListener(function (view, event) {
                switch (event.getAction()) {
                    case event.ACTION_DOWN:
                        downX = event.getRawX();
                        downY = event.getRawY();
                        windowX = floatyWindow.getX();
                        windowY = floatyWindow.getY();
                        return true;
                    case event.ACTION_MOVE:
                        floatyWindow.setPosition(
                            windowX + (event.getRawX() - downX),
                            windowY + (event.getRawY() - downY)
                        );
                        return true;
                }
                return false;
            });

            // 最小化按钮
            floatyWindow.minBtn.setOnClickListener(() => {
                // 简单将窗口高度变小，仅保留标题栏
                floatyWindow.setSize(-2, 60);
            });

            // 全屏按钮
            floatyWindow.maxBtn.setOnClickListener(() => {
                if (!isMaximized) {
                    // 记录当前位置和大小
                    restoreX = floatyWindow.getX();
                    restoreY = floatyWindow.getY();
                    restoreWidth = floatyWindow.getWidth();
                    restoreHeight = floatyWindow.getHeight();

                    // 全屏
                    floatyWindow.setPosition(0, 0);
                    floatyWindow.setSize(-1, -1);
                } else {
                    // 恢复
                    floatyWindow.setPosition(restoreX, restoreY);
                    floatyWindow.setSize(restoreWidth, restoreHeight);
                }
                isMaximized = !isMaximized;
            });

            // 关闭按钮
            floatyWindow.closeBtn.setOnClickListener(() => {
                close();
            });

            // 右下角拖动缩放
            let resizeDownX, resizeDownY, downWidth, downHeight;
            floatyWindow.resizeHandle.setOnTouchListener(function (view, event) {
                switch (event.getAction()) {
                    case event.ACTION_DOWN:
                        resizeDownX = event.getRawX();
                        resizeDownY = event.getRawY();
                        downWidth = floatyWindow.getWidth();
                        downHeight = floatyWindow.getHeight();
                        return true;
                    case event.ACTION_MOVE:
                        let moveX = event.getRawX() - resizeDownX;
                        let moveY = event.getRawY() - resizeDownY;
                        floatyWindow.setSize(downWidth + moveX, downHeight + moveY);
                        return true;
                }
                return false;
            });
        });
    }

    /**
     * 输出日志到悬浮窗
     * @param {String} msg 要输出的文本
     */
    function log(msg) {
        if (!floatyWindow || !logTextView) {
("浮窗未初始化或已关闭，无法输出日志。");
            return;
        }

        ui.run(() => {
            const currentText = logTextView.getText() || "";
            // 拼接新的日志
            const newText = currentText + (currentText ? "\n" : "") + String(msg);
            logTextView.setText(newText);

            // 让滚动条自动到底部
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
    global.log = log;  
    global.initLog = init;
    global.closeLog = close;
})();
