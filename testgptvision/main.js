/**
 * main.js
 * ----------------
 * 用于调用 captcha.js 进行测试
 */
let { solveClickCaptcha } = require("./utils/captcha.js");

/**
 * 测试函数：调用 solveClickCaptcha 并输出识别结果
 */
function testSolveClickCaptcha() {
    log("开始测试 solveClickCaptcha...");

    // 动态提示语
    let prompt = "点击蓝色物体。";

    // 假设有一个 id 为 "aliyunCaptcha-img-box" 的控件
    let uiObject = id("aliyunCaptcha-img-box").findOnce(0);
    let captchaResult = solveClickCaptcha(uiObject, prompt);

    log("验证码识别结果(结构化对象):", JSON.stringify(captchaResult));

    // 获取真实像素坐标
    let clickPoints = captchaResult.points || [];

    // 遍历并点击
    clickPoints.forEach((pt, idx) => {
        let x = pt.x;
        let y = pt.y;
        log(`即将点击坐标[${idx}]: x=${x}, y=${y}`);
        click(x, y);  // 直接点击真实坐标
    });
}

testSolveClickCaptcha();
