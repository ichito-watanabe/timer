const display         = document.getElementById('display');
const startBtn        = document.getElementById('startBtn');
const lapBtn          = document.getElementById('lapBtn');
const resetBtn        = document.getElementById('resetBtn');
const lapTable        = document.getElementById('lapTable');
const lapBody         = document.getElementById('lapBody');
const lapColLabel     = document.getElementById('lapColLabel');
const lapHint         = document.getElementById('lapHint');
const scoreColHeader  = document.getElementById('scoreColHeader');
const swModeBtn       = document.getElementById('swMode');
const cdModeBtn       = document.getElementById('cdMode');
const statsModeBtn    = document.getElementById('statsMode');
const cdConfig        = document.getElementById('cdConfig');
const progressBar     = document.getElementById('progressBar');
const progressFill    = document.getElementById('progressFill');
const qTracker        = document.getElementById('qTracker');
const qCountEl        = document.getElementById('qCount');
const qPaceEl         = document.getElementById('qPace');
const topicSelect     = document.getElementById('topicSelect');
const saveBtn         = document.getElementById('saveBtn');
const timerSection    = document.getElementById('timerSection');
const statsSection    = document.getElementById('statsSection');

let mode = 'stopwatch';
let countdownDuration = 0;
let running = false;
let startTime = 0;
let elapsed = 0;
let animFrame = null;
let laps = [];
let questionCount = 0;
let selectedTopic = '';

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
  updateSaveBtn();
}

function start() {
  if (mode === 'countdown' && countdownDuration === 0) return;
  startTime = Date.now() - elapsed;
  animFrame = requestAnimationFrame(tick);
  running = true;
  startBtn.textContent = 'STOP';
  startBtn.classList.add('running');
  lapBtn.disabled = false;
  updateSaveBtn();
}

function reset() {
  stop();
  elapsed = 0;
  laps = [];
  questionCount = 0;
  display.classList.remove('expired', 'warn', 'danger');
  lapBody.innerHTML = '';
  lapTable.classList.add('hidden');
  scoreColHeader.classList.add('hidden');
  saveBtn.classList.add('hidden');

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
  laps.push({ lapTime, total: lapTotal, result: null });

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

  scoreColHeader.classList.remove('hidden');

  const lapTimes = laps.map(l => l.lapTime);
  const maxTime = Math.max(...lapTimes);
  const minTime = Math.min(...lapTimes);

  [...laps].reverse().forEach((l, i) => {
    const num = laps.length - i;
    const idx = laps.length - 1 - i;
    const tr = document.createElement('tr');

    if (lapTimes.length > 1) {
      if (l.lapTime === maxTime) tr.classList.add('slowest');
      else if (l.lapTime === minTime) tr.classList.add('fastest');
    }

    const label = mode === 'countdown'
      ? `Q${String(num).padStart(2, '0')}`
      : `#${String(num).padStart(2, '0')}`;

    const scoreCell = `
      <td class="score-cell">
        <button class="result-btn correct ${l.result === true ? 'active' : ''}" data-idx="${idx}">○</button>
        <button class="result-btn incorrect ${l.result === false ? 'active' : ''}" data-idx="${idx}">✗</button>
      </td>`;

    tr.innerHTML = `
      <td>${label}</td>
      <td class="lap-time">${formatTime(l.lapTime)}</td>
      <td>${formatTime(l.total)}</td>
      ${scoreCell}
    `;
    lapBody.appendChild(tr);
  });

  updateSaveBtn();
}

function updateSaveBtn() {
  const show = !running && laps.length > 0 && selectedTopic !== '';
  saveBtn.classList.toggle('hidden', !show);
}

function saveResults() {
  const markedLaps = laps.filter(l => l.result !== null);
  if (markedLaps.length === 0) return;

  const correct = markedLaps.filter(l => l.result === true).length;
  const session = {
    date: new Date().toISOString().slice(0, 10),
    topic: selectedTopic,
    correct,
    total: markedLaps.length,
  };

  const history = JSON.parse(localStorage.getItem('spiHistory') || '[]');
  history.push(session);
  localStorage.setItem('spiHistory', JSON.stringify(history));

  saveBtn.textContent = '保存しました！';
  saveBtn.disabled = true;
  setTimeout(() => {
    saveBtn.textContent = 'この結果を保存';
    saveBtn.disabled = false;
  }, 2000);
}

function renderStats() {
  const history = JSON.parse(localStorage.getItem('spiHistory') || '[]');

  if (history.length === 0) {
    statsSection.innerHTML = `
      <p class="stats-empty">まだ記録がありません</p>
      <p class="stats-hint">カウントダウンモードで分野を選んで練習後、採点して保存してください</p>
    `;
    return;
  }

  const map = {};
  history.forEach(s => {
    if (!map[s.topic]) map[s.topic] = { correct: 0, total: 0 };
    map[s.topic].correct += s.correct;
    map[s.topic].total += s.total;
  });

  const sorted = Object.entries(map).sort(([, a], [, b]) =>
    (a.correct / a.total) - (b.correct / b.total)
  );

  const rows = sorted.map(([topic, { correct, total }]) => {
    const pct = Math.round(correct / total * 100);
    const cls = pct >= 75 ? 'good' : pct >= 50 ? 'ok' : 'bad';
    return `
      <tr class="${cls}">
        <td class="stat-topic">${topic}</td>
        <td class="stat-score">${correct}/${total}</td>
        <td class="stat-pct">${pct}%</td>
        <td class="stat-bar-cell"><div class="stat-bar-fill" style="width:${pct}%"></div></td>
      </tr>`;
  }).join('');

  statsSection.innerHTML = `
    <p class="stats-heading">分野別正答率</p>
    <table class="stats-table">
      <thead><tr><th>分野</th><th>正解</th><th>正答率</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <button class="clear-btn" id="clearBtn">記録を全削除</button>
  `;

  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('全ての記録を削除しますか？')) {
      localStorage.removeItem('spiHistory');
      renderStats();
    }
  });
}

function setMode(newMode) {
  if (newMode === 'stats') {
    [swModeBtn, cdModeBtn, statsModeBtn].forEach(b => b.classList.remove('active'));
    statsModeBtn.classList.add('active');
    timerSection.classList.add('hidden');
    statsSection.classList.remove('hidden');
    renderStats();
    return;
  }

  statsSection.classList.add('hidden');
  timerSection.classList.remove('hidden');

  if (running) reset();
  mode = newMode;
  laps = [];
  elapsed = 0;
  questionCount = 0;
  display.classList.remove('expired', 'warn', 'danger');
  lapBody.innerHTML = '';
  lapTable.classList.add('hidden');
  scoreColHeader.classList.add('hidden');
  saveBtn.classList.add('hidden');
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));

  if (mode === 'stopwatch') {
    swModeBtn.classList.add('active');
    cdModeBtn.classList.remove('active');
    statsModeBtn.classList.remove('active');
    cdConfig.classList.add('hidden');
    progressBar.classList.add('hidden');
    qTracker.classList.add('hidden');
    lapBtn.textContent = 'LAP';
    lapHint.textContent = 'ラップ';
    lapColLabel.textContent = 'ラップ';
    startBtn.disabled = false;
    display.textContent = '00:00.0';
    countdownDuration = 0;
  } else {
    cdModeBtn.classList.add('active');
    swModeBtn.classList.remove('active');
    statsModeBtn.classList.remove('active');
    cdConfig.classList.remove('hidden');
    progressBar.classList.remove('hidden');
    qTracker.classList.remove('hidden');
    lapBtn.textContent = '次問';
    lapHint.textContent = '次問';
    lapColLabel.textContent = '時間';
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
    scoreColHeader.classList.add('hidden');
    saveBtn.classList.add('hidden');
    qCountEl.textContent = '0問';
    qPaceEl.textContent = '平均 --';
    startBtn.disabled = false;
  });
});

topicSelect.addEventListener('change', () => {
  selectedTopic = topicSelect.value;
  updateSaveBtn();
});

lapBody.addEventListener('click', e => {
  const btn = e.target.closest('.result-btn');
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx);
  const isCorrect = btn.classList.contains('correct');
  laps[idx].result = laps[idx].result === isCorrect ? null : isCorrect;
  renderLaps();
});

saveBtn.addEventListener('click', saveResults);
startBtn.addEventListener('click', () => running ? stop() : start());
lapBtn.addEventListener('click', () => { if (!lapBtn.disabled) lap(); });
resetBtn.addEventListener('click', reset);
swModeBtn.addEventListener('click', () => setMode('stopwatch'));
cdModeBtn.addEventListener('click', () => setMode('countdown'));
statsModeBtn.addEventListener('click', () => setMode('stats'));

document.addEventListener('keydown', e => {
  if (e.isComposing) return;
  if (e.key === ' ') {
    e.preventDefault();
    running ? stop() : start();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    reset();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (!lapBtn.disabled) lap();
  }
}, { capture: true });
