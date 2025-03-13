/**
 * uiStructureUtils.js
 * ---------------【 UI结构打印/对比相关的工具函数 】----------------
 */

/**
 * 获取「投骰子」按钮对应的父容器节点
 */
function getDiceParentNode() {
    let diceBtn = id("rollDiceButton").findOne(2000);
    if (!diceBtn) {
        return null;
    }
    let parent = diceBtn.parent();
    return parent || diceBtn;
}

/**
 * 构建节点的「树结构」，以 JSON 形式表示，并收集更多属性
 */
function buildNodeTree(node) {
    if (!node) return null;

    let info = {
        className: node.className() || "",
        id: node.id() || "",
        text: node.text() || "",
        desc: node.desc() || "",
        bounds: node.bounds().toString(),
        checkable: node.checkable && node.checkable(),
        checked: node.checked && node.checked(),
        clickable: node.clickable && node.clickable(),
        enabled: node.enabled && node.enabled(),
        focusable: node.focusable && node.focusable(),
        focused: node.focused && node.focused(),
        longClickable: node.longClickable && node.longClickable(),
        scrollable: node.scrollable && node.scrollable(),
        selected: node.selected && node.selected(),
        children: []
    };

    let children = node.children();
    for (let i = 0; i < children.size(); i++) {
        let child = children.get(i);
        info.children.push(buildNodeTree(child));
    }

    return info;
}

/**
 * 对比两个节点树（JSON 对象）是否有差异，返回一个字符串数组，用于描述差异
 * 基本思路：
 * 1) 以树的 DFS 方式对每个节点做“匹配”并对比属性；
 * 2) 由于可能有兄弟节点数目不同，这里只做简单的按序对比；
 *    若需要更复杂的匹配(如节点顺序经常变化)，则需再改进。
 */
function diffNodeTrees(beforeTree, afterTree, path) {
    let diffs = [];
    path = path || "root";

    // 一方为空，另一方不为空，说明有增删
    if (!beforeTree && afterTree) {
        diffs.push(`在 [${path}] 处新增节点 => ${JSON.stringify(afterTree)}`);
        return diffs;
    }
    if (beforeTree && !afterTree) {
        diffs.push(`在 [${path}] 处节点被移除 => ${JSON.stringify(beforeTree)}`);
        return diffs;
    }

    // 都为空，直接返回
    if (!beforeTree && !afterTree) {
        return diffs; 
    }

    // 对比同级节点的基础属性
    let keysToCompare = [
        "className", "id", "text", "desc", "bounds",
        "checkable", "checked", "clickable", "enabled",
        "focusable", "focused", "longClickable", "scrollable",
        "selected"
    ];
    keysToCompare.forEach(key => {
        if (beforeTree[key] !== afterTree[key]) {
            diffs.push(
                `在 [${path}] 的属性 [${key}] 发生变化: ` +
                `由 "${beforeTree[key]}" => "${afterTree[key]}"`
            );
        }
    });

    // 继续对比子节点
    let beforeChildren = beforeTree.children || [];
    let afterChildren = afterTree.children || [];
    let maxLen = Math.max(beforeChildren.length, afterChildren.length);
    for (let i = 0; i < maxLen; i++) {
        let childDiffs = diffNodeTrees(
            beforeChildren[i],
            afterChildren[i],
            path + `.children[${i}]`
        );
        diffs = diffs.concat(childDiffs);
    }

    return diffs;
}

// 导出
module.exports = {
    getDiceParentNode,
    buildNodeTree,
    diffNodeTrees
};
