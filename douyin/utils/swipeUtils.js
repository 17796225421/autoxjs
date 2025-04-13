/**
 * swipeUtils.js
 * --------------
 * 向上滑动相关的工具函数
 */

/**
 * @desc 向上滑动指定屏幕个数，可为小数
 *       例如传入 2.5 表示先依次滑动整屏 2 次，再滑动半屏
 * @param {number} screenCount - 要滑动的屏幕数量（可为小数）
 * @param {number} duration - 单次滑动时长(毫秒)
 * @param {number} [rest=500] - 每次滑动后停顿的时长(毫秒)
 */
function swipeUpScreens(screenCount, duration, rest) {
    rest = rest || 500;
    // 1. 拆分成 整数部分 + 小数部分
    let intPart = Math.floor(screenCount);
    let fracPart = screenCount - intPart;

    // 2. 先进行整数部分的整屏滑动
    for (let i = 0; i < intPart; i++) {
        swipeUpOneScreen(duration);
        sleep(rest);
    }

    // 3. 如果还有小数部分，则再滑动一次“部分屏幕”
    if (fracPart > 0) {
        swipeUpFraction(fracPart, duration);
        sleep(rest);
    }
}

/**
 * @desc 向上滑动一整屏幕
 * @param {number} duration - 滑动时长(毫秒)
 */
function swipeUpOneScreen(duration) {
    let w = device.width;
    let h = device.height;
    // 这里根据实际需求，选择合适的起止点
    let startX = w * 0.5;
    let startY = h * 0.8;
    let endX = startX;
    let endY = h * 0.2;
    swipe(startX, startY, endX, endY, duration);
}

/**
 * @desc 向上滑动部分屏幕，fraction=0.5表示滑动半屏
 * @param {number} fraction - 需要滑动的屏幕占比(0~1)
 * @param {number} duration - 滑动时长(毫秒)
 */
function swipeUpFraction(fraction, duration) {
    let w = device.width;
    let h = device.height;
    // 从屏幕靠下的位置 startY=0.9*h 开始, 
    // 往上滑 fraction * (可滑动高度)
    let startX = w * 0.5;
    let startY = h * 0.9;
    let endX = startX;
    // 这里让可滑动高度大约是 0.8*h，按需也可以直接用 fraction*h
    let endY = startY - fraction * (h * 0.8);

    swipe(startX, startY, endX, endY, duration);
}

/**
 * 动态滚动并收集满足过滤函数的所有不重复子节点
 * @param {UiObject} uiObject - 要滚动收集的容器控件
 * @param {function(UiObject): boolean} filterFn - 自定义过滤函数，决定是否收集某节点
 * @param {number} maxScrolls - 最大滚动次数
 * @param {string} direction - 滚动方向 ("up"|"down")
 * @returns {UiObject[]} - 满足条件的不重复直接子节点列表
 */
function collectScrollableChildren(uiObject, filterFn, maxScrolls, direction) {
    maxScrolls = maxScrolls || 5;
    direction = direction || "up";

    let collectedSet = new Set();
    let collectedNodes = [];
    let lastPageSnapshot = "";

    for (let scrollCount = 0; scrollCount <= maxScrolls; scrollCount++) {
        // 遍历uiObject的直接子节点
        let currentNodes = uiObject.children().filter(child => filterFn(child));

        log("【collectScrollableChildren】当前页的有效节点数量: " + currentNodes.length);

        currentNodes.forEach(node => {
            let nodeId = getNodeUniqueId(node);
            if (!collectedSet.has(nodeId)) {
                collectedSet.add(nodeId);
                collectedNodes.push(node);
            }
        });

        // 判断是否滚动到底（两次页面内容完全相同说明到底）
        let currentPageSnapshot = currentNodes.map(node => getNodeUniqueId(node)).join("-");
        if (currentPageSnapshot === lastPageSnapshot) {
            log("collectScrollableChildren: 滚动到底部，内容无变化，终止");
            break;
        } else {
            lastPageSnapshot = currentPageSnapshot;
        }

        if (scrollCount < maxScrolls) {
            scrollOneStep(uiObject, direction, 300);
        }
    }

    return collectedNodes;
}

/**
 * 【强化版】生成节点唯一标识符，精细化确保节点唯一性
 */
function getNodeUniqueId(node) {
    if (!node) return "null_node";

    let idStr = node.id() || "no_id";
    let textStr = node.text() || "no_text";
    let descStr = node.desc() || "no_desc";
    let className = node.className() || "no_class";
    let packageName = node.packageName() || "no_package";
    let drawingOrder = node.drawingOrder();
    let depth = node.depth();
    let indexInParent = node.indexInParent();

    let rect = node.boundsInParent();
    let x1 = rect.left;
    let y1 = rect.top;
    let x2 = rect.right;
    let y2 = rect.bottom;

    return `${packageName}|${className}|${idStr}|${textStr}|${descStr}|${drawingOrder}|${depth}|${indexInParent}|${x1},${y1},${x2},${y2}`;
}

/**
 * 单次滚动一个uiObject容器，高度为uiObject的自身高度。
 * @param {UiObject} uiObject - 可滚动的容器控件
 * @param {string} direction - 滚动方向 ("up"|"down")
 * @param {number} duration - 滚动时长（毫秒）
 */
function scrollOneStep(uiObject, direction, duration) {
    direction = direction || "up";
    duration = duration || 500;
    if (!uiObject || !uiObject.scrollable()) {
        log("scrollOneStep: 无效或不可滚动的uiObject");
        return false;
    }

    let bounds = uiObject.bounds();
    let startX = (bounds.left + bounds.right) / 2;
    let startY, endY;

    if (direction === "down") {
        startY = bounds.bottom - 10;
        endY = bounds.top + 10;
    } else if (direction === "up") {
        startY = bounds.top + 10;
        endY = bounds.bottom - 10;
    } else {
        log("scrollOneStep: 无效的direction参数");
        return false;
    }

    swipe(startX, startY, startX, endY, duration);
    sleep(500);  // 稍等内容加载
    return true;
}


module.exports = {
    swipeUpScreens,
    swipeUpFraction,
    collectScrollableChildren,
    scrollOneStep
};
