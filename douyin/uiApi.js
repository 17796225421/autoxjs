/**
 * uiApi.js
 * ---------------------------
 * 脚本逻辑部分
 */

let { safeClick } = require("./utils/clickUtils.js");
let { loopRunner } = require("./utils/loop.js");
let { gatherPerceptionData } = require("./perception.js");
let { makeDecision } = require("./decision.js");
let { executeActionPlan } = require("./executor.js");

global.hasCapturePermission = false;

function mainLogic() {
    loopRunner(感知决策执行, 1000, 10000);
}

/**
 * @desc 感知决策执行
 */
function 感知决策执行() {
    closeApp("抖音");
    openApp("抖音");
    // 1. 感知
    let perceivedData = gatherPerceptionData();
    // 2. 决策
    let actionPlan = makeDecision(perceivedData);
    // 3. 执行
    executeActionPlan(actionPlan);
}


module.exports = {
    mainLogic
};
