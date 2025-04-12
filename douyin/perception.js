/**
 * perception.js
 * ---------------------------
 * 感知层：从视频、评论、单聊、群聊等界面获取信息
 * 用于LLM Agent 决策，以实现推广自动化兼职项目、收取学费，
 * 以及推广金银珠宝首饰等业务，精准吸引兼职赚钱和高价值消费人群。
 * 基于 AutoJS + LLM 智能决策，支持多号、多App自动化引流养号
 */

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

    let perceptionData = {
        videoInfo: collectVideoInfo(),
        firstComment: collectFirstComment(),
        commentInfo: collectCommentInfo(),
        chatInfo: collectChatInfo(),
        groupChatInfo: collectGroupChatInfo()
    };

    log("【Perception】数据整合完成：" + JSON.stringify(perceptionData));
    return perceptionData;
}

/**
 * 视频信息结构体
 * @typedef {Object} VideoInfo
 * @property {string} desc - 视频的描述信息
 */
function collectVideoInfo() {
    log("【Perception】收集视频信息...");
    let descElement = id("desc").findOne(3000);
    return { desc: descElement ? descElement.text() : "" };
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
    safeClick(descContains("评论").findOne().parent(), "评论区");
    safeClick(descContains("放大评论区").findOne(), "放大评论区");

    // 获取评论区首条评论
    let commentListView = className("androidx.recyclerview.widget.RecyclerView").findOnce(0);

    let firstCommentNode = commentListView.child(0);
    let username=firstCommentNode.child(1).child(2).text();
    let content=firstCommentNode.child(1).child(3).text();

    // 点击首条评论展开回复
    safeClick(commentListView.child(1), "展开首条评论回复");

    // 收集回复列表
    let replies = [];
    let replyListView = className("android.recyclerview.widget.RecyclerView").findOne(3000);

    if (replyListView) {
        replyListView.children().forEach(replyNode => {
            let replyContent = replyNode.findOne(id("content"))?.text() || "";
            if (replyContent) {
                replies.push({ content: replyContent });
            }
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
    safeClick(descContains("评论").findOne().parent(), "评论区");
    safeClick(descContains("放大评论区").findOne(), "放大评论区");

    let comments = [];
    let commentNodes = className("android.recyclerview.widget.RecyclerView").findOne(5000).children();

    commentNodes.forEach(node => {
        let username = node.findOne(id("username"))?.text() || "未知";
        let content = node.findOne(id("content"))?.text() || "";
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
 * @property {Message[]} messages - 消息内容列表
 *
 * @typedef {Object} Message
 * @property {boolean} isMe - 是否为本人发送（true为自己发送，false为对方发送）
 * @property {string} content - 消息文本内容
 */
function collectChatInfo() {
    log("【Perception】收集单聊信息...");
    safeClick(text("消息").findOne(), "消息Tab");

    let chats = [];
    let chatList = className("android.recyclerview.widget.RecyclerView").findOne().children();

    chatList.forEach(chat => {
        safeClick(chat, "打开单聊");
        let messages = [];

        className("androidx.recyclerview.widget.RecyclerView").scrollable().findOne().children().forEach(msg => {
            let senderText = msg.findOne(id("message_author"))?.text() || "";
            let isMe = senderText.includes("我");
            let content = msg.findOne(id("message_content"))?.text() || "";
            messages.push({ isMe, content });
        });

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
function collectGroupChatInfo() {
    log("【Perception】收集群聊信息...");
    safeClick(text("群聊").findOne(), "群聊Tab");

    let messages = [];
    let groupList = className("android.recyclerview.widget.RecyclerView").findOne().children();

    groupList.forEach(group => {
        safeClick(group, "打开群聊");

        className("androidx.recyclerview.widget.RecyclerView").scrollable().findOne().children().forEach(msg => {
            let senderText = msg.findOne(id("message_author"))?.text() || "";
            let isMe = senderText.includes("我");
            let content = msg.findOne(id("message_content"))?.text() || "";
            messages.push({ isMe, content });
        });

        back();
    });

    return { messages };
}

module.exports = {
    collectInfo
};
