/**
 * decision.js
 * ---------------------------
 * 决策逻辑：基于感知到的数据，调用 LLM 生成执行计划
 * 并将结果存到本地（或通过 perception.js 的接口保留到内存），
 * 供下次感知时使用
 */

let { requestLLM } = require("./utils/llm.js");
let { parseActionPlanFromLLMJson } = require("./actionPlan.js");

// 可以使用 perception.js 的 updateLastDecisionResult 来保存本次的决策结果
let { updateLastDecisionResult } = require("./perception.js");

/**
 * @desc makeDecision: 生成执行计划
 * @param {Object} perceivedData - 来自感知层 gatherPerceptionData() 的信息
 * @returns {Object} actionPlan - 形如 { actions: [] }
 */
function makeDecision(perceivedData) {
    log("【Decision】开始决策...");

    // 1. 构造给 LLM 的提示信息 prompt
    //    可以把感知到的数据拼接进去，如：
    //    - 当前页面文本
    //    - 历史上的决策执行结果
    //    - 你想让 GPT 输出的指令格式
    //    - 以及你的推广诉求（比如“自动化兼职项目收学费”“金银珠宝首饰生意推广”），引导 LLM 生成相应操作
    let promptParts = [];
    promptParts.push("你是一个抖音养号 + 引流自动化 LLM Agent。");
    promptParts.push("以下是我感知到的页面文本信息: " + JSON.stringify(perceivedData.pageTexts));
    promptParts.push("以下是我历史决策信息: " + JSON.stringify(perceivedData.historyDecision));
    promptParts.push("请根据我的推广目标(自动化兼职收学费、金银珠宝首饰生意)和用户画像，");
    promptParts.push("生成下一步在抖音App要执行的操作列表(如 观看视频、点赞、评论、关注、私信、发视频 等)，");
    promptParts.push("并输出JSON格式：{\"actions\": [{\"actionType\": \"like\", ...}, ...]}。");
    let finalPrompt = promptParts.join("\n");

    // 2. 调用 LLM（深度封装 deepseek-chat），拿到返回结果
    let llmResponse = requestLLM("", finalPrompt); 
    // 这里的第一个参数(图片Base64)可不需要时传空字符串；也可在 requestLLM 里另行设计

    // 3. 将 LLM 返回的 JSON 文本解析成 actionPlan
    let actionPlan = parseActionPlanFromLLMJson(llmResponse);

    // 4. 将本次决策结果保存，以供下次感知时使用
    //    这里可以只保存 `actionPlan`，也可以保存更多信息
    updateLastDecisionResult({
        actionPlan: actionPlan,
        rawLLMResponse: llmResponse,
        timestamp: new Date().toISOString()
    });

    log("【Decision】决策完成: " + JSON.stringify(actionPlan));
    return actionPlan;
}

module.exports = {
    makeDecision
};
