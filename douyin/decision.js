/**
 * decision.js
 * ---------------------------
 * 基于感知数据调用LLM模型动态生成执行计划
 */

let { requestLLM } = require("./llm.js");
let { parseActionPlanFromLLMJson } = require("./actionPlan.js");
let actionPlanSchema = require('./actionPlanSchema.js');
let promptTemplate = require('./promptTemplate.json');
let { validate } = require("./jsonValidator.js");
let { updateLastDecisionResult } = require("./perception.js");

/**
 * 根据模板构造动态提示词
 */
function buildPrompt(perceivedData, template, schema) {
    return template.promptTemplate.join("\n")
        .replace("{agentIdentity}", template.agentIdentity)
        .replace("{pageTexts}", JSON.stringify(perceivedData.pageTexts))
        .replace("{historyDecision}", JSON.stringify(perceivedData.historyDecision))
        .replace("{promotionGoals}", template.promotionGoals.join("、"))
        .replace("{userProfiles}", JSON.stringify(template.userProfiles, null, 2))
        .replace("{actionPlanSchema}", JSON.stringify(schema, null, 2));
}

/**
 * makeDecision: 使用DeepSeek模型生成结构化执行计划
 * @param {Object} perceivedData - 感知到的数据
 * @returns {Object} 结构化执行计划
 */
function makeDecision(perceivedData) {
    log("【Decision】开始生成执行计划...");

    // 构建prompt
    let prompt = buildPrompt(perceivedData, promptTemplate, actionPlanSchema);

    // 请求LLM生成决策
    let actionPlan = requestLLM(prompt, "deepseek-ai/DeepSeek-V3", "", actionPlanSchema);

    // 校验actionPlan结构有效性
    let validation = validate(actionPlan, actionPlanSchema);
    if (!validation.valid) {
        log("【Decision】LLM输出结构错误：" + validation.errors.join(", "));
        return { actions: [] };
    }

    let decisionResult = {
        actionPlan,
        rawLLMResponse: JSON.stringify(actionPlan),
        timestamp: new Date().toISOString()
    };

    updateLastDecisionResult(decisionResult);

    log("【Decision】执行计划生成成功: " + JSON.stringify(actionPlan));
    return actionPlan;
}

module.exports = {
    makeDecision
};
