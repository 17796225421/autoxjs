/**
 * uiApi.js
 * ---------------------------
 * 定时任务管理的逻辑封装
 */

const basePath = files.cwd() + "/tasks";

/**
 * 获取与 main.js 同级目录下的所有 js 文件列表
 */
function getLocalJsFiles() {
    let list = files.listDir(basePath, function (name) {
        // 过滤：只要 .js 文件，且排除 main.js 自身
        return name.endsWith(".js")
            && files.isFile(files.join(basePath, name))
            && name !== "main.js";
    });
    return list;
}

/**
 * 获取所有每日定时任务（time 类型）
 */
function fetchDailyTasks() {
    try {
        // 官方文档：不传任何参数时，返回全部 time 类型定时任务
        let tasks = $work_manager.queryTimedTasks() || [];
        // 这里可以额外给每个任务打上一个 type 标识，方便后面删除时区分
        tasks.forEach(t => {
            t._type = "time";
        });
        return tasks;
    } catch (e) {
        console.error("查询每日定时任务失败:", e);
        return [];
    }
}

/**
 * 获取所有周期定时任务（interval 类型）
 */
function fetchIntervalTasks() {
    try {
        // 假设 $work_manager.queryIntervalTasks() 可获取所有 interval 类型的任务
        let tasks = $work_manager.queryIntervalTasks() || [];
        tasks.forEach(t => {
            t._type = "interval";
        });
        return tasks;
    } catch (e) {
        console.error("查询周期定时任务失败:", e);
        return [];
    }
}

/**
 * 合并获取所有任务
 */
function fetchAllTasks() {
    let daily = fetchDailyTasks();        // time 类型任务
    let interval = fetchIntervalTasks();  // interval 类型任务
    // 合并为一个数组
    return daily.concat(interval);
}

/**
 * 添加一个“每日某时某分”运行的定时任务
 * @param {string} scriptFile 选中的脚本文件名（仅文件名）
 * @param {number} hour 小时
 * @param {number} minute 分钟
 */
function createDailyTask(scriptFile, hour, minute) {
    try {
        let scriptPath = files.join(basePath, scriptFile);
        let date = new Date(0, 0, 0, hour, minute, 0);

        return $work_manager.addDailyTask({
            path: scriptPath,
            time: date,
            delay: 0,       // 如无需延迟可置0
            loopTimes: 1,   // 执行次数
            interval: 0     // 执行间隔
        });
    } catch (e) {
        console.error("添加每日定时任务失败:", e);
        return null;
    }
}

/**
 * 添加一个“周期性”运行的定时任务
 * @param {string} scriptFile 选中的脚本文件名（仅文件名）
 * @param {number} intervalMinutes 间隔（分钟）
 */
function createIntervalTask(scriptFile, intervalMinutes) {
    try {
        let scriptPath = files.join(basePath, scriptFile);
        // 这里假设 times=0 表示无限次循环，具体视你的 Auto.js Pro 版本文档
        return $work_manager.addIntervalTask({
            path: scriptPath,
            interval: intervalMinutes * 60 * 1000, // 转毫秒
            times: 0,   // 0 表示不限制次数，也可自行指定
            delay: 0
        });
    } catch (e) {
        console.error("添加周期定时任务失败:", e);
        return null;
    }
}

/**
 * 删除一条定时任务
 * 由于每日定时与周期定时的 remove 接口不同，这里根据任务类型分别处理
 * @param {object} task 任务对象(需要包含id, _type等信息)
 */
function deleteTask(task) {
    try {
        let success = false;
        if (task._type === "time") {
            success = $work_manager.removeTimedTask(task.id);
        } else if (task._type === "interval") {
            success = $work_manager.removeIntervalTask(task.id);
        }
        return success;
    } catch (e) {
        console.error("删除定时任务失败:", e);
        return false;
    }
}

module.exports = {
    getLocalJsFiles,
    fetchAllTasks,
    createDailyTask,
    createIntervalTask,
    deleteTask
};
