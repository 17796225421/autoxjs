/**
 * commonSelector.js
 * -----------------
 * 提供一些通用的选择器操作：
 *  - findAllVisible(selector): 返回该选择器下所有可见且有宽高的控件（不做超时等待）。
 */

/**
 * 从 selector.find() 中获取所有可见且有宽高的控件
 * @param {UiSelector} selector - 只能接收一个能直接 find() 的选择器对象，如 id("xxx")、desc("xxx") 等
 * @returns {UiObject[]} 可见的控件数组；若没找到或传入无效选择器，返回空数组
 */
function findAllVisible(selector) {
    let resultArr = [];

    // 如果传进来的不是能直接 .find() 的对象，则直接返回空
    if (!selector || typeof selector.find !== "function") {
        return resultArr;
    }

    // 拿到所有匹配的控件
    let allWidgets = selector.find();
    for (let i = 0; i < allWidgets.size(); i++) {
        let w = allWidgets.get(i);
        let b = w.bounds();
        // 过滤条件：可见 && 宽高 > 0
        if (w.visibleToUser() && b.width() > 0 && b.height() > 0) {
            resultArr.push(w);
        }
    }

    return resultArr;
}

module.exports = {
    findAllVisible,
};
