/**
 * main.js
 * ---------------【 主脚本 】----------------
 */

let { safeClick } = require("../utils/clickUtils.js");
let { getDiceParentNode, buildNodeTree, diffNodeTrees } = require("../utils/uiStructureUtils.js");

// 启动 APP
var packageName = "uni.UNIF14806C.qyzx";
app.launch(packageName);
toastLog("已尝试打开趣游App：" + packageName);

// 等待App首页加载
sleep(2000);

// 切换到第三个Tab（示例）
safeClick(id("iv_tab_three"), "第三个Tab图标", 5000);

// 演示：循环点击「投骰子」，并记录点击前后UI变化
while (true) {
    let diceParent = getDiceParentNode();
    if (!diceParent) {
        log("未找到投骰子按钮或其父节点，等待1秒后重试...");
        sleep(1000);
        continue;
    }

    // 1) 记录点击前的结构
    let beforeStructure = buildNodeTree(diceParent);
    log("【点击前】投骰子区域UI结构：\n" + JSON.stringify(beforeStructure, null, 2));

    // 2) 执行点击
    if (safeClick(id("rollDiceButton"), "投骰子", 3000)) {
        // 2.1) “点击瞬间”结构
        let clickedStructure = buildNodeTree(diceParent);
        log("【点击瞬间】投骰子区域UI结构：\n" + JSON.stringify(clickedStructure, null, 2));

        // 2.2) 多次抓取点击后的结构，检测动画中是否有变化
        let maxCheckCount = 10;     // 最多检查次数
        let interval = 200;        // 每次间隔(毫秒)
        let previousStructure = clickedStructure;

        for (let i = 0; i < maxCheckCount; i++) {
            sleep(interval);
            let currentStructure = buildNodeTree(diceParent);

            // 对比上一帧和这一帧
            let diffResult = diffNodeTrees(previousStructure, currentStructure);
            if (diffResult.length > 0) {
                // 如果在动画过程中发现了变化
                log("【动画过程检测】第" + (i+1) + "次检测到变化：\n" + diffResult.join("\n"));
            }

            previousStructure = currentStructure;
        }

        // 2.3) 最终“点击后”结构
        let afterStructure = buildNodeTree(diceParent);
        log("【点击后】投骰子区域UI结构：\n" + JSON.stringify(afterStructure, null, 2));

        // 3) 对比 点击前/点击后 的差异（最终状态）
        let finalDiff = diffNodeTrees(beforeStructure, afterStructure);
        if (finalDiff.length === 0) {
            log("对比结果：在该区域内未检测到控件结构的变化。");
        } else {
            log("【最终对比结果】投骰子区域发生以下变化：\n" + finalDiff.join("\n"));
        }

    } else {
        log("暂时无法点击【投骰子】，等待1秒后重试...");
        sleep(1000);
    }

    // 视需求决定是否 break，否则会一直循环
    // break;
    sleep(1000);
}
