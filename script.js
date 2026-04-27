const units = document.querySelectorAll('.light-unit');
const timerDisplay = document.getElementById('timer');
const bestDisplay = document.getElementById('best');
const beep = document.getElementById('beep'); 
const hintDisplay = document.getElementById('hint');

let state = 'IDLE'; 
let startTime;
let timeoutIds = [];
let bestRecord = localStorage.getItem('f1_best_v2') || Infinity;

if (bestRecord !== Infinity) {
    bestDisplay.innerText = parseFloat(bestRecord).toFixed(3) + 's';
}

// ---------------------------------------------------------
// 核心修正：統一事件處理
// ---------------------------------------------------------

// 監聽鍵盤
window.addEventListener('keydown', (e) => {
    if (e.repeat) return; // 防止長按重複觸發
    handleAction();
});

// 監聽指標 (包含觸控與滑鼠)
// 使用 window 確保點擊螢幕任何地方都有反應
window.addEventListener('pointerdown', (e) => {
    // 解鎖 iOS Safari 音效政策：必須在使用者點擊的第一時間執行一次 play()
    if (state === 'IDLE') {
        beep.play().then(() => {
            beep.pause();
            beep.currentTime = 0;
        }).catch(err => console.log("Audio unlock interaction needed"));
    }
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
    
    hintDisplay.innerHTML = "注意燈號...";
    hintDisplay.style.color = 'red';

    for (let i = 0; i < 5; i++) {
        let id = setTimeout(() => {
            playSound();
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
    // 隨機 1 到 3 秒後熄滅
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

function playSound() {
    if (beep) {
        beep.currentTime = 0;
        beep.play().catch(() => { }); 
    }
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
    hintDisplay.innerHTML = "點擊螢幕重新開始";
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
    hintDisplay.innerHTML = "偷跑了！點擊螢幕重來";
    resetLights();
}

function resetLights() {
    units.forEach((_, i) => toggleLightUnit(i, false));
}
