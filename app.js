'use strict';
/* Suffle — confusion → 3-5 options → shuffle chits → pick one → follow it. */

const $ = (id) => document.getElementById(id);
const MIN = 3, MAX = 5;
const IDEAS = [
  { q: 'Aaj dinner mein kya khaun?', o: ['Pizza', 'Biryani', 'Maggi', 'Dal Chawal', 'Burger'] },
  { q: 'Weekend pe kya karun?', o: ['Movie dekhun', 'Ghoomne jaun', 'Ghar pe aaraam', 'Dosto se milun'] },
  { q: 'Aaj kaunsa kaam pehle?', o: ['Padhai', 'Gym', 'Ghar ki safai', 'Dost ko call'] },
  { q: 'Kaunsi movie dekhun?', o: ['Comedy', 'Action', 'Horror', 'Romance', 'Thriller'] },
  { q: 'Chhutti mein kahan jaun?', o: ['Goa', 'Manali', 'Jaipur', 'Rishikesh', 'Ghar hi'] },
  { q: 'Is baar kaunsa gift doon?', o: ['Watch', 'Book', 'Chocolates', 'Plant'] },
  { q: 'Raat ko kya karun?', o: ['Series', 'Gaming', 'Neend', 'Late night walk'] },
];

const state = { q: '', opts: [], busy: false, shuffled: false };
let sound = true;
let ac = null;

/* ---------- helpers ---------- */
const rand = (n) => {
  if (window.crypto && crypto.getRandomValues) {
    const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] % n;
  }
  return Math.floor(Math.random() * n);
};
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EMOJI = ['📄', '📝', '📃', '🗒️', '📜'];

function tone(f, d = 0.1, type = 'triangle', v = 0.08, at = 0) {
  if (!sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d);
  } catch { /* audio unavailable */ }
}

/* ---------- scenes ---------- */
function go(n) {
  document.querySelectorAll('.scene').forEach((s) => { s.hidden = s.dataset.scene !== String(n); });
  document.querySelectorAll('.dots i').forEach((d, i) => d.classList.toggle('on', i < n));
}

/* Scene 1 */
$('idea').onclick = () => {
  const i = IDEAS[rand(IDEAS.length)];
  $('question').value = i.q; state.opts = i.o.slice(0, MAX); tone(660);
};
$('to2').onclick = () => {
  const q = $('question').value.trim();
  if (!q) { $('question').focus(); $('question').placeholder = 'Pehle sawaal to likho 🙂'; return; }
  state.q = q; renderOpts(); go(2); $('optInput').focus();
};
$('question').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('to2').click(); });

/* Scene 2 */
function renderOpts() {
  $('qTitle').textContent = state.q;
  const ul = $('optList'); ul.innerHTML = '';
  state.opts.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="n"></span><span class="t"></span><button type="button" aria-label="Remove">✕</button>';
    li.children[0].textContent = i + 1;
    li.children[1].textContent = t;
    li.children[2].onclick = () => { state.opts.splice(i, 1); renderOpts(); tone(330); };
    ul.appendChild(li);
  });
  const n = state.opts.length;
  $('to3').disabled = n < MIN;
  $('optInput').disabled = n >= MAX;
  $('optHint').textContent = n < MIN ? `Abhi ${n} option — kam se kam ${MIN} chahiye (${MIN - n} aur).`
    : n < MAX ? `${n} options ready. Chaho to ${MAX - n} aur jodo.` : `Maximum ${MAX} options ho gaye ✅`;
}
$('optForm').onsubmit = (e) => {
  e.preventDefault();
  const t = $('optInput').value.trim();
  if (!t || state.opts.length >= MAX) return;
  if (state.opts.some((o) => o.toLowerCase() === t.toLowerCase())) { $('optHint').textContent = 'Ye option pehle se hai 🙂'; return; }
  state.opts.push(t); $('optInput').value = ''; renderOpts(); tone(520);
  if (state.opts.length < MAX) $('optInput').focus();
};
$('back1').onclick = () => go(1);
$('to3').onclick = () => { setupTable(); go(3); };

/* Scene 3 — the table */
let slips = [];
function layout(order, spread = true) {
  const t = $('table'), W = t.clientWidth, H = t.clientHeight, n = order.length;
  order.forEach((s, k) => {
    const cols = n <= 3 ? n : Math.ceil(n / 2);
    const row = n <= 3 ? 0 : Math.floor(k / cols), rows = n <= 3 ? 1 : 2;
    const inRow = n <= 3 ? n : (row === 0 ? cols : n - cols), idx = n <= 3 ? k : (row === 0 ? k : k - cols);
    const x = W * (idx + 1) / (inRow + 1), y = H * (row + 1) / (rows + 1);
    s.style.left = x + 'px'; s.style.top = y + 'px';
    s.style.transform = spread ? `rotate(${(rand(21) - 10)}deg)` : '';
  });
}
function setupTable() {
  state.busy = false; state.shuffled = false;
  $('table').innerHTML = ''; slips = [];
  $('tableTitle').textContent = 'Chits taiyaar hain';
  $('tableSub').textContent = `${state.opts.length} chit fold ho gayi. Ab milao!`;
  $('shuffle').disabled = false; $('shuffle').textContent = '🔀 Chit Milao (Shuffle)';
  state.opts.forEach((text, i) => {
    const b = document.createElement('button');
    b.className = 'slip'; b.type = 'button'; b.tabIndex = -1;
    b.setAttribute('aria-label', 'Folded paper slip');
    b.innerHTML = `<span class="face">${EMOJI[i % EMOJI.length]}</span>`;
    b.dataset.text = text;
    b.onclick = () => pick(b);
    $('table').appendChild(b); slips.push(b);
  });
  layout(slips);
}
async function doShuffle() {
  if (state.busy) return;
  state.busy = true; $('shuffle').disabled = true;
  slips.forEach((s) => { s.classList.remove('pickable'); s.tabIndex = -1; });
  $('tableSub').textContent = 'Chit mil rahi hain… 🌀';
  const t = $('table'), cx = t.clientWidth / 2, cy = t.clientHeight / 2;
  const rounds = reduced() ? 1 : 9;
  for (let r = 0; r < rounds; r++) {
    slips.forEach((s) => {
      s.classList.add('shuffling');
      s.style.left = cx + (rand(160) - 80) + 'px'; s.style.top = cy + (rand(120) - 60) + 'px';
      s.style.transform = `rotate(${rand(121) - 60}deg)`;
    });
    tone(300 + r * 40, 0.08);
    await sleep(reduced() ? 0 : 230);
  }
  // final random positions: positions are re-dealt so the player cannot track any chit
  const order = shuffle(slips);
  slips.forEach((s) => s.classList.remove('shuffling'));
  layout(order);
  slips = order;
  await sleep(550);
  slips.forEach((s) => { s.classList.add('pickable'); s.tabIndex = 0; });
  state.shuffled = true; state.busy = false;
  $('tableTitle').textContent = 'Ab ek chit chuno 👆';
  $('tableSub').textContent = 'Dil se koi bhi ek chit pe tap karo.';
  $('shuffle').disabled = false; $('shuffle').textContent = '🔀 Phir se milao';
  tone(784, 0.2, 'sine');
}
$('shuffle').onclick = doShuffle;
$('back2').onclick = () => { if (!state.busy) go(2); };

async function pick(slip) {
  if (!state.shuffled || state.busy) return;
  state.busy = true;
  slips.forEach((s) => { s.classList.remove('pickable'); s.tabIndex = -1; if (s !== slip) s.classList.add('gone'); });
  slip.classList.add('chosen');
  $('tableSub').textContent = 'Chit khul rahi hai…';
  tone(440, 0.15); tone(660, 0.2, 'triangle', 0.08, 0.12);
  await sleep(reduced() ? 0 : 800);
  reveal(slip.dataset.text);
}

/* Scene 4 */
function reveal(text) {
  $('winner').textContent = text;
  $('resultQ').textContent = state.q;
  const p = $('paper'); p.style.animation = 'none'; void p.offsetWidth; p.style.animation = '';
  go(4); state.busy = false;
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.45, 'sine', 0.11, i * 0.11));
  confetti();
}
$('again').onclick = () => { setupTable(); go(3); };
$('fresh').onclick = () => { state.q = ''; state.opts = []; $('question').value = ''; go(1); $('question').focus(); };

/* Confetti */
let raf = 0;
function confetti() {
  if (reduced()) return;
  const c = $('confetti'), x = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const cols = ['#ff5d8f', '#ffc93c', '#3ddc97', '#5db7ff', '#b07dff'];
  const ps = Array.from({ length: 120 }, () => ({
    x: c.width / 2, y: c.height * 0.4, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
    s: 5 + Math.random() * 6, r: Math.random() * 6, c: cols[rand(cols.length)], life: 0,
  }));
  cancelAnimationFrame(raf);
  (function step() {
    x.clearRect(0, 0, c.width, c.height);
    let alive = 0;
    ps.forEach((p) => {
      p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += 0.2; p.life++;
      if (p.y < c.height && p.life < 150) { alive++; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); x.restore(); }
    });
    if (alive) raf = requestAnimationFrame(step); else x.clearRect(0, 0, c.width, c.height);
  })();
}

/* Sound toggle */
$('soundBtn').onclick = () => {
  sound = !sound; $('soundBtn').setAttribute('aria-pressed', String(sound));
  $('soundBtn').textContent = sound ? '🔔' : '🔕';
};
window.addEventListener('resize', () => { if (!$('s3').hidden && !state.busy) layout(slips, false); });

go(1);

/* PWA: offline + installable */
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
