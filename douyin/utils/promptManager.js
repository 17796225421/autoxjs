/**
 * PromptManager.js
 * 专门管理LLM Prompt模板，提供动态生成Prompt能力
 */

let PromptManager = (function() {
    // 私有Prompt模板（以JS对象存储，规避require JSON问题）
    const templates = {
        clickCaptcha: {
            template: "{prompt}。\n图片的长宽比例为1，左上角为(0,0)，右下角为(1,1)。\n输出JSON示例:\n{exampleJSON}",
            exampleJSON: JSON.stringify({
                points: [{ x: 0.12, y: 0.34 }, { x: 0.56, y: 0.78 }]
            }, null, 4)
        },
        decision: {
            template: [
                "{agentIdentity}",
                "以下是我感知到的页面文本信息: {pageTexts}",
                "以下是我历史决策信息: {historyDecision}",
                "请根据我的推广目标：{promotionGoals}，",
                "结合精准的目标用户画像：{userProfiles}，",
                "生成下一步在抖音App要执行的操作列表，并严格按照JSON Schema输出：",
                "{actionPlanSchema}"
            ].join("\n"),
            context: {
                agentIdentity: "你是一个抖音养号 + 引流自动化LLM Agent。",
                promotionGoals: ["自动化兼职项目收学费", "推广金银珠宝首饰生意"],
                userProfiles: {
                    "兼职项目": {
                        "目标用户画像": "学生、宝妈、自由职业者、有业余时间且想赚外快的人群",
                        "关键诉求": ["简单易学", "收入稳定", "时间自由"]
                    },
                    "金银珠宝首饰": {
                        "目标用户画像": "年轻女性、中产阶级、有消费能力、对时尚和奢侈品有兴趣的人群",
                        "关键诉求": ["精美品质", "身份象征", "礼品馈赠"]
                    }
                }
            }
        }
    };

    return {
        /**
         * 动态生成ClickCaptcha的Prompt
         * @param {string} prompt 用户给出的提示语（例如：“点击蓝色物体”）
         * @returns {string} 完整的Prompt文本
         */
        getClickCaptchaPrompt(prompt) {
            let tpl = templates.clickCaptcha.template;
            let exampleJSON = templates.clickCaptcha.exampleJSON;
            return tpl.replace("{prompt}", prompt)
                      .replace("{exampleJSON}", exampleJSON);
        },

        /**
         * 动态生成决策Prompt
         * @param {object} perceivedData 感知数据
         * @param {object} actionPlanSchema 动作计划的JSON Schema
         * @returns {string} 完整的决策Prompt文本
         */
        getDecisionPrompt(perceivedData, actionPlanSchema) {
            let tpl = [
                "{agentIdentity}",
                "以下是我感知到的视频信息: {videoInfo}",
                "以下是我感知到的首条评论信息: {firstComment}",
                "以下是我感知到的评论列表信息: {commentInfo}",
                "以下是我感知到的单聊信息: {chatInfo}",
                "以下是我感知到的群聊信息: {groupChatInfo}",
                "以下是我历史决策信息: {historyDecision}",
                "请根据我的推广目标：{promotionGoals}，",
                "结合精准的目标用户画像：{userProfiles}，",
                "生成下一步在抖音App要执行的操作列表，并严格按照JSON Schema输出：",
                "{actionPlanSchema}"
            ].join("\n");
        
            let ctx = templates.decision.context;
            return tpl.replace("{agentIdentity}", ctx.agentIdentity)
                      .replace("{videoInfo}", JSON.stringify(perceivedData.videoInfo))
                      .replace("{firstComment}", JSON.stringify(perceivedData.firstComment))
                      .replace("{commentInfo}", JSON.stringify(perceivedData.commentInfo))
                      .replace("{chatInfo}", JSON.stringify(perceivedData.chatInfo))
                      .replace("{groupChatInfo}", JSON.stringify(perceivedData.groupChatInfo))
                      .replace("{historyDecision}", JSON.stringify(perceivedData.historyDecision))
                      .replace("{promotionGoals}", ctx.promotionGoals.join("、"))
                      .replace("{userProfiles}", JSON.stringify(ctx.userProfiles, null, 2))
                      .replace("{actionPlanSchema}", JSON.stringify(actionPlanSchema, null, 2));
                },

        /**
         * 支持动态修改模板
         * @param {string} templateName 模板名称（如："clickCaptcha"）
         * @param {object} newTemplate 新的模板内容
         */
        updateTemplate(templateName, newTemplate) {
            if (templates[templateName]) {
                templates[templateName] = newTemplate;
                log(`Prompt模板【${templateName}】更新成功`);
            } else {
                log(`Prompt模板【${templateName}】不存在，更新失败`);
            }
        }
    };
})();

module.exports = PromptManager;
