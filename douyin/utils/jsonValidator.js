/**
 * jsonValidator.js
 * ---------------------------
 * 提供 validate(data, schema) 方法，用于校验 JSON 结构的正确性
 * 
 * 在此工程中，主要用于校验 LLM 返回的 actionPlan 是否符合 actionPlanSchema
 * 
 */

/**
 * validate - 校验 data 是否符合给定的 schema
 * @param {any} data - 待校验的对象或值
 * @param {object} schema - schema 结构 (类似 JSON Schema，但仅作示范)
 * @returns {object} 形如 { valid: boolean, errors: string[] }
 */
function validate(data, schema) {
    let errors = [];

    // =============== 1. 简易检查根节点类型 ===============
    if (schema.type && !checkType(data, schema.type)) {
        errors.push(`根节点期望类型为【${schema.type}】，实际类型为【${getType(data)}】`);
    }

    // =============== 2. 检查必需字段 required ===============
    if (Array.isArray(schema.required)) {
        for (let requiredKey of schema.required) {
            if (data == null || !data.hasOwnProperty(requiredKey)) {
                errors.push(`缺少必需字段 '${requiredKey}'`);
            }
        }
    }

    // =============== 3. 若有 properties，递归校验每个字段 ===============
    if (schema.properties && typeof schema.properties === "object") {
        for (let key in schema.properties) {
            let propSchema = schema.properties[key];
            let value = data ? data[key] : undefined;

            // 非必需字段若未定义，跳过
            if (value === undefined) {
                continue;
            }

            // 检查字段类型
            if (propSchema.type) {
                if (!checkType(value, propSchema.type)) {
                    errors.push(`字段 '${key}' 的类型应为【${propSchema.type}】，实际为【${getType(value)}】`);
                    continue;
                }
            }

            // 若是 object 或 array，需要进一步检查子项
            if (propSchema.type === "object") {
                // 递归校验
                let subValidation = validate(value, propSchema);
                if (!subValidation.valid) {
                    // 将子错误前面加上字段提示
                    subValidation.errors.forEach(errMsg => {
                        errors.push(`属性 '${key}' -> ${errMsg}`);
                    });
                }
            } else if (propSchema.type === "array") {
                // 校验数组元素
                if (propSchema.items && Array.isArray(value)) {
                    value.forEach((element, index) => {
                        let itemValidation = validate(element, propSchema.items);
                        if (!itemValidation.valid) {
                            itemValidation.errors.forEach(errMsg => {
                                errors.push(`数组 '${key}' [index=${index}] -> ${errMsg}`);
                            });
                        }
                    });
                }
            }
        }
    }

    // =============== 4. 返回结果 ===============
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * 简易判断某个数据是否符合 type (string / number / object / array / boolean 等)
 * @param {any} data - 值
 * @param {string} expectedType - 期望类型
 * @returns {boolean}
 */
function checkType(data, expectedType) {
    // 处理 array
    if (expectedType === "array") {
        return Array.isArray(data);
    }
    // 其余情况统一用 typeof 判定
    return getType(data) === expectedType;
}

/**
 * 获取数据实际类型的小工具
 * @param {any} data
 * @returns {string} 返回 "string" / "object" / "array" / "number" / "boolean" / "function" / "undefined" 等
 */
function getType(data) {
    if (data === null) return "null";
    if (Array.isArray(data)) return "array";
    return typeof data; 
}

module.exports = {
    validate
};
