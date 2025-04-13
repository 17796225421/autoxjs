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

/**
 * @desc 专门用于模拟人工真实观看短视频的上滑手势
 *       随机化滑动轨迹、速度、起止点，更加真实
 *       最大程度防止被平台识别为机器行为
 *
 * @param {number} [duration=随机(300~800)] - 滑动持续时间(毫秒)，模拟人手随机快慢
 * @param {number} [pause=随机(2000~6000)] - 滑动后停顿时间(毫秒)，模拟人类观看视频时长
 */
function swipeUpVideoNatural(duration, pause) {
    duration = duration || random(300, 800);
    pause = pause || random(2000, 6000);

    const w = device.width;
    const h = device.height;

    // 随机起始和结束坐标，模拟真实的上滑观看视频习惯
    let startX = random(w * 0.3, w * 0.7);
    let startY = random(h * 0.75, h * 0.85);
    let endX = startX + random(-50, 50); // 微小的横向位移
    let endY = random(h * 0.2, h * 0.35);

    // 执行曲线滑动，最大程度拟合真实用户手指滑动弧线
    curveSwipe(startX, startY, endX, endY, duration);

    sleep(pause);  // 模拟观看视频的随机时长
}

/**
 * @desc 执行曲线滑动（贝塞尔曲线模拟）
 *       通过中间随机控制点构造弧线轨迹，更像人工滑动
 *
 * @param {number} x1 - 起始X坐标
 * @param {number} y1 - 起始Y坐标
 * @param {number} x2 - 结束X坐标
 * @param {number} y2 - 结束Y坐标
 * @param {number} duration - 滑动持续时间
 */
function curveSwipe(x1, y1, x2, y2, duration) {
    const controlX = (x1 + x2) / 2 + random(-100, 100);
    const controlY = (y1 + y2) / 2 + random(-100, 100);

    const points = bezierCurve([x1, y1], [controlX, controlY], [x2, y2], 50);
    gesture(duration, points);
}

/**
 * @desc 贝塞尔曲线坐标生成函数
 * @param {number[]} start - 起点[x,y]
 * @param {number[]} control - 控制点[x,y]
 * @param {number[]} end - 终点[x,y]
 * @param {number} segments - 曲线分段数量
 * @returns {Array} 坐标点数组，用于gesture函数
 */
function bezierCurve(start, control, end, segments) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
        let t = i / segments;
        let x = Math.pow(1 - t, 2) * start[0] +
                2 * (1 - t) * t * control[0] +
                Math.pow(t, 2) * end[0];
        let y = Math.pow(1 - t, 2) * start[1] +
                2 * (1 - t) * t * control[1] +
                Math.pow(t, 2) * end[1];
        points.push([x, y]);
    }
    return points;
}


module.exports = {
    swipeUpScreens,
    swipeUpFraction,
    collectScrollableChildren,
    scrollOneStep,
    swipeUpVideoNatural
};
