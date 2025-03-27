/**
 * main.js
 * ---------------------------
 * 主脚本 + 定时任务管理示例
 */

// ===================== UI相关代码 =====================
"ui";
require("../mini-app-self/utils/log.js");
initLog();

ui.layout(
    <vertical padding="16">
        <text textSize="16sp" textColor="#000000" text="这是配置页面，仅包含几个演示按钮：" margin="0 0 0 16"/>
        
        {/* 启动/停止脚本 */}
        <button id="btn_start" text="启动脚本" margin="0 16"/>
        <button id="btn_stop" text="停止脚本" margin="0 16"/>

        <text text="-------- 定时任务管理 --------" textSize="16sp" textColor="#000000" margin="0 16"/>

        {/* 新增定时任务，下拉选择脚本 + 添加按钮 */}
        <horizontal>
            <spinner id="spinner_scripts" layout_weight="1" textSize="14sp"/>
            <button id="btn_addTask" text="添加定时任务" margin="0 8"/>
        </horizontal>

        {/* 查询到的定时任务列表，下拉选择 + 删除 + 更新按钮 */}
        <horizontal marginTop="8">
            <spinner id="spinner_tasks" layout_weight="1" textSize="14sp"/>
            <button id="btn_deleteTask" text="删除任务" margin="0 8"/>
            <button id="btn_updateTask" text="更新任务" margin="0 8"/>
        </horizontal>

    </vertical>
);

// ======（1）界面初始化逻辑：加载脚本列表、加载任务列表 ======
initScriptSpinner();  // 初始化 脚本列表 下拉
initTasksSpinner();   // 初始化 任务列表 下拉

// ======（2）按钮事件：新增、删除、更新 定时任务 ======
ui.btn_addTask.on("click", () => {
    let selectedScript = ui.spinner_scripts.getSelectedItem();
    if (!selectedScript) {
        toast("请选择一个脚本文件");
        return;
    }
    // 这里演示：在 2 分钟后执行该脚本（一次性定时任务）
    let millis = Date.now() + 2 * 60 * 1000;
    let absolutePath = files.join(files.cwd(), selectedScript);

    let addRes = $work_manager.addDisposableTask({
        path: absolutePath,
        date: millis,           // 9.2及以前版本用 `date` 字段
        // time: millis,        // 9.3及以后也可用time
        delay: 0,
        loopTimes: 1,
        interval: 0,
    });
    toastLog("已添加一次性定时任务: " + JSON.stringify(addRes));
    // 重新刷新一下任务下拉列表
    initTasksSpinner();
});

ui.btn_deleteTask.on("click", () => {
    let selectedItem = ui.spinner_tasks.getSelectedItem();
    if (!selectedItem || !selectedItem.id) {
        toast("当前无可删除的任务");
        return;
    }
    let id = selectedItem.id;
    // 判断是按时间还是按事件类型
    let isTimeTask = !selectedItem.action; // action存在则是按事件，反之是按时间
    let ret = isTimeTask ? $work_manager.removeTimedTask(id) : $work_manager.removeIntentTask(id);
    if (ret) {
        toastLog("已删除定时任务 ID: " + id);
    } else {
        toastLog("删除失败或找不到该定时任务 ID: " + id);
    }
    // 重新刷新一下任务下拉列表
    initTasksSpinner();
});

ui.btn_updateTask.on("click", () => {
    let selectedItem = ui.spinner_tasks.getSelectedItem();
    if (!selectedItem || !selectedItem.id) {
        toast("当前无可更新的任务");
        return;
    }
    let id = selectedItem.id;
    let isTimeTask = !selectedItem.action;

    // 演示更新方法：先删除，再用同参数(或新参数)重新创建
    // 注意：定时任务官方文档并没有提供“update”接口，只能“remove”后“add”。
    let removeOk = isTimeTask ? $work_manager.removeTimedTask(id) : $work_manager.removeIntentTask(id);
    if (!removeOk) {
        toastLog("删除原定时任务失败，无法更新");
        return;
    }
    toastLog("已删除原任务，准备重新添加新任务...");

    // 这里直接演示重新“加回”一个一次性任务，延迟改为 3 分钟后执行
    let newMillis = Date.now() + 3 * 60 * 1000;
    let newAdded = $work_manager.addDisposableTask({
        path: selectedItem.scriptPath,
        date: newMillis,
        delay: 0,
        loopTimes: 1,
        interval: 0,
    });
    toastLog("重新添加定时任务完成: " + JSON.stringify(newAdded));
    // 刷新任务下拉
    initTasksSpinner();
});

// ===================== 启动/停止脚本按钮逻辑 =====================
let isRunning = false;     // 表示脚本是否在运行
let scriptThread = null;   // 保存启动的线程，后面可以停止

ui.btn_start.on("click", () => {
    if (isRunning) {
        toast("脚本已在运行中，无需重复启动");
        return;
    }
    isRunning = true;

    scriptThread = threads.start(function() {
        while (isRunning) {
            try {
                mainLogic(); 
            } catch (e) {
                console.error("【主脚本捕获到异常】:", e);
            }
        }
        console.log("脚本已停止运行");
    });
});

ui.btn_stop.on("click", () => {
    if (!isRunning) {
        toast("脚本当前并未在运行");
        return;
    }

    isRunning = false;
    if (scriptThread) {
        scriptThread.interrupt();
        scriptThread = null;
    }
    toast("脚本已停止");
});

// ===================== 以上为 UI 代码（注释掉后，下方逻辑仍可独立跑） =====================


// ---------------------------------------------
// 以下是正常的任务逻辑 / 辅助函数 / 定时任务管理
// ---------------------------------------------
let { safeClick } = require("../mini-app-self/utils/clickUtils.js");
let { closeApp, openMiniProgram } = require("../mini-app-self/utils/app.js");
global.hasCapturePermission = false;

initScriptSpinner();
/**
 * 初始化 脚本下拉选择
 * 读取与 main.js 同目录下的所有 .js 文件
 */
function initScriptSpinner() {
    try {
        let dir = files.cwd(); // 当前脚本所在目录
        let allFiles = files.listDir(dir, function (name) {
            return name.endsWith(".js") && files.isFile(files.join(dir, name));
        });
        // 设置给 spinner
        ui.spinner_scripts.setItems(allFiles);
    } catch (e) {
        console.error(e);
        ui.spinner_scripts.setItems([]);
    }
}

/**
 * 初始化 任务下拉选择
 * 查询所有按时间运行 + 按广播触发 的定时任务，合并后放进下拉
 */
function initTasksSpinner() {
    try {
        let timeTasks = $work_manager.queryTimedTasks() || [];
        let intentTasks = $work_manager.queryIntentTasks() || [];
        let allTasks = timeTasks.concat(intentTasks);

        // 下拉列表需要字符串数组，这里我们给它包装成「对象 -> 字符串显示」
        // 也可以为 spinner 存储对象，但演示里做一个最小示例
        let displayList = allTasks.map(t => {
            // 为了在删除或更新时还能拿到ID，把它存到对象一起返回
            return {
                id: t.id,
                scriptPath: t.scriptPath,
                action: t.action,  // 有 action 说明是事件类型任务
                toString: function() {
                    // 自定义展示方式
                    let shortPath = t.scriptPath ? t.scriptPath.replace(files.cwd()+"/", "") : "";
                    if (t.action) {
                        // 广播定时任务
                        return `【ID:${t.id} 广播:${t.action}】${shortPath}`;
                    } else {
                        // 时间定时任务
                        return `【ID:${t.id} 时间:${formatTime(t.millis)}】${shortPath}`;
                    }
                }
            }
        });

        if (displayList.length === 0) {
            ui.spinner_tasks.setItems(["<当前无定时任务>"]);
        } else {
            ui.spinner_tasks.setItems(displayList);
        }
    } catch (e) {
        console.error(e);
        ui.spinner_tasks.setItems(["<出错，无法获取定时任务>"]);
    }
}

/**
 * 格式化时间戳
 */
function formatTime(millis) {
    if (!millis) return "";
    let d = new Date(millis);
    return (
        d.getFullYear() + "-" +
        (d.getMonth()+1).toString().padStart(2, "0") + "-" +
        d.getDate().toString().padStart(2, "0") + " " +
        d.getHours().toString().padStart(2, "0") + ":" +
        d.getMinutes().toString().padStart(2, "0") + ":" +
        d.getSeconds().toString().padStart(2, "0")
    );
}

/**
 * 循环执行指定任务
 * @param {Function} taskFunction 需要执行的函数
 * @param {number} loopCount 循环次数
 * @param {number} waitTime 循环结束后等待的时间(毫秒)
 */
function loopRunner(taskFunction, loopCount, waitTime) {
    const functionName = taskFunction.name || "匿名函数";
    log(`【${functionName}】开始循环，共循环 ${loopCount} 次`);

    for (let i = 1; i <= loopCount; i++) {
        log(`【${functionName}】第 ${i} 次开始执行`);
        taskFunction();
        log(`【${functionName}】第 ${i} 次循环结束，等待 ${waitTime} 毫秒`);
        sleep(waitTime);
    }
    log(`【${functionName}】循环执行结束`);
}

/**
 * 主循环逻辑
 * （在 ui.btn_start 被点击后，会在脚本线程里 while(isRunning) 不断调用）
 */
function mainLogic() {
    loopRunner(重启小程序, 100000, 10000);
}

/**
 * 具体逻辑：重新进入小程序
 */
function 重进小程序() {
    // 示例：点击“更多”、“重新进入小程序”，仅作演示
    safeClick(id("gk").findOnce(0).child(0), "更多");
    safeClick(id("m7g").indexInParent(3).depth(12).findOnce(1), "重新进入小程序");
}

/**
 * 具体逻辑：关闭微信后重新打开指定小程序
 */
function 重启小程序() {
    closeApp("微信"); 
    openMiniProgram("乐享大智");
    loopRunner(重进小程序, 10, 10000);
}
