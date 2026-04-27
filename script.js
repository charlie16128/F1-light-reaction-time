const units = document.querySelectorAll('.light-unit');
const timerDisplay = document.getElementById('timer');
const bestDisplay = document.getElementById('best');
const beep = document.getElementById('beep'); 
const hintDisplay = document.getElementById('hint');

let state = 'IDLE'; // 狀態：IDLE, LIGHTING, WAITING, RUNNING
let startTime;
let timeoutIds = [];
let bestRecord = localStorage.getItem('f1_best_v2') || Infinity;

// 初始化最佳紀錄
if (bestRecord !== Infinity) {
    bestDisplay.innerText = parseFloat(bestRecord).toFixed(3) + 's';
}

// --- 監聽事件：支援鍵盤、滑鼠點擊、觸控螢幕 ---

// 1. 鍵盤事件
window.addEventListener('keydown', (e) => {
    // 防止空白鍵觸發頁面捲動
    if (e.code === 'Space') e.preventDefault();
    handleAction();
});

// 2. 指標事件 (自動支援滑鼠與觸控)
window.addEventListener('pointerdown', (e) => {
    // 呼叫 handleAction 前，確保音效在 iOS/Android 的靜音政策下被解鎖
    handleAction();
});

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
    
    hintDisplay.innerHTML = "計時開始";
    hintDisplay.style.color = 'red';

    // 1~5 燈：每隔 1 秒亮起一個
    for (let i = 0; i < 5; i++) {
        let id = setTimeout(() => {
            playSound();
            toggleLightUnit(i, true);
            
            // 當第 5 燈亮起後，進入等待熄滅狀態
            if (i === 4) {
                state = 'WAITING';
                prepareExtinguish();
            }
        }, (i + 1) * 1000);
        timeoutIds.push(id);
    }
}

function prepareExtinguish() {
    // 5 燈全亮後，隨機 1~3 秒後熄滅
    const randomDelay = Math.random() * (3000 - 1000) + 1000;
    
    let id = setTimeout(() => {
        resetLights(); // 熄滅所有燈號
        state = 'RUNNING';
        startTime = performance.now();
        requestAnimationFrame(updateTimer);
        hintDisplay.innerHTML = "GO!";
    }, randomDelay);
    
    timeoutIds.push(id);
}

function toggleLightUnit(index, active) {
    const bulbs = units[index].querySelectorAll('.bulb');
    bulbs.forEach(b => active ? b.classList.add('active') : b.classList.remove('active'));
}

function playSound() {
    // 在行動裝置上，第一次播放必須由使用者點擊觸發
    beep.currentTime = 0;
    beep.play().catch(() => { 
        console.log("音效播放被瀏覽器攔截，需由使用者先點擊螢幕");
    });
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
    resetLights();

    hintDisplay.innerHTML = " ";
    hintDisplay.style.color = 'red';
}

function resetLights() {
    units.forEach((_, i) => toggleLightUnit(i, false));
}
