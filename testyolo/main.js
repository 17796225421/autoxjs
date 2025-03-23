// 杀死当前同名脚本 see AutoScriptBase/lib/killMyDuplicator
(() => { let g = engines.myEngine(); var e = engines.all(), n = e.length; let r = g.getSource() + ""; 1 < n && e.forEach(e => { var n = e.getSource() + ""; g.id !== e.id && n == r && e.forceStop() }) })();

if (!requestScreenCapture()) {
  toastLog('请求截图权限失败')
  exit()
}


let onnxInstance = null
initYoloInstances()
runtime.getImages().initOpenCvIfNeeded();

// 识别结果和截图信息
let result = []
let img = null
let running = true
let capturing = false

/**
 * 截图并识别OCR文本信息
 */
function captureAndDetect () {
  capturing = true
  img = captureScreen()
  if (!img) {
    toastLog('截图失败')
  }
  let start = new Date()
  result = onnxInstance.forward(img)
  console.verbose('识别结果：' + JSON.stringify(result))
  toastLog('耗时' + (new Date() - start) + 'ms')
  img && img.recycle()
  capturing = false
}

// 初始化onnx yolo对象
function initYoloInstances () {

  let model_path = files.path('./forest_lite.onnx')
  if (!files.exists(model_path)) {
    toastLog('请确认已下载了模型文件')
    exit()
  }
  let plugin_yolo = (() => {
    try {
      return plugins.load('com.tony.onnx.yolov8')
    } catch (e) {
      toastLog('未安装插件，加载失败' + e)
      exit()
    }
  })()
  let onnxInit = plugin_yolo.init({
    // 模型文件地址
    modelPath: model_path,
    // 模型入参图片大小
    imageSize: 320,
    // 识别阈值
    confThreshold: 0.7,
    // 模型标签，不需要完全和模型匹配 可以比模型少
    labels: [
      "cannot",
      "collect",
      "countdown",
      "help_revive",
      "item",
      "tree",
      "water",
      "waterBall",
      "stroll_btn",
    ]
  })
  if (onnxInit) {
    onnxInstance = plugin_yolo.getInstance()
  } else {
    toastLog('onnx初始化失败')
  }
}


// captureAndDetect()

// 获取状态栏高度
let offset = -getStatusBarHeightCompat()

// 绘制识别结果
let window = floaty.rawWindow(
  <canvas id="canvas" layout_weight="1" />
);

// 设置悬浮窗位置
ui.post(() => {
  window.setPosition(0, offset)
  window.setSize(device.width, device.height)
  window.setTouchable(false)
})

// 操作按钮
let clickButtonWindow = floaty.rawWindow(
  <vertical>
    <button id="captureAndDetect" text="截图识别" />
    <button id="closeBtn" text="退出" />
  </vertical>
);
ui.run(function () {
  clickButtonWindow.setPosition(device.width / 2 - ~~(clickButtonWindow.getWidth() / 2), device.height * 0.65)
})

// 点击识别
clickButtonWindow.captureAndDetect.click(function () {
  if (capturing) {
    return
  }
  result = []
  let oldPosition = {
    x: clickButtonWindow.getX(),
    y: clickButtonWindow.getY(),
  }
  ui.run(function () {
    clickButtonWindow.setPosition(device.width, device.height)
  })
  setTimeout(() => {
    captureAndDetect()
    ui.run(function () {
      clickButtonWindow.setPosition(oldPosition.x, oldPosition.y)
    })
  }, 500)
})

// 点击关闭
clickButtonWindow.closeBtn.setOnTouchListener(new TouchController(clickButtonWindow, () => {
  exit()
}).createListener())

let Typeface = android.graphics.Typeface
let paint = new Paint()
paint.setStrokeWidth(1)
paint.setTypeface(Typeface.DEFAULT_BOLD)
paint.setTextAlign(Paint.Align.LEFT)
paint.setAntiAlias(true)
paint.setStrokeJoin(Paint.Join.ROUND)
paint.setDither(true)
window.canvas.on('draw', function (canvas) {
  if (!running || capturing) {
    return
  }
  // 清空内容
  canvas.drawColor(0xFFFFFF, android.graphics.PorterDuff.Mode.CLEAR)
  if (result && result.length > 0) {
    for (let i = 0; i < result.length; i++) {
      let detectResult = result[i]
      drawRectAndText(detectResult.label, detectResult.bounds, '#00ff00', canvas, paint)
    }
  }
})

setInterval(() => { }, 10000)
events.on('exit', () => {
  // 标记停止 避免canvas导致闪退
  running = false
  // 撤销监听
  window.canvas.removeAllListeners()
  // 回收图片
  img && img.recycle()
})

/**
 * 绘制文本和方框
 *
 * @param {*} desc
 * @param {*} rect
 * @param {*} colorStr
 * @param {*} canvas
 * @param {*} paint
 */
function drawRectAndText (desc, rect, colorStr, canvas, paint) {
  let color = colors.parseColor(colorStr)

  paint.setStrokeWidth(1)
  paint.setStyle(Paint.Style.STROKE)
  // 反色
  paint.setARGB(255, 255 - (color >> 16 & 0xff), 255 - (color >> 8 & 0xff), 255 - (color & 0xff))
  canvas.drawRect(rect, paint)
  paint.setARGB(255, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff)
  paint.setStrokeWidth(1)
  paint.setTextSize(20)
  paint.setStyle(Paint.Style.FILL)
  canvas.drawText(desc, rect.left, rect.top, paint)
  paint.setTextSize(10)
  paint.setStrokeWidth(1)
  paint.setARGB(255, 0, 0, 0)
}

/**
 * 获取状态栏高度
 *
 * @returns
 */
function getStatusBarHeightCompat () {
  let result = 0
  let resId = context.getResources().getIdentifier("status_bar_height", "dimen", "android")
  if (resId > 0) {
    result = context.getResources().getDimensionPixelOffset(resId)
  }
  if (result <= 0) {
    result = context.getResources().getDimensionPixelOffset(R.dimen.dimen_25dp)
  }
  return result
}

function TouchController (buttonWindow, handleClick, handleDown, handleUp) {
  this.eventStartX = null
  this.eventStartY = null
  this.windowStartX = buttonWindow.getX()
  this.windowStartY = buttonWindow.getY()
  this.eventKeep = false
  this.eventMoving = false
  this.touchDownTime = new Date().getTime()

  this.createListener = function () {
    let _this = this
    return new android.view.View.OnTouchListener((view, event) => {
      try {
        switch (event.getAction()) {
          case event.ACTION_DOWN:
            handleDown && handleDown()
            _this.eventStartX = event.getRawX();
            _this.eventStartY = event.getRawY();
            _this.windowStartX = buttonWindow.getX();
            _this.windowStartY = buttonWindow.getY();
            _this.eventKeep = true; //按下,开启计时
            _this.touchDownTime = new Date().getTime()
            break;
          case event.ACTION_MOVE:
            var sx = event.getRawX() - _this.eventStartX;
            var sy = event.getRawY() - _this.eventStartY;
            if (!_this.eventMoving && _this.eventKeep && getDistance(sx, sy) >= 10) {
              _this.eventMoving = true;
            }
            if (_this.eventMoving && _this.eventKeep) {
              ui.post(() => {
                buttonWindow.setPosition(_this.windowStartX + sx, _this.windowStartY + sy);
              })
            }
            break;
          case event.ACTION_UP:
            handleUp && handleUp()
            if (!_this.eventMoving && _this.eventKeep && _this.touchDownTime > new Date().getTime() - 1000) {
              handleClick && handleClick()
            }
            _this.eventKeep = false;
            _this.touchDownTime = 0;
            _this.eventMoving = false;
            break;
        }
      } catch (e) {
        console.error('异常' + e)
      }
      return true;
    })
  }
}

function getDistance (dx, dy) {
  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}