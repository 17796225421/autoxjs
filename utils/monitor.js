/**
 * monitor.js
 * -----------
 * 用于监控某个元素的 bounds，并定时打印出来
 */

let { findAllVisible } = require("./commonSelector.js");

/**
 * 启动监控线程，每隔 interval 毫秒，打印一次指定选择器匹配到的控件坐标
 * @param {UiSelector} selector - 只能接收一个能直接 find() 的选择器对象，如 id("xxx")、desc("xxx") 等
 * @param {string} [desc="未知元素"] - 日志中用于标识该元素
 * @param {number} [interval=1000] - 打印间隔（毫秒）
 * @returns {{ stop: Function }}  返回一个包含 stop() 方法的对象，可调用以停止监控
 */
function startMonitor(selector, desc, interval) {
    desc = desc || "未知元素";
    interval = interval || 1000;

    let isMonitoring = true;

    // 启动一个新线程
    let monitorThread = threads.start(function () {
        while (isMonitoring) {
            // 复用公共方法，拿到所有可见控件
            let filtered = findAllVisible(selector);

            if (filtered.length > 0) {
                // 如果有多个匹配，都打印一下，从 0 开始计数
                for (let i = 0; i < filtered.length; i++) {
                    let w = filtered[i];
                    let b = w.bounds();
                    log(
                        `监控【${desc}】(第 ${i} 个) 坐标: ` +
                        `left=${b.left}, top=${b.top}, right=${b.right}, bottom=${b.bottom}, ` +
                        `clickable=${w.clickable()}, focusable=${w.focusable()}`
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

// 导出给外部使用
module.exports = {
    startMonitor,
};
