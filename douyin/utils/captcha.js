/**
 * captcha.js
 * ----------------
 * 提供处理验证码的核心函数
 */
let { captureImageByUiObject, convertImageToBase64 } = require("./image.js");
let { requestLLM } = require("./llm.js");

/**
 * 专门处理需要“点击”的验证码
 * 比如：点击指定目标，返回屏幕真实坐标
 * @param {UiObject} uiObject - 需要识别验证码的 UiObject
 * @param {string} prompt - 动态提示语（例如 “点击蓝色物体”）
 * @returns {object} 返回真实坐标结构：
 *   {
 *       points: [
 *           { x: 100, y: 200 },
 *           { x: 150, y: 220 }
 *       ]
 *   }
 */
function solveClickCaptcha(uiObject, prompt) {
    log("【solveClickCaptcha】开始处理点击验证码...");

    // 1. 截图获取图片对象
    let img = captureImageByUiObject(uiObject);
    if (!img) {
        log("【solveClickCaptcha】截图失败");
        return { points: [] };
    }

    // 2. 转换为Base64格式
    let imageBase64 = convertImageToBase64(img);
    img.recycle && img.recycle();

    if (!imageBase64) {
        log("【solveClickCaptcha】图片转Base64失败");
        return { points: [] };
    }

    // 3. 固定的prompt指导LLM输出规范
    let fixedPrompt = `
    ${prompt}。
    图片的长宽比例为1，左上角为(0,0)，右下角为(1,1)。  
    输出JSON示例:
    {
        "points": [
            { "x": 0.12, "y": 0.34 },
            { "x": 0.56, "y": 0.78 }
        ]
    }`;

    // 4. 严格定义JSON Schema校验结构
    let captchaSchema = {
        type: "object",
        properties: {
            points: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        x: { type: "number", minimum: 0, maximum: 1 },
                        y: { type: "number", minimum: 0, maximum: 1 }
                    },
                    required: ["x", "y"]
                },
                minItems: 1
            }
        },
        required: ["points"]
    };

    // 5. 调用通用llm函数 (模型名=gpt-4o-2024-11-20，图片非空)
    let llmResult;
    try {
        llmResult = requestLLM(fixedPrompt, "gpt-4o-2024-11-20", imageBase64, captchaSchema);
        log("【solveClickCaptcha】LLM返回结果: " + JSON.stringify(llmResult));
    } catch (e) {
        log("【solveClickCaptcha】LLM请求异常：" + e.message);
        return { points: [] };
    }

    // 6. 相对坐标转化为屏幕真实坐标
    let realPoints = convertRelativePointsToAbsolute(uiObject, llmResult.points);

    return { points: realPoints };
}

/**
 * 工具函数：将LLM返回的比例坐标转为真实屏幕坐标
 * @param {UiObject} uiObject - 控件对象
 * @param {Array} relativePoints - 相对坐标数组 [{x:0.1,y:0.2},...]
 * @returns {Array} 屏幕坐标数组 [{x:100,y:200},...]
 */
function convertRelativePointsToAbsolute(uiObject, relativePoints) {
    let realPoints = [];

    let bounds = uiObject.bounds();
    if (!bounds) {
        log("【convertPoints】控件bounds获取失败");
        return realPoints;
    }

    let { left, top, width, height } = {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width(),
        height: bounds.height()
    };

    relativePoints.forEach(p => {
        let realX = Math.round(left + p.x * width);
        let realY = Math.round(top + p.y * height);
        realPoints.push({ x: realX, y: realY });
    });

    return realPoints;
}

module.exports = {
    solveClickCaptcha
};
