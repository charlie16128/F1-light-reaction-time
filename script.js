const units = document.querySelectorAll('.light-unit');
const timerDisplay = document.getElementById('timer');
const bestDisplay = document.getElementById('best');
const beep = document.getElementById('beep'); 
const hintDisplay = document.getElementById('hint')

let state = 'IDLE'; // 狀態：IDLE, LIGHTING, WAITING, RUNNING
let startTime;
let timeoutIds = [];
let bestRecord = localStorage.getItem('f1_best_v2') || Infinity;

// 初始化最佳紀錄
if (bestRecord !== Infinity) {
    bestDisplay.innerText = parseFloat(bestRecord).toFixed(3) + 's';
}

window.addEventListener('keydown', handleAction);

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
    hintDisplay.style.color = 'red'

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
    // 5 燈全亮後，隨機 1~5 秒 (1000ms~5000ms) 後熄滅
    const randomDelay = Math.random() * (3000 - 1000) + 1000;
    
    let id = setTimeout(() => {
        resetLights(); // 熄滅所有燈號
        state = 'RUNNING';
        startTime = performance.now();
        requestAnimationFrame(updateTimer);
    }, randomDelay);
    
    timeoutIds.push(id);
}

function toggleLightUnit(index, active) {
    const bulbs = units[index].querySelectorAll('.bulb');
    bulbs.forEach(b => active ? b.classList.add('active') : b.classList.remove('active'));
}

function playSound() {
    beep.currentTime = 0;
    beep.play().catch(() => { }); // 避免瀏覽器政策攔截
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

    hintDisplay.innerHTML = "   ";
    hintDisplay.style.color = 'red'
}

function resetLights() {
    units.forEach((_, i) => toggleLightUnit(i, false));
}