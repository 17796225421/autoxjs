/**
 * utilsTest.js
 * ---------------------------
 * 测试utils
 */

let { startMonitor } = require("./monitor.js");
startMonitor(descContains("评论"), "测试");

let { findTextByOcr } = require("./ocr.js");
let uiObjects = findTextByOcr("乐享大智");