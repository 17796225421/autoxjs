/**
 * main.js
 * ---------------【 主脚本 】----------------
 */

let { safeClick } = require("../utils/clickUtils.js");

safeClick(id("go"), "点击go按钮");
safeClick("重新进入\n小程序", "重新进入小程序");
