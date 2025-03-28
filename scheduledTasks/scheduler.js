/**
 * scheduler.js
 * ---------------------------
 * 定时任务
 */
"ui";
// 引入所需类
importClass(android.os.PowerManager);
importClass(android.content.Context);
importClass(android.view.WindowManager);
importClass(android.content.Intent);
importClass(android.net.Uri);

/**
 * 这里用一个全局变量缓存 scheduler 单例，防止重复加载
 */
if (!global.__schedulerInstance) {
    (function () {

        const EXTERNAL_DIR = context.getExternalFilesDir(null).getAbsolutePath();
        const TASKS_FILE_PATH = files.join(EXTERNAL_DIR, "tasks.json");

        // 内存中的任务数组
        // 每个任务结构示例：
        // {
        //   id: 123,
        //   type: "daily" | "interval",
        //   scriptPath: "/sdcard/xxx.js",
        //   hour: 12,       // daily 任务特有
        //   minute: 0,      // daily 任务特有
        //   interval: 1800, // interval 任务特有(单位秒)
        //   nextRunTime: 1680000000000, // 毫秒时间戳，下次执行时间
        // }
        let tasks = [];

        // 用于记录当前是否有线程在运行任务（串行队列）
        let taskRunnerThread = null;

        /**
         * 初始化调度器：
         * 1. 请求后台常驻、忽略电池优化
         * 2. 保持屏幕常亮
         * 3. 加载本地任务
         * 4. 启动“每分钟”检查
         */
        function initScheduler() {
            requestBackgroundResidentPermission();
            keepScreenOn();
            loadTasksFromFile();

            // 每分钟执行一次检查
            setInterval(() => {
                log("开始检查定时任务");
                checkAndRunDueTasks();
            }, 60 * 1000);

            log("Scheduler initialized.");
        }

        /**
         * 请求后台常驻（忽略电池优化）
         */
        function requestBackgroundResidentPermission() {
            try {
                let pm = context.getSystemService(Context.POWER_SERVICE);
                if (!pm.isIgnoringBatteryOptimizations(context.getPackageName())) {
                    let intent = new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + context.getPackageName()));
                    // 这里启动Activity需要加FLAG_ACTIVITY_NEW_TASK，否则可能报错
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                }
            } catch (e) {
                log("申请忽略电池优化失败/或不支持", e);
            }
        }

        /**
         * 使屏幕常亮
         */
        function keepScreenOn() {
            try {
                // 在UI线程中设置FLAG_KEEP_SCREEN_ON
                ui.run(() => {
                    activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                });
            } catch (e) {
                log("设置屏幕常亮失败/或不支持", e);
            }
        }

        /**
         * 从本地文件加载任务列表
         */
        function loadTasksFromFile() {
            if (files.exists(TASKS_FILE_PATH)) {
                try {
                    let content = files.read(TASKS_FILE_PATH);
                    log("任务：" + content);
                    tasks = JSON.parse(content);
                } catch (e) {
                    log("读取tasks.json出错:", e);
                    tasks = [];
                }
            } else {
                log("tasks.json不存在");
                tasks = [];
            }
        }

        /**
         * 将当前内存中的任务写回到本地文件
         */
        function saveTasksToFile() {
            try {
                files.write(TASKS_FILE_PATH, JSON.stringify(tasks, null, 2));
            } catch (e) {
                log("写入tasks.json失败:", e);
            }
        }

        /**
         * 每分钟调用一次，用于检查并执行到期的任务
         * 关键：一次只开一个线程顺序执行，避免并发。
         */
        function checkAndRunDueTasks() {
            // 如果之前的任务执行线程还在跑，就直接跳过，避免并发
            if (taskRunnerThread && taskRunnerThread.isAlive()) {
                log("上一次任务队列还在执行，跳过本次检查");
                return;
            }

            let now = Date.now();
            // 找出所有到期任务
            let dueTasks = tasks.filter(task => {
                // 没有初始化 nextRunTime 的也算
                if (!task.nextRunTime) {
                    task.nextRunTime = calcNextRunTime(task);
                }
                return now >= task.nextRunTime;
            });

            if (dueTasks.length === 0) {
                // 如果没有到期任务就退出
                return;
            }

            // 按照 nextRunTime 升序排序一下，保证先到期的先执行
            dueTasks.sort((a, b) => a.nextRunTime - b.nextRunTime);

            // 启动一个子线程去顺序执行所有到期任务
            taskRunnerThread = threads.start(function () {
                for (let task of dueTasks) {
                    let fileName = task.scriptPath.split("/").pop();
                    log("执行任务 => " + fileName);

                    let engine = runScript(task.scriptPath);
                    // 等待脚本执行完成
                    if (engine) {
                        engine.waitFor();
                    } else {
                        // 如果没有获取到 engine（比如外部环境没有engine），
                        // 这里就直接模拟等待1秒。
                        sleep(1000);
                    }

                    // 脚本执行完后，更新它的下一次执行时间
                    if (task.type === "daily") {
                        task.nextRunTime = calcNextRunTime(task);
                    } else if (task.type === "interval") {
                        let intervalMs = task.interval * 1000;
                        // 为了避免当前时间已经超过多次间隔，这里循环修正
                        while (task.nextRunTime <= Date.now()) {
                            task.nextRunTime += intervalMs;
                        }
                    }
                }

                // 全部执行完，保存最新的 tasks 信息
                saveTasksToFile();
            });
        }

        /**
         * 对不同类型任务，计算下一次执行时间戳
         */
        function calcNextRunTime(task) {
            let now = new Date();
            if (task.type === "daily") {
                // 计算“当天的指定 hour:minute”对应的时间戳
                let next = new Date();
                next.setHours(task.hour, task.minute, 0, 0);

                // 如果这个时间已经过了，那就顺延到明天
                if (next.getTime() <= now.getTime()) {
                    next.setDate(next.getDate() + 1);
                }
                return next.getTime();

            } else if (task.type === "interval") {
                // 直接从当前时间 + 间隔
                let intervalMs = (task.interval || 60) * 1000; // 默认60秒
                return now.getTime() + intervalMs;
            }
            // 默认（防止意外）
            return now.getTime() + 60 * 1000;
        }

        /**
         * 执行脚本，返回一个 ScriptEngine 对象（可调用 waitFor）
         */
        function runScript(path) {
            try {
                if (typeof engines !== 'undefined') {
                    return engines.execScriptFile(path);
                } else {
                    log("模拟执行脚本:", path);
                    // 这种情况下没有 engine 可以返回，就返回 null
                    return null;
                }
            } catch (e) {
                log("执行脚本失败:", e);
                return null;
            }
        }

        /**
         * 添加一个每日定时任务
         */
        function addDailyTask(scriptPath, hour, minute) {
            let task = {
                id: genTaskId(),
                type: "daily",
                scriptPath: scriptPath,
                hour: hour,
                minute: minute,
                nextRunTime: 0
            };
            // 先计算一次 nextRunTime
            task.nextRunTime = calcNextRunTime(task);
            tasks.push(task);
            saveTasksToFile();
            return task;
        }

        /**
         * 添加一个周期任务（以“分钟”为单位）
         */
        function addIntervalTask(scriptPath, intervalMinutes) {
            let task = {
                id: genTaskId(),
                type: "interval",
                scriptPath: scriptPath,
                interval: intervalMinutes * 60, // 转成秒
                nextRunTime: 0
            };
            task.nextRunTime = calcNextRunTime(task);
            tasks.push(task);
            saveTasksToFile();
            return task;
        }

        /**
         * 根据任务ID删除任务
         */
        function removeTask(taskId) {
            let oldLength = tasks.length;
            tasks = tasks.filter(t => t.id !== taskId);
            let changed = (tasks.length !== oldLength);
            if (changed) {
                saveTasksToFile();
            }
            return changed;
        }

        /**
         * 获取全部任务
         */
        function getAllTasks() {
            return tasks;
        }

        /**
         * 生成唯一 ID（这里简单处理，可根据需要改成UUID等）
         */
        function genTaskId() {
            return Math.floor(Math.random() * 1000000000);
        }

        // 将调度器对象挂到全局，供后续 require 获取
        global.__schedulerInstance = {
            initScheduler,
            addDailyTask,
            addIntervalTask,
            removeTask,
            getAllTasks
        };

    })();
}

// 这里导出全局单例
module.exports = global.__schedulerInstance;
