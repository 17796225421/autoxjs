/**
 * ocr.js
 * -------------------
 * 基于 PaddleOCR 的文字识别工具
 * 可按照给定的文本进行模糊匹配，并返回可供 safeClick() 使用的“伪 UiObject”数组
 */

let { safeClick } = require("./clickUtils");

/**
 * 按照给定文本进行 OCR 搜索，并返回可用的伪 UiObject 列表
 * @param {string} targetText - 要搜索的文本
 * @returns {Array} 返回的数组元素可直接用于 safeClick()
 */
function findTextByOcr(targetText) {
    // 1. 请求截图权限
    if (!global.hasCapturePermission) {
        threads.start(function () {
            sleep(1000);
            safeClick(textMatches(/(立即开始|允许|确定)/).findOnce(0))
        });


        if (!requestScreenCapture()) {
            log("请求截图权限失败！");
            return [];
        }
        global.hasCapturePermission = true;
    }



    // 2. 截图
    let img = captureScreen();
    if (!img) {
        log("截图失败，无法进行 OCR 识别");
        return [];
    }

    // 3. 初始化 OCR
    let ocr = C.create({ models: "default" });

    // 4. 对截图进行识别
    let results = ocr.detect(img);

    // 释放资源
    ocr.release();
    img.recycle();

    if (!results || results.length === 0) {
        log("OCR 未识别到任何文本");
        return [];
    }

    // 5. 筛选包含 targetText 的结果
    let matched = results.filter(item => item.text.includes(targetText));
    if (matched.length === 0) {
        log(`未找到包含【${targetText}】的文本`);
        return [];
    }

    // 5.1 计算每个识别结果的中心点
    matched.forEach(item => {
        let center = {
            x: (item.bounds.left + item.bounds.right) / 2,
            y: (item.bounds.top + item.bounds.bottom) / 2
        };
        item.centerX = center.x;
        item.centerY = center.y;
    });

    // 5.2 先按 centerY 排序，如果 Y 相差在阈值以内，则按 centerX 排序
    const Y_SIMILAR_THRESHOLD = 10;
    matched.sort((a, b) => {
        let diffY = a.centerY - b.centerY;
        if (Math.abs(diffY) > Y_SIMILAR_THRESHOLD) {
            return diffY;
        } else {
            return a.centerX - b.centerX;
        }
    });

    // 6. 转换为可给 safeClick() 传参的数组，并打印日志
    let uiObjects = matched.map((item, index) => {
        let rect = item.bounds; // Rect 对象
        return {
            // 用于 safeClick 的关键方法
            bounds: () => rect,

            // 以下仅用于调试日志
            ocrText: item.text,
            centerX: item.centerX,
            centerY: item.centerY,
            rank: index + 1,
        };
    });

    uiObjects.forEach(obj => {
        log(`【OCR匹配】第${obj.rank}项: text=${obj.ocrText}, center=(${obj.centerX}, ${obj.centerY}), bounds=${obj.bounds()}`);
    });

    return uiObjects;
}

/**
 * @desc 获取当前屏幕上能够识别到的所有文本信息
 * @returns {Array<string>} 返回文本数组
 */
function getAllTextsOnScreen() {
    // 这里仅给出一个示例实现，实际可根据你使用的 OCR 方案调整
    // 例如 Auto.js 自带的 textRecognition() / 或者第三方接口
    // 或直接基于 bounds() 遍历并调用 text() / desc() / ...
    // 以下简单示意
    let result = [];
    let allNodes = depth(0).find(); // 递归查找整个屏幕UI节点
    if (allNodes) {
        for (let i = 0; i < allNodes.size(); i++) {
            let node = allNodes.get(i);
            let nodeText = node.text() || node.desc();
            if (nodeText && nodeText.trim().length > 0) {
                result.push(nodeText.trim());
            }
        }
    }

    // 也可以此处做去重或合并
    // result = Array.from(new Set(result));

    log("【OCR】识别到文本: ", JSON.stringify(result));
    return result;
}

module.exports = {
    findTextNodes,
    getAllTextsOnScreen
};
