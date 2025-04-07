const actionPlanSchema = {
    properties: {
        actions: {
            type: "array",
            items: {
                properties: {
                    类型: {
                        type: "string",
                        enum: ["刷视频", "点赞", "收藏", "不感兴趣", "转发", "推荐", "评论", "回复评论", "私信", "群聊"]
                    },
                    参数: {
                    }
                },
                allOf: [
                    {
                        if: { properties: { 类型: { const: "点赞" } } },
                        then: {
                            properties: {
                                参数: {
                                    properties: {
                                        是否点赞: { type: "boolean" }
                                    }
                                }
                            }
                        }
                    },
                    {
                        if: { properties: { 类型: { const: "收藏" } } },
                        then: {
                            properties: {
                                参数: {
                                    properties: {
                                        是否收藏: { type: "boolean" }
                                    }
                                }
                            }
                        }
                    },
                    {
                        if: { properties: { 类型: { const: "不感兴趣" } } },
                        then: {
                            properties: {
                                参数: {
                                    properties: {
                                        是否不感兴趣: { type: "boolean" }
                                    }
                                }
                            }
                        }
                    },
                    {
                        if: { properties: { 类型: { const: "转发" } } },
                        then: {
                            properties: {
                                参数: {
                                    properties: {
                                        是否转发: { type: "boolean" },
                                        想法: { type: "string" },
                                    }
                                }
                            }
                        }
                    },
                    {
                        if: { properties: { 类型: { const: "推荐" } } },
                        then: {
                            properties: {
                                参数: {
                                    properties: {
                                        是否推荐: { type: "boolean" }
                                    }
                                }
                            }
                        }
                    },
                    {
                        if: { properties: { 类型: { const: "评论" } } },
                        then: {
                            properties: {
                                参数: {
                                    properties: {
                                        是否评论: { type: "boolean" },
                                        评论内容: { type: "string" },
                                        是否表情: { type: "boolean" },
                                        评论是否点赞: { type: "boolean" },
                                        评论是否不喜欢: { type: "boolean" }
                                    }
                                }
                            }
                        }
                    },
                    {
                        if: { properties: { 类型: { const: "回复评论" } } },
                        then: {
                            properties: {
                                参数: {
                                    properties: {
                                        是否回复评论: { type: "boolean" },
                                        回复评论内容: { type: "string" },
                                        回复内容: { type: "string" },
                                        是否表情: { type: "boolean" }
                                    }
                                }
                            }
                        }
                    },
                    {
                        if: { properties: { 类型: { const: "私信" } } },
                        then: {
                            properties: {
                                参数: {
                                    properties: {
                                        私信名: { type: "string" },
                                        发送内容: { type: "string" }
                                    }
                                }
                            }
                        }
                    },
                    {
                        if: { properties: { 类型: { const: "群聊" } } },
                        then: {
                            properties: {
                                参数: {
                                    properties: {
                                        群聊名: { type: "string" },
                                        群发内容: { type: "string" }
                                    }
                                }
                            }
                        }
                    },
                    {
                        if: { properties: { 类型: { const: "刷视频" } } },
                        then: {
                            properties: {
                                参数: {
                                    properties: {
                                        视频列表: {
                                            type: "array",
                                            minItems: 5,
                                            maxItems: 20,
                                            items: {
                                                properties: {
                                                    观看时长秒: { type: "integer", minimum: 2, maximum: 8 },
                                                    是否暂停: { type: "boolean" },
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
};

module.exports = actionPlanSchema;
