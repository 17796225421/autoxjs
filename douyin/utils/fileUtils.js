/**
 * fileUtils.js
 * ---------------------------
 * 文件工具类：提供读取和保存 JSON 文件的通用方法
 * 用于项目中所有数据的持久化存储与读取
 */

let FILE_ENCODING = 'utf-8';

/**
 * 保存 JSON 数据到文件中
 * @param {string} filePath - 文件路径
 * @param {Object} data - 要保存的数据对象
 * @returns {boolean} 是否成功
 */
function saveJsonToFile(filePath, data) {
    try {
        let jsonData = JSON.stringify(data, null, 2);
        files.ensureDir(filePath);
        files.write(filePath, jsonData, FILE_ENCODING);
        log(`【fileUtils】数据成功保存到文件: ${filePath}`);
        return true;
    } catch (e) {
        log(`【fileUtils】保存文件出错(${filePath})：`, e);
        return false;
    }
}

/**
 * 从文件中读取 JSON 数据
 * @param {string} filePath - 文件路径
 * @param {Object} defaultValue - 默认返回的数据（若文件不存在）
 * @returns {Object} 读取到的数据对象
 */
function readJsonFromFile(filePath, defaultValue = {}) {
    try {
        if (!files.exists(filePath)) {
            log(`【fileUtils】文件不存在(${filePath}), 返回默认值`);
            return defaultValue;
        }
        let jsonData = files.read(filePath, FILE_ENCODING);
        return JSON.parse(jsonData);
    } catch (e) {
        log(`【fileUtils】读取文件出错(${filePath})：`, e);
        return defaultValue;
    }
}

module.exports = {
    saveJsonToFile,
    readJsonFromFile
};
