/**
 * clickUtils.js
 * --------------
 * 点击相关的工具函数
 */

let { findAllVisible } = require("./commonSelector.js");

/**
 * 通用安全点击函数（仅使用坐标点击）
 * @param {UiSelector} selector - 只能接收一个能直接 find() 的选择器对象 (如 id("xxx"), desc("xxx") ...)
 * @param {string} desc - 日志描述信息
 * @param {number} [index=0] - 若匹配到多个控件，点击第几个（从 0 开始计数）
 * @param {number} [timeout=5000] - 最长等待出现的时间 (毫秒)
 * @returns {boolean} 是否点击成功
 */
function safeClick(selector, desc, index, timeout) {
    desc = desc || "未知控件";
    index = (typeof index === "number") ? index : 0;
    timeout = timeout || 5000;

    // 记录开始时间，用于等待
    let startTime = Date.now();
    let targetWidget = null;

    // 在超时内，不断尝试查找，直到找到 index 对应的控件
    while (Date.now() - startTime < timeout) {
        let all = findAllVisible(selector);
        if (all.length > index) {
            // 找到目标控件
            targetWidget = all[index];
            break;
        }
        // 未找到或数量不足，稍等片刻再尝试
        sleep(200);
    }

    if (!targetWidget) {
        log(`safeClick 未找到控件: ${desc} (或匹配数量少于 index=${index})`);
        return false;
    }

    // ========== 找到了控件，以下仅用坐标点击 ==========

    // 最多尝试点击 3 次
    for (let attempt = 1; attempt <= 3; attempt++) {
        let b = targetWidget.bounds();
        if (b && b.width() > 0 && b.height() > 0) {
            let x = random(b.left, b.right);
            let y = random(b.top, b.bottom);
            log(`第 ${attempt} 次尝试点击【${desc}】(第${index}个): 坐标=(${x}, ${y})`);
            click(x, y);
            return true;
        } else {
            log(`控件【${desc}】(第${index}个) 的 bounds 不合法，无法点击。重试...`);
            sleep(300);
        }
    }

    // 若多次尝试都失败
    log(`点击【${desc}】(第${index}个) 失败，多次尝试无效。`);
    return false;
}

module.exports = {
    safeClick,
};
