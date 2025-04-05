/**
 * executor.js
 * ---------------------------
 * 执行层：对决策输出的 actionPlan 进行具体操作，如：观看视频、点赞、评论、关注、私信等
 * 
 * executeActionPlan(actionPlan):
 *   - 遍历 actionPlan.actions
 *   - 根据 actionType 调用对应的执行函数
 */

let { safeClick } = require("./utils/clickUtils.js");
let { swipeUpScreens } = require("./utils/swipeUtils.js");
// ... 可能还要用到其他 utils

/**
 * @desc 执行整个 actionPlan
 * @param {Object} actionPlan - 形如 { actions: [ { actionType, ... } ] }
 */
function executeActionPlan(actionPlan) {
    if (!actionPlan || !Array.isArray(actionPlan.actions)) {
        log("【Executor】actionPlan 无效，跳过执行");
        return;
    }
    log("【Executor】开始执行 actionPlan...");

    // actionType -> 执行函数 的映射表
    let actionMap = {
        "like": doLike,
        "comment": doComment,
        "follow": doFollow,
        "watchVideo": doWatchVideo,
        "sendMessage": doSendMessage,
        "postVideo": doPostVideo
        // ... 可自行扩展
    };

    for (let i = 0; i < actionPlan.actions.length; i++) {
        let action = actionPlan.actions[i];
        let fun = actionMap[action.actionType];
        if (fun) {
            log(`【Executor】执行第${i}个操作，actionType=${action.actionType}`);
            fun(action);
        } else {
            log(`【Executor】未识别的actionType=${action.actionType}，跳过`);
        }
    }
    log("【Executor】actionPlan 执行完毕");
}

/**
 * @desc 示例：点赞操作
 * @param {Object} action - { actionType: "like", ... }
 */
function doLike(action) {
    log("【Executor-doLike】执行点赞操作...");
    // 这里写具体的点击“点赞”按钮的自动化逻辑
    // ...
    sleep(1000);
}

/**
 * @desc 示例：评论操作
 * @param {Object} action - { actionType: "comment", commentText: "..." }
 */
function doComment(action) {
    log("【Executor-doComment】执行评论操作, 内容=", action.commentText);
    // 找到评论输入框 -> 输入 -> 点击发送
    // ...
    sleep(2000);
}

/**
 * @desc 示例：关注操作
 * @param {Object} action - { actionType: "follow", targetUser: "xxx" }
 */
function doFollow(action) {
    log("【Executor-doFollow】执行关注, 目标=", action.targetUser);
    // ...
    sleep(1000);
}

/**
 * @desc 示例：观看视频
 * @param {Object} action - { actionType: "watchVideo", watchDuration: 5000, videoCategory: "xxx" }
 */
function doWatchVideo(action) {
    log("【Executor-doWatchVideo】执行观看视频, 时长=" + action.watchDuration);
    // ...
    sleep(action.watchDuration || 5000);
}

/**
 * @desc 示例：发送私信
 * @param {Object} action - { actionType: "sendMessage", message: "..." }
 */
function doSendMessage(action) {
    log("【Executor-doSendMessage】执行私信, 内容=" + action.message);
    // ...
    sleep(1000);
}

/**
 * @desc 示例：发视频
 * @param {Object} action - { actionType: "postVideo", title: "...", videoPath: "..." }
 */
function doPostVideo(action) {
    log("【Executor-doPostVideo】执行发视频, 标题=" + action.title);
    // ...
    sleep(2000);
}

module.exports = {
    executeActionPlan
};
