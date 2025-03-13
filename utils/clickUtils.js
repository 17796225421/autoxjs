/**
 * clickUtils.js
 * ---------------【 点击相关的工具函数 】----------------
 */

/**
 * 通用安全点击函数（升级版）
 * @param {UiSelector|string} selectorOrStr - 可以直接传入一个选择器 (如 id("go"))，
 *                                           也可以传入字符串 (函数会自动尝试 id 或 text 查找)。
 * @param {string} desc - 日志描述信息
 * @param {number} [timeout=5000] - findOne 等待控件出现的超时时间(毫秒)
 * @returns {boolean} 是否点击成功
 */
function safeClick(selectorOrStr, desc, timeout) {
    timeout = timeout || 5000;

    // 连续找控件最多重试 3 次
    let maxFindAttempts = 3;
    let obj = null;
    for (let attempt = 1; attempt <= maxFindAttempts; attempt++) {
        if (typeof selectorOrStr === "object" && selectorOrStr.findOne) {
            // 直接用传入的 UiSelector
            obj = selectorOrStr.findOne(timeout);
        } else if (typeof selectorOrStr === "string") {
            // 如果是字符串，尝试 text
            obj = text(selectorOrStr).findOne(timeout);
        } else {
            log("safeClick参数错误: 既不是UiSelector对象也不是字符串");
            return false;
        }

        if (obj) {
            // 找到控件就跳出循环
            break;
        } else {
            log("第 " + attempt + " 次未找到控件：" + desc + "；selector = " + selectorOrStr);
            // 可以视情况决定是否加一个小的 sleep 来等待界面变化
            sleep(500);
        }
    }

    // 如果 3 次找不到，就返回失败
    if (!obj) {
        log("未找到控件：" + desc + "；selector = " + selectorOrStr);
        return false;
    }

    // ========== 能走到这儿说明找到了控件，以下是点击逻辑 ==========

    // 最多尝试点击 3 次
    for (let i = 0; i < 3; i++) {
        // (1) 若自身可点击，直接点击
        if (obj.clickable()) {
            if (obj.click()) {
                log("点击【" + desc + "】成功 (直接点击控件)");
                return true;
            }
        }

        // (2) 若自身不可点击，则用坐标点击
        let bounds = obj.bounds();
        if (bounds) {
            let x = random(bounds.left, bounds.right);
            let y = random(bounds.top, bounds.bottom);
            log(`即将随机点击的坐标位置: (${x}, ${y})`);
            click(x, y);
            log("点击【" + desc + "】成功 (随机坐标点击)");
            return true;
        }

        // 每次尝试点击后，等待一下再重试
        sleep(300);
    }

    // 若尝试三次都没能点击成功
    log("点击【" + desc + "】失败 (控件找到了，但多次点击无效)");
    return false;
}

// 导出给外部使用
module.exports = {
    safeClick
};
