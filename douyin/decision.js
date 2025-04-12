/**
 * decision.js
 * ---------------------------
 * 基于感知数据调用LLM模型动态生成执行计划
 */

let { requestLLM } = require("./utils/llm.js");
let actionPlanSchema = require('./actionPlanSchema.js');
let PromptManager = require('./utils/promptManager.js');
let { validate } = require("./utils/jsonValidator.js");
let { updateLastDecisionResult } = require("./perception.js");

/**
 * makeDecision: 使用DeepSeek模型生成结构化执行计划
 * @param {Object} perceivedData - 感知到的数据
 * @returns {Object} 结构化执行计划
 */
function makeDecision(perceivedData) {
    log("【Decision】开始生成执行计划...");

    // 使用PromptManager动态构建prompt
    let prompt = PromptManager.getDecisionPrompt(perceivedData, actionPlanSchema);

    // 请求LLM生成决策
    let actionPlan;
    try {
        actionPlan = requestLLM(prompt, "deepseek-ai/DeepSeek-V3", "", actionPlanSchema);
    } catch (e) {
        log("【Decision】LLM请求异常：" + e.message);
        return { actions: [] };
    }

    // 校验actionPlan结构有效性
    let validation = validate(actionPlan, actionPlanSchema);
    if (!validation.valid) {
        log("【Decision】LLM输出结构错误：" + validation.errors.join(", "));
        return { actions: [] };
    }

    log("【Decision】执行计划生成成功: " + JSON.stringify(actionPlan));
    return actionPlan;
}

module.exports = {
    makeDecision
};
