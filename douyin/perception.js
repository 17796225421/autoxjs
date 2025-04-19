/**
 * perception.js
 * ---------------------------
 * 感知层：从视频、评论、单聊、群聊等界面获取信息
 * 用于LLM Agent 决策，以实现推广自动化兼职项目、收取学费，
 * 以及推广金银珠宝首饰等业务，精准吸引兼职赚钱和高价值消费人群。
 * 基于 AutoJS + LLM 智能决策，支持多号、多App自动化引流养号
 */
let { collectScrollableChildren,  collectScrollableChildrenKey,scrollOneStep, swipeUpVideoNatural, buildOffsetTable, locateTargetObject,serializeNodeForOffset } = require("./utils/swipeUtils.js");
let { safeClick } = require("./utils/clickUtils.js");
let { findTextByOcr } = require("./utils/ocr.js");

/**
 * 汇总感知数据结构
 *
 * @typedef {Object} PerceptionData
 * @property {VideoInfo} videoInfo - 当前视频的关键信息，帮助判断内容吸引度
 * @property {CommentInfo} commentInfo - 评论互动信息，挖掘潜在意向用户
 * @property {ChatInfo} chatInfo - 单聊互动数据，识别精准意向用户并跟进转化
 * @property {GroupChatInfo} groupChatInfo - 群聊数据，筛选推广高潜用户群
 *
 */
function collectInfo() {
    log("【Perception】整合感知数据...");

    while (true) {
        if (checkValid()) {
            log("校验视频成功");
            break;
        } else {
            swipeUpVideoNatural();
        }
    }

    let chatNameList = collectChatNameList();
    let perceptionData = {
        videoInfo: collectVideoInfo(),
        firstComment: collectFirstComment(),
        commentInfo: collectCommentInfo(),
        chatInfo: collectChatInfo(chatNameList),
        groupChatInfo: collectGroupChatInfo(chatNameList)
    };

    log("【Perception】数据整合完成：" + JSON.stringify(perceptionData));
    return perceptionData;
}

function checkValid() {
    log("【Perception】校验视频...");
    safeClick(descContains("评论").findOnce().parent(), "评论区");
    safeClick(descContains("评论区").findOnce(0), "放大评论区");

    let commentListView = className("androidx.recyclerview.widget.RecyclerView").findOnce(0);
    let valid = commentListView.child(1).findOne(textContains("展开")) !== null;
    back();
    sleep(5000);
    return valid;
}

/**
 * 视频信息结构体
 * @typedef {Object} VideoInfo
 * @property {string} desc - 视频的描述信息
 */
function collectVideoInfo() {
    log("【Perception】收集视频信息...");
    let descElement = id("desc").findOnce();
    let desc = descElement ? descElement.text() : ""
    log("视频信息：" + desc)
    return { desc: desc };
}

/**
 * 获取首条评论及其回复
 *
 * @typedef {Object} Comment
 * @property {string} username - 评论者用户名
 * @property {string} content - 评论内容
 * @property {Reply[]} replies - 回复列表
 *
 * @typedef {Object} Reply
 * @property {string} content - 回复内容
 *
 * @returns {Comment|null} 首条评论的完整信息（含回复），若无则返回 null
 */
function collectFirstComment() {
    log("【Perception】收集首条评论及回复...");

    // 点击进入评论区
    safeClick(descContains("评论").findOnce(0), "评论区");
    safeClick(descContains("评论区").findOnce(0), "放大评论区");

    let commentListViewFn = () => className("androidx.recyclerview.widget.RecyclerView").findOnce(0);
    let commentListView = commentListViewFn();

    // 获取评论区首条评论
    let firstCommentNode = commentListView.child(0);
    let username = firstCommentNode.findOne(id("title")).text();
    let content = firstCommentNode.findOne(id("content")).text();

    // 点击首条评论展开回复
    safeClick(commentListView.child(1), "展开首条评论回复");
    safeClick(findTextByOcr("展开更多")[0], "展开更多");
    scrollOneStep(commentListView);
    safeClick(findTextByOcr("展开更多")[0], "展开更多");
    scrollOneStep(commentListView, "down");

    let offsetTable = buildOffsetTable(commentListViewFn, 10);
    commentListView = commentListViewFn();
    let replyKeyList = collectScrollableChildrenKey(
        commentListViewFn,
        node => {
            if (node.id() === "com.ss.android.ugc.aweme:id/k4-") {
                return true;
            } else {
                return false;
            }
        }
    );

    let replies = [];
    if (replyKeyList) {
        replyKeyList.forEach(replyKey => {
            locateTargetObject(replyKey, commentListViewFn, offsetTable);

            // 一旦定位完成，可再次从 uiObjectFn() 查找当前屏幕中目标节点
            let container = commentListViewFn();
            if (!container) return;

            let childNodes = container.children(); // childNodes 是 UiObjectCollection

            // ② 遍历寻找目标 childNode
            let childNode = null;
            for (let i = 0; i < childNodes.size(); i++) {
                let candidate = childNodes.get(i);
                if (serializeNodeForOffset(candidate) === replyKey) {
                    childNode = candidate;
                    break;
                }
            }

            replies.push({ content: childNode.findOne(id("content")).text() });
        });
    } else {
        log("【Perception】未发现回复内容");
    }

    let firstComment = { username, content, replies };
    log("【Perception】首条评论信息：" + JSON.stringify(firstComment));

    back(); // 返回视频界面
    return firstComment;
}


/**
 * 评论信息结构体
 * @typedef {Object} CommentInfo
 * @property {Comment[]} comments - 评论列表
 *
 * @typedef {Object} Comment
 * @property {string} username - 评论者用户名
 * @property {string} content - 评论内容
 */
function collectCommentInfo() {
    log("【Perception】收集评论列表...");
    // 点击进入评论区
    safeClick(descContains("评论").findOnce().parent(), "评论区");
    safeClick(descContains("放大评论区").findOnce(), "放大评论区");

    let commentListView = className("androidx.recyclerview.widget.RecyclerView").scrollable().findOnce(0);

    let commentNodes = collectScrollableChildren(
        commentListView,
        node => node.id() === "esx"
    );

    let comments = [];
    commentNodes.forEach(node => {
        let titleNode = node.findOnce(id("title"));
        let username = titleNode ? titleNode.text() : "未知";

        let contentNode = node.findOnce(id("content"));
        let content = contentNode ? contentNode.text() : "";

        if (content) {
            comments.push({ username, content });
        }
    });

    return { comments };
}

/**
 * 单聊信息结构体
 * @typedef {Object} ChatInfo
 * @property {Chat[]} chats - 单聊列表
 *
 * @typedef {Object} Chat
 * @property {string} title - 消息标题
 * @property {Message[]} messages - 消息内容列表
 *
 * @typedef {Object} Message
 * @property {boolean} isMe - 是否为本人发送（true为自己发送，false为对方发送）
 * @property {string} content - 消息文本内容
 */
function collectChatInfo(chatNameList) {
    log("【Perception】收集单聊信息...");
    safeClick(text("消息").findOnce(), "消息Tab");

    let chats = [];
    let chatList = className("android.recyclerview.widget.RecyclerView").findOnce().children();

    chatList = collectScrollableChildren(
        chatList,
        node => {
            let titleNode = node.findOnce(id("tv_title"));
            if (titleNode) {
                let t = titleNode.text();
                return !chatNameList.includes(t);
            }
            return false;
        }
    );

    chatList.forEach(node => {
        let titleNode = node.findOnce(id("tv_title"));
        let title = titleNode ? titleNode.text() : "未知";

        // 打开单聊
        safeClick(node, "聊天框");

        let commentListView = className("androidx.recyclerview.widget.RecyclerView").scrollable().findOnce(0);
        let messages = [];

        let messageNodes = collectScrollableChildren(commentListView, item => true);
        let isMe = true;
        messageNodes.forEach(msg => {
            let senderNode = msg.findOnce(id("message_author"));
            let senderText = senderNode ? senderNode.text() : "";

            // 判断是否自己发送
            if (senderText && senderText.includes("我")) {
                isMe = true;
            } else {
                isMe = false;
            }

            let contentNode = msg.findOnce(id("message_content"));
            let content = contentNode ? contentNode.text() : "";

            messages.push({ isMe, content });
        });

        chats.push({ title, messages });
        back();
    });

    return { chats };
}

/**
 * 群聊信息结构体
 * @typedef {Object} GroupChatInfo
 * @property {Message[]} messages - 群聊消息列表
 *
 * @typedef {Object} Message
 * @property {boolean} isMe - 是否为本人发送（true为自己发送，false为他人发送）
 * @property {string} content - 消息文本内容
 */
function collectGroupChatInfo(chatNameList) {
    log("【Perception】收集群聊信息...");
    safeClick(text("群聊").findOnce(), "群聊Tab");

    let messages = [];
    let groupList = className("android.recyclerview.widget.RecyclerView").findOnce().children();

    groupList.forEach(group => {
        safeClick(group, "打开群聊");

        className("androidx.recyclerview.widget.RecyclerView").scrollable().findOnce().children().forEach(msg => {
            // let senderText = msg.findOnce(id("message_author"))?.text() || "";
            let senderNode = msg.findOnce(id("message_author"));
            let senderText = senderNode ? senderNode.text() : "";
            let isMe = senderText.includes("我");

            // let content = msg.findOnce(id("message_content"))?.text() || "";
            let contentNode = msg.findOnce(id("message_content"));
            let content = contentNode ? contentNode.text() : "";

            messages.push({ isMe, content });
        });

        back();
    });

    return { messages };
}

function collectChatNameList() {
    return "1";
    log("【Perception】收集群聊名称...");
    safeClick(text("消息").findOnce(), "消息Tab");
    safeClick(desc("更多面板").findOnce(), "更多面板");
    safeClick(text("发起群聊").findOnce(), "发起群聊");
    safeClick(textMatches(/(选择一个已有群聊|已加入的群聊)/).findOnce(0), "选择一个已有群聊");
    let groupChatListView = className("androidx.recyclerview.widget.RecyclerView").findOnce(0);
    groupChatListView = collectScrollableChildren(
        () => className("androidx.recyclerview.widget.RecyclerView").findOnce(0),
        node => {
            let matchedNode = node.findOne(
                className("android.widget.TextView").textMatches(/^.{2,}$/)
            );
            if (matchedNode) {
                return true;
            } else {
                return false;
            }
        }
    );
    let groupChatNameList = [];
    groupChatListView.forEach(node => {
        groupChatNameList.push(node.findOne(textMatches(/^.{2,}$/)).text());
    });
    log("✅最终收集到的群聊名称列表：", groupChatNameList);
    back();
    sleep(5000);
    back();
    sleep(5000);
    safeClick(text("首页").findOnce(), "消息Tab");
    return groupChatNameList;
}

module.exports = {
    collectInfo
};
