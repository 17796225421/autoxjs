/**
 * uiApi.js
 * ---------------------------
 * 脚本逻辑部分
 */

let { safeClick } = require("./utils/clickUtils.js");
let { safeInput } = require("./utils/inputUtils.js");
let { getPhoneNumber, getVerificationCode } = require("./utils/smsService.js");
let { loopRunner } = require("./utils/loop.js");

global.hasCapturePermission = false;

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