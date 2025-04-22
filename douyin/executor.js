/**
 * executor.js
 * ---------------------------
 * 基于LLM决策层生成的actionPlan，自动化执行
 * 核心定位：推广自动化兼职项目（收学费）+ 金银珠宝首饰生意
 * 多号多App养号+精准引流
 */

let { safeClick, safeLongPress } = require("./utils/clickUtils.js");
let { safeInput } = require("./utils/inputUtils.js");
let { buildOffsetTable } = require("./utils/swipeUtils.js");
let { openApp, closeApp } = require("./utils/app.js");
let { inputText } = require("./utils/inputUtils.js");
let { captureAndAnalyze } = require("./utils/llm.js");
let { sendDirectMessage } = require("./utils/smsService.js");
let { swipeUpVideoNatural,buildSerializeNodeMap } = require('./utils/swipeUtils.js');

const actionMap = {
    点赞: doLike,
    收藏: doFavorite,
    不感兴趣: doNotInterested,
    转发: doShare,
    推荐: dorecommend,
    回复首条评论: doReplyFirstComment,
    评论: doComment,
    私信: doSendMessage,
    群聊: doGroupMessage,
    刷视频: doWatchVideos
};

// 主执行入口
function executeActionPlan(actionPlan) {
    Object.keys(actionMap).forEach((类型) => {
        actionPlan.actions
            .filter(action => action.类型 === 类型)
            .forEach((action, idx) => {
                let { 参数 } = action;
                let executeFunction = actionMap[类型];
                if (executeFunction) {
                    log(`【Executor】按顺序执行操作: ${类型}`);
                    executeFunction(参数);
                } else {
                    log(`【Executor】未知操作类型: ${类型}`);
                }
            });
    });
}

function doLike(参数) {
    let 是否点赞 = 参数.是否点赞;
    if (是否点赞) {
        safeClick(descContains("点赞").findOnce(), "点赞");
    }
}

function doFavorite(参数) {
    let 是否收藏 = 参数.是否收藏;
    if (是否收藏) {
        safeClick(descContains("收藏").findOnce(), "收藏");
    }
}

function doNotInterested(参数) {
    let 是否不感兴趣 = 参数.是否不感兴趣;
    if (是否不感兴趣) {
        safeLongPress(5000, "不感兴趣长按");
        safeClick(text("不感兴趣").findOnce(0).parent(), "不感兴趣");
    }
}

function doShare(参数) {
    let 是否转发 = 参数.是否转发;
    let 想法 = 参数.想法;
    if (是否转发) {
        safeClick(descContains("分享").findOnce(), "分享");
        safeClick(text("转发到日常").findOnce(0).parent().parent(), "转发到日常");
        safeInput(className("android.widget.EditText").findOnce(0), 想法, "想法");
        safeClick(text("转发").findOnce(0).parent(), "转发");
    }
}

function dorecommend(参数) {
    let 是否推荐 = 参数.是否推荐;
    if (是否推荐) {
        safeClick(descContains("分享").findOnce(), "分享");
        safeClick(text("推荐").findOnce(0).parent().parent(), "推荐");
    }
}

function doReplyFirstComment(参数) {
    let 是否回复评论 = 参数.是否回复评论;
    let 回复内容 = 参数.回复内容;
    let 评论是否赞 = 参数.评论是否赞;
    let 评论是否踩 = 参数.评论是否踩;
    if (是否回复评论) {
        safeClick(text("回复").findOnce(0), "回复");
        safeInput(className("android.widget.EditText").findOnce(0), 回复内容, "评论内容");
        safeClick(text("发送").findOnce(0), "发送");
    }
    if(评论是否赞){
        safeClick(descContains("赞").descContains(",未选中").findOnce(0), "赞");
    }
    if(评论是否踩){
        safeClick(descContains("踩").descContains(",未选中").findOnce(0), "踩"); 
    }
}

function doComment(参数) {
    let 是否评论 = 参数.是否评论;
    let 评论内容 = 参数.评论内容;
    if (是否评论) {
        safeInput(className("android.widget.EditText").findOnce(0), 评论内容, "评论内容");
        safeClick(text("发送").findOnce(0), "发送");
    }
}

function doSendMessage(参数) {
    let 私信名 = 参数.私信名;
    let 发送内容 = 参数.发送内容;

    let chatListFn = () => {
        let lists = className("androidx.recyclerview.widget.RecyclerView").find();
        if (!lists || lists.size() === 0) return null;
        return lists.get(lists.size() - 1);
    };

    let offsetTable = buildOffsetTable(chatListFn, 50, "up");

    let serializeNodeMap = buildSerializeNodeMap(
        chatListFn,
        (child) => {
            let nameTxt = child.text() || child.desc();
            if (nameTxt) {
                return nameTxt.trim();
            }
            return ""; // 没拿到就返回空串
        },
        50,  
        "up" 
    );

    if (!serializeNodeMap.hasOwnProperty(私信名)) {
        log("【doSendMessage】未在列表中找到私信名：" + 私信名);
        return;
    }

    let offsetTableKey = serializeNodeMap[私信名];

    locateTargetObject(offsetTableKey, chatListFn, offsetTable, "up");

    // 一旦定位完成，可再次从 uiObjectFn() 查找当前屏幕中目标节点
    let container = chatListFn();
    if (!container) return;

    let childNodes = container.children(); // childNodes 是 UiObjectCollection

    // ② 遍历寻找目标 childNode
    let childNode = null;
    for (let i = 0; i < childNodes.size(); i++) {
        let candidate = childNodes.get(i);
        log("serializeNodeForOffset(candidate):" + serializeNodeForOffset(candidate));
        if (serializeNodeForOffset(candidate) === offsetTableKey) {
            childNode = candidate;
            break;
        }
    }

    safeClick(childNode, "单聊");
    safeInput(className("android.widget.EditText").findOnce(0), 发送内容, "发送内容");
    safeClick(text("我").findOnce(0), "发送");
}

function doGroupMessage(参数) {
    let 群聊名 = 参数.群聊名;
    let 群发内容 = 参数.群发内容;
}

function doWatchVideos(参数) {
    let 视频列表 = 参数.视频列表;
    视频列表.forEach(video => {
        let 观看时长秒 = video.观看时长秒;
        let 是否暂停 = video.是否暂停;

        swipeUpVideoNatural();

        if (是否暂停) {
            let 随机暂停坐标 = {
                x: device.width * (Math.random() * 0.2 + 0.4), // 屏幕横向40%~60%
                y: device.height * (Math.random() * 0.2 + 0.4) // 屏幕纵向40%~60%
            };
            log(`暂停视频，随机点击坐标(${随机暂停坐标.x.toFixed(0)}, ${随机暂停坐标.y.toFixed(0)})`);
            click(随机暂停坐标.x, 随机暂停坐标.y);
        }

        sleep(观看时长秒 * 1000);
    });
}

module.exports = {
    executeActionPlan
};
