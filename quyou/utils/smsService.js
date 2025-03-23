/**
 * smsService.js
 * ----------------
 * 封装手机接码相关逻辑，只暴露：getPhoneNumber()、getVerificationCode()，
 * main.js 只需感知这两个接口即可。
 */

// ===================== 配置信息 =====================
let config = {
    serverUrl: "https://api.haozhuma.com",
    user: "2c2f2c0ecd04f838df2dc3c62b14eb9502a480dda24e857ceae1c9e48e350791",
    pass: "a51b59161096c156ff02afdc031e329b13783a283628df0b6d43958513acaf83",
    token: "12979f4ebab7cfff4f0d66e41d3166c5b044414b99a51c0fe65fc6c72d2d0762a9a1afba52cd1b0b557346b8cf0cae5fb464752fced4a6a7f575cd4e734324d31839a0dfe9b44c8dd532879a6c3f0c1f",
    sid: 21758,  
};

// ===================== 对外暴露的两个主要函数 =====================

/**
 * 获取手机号（增加了 10 次重试，每次最多等待 10s 超时）
 * @param {number} [retryCount=10] 重试次数
 * @returns {string|null} 成功返回手机号字符串，失败返回 null
 */
function getPhoneNumber(retryCount) {
    retryCount = retryCount || 10;

    // 1. 若本地 token 为空，则先登录获取 token
    loginIfNeeded();

    // 2. 开始轮询获取手机号
    for (let i = 0; i < retryCount; i++) {
        let url = `${config.serverUrl}/sms/?api=getPhone&token=${config.token}&sid=${config.sid}`;

        try {
            // 这里的 10000 表示 10s 超时，具体看你所使用的 http 模块是否支持
            let result = httpGet(url, 10000);
            if (result && result.phone) {
                log(`[smsService] 成功获取到手机号: ${result.phone}`);
                return result.phone;
            } else {
                log(`[smsService] 第 ${i + 1} 次获取手机号失败: code=${result ? result.code : "未知"}, msg=${result ? result.msg : "未知"}`);
            }
        } catch (e) {
            console.error(`[smsService] 第 ${i + 1} 次获取手机号时发生异常:`, e);
        }

        // 每次失败后等待 3 秒再重试
        sleep(3000);
    }

    log(`[smsService] ${retryCount} 次尝试仍未获取到手机号，放弃。`);
    return null;
}

/**
 * 获取验证码
 * @param {string} phone 要获取验证码的手机号
 * @param {number} [retryCount=10] 轮询次数，用于轮询等待短信到达
 * @returns {string|null} 成功返回验证码字符串，失败返回 null
 */
function getVerificationCode(phone, retryCount) {
    retryCount = retryCount || 50;

    // 1. 若本地 token 为空，则先登录获取 token
    loginIfNeeded();

    // 2. 循环轮询获取短信
    for (let i = 0; i < retryCount; i++) {
        let url = `${config.serverUrl}/sms/?api=getMessage&token=${config.token}&sid=${config.sid}&phone=${phone}`;
        try {
            // 同样给出 10s 超时
            let result = httpGet(url, 10000);
            if (result && result.yzm) {
                log(`[smsService] 成功获取到验证码: ${result.yzm}`);
                return result.yzm;
            } else {
                log(`[smsService] 第 ${i + 1} 次获取验证码未成功: ${result ? result.msg : "未知错误"}`);
            }
        } catch (e) {
            console.error(`[smsService] 第 ${i + 1} 次获取验证码时发生异常:`, e);
        }

        // 每次轮询后停顿 3 秒再重试，可根据业务需求调整
        sleep(3000);
    }

    // 如果循环完都没拿到，返回 null
    log(`[smsService] ${retryCount} 次尝试仍未获取到验证码，放弃。`);
    return null;
}

// ===================== 以下是内部的函数，不暴露给外部 =====================

function loginIfNeeded() {
    if (config.token) {
        // 这里简单处理，如有需要可以加“是否过期”判断
        return;
    }

    let url = `${config.serverUrl}/sms/?api=login&user=${config.user}&pass=${config.pass}`;
    try {
        let result = httpGet(url, 10000); // 登录也加一个超时
        if (result && (result.code === 0 || result.code === 200) && result.token) {
            config.token = result.token;
            log("[smsService] 登录成功，获得 token = " + config.token);
        } else {
            console.error(`[smsService] 登录失败: code=${result ? result.code : "未知"}, msg=${result ? result.msg : "未知"}`);
        }
    } catch (e) {
        console.error("[smsService] 登录获取 token 时发生异常:", e);
    }
}

function releasePhone(phone) {
    // 按需自行调用释放
    // let url = `${config.serverUrl}/sms/?api=cancelRecv&token=${config.token}&sid=${config.sid}&phone=${phone}`;
    // httpGet(url);
}

function addBlacklist(phone) {
    // 按需自行调用拉黑
    // let url = `${config.serverUrl}/sms/?api=addBlacklist&token=${config.token}&sid=${config.sid}&phone=${phone}`;
    // httpGet(url);
}

function setServerUrl(url) {
    config.serverUrl = url;
    // 如果更换了服务器地址，通常需要重新登录
    config.token = "";
}

function setUserAndPass(user, pass) {
    config.user = user;
    config.pass = pass;
    config.token = "";
}

function setSid(sid) {
    config.sid = sid;
}

/**
 * 简易 get 请求封装，支持超时（假设 Auto.js 的 http 支持 { timeout: 毫秒 }）
 * @param {string} url 
 * @param {number} [timeoutMs=0] 超时毫秒数，0 表示不设置
 * @returns {object|null} 返回服务器响应的 JSON 对象或 null
 */
function httpGet(url, timeoutMs) {
    timeoutMs = timeoutMs || 0;

    let res = null;
    if (timeoutMs > 0) {
        // 如果当前环境的 http.get() 支持传对象形式的参数
        res = http.get(url, { timeout: timeoutMs });
    } else {
        res = http.get(url);
    }

    if (res && res.statusCode === 200) {
        let txt = res.body.string();
        let obj = JSON.parse(txt);
        return obj;
    }
    return null;
}

/**
 * 简易 sleep
 * Auto.js 下可直接用内置的 sleep(ms)；此处只是示范
 */
function sleep(ms) {
    java.lang.Thread.sleep(ms);
}

// ===================== 导出 =====================
module.exports = {
    getPhoneNumber,
    getVerificationCode,
    setServerUrl,
    setUserAndPass,
    setSid,
    releasePhone,
    addBlacklist,
};
