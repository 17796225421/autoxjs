/**
 * clickUtils.js
 * ---------------【 点击相关的工具函数 】----------------
 */

// 安全点击函数
function safeClick(uiSelector, desc, timeout) {
    timeout = timeout || 5000;
    var obj = uiSelector.findOne(timeout);
    if (!obj) {
        log("未找到控件：" + desc);
        return false;
    }
    for (var i = 0; i < 3; i++) {
        // 1. 若自身可点击，直接点击
        if (obj.clickable()) {
            if (obj.click()) {
                log("点击【" + desc + "】成功 (直接点击控件)");
                return true;
            }
        }
        // 2. 逐级向上查找可点击的父控件
        var parent = obj.parent();
        while (parent && !parent.clickable()) {
            parent = parent.parent();
        }
        if (parent) {
            if (parent.click()) {
                log("点击【" + desc + "】成功 (通过可点父控件)");
                return true;
            }
        }
        // 3. 若以上均失败，则进行坐标点击
        var bounds = obj.bounds();
        if (bounds) {
            click(bounds.centerX(), bounds.centerY());
            log("点击【" + desc + "】成功 (通过坐标点击)");
            return true;
        }
    }
    log("点击【" + desc + "】失败");
    return false;
}

// 导出
module.exports = {
    safeClick
};