let scheduler = require("./scheduler.js");

/**
 * 这里假设你在项目同级目录下有个 tasks/ 文件夹，专门放可选脚本
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
    log("basePath");
    log(basePath);
    let list = files.listDir(basePath, function (name) {
        return name.endsWith(".js") && files.isFile(files.join(basePath, name));
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
