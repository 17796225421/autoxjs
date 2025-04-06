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


// 执行入口：精准结构约束
function executeActionPlan(actionPlan) {
    const actionMap = {
        like: doLike,
        comment: doComment,
        follow: doFollow,
        watchVideo: doWatchVideo,
        sendMessage: doSendMessage,
        postVideo: doPostVideo
    };

    actionPlan.actions.forEach((action, idx) => {
        let { actionType, params } = action;
        let executeFunction = actionMap[actionType];
        if (executeFunction) {
            log(`【Executor】执行第${idx + 1}个操作: ${actionType}`);
            executeFunction(params);
        } else {
            log(`【Executor】未知操作类型: ${actionType}`);
        }
    });
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

module.exports = {
    executeActionPlan
};
