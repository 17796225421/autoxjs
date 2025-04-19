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
 * @param {function(): UiObject} uiObjectFn - 可滚动的容器控件
 * @param {function(UiObject): boolean} filterFn - 自定义过滤函数，决定是否收集某节点
 * @param {number} maxScrolls - 最大滚动次数
 * @param {string} direction - 滚动方向 ("up"|"down")
 * @returns {UiObject[]} - 满足条件的不重复直接子节点列表
 */
function collectScrollableChildren(uiObjectFn, filterFn, maxScrolls, direction) {
    maxScrolls = maxScrolls || 5;
    direction = direction || "up";

    let collectedSet = new Set();
    let collectedNodes = [];
    let lastPageSnapshot = "";

    for (let scrollCount = 0; scrollCount <= maxScrolls; scrollCount++) {
        // 遍历uiObject的直接子节点
        let currentNodes = uiObjectFn().children().filter(child => filterFn(child));

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
            scrollOneStep(uiObjectFn(), direction, 3000);
            sleep(5000);
        }
    }

    return collectedNodes;
}

/**
 * 动态滚动并收集满足过滤函数的所有不重复子节点【Key版】
 * --------------------------------------------------------------------------------
 * 【改动要点】：
 *  1. 将原本的 maxScrolls 改为 maxCheckCount，用于限制“最大校验数量”；
 *  2. uiObjectFn().children() 出来后，先与已有的 Set 做去重，计算本次实际新增节点数量；
 *  3. 校验数量 += 新增节点数后，若超过 maxCheckCount 则提前结束滚动；
 *  4. 再遍历新增节点，调用 filterFn，过滤通过者 push 进 collectedNodes。
 *
 * @param {function(): UiObject} uiObjectFn - 可滚动容器的 getter
 * @param {function(UiObject): boolean} filterFn - 节点过滤函数
 * @param {number} [maxCheckCount=50] - 最大校验数量（建议传入 offset 表大小）
 * @param {string} [direction="up"] - 滚动方向 ("up"|"down")
 * @returns {Array<string|number>} 目标节点 Key 列表（按发现先后顺序）
 */
function collectScrollableChildrenKey(uiObjectFn, filterFn, maxCheckCount, direction) {
    // 默认参数
    maxCheckCount = maxCheckCount || 50;
    direction = direction || "up";

    // 用于去重、统计
    let collectedSet = new Set();          // 已收集节点的ID，用于去重
    let collectedNodes = [];              // 收集到的序列化Key
    let lastPageSnapshot = "";            // 用于检测是否翻到底
    let checkedCount = 0;                 // 已校验节点总数

    let scrollIndex = 0;  // 记录滚动次数，用于日志查看
    while (true) {
        let container = uiObjectFn();
        if (!container) {
            log("【collectScrollableChildrenKey】uiObjectFn() 返回空，终止");
            break;
        }

        // =========== 1. 获取当前页所有子节点 ===========
        let childrenNodes = container.children();
        if (!childrenNodes || childrenNodes.length === 0) {
            log("【collectScrollableChildrenKey】当前页无子节点，终止");
            break;
        }

        // =========== 2. 与已收集做去重，得到“本次新增节点” ===========
        let newNodes = [];
        for (let i = 0; i < childrenNodes.length; i++) {
            let child = childrenNodes[i];
            let childId = getNodeUniqueId(child);
            if (!collectedSet.has(childId)) {
                newNodes.push(child);
                collectedSet.add(childId);
            }
        }

        // 先统计本次“新增的节点数”
        let addedCount = newNodes.length;
        // 校验数量累加
        checkedCount += addedCount;
        log(`【collectScrollableChildrenKey】第${scrollIndex}次滚动/翻页，本次新增节点: ${addedCount}，累计校验数量: ${checkedCount}`);

        // =========== 3. 如果校验数量超限，则直接退出 ===========
        if (checkedCount > maxCheckCount) {
            log(`【collectScrollableChildrenKey】累计校验数量(${checkedCount})已超最大限制(${maxCheckCount})，提前结束`);
            // 这里可以 break，也可以在 break 前把最后一次的过滤结果加进去
            // 下方第4步还要过滤再收集，所以继续往下走再 break
        }

        // =========== 4. 对“本次新增节点”逐个调用 filterFn，满足则加入结果 ===========
        for (let node of newNodes) {
            if (filterFn(node)) {
                collectedNodes.push(serializeNodeForOffset(node));
            }
        }

        // =========== 5. 判断本次页面快照与上一页是否相同，若相同说明到底了 ===========
        let currentPageSnapshot = newNodes.map(node => getNodeUniqueId(node)).join("-");
        if (currentPageSnapshot === lastPageSnapshot) {
            log("【collectScrollableChildrenKey】内容无变化，可能已经滚到底，终止滚动");
            break;
        }
        lastPageSnapshot = currentPageSnapshot;

        // =========== 6. 如果已超过最大限制，也无须再滚动，终止循环 ===========
        if (checkedCount > maxCheckCount) {
            log("【collectScrollableChildrenKey】已达最大校验数量，无需继续滚动");
            break;
        }

        // =========== 7. 否则继续滚动一页，进入下一个循环 ===========
        scrollIndex++;
        scrollOneStep(container, direction, 3000);
        sleep(5000);  // 等待加载内容
    }

    log(`【collectScrollableChildrenKey】收集结束，共得到符合条件的节点Key数量: ${collectedNodes.length}`);
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
    duration = duration || 2000;
    if (!uiObject || !uiObject.scrollable()) {
        log("scrollOneStep: 无效或不可滚动的uiObject");
        return false;
    }

    let bounds = uiObject.bounds();
    let startX = (bounds.left + bounds.right) / 2;
    let startY, endY;

    if (direction === "up") {
        startY = bounds.bottom - 10;
        endY = bounds.top + 10;
    } else if (direction === "down") {
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


/**
 * @desc 【核心函数1】构建 offset 表
 *       用于记录每个“直接子节点”的偏移量，以便后续定位。
 *       对于“下滑节点”（如聊天框），最后一个直接子节点 offset=0，向上依次为负；
 *       对于“上滑节点”（如评论区），第一个直接子节点 offset=0，向下依次为正。
 *
 * @param {function(): UiObject} uiObjectFn - 返回可滚动容器的函数
 * @param {number} capacity - 需要收集的最大子节点数量（offset表容量）
 * @param {string} [direction="up"] - 滚动方向，可选"up"|"down"
 * @returns {Object} offsetTable，结构示例：
 *   {
 *       "12345678": 0,       // key=节点序列化哈希, value=相对偏移量
 *       "87654321": 120,     // 正数/负数取决于direction
 *       ...
 *   }
 */
function buildOffsetTable(uiObjectFn, capacity, direction) {
    direction = direction || "up";
    capacity = capacity || 50;
    const maxScrollTimes = 20;

    let offsetTable = {};      // { key -> offset }
    let scrollCount = 0;
    let oldCount = 0;

    // ============ 0. 锁定 zeroNode =============
    let container = uiObjectFn();
    if (!container) {
        log("【buildOffsetTable】uiObjectFn() 返回空，终止");
        return offsetTable;
    }

    let zeroNode;
    if (direction === "up") {
        zeroNode = container.child(0);
    } else { // "down"
        let childCnt = container.childCount();
        zeroNode = childCnt > 0 ? container.child(childCnt - 1) : null;
    }

    if (!zeroNode) {
        log("【buildOffsetTable】未找到首屏子节点，终止");
        return offsetTable;
    }

    const zeroKey = serializeNodeForOffset(zeroNode);
    offsetTable[zeroKey] = 0;

    // 用于累计 offset 的临时变量
    let lastOffsetUp = 0;
    let lastOffsetDown = 0;
    let lastHeightUp = getNodeHeight(zeroNode);
    let lastHeightDown = getNodeHeight(zeroNode);

    // ============ 1. 滚动收集 =============
    while (Object.keys(offsetTable).length < capacity && scrollCount < maxScrollTimes) {
        container = uiObjectFn();
        if (!container) break;

        let children = container.children();
        if (direction === "down") {
            children = children.reverse(); // 让 bottom -> top
        }

        for (let i = 0; i < children.length; i++) {
            let node = children[i];
            let key = serializeNodeForOffset(node);
            if (offsetTable.hasOwnProperty(key)) continue; // 去重

            if (direction === "up") {
                // 新节点位于 zeroNode 之下
                let offset = lastOffsetUp + lastHeightUp;
                offsetTable[key] = offset;
                lastOffsetUp = offset;
                lastHeightUp = getNodeHeight(node);
            } else {
                // "down"，新节点位于 zeroNode 之上
                let offset = lastOffsetDown - lastHeightDown;
                offsetTable[key] = offset;
                lastOffsetDown = offset;
                lastHeightDown = getNodeHeight(node);
            }

            if (Object.keys(offsetTable).length >= capacity) break;
        }

        const total = Object.keys(offsetTable).length;
        if (total === oldCount) {
            log("【buildOffsetTable】本轮无新增节点，提前停止");
            break;
        }
        oldCount = total;

        if (scrollCount < maxScrollTimes) {
            scrollOneStep(container, direction, 3000);
            sleep(3000);
        }
        scrollCount++;
    }

    // ============ 1.1 [改动] 退出循环后，再收集当前屏幕 =============
    //    原因：避免最后一次 scroll 后没有再收集到屏幕上的节点，从而漏掉某些目标节点。
    container = uiObjectFn();
    if (container) {
        let children = container.children();
        if (direction === "down") {
            children = children.reverse();
        }

        for (let i = 0; i < children.length; i++) {
            let node = children[i];
            let key = serializeNodeForOffset(node);
            // 跳过已收集节点
            if (offsetTable.hasOwnProperty(key)) continue;

            if (direction === "up") {
                let offset = lastOffsetUp + lastHeightUp;
                offsetTable[key] = offset;
                lastOffsetUp = offset;
                lastHeightUp = getNodeHeight(node);
            } else {
                let offset = lastOffsetDown - lastHeightDown;
                offsetTable[key] = offset;
                lastOffsetDown = offset;
                lastHeightDown = getNodeHeight(node);
            }
        }
    }

    log(`【buildOffsetTable】完成，已收集 ${Object.keys(offsetTable).length} 个节点`);

    // ============ 2. 将 zeroNode 定位回首屏 =============
    locateTargetObject(zeroKey, uiObjectFn, offsetTable, direction);

    return offsetTable;
}

/**
 * @desc 【核心函数2】【改动】 现在第一个入参是 targetKey
 *
 * @param {number|string} targetKey   - 目标节点的序列化 key
 * @param {function(): UiObject} uiObjectFn - 返回可滚动容器的函数
 * @param {Object} offsetTable        - buildOffsetTable() 返回的 offset 表
 * @param {string} [direction="up"]   - 可滚动方向
 */
function locateTargetObject(targetKey, uiObjectFn, offsetTable, direction) {
    direction = direction || "up";

    if (!offsetTable.hasOwnProperty(targetKey)) {
        log("【locateTargetObject】目标节点key不在offset表中，无法定位:" + targetKey);
        return;
    }

    let container = uiObjectFn();
    if (!container) {
        log("【locateTargetObject】容器为空，无法定位");
        return;
    }

    // ---- 取屏幕上容器的“第一个直接子节点” ----
    let firstChild = container.child(0);
    if (!firstChild) {
        log("【locateTargetObject】容器无子节点，无法定位");
        return;
    }

    let firstKey = serializeNodeForOffset(firstChild);
    if (!offsetTable.hasOwnProperty(firstKey)) {
        log("【locateTargetObject】第一个子节点不在offset表中，无法定位" + firstKey);
        return;
    }

    // ---- 计算 offset 差 ----
    const offsetA = offsetTable[targetKey];
    const offsetB = offsetTable[firstKey];
    const delta = offsetA - offsetB;   // 正数=目标在下方，负数=目标在上方
    log(`【locateTargetObject】delta=${delta}`);

    if (Math.abs(delta) < 1) {
        log("目标节点已在首屏，无需滚动");
        return;
    }

    // 👉 一次性滚屏
    const success = swipeInScrollableNode(container, -delta, 5000, 3000);
    log(`【locateTargetObject】一次性滚动完成，success=${success}`);

    log("【locateTargetObject】定位结束");
}


/**
 * @desc 【核心函数3】节点序列化，用于给“可滚动节点的直接子节点”做Key
 *       - 把自身及所有子孙节点的desc/text 拼接，做成字符串
 *       - 再通过哈希转为整数
 * @param {UiObject} node
 * @returns {number} 返回一个整数hash
 */
function serializeNodeForOffset(node) {
    let collected = gatherAllTextAndDesc(node);
    // 将其拼成一个大字符串
    let bigStr = collected.join("|");
    return bigStr;
    // 转为哈希整数
    let hashVal = javaStringHashCode(bigStr);
    return hashVal;
}

/**
 * @desc 深度遍历节点，收集所有 text、desc
 * @param {UiObject} node
 * @returns {string[]} 
 */
function gatherAllTextAndDesc(node) {
    let results = [];
    if (!node) return results;

    let txt = (node.text() || "").trim();
    let dsc = (node.desc() || "").trim();
    if (txt) results.push("T:" + txt);
    if (dsc) results.push("D:" + dsc);

    // 再递归子节点
    let childCount = node.childCount() || 0;
    for (let i = 0; i < childCount; i++) {
        let child = node.child(i);
        results = results.concat(gatherAllTextAndDesc(child));
    }
    return results;
}

/**
 * @desc 简单模拟 Java String.hashCode() 的哈希函数
 *       让文本转为整数Key，避免直接拼接纯文本
 * @param {string} str
 * @returns {number} 
 */
function javaStringHashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
        // JS中需要手动维持32位整数范围
        hash |= 0;
    }
    return hash;
}

/**
 * @desc 在可滚动容器内一次性滚动指定距离
 *       Δ < 0 → 向上滚动（手指上滑）；Δ > 0 → 向下滚动（手指下滑）
 *       若 |Δ| > 容器高度，则自动拆分为多段，每段 ≤ 0.9 * height
 *
 * @param {UiObject} uiObject   可滚动容器
 * @param {number}   deltaPx    需要滚动的「像素」距离（允许负值）
 * @param {number}   [duration=500] 每段滑动时长 (ms)
 * @param {number}   [rest=300]  段与段之间停顿 (ms)
 * @returns {boolean} 成功执行返回 true
 */
function swipeInScrollableNode(uiObject, deltaPx, duration, rest) {
    if (!uiObject || !uiObject.scrollable()) {
        log("swipeInScrollableNode: 无效或不可滚动的 uiObject");
        return false;
    }
    deltaPx = Math.trunc(deltaPx);
    if (deltaPx === 0) return true;

    duration = duration || 500;
    rest     = rest     || 300;

    const b        = uiObject.bounds();
    const height   = b.height();
    const maxStep  = Math.floor(height * 0.88);   // 每段 ≤88% 容器高
    const margin   = 12;                          // 上下预留的缓冲

    let remain = deltaPx;
    const sign = remain > 0 ? 1 : -1;
    let idx    = 0;

    while (sign * remain > 0) {
        /* -------- 1) 计算本段 step（理想值） -------- */
        let step = sign * Math.min(Math.abs(remain), maxStep);

        /* -------- 2) 计算起止点，必要时再“二次校正” step -------- */
        const startX = random(b.left + 8, b.right - 8);
        let   startY, endY, maxMov;

        if (step > 0) {                           // 👉 向下
            startY = b.top + margin;
            maxMov = b.bottom - margin - startY;  // 还能真正下滑的极限
            if (Math.abs(step) > maxMov) step =  maxMov;  // 再校正
            endY   = startY + step;
        } else {                                  // 👉 向上
            startY = b.bottom - margin;
            maxMov = startY - (b.top + margin);   // 还能真正上滑的极限
            if (Math.abs(step) > maxMov) step = -maxMov;  // 再校正
            endY   = startY + step;               // step 为负
        }

        /* -------- 3) 曲线滑动 -------- */
        curveSwipe(startX, startY, startX, endY, duration);
        sleep(rest);

        /* -------- 4) 用“实际位移”更新 remain -------- */
        const actualStep = endY - startY;         // 向上负，向下正
        remain -= actualStep;

        log(`【swipeInScrollableNode】#${idx}  actual=${actualStep}  remain=${remain}`);
        idx++;

        // 收敛：像素很小或迭代过多就退出
        if (Math.abs(remain) < 3 || idx > 15) break;
    }
    return true;
}

/**
 * @desc 获取节点的高度(在Parent坐标系下)
 * @param {UiObject} node
 * @returns {number}
 */
function getNodeHeight(node) {
    if (!node) return 0;
    let rect = node.boundsInParent();
    return rect.bottom - rect.top;
}



// ============== 导出模块函数 ==============
module.exports = {
    swipeUpScreens,
    swipeUpFraction,
    collectScrollableChildren,
    collectScrollableChildrenKey,
    scrollOneStep,
    swipeUpVideoNatural,
    buildOffsetTable,
    locateTargetObject,
    serializeNodeForOffset
};