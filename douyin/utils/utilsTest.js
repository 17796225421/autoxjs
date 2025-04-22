/**
 * utilsTest.js
 * ---------------------------
 * 测试utils
 */

// 监控到的节点，和实际调试运行的节点不一致，大概率是因为没有加.visibleToUser()
let { startMonitor } = require("./monitor.js");
startMonitor(className("androidx.recyclerview.widget.RecyclerView"), "测试");

let { findTextByOcr } = require("./ocr.js");
let uiObjects = findTextByOcr("乐享大智");