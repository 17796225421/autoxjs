/**
 * actionPlanSchema.js
 * ---------------------------
 * 使用纯JS定义JSON Schema结构，明确约束LLM的输出以及Executor的输入
 */
const actionPlanSchema = {
    type: "object",
    required: ["actions"],
    properties: {
        actions: {
            type: "array",
            items: {
                type: "object",
                required: ["类型", "参数"],
                properties: {
                    类型: {
                        type: "string",
                        enum: ["刷视频", "点赞", "收藏", "不感兴趣", "转发", "评论", "回复评论", "私信", "群聊"]
                    },
                    参数: {
                        oneOf: [
                            {
                                properties: {
                                    视频列表: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                每个观看时长秒: { type: "integer", minimum: 0, maximum: 600 },
                                                是否暂停: { type: "boolean" },
                                                是否跳进度: { type: "boolean" },
                                                跳转百分比: { type: "integer", minimum: 0, maximum: 100 }
                                            },
                                            required: ["每个观看时长秒", "是否暂停", "是否跳进度", "跳转百分比"]
                                        }
                                    }
                                },
                                required: ["视频列表"]
                            },
                            {
                                properties: {
                                    是否点赞: { type: "boolean" }
                                },
                                required: ["是否点赞"]
                            },
                            {
                                properties: {
                                    是否收藏: { type: "boolean" }
                                },
                                required: ["是否收藏"]
                            },
                            {
                                properties: {
                                    是否不感兴趣: { type: "boolean" }
                                },
                                required: ["是否不感兴趣"]
                            },
                            {
                                properties: {
                                    是否转发: { type: "boolean" },
                                    是否推荐: { type: "boolean" }
                                },
                                required: ["是否转发", "是否推荐"]
                            },
                            {
                                properties: {
                                    评论内容: { type: "string" },
                                    是否表情: { type: "boolean" },
                                    评论是否点赞: { type: "boolean" },
                                    评论是否不喜欢: { type: "boolean" }
                                },
                                required: ["评论内容", "是否表情", "评论是否点赞"]
                            },
                            {
                                properties: {
                                    回复评论内容: { type: "string" },
                                    回复内容: { type: "string" },
                                    是否表情: { type: "boolean" },
                                },
                                required: ["回复评论内容", "回复内容", "是否表情"]
                            },
                            {
                                properties: {
                                    私信名: { type: "string" },
                                    发送内容: { type: "string" }
                                },
                                required: ["私信名", "发送内容"]
                            },
                            {
                                properties: {
                                    群聊名: { type: "string" },
                                    群发内容: { type: "string" }
                                },
                                required: ["群聊名", "群发内容"]
                            }
                        ],
                    }
                },
            }
        }
    },
};
module.exports = actionPlanSchema;
