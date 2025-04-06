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
                required: ["actionType", "params"],
                properties: {
                    actionType: {
                        type: "string",
                        enum: ["like", "comment", "follow", "watchVideo", "sendMessage", "postVideo"]
                    },
                    params: {
                        type: "object",
                        oneOf: [
                            {
                                properties: {
                                    targetUser: { type: "string" }
                                },
                                required: ["targetUser"],
                                additionalProperties: false
                            },
                            {
                                properties: {
                                    commentText: { type: "string" }
                                },
                                required: ["commentText"],
                                additionalProperties: false
                            },
                            {
                                properties: {
                                    watchDuration: { type: "integer", minimum: 1000, maximum: 60000 },
                                    videoCategory: { type: "string" }
                                },
                                required: ["watchDuration"],
                                additionalProperties: false
                            },
                            {
                                properties: {
                                    message: { type: "string" }
                                },
                                required: ["message"],
                                additionalProperties: false
                            },
                            {
                                properties: {
                                    title: { type: "string" },
                                    videoPath: { type: "string" }
                                },
                                required: ["title", "videoPath"],
                                additionalProperties: false
                            },
                            {}
                        ]
                    }
                },
                additionalProperties: false
            }
        }
    },
    additionalProperties: false
};

module.exports = actionPlanSchema;
