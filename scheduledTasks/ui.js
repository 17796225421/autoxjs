/**
 * ui.js
 * ---------------------------
 * 仅包含 UI 布局与按钮事件
 */

"ui";
require("./utils/log.js");
initLog();

// 引入实际处理定时任务的逻辑函数
let {
    getLocalJsFiles,
    fetchAllTasks,
    createDailyTask,
    createIntervalTask,
    deleteTask
} = require("./uiApi.js");

// =======================================
// 1. 初始化：获取同级目录下的所有js脚本 & 查询所有定时任务
// =======================================
let localJsFiles = getLocalJsFiles();   // 本地可添加的脚本列表
let allTasks = fetchAllTasks();         // 当前已有的全部定时任务

/**
 * 供 UI 下拉展示的任务信息
 * 格式： "ID:xxx => [类型] => 路径"
 */
function getTaskDisplayName(task) {
    let typeLabel = (task._type === "time") ? "每日" : "周期";
    return `ID:${task.id} => [${typeLabel}] => ${task.scriptPath}`;
}
let taskEntries = allTasks.map(getTaskDisplayName);

// =======================================
// 2. 布局
// =======================================
ui.layout(
    <vertical padding="16">
        <text text="【添加定时任务】" textColor="#000000" textSize="16sp" margin="0 0 8 0" />

        <text text="选择脚本文件" textColor="#333333" textSize="14sp"/>
        <spinner id="spinner_scripts" entries="{{localJsFiles.join('|')}}" />

        <text text="选择定时类型" textColor="#333333" textSize="14sp" margin="8 0"/>
        <spinner id="spinner_task_type" entries="每日定时|周期定时" />

        <horizontal id="layout_daily" margin="8 0 0 0" visibility="visible">
            <text text="小时:" textSize="14sp" />
            <input id="input_hour" text="12" hint="小时" inputType="number" w="60" margin="8 0"/>
            <text text="分钟:" textSize="14sp" />
            <input id="input_minute" text="0" hint="分钟" inputType="number" w="60" margin="8 0"/>
        </horizontal>

        <horizontal id="layout_interval" margin="8 0 0 0" visibility="gone">
            <text text="间隔(分钟):" textSize="14sp" />
            <input id="input_interval" text="30" hint="间隔分钟" inputType="number" w="80" margin="8 0"/>
        </horizontal>

        <button id="btn_add_task" text="添加定时任务" margin="8 0"/>


        <text text="【管理已有定时任务】" textColor="#000000" textSize="16sp" margin="16 0 8 0" />

        <text text="选择定时任务" textColor="#333333" textSize="14sp"/>
        <spinner id="spinner_tasks" entries="{{taskEntries.join('|')}}" />

        <button id="btn_delete_task" text="删除所选任务" margin="8 0"/>
    </vertical>
);

// =======================================
// 3. 根据“定时类型”选择，显示/隐藏 不同输入
// =======================================

ui.spinner_task_type.setOnItemSelectedListener({
    onItemSelected: function (parent, view, position, id) {
        if (position === 0) {
            // 选择 “每日定时”
            ui.layout_daily.setVisibility(View.VISIBLE);
            ui.layout_interval.setVisibility(View.GONE);
        } else {
            // 选择 “周期定时”
            ui.layout_daily.setVisibility(View.GONE);
            ui.layout_interval.setVisibility(View.VISIBLE);
        }
    }
});

// 需要导入 android.view.View
let View = android.view.View;

// =======================================
// 4. [添加任务] 按钮事件
// =======================================
ui.btn_add_task.on("click", () => {
    // 获取所选脚本
    let selectedFileIndex = ui.spinner_scripts.getSelectedItemPosition();
    let selectedFile = localJsFiles[selectedFileIndex];
    if (!selectedFile) {
        toast("请选择脚本文件");
        return;
    }

    // 获取当前选择的定时类型
    let taskTypeIndex = ui.spinner_task_type.getSelectedItemPosition();
    let result = null;

    if (taskTypeIndex === 0) {
        // 每日定时
        let hour = parseInt(ui.input_hour.text());
        let minute = parseInt(ui.input_minute.text());
        result = createDailyTask(selectedFile, hour, minute);
    } else {
        // 周期定时
        let intervalMinutes = parseInt(ui.input_interval.text());
        result = createIntervalTask(selectedFile, intervalMinutes);
    }

    if (result) {
        toast("添加定时任务成功 (ID=" + result.id + ")");
        // 重新刷新并更新任务下拉
        allTasks = fetchAllTasks();
        ui.spinner_tasks.setEntries(
            allTasks.map(getTaskDisplayName)
        );
    } else {
        toast("添加定时任务失败");
    }
});

// =======================================
// 5. [删除任务] 按钮事件
// =======================================
ui.btn_delete_task.on("click", () => {
    if (allTasks.length === 0) {
        toast("当前没有可删除的定时任务");
        return;
    }
    let selectedTaskIndex = ui.spinner_tasks.getSelectedItemPosition();
    let task = allTasks[selectedTaskIndex];
    let success = deleteTask(task);
    if (success) {
        toast("删除任务成功");
        // 重新刷新并更新任务下拉
        allTasks = fetchAllTasks();
        ui.spinner_tasks.setEntries(
            allTasks.map(getTaskDisplayName)
        );
    } else {
        toast("删除任务失败");
    }
});
