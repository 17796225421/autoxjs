/**
 * app.js
 */
let { safeClick } = require("./clickUtils.js");
let { safeInput } = require("./inputUtils.js");
let { findTextByOcr } = require("./ocr.js");

/**
 * 打开应用（通用）
 * @param {string} appNameOrPackage - 应用名称或包名
 */
function openApp(appNameOrPackage) {
    log("开始打开应用: " + appNameOrPackage);
    // 如果能通过名称获取到包名
    let packageName = app.getPackageName(appNameOrPackage);
    if (packageName) {
        app.launchPackage(packageName);
    } else {
        // 获取不到包名，可能参数本身就是包名，或者直接尝试用名称方式打开
        if (appNameOrPackage.indexOf('.') > -1) {
            // 包名格式
            app.launchPackage(appNameOrPackage);
        } else {
            // 应用名称格式
            app.launchApp(appNameOrPackage);
        }
    }
    log("打开应用完成: " + appNameOrPackage);
    sleep(10000);
}

/**
 * 打开小程序
 * @param {string} miniProgramName - 小程序名称，如 "乐享大智"
 */
function openMiniProgram(miniProgramName) {
    log("开始打开小程序: " + miniProgramName);
    openApp("微信");

    safeClick(id("meb").findOnce(0), "搜索");

    safeInput(className("android.widget.EditText").findOnce(0), miniProgramName, "搜索框");

    safeClick(findTextByOcr("乐享大智")[1], "小程序入口", 10000);
}

function closeApp(appNameOrPackage) {
    log("开始关闭，应用名或包名: " + appNameOrPackage);
    let packageName = app.getPackageName(appNameOrPackage);
    if (!packageName) {
        // 如果仍然获取不到包名，可能参数本身就是包名
        // 判断一下是否包含 '.', 简单过滤以防误传
        if (appNameOrPackage.indexOf('.') > -1) {
            packageName = appNameOrPackage;
        } else {
            log("无法识别的应用名或包名: " + appNameOrPackage);
            return;
        }
    }

    // 打开该应用的系统设置页面
    app.openAppSetting(packageName);
    sleep(5000);

    safeClick(textMatches(/(结束运行|强行停止)/).findOnce(0), "结束运行");
    safeClick(textMatches(/(确定|强行停止)/).findOnce(0), "确定");
    log("关闭完成，应用名或包名: " + appNameOrPackage);
}

module.exports = {
    openApp,
    openMiniProgram,
    closeApp
};