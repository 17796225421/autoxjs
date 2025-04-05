/**
 * perception.js
 * ---------------------------
 * 感知层：从个人界面、消息界面等获取信息
 * 示例：先选择“消息”Tab，然后OCR获取当前页面文本数据
 * 并将历史决策数据(若有)一起返回
 */

let { safeClick } = require("./utils/clickUtils.js");
let { getAllTextsOnScreen } = require("./utils/ocr.js");

// 用于保存上次的决策数据，供本次感知时使用
// 也可改为外部文件持久化，如 storages.create("my_decision").put(...) 
let lastDecisionResult = null;

/**
 * @desc 在本文件中更新 lastDecisionResult
 *       让外部(如 decision.js)可以在完成决策后调用
 */
function updateLastDecisionResult(decisionData) {
    lastDecisionResult = decisionData;
}

/**
 * @desc 返回上次决策信息
 */
function getLastDecisionResult() {
    return lastDecisionResult || {};
}

/**
 * @desc gatherPerceptionData: 感知数据获取
 *  - 先点击“消息”Tab
 *  - 再用 OCR 拿到当前页面所有文本信息
 *  - 拼上上次决策保留的数据（若有）
 * @returns {Object} 包含页面文本信息 + 历史决策信息的对象
 */
function gatherPerceptionData() {
    log("【Perception】开始感知...");

    // 1. 假设这里可以找到“消息”按钮
    let msgButton = text("消息").findOnce();
    if (msgButton) {
        safeClick(msgButton, "消息Tab", 2000);
    } else {
        log("【Perception】未找到消息按钮，跳过点击");
    }

    // 2. 调用 OCR 获取当前页面所有文本
    let currentTexts = getAllTextsOnScreen();

    // 3. 获取上次决策（若有）
    let decisionHistory = getLastDecisionResult();

    // 4. 整合感知结果
    let perceivedData = {
        pageTexts: currentTexts,
        historyDecision: decisionHistory
    };

    log("【Perception】感知结果: " + JSON.stringify(perceivedData));
    return perceivedData;
}

module.exports = {
    gatherPerceptionData,
    updateLastDecisionResult,
    getLastDecisionResult
};
