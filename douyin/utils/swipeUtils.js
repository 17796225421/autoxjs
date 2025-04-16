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
            scrollOneStep(uiObjectFn(), direction, 300);
            sleep(5000);
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

    let offsetTable = {};      // 存储 { key -> offset } 
    let discoveredList = [];   // 记录已发现的节点（只为避免重复、或后续做一些处理）
    let scrollCount = 0;
    let maxScrollTimes = 20;
    let oldCount = 0;

    // 对“上滑”或“下滑”分开维护一个“累加偏移量”
    // 思路：当 direction="up" 时，越往下的子节点 offset 越大；当 direction="down" 时，越往上的子节点 offset 越负。
    // 但要注意：我们并不知道最终谁是“最下面”或“最上面”。这里采用“边发现，边计算”的方法。
    // 上滑(up)：第一节点 offset=0，后面每发现一个新节点 => offset = 上一个节点offset + 上一个节点高度
    // 下滑(down)：第一节点 offset=0，后面每发现一个新节点 => offset = 上一个节点offset - 上一个节点高度
    //     （这样最终收集完时，“最末尾发现的节点”offset 可能不是 0，但我们已经实时保留了最精准的相对关系。）
    let lastOffsetUp = 0;    // 用于 direction="up" 的累加
    let lastOffsetDown = 0;  // 用于 direction="down" 的累加

    while (discoveredList.length < capacity && scrollCount < maxScrollTimes) {
        let container = uiObjectFn();
        if (!container) {
            log("【buildOffsetTable】uiObjectFn() 返回为空，终止。");
            break;
        }

        // 1. 拿到当前容器的“直接子节点”
        let children = container.children();
        log("【buildOffsetTable】本次发现的子节点数量: " + children.length);

        //   如果方向是 down，可考虑先反转 child 列表，这样“屏幕最下面的子节点”排在最前面
        //   也可以按顺序遍历，再根据需要计算 offset
        if (direction === "down") {
            // 让最底部的 child 排在前面，以符合聊天框“底部 = offset=0，往上递减”的思路
            children = children.reverse();
        }

        // 2. 遍历当前屏幕的子节点
        for (let i = 0; i < children.length; i++) {
            let node = children[i];
            let key = serializeNodeForOffset(node);
            if (offsetTable.hasOwnProperty(key)) {
                // 已收录，跳过
                continue;
            }

            // 2.1 未收录 => 立即测量该节点高度
            let nodeHeight = getNodeHeight(node);
            // 2.2 计算 offset
            if (direction === "up") {
                // 第一个新节点 => offset=lastOffsetUp，然后累加
                offsetTable[key] = lastOffsetUp;
                // 下一个节点的 offset 应再往下累加
                lastOffsetUp += nodeHeight;
            } else {
                // direction === "down"
                offsetTable[key] = lastOffsetDown;
                // 下一个节点 offset 再减去它的高度
                lastOffsetDown -= nodeHeight;
            }

            discoveredList.push(node);

            // 达到容量则停止
            if (discoveredList.length >= capacity) {
                break;
            }
        }

        // 3. 若本轮无新节点，终止滚动
        if (discoveredList.length === oldCount) {
            log("【buildOffsetTable】本次滚动未发现新子节点，提前停止");
            break;
        } else {
            oldCount = discoveredList.length;
        }

        // 4. 继续滚动
        if (scrollCount < maxScrollTimes) {
            scrollOneStep(container, direction, 500);
            sleep(1000);
        }
        scrollCount++;
    }
    log("【buildOffsetTable】完毕，已发现子节点数=" + discoveredList.length);
    // 至此，所有节点（不管是否可见）都已在 offsetTable 中记录了 offset 值

    // ============= 构建完成后，让 offset=0 的节点自动移动到“容器首屏” =============
    //   您提到：“让offset表的value为0的节点，利用 locateTargetObject 进行移动”
    //   这里示例操作：把 offset=0 的那一个节点拿来调用 locateTargetObject
    //   若您想在外部再调用，也可在外部执行 locateTargetObject。
    let zeroKey = Object.keys(offsetTable).find(k => offsetTable[k] === 0);
    if (zeroKey) {
        let container = uiObjectFn();
        let zeroNode = discoveredList.find(n => serializeNodeForOffset(n) === zeroKey);
        if (zeroNode) {
            locateTargetObject(zeroNode, uiObjectFn, offsetTable, direction);
        }
    }

    return offsetTable;
}

/**
 * @desc 【核心函数2】定位目标子节点：将“目标子节点”移动到“第一个直接子节点”的位置
 *       - 先用“节点序列化”处理目标子节点 -> 从 offset 表拿到 offsetA
 *       - 再序列化“当前第一个直接子节点” -> 从 offset 表拿到 offsetB
 *       - 计算 delta = offsetA - offsetB
 *       - scroll 使二者对齐
 *
 * @param {UiObject} targetNode   - 需要定位的目标子节点
 * @param {function(): UiObject} uiObjectFn - 返回可滚动容器的函数
 * @param {Object} offsetTable    - buildOffsetTable() 返回的 offset 表
 * @param {string} [direction="up"] - 可滚动方向
 */
function locateTargetObject(targetNode, uiObjectFn, offsetTable, direction) {
    direction = direction || "up";
    let targetKey = serializeNodeForOffset(targetNode);
    if (!offsetTable.hasOwnProperty(targetKey)) {
        log("【locateTargetObject】目标节点不在offset表中，无法定位");
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
        log("【locateTargetObject】第一个子节点不在offset表中，无法定位");
        return;
    }

    // ---- 计算 offset 差 ----
    let offsetA = offsetTable[targetKey];
    let offsetB = offsetTable[firstKey];
    let delta = offsetA - offsetB;

    log("【locateTargetObject】目标节点offset=" + offsetA + ", 第一个子节点offset=" + offsetB + ", 差值=" + delta);

    // ---- 进行滚动来对齐 ----
    // 如果是“上滑节点”（如评论区），delta>0 意味着目标在后面，需要往上滑
    // 如果是“下滑节点”（如聊天框），delta<0 意味着目标在前面，需要往下滑
    // 这里只给出一个简单思路：用若干次 scrollOneStep() 凑近 delta，也可做精细化的坐标滑动
    // 您可根据实际 UI 需要改写
    if (Math.abs(delta) < 1) {
        log("【locateTargetObject】目标节点已在首屏位置，无需再滚动");
        return;
    }

    // 简化处理：每次 scrollOneStep() 大约移动一个“子节点高度”的距离
    // 我们按节点高度为差值的一部分来控制滚动次数
    let step = 1;
    if (direction === "up") {
        // “上滑节点”：第一个子节点 offset=0 -> 下方子节点offset>0
        // delta>0 => target在下方 => scrollOneStep() 方向依然用 "up" 向上滑
        step = delta > 0 ? 1 : -1; // delta<0 => target在上方 => 需下滑
    } else {
        // “下滑节点”：最后一个子节点 offset=0 -> 上方子节点offset<0
        // delta<0 => target在上方 => scrollOneStep() 方向用 "down"
        step = delta < 0 ? -1 : 1;
    }

    let tries = 0;
    let maxTries = 15;
    while (Math.abs(delta) > 1 && tries < maxTries) {
        if (step > 0) {
            // 目标在下方 => 往"up"滚，或者往"down"滚？要区分
            // 仅做一个简单映射：
            let dir = (direction === "up") ? "up" : "down";
            scrollOneStep(container, dir, 300);
        } else {
            // 目标在上方
            let dir = (direction === "up") ? "down" : "up";
            scrollOneStep(container, dir, 300);
        }
        sleep(500);

        // 滚动后，重新计算 container, targetOffset
        container = uiObjectFn();
        if (!container) break;
        let newFirstChild = container.child(0);
        let newFirstKey = newFirstChild ? serializeNodeForOffset(newFirstChild) : null;
        if (!newFirstKey || !offsetTable[newFirstKey]) {
            // 也可能已滚动到完全不在表内的节点位置，实际情况可再做判断
            break;
        }
        offsetB = offsetTable[newFirstKey];
        offsetA = offsetTable[targetKey] || offsetA; // 这里假设目标节点依然在表中
        delta = offsetA - offsetB;
        log("【locateTargetObject】滚动后 delta=" + delta);
        tries++;
    }
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
    scrollOneStep,
    swipeUpVideoNatural,
    buildOffsetTable,
    locateTargetObject
};