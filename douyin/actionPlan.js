/**
 * actionPlan.js
 * ---------------------------
 * 定义 actionPlan 的数据结构，以及将 LLM 返回的 JSON 转换成 actionPlan
 * 例如:
 * {
 *   actions: [
 *     { actionType: "like", targetUser: "xxx" },
 *     { actionType: "comment", commentText: "你好呀" },
 *     ...
 *   ]
 * }
 */

/**
 * @desc 从 LLM 返回的 JSON 文本中解析成 actionPlan
 *       假设 LLM 返回的 JSON 结构与本地 actionPlan 相似，此处仅做一个简单示例
 * @param {string} llmJsonStr - LLM 返回的 JSON 字符串
 * @returns {Object} actionPlan
 */
function parseActionPlanFromLLMJson(llmJsonStr) {
    let actionPlan = {
        actions: []
    };

    if (!llmJsonStr) {
        return actionPlan; // 空则返回默认
    }

    try {
        let parsedObj = JSON.parse(llmJsonStr);
        // 假设 parsedObj = { actions: [ ... ] }
        if (parsedObj && Array.isArray(parsedObj.actions)) {
            actionPlan.actions = parsedObj.actions;
        }
    } catch (e) {
        // JSON解析异常
        log("【actionPlan】解析异常: " + e);
    }

    // 打印下解析结果
    log("【actionPlan】最终解析结果: " + JSON.stringify(actionPlan));
    return actionPlan;
}

module.exports = {
    parseActionPlanFromLLMJson
};
