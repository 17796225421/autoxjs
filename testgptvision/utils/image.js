/**
 * image.js
 * ----------------
 * 封装截图、裁剪、Base64 转换等图像处理操作
 */

// 若全局有这个标志位，则可用来判断是否已经请求过截图权限
global.hasCapturePermission = global.hasCapturePermission || false;

/**
 * 根据 UiObject 的 bounds 区域截图，并返回对应 Image 对象
 * @param {UiObject} uiObject - 需要截图的控件对象
 * @returns {Image} 截图得到的图片对象
 */
function captureImageByUiObject(uiObject) {
    if (!uiObject) {
        log("【captureImageByUiObject】uiObject 无效");
        return null;
    }

    let b = uiObject.bounds();
    if (!b || b.width() <= 0 || b.height() <= 0) {
        log("【captureImageByUiObject】无法获取有效的 bounds");
        return null;
    }

    // 如果尚未申请截图权限，则申请
    if (!global.hasCapturePermission) {
        log("【captureImageByUiObject】尚未申请截图权限，开始申请...");
        if (!requestScreenCapture()) {
            log("【captureImageByUiObject】请求截图权限失败");
            return null;
        }
        global.hasCapturePermission = true;
        log("【captureImageByUiObject】请求截图权限成功");
    }

    // 先整体截一张图
    let fullImg = captureScreen();
    if (!fullImg) {
        log("【captureImageByUiObject】captureScreen() 返回空，截图失败");
        return null;
    }

    // 根据 uiObject 的 bounds 裁剪需要的区域
    let clipImg = images.clip(fullImg, b.left, b.top, b.width(), b.height());
    if (!clipImg) {
        log("【captureImageByUiObject】裁剪图像失败");
        return null;
    }

    return clipImg;
}

/**
 * 将 Image 转为 Base64 字符串
 * @param {Image} img - 图像对象
 * @returns {string} Base64 字符串
 */
function convertImageToBase64(img) {
    if (!img) {
        log("【convertImageToBase64】img 无效");
        return null;
    }

    try {
        let base64Str = images.toBase64(img, "png", 100);
        return base64Str;
    } catch (e) {
        log("【convertImageToBase64】转换异常: " + e);
        return null;
    }
}

module.exports = {
    captureImageByUiObject,
    convertImageToBase64
};
