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
 * 【强化版】动态滚动 + 收集符合条件的直接子节点
 * -----------------------------------------------
 * 1) 终止条件（满足任一即刻退出）
 *    A. stopFn(child) === true                 // 用户自定义：遇到目标即可停
 *    B. collectedNodes.length >= capacity      // 收集已满
 *    C. 本页快照 === 上页快照                  // 内容无变化，说明到底
 *
 * 2) 参数说明
 *    @param {function(): UiObject} uiObjectFn  - 返回可滚动容器
 *    @param {function(UiObject): boolean} filterFn - 过滤函数：决定是否保存该节点
 *    @param {function(UiObject): boolean} [stopFn] - 停止函数：遇到返回 true 即刻终止
 *    @param {number}   [capacity=20]           - 最大收集数量
 *    @param {string}   [direction="up"]        - 滚动方向
 * @returns {UiObject[]} - 满足条件的不重复直接子节点列表
 *
 * 3) 应用场景
 *    - 自动化兼职项目“养号+引流”批量收集 UI 入口
 *    - 金银珠宝首饰类 App 自动化浏览、筛选、留资
 *    - 大模型 Agent + AutoJS 多号多 App 运营的核心滚动感知能力
 */
function collectScrollableChildren(uiObjectFn,
    filterFn,
    stopFn,
    capacity,
    direction) {

    /* ---------- 默认值 ---------- */
    capacity = capacity || 20;
    direction = direction || "up";
    stopFn = stopFn || (() => false);

    /* ---------- 状态变量 ---------- */
    const collectedSet = new Set();   // 去重
    const collectedNodes = [];          // 结果
    let lastSnapshot = "";          // 用于检测“到底”
    let pageIndex = 0;           // 仅做日志

    /* ---------- 主循环 ---------- */
    while (true) {

        /* 1) 取容器 & 子节点 */
        let children = uiObjectFn().children();

        /* 2) 遍历直接子节点 */
        let snapshotArr = [];   // 本页快照（无重复）
        for (let i = 0; i < children.length; i++) {
            let node = children[i];
            let nodeId = getNodeUniqueId(node);

            snapshotArr.push(nodeId);           // 构建快照

            /* --- 去重 --- */
            if (collectedSet.has(nodeId)) continue;
            collectedSet.add(nodeId);

            /* --- stopFn 判停 --- */
            if (stopFn(node)) {
                log("【collect2.0】stopFn 触发，提前结束");
                return collectedNodes;          // 已收集的直接返回
            }

            /* --- filterFn 判收 --- */
            if (filterFn(node)) {
                collectedNodes.push(node);
                if (collectedNodes.length >= capacity) {
                    log("【collect2.0】达到 capacity，上限收满");
                    return collectedNodes;
                }
            }
        }

        /* 3) 底部判定 —— 快照比对 */
        let currSnapshot = snapshotArr.join("-");
        if (currSnapshot === lastSnapshot) {
            log("【collect2.0】内容无变化，可能滚到底");
            break;
        }
        lastSnapshot = currSnapshot;

        /* 4) 继续滚动 */
        pageIndex++;
        scrollOneStep(uiObjectFn(), direction, 3000);
        sleep(4000);   // 视平台加载速度而定
    }

    /* ---------- 结束 ---------- */
    log(`【collectScrollableChildren】完毕，共收集 ${collectedNodes.length} / ${capacity}`);
    return collectedNodes;
}


/**
 * 【强化版】动态滚动 + 收集符合条件的直接子节点 Key
 * -----------------------------------------------
 * 1) 终止条件（满足任一即刻退出）
 *    A. stopFn(child) === true                 // 用户自定义：遇到目标即可停
 *    B. collectedNodes.length >= capacity      // 收集已满
 *    C. 本页快照 === 上页快照                  // 内容无变化，说明到底
 *
 * 2) 参数说明
 *    @param {function(): UiObject} uiObjectFn  - 返回可滚动容器
 *    @param {function(UiObject): boolean} filterFn - 过滤函数：决定是否保存该节点
 *    @param {function(UiObject): boolean} [stopFn] - 停止函数：遇到返回 true 即刻终止
 *    @param {number}   [capacity=20]           - 最大收集数量
 *    @param {string}   [direction="up"]        - 滚动方向
 *    @returns {Array<string|number>}           - 符合条件的节点 Key 列表
 *
 * 3) 应用场景
 *    - 自动化兼职项目“养号+引流”批量收集 UI 入口
 *    - 金银珠宝首饰类 App 自动化浏览、筛选、留资
 *    - 大模型 Agent + AutoJS 多号多 App 运营的核心滚动感知能力
 */
function collectScrollableChildrenKey(uiObjectFn,
    filterFn,
    stopFn,
    capacity,
    direction) {

    /* ---------- 默认值 ---------- */
    capacity = capacity || 20;
    direction = direction || "up";
    stopFn = stopFn || (() => false);

    /* ---------- 状态变量 ---------- */
    const collectedSet = new Set();   // 去重
    const collectedNodes = [];          // 结果
    let lastSnapshot = "";          // 用于检测“到底”
    let pageIndex = 0;           // 仅做日志

    /* ---------- 主循环 ---------- */
    while (true) {

        /* 1) 取容器 & 子节点 */
        let children = uiObjectFn().children();

        /* 2) 遍历直接子节点 */
        let snapshotArr = [];   // 本页快照（无重复）
        for (let i = 0; i < children.length; i++) {
            let node = children[i];
            let nodeId = getNodeUniqueId(node);

            snapshotArr.push(nodeId);           // 构建快照

            /* --- 去重 --- */
            if (collectedSet.has(nodeId)) continue;
            collectedSet.add(nodeId);

            /* --- stopFn 判停 --- */
            if (stopFn(node)) {
                log("【collect2.0】stopFn 触发，提前结束");
                return collectedNodes;          // 已收集的直接返回
            }

            /* --- filterFn 判收 --- */
            if (filterFn(node)) {
                collectedNodes.push(serializeNodeForOffset(node));
                if (collectedNodes.length >= capacity) {
                    log("【collect2.0】达到 capacity，上限收满");
                    return collectedNodes;
                }
            }
        }

        /* 3) 底部判定 —— 快照比对 */
        let currSnapshot = snapshotArr.join("-");
        if (currSnapshot === lastSnapshot) {
            log("【collect2.0】内容无变化，可能滚到底");
            break;
        }
        lastSnapshot = currSnapshot;

        /* 4) 继续滚动 */
        pageIndex++;
        scrollOneStep(uiObjectFn(), direction, 3000);
        sleep(4000);   // 视平台加载速度而定
    }

    /* ---------- 结束 ---------- */
    log(`【collectScrollableChildrenKey】完毕，共收集 ${collectedNodes.length} / ${capacity}`);
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
 * 单次滚动一个 uiObject 容器，分两次“半程”滚动，避免越过边界。
 * @param {UiObject} uiObject - 可滚动的容器控件
 * @param {string} direction - 滚动方向 ("up"|"down")
 * @param {number} duration - 单次滚动时长（毫秒）
 */
function scrollOneStep(uiObject, direction, duration) {
    direction = direction || "up";
    duration = duration || 2000;
    if (!uiObject || !uiObject.scrollable()) {
        log("scrollOneStep: 无效或不可滚动的 uiObject");
        return false;
    }

    let bounds = uiObject.bounds();
    let containerHeight = bounds.height();
    // 例如：把一次大滚动拆成两次“分步滚动”（可自行调整为 0.3 ~ 0.5）
    let halfDistance = Math.floor(containerHeight * 0.4);

    // 根据滚动方向设置符号
    if (direction === "up") {
        halfDistance = -halfDistance;
    } else if (direction !== "down") {
        log("scrollOneStep: 无效的 direction 参数，只能是 'up' 或 'down'");
        return false;
    }

    // 第 1 段滚动
    swipeInScrollableNode(uiObject, halfDistance, duration, 500);
    // 第 2 段滚动
    swipeInScrollableNode(uiObject, halfDistance, duration, 500);

    // 每滚动完成一整步，可适当等待后台数据加载
    sleep(500);

    // 返回 true 表示执行完成
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
 * @desc 【强化版】曲线滑动（多段随机中点 + 适度抖动 + 避免过小位移）
 *       同时“第一阶段”并入一次性手势，避免分两次 gesture 分开滚动。
 *
 * @param {number} x1        - 起始X坐标
 * @param {number} y1        - 起始Y坐标
 * @param {number} x2        - 结束X坐标
 * @param {number} y2        - 结束Y坐标
 * @param {number} duration  - 滑动总时长(毫秒)，若传入0或不传则随机
 */
function curveSwipe(x1, y1, x2, y2, duration) {
    // =========== 0) 先计算第一阶段距离，避免被识别为长按 ===========
    let stage1Dist = random(100, 200);   // 第一阶段移动距离
    let stage1Time = random(500, 1000);  // 原本用来做第一段 gesture 的时长

    let dxTotal = x2 - x1;
    let dyTotal = y2 - y1;
    let totalDist = Math.sqrt(dxTotal * dxTotal + dyTotal * dyTotal);

    // 准备一个“最终的全部插值点”数组 (第一阶段 + 第二阶段)
    let allPoints = [];

    // =========== 1) 若总距离足够大，则先构造“第一阶段”插值点 ===========
    if (totalDist > stage1Dist) {
        let ratio1 = stage1Dist / totalDist;
        let x1_stage1 = x1 + dxTotal * ratio1;
        let y1_stage1 = y1 + dyTotal * ratio1;

        // 【改动1】不再单独 gesture()，而是把这段两点加入 allPoints
        // 这里仅简单地放2个点，也可以用 bezierCurve() 生成更多插值。
        // 并注意后面真正 gesture() 时，会对插值再平滑。
        let stage1Points = [
            [x1, y1],
            [x1_stage1, y1_stage1],
        ];
        allPoints = allPoints.concat(stage1Points);

        // 更新起点为“第一阶段结束”位置
        x1 = x1_stage1;
        y1 = y1_stage1;

        // 重新计算剩余距离
        dxTotal = x2 - x1;
        dyTotal = y2 - y1;
        totalDist = Math.sqrt(dxTotal * dxTotal + dyTotal * dyTotal);
    }

    // =========== 2) 保证最小移动距离，避免滑动过短 ===========
    let minDist = 120;
    if (totalDist < minDist) {
        let offset = minDist - totalDist;
        let angle = Math.atan2(dyTotal, dxTotal);
        let signRand = (random(0, 1) * 2 - 1); // +1或-1
        x2 = x2 + offset * Math.cos(angle) * signRand;
        y2 = y2 + offset * Math.sin(angle) * signRand;
        dxTotal = x2 - x1;
        dyTotal = y2 - y1;
        totalDist = Math.sqrt(dxTotal * dxTotal + dyTotal * dyTotal);
    }

    // =========== 3) 若未指定或传入duration=0，则随机一个合理时长 ===========
    if (!duration || duration <= 0) {
        let base = Math.floor(totalDist * 1.2);
        duration = random(base, base + 600);
        duration = Math.max(400, duration);
    } else {
        let jitterRatio = random(15, 25) / 100; // ±(15%~25%)随机抖动
        let jitter = Math.floor(duration * jitterRatio);
        duration = duration + random(-jitter, jitter);
        if (duration < 300) duration = 300;
    }

    // =========== 4) 多段随机中点(二次贝塞尔)构造剩余弧形轨迹 ===========
    let pointCountPerSegment = 15;   // 每段插值点数量
    let segmentCount = random(2, 4); // 分段数量(2~4随机)

    let currStartX = x1;
    let currStartY = y1;
    for (let s = 0; s < segmentCount; s++) {
        let ratio = (s + 1) / segmentCount;
        let endX = (s === segmentCount - 1)
            ? x2
            : (x1 + dxTotal * ratio + random(-50, 50));
        let endY = (s === segmentCount - 1)
            ? y2
            : (y1 + dyTotal * ratio + random(-50, 50));

        let ctrlX = (currStartX + endX) / 2 + random(-100, 100);
        let ctrlY = (currStartY + endY) / 2 + random(-100, 100);

        let segmentPoints = bezierCurve(
            [currStartX, currStartY],
            [ctrlX, ctrlY],
            [endX, endY],
            pointCountPerSegment
        );

        // 拼接时，避免前后段重复第一个点
        if (s > 0 && segmentPoints.length > 0) {
            segmentPoints.shift();
        }

        allPoints = allPoints.concat(segmentPoints);
        currStartX = endX;
        currStartY = endY;
    }

    // =========== 【新增】5) 在真正 gesture 前，对 allPoints 坐标做兜底修正 =============
    let w = device.width;
    let h = device.height;
    for (let i = 0; i < allPoints.length; i++) {
        let px = allPoints[i][0];
        let py = allPoints[i][1];
        // 确保 x,y 不低于 0，也不超过屏幕最大范围
        px = Math.max(0, Math.min(px, w - 1));
        py = Math.max(0, Math.min(py, h - 1));
        allPoints[i] = [px, py];
    }

    // =========== 6) 一次性手势执行整段滑动 ===========
    gesture(duration, allPoints);
}


/**
 * @desc 生成二次贝塞尔曲线插值点
 * @param {number[]} start   - [x0, y0]
 * @param {number[]} control - [cx, cy]   (中间控制点)
 * @param {number[]} end     - [x2, y2]
 * @param {number}   segments
 * @returns {Array<Array<number>>} 形如[[x,y], [x,y], ...]
 */
function bezierCurve(start, control, end, segments) {
    let points = [];
    for (let i = 0; i <= segments; i++) {
        let t = i / segments;
        let x = (1 - t) * (1 - t) * start[0]
            + 2 * (1 - t) * t * control[0]
            + t * t * end[0];
        let y = (1 - t) * (1 - t) * start[1]
            + 2 * (1 - t) * t * control[1]
            + t * t * end[1];
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
            log(node);
            log(key);
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

        let total = Object.keys(offsetTable).length;
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

    // ============ 1.1 [改动] 退出循环后，再额外收集：当前屏幕 + 连续滚动的后2屏 =============
    //    原因：避免最后一次 scroll 后没有再收集到屏幕上的节点，从而漏掉某些目标节点。
    //    希望一次多收集一些内容，以便应对可能的延迟加载或异步刷新。

    function collectCurrentScreenNodes(container) {
        if (!container) return;
        let children = container.children() || [];
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

    // 第1次：收集当前屏幕
    container = uiObjectFn();
    collectCurrentScreenNodes(container);

    // 第2次：滚动一屏后再收集
    scrollOneStep(container, direction, 3000);
    sleep(3000);
    container = uiObjectFn();
    collectCurrentScreenNodes(container);

    // 第3次：再滚动一屏后再收集
    scrollOneStep(container, direction, 3000);
    sleep(3000);
    container = uiObjectFn();
    collectCurrentScreenNodes(container);

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

    let delta = offsetA - offsetB;   // 正数=目标在下方，负数=目标在上方

    // firstChild可能只有少部分在屏幕内
    let width = firstChild.boundsInParent().bottom - firstChild.boundsInParent().top;
    let widthLook = firstChild.bounds().bottom - firstChild.bounds().top;
    delta -= (width - widthLook);

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
 * @desc 【核心函数3】【改】节点序列化 —— 去除所有阿拉伯数字
 *       设计要点：
 *       1) gatherAllTextAndDesc() 只做递归采集；所有规整化放在此函数完成，
 *          避免在递归里多次重复执行正则。
 *       2) ·\d· 与 ·\uFF10‑\uFF19· 同时剔除，兼容半角 / 全角。
 *       3) 若数字剥离后文本极短（<3 字符），追加 “类名 + bounds” 保底。
 *
 * @param  {UiObject} node
 */
function serializeNodeForOffset(node) {
    if (!node) return 0;

    /* ---------- 1. 收集纯文本 ---------- */
    let collectedArr = gatherAllTextAndDesc(node);      // ["T:09:30", "D:点击抢购" ...]
    let bigStr = collectedArr.join("|");

    return bigStr;
    /* ---------- 2. 过滤阿拉伯数字 ---------- */
    // 同时去掉半角 0‑9 与全角 ０‑９；保留其它符号/中文/字母
    let noDigitStr = bigStr.replace(/[\d\uFF10-\uFF19]/g, "");

    /* ---------- 3. 唯一性加盐（必要时） ---------- */
    // 剥离数字后有可能只剩极短相同前缀，例如 “T:” “D:”；此时追加控件上下文
    if (noDigitStr.length < 3) {
        let cls = node.className() || "no_cls";
        let b = node.boundsInParent();
        let bbox = `${b.left},${b.top},${b.right},${b.bottom}`;
        noDigitStr = `${noDigitStr}|${cls}|${bbox}`;
    }

    return noDigitStr;
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
    rest = rest || 300;

    const b = uiObject.bounds();
    const height = b.height();
    const maxStep = Math.floor(height * 0.88);   // 每段 ≤88% 容器高
    const margin = 100;                          // 上下预留的缓冲

    let remain = deltaPx;
    const sign = remain > 0 ? 1 : -1;
    let idx = 0;

    while (sign * remain > 0) {
        /* -------- 1) 计算本段 step（理想值） -------- */
        let step = sign * Math.min(Math.abs(remain), maxStep);

        /* -------- 2) 计算起止点，必要时再“二次校正” step -------- */
        const startX = random(b.left + 8, b.right - 8);
        let startY, endY, maxMov;

        if (step > 0) {                           // 👉 向下
            startY = b.top + margin;
            maxMov = b.bottom - margin - startY;  // 还能真正下滑的极限
            if (Math.abs(step) > maxMov) step = maxMov;  // 再校正
            endY = startY + step;
        } else {                                  // 👉 向上
            startY = b.bottom - margin;
            maxMov = startY - (b.top + margin);   // 还能真正上滑的极限
            if (Math.abs(step) > maxMov) step = -maxMov;  // 再校正
            endY = startY + step;               // step 为负
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

/**
 * 【新增】动态滚动，构建「key -> serializeNodeForOffset」映射表
 * -------------------------------------------------
 * @param {function(): UiObject} uiObjectFn - 返回可滚动容器
 * @param {function(UiObject): string} keyFn - 对每个子节点生成唯一 key
 * @param {number}   [capacity=50]      - 最大收集数量
 * @param {string}   [direction="up"]   - 滚动方向("up"|"down")
 * @returns {Object} 返回形如 { [key: string]: string } 的映射表
 *
 * 使用场景（示例）:
 *   - 重点在于“自动化兼职项目收学费”时批量加私信好友，或
 *   - “金银珠宝首饰生意”中批量处理聊天列表时，通过 keyFn 来确定“用户名”/“群聊名”/“评论内容” 等。
 *   - 大模型 Agent + AutoJS 多号多 App 运营，用于“养号+精准引流”。
 */
function buildSerializeNodeMap(uiObjectFn, keyFn, capacity, direction) {
    capacity = capacity || 50;
    direction = direction || "up";

    const resultMap = {};          // 最终返回的 map: { key -> serializeNodeForOffset(node) }
    const seenSet = new Set();     // 用于避免重复收集同一个子节点
    let lastSnapshot = "";         // 用于检测“本页快照”是否与上一页相同(触底判断)
    let scrollCount = 0;
    const maxScrollTimes = 20;     // 避免过度滚动造成死循环

    while (Object.keys(resultMap).length < capacity && scrollCount < maxScrollTimes) {
        let container = uiObjectFn();
        if (!container) {
            log("【buildSerializeNodeMap】uiObjectFn() 返回空，提前结束");
            break;
        }

        // 1) 获取子节点，若方向=down，则反转遍历顺序
        let children = container.children() || [];
        if (direction === "down") {
            children = children.reverse();
        }

        // 2) 构建当前“快照”以判断是否到底
        let snapshotArr = [];

        // 3) 遍历子节点
        for (let i = 0; i < children.length; i++) {
            let node = children[i];
            let nodeId = getNodeUniqueId(node);  // 用已有函数做全局去重判定
            snapshotArr.push(nodeId);

            if (seenSet.has(nodeId)) {
                continue; // 已收录过
            }
            seenSet.add(nodeId);

            // （A）用 keyFn 生成 key
            let mapKey = keyFn(node);
            if (!mapKey) {
                // 如果 keyFn 返回空字符串，则跳过
                continue;
            }

            // （B）用 serializeNodeForOffset(node) 作为映射值
            let mapValue = serializeNodeForOffset(node);
            resultMap[mapKey] = mapValue;

            // （C）若收集数量达到上限，则退出
            if (Object.keys(resultMap).length >= capacity) {
                log("【buildSerializeNodeMap】达到 capacity，上限收满");
                break;
            }
        }

        // 4) 与上一次快照比对，如无变化则说明到底
        let currSnapshot = snapshotArr.join("-");
        if (currSnapshot === lastSnapshot) {
            log("【buildSerializeNodeMap】本轮无新增节点或页面不变，可能到底");
            break;
        }
        lastSnapshot = currSnapshot;

        // 5) 继续滚动一屏
        scrollCount++;
        scrollOneStep(container, direction, 3000);
        sleep(3000);
    }

    // ============ 尝试附加收尾收集：再多滚动 2~3 屏，尽量覆盖延迟加载 ============
    let extraScroll = 2;
    while (extraScroll-- > 0 && Object.keys(resultMap).length < capacity) {
        let container = uiObjectFn();
        if (!container) break;
        let children = container.children() || [];
        if (direction === "down") {
            children = children.reverse();
        }
        for (let i = 0; i < children.length; i++) {
            let node = children[i];
            let nodeId = getNodeUniqueId(node);
            if (seenSet.has(nodeId)) continue;
            seenSet.add(nodeId);

            let mapKey = keyFn(node);
            if (!mapKey) continue;

            let mapValue = serializeNodeForOffset(node);
            resultMap[mapKey] = mapValue;
            if (Object.keys(resultMap).length >= capacity) break;
        }

        // 再滚动
        scrollOneStep(container, direction, 3000);
        sleep(3000);
    }

    log(`【buildSerializeNodeMap】完成，收集到 ${Object.keys(resultMap).length} / ${capacity} 项`);

    return resultMap;
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
    serializeNodeForOffset,
    buildSerializeNodeMap
};