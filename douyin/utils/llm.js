/**
 * llm.js
 * ----------------
 * 封装对 LLM 接口的调用，根据图片 Base64 + prompt 获取识别结果
 */

/**
 * 请求 LLM 接口
 * @param {string} prompt - 给 LLM 的文字提示
 * @returns {string} LLM 返回的识别/分析结果
 */
function requestImageCaptcha(prompt) {
    log("【requestImageCaptcha】开始向 LLM 请求识别...");

    let url = "https://chatapi.onechats.top/v1/chat/completions";
    let apiKey = "sk-yC03MnkqpVB489NOJwX3tLmxSepXuilqzGOBBrlCXJ6JWb1G";

    let body = {
        model: "gpt-4o-2024-11-20",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: "data:image/png;base64," + imageBase64
                        }
                    }
                ]
            }
        ],
        max_tokens: 300,
        response_format: {
            type: "json_object"
        }
    };

    // 发起请求
    try {
        let response = http.postJson(url, body, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            }
        });

        if (!response || response.statusCode !== 200) {
            log("【requestImageCaptcha】请求失败，状态码=" + (response ? response.statusCode : "无"));
            return "";
        }

        let resultJson = response.body.json();
        if (!resultJson || !resultJson.choices || resultJson.choices.length === 0) {
            log("【requestImageCaptcha】返回内容无有效结果");
            return "";
        }

        // 假设只取第一个结果
        let llmAnswer = resultJson.choices[0].message.content;
        log("【requestImageCaptcha】LLM返回");
        return llmAnswer;
    } catch (err) {
        log("【requestImageCaptcha】请求异常: " + err);
        return "";
    }
}

function requestLLM(imageBase64, prompt) {
    log("【requestLLM】开始请求 LLM...");

    // 示例 URL：假设 deepseek-chat 提供的接口
    let url = "https://api.deepseek-chat.com/v1/chat/completions";
    let apiKey = "YOUR_DEEPSEEK_CHAT_APIKEY"; // 替换为你自己的

    // 这里的 body 根据 deepseek-chat 接口规范编写
    let body = {
        model: "gpt-4o-2024-11-20",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        max_tokens: 500,
        temperature: 0.7
    };

    // 如果你需要传 imageBase64，也可放到 attachments 之类字段中
    // 具体看 deepseek-chat 是否支持
    // body.attachments = [{ ... }];

    try {
        let response = http.postJson(url, body, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            }
        });

        if (!response || response.statusCode !== 200) {
            log("【requestLLM】请求失败，状态码=" + (response ? response.statusCode : "无"));
            return "";
        }

        let resultJson = response.body.json();
        if (!resultJson || !resultJson.choices || resultJson.choices.length === 0) {
            log("【requestLLM】返回内容无有效结果");
            return "";
        }

        let llmAnswer = resultJson.choices[0].message.content;
        log("【requestLLM】LLM返回: " + llmAnswer);
        return llmAnswer;
    } catch (err) {
        log("【requestLLM】请求异常: " + err);
        return "";
    }
}

module.exports = {
    requestImageCaptcha,
    requestLLM
};
