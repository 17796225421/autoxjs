/**
 * ocr.js
 * -------------------
 * 基于 PaddleOCR 的文字识别工具
 * 可按照给定的文本进行模糊匹配，并返回可供 safeClick() 使用的“伪 UiObject”数组
 * 新增getAllTextsOnScreen，用于完整获取屏幕上的所有文字，便于llm决策分析引流用户（兼职+金银珠宝首饰生意）
 */

let { safeClick } = require("./clickUtils");

/**
 * 获取当前屏幕上的所有文字内容（便于后续LLM Agent决策分析）
 * @returns {string} 屏幕上所有文字拼接后的字符串
 */
function getAllTextsOnScreen() {
    if (!global.hasCapturePermission) {
        threads.start(function () {
            sleep(1000);
            safeClick(textMatches(/(立即开始|允许|确定)/).findOnce(0));
        });

        if (!requestScreenCapture()) {
            log("请求截图权限失败！");
            return "";
        }
        global.hasCapturePermission = true;
    }

    let img = captureScreen();
    if (!img) {
        log("截图失败，无法进行 OCR 识别");
        return "";
    }

    let ocr = $ocr.create({ models: "default" });
    let results = ocr.detect(img);

    ocr.release();
    img.recycle();

    if (!results || results.length === 0) {
        log("OCR未识别到任何文本");
        return "";
    }

    // 保持界面文字顺序，更利于LLM分析引流
    const Y_SIMILAR_THRESHOLD = 10;
    results.forEach(item => {
        item.centerX = (item.bounds.left + item.bounds.right) / 2;
        item.centerY = (item.bounds.top + item.bounds.bottom) / 2;
    });

    results.sort((a, b) => {
        let diffY = a.centerY - b.centerY;
        if (Math.abs(diffY) > Y_SIMILAR_THRESHOLD) {
            return diffY;
        } else {
            return a.centerX - b.centerX;
        }
    });

    // 拼接所有识别到的文本，以便后续决策分析（例如判断是否为兼职、金银珠宝首饰推广页面）
    let fullText = results.map(item => item.text).join("\n");

    log("【OCR识别完整文本】：" + fullText);
    return fullText;
}

/**
 * 按照给定文本进行 OCR 搜索，并返回可用的伪 UiObject 列表
 * @param {string} targetText - 要搜索的文本
 * @returns {Array} 返回的数组元素可直接用于 safeClick()
 */
function findTextByOcr(targetText) {
    if (!global.hasCapturePermission) {
        threads.start(function () {
            sleep(1000);
            safeClick(textMatches(/(立即开始|允许|确定)/).findOnce(0));
        });

        if (!requestScreenCapture()) {
            log("请求截图权限失败！");
            return [];
        }
        global.hasCapturePermission = true;
    }

    let img = captureScreen();
    if (!img) {
        log("截图失败，无法进行 OCR 识别");
        return [];
    }

    let ocr = $ocr.create({ models: "default" });
    let results = ocr.detect(img);

    ocr.release();
    img.recycle();

    if (!results || results.length === 0) {
        log("OCR 未识别到任何文本");
        return [];
    }

    let matched = results.filter(item => item.text.includes(targetText));
    if (matched.length === 0) {
        log(`未找到包含【${targetText}】的文本`);
        return [];
    }

    matched.forEach(item => {
        let center = {
            x: (item.bounds.left + item.bounds.right) / 2,
            y: (item.bounds.top + item.bounds.bottom) / 2
        };
        item.centerX = center.x;
        item.centerY = center.y;
    });

    const Y_SIMILAR_THRESHOLD = 10;
    matched.sort((a, b) => {
        let diffY = a.centerY - b.centerY;
        if (Math.abs(diffY) > Y_SIMILAR_THRESHOLD) {
            return diffY;
        } else {
            return a.centerX - b.centerX;
        }
    });

    let uiObjects = matched.map((item, index) => ({
        bounds: () => item.bounds,
        ocrText: item.text,
        centerX: item.centerX,
        centerY: item.centerY,
        rank: index + 1,
    }));

    uiObjects.forEach(obj => {
        log(`【OCR匹配】第${obj.rank}项: text=${obj.ocrText}, center=(${obj.centerX}, ${obj.centerY}), bounds=${obj.bounds()}`);
    });

    return uiObjects;
}

module.exports = {
    findTextByOcr,
    getAllTextsOnScreen
};
