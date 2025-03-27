/**
 * clickUtils.js
 * --------------
 * 点击相关的工具函数
 */

/**
 * 通用安全点击函数（仅使用坐标点击）
 * @param {UiObject} uiObject - 调用处已经拿到的目标控件
 * @param {string} desc - 日志描述信息
 * @param {number} waitTime - 点击后需要等待的毫秒数
 * @returns {boolean} 是否点击成功
 */
function safeClick(uiObject, desc, waitTime) {
    desc = desc || "未知控件";
    waitTime = waitTime || 3000;

    if (!uiObject) {
        log(`safeClick: 未传入有效 UiObject -> 【${desc}】`);
        return false;
    }

    let b = uiObject.bounds();
    if (!b || b.width() <= 0 || b.height() <= 0) {
        log(`safeClick 失败，【${desc}】的 bounds 无效: ${b}`);
        return false;
    }

    // 最多尝试点击 3 次
    for (let attempt = 1; attempt <= 3; attempt++) {
        let x = random(b.left, b.right);
        let y = random(b.top, b.bottom);
        log(`第 ${attempt} 次尝试点击【${desc}】，坐标=(${x}, ${y})`);
        click(x, y);

        // 点击后等待
        sleep(waitTime);

        // 如果你的逻辑只想点一次就直接返回成功，可以直接 return
        // 如果需要根据后续判断是否点击成功，才决定是否重试，可以在此处做相应判断
        return true;
    }

    // 理论上不会到这里
    return false;
}

module.exports = {
    safeClick,
};
