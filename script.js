const display      = document.getElementById('display');
const startBtn     = document.getElementById('startBtn');
const lapBtn       = document.getElementById('lapBtn');
const resetBtn     = document.getElementById('resetBtn');
const lapTable     = document.getElementById('lapTable');
const lapBody      = document.getElementById('lapBody');
const lapColLabel  = document.getElementById('lapColLabel');
const lapHint      = document.getElementById('lapHint');
const swModeBtn    = document.getElementById('swMode');
const cdModeBtn    = document.getElementById('cdMode');
const cdConfig     = document.getElementById('cdConfig');
const progressBar  = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const qTracker     = document.getElementById('qTracker');
const qCountEl     = document.getElementById('qCount');
const qPaceEl      = document.getElementById('qPace');

let mode = 'stopwatch';
let countdownDuration = 0;
let running = false;
let startTime = 0;
let elapsed = 0;
let animFrame = null;
let laps = [];
let questionCount = 0;

function formatTime(ms) {
  if (ms < 0) ms = 0;
  const totalTenths = Math.floor(ms / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.22, 0.44].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    });
  } catch (e) {}
}

function updateWarning(remaining) {
  const pct = remaining / countdownDuration;
  progressFill.style.width = `${Math.max(0, pct * 100)}%`;

  display.classList.remove('warn', 'danger');
  progressFill.classList.remove('warning', 'danger');

  if (pct <= 0.1) {
    display.classList.add('danger');
    progressFill.classList.add('danger');
  } else if (pct <= 0.25) {
    display.classList.add('warn');
    progressFill.classList.add('warning');
  }
}

function tick() {
  elapsed = Date.now() - startTime;

  if (mode === 'stopwatch') {
    display.textContent = formatTime(elapsed);
  } else {
    const remaining = countdownDuration - elapsed;
    if (remaining <= 0) {
      display.textContent = '00:00.0';
      progressFill.style.width = '0%';
      stop();
      beep();
      display.classList.add('expired');
      return;
    }
    display.textContent = formatTime(remaining);
    updateWarning(remaining);
  }

  animFrame = requestAnimationFrame(tick);
}

function stop() {
  cancelAnimationFrame(animFrame);
  running = false;
  startBtn.textContent = 'START';
  startBtn.classList.remove('running');
  lapBtn.disabled = true;
}

function start() {
  if (mode === 'countdown' && countdownDuration === 0) return;
  startTime = Date.now() - elapsed;
  animFrame = requestAnimationFrame(tick);
  running = true;
  startBtn.textContent = 'STOP';
  startBtn.classList.add('running');
  lapBtn.disabled = false;
}

function reset() {
  stop();
  elapsed = 0;
  laps = [];
  questionCount = 0;
  display.classList.remove('expired', 'warn', 'danger');
  lapBody.innerHTML = '';
  lapTable.classList.add('hidden');

  if (mode === 'stopwatch') {
    display.textContent = '00:00.0';
  } else {
    display.textContent = countdownDuration > 0 ? formatTime(countdownDuration) : '00:00.0';
    progressFill.style.width = countdownDuration > 0 ? '100%' : '0%';
    progressFill.classList.remove('warning', 'danger');
    qCountEl.textContent = '0問';
    qPaceEl.textContent = '平均 --';
    if (countdownDuration === 0) startBtn.disabled = true;
  }
}

function lap() {
  const lapTotal = elapsed;
  const lapTime = laps.length === 0 ? lapTotal : lapTotal - laps[laps.length - 1].total;
  laps.push({ lapTime, total: lapTotal });

  if (mode === 'countdown') {
    questionCount++;
    const avgMs = elapsed / questionCount;
    qCountEl.textContent = `${questionCount}問完了`;
    qPaceEl.textContent = `平均 ${formatTime(avgMs)}/問`;
  }

  renderLaps();
}

function renderLaps() {
  lapTable.classList.remove('hidden');
  lapBody.innerHTML = '';

  const lapTimes = laps.map(l => l.lapTime);
  const maxTime = Math.max(...lapTimes);
  const minTime = Math.min(...lapTimes);

  [...laps].reverse().forEach((l, i) => {
    const num = laps.length - i;
    const tr = document.createElement('tr');

    if (lapTimes.length > 1) {
      if (l.lapTime === maxTime) tr.classList.add('slowest');
      else if (l.lapTime === minTime) tr.classList.add('fastest');
    }

    const label = mode === 'countdown'
      ? `Q${String(num).padStart(2, '0')}`
      : `#${String(num).padStart(2, '0')}`;

    tr.innerHTML = `
      <td>${label}</td>
      <td class="lap-time">${formatTime(l.lapTime)}</td>
      <td>${formatTime(l.total)}</td>
    `;
    lapBody.appendChild(tr);
  });
}

function setMode(newMode) {
  if (running) reset();
  mode = newMode;
  laps = [];
  elapsed = 0;
  questionCount = 0;
  display.classList.remove('expired', 'warn', 'danger');
  lapBody.innerHTML = '';
  lapTable.classList.add('hidden');
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));

  if (mode === 'stopwatch') {
    swModeBtn.classList.add('active');
    cdModeBtn.classList.remove('active');
    cdConfig.classList.add('hidden');
    progressBar.classList.add('hidden');
    qTracker.classList.add('hidden');
    lapBtn.textContent = 'LAP';
    lapColLabel.textContent = 'ラップ';
    lapHint.textContent = 'ラップ';
    startBtn.disabled = false;
    display.textContent = '00:00.0';
    countdownDuration = 0;
  } else {
    cdModeBtn.classList.add('active');
    swModeBtn.classList.remove('active');
    cdConfig.classList.remove('hidden');
    progressBar.classList.remove('hidden');
    qTracker.classList.remove('hidden');
    lapBtn.textContent = '次問';
    lapColLabel.textContent = '時間';
    lapHint.textContent = '次問';
    display.textContent = '00:00.0';
    countdownDuration = 0;
    startBtn.disabled = true;
    progressFill.style.width = '0%';
    progressFill.classList.remove('warning', 'danger');
    qCountEl.textContent = '0問';
    qPaceEl.textContent = '平均 --';
  }
}

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (running) return;
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    countdownDuration = parseInt(btn.dataset.sec) * 1000;
    elapsed = 0;
    laps = [];
    questionCount = 0;
    display.classList.remove('expired', 'warn', 'danger');
    display.textContent = formatTime(countdownDuration);
    progressFill.style.width = '100%';
    progressFill.classList.remove('warning', 'danger');
    lapBody.innerHTML = '';
    lapTable.classList.add('hidden');
    qCountEl.textContent = '0問';
    qPaceEl.textContent = '平均 --';
    startBtn.disabled = false;
  });
});

startBtn.addEventListener('click', () => running ? stop() : start());
lapBtn.addEventListener('click', () => { if (!lapBtn.disabled) lap(); });
resetBtn.addEventListener('click', reset);
swModeBtn.addEventListener('click', () => setMode('stopwatch'));
cdModeBtn.addEventListener('click', () => setMode('countdown'));

document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('focus', () => btn.blur());
});

document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    running ? stop() : start();
  } else if (e.code === 'Delete') {
    e.preventDefault();
    reset();
  } else if (e.code === 'Enter') {
    e.preventDefault();
    if (!lapBtn.disabled) lap();
  }
});
