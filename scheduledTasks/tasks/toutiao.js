/**
 * toutiao.js
 */

let { safeClick } = require("../utils/clickUtils.js");
let { openApp, closeApp } = require("../utils/app.js");
let { loopRunner } = require("../utils/loop.js");

mainLogic();

function mainLogic() {
    loopRunner(重启头条, 3, 10000);
}

function 重启头条() {
    closeApp("今日头条");
    openApp("今日头条");
    safeClick(text("我的").findOnce(0).parent(), "我的tab", 5000);
    while (true) {
        safeClick(text("全部功能").findOnce(0), "全部功能", 5000);
        safeClick(text("草稿箱").findOnce(0), "草稿箱", 5000);
        if (id("cfx").findOnce(0).child(0) === null) {
            break;
        }
        safeClick(id("cfx").findOnce(0).child(0), "第0个草稿", 10000);
        safeClick(text("定时发布").findOnce(0).parent(), "定时发布", 5000);
        let [dateStr, hourStr, minuteStr] = getRandomFutureTime();
        // 分别设置日期、小时、分钟
        setPickerValueByCalculation("jyl", dateStr);
        setPickerValueByCalculation("jyp", hourStr);
        setPickerValueByCalculation("jyq", minuteStr);
        safeClick(text("确定").findOnce(0), "确定", 5000);
        safeClick(text("发布").findOnce(0), "发布", 5000);
    }

}

/**
 * 获取未来随机时间（2~7小时后），并返回【日期列, 小时列, 分钟列】
 * @returns {Array<string>} 形如 ["3月29日 周六", "09", "38"]
 */
function getRandomFutureTime() {
    // 1. 获取当前时间
    let now = new Date();

    // 2. 生成随机偏移量（单位：分钟），范围 [120, 420]，即 [2h, 7h]
    let offsetMinutes = Math.floor(Math.random() * (420 - 120 + 1)) + 120;

    // 3. 计算目标时间：当前时间 + 随机偏移量
    let future = new Date(now.getTime() + offsetMinutes * 60 * 1000);

    // 4. 格式化输出
    //   4.1 构造中文星期映射表（注意：getDay()返回 0~6，周日~周六）
    let weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

    //   4.2 获取 年-月-日-星期-小时-分钟
    let month = future.getMonth() + 1;  // getMonth() 从0开始
    let date = future.getDate();
    let dayOfWeek = weekDays[future.getDay()];
    let hour = future.getHours();
    let minute = future.getMinutes();

    //   4.3 补齐前导零
    let hourStr = hour < 10 ? "0" + hour : "" + hour;
    let minuteStr = minute < 10 ? "0" + minute : "" + minute;

    //   4.4 组装成需要的格式
    let dateStr = `${month}月${date}日 ${dayOfWeek}`;
    // 返回形如 ["3月29日 周六", "09", "38"]
    return [dateStr, hourStr, minuteStr];
}/**
 * @desc 通过一次性计算需要滑动的步数，完成设置 Picker 的目标值
 * @param {string} columnId - 该 Picker 列的控件ID（如 'jyl', 'jyp', 'jyq' 等）
 * @param {string} targetText - 目标值的字符串（如 '3月29日 周四' / '09' / '38'）
 *                             对于日期列就是带"几月几日 周x"的完整字符串，
 *                             对于小时分钟就是两位字符串('00'~'23', '00'~'59')。
 * @returns {boolean} 是否成功完成滑动（此处统一返回true表示完成，若要更准确可自行拓展判断）
 */
function setPickerValueByCalculation(columnId, targetText) {
    let columnUI = id(columnId).findOnce(3000);
    if (!columnUI) {
        log(`【setPickerValueByCalculation】未找到控件ID=${columnId}，无法执行`);
        return false;
    }

    // 1. 读当前选中内容（根据实际UI可能需要改写）
    let currentValStr = columnUI.text() || columnUI.desc();
    if (!currentValStr) {
        log(`【setPickerValueByCalculation】无法读取当前选中内容`);
        return false;
    }
    currentValStr = currentValStr.trim();
    log(`当前列ID=${columnId}, 当前值=${currentValStr}, 目标值=${targetText}`);

    // 2. 针对三列分别处理
    if (columnId === "jyl") {
        // --- 第一列（日期），只可能移动0次或1次 ---
        if (currentValStr.includes(targetText)) {
            // 已经匹配，则不必滑动
            log("日期列已匹配，无需滑动");
            return true;
        } else {
            // 不匹配则只滑一次
            log("日期列不匹配，上滑一次");
            swipeOneStepUp(columnUI, 0.2, 300);
            // 此处如果想更严谨，可在滑动后做一次 sleep 再确认
            sleep(600);
            return true;
        }

    } else if (columnId === "jyp") {
        // --- 第二列（小时），循环区间[0..23] ---
        let currentHour = parseInt(currentValStr, 10);
        let targetHour = parseInt(targetText, 10);
        if (isNaN(currentHour) || isNaN(targetHour)) {
            log("无法解析小时数字，终止");
            return false;
        }
        let distance = (targetHour - currentHour + 24) % 24;
        log(`小时列: 需要向上滑动 ${distance} 步`);
        for (let i = 0; i < distance; i++) {
            swipeOneStepUp(columnUI, 0.2, 300);
            sleep(500); // 每次滑动后等待一小段时间
        }
        return true;

    } else if (columnId === "jyq") {
        // --- 第三列（分钟），循环区间[0..59] ---
        let currentMin = parseInt(currentValStr, 10);
        let targetMin = parseInt(targetText, 10);
        if (isNaN(currentMin) || isNaN(targetMin)) {
            log("无法解析分钟数字，终止");
            return false;
        }
        let distance = (targetMin - currentMin + 60) % 60;
        log(`分钟列: 需要向上滑动 ${distance} 步`);
        for (let i = 0; i < distance; i++) {
            swipeOneStepUp(columnUI, 0.2, 300);
            sleep(500);
        }
        return true;

    } else {
        log(`未知的columnId=${columnId}，无法计算滑动`);
        return false;
    }
}


/**
 * @desc 执行一次“向上”滑动，默认滑动距离占控件高度的0.2，滑动时长300ms
 *       （你的原函数叫 swipeOneStepDown，但里头实际是 startY > endY，故这里改个更直观的名字）
 * @param {UiObject} uiObject - 需要滑动的 UI 控件
 * @param {number} fraction - 滑动距离 = fraction * uiObject.bounds().height()
 * @param {number} duration - 滑动时长(毫秒)
 */
function swipeOneStepUp(uiObject, fraction, duration) {
    let b = uiObject.bounds();
    if (!b) {
        log("swipeOneStepUp: 无效的控件bounds，无法滑动");
        return false;
    }
    let startX = random(b.left + 5, b.right - 5);
    // 假设从中间偏下一点开始 => 向上滑
    let startY = b.top + Math.floor(b.height() * 0.7);
    let endX = startX;
    let endY = startY - Math.floor(b.height() * fraction);

    log(`swipeOneStepUp: (${startX}, ${startY}) -> (${endX}, ${endY}), duration=${duration}`);
    swipe(startX, startY, endX, endY, duration);
    return true;
}

module.exports = {
    mainLogic
};