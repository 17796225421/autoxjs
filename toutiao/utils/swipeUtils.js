/**
 * swipeUtils.js
 * --------------
 * 向上滑动相关的工具函数
 */

/**
 * @desc 向上滑动指定屏幕个数，可为小数
 *       例如传入 2.5 表示先依次滑动整屏 2 次，再滑动半屏
 * @param {number} screenCount - 要滑动的屏幕数量（可为小数）
 * @param {number} duration - 单次滑动时长(毫秒)
 * @param {number} [rest=500] - 每次滑动后停顿的时长(毫秒)
 */
function swipeUpScreens(screenCount, duration, rest) {
    rest = rest || 500;
    // 1. 拆分成 整数部分 + 小数部分
    let intPart = Math.floor(screenCount);
    let fracPart = screenCount - intPart;

    // 2. 先进行整数部分的整屏滑动
    for (let i = 0; i < intPart; i++) {
        swipeUpOneScreen(duration);
        sleep(rest);
    }

    // 3. 如果还有小数部分，则再滑动一次“部分屏幕”
    if (fracPart > 0) {
        swipeUpFraction(fracPart, duration);
        sleep(rest);
    }
}

/**
 * @desc 向上滑动一整屏幕
 * @param {number} duration - 滑动时长(毫秒)
 */
function swipeUpOneScreen(duration) {
    let w = device.width;
    let h = device.height;
    // 这里根据实际需求，选择合适的起止点
    let startX = w * 0.5;
    let startY = h * 0.8;
    let endX = startX;
    let endY = h * 0.2;
    swipe(startX, startY, endX, endY, duration);
}

/**
 * @desc 向上滑动部分屏幕，fraction=0.5表示滑动半屏
 * @param {number} fraction - 需要滑动的屏幕占比(0~1)
 * @param {number} duration - 滑动时长(毫秒)
 */
function swipeUpFraction(fraction, duration) {
    let w = device.width;
    let h = device.height;
    // 从屏幕靠下的位置 startY=0.9*h 开始, 
    // 往上滑 fraction * (可滑动高度)
    let startX = w * 0.5;
    let startY = h * 0.9;
    let endX = startX;
    // 这里让可滑动高度大约是 0.8*h，按需也可以直接用 fraction*h
    let endY = startY - fraction * (h * 0.8);

    swipe(startX, startY, endX, endY, duration);
}

module.exports = {
    swipeUpScreens
};
