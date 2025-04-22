/**
 * perception.js
 * ---------------------------
 * 感知层：从视频、评论、单聊、群聊等界面获取信息
 * 用于LLM Agent 决策，以实现推广自动化兼职项目、收取学费，
 * 以及推广金银珠宝首饰等业务，精准吸引兼职赚钱和高价值消费人群。
 * 基于 AutoJS + LLM 智能决策，支持多号、多App自动化引流养号
 */
let { collectScrollableChildren, collectScrollableChildrenKey, scrollOneStep, swipeUpVideoNatural, buildOffsetTable, locateTargetObject, serializeNodeForOffset } = require("./utils/swipeUtils.js");
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

    // while (true) {
    //     if (checkValid()) {
    //         log("校验视频成功");
    //         break;
    //     } else {
    //         swipeUpVideoNatural();
    //     }
    // }

    // let chatNameList = collectChatNameList();
    let chatNameList = ['小熙的粉丝群',
        '大师兄成本报价直播装机只赚装机费1群',
        '群952258',
        '萝卜开会',
        ' (114)',
        '猫崽的粉丝群',
        '不可以涩涩',
        '测试',
        '梓念粉丝1群',
        '去户外原地旋转喷屎',
        '暂时没有更多了'];
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
    safeClick(descContains("评论").visibleToUser().findOnce(0), "评论");
    safeClick(descContains("评论区").className("android.widget.ImageView").findOnce(0), "放大评论区");

    let commentListView = className("androidx.recyclerview.widget.RecyclerView").visibleToUser().findOnce(0);
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
    return {};
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
    return {};
    log("【Perception】收集首条评论及回复...");

    // 点击进入评论区
    safeClick(descContains("评论").visibleToUser().findOnce(0), "评论");
    safeClick(descContains("评论区").className("android.widget.ImageView").findOnce(0), "放大评论区");

    let commentListViewFn = () => className("androidx.recyclerview.widget.RecyclerView").visibleToUser().findOnce(0);
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
        },
        node => {
            if (node.findOne(descContains("收起")) !== null) {
                return true;
            } else {
                return false;
            }
        },
    );

    let replies = [];
    if (replyKeyList) {
        replyKeyList.forEach(replyKey => {
            log("raplyKey:" + replyKey);
            locateTargetObject(replyKey, commentListViewFn, offsetTable);

            // 一旦定位完成，可再次从 uiObjectFn() 查找当前屏幕中目标节点
            let container = commentListViewFn();
            if (!container) return;

            let childNodes = container.children(); // childNodes 是 UiObjectCollection

            // ② 遍历寻找目标 childNode
            let childNode = null;
            for (let i = 0; i < childNodes.size(); i++) {
                let candidate = childNodes.get(i);
                log("serializeNodeForOffset(candidate):" + serializeNodeForOffset(candidate));
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


    safeClick(descContains("收起")[0], "收起");

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
    return null;
    log("【Perception】收集评论列表...");

    // 点击进入评论区
    safeClick(descContains("评论").visibleToUser().findOnce(0), "评论");
    safeClick(descContains("评论区").className("android.widget.ImageView").findOnce(0), "放大评论区");

    let commentListViewFn = () => className("androidx.recyclerview.widget.RecyclerView").visibleToUser().findOnce(0);

    let offsetTable = buildOffsetTable(commentListViewFn, 10);
    let commentKeyList = collectScrollableChildrenKey(
        commentListViewFn,
        node => {
            if (node.id() === "com.ss.android.ugc.aweme:id/et6") {
                return true;
            } else {
                return false;
            }
        },
        null,
        5
    );
    let comments = [];
    if (commentKeyList) {
        commentKeyList.forEach(commentKey => {
            log("commentKey:" + commentKey);
            locateTargetObject(commentKey, commentListViewFn, offsetTable);

            // 一旦定位完成，可再次从 uiObjectFn() 查找当前屏幕中目标节点
            let container = commentListViewFn();
            if (!container) return;

            let childNodes = container.children(); // childNodes 是 UiObjectCollection

            // ② 遍历寻找目标 childNode
            let childNode = null;
            for (let i = 0; i < childNodes.size(); i++) {
                let candidate = childNodes.get(i);
                if (serializeNodeForOffset(candidate) === commentKey) {
                    childNode = candidate;
                    break;
                }
            }

            let titleNode = childNode.findOne(id("title"));
            let username = titleNode ? titleNode.text() : "未知";

            let contentNode = childNode.findOne(id("content"));
            let content = contentNode ? contentNode.text() : "";

            if (content) {
                comments.push({ username, content });
            }

        });
    } else {
        log("【Perception】未发现回复内容");
    }

    log("【Perception】评论信息：" + JSON.stringify(comments));

    back(); // 返回视频界面
    return comments;
}

/**
 * 单聊信息结构体
 * @typedef {Object} ChatInfo
 * @property {Chat[]} chats - 单聊列表
 *
 * @typedef {Object} Chat
 * @property {Message[]} messages - 消息内容列表
 *
 * @typedef {Object} Message
 * @property {string} username - 用户名
 * @property {string} content - 消息文本内容
 */
function collectChatInfo(chatNameList) {
    log("【Perception】收集单聊信息...");
    safeClick(text("消息").findOnce(), "消息Tab");

    let chats = [];
    let chatListFn = () => className("androidx.recyclerview.widget.RecyclerView").find().get(className("androidx.recyclerview.widget.RecyclerView").find().size() - 1);

    let offsetTable = buildOffsetTable(chatListFn);
    let chatKeyList = collectScrollableChildrenKey(
        chatListFn,
        node => {
            let titleNode = node.findOne(id("tv_title"));
            if (titleNode) {
                let t = titleNode.text();
                return !chatNameList.includes(t) && t !== "新关注我的" && t != "互动消息";
            }
            return false;
        },
        node => {
            return node.findOne(text("暂时没有更多了")) !== null
        },
    );

    chatKeyList.forEach(chatKey => {

        log("chatKey:" + chatKey);
        locateTargetObject(chatKey, chatListFn, offsetTable);

        // 一旦定位完成，可再次从 uiObjectFn() 查找当前屏幕中目标节点
        let container = chatListFn();
        if (!container) return;

        let childNodes = container.children(); // childNodes 是 UiObjectCollection

        // ② 遍历寻找目标 childNode
        let childNode = null;
        for (let i = 0; i < childNodes.size(); i++) {
            let candidate = childNodes.get(i);
            if (serializeNodeForOffset(candidate) === chatKey) {
                childNode = candidate;
                break;
            }
        }


        safeClick(childNode, "会话框");



        let messageListFn = () => className("androidx.recyclerview.widget.RecyclerView").visibleToUser();
        let messageOffsetTable = buildOffsetTable(messageListFn, null, "down");
        let messageKeyList = collectScrollableChildrenKey(
            messageListFn,
            null,
            null,
            null,
            "down"
        );

        let messages = [];

        messageKeyList.forEach(messageKey => {

            log("messageKey:" + messageKey);
            locateTargetObject(messageKey, messageListFn, messageOffsetTable);

            // 一旦定位完成，可再次从 uiObjectFn() 查找当前屏幕中目标节点
            let container = messageListFn();
            if (!container) return;

            let childNodes = container.children(); // childNodes 是 UiObjectCollection

            // ② 遍历寻找目标 childNode
            let childNode = null;
            for (let i = 0; i < childNodes.size(); i++) {
                let candidate = childNodes.get(i);
                if (serializeNodeForOffset(candidate) === messageKey) {
                    childNode = candidate;
                    break;
                }
            }
            let username;
            let text;
            let textNode = childNode.findOne(id("content_layout"));
            if (textNode) {
                text = textNode.text();
            }
            let userNode = childNode.findOne(descContains("的头像"));
            if (userNode) {
                username = userNode.desc();
            }
            messages.push({ username, text });

        });
        messages = messages.reverse();
        let preName;
        for (let i = 0; i < messages.size(); i++) {
            if (messages[i].username === null) {
                messages[i].username = preName;
            } else {
                preName = messages[i].username;
            }
        }
        chats.push({ messages });
        back();
    });

    return { chats };
}

/**
 * 群聊信息结构体
 * @typedef {Object} GroupChatInfo
 * @property {GroupChat[]} groupChats - 群聊列表
 *
 * @typedef {Object} groupChat
 * @property {Message[]} messages - 消息内容列表
 *
 * @typedef {Object} Message
 * @property {string} username - 用户名
 * @property {string} content - 消息文本内容
 */
function collectChatInfo(chatNameList) {
    log("【Perception】收集群信息...");
    safeClick(text("消息").findOnce(), "消息Tab");

    let chats = [];
    let chatListFn = () => className("androidx.recyclerview.widget.RecyclerView").find().get(className("androidx.recyclerview.widget.RecyclerView").find().size() - 1);

    let offsetTable = buildOffsetTable(chatListFn);
    let chatKeyList = collectScrollableChildrenKey(
        chatListFn,
        node => {
            let titleNode = node.findOne(id("tv_title"));
            if (titleNode) {
                let t = titleNode.text();
                return chatNameList.includes(t);
            }
            return false;
        },
        node => {
            return node.findOne(text("暂时没有更多了")) !== null
        },
    );

    chatKeyList.forEach(chatKey => {
        log("chatKey:" + chatKey);
        locateTargetObject(chatKey, chatListFn, offsetTable);

        // 一旦定位完成，可再次从 uiObjectFn() 查找当前屏幕中目标节点
        let container = chatListFn();
        if (!container) return;

        let childNodes = container.children(); // childNodes 是 UiObjectCollection

        // ② 遍历寻找目标 childNode
        let childNode = null;
        for (let i = 0; i < childNodes.size(); i++) {
            let candidate = childNodes.get(i);
            if (serializeNodeForOffset(candidate) === chatKey) {
                childNode = candidate;
                break;
            }
        }
        safeClick(childNode, "会话框");

        let messageListFn = () => className("androidx.recyclerview.widget.RecyclerView").visibleToUser();
        let messageOffsetTable = buildOffsetTable(messageListFn, null, "down");
        let messageKeyList = collectScrollableChildrenKey(
            messageListFn,
            null,
            null,
            null,
            "down"
        );

        let messages = [];

        messageKeyList.forEach(messageKey => {

            log("messageKey:" + messageKey);
            locateTargetObject(messageKey, messageListFn, messageOffsetTable);

            // 一旦定位完成，可再次从 uiObjectFn() 查找当前屏幕中目标节点
            let container = messageListFn();
            if (!container) return;

            let childNodes = container.children(); // childNodes 是 UiObjectCollection

            // ② 遍历寻找目标 childNode
            let childNode = null;
            for (let i = 0; i < childNodes.size(); i++) {
                let candidate = childNodes.get(i);
                if (serializeNodeForOffset(candidate) === messageKey) {
                    childNode = candidate;
                    break;
                }
            }
            let username;
            let text;
            let textNode = childNode.findOne(id("content_layout"));
            if (textNode) {
                text = textNode.text();
            }
            let userNode = childNode.findOne(descContains("的头像"));
            if (userNode) {
                username = userNode.desc();
            }
            messages.push({ username, text });

        });
        messages = messages.reverse();
        let preName;
        for (let i = 0; i < messages.size(); i++) {
            if (messages[i].username === null) {
                messages[i].username = preName;
            } else {
                preName = messages[i].username;
            }
        }
        chats.push({ messages });
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

        className("androidx.recyclerview.widget.RecyclerView").visibleToUser().scrollable().findOnce().children().forEach(msg => {
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
    log("【Perception】收集群聊名称...");
    safeClick(text("消息").findOnce(), "消息Tab");
    safeClick(desc("更多面板").findOnce(), "更多面板");
    safeClick(text("发起群聊").findOnce(), "发起群聊");
    safeClick(textMatches(/(选择一个已有群聊|已加入的群聊)/).findOnce(0), "选择一个已有群聊");
    let groupChatListView = className("androidx.recyclerview.widget.RecyclerView").visibleToUser().findOnce(0);
    groupChatListView = collectScrollableChildren(
        () => className("androidx.recyclerview.widget.RecyclerView").visibleToUser().findOnce(0),
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
