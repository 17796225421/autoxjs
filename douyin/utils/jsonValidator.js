// utils/jsonValidator.js
function validate(obj, schema) {
    // 为了简化起见，你可以直接使用 ajv-lite.js 库 (纯js实现，兼容AutoJS)
    // 如果严格不用任何库，则需手写校验逻辑（比较麻烦）
    // 此处推荐直接用轻量ajv-lite.js实现（非常小，纯JS，性能高）
    const Ajv = require('ajv');
    const ajv = new Ajv({ allErrors: true });
    const valid = ajv.validate(schema, obj);
    return { valid, errors: ajv.errors ? ajv.errors.map(e => e.message) : [] };
}

module.exports = { validate };
