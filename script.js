const units = document.querySelectorAll('.light-unit');
const timerDisplay = document.getElementById('timer');
const bestDisplay = document.getElementById('best');
const hintDisplay = document.getElementById('hint');

let state = 'IDLE'; 
let startTime;
let timeoutIds = [];
let bestRecord = localStorage.getItem('f1_best_v2') || Infinity;

// --- Web Audio API 初始化 ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let beepBuffer;

// 預載入音效檔案
async function loadSound(url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
        console.error("音效載入失敗", e);
    }
}

// 播放零延遲音效
function playSound() {
    if (!audioCtx || !beepBuffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = beepBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
}

// 初始化最佳紀錄
if (bestRecord !== Infinity) {
    bestDisplay.innerText = parseFloat(bestRecord).toFixed(3) + 's';
}

// --- 事件監聽 ---

window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    handleAction();
});

window.addEventListener('pointerdown', async (e) => {
    // 第一次點擊時初始化 AudioContext (瀏覽器安全要求)
    if (!audioCtx) {
        audioCtx = new AudioContext();
        // 這裡填入你的音效檔路徑
        beepBuffer = await loadSound('Sound.m4a'); 
    }
    
    // 確保 AudioContext 在 iOS 上不會自動進入懸停狀態
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    handleAction();
});

// --- 邏輯部分 (保持不變) ---

function handleAction() {
    if (state === 'IDLE') {
        startSequence();
    } else if (state === 'LIGHTING' || state === 'WAITING') {
        jumpStart();
    } else if (state === 'RUNNING') {
        stopTimer();
    }
}

function startSequence() {
    state = 'LIGHTING';
    resetLights();
    timerDisplay.innerText = "0.000s";
    timerDisplay.style.color = "white";
    timeoutIds = [];
    
    hintDisplay.innerHTML = "注意燈號...";
    hintDisplay.style.color = 'red';

    for (let i = 0; i < 5; i++) {
        let id = setTimeout(() => {
            playSound(); // 這裡現在是零延遲了
            toggleLightUnit(i, true);
            
            if (i === 4) {
                state = 'WAITING';
                prepareExtinguish();
            }
        }, (i + 1) * 1000);
        timeoutIds.push(id);
    }
}

function prepareExtinguish() {
    const randomDelay = Math.random() * 2000 + 1000;
    let id = setTimeout(() => {
        resetLights(); 
        state = 'RUNNING';
        startTime = performance.now();
        requestAnimationFrame(updateTimer);
        hintDisplay.innerHTML = "GO!";
        hintDisplay.style.color = "#00ff00";
    }, randomDelay);
    timeoutIds.push(id);
}

function toggleLightUnit(index, active) {
    if (!units[index]) return;
    const bulbs = units[index].querySelectorAll('.bulb');
    bulbs.forEach(b => active ? b.classList.add('active') : b.classList.remove('active'));
}

function updateTimer() {
    if (state !== 'RUNNING') return;
    const now = performance.now();
    const diff = (now - startTime) / 1000;
    timerDisplay.innerText = diff.toFixed(3) + 's';
    requestAnimationFrame(updateTimer);
}

function stopTimer() {
    state = 'IDLE';
    const finalTime = (performance.now() - startTime) / 1000;
    timerDisplay.innerText = finalTime.toFixed(3) + 's';
    hintDisplay.innerHTML = "點擊重新開始";
    hintDisplay.style.color = "#666";

    if (finalTime < bestRecord) {
        bestRecord = finalTime;
        localStorage.setItem('f1_best_v2', bestRecord);
        bestDisplay.innerText = bestRecord.toFixed(3) + 's';
        timerDisplay.style.color = "#00ff00";
    }
}

function jumpStart() {
    timeoutIds.forEach(id => clearTimeout(id));
    timeoutIds = [];
    state = 'IDLE';
    timerDisplay.innerText = "JUMP START!";
    timerDisplay.style.color = "#ff4444";
    hintDisplay.innerHTML = "偷跑了！點擊重來";
    resetLights();
}

function resetLights() {
    units.forEach((_, i) => toggleLightUnit(i, false));
}
