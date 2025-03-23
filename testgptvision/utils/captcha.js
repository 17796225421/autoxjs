/**
 * captcha.js
 * ----------------
 * 提供处理验证码的核心函数
 */
let { captureImageByUiObject, convertImageToBase64 } = require("./image.js");
let { requestImageCaptcha } = require("./llm.js");

/**
 * 专门处理需要“点击”的验证码
 * 比如：点击指定目标，返回坐标等
 * @param {UiObject} uiObject - 需要识别验证码的 UiObject
 * @param {string} prompt - 动态提示语（例如 “点击蓝色物体”）
 * @returns {object} 返回一个结构化对象，例如：
 *   {
 *       points: [
 *           { x: 100, y: 200 },
 *           { x: 150, y: 220 }
 *       ]
 *   }
 */
function solveClickCaptcha(uiObject, prompt) {
    log("【solveClickCaptcha】开始处理点击验证码...");

    // 1. 对指定 uiObject 区域进行截图
    let img = captureImageByUiObject(uiObject);
    if (!img) {
        log("【solveClickCaptcha】截图失败，无法获取图像对象。");
        return { points: [] };  // 返回一个空结构
    }

    // 2. 将截图转换为 Base64
    let imageBase64 = convertImageToBase64(img);
    // 如果需要释放图像内存（具体看Auto.js环境而定）
    img.recycle && img.recycle();

    if (!imageBase64) {
        log("【solveClickCaptcha】转换 Base64 失败。");
        return { points: [] };
    }

    // 3. 拼接固定提示语：关于坐标原点、输出 JSON 的格式说明等
    let fixedInstructions = "图片的长和宽比例为1，图片左上角为原点(0,0)，右下角为(1,1)，" +
        "水平是x轴，上下是y轴。输出点击的比例坐标，要求输入json，" +
        "参考{ points: [ {x: 0.00, y: 0.00}, {x: 0.00, y: 0.00} ] }。";
    let finalPrompt = prompt + " " + fixedInstructions;

    // 4. 调用 LLM API 进行识别
    let llmResult = requestImageCaptcha(imageBase64, finalPrompt);
    log("【solveClickCaptcha】LLM 返回结果: " + llmResult);

    // 5. 解析 LLM 返回的 JSON 并转换为真实坐标
    let resultObject = { points: [] };
    try {
        let parsed = JSON.parse(llmResult);
        if (parsed && Array.isArray(parsed.points)) {
            // 得到相对坐标
            let relativePoints = parsed.points;

            // 获得 uiObject 在屏幕上的真实边界
            let b = uiObject.bounds();
            // 计算并填充真实坐标
            let realPoints = [];
            for (let i = 0; i < relativePoints.length; i++) {
                let rp = relativePoints[i];
                // 例如 rp.x=0.10, rp.y=0.20
                let realX = b.left + b.width() * rp.x;
                let realY = b.top + b.height() * rp.y;

                realX = Math.round(realX);
                realY = Math.round(realY);

                realPoints.push({ x: realX, y: realY });
            }

            // 将结果存到返回对象中
            resultObject.points = realPoints;
        } else {
            log("【solveClickCaptcha】返回的 JSON 不符合预期结构。");
        }
    } catch (error) {
        log("【solveClickCaptcha】解析 JSON 出错: " + error);
    }

    return resultObject;
}

module.exports = {
    solveClickCaptcha
};
