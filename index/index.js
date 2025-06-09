// DOM元素
const video = document.getElementById('video');
const startBtn = document.getElementById('startBtn');
const captureBtn = document.getElementById('captureBtn');
const resetBtn = document.getElementById('resetBtn');
const cameraError = document.getElementById('cameraError');
const resultPlaceholder = document.getElementById('resultPlaceholder');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const resultContent = document.getElementById('resultContent');
const garbageName = document.getElementById('garbageName');
const garbageTypeBadge = document.getElementById('garbageTypeBadge');
const garbageExplain = document.getElementById('garbageExplain');
const garbageSuggest = document.getElementById('garbageSuggest');

// 全局变量
let stream = null;
const API_KEY = 'YOUR_TIANXING_API_KEY'; // 替换为你的天行数据API密钥

// 启动摄像头
async function startCamera() {
    try {
        // 请求摄像头权限
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment' // 优先使用后置摄像头
            } 
        });
        
        video.srcObject = stream;
        captureBtn.disabled = false;
        resetBtn.disabled = false;
        cameraError.style.display = 'none';
    } catch (err) {
        console.error('摄像头访问出错:', err);
        cameraError.style.display = 'block';
        captureBtn.disabled = true;
        resetBtn.disabled = true;
    }
}

// 拍照并进行垃圾分类识别
async function captureAndClassify() {
    try {
        // 显示加载状态
        resultPlaceholder.style.display = 'none';
        errorMessage.style.display = 'none';
        resultContent.style.display = 'none';
        loadingIndicator.style.display = 'flex';
        
        // 创建canvas元素用于拍照
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // 绘制当前视频帧到canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 获取图像数据（Base64格式）
        const imageData = canvas.toDataURL('image/jpeg');
        
        // 调用垃圾分类API
        const garbageData = await classifyGarbage(imageData);
        
        // 显示结果
        displayResult(garbageData);
    } catch (error) {
        console.error('识别过程中出错:', error);
        showError('识别失败: ' + error.message);
    } finally {
        // 隐藏加载状态
        loadingIndicator.style.display = 'none';
    }
}

// 调用天行数据垃圾分类API
async function classifyGarbage(imageData) {
    // 去掉Base64前缀
    const base64Data = imageData.split(',')[1];
    
    // 构造API请求数据
    const formData = new FormData();
    formData.append('key', API_KEY);
    formData.append('img', base64Data);
    
    // 发送API请求
    const response = await fetch('https://api.tianapi.com/txapi/imglajifenlei/index', {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    
    // 检查API响应
    if (data.code !== 200 || !data.newslist || data.newslist.length === 0) {
        throw new Error(data.msg || '垃圾分类识别失败');
    }
    
    // 返回第一个识别结果
    return data.newslist[0];
}

// 显示垃圾分类结果
function displayResult(garbage) {
    // 更新DOM元素
    garbageName.textContent = garbage.name || '未知物品';
    garbageExplain.textContent = garbage.explain || '暂无详细说明';
    
    // 设置垃圾类型和对应样式
    let typeText, typeClass;
    switch (garbage.type) {
        case 0:
            typeText = '可回收垃圾';
            typeClass = 'recyclable';
            garbageSuggest.textContent = '请清洁后投入可回收物收集容器';
            break;
        case 1:
            typeText = '有害垃圾';
            typeClass = 'hazardous';
            garbageSuggest.textContent = '请小心处理，投入有害垃圾收集容器';
            break;
        case 2:
            typeText = '厨余垃圾';
            typeClass = 'kitchen';
            garbageSuggest.textContent = '请去除包装后投入厨余垃圾收集容器';
            break;
        case 3:
            typeText = '其他垃圾';
            typeClass = 'other';
            garbageSuggest.textContent = '请投入其他垃圾收集容器';
            break;
        default:
            typeText = '未分类';
            typeClass = 'other';
            garbageSuggest.textContent = '请根据当地垃圾分类标准处理';
    }
    
    garbageTypeBadge.textContent = typeText;
    garbageTypeBadge.className = 'type-badge ' + typeClass;
    
    // 显示结果区域
    resultContent.style.display = 'flex';
    resultPlaceholder.style.display = 'none';
}

// 显示错误信息
function showError(message) {
    errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorMessage.style.display = 'block';
    resultPlaceholder.style.display = 'none';
    resultContent.style.display = 'none';
}

// 重置界面
function reset() {
    resultPlaceholder.style.display = 'flex';
    errorMessage.style.display = 'none';
    resultContent.style.display = 'none';
}

// 事件监听
startBtn.addEventListener('click', startCamera);
captureBtn.addEventListener('click', captureAndClassify);
resetBtn.addEventListener('click', reset);

// 页面加载时初始化
window.addEventListener('load', () => {
    // 检查getUserMedia支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraError.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 您的浏览器不支持摄像头功能，请使用Chrome、Firefox或Edge等现代浏览器';
        cameraError.style.display = 'block';
        startBtn.disabled = true;
    }
});