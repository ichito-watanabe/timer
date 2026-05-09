const display = document.getElementById('display');
const startBtn = document.getElementById('startBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const lapTable = document.getElementById('lapTable');
const lapBody = document.getElementById('lapBody');

let running = false;
let startTime = 0;
let elapsed = 0;
let animFrame = null;
let laps = [];

function formatTime(ms) {
  const totalTenths = Math.floor(ms / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

function tick() {
  elapsed = Date.now() - startTime;
  display.textContent = formatTime(elapsed);
  animFrame = requestAnimationFrame(tick);
}

function start() {
  startTime = Date.now() - elapsed;
  animFrame = requestAnimationFrame(tick);
  running = true;
  startBtn.textContent = 'STOP';
  startBtn.classList.add('running');
  lapBtn.disabled = false;
}

function stop() {
  cancelAnimationFrame(animFrame);
  running = false;
  startBtn.textContent = 'START';
  startBtn.classList.remove('running');
  lapBtn.disabled = true;
}

function reset() {
  stop();
  elapsed = 0;
  laps = [];
  display.textContent = '00:00.0';
  lapBody.innerHTML = '';
  lapTable.classList.add('hidden');
  lapBtn.disabled = true;
}

function lap() {
  const lapTotal = elapsed;
  const lapTime = laps.length === 0 ? lapTotal : lapTotal - laps[laps.length - 1].total;
  laps.push({ lapTime, total: lapTotal });
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

    tr.innerHTML = `
      <td>#${String(num).padStart(2, '0')}</td>
      <td class="lap-time">${formatTime(l.lapTime)}</td>
      <td>${formatTime(l.total)}</td>
    `;
    lapBody.appendChild(tr);
  });
}

startBtn.addEventListener('click', () => running ? stop() : start());
lapBtn.addEventListener('click', lap);
resetBtn.addEventListener('click', reset);
