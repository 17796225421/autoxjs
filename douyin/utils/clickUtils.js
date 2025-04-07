/**
 * clickUtils.js
 * --------------
 * 点击相关的工具函数 - 基于正态分布
 */

/**
 * 使用 Box-Muller 变换生成一个服从 N(0,1) 的随机数
 */
function randomGaussian() {
    // Math.random() 返回 [0,1)
    let u1 = Math.random();
    let u2 = Math.random();
    // Box-Muller 变换
    let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z;
}

/**
 * 在 [min, max] 区间内生成一个服从正态分布的随机数
 * - mean: 均值
 * - stdDev: 标准差
 * - maxTry: 最多尝试采样次数
 */
function randomGaussianInRange(min, max, mean, stdDev, maxTry) {
    maxTry = maxTry || 10;
    for (let i = 0; i < maxTry; i++) {
        let z = randomGaussian();         // 先拿到标准正态
        let val = z * stdDev + mean;      // 线性变换 -> N(mean, stdDev^2)

        if (val >= min && val <= max) {
            return val;
        }
    }
    // 如果多次采样都不在区间内，使用普通随机退化处理
    return random(min, max);
}

/**
 * 通用安全点击函数（正态分布点击）
 * @param {UiObject} uiObject - 调用处已经拿到的目标控件
 * @param {string} desc - 日志描述信息
 * @param {number} waitTime - 点击后需要等待的毫秒数
 * @returns {boolean} 是否点击成功
 */
function safeClick(uiObject, desc, waitTime) {
    desc = desc || "未知控件";
    waitTime = waitTime || 3000;

    if (!uiObject) {
        log(`safeClick: 未传入有效 UiObject -> 【${desc}】`);
        return false;
    }

    let b = uiObject.bounds();
    if (!b || b.width() <= 0 || b.height() <= 0) {
        log(`safeClick 失败，【${desc}】的 bounds 无效: ${b}`);
        return false;
    }

    // 设定正态分布的基础参数
    // 尝试让点击集中在中间区域，偶尔分布到边缘
    let xMean = (b.left + b.right) / 2;             // X 坐标均值
    let yMean = (b.top + b.bottom) / 2;             // Y 坐标均值
    let xStdDev = (b.right - b.left) / 6;           // X 坐标标准差
    let yStdDev = (b.bottom - b.top) / 6;           // Y 坐标标准差

    // 最多尝试点击 3 次
    for (let attempt = 1; attempt <= 3; attempt++) {
        // 使用正态分布生成 X/Y
        let x = Math.round(
            randomGaussianInRange(b.left, b.right, xMean, xStdDev)
        );
        let y = Math.round(
            randomGaussianInRange(b.top, b.bottom, yMean, yStdDev)
        );

        log(`第 ${attempt} 次尝试点击【${desc}】，正态分布坐标=(${x}, ${y})`);
        click(x, y);

        // 点击后等待
        sleep(waitTime);

        // 如果逻辑只要点一次就 OK，可以直接 return
        // 如果需要在此判断点击后是否真的成功，再决定要不要重试
        return true;
    }

    // 理论上不会到这里
    return false;
}

/**
 * 安全长按函数（模拟真实用户行为，正态分布随机点击）
 * @param {number} duration - 长按的持续时间（毫秒）
 * @param {string} desc - 动作描述，用于日志记录
 * @param {Object} [areaRatio={x:[0.4,0.6],y:[0.4,0.6]}] - 屏幕区域比例范围（默认屏幕中间附近）
 * @returns {boolean} 是否成功完成长按
 */
function safeLongPress(duration, desc, areaRatio) {
    areaRatio = areaRatio || {
        x: [0.4, 0.6],
        y: [0.4, 0.6]
    };

    const width = device.width;
    const height = device.height;

    const pressX = randomGaussian(width * areaRatio.x[0], width * areaRatio.x[1]);
    const pressY = randomGaussian(height * areaRatio.y[0], height * areaRatio.y[1]);

    log(`【safeLongPress】${desc}，坐标=(${pressX.toFixed(1)},${pressY.toFixed(1)})，时长=${duration}ms`);

    let result = press(pressX, pressY, duration);
    sleep(500); // 稍微等待，保证动作充分完成

    return result;
}

module.exports = {
    safeClick,
    safeLongPress,
};
