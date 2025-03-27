/**
 * uiApi.js
 * ---------------------------
 * 脚本逻辑部分
 */

let { safeClick } = require("./utils/clickUtils.js");
let { safeInput } = require("./utils/inputUtils.js");
let { getPhoneNumber, getVerificationCode } = require("./utils/smsService.js");

global.hasCapturePermission = false;

/**
 * 循环执行指定任务
 * @param {Function} taskFunction 需要执行的函数（如果有多条任务逻辑，可自行封装成一个函数再传进来）
 * @param {number} loopCount 循环次数
 * @param {number} waitTime 循环结束后等待的时间(毫秒)
 */
function loopRunner(taskFunction, loopCount, waitTime) {
    // 如果函数是匿名函数，那么 taskFunction.name 可能是空字符串，这里做个兜底处理
    const functionName = taskFunction.name || "匿名函数";

    log(`【${functionName}】开始循环，共循环 ${loopCount} 次`);

    for (let i = 1; i <= loopCount; i++) {
        log(`【${functionName}】第 ${i} 次开始执行`);

        // 执行传入的具体任务
        taskFunction();

        // 本次循环结束后等待
        log(`【${functionName}】第 ${i} 次循环结束，等待 ${waitTime} 毫秒`);
        sleep(waitTime);
    }

    log(`【${functionName}】循环执行结束`);
}

function 注册账号() {
    safeClick(text("立即注册").findOnce(0), "立即注册");
    let phone = getPhoneNumber();
    safeInput(text("请输入手机号").findOnce(0), phone, "请输入手机号");
    safeClick(text("获取验证码").findOnce(0), "获取验证码");
    let code = getVerificationCode(phone);
    safeInput(text("请输入验证码").findOnce(0), code, "请输入验证码");
    safeInput(id("et_password").findOnce(0), "qwer1234", "请输入密码");
    safeInput(id("et_password_02").findOnce(0), "qwer1234", "请确认登录密码");
    safeClick(text("注册").findOnce(0), "注册");
}

function mainLogic() {
    loopRunner(注册账号, 100000, 10000);
}

module.exports = {
    mainLogic
};