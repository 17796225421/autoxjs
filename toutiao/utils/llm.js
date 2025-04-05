/**
 * llm.js
 * ----------------
 * 封装对 LLM 接口的调用，根据图片 Base64 + prompt 获取识别结果
 */

/**
 * 请求 LLM 接口，识别图片验证码
 * @param {string} imageBase64 - 图片的 Base64 数据
 * @param {string} prompt - 给 LLM 的文字提示
 * @returns {string} LLM 返回的识别/分析结果
 */
function requestImageCaptcha(imageBase64, prompt) {
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

module.exports = {
    requestImageCaptcha
};
