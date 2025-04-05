/**
 * monitor.js
 * ----------- 
 * 用于监控某个元素(及其子/孙节点)的 bounds，并定时打印出来
 */

/**
 * 启动监控线程，每隔 interval 毫秒，打印一次指定选择器匹配到的控件坐标
 * @param {UiSelector} selector - 能直接 find() 的选择器对象，如 id("xxx")、desc("xxx") 等
 * @param {string} [desc="未知元素"] - 日志中用于标识该元素
 * @param {number} [interval=1000] - 打印间隔（毫秒）
 * @param {number} [childIndex] - 若需要打印第几个子节点，则传入该参数
 * @param {number} [grandchildIndex] - 若需要打印第几个孙节点，则传入该参数
 * @returns {{ stop: Function }}  返回一个包含 stop() 方法的对象，可调用以停止监控
 */
function startMonitor(selector, desc, interval, childIndex, grandchildIndex) {
    desc = desc || "未知元素";
    interval = interval || 1000;

    let isMonitoring = true;

    // 启动一个新线程
    let monitorThread = threads.start(function () {
        while (isMonitoring) {
            // 拿到所有可见的根控件
            let filtered = findAllVisible(selector);

            if (filtered.length > 0) {
                // 如果有多个匹配，都打印一下，从 0 开始计数
                for (let i = 0; i < filtered.length; i++) {
                    let w = filtered[i];
                    // 默认打印根
                    let target = w;

                    // 如果指定了 childIndex，则尝试获取第几个子节点
                    if (typeof childIndex === "number" && w.childCount() > childIndex) {
                        target = w.child(childIndex);

                        // 如果再指定了 grandchildIndex，则从 target 获取第几个子节点
                        if (typeof grandchildIndex === "number" && target.childCount() > grandchildIndex) {
                            target = target.child(grandchildIndex);
                        }
                    }

                    let b = target.bounds();
                    log(
                        `监控【${desc}】(根第 ${i} 个)` +
                        (typeof childIndex === "number" ? ` -> child(${childIndex})` : "") +
                        (typeof grandchildIndex === "number" ? ` -> child(${grandchildIndex})` : "") +
                        ` 坐标: left=${b.left}, top=${b.top}, right=${b.right}, bottom=${b.bottom}, ` +
                        `clickable=${target.clickable()}, focusable=${target.focusable()}`
                    );
                }
            } else {
                log(`监控【${desc}】未找到控件（或无可见控件）`);
            }

            sleep(interval);
        }
        // 线程结束前可以做一些清理工作
        log(`已停止监控【${desc}】`);
    });

    // 返回一个可停止监控的对象
    return {
        stop() {
            isMonitoring = false;
        },
    };
}


/**
 * 从 selector.find() 中获取所有可见且有宽高的控件
 * @param {UiSelector} selector - 能直接 find() 的选择器对象，如 id("xxx")、desc("xxx") 等
 * @returns {UiObject[]} 可见的控件数组；若没找到或传入无效选择器，返回空数组
 */
function findAllVisible(selector) {
    let resultArr = [];

    // 如果传进来的不是能直接 .find() 的对象，则直接返回空
    if (!selector || typeof selector.find !== "function") {
        return resultArr;
    }

    // 拿到所有匹配的控件
    let allWidgets = selector.find();
    for (let i = 0; i < allWidgets.size(); i++) {
        let w = allWidgets.get(i);
        let b = w.bounds();
        // 过滤条件：可见 && 宽高 > 0
        if (w.visibleToUser() && b.width() > 0 && b.height() > 0) {
            resultArr.push(w);
        }
    }

    return resultArr;
}

// 导出给外部使用
module.exports = {
    startMonitor,
};
