/**
 * utilsTest.js
 * ---------------------------
 * 测试utils
 */

let { startMonitor } = require("./monitor.js");
startMonitor(className("androidx.recyclerview.widget.RecyclerView"), "测试");

let { findTextByOcr } = require("./ocr.js");
let uiObjects = findTextByOcr("乐享大智");