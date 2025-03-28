// uiApi.js
let scheduler = require("./scheduler.js");

/**
 * 你之前使用的是 basePath = files.cwd() + "/tasks"
 * 这里可以继续使用，但请确认你的脚本目录
 * 如果你在项目里就是放在 /scripts 或 /tasks 里，也可以。
 */
const basePath = files.cwd() + "/tasks";

/**
 * 获取 tasks 目录下的所有 js 文件
 */
function getLocalJsFiles() {
    if (!files.exists(basePath)) {
        log("目录不存在，自动创建:", basePath);
        files.createWithDirs(basePath);
    }
    let list = files.listDir(basePath, function (name) {
        return name.endsWith(".js")
            && files.isFile(files.join(basePath, name));
    });
    return list;
}

/**
 * 返回当前所有任务
 */
function fetchAllTasks() {
    return scheduler.getAllTasks();
}

/**
 * 添加每日任务
 */
function createDailyTask(scriptFile, hour, minute) {
    let scriptPath = files.join(basePath, scriptFile);
    return scheduler.addDailyTask(scriptPath, hour, minute);
}

/**
 * 添加周期任务
 */
function createIntervalTask(scriptFile, intervalMinutes) {
    let scriptPath = files.join(basePath, scriptFile);
    return scheduler.addIntervalTask(scriptPath, intervalMinutes);
}

/**
 * 删除任务
 */
function deleteTask(task) {
    return scheduler.removeTask(task.id);
}

// 导出给 ui.js 调用
module.exports = {
    getLocalJsFiles,
    fetchAllTasks,
    createDailyTask,
    createIntervalTask,
    deleteTask
};
