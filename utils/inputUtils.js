/**
 * inputUtils.js
 * ---------------
 * 用于封装「对某个输入框进行安全输入」的逻辑
 */

let { safeClick } = require("./clickUtils.js");

/**
 * 安全输入文本
 * @param {UiObject} uiObject - 目标输入框控件
 * @param {string} inputText - 要输入的文本
 * @param {string} desc - 描述(可选，用于日志)
 * @param {number} waitTime - 点击后需要等待的毫秒数
 * @returns {boolean} 是否输入成功
 */
function safeInput(uiObject, inputText, desc, waitTime) {
    desc = desc || "未知输入框";
    waitTime = waitTime || 3000;

    // 如果没找到输入控件，直接返回
    if (!uiObject) {
        log(`safeInput: 未传入有效 UiObject -> 【${desc}】`);
        return false;
    }

    // 1. 点击输入框，让它获取焦点
    if (!safeClick(uiObject, desc)) {
        log(`safeInput: 点击输入框失败 -> 【${desc}】`);
        return false;
    }

    // 2. 输入
    for (i = 0; i < 100; i++) {
        uiObject.setText(inputText);
        sleep(10);
    }

    log(`safeInput: 已向【${desc}】输入文本 -> ${inputText}`);

    sleep(waitTime);
    return true;
}

module.exports = {
    safeInput,
};
