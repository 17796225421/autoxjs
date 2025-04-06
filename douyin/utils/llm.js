/**
 * llm.js
 * ---------------------------
 * 通用封装LLM接口调用，动态支持图片识别与文本决策
 */

let { validate } = require("./jsonValidator.js");

const LLM_CONFIG = {
    "gpt-4o": {
        url: "https://chatapi.onechats.top/v1/chat/completions",
        apiKey: "sk-yC03MnkqpVB489NOJwX3tLmxSepXuilqzGOBBrlCXJ6JWb1G",
        max_tokens: 300,
    },
    "deepseek-chat": {
        url: "https://api.siliconflow.cn/v1/chat/completions",
        apiKey: "sk-acsnxsxkssmqlkzudzvhmbmabyscwcbtqquslizdadmdkpot",
        max_tokens: 800,
    }
};

/**
 * 通用请求LLM接口函数
 * @param {string} prompt - 提示文本
 * @param {string} model - 模型名称("gpt-4o" | "deepseek-chat")
 * @param {string} [imageBase64] - 图片Base64（可选，默认空）
 * @param {Object} responseSchema - 预期的JSON结构Schema
 * @returns {Object} 返回符合schema的JSON对象
 */
function requestLLM(prompt, model, imageBase64, responseSchema) {
    imageBase64 = imageBase64 || '';
    log(`【requestLLM】请求模型: ${model}`);

    let { url, apiKey, max_tokens } = LLM_CONFIG[model];

    // 构建请求body
    let body = {
        model,
        messages: [{
            role: "user",
            content: imageBase64 ? [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } }
            ] : prompt
        }],
        max_tokens,
        response_format: { type: "json_object" }
    };

    try {
        let response = http.postJson(url, body, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            }
        });

        if (!response || response.statusCode !== 200) {
            throw new Error(`请求失败，状态码=${response ? response.statusCode : '无响应'}`);
        }

        let resultJson = response.body.json();
        if (!resultJson || !resultJson.choices || resultJson.choices.length === 0) {
            throw new Error("返回内容无有效结果");
        }

        // 解析并校验JSON输出
        let llmAnswer = resultJson.choices[0].message.content;
        let parsedResponse = JSON.parse(llmAnswer);
        let validation = validate(parsedResponse, responseSchema);

        if (!validation.valid) {
            throw new Error("LLM输出结构错误: " + validation.errors.join(", "));
        }

        return parsedResponse;

    } catch (err) {
        log(`【requestLLM】请求异常: ${err.message}`);
        return {};
    }
}

module.exports = { requestLLM };
