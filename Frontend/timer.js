document.addEventListener('DOMContentLoaded', function() {
    // Pomodoro Timer
    let pomodoroInterval;
    let pomodoroTimeLeft = 1500;
    let isPomodoroRunning = false;
    
    const pomodoroTimerDisplay = document.getElementById('pomodoroTimer');
    const startPomodoroBtn = document.getElementById('startPomodoroBtn');
    const pausePomodoroBtn = document.getElementById('pausePomodoroBtn');
    const resetPomodoroBtn = document.getElementById('resetPomodoroBtn');
    const pomodoroBtn = document.getElementById('pomodoroBtn');
    const shortBreakBtn = document.getElementById('shortBreakBtn');
    const longBreakBtn = document.getElementById('longBreakBtn');
    
    function updatePomodoroDisplay() {
        if (pomodoroTimerDisplay) {
            const minutes = Math.floor(pomodoroTimeLeft / 60);
            const seconds = pomodoroTimeLeft % 60;
            pomodoroTimerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }
    
    function startPomodoro() {
        if (!isPomodoroRunning) {
            isPomodoroRunning = true;
            pomodoroInterval = setInterval(() => {
                if (pomodoroTimeLeft > 0) {
                    pomodoroTimeLeft--;
                    updatePomodoroDisplay();
                } else {
                    clearInterval(pomodoroInterval);
                    isPomodoroRunning = false;
                    const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
                    audio.play();
                    alert('🎉 Time is up! Take a break!');
                    if (startPomodoroBtn) startPomodoroBtn.disabled = false;
                    if (pausePomodoroBtn) pausePomodoroBtn.disabled = true;
                }
            }, 1000);
            if (startPomodoroBtn) startPomodoroBtn.disabled = true;
            if (pausePomodoroBtn) pausePomodoroBtn.disabled = false;
        }
    }
    
    function pausePomodoro() {
        clearInterval(pomodoroInterval);
        isPomodoroRunning = false;
        if (startPomodoroBtn) startPomodoroBtn.disabled = false;
        if (pausePomodoroBtn) pausePomodoroBtn.disabled = true;
    }
    
    function resetPomodoro() {
        clearInterval(pomodoroInterval);
        isPomodoroRunning = false;
        pomodoroTimeLeft = 1500;
        updatePomodoroDisplay();
        if (startPomodoroBtn) startPomodoroBtn.disabled = false;
        if (pausePomodoroBtn) pausePomodoroBtn.disabled = true;
    }
    
    if (pomodoroBtn) {
        pomodoroBtn.addEventListener('click', () => {
            pomodoroTimeLeft = 1500;
            updatePomodoroDisplay();
        });
    }
    if (shortBreakBtn) {
        shortBreakBtn.addEventListener('click', () => {
            pomodoroTimeLeft = 300;
            updatePomodoroDisplay();
        });
    }
    if (longBreakBtn) {
        longBreakBtn.addEventListener('click', () => {
            pomodoroTimeLeft = 900;
            updatePomodoroDisplay();
        });
    }
    if (startPomodoroBtn) startPomodoroBtn.addEventListener('click', startPomodoro);
    if (pausePomodoroBtn) pausePomodoroBtn.addEventListener('click', pausePomodoro);
    if (resetPomodoroBtn) resetPomodoroBtn.addEventListener('click', resetPomodoro);
    
    // Normal Timer
    let normalInterval;
    let normalTimeLeft = 0;
    let isNormalRunning = false;
    
    const normalTimerDisplay = document.getElementById('normalTimer');
    const startNormalBtn = document.getElementById('startNormalBtn');
    const pauseNormalBtn = document.getElementById('pauseNormalBtn');
    const resetNormalBtn = document.getElementById('resetNormalBtn');
    const setMinutesInput = document.getElementById('setMinutes');
    
    function updateNormalDisplay() {
        if (normalTimerDisplay) {
            const hours = Math.floor(normalTimeLeft / 3600);
            const minutes = Math.floor((normalTimeLeft % 3600) / 60);
            const seconds = normalTimeLeft % 60;
            normalTimerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }
    
    function startNormal() {
        if (!isNormalRunning && normalTimeLeft > 0) {
            isNormalRunning = true;
            normalInterval = setInterval(() => {
                if (normalTimeLeft > 0) {
                    normalTimeLeft--;
                    updateNormalDisplay();
                } else {
                    clearInterval(normalInterval);
                    isNormalRunning = false;
                    const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
                    audio.play();
                    alert('⏰ Timer finished! Great job!');
                    if (startNormalBtn) startNormalBtn.disabled = false;
                    if (pauseNormalBtn) pauseNormalBtn.disabled = true;
                }
            }, 1000);
            if (startNormalBtn) startNormalBtn.disabled = true;
            if (pauseNormalBtn) pauseNormalBtn.disabled = false;
        }
    }
    
    function pauseNormal() {
        clearInterval(normalInterval);
        isNormalRunning = false;
        if (startNormalBtn) startNormalBtn.disabled = false;
        if (pauseNormalBtn) pauseNormalBtn.disabled = true;
    }
    
    function resetNormal() {
        clearInterval(normalInterval);
        isNormalRunning = false;
        normalTimeLeft = 0;
        updateNormalDisplay();
        if (startNormalBtn) startNormalBtn.disabled = false;
        if (pauseNormalBtn) pauseNormalBtn.disabled = true;
        if (setMinutesInput) setMinutesInput.value = '';
    }
    
    if (startNormalBtn) {
        startNormalBtn.addEventListener('click', () => {
            if (setMinutesInput && setMinutesInput.value) {
                normalTimeLeft = parseInt(setMinutesInput.value) * 60;
                updateNormalDisplay();
            }
            startNormal();
        });
    }
    if (pauseNormalBtn) pauseNormalBtn.addEventListener('click', pauseNormal);
    if (resetNormalBtn) resetNormalBtn.addEventListener('click', resetNormal);
    
    // Handle timer from URL parameter (coming from study plan)
    const urlParams = new URLSearchParams(window.location.search);
    const duration = urlParams.get('duration');
    if (duration) {
        normalTimeLeft = parseInt(duration, 10);
        updateNormalDisplay();
        startNormal();
    }
});