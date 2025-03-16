/**
 * app.js
 */
let { safeClick } = require("./clickUtils.js");


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
    sleep(2000); // 视实际情况等待应用启动
    log("打开应用完成: " + appNameOrPackage);
}

/**
 * 打开小程序
 * @param {string} miniProgramName - 小程序名称，如 "乐享大智"
 */
function openMiniProgram(miniProgramName) {
    log("开始打开小程序: " + miniProgramName);
    // 先打开微信
    openApp("微信");

    // 视实际情况，等待微信加载完成
    sleep(3000);

    safeClick(id("meb"), "搜索");

    // 示例逻辑：点击微信首页的搜索入口
    // 以下控件搜索仅为示例，需要根据实际微信版本来修改
    let searchBtn = text("搜索").findOne(5000); 
    if (searchBtn) {
        safeClick(searchBtn, "搜索按钮");
        sleep(1500);
    } else {
        log("未找到搜索按钮");
        return;
    }

    // 输入框中输入小程序名称
    setText(miniProgramName);
    sleep(1500);

    // 点击键盘的“搜索”或回车
    // 一般可以通过 imeAction 或者自己点击软键盘上的搜索按钮
    // 如果你的 Auto.js 环境有类似的 API，可以用：
    // KKKK = text("搜索").findOne(...
    // 这里只是举例：
    pressKey("search"); // 假设这样可以触发搜索，或者自己手动点击
    sleep(2500);

    // 等搜索结果
    let miniProgramEntry = text(miniProgramName).findOne(5000);
    if (miniProgramEntry) {
        safeClick(miniProgramEntry, "小程序列表项");
        sleep(3000);
        log("已进入小程序: " + miniProgramName);
    } else {
        log("搜索结果内未找到小程序: " + miniProgramName);
    }
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

    safeClick(desc("结束运行"), "结束运行");
    safeClick(text("确定"), "确定");
    log("关闭完成，应用名或包名: " + appNameOrPackage);
}

module.exports = {
    openApp,
    openMiniProgram,
    closeApp
};