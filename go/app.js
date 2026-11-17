/* ===== 圍棋道場 介面與流程 ===== */
(function () {
'use strict';
const CFG = window.GO_CONFIG;
const { Board, PASS, BLACK, WHITE, EMPTY } = GoEngine;
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ---------- 儲存 ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('goDojo.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('goDojo.' + k, JSON.stringify(v)); } catch (e) { } }
};
const settings = Object.assign({ musicOn: 1, music: CFG.music.defaultVol, sfx: CFG.sfx.defaultVol, coords: 1, confirm: 0, speed: CFG.lessonStepMs }, store.get('settings', {}));
function saveSettings() { store.set('settings', settings); }

/* ---------- 音效與音樂（全部程式產生）---------- */
const Snd = {
  ctx: null, sfxGain: null, musGain: null, delay: null, musTimer: null,
  init() {
    Music.start();
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = new (window.AudioContext || window.webkitAudioContext)();
      this.ctx = C;
      this.sfxGain = C.createGain(); this.sfxGain.connect(C.destination);
      this.applyVol();
    } catch (e) { this.ctx = null; }
  },
  applyVol() {
    if (!this.ctx) return;
    this.sfxGain.gain.value = settings.sfx / 100;
  },
  noise(dur) {
    const C = this.ctx, b = C.createBuffer(1, Math.floor(C.sampleRate * dur), C.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const s = C.createBufferSource(); s.buffer = b; return s;
  },
  stone() {
    if (!this.ctx || !settings.sfx) return;
    const C = this.ctx, t = C.currentTime;
    const n = this.noise(0.05), bp = C.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 1.4;
    const g = C.createGain(); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    n.connect(bp); bp.connect(g); g.connect(this.sfxGain); n.start(t);
    const o = C.createOscillator(); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.06);
    const g2 = C.createGain(); g2.gain.setValueAtTime(0.5, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(g2); g2.connect(this.sfxGain); o.start(t); o.stop(t + 0.1);
  },
  capture(n) {
    if (!this.ctx || !settings.sfx) return;
    for (let i = 0; i < Math.min(n, 5); i++) setTimeout(() => this.tick(1600 + Math.random() * 600, 0.25), 90 + i * 70);
  },
  tick(f, v) {
    if (!this.ctx || !settings.sfx) return;
    const C = this.ctx, t = C.currentTime, o = C.createOscillator(), g = C.createGain();
    o.type = 'square'; o.frequency.value = f || 1200;
    g.gain.setValueAtTime(v || 0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + 0.05);
  },
  tone(freqs, type, dur, vol) {
    if (!this.ctx || !settings.sfx) return;
    const C = this.ctx;
    freqs.forEach((f, i) => {
      const t = C.currentTime + i * 0.12, o = C.createOscillator(), g = C.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + dur + 0.05);
    });
  },
  good() { this.tone([660, 880, 1320], 'sine', 0.5, 0.25); },
  okay() { this.tone([520, 660], 'sine', 0.45, 0.22); },
  bad() { this.tone([300, 220], 'triangle', 0.5, 0.25); },
};
/* 背景音樂：config.js 的 music.tracks 依序輪流播放 */
const Music = {
  el: null, idx: 0, started: false,
  start() {
    if (this.started) return; this.started = true;
    const tracks = CFG.music.tracks || []; if (!tracks.length) return;
    this.idx = Math.floor(Math.random() * tracks.length);
    this.el = new Audio(); this.el.preload = 'auto';
    this.el.addEventListener('ended', () => { this.idx = (this.idx + 1) % tracks.length; this.load(); this.play(); });
    this.load(); this.apply();
  },
  load() { this.el.src = CFG.music.tracks[this.idx]; },
  play() { if (!this.el) return; const p = this.el.play(); if (p && p.catch) p.catch(() => {}); },
  apply() {
    if (!this.el) return;
    this.el.volume = Math.max(0, Math.min(1, settings.music / 100));
    if (settings.musicOn && settings.music > 0) { if (this.el.paused) this.play(); } else this.el.pause();
  }
};
document.addEventListener('visibilitychange', () => { if (!Music.el) return; if (document.hidden) Music.el.pause(); else Music.apply(); });
document.addEventListener('pointerdown', () => Snd.init(), { capture: true });

/* ---------- 小工具 ---------- */
let toastTimer = null;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 1800); }
function show(id) { $$('.screen').forEach(s => s.classList.toggle('on', s.id === id)); current = id; setTimeout(resize, 0); }
let current = 'menu';
const colName = c => c === BLACK ? '黑' : '白';
function fromDiagram(rows) {
  const n = rows.length, b = new Board(n), marks = {};
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    const p = b.pt(x, y);
    if (ch === 'X') b.b[p] = BLACK; else if (ch === 'O') b.b[p] = WHITE; else if (ch !== '.') marks[ch] = p;
  }));
  b.toPlay = BLACK; return { b, marks };
}

/* ---------- 棋盤繪製 ---------- */
class BoardView {
  constructor(canvas, onClick) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.onClick = onClick;
    this.state = null; this.px = 400; this.hover = -1;
    canvas.addEventListener('click', e => { const p = this.pick(e); if (p != null && this.onClick) this.onClick(p); });
    canvas.addEventListener('mousemove', e => { const p = this.pick(e); const h = p == null ? -1 : p; if (h !== this.hover) { this.hover = h; this.draw(); } });
    canvas.addEventListener('mouseleave', () => { this.hover = -1; this.draw(); });
  }
  setSize(px) {
    px = Math.max(220, Math.floor(px));
    const dpr = window.devicePixelRatio || 1;
    this.px = px; this.cv.style.width = px + 'px'; this.cv.style.height = px + 'px';
    this.cv.width = Math.round(px * dpr); this.cv.height = Math.round(px * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.draw();
  }
  geom() {
    const N = this.state.board.n, V = this.state.view || { x0: 0, y0: 0, w: N }, n = V.w, m = settings.coords ? 1.0 : 0.65;
    const cell = this.px / (n - 1 + 2 * m), off = cell * m;
    return { n, N, x0: V.x0, y0: V.y0, cell, off };
  }
  // 盤面座標 → 畫面格子座標（不在顯示範圍內回傳 null）
  vxy(p) {
    const { n, x0, y0 } = this.geom(), [x, y] = this.state.board.xy(p), a = x - x0, c = y - y0;
    return (a < 0 || c < 0 || a >= n || c >= n) ? null : [a, c];
  }
  pick(e) {
    if (!this.state) return null;
    const r = this.cv.getBoundingClientRect(), { n, x0, y0, cell, off } = this.geom();
    const x = Math.round((e.clientX - r.left - off) / cell), y = Math.round((e.clientY - r.top - off) / cell);
    if (x < 0 || y < 0 || x >= n || y >= n) return null;
    return this.state.board.pt(x + x0, y + y0);
  }
  set(state) { this.state = state; this.draw(); }
  draw() {
    const s = this.state; if (!s) return;
    const c = this.ctx, b = s.board, { n, N, x0, y0, cell, off } = this.geom(), W = this.px;
    const XY = p => this.vxy(p);
    // 木紋
    const gr = c.createLinearGradient(0, 0, W, W); gr.addColorStop(0, '#e6bd78'); gr.addColorStop(1, '#cf9c52');
    c.fillStyle = gr; c.fillRect(0, 0, W, W);
    c.save(); c.globalAlpha = 0.07; c.strokeStyle = '#6b4020';
    for (let i = 0; i < 26; i++) { const y = (i * 37.3) % W; c.lineWidth = 1 + (i % 3); c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(W * .3, y + 8, W * .7, y - 8, W, y + 4); c.stroke(); }
    c.restore();
    const P = i => off + i * cell;
    // 線
    c.strokeStyle = '#3b2a17'; c.lineWidth = 1;
    // 顯示部分盤面時，不是真正邊線的那一側，線一直畫到畫面外
    const eL = x0 === 0, eT = y0 === 0, eR = x0 + n === N, eB = y0 + n === N;
    const gap = settings.coords ? off * 0.72 : 0;
    const xa = eL ? P(0) : gap, xb = eR ? P(n - 1) : W - gap, ya = eT ? P(0) : gap, yb = eB ? P(n - 1) : W - gap;
    for (let i = 0; i < n; i++) {
      c.beginPath(); c.moveTo(xa, P(i)); c.lineTo(xb, P(i)); c.stroke();
      c.beginPath(); c.moveTo(P(i), ya); c.lineTo(P(i), yb); c.stroke();
    }
    c.lineWidth = 2.5;
    if (eT) { c.beginPath(); c.moveTo(xa, P(0)); c.lineTo(xb, P(0)); c.stroke(); }
    if (eB) { c.beginPath(); c.moveTo(xa, P(n - 1)); c.lineTo(xb, P(n - 1)); c.stroke(); }
    if (eL) { c.beginPath(); c.moveTo(P(0), ya); c.lineTo(P(0), yb); c.stroke(); }
    if (eR) { c.beginPath(); c.moveTo(P(n - 1), ya); c.lineTo(P(n - 1), yb); c.stroke(); }
    c.lineWidth = 1;
    // 星位
    const stars = N === 9 ? [2, 6] : N === 13 ? [3, 9] : N === 7 ? [] : N === 19 ? [3, 9, 15] : [3, N - 4];
    const starPts = []; stars.forEach(x => stars.forEach(y => starPts.push([x, y]))); if (N % 2 && N >= 9 && N < 19) starPts.push([(N - 1) / 2, (N - 1) / 2]);
    c.fillStyle = '#3b2a17'; starPts.forEach(([x, y]) => { x -= x0; y -= y0; if (x < 0 || y < 0 || x >= n || y >= n) return; c.beginPath(); c.arc(P(x), P(y), Math.max(2, cell * 0.09), 0, 7); c.fill(); });
    // 座標
    if (settings.coords) {
      c.fillStyle = '#4a3420'; c.font = `${Math.max(10, cell * 0.32)}px ${getComputedStyle(document.body).fontFamily}`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 0; i < n; i++) {
        const L = GoEngine.COLS[i + x0];
        c.fillText(L, P(i), off * 0.42); c.fillText(L, P(i), W - off * 0.42);
        c.fillText(String(i + y0 + 1), off * 0.4, P(i)); c.fillText(String(i + y0 + 1), W - off * 0.4, P(i));
      }
    }
    // 地盤（形勢或數子）
    if (s.own) {
      for (const p of b.points) {
        const v = s.own[p]; if (Math.abs(v) < 0.25) continue;
        if (b.b[p] !== EMPTY && !(s.dead && s.dead.has(p))) continue;
        const q = XY(p); if (!q) continue; const [x, y] = q, sz = cell * (0.22 + 0.2 * Math.min(1, Math.abs(v)));
        c.fillStyle = v > 0 ? 'rgba(15,15,15,.75)' : 'rgba(250,250,250,.85)';
        c.fillRect(P(x) - sz / 2, P(y) - sz / 2, sz, sz);
      }
    }
    // 棋子
    const R = cell * 0.47;
    for (const p of b.points) {
      const v = b.b[p]; if (v !== BLACK && v !== WHITE) continue;
      const q = XY(p); if (!q) continue; const [x, y] = q, dead = s.dead && s.dead.has(p);
      this.stone(P(x), P(y), R, v, dead ? 0.45 : 1);
      if (dead) { c.strokeStyle = v === BLACK ? '#fff' : '#000'; c.lineWidth = 2; const d = R * 0.4; c.beginPath(); c.moveTo(P(x) - d, P(y) - d); c.lineTo(P(x) + d, P(y) + d); c.moveTo(P(x) + d, P(y) - d); c.lineTo(P(x) - d, P(y) + d); c.stroke(); }
      if (s.numbers && s.numbers.has(p)) {
        c.fillStyle = v === BLACK ? '#fff' : '#111'; c.font = `bold ${cell * (s.numbers.get(p) > 9 ? 0.4 : 0.5)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(s.numbers.get(p)), P(x), P(y) + 1);
      }
    }
    // 最後一手
    if (s.last != null && s.last >= 0 && b.b[s.last] && !(s.numbers && s.numbers.has(s.last)) && XY(s.last)) {
      const [x, y] = XY(s.last); c.strokeStyle = b.b[s.last] === BLACK ? '#fff' : '#b8412f'; c.lineWidth = 2;
      c.beginPath(); c.arc(P(x), P(y), R * 0.45, 0, 7); c.stroke();
    }
    if (s.last != null && s.last >= 0 && s.numbers && s.numbers.has(s.last) && XY(s.last)) {
      const [x, y] = XY(s.last); c.strokeStyle = '#d23a2a'; c.lineWidth = 3; c.beginPath(); c.arc(P(x), P(y), R + 1, 0, 7); c.stroke();
    }
    // 選項字母
    if (s.marks) {
      for (const k in s.marks) {
        const p = s.marks[k]; if (b.b[p] !== EMPTY || !XY(p)) continue;
        const [x, y] = XY(p);
        const col = s.markColor && s.markColor[k] || '#7a2a1a';
        c.fillStyle = 'rgba(255,244,220,.92)'; c.beginPath(); c.arc(P(x), P(y), R * 0.82, 0, 7); c.fill();
        c.strokeStyle = col; c.lineWidth = 2.5; c.stroke();
        c.fillStyle = col; c.font = `bold ${cell * 0.52}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(k[0] === '?' ? '?' : k.toUpperCase(), P(x), P(y) + 1);
      }
    }
    // 提示候選
    if (s.cands) {
      s.cands.forEach((cd, i) => {
        if (cd.move < 0 || b.b[cd.move] !== EMPTY || !XY(cd.move)) return;
        const [x, y] = XY(cd.move);
        c.fillStyle = i === 0 ? 'rgba(63,138,79,.9)' : 'rgba(60,90,160,.85)';
        c.beginPath(); c.arc(P(x), P(y), R * 0.8, 0, 7); c.fill();
        if (s.candSel === i) { c.strokeStyle = '#ffd34d'; c.lineWidth = 3; c.stroke(); }
        c.fillStyle = '#fff'; c.font = `bold ${cell * 0.42}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(i + 1), P(x), P(y) - cell * 0.08);
        c.font = `${cell * 0.24}px sans-serif`; c.fillText(Math.round(cd.winrate * 100) + '%', P(x), P(y) + cell * 0.24);
      });
    }
    // 預覽棋子（點兩下確認 / 滑鼠移過）
    const ghost = s.ghost != null ? s.ghost : (s.hoverColor && this.hover >= 0 ? this.hover : -1);
    if (ghost >= 0 && b.b[ghost] === EMPTY && s.hoverColor && XY(ghost)) {
      const [x, y] = XY(ghost); this.stone(P(x), P(y), R, s.hoverColor, s.ghost != null ? 0.6 : 0.35);
    }
  }
  stone(x, y, R, v, alpha) {
    const c = this.ctx; c.save(); c.globalAlpha = alpha;
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.arc(x + R * 0.1, y + R * 0.14, R, 0, 7); c.fill();
    const g = c.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.1, x, y, R);
    if (v === BLACK) { g.addColorStop(0, '#6a6a6a'); g.addColorStop(0.45, '#1a1a1a'); g.addColorStop(1, '#000'); }
    else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#ebe6dc'); g.addColorStop(1, '#b4ac9e'); }
    c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, 7); c.fill();
    c.restore();
  }
}

const gView = new BoardView($('#gcv'), p => Game.click(p));
const lView = new BoardView($('#lcv'), p => Lesson.boardClick(p));
const jView = new BoardView($('#jcv'), p => Joseki.boardClick(p));
const rView = new BoardView($('#rcv'), null);

function resize() {
  const W = window.innerWidth, H = window.innerHeight, portrait = H > W;
  const px = portrait ? Math.min(W - 24, H * 0.6) : Math.min(H - 24, W - Math.min(380, W * 0.42) - 48);
  if (current === 'game') gView.setSize(px);
  if (current === 'lesson') lView.setSize(px);
  if (current === 'joseki') jView.setSize(px);
  if (current === 'review') rView.setSize(px);
}
window.addEventListener('resize', resize);

/* ---------- 暫停 / 設定 / 說明 ---------- */
let askCb = null;
function ask(msg, cb) { $('#askMsg').textContent = msg; askCb = cb; openOverlay('ask'); }
let paused = false, settingsFrom = null;
function openOverlay(id) { $('#' + id).classList.add('on'); }
function closeOverlay(id) { $('#' + id).classList.remove('on'); }
function pause() { if (current !== 'game' && current !== 'lesson' && current !== 'joseki' && current !== 'review') return; Joseki.stopReplay(); paused = true; Lesson.stopPlay(); openOverlay('pause'); }
function resume() { paused = false; closeOverlay('pause'); Game.onResume(); }
function syncSettingsUI() {
  $('#volMusic').value = settings.music; $('#volMusicV').textContent = settings.music;
  $('#volSfx').value = settings.sfx; $('#volSfxV').textContent = settings.sfx;
  $$('#settings .seg').forEach(seg => { const k = seg.dataset.key; seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', String(settings[k]) === b.dataset.v)); });
}
$('#volMusic').addEventListener('input', e => { settings.music = +e.target.value; $('#volMusicV').textContent = settings.music; Music.apply(); saveSettings(); });
$('#volSfx').addEventListener('input', e => { settings.sfx = +e.target.value; $('#volSfxV').textContent = settings.sfx; Snd.applyVol(); saveSettings(); });
$$('#settings .seg').forEach(seg => seg.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; settings[seg.dataset.key] = +b.dataset.v; saveSettings(); syncSettingsUI(); Music.apply(); Snd.tick(); gView.draw(); lView.draw(); jView.draw(); resize();
}));
// 對弈設定選項
const setup = { opp: 'ai', size: 9, diff: 'normal', color: 1, hcap: 0 };
$$('#setup .seg').forEach(seg => seg.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const k = seg.dataset.key;
  setup[k] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v;
  seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  $$('#setup .ai-only').forEach(r => r.style.display = setup.opp === 'ai' ? '' : 'none');
  Snd.tick();
}));

/* ---------- 對弈 ---------- */
const Game = {
  b: null, hist: [], opts: null, thinking: null, over: false, scoring: false, dead: null, ghost: null,
  hint: null, candSel: 0, own: null, pendingAI: null, reviewing: false,
  start(o) {
    this.opts = o; const n = o.size; this.b = new Board(n);
    this.komi = o.hcap >= 2 ? CFG.komi.handicap : CFG.komi[n];
    if (o.hcap >= 2) {
      CFG.handicapPoints[n].slice(0, o.hcap === 5 ? 5 : o.hcap).forEach((s, i, arr) => {
        // 5 子含天元；3 子不含天元
        this.b.b[this.b.parse(s)] = BLACK;
      });
      this.b.toPlay = WHITE;
    }
    this.hist = [this.b.clone()]; this.over = false; this.scoring = false; this.dead = null; this.ghost = null;
    this.clearAux(); this.reviewing = false;
    $('#scorePanel').style.display = 'none'; $('#gBtns').style.display = '';
    const ai = o.opp === 'ai';
    $('#nmB').textContent = ai ? (o.color === BLACK ? '你（黑）' : '電腦（黑）') : '黑';
    $('#nmW').textContent = ai ? (o.color === WHITE ? '你（白）' : '電腦（白）') : '白';
    $('#gTitle').textContent = `${n}×${n} ` + (ai ? CFG.difficulty[o.diff].name : '雙人') + (o.hcap ? ` 讓${o.hcap}子` : '');
    show('game'); this.refresh();
    this.maybeAI();
  },
  isAI() { return this.opts.opp === 'ai'; },
  aiTurn() { return this.isAI() && this.b.toPlay !== this.opts.color; },
  clearAux() { this.hint = null; this.own = null; $('#hintBox').classList.remove('on'); },
  refresh() {
    const b = this.b;
    $('#plB').classList.toggle('turn', !this.over && b.toPlay === BLACK);
    $('#plW').classList.toggle('turn', !this.over && b.toPlay === WHITE);
    $('#cpB').textContent = '提子 ' + b.caps[BLACK];
    $('#cpW').textContent = '提子 ' + b.caps[WHITE] + ' ・ 貼 ' + this.komi;
    let st = '';
    if (this.scoring) st = '數子中';
    else if (this.over) st = '對局結束';
    else if (this.thinking) st = '電腦思考中…';
    else { st = `第 ${b.moveNum + 1} 手，輪到${colName(b.toPlay)}棋`; if (b.lastMove === PASS && b.moveNum > 0) st += `（${colName(3 - b.toPlay)}棋虛手）`; }
    $('#gStatus').textContent = st;
    const humanCan = !this.over && !this.thinking && !this.aiTurn();
    $$('#gBtns [data-act=hint],#gBtns [data-act=pass],#gBtns [data-act=estimate]').forEach(x => x.disabled = !humanCan);
    $('#gBtns [data-act=undo]').disabled = this.hist.length <= 1 || this.scoring;
    this.draw();
  },
  draw() {
    const b = this.b;
    gView.set({
      board: b, last: b.lastMove, own: this.own, dead: this.dead,
      cands: this.hint ? this.hint.cands : null, candSel: this.candSel,
      ghost: this.ghost, hoverColor: (!this.over && !this.thinking && !this.aiTurn() && !this.scoring) ? b.toPlay : 0
    });
  },
  click(p) {
    if (paused) return;
    if (this.scoring) return this.toggleDead(p);
    if (this.over || this.thinking || this.aiTurn()) return;
    const b = this.b;
    if (b.b[p] !== EMPTY) return;
    if (!b.isLegal(p)) { toast(p === b.ko ? '打劫：不能馬上提回來，要先下別的地方' : '這裡不能下（下了會沒有氣）'); Snd.bad(); return; }
    if (settings.confirm && this.ghost !== p) { this.ghost = p; this.draw(); return; }
    this.play(p);
  },
  play(p) {
    this.ghost = null;
    const cap = this.b.play(p);
    if (cap < 0) return;
    this.hist.push(this.b.clone());
    if (p !== PASS) { Snd.stone(); if (cap) Snd.capture(cap); }
    this.clearAux(); this.refresh();
    if (this.b.passes >= 2) return this.enterScoring();
    this.maybeAI();
  },
  maybeAI() {
    if (this.over || !this.aiTurn()) return;
    const d = CFG.difficulty[this.opts.diff], f = this.b.n === 13 ? CFG.size13Factor : 1;
    const t0 = Date.now(); const prog = $('#gProg'); prog.style.visibility = 'visible';
    this.thinking = GoAI.searchAsync(this.b, { maxPlayouts: Math.round(d.maxPlayouts * f), timeMs: d.timeMs, komi: this.komi }, res => {
      const wait = Math.max(0, 350 - (Date.now() - t0));
      setTimeout(() => {
        prog.style.visibility = 'hidden'; prog.firstChild.style.width = '0';
        if (!this.thinking) return;
        this.thinking = null;
        if (paused) { this.pendingAI = res; return; }
        this.applyAI(res);
      }, wait);
    }, x => { prog.firstChild.style.width = (x * 100) + '%'; });
    this.refresh();
  },
  onResume() { if (this.pendingAI) { const r = this.pendingAI; this.pendingAI = null; this.applyAI(r); } },
  applyAI(res) {
    const b = this.b, d = CFG.difficulty[this.opts.diff];
    const cands = res.candidates;
    // 認輸
    if (cands.length && res.winrate < CFG.resignWinrate && b.moveNum > b.n * CFG.resignAfterFactor) {
      return this.finish(`${colName(b.toPlay)}棋（電腦）認輸`, 3 - b.toPlay, null);
    }
    // 虛手判斷：所有空點都已確定歸屬，或對方虛手且電腦領先
    let settled = true;
    for (const p of b.points) if (b.b[p] === EMPTY && Math.abs(res.ownership[p]) < 0.7) { settled = false; break; }
    let move = PASS;
    if (cands.length && !settled) {
      move = cands[0].move;
      if (Math.random() < d.mistake && cands.length > 1) {
        const top = cands.slice(0, Math.min(d.mistakeTop, cands.length)).filter(c => c.visits > 0);
        if (top.length) move = top[Math.floor(Math.random() * top.length)].move;
      }
    }
    if (move === PASS) toast(`${colName(b.toPlay)}棋（電腦）虛手`);
    this.play(move);
  },
  pass() { if (this.over || this.thinking || this.aiTurn()) return; toast(`${colName(this.b.toPlay)}棋虛手`); this.play(PASS); },
  undo() {
    if (this.scoring) return;
    if (this.thinking) { this.thinking.cancel(); this.thinking = null; $('#gProg').style.visibility = 'hidden'; }
    if (this.hist.length <= 1) return;
    this.over = false;
    this.hist.pop();
    if (this.isAI()) { while (this.hist.length > 1 && this.hist[this.hist.length - 1].toPlay !== this.opts.color) this.hist.pop(); }
    this.b = this.hist[this.hist.length - 1].clone();
    this.clearAux(); this.ghost = null; Snd.tick(); this.refresh();
    this.maybeAI();
  },
  showHint() {
    if (this.over || this.thinking || this.aiTurn()) return;
    if (this.hint) { this.clearAux(); this.draw(); return; }
    const box = $('#hintBox'); box.classList.add('on'); box.innerHTML = '<h4>思考中…</h4>';
    const prog = $('#gProg'); prog.style.visibility = 'visible';
    const f = this.b.n === 13 ? CFG.size13Factor : 1;
    this.thinking = GoAI.searchAsync(this.b, { maxPlayouts: Math.round(CFG.hint.maxPlayouts * f), timeMs: CFG.hint.timeMs, komi: this.komi }, res => {
      this.thinking = null; prog.style.visibility = 'hidden';
      const cands = res.candidates.filter(c => c.visits > 0).slice(0, CFG.hint.show);
      this.hint = { cands, res }; this.candSel = 0; this.renderHint(); this.refresh();
    }, x => { prog.firstChild.style.width = (x * 100) + '%'; });
    this.refresh();
  },
  renderHint() {
    const { cands, res } = this.hint, b = this.b, box = $('#hintBox');
    if (!cands.length) { box.innerHTML = '<h4>建議虛手</h4><p class="note">已經沒有能增加地盤的地方了。</p>'; return; }
    const sel = cands[this.candSel];
    const gain = GoExplain.territoryGain(b, sel.own, res.ownership, b.toPlay);
    const items = GoExplain.explainMove(b, sel.move, { gain });
    const unitName = id => { const u = GoLessons.UNITS.find(u => u.id === id); return u ? u.icon + u.title : ''; };
    box.innerHTML = `<h4>${this.candSel === 0 ? '建議' : '候選 ' + (this.candSel + 1)}：${b.name(sel.move)}（勝率約 ${Math.round(sel.winrate * 100)}%）</h4>
      <div class="cands">${cands.map((c, i) => `<span data-i="${i}" class="${i === this.candSel ? 'on' : ''}">${i + 1}. ${b.name(c.move)} ${Math.round(c.winrate * 100)}%</span>`).join('')}</div>
      <ul>${items.map(it => `<li>${it.text}${it.tag ? `<span class="tag" data-unit="${it.tag}">${unitName(it.tag)}</span>` : ''}</li>`).join('')}</ul>
      <p class="note">勝率是電腦模擬的估計，數字接近時差別不大。點候選可以看其他選擇的理由；點灰色標籤可以去練那個原則。</p>`;
    box.querySelectorAll('.cands span').forEach(s => s.onclick = () => { this.candSel = +s.dataset.i; this.renderHint(); this.draw(); });
    box.querySelectorAll('.tag').forEach(s => s.onclick = () => { const i = GoLessons.UNITS.findIndex(u => u.id === s.dataset.unit); if (i >= 0) Lesson.openUnit(i, 'game'); });
  },
  estimate() {
    if (this.own) { this.own = null; this.draw(); return; }
    const own = GoAI.estimateOwnership(this.b, CFG.estimatePlayouts, this.komi);
    let s = -this.komi; for (const p of this.b.points) s += own[p];
    this.own = own; this.draw();
    toast(`形勢估計：${s >= 0 ? '黑' : '白'}棋領先約 ${Math.abs(s).toFixed(1)} 目（含貼目）`);
  },
  resign() {
    if (this.over || this.scoring) return;
    const who = this.isAI() ? this.opts.color : this.b.toPlay;
    ask(`確定${colName(who)}棋認輸嗎？`, () => {
      if (this.thinking) { this.thinking.cancel(); this.thinking = null; }
      this.finish(`${colName(who)}棋認輸`, 3 - who, null);
    });
  },
  enterScoring() {
    this.scoring = true; this.clearAux();
    const g = GoAI.guessDead(this.b, CFG.deadStonePlayouts, this.komi);
    this.dead = g.dead; this.updateScore();
    $('#gBtns').style.display = 'none'; $('#scorePanel').style.display = '';
    this.refresh();
  },
  updateScore() {
    const sc = this.b.areaScore(this.komi, this.dead);
    const own = new Float32Array(this.b.len); for (const p of this.b.points) own[p] = sc.own[p] === 1 ? 1 : sc.own[p] === 2 ? -1 : 0;
    this.own = own; this.sc = sc;
    $('#scoreLive').textContent = `黑 ${sc.black} ・ 白 ${sc.white} + 貼 ${this.komi} → ${sc.score > 0 ? '黑' : '白'}棋勝 ${Math.abs(sc.score)} 目`;
  },
  toggleDead(p) {
    const v = this.b.b[p]; if (v !== BLACK && v !== WHITE) return;
    const g = this.b.group(p), isDead = this.dead.has(p);
    g.stones.forEach(s => isDead ? this.dead.delete(s) : this.dead.add(s));
    Snd.tick(); this.updateScore(); this.draw();
  },
  resumePlay() {
    this.scoring = false; this.dead = null; this.own = null;
    this.b.passes = 0;
    $('#scorePanel').style.display = 'none'; $('#gBtns').style.display = '';
    this.refresh(); this.maybeAI();
  },
  confirmScore() {
    const sc = this.sc; this.scoring = false;
    $('#scorePanel').style.display = 'none'; $('#gBtns').style.display = '';
    this.finish(null, sc.score > 0 ? BLACK : WHITE, sc);
  },
  finish(reason, winner, sc) {
    this.over = true; this.refresh();
    const youWin = this.isAI() ? winner === this.opts.color : null;
    $('#resBig').textContent = this.isAI() ? (youWin ? '你贏了！' : '電腦獲勝') : `${colName(winner)}棋勝`;
    let html = '';
    if (reason) html += `<p style="text-align:center">${reason}</p>`;
    if (sc) {
      const dB = [...this.dead].filter(p => this.b.b[p] === BLACK).length, dW = [...this.dead].filter(p => this.b.b[p] === WHITE).length;
      html += `<table class="score"><tr><th></th><th>黑</th><th>白</th></tr>
        <tr><td>子＋地</td><td>${sc.black}</td><td>${sc.white}</td></tr>
        <tr><td>貼目</td><td>—</td><td>${this.komi}</td></tr>
        <tr><td>合計</td><td><b>${sc.black}</b></td><td><b>${sc.white + this.komi}</b></td></tr></table>
        <p class="note" style="text-align:center">${colName(winner)}棋勝 ${Math.abs(sc.score)} 目（死子：黑 ${dB}、白 ${dW}，已算進對方的地）</p>`;
    }
    if (this.isAI()) { youWin ? Snd.good() : Snd.bad(); }
    $('#resBody').innerHTML = html; openOverlay('result');
  }
};

/* ---------- 覆盤 ---------- */
const RCLS = {
  top: { t: 'AI 首選', c: '#3f8a4f' }, good: { t: '好棋', c: '#3f8a4f' }, ok: { t: '可以', c: '#8a9a3a' },
  dub: { t: '疑問手', c: '#c48a1d' }, bad: { t: '惡手', c: '#b8412f' }, done: { t: '大勢已定', c: '#8a7a66' }, pass: { t: '虛手', c: '#8a7a66' }
};
const Review = {
  hist: [], opts: null, an: [], k: 0, job: null, mode: null, deepJob: null, alt: {}, altJob: null,
  open() {
    this.cancel();
    this.hist = Game.hist.slice(); this.opts = Game.opts; this.komi = Game.komi;
    this.an = new Array(this.hist.length).fill(null); this.k = 0; this.mode = null; this.alt = {};
    closeOverlay('result'); show('review'); this.render(); this.analyzeNext(0);
  },
  cancel() { for (const j of ['job', 'deepJob', 'altJob']) if (this[j]) { this[j].cancel(); this[j] = null; } },
  budget(mult) {
    const n = this.hist[0].n, f = n === 13 ? 0.6 : 1;
    return { maxPlayouts: Math.round(CFG.review.maxPlayouts * f * (mult || 1)), timeMs: CFG.review.timeMs * (mult || 1), komi: this.komi };
  },
  // 從搜尋樹取出 AI 預想的後續（每步拜訪最多的子節點）
  pvOf(m) {
    const out = []; let node = m.root;
    while (node && node.children && out.length < CFG.review.pvLen) {
      let best = null; for (const ch of node.children) if (!best || ch.N > best.N) best = ch;
      if (!best || best.N < CFG.review.pvMinVisits || best.move === PASS) break;
      out.push(best.move); node = best;
    }
    return out;
  },
  pack(res, m) {
    const cands = res.candidates.filter(c => c.visits > 0);
    let sv = 0, sw = 0; for (const c of cands) { sv += c.visits; sw += c.visits * c.winrate; }
    return { wr: sv ? sw / sv : res.winrate, cands: cands.slice(0, 3), all: cands, own: res.ownership, score: res.score, pv: this.pvOf(m), po: res.playouts };
  },
  // AI 那一手下下去之後的局面，也讓 AI 往下推演（和實戰那手公平比較）
  ensureAlt(k) {
    const a = this.an[k - 1]; if (!a || this.alt[k] || this.altJob) return;
    const best = a.cands[0] && a.cands[0].move; if (best == null || best === PASS) return;
    const b = this.hist[k - 1].clone(); if (b.play(best) < 0) return;
    this.altJob = GoAI.searchAsync(b, this.budget(), (res, m) => {
      this.altJob = null; this.alt[k] = Object.assign(this.pack(res, m), { board: b });
      if (current === 'review' && this.k === k) { this.draw(); this.body(); }
    });
  },
  store(i, res, m) {
    // 局面評估用依拜訪次數加權的平均勝率（只取第一名會系統性偏高，讓每手看起來都在虧）
    this.an[i] = this.pack(res, m);
  },
  analyzeNext(i) {
    while (i < this.hist.length && this.an[i]) i++;
    if (i >= this.hist.length) { this.job = null; this.render(); return; }
    this.job = GoAI.searchAsync(this.hist[i], this.budget(), (res, m) => {
      if (!this.job) return;
      this.store(i, res, m);
      if (current === 'review') this.render(true);
      this.analyzeNext(i + 1);
    });
  },
  deep() {
    const i = this.k - 1; if (i < 0 || this.deepJob) return;
    $('#rDeep').disabled = true; $('#rDeep').textContent = '分析中…';
    this.deepJob = GoAI.searchAsync(this.hist[i], this.budget(4), (res, m) => {
      this.deepJob = null; this.store(i, res, m); delete this.alt[i + 1]; this.render();
    });
  },
  // 第 k 手（1 起算）：hist[k-1] 下了一手變成 hist[k]
  move(k) { return this.hist[k].lastMove; },
  mover(k) { return this.hist[k - 1].toPlay; },
  who(c) {
    if (this.opts.opp !== 'ai') return colName(c) + '棋';
    return c === this.opts.color ? `你（${colName(c)}）` : `電腦（${colName(c)}）`;
  },
  isMe(c) { return this.opts.opp !== 'ai' || c === this.opts.color; },
  // 評價第 k 手
  judge(k) {
    const a = this.an[k - 1], b = this.an[k];
    if (!a || (!b && k < this.hist.length)) return null;
    const mv = this.move(k);
    const best = a.cands[0] ? a.cands[0].move : PASS;
    const before = a.wr;
    let after = b ? 1 - b.wr : before;
    const hit = a.all.find(c => c.move === mv);
    let loss = Math.max(0, before - after);
    if (mv === best) loss = 0;
    let cls;
    if (mv === PASS && best === PASS) cls = 'pass';
    else if (before > 0.96 || before < 0.04) cls = 'done';
    else if (mv === best) cls = 'top';
    else if (loss <= CFG.review.good) cls = 'good';
    else if (loss <= CFG.review.ok) cls = 'ok';
    else if (loss <= CFG.review.dubious) cls = 'dub';
    else cls = 'bad';
    return { before, after, loss, cls, best, hit };
  },
  blackWr(i) { const a = this.an[i]; if (!a) return null; return this.hist[i].toPlay === BLACK ? a.wr : 1 - a.wr; },
  go(k) { this.k = Math.max(0, Math.min(this.hist.length - 1, k)); this.mode = null; this.render(); },
  nextIssue(dir) {
    for (let k = this.k + dir; k >= 1 && k < this.hist.length; k += dir) {
      const j = this.judge(k); if (j && this.isMe(this.mover(k)) && (j.cls === 'dub' || j.cls === 'bad')) return this.go(k);
    }
    toast(dir > 0 ? '後面沒有分析完成的問題手了' : '前面沒有問題手了');
  },
  // 兩條路線：mine＝實戰那手＋之後預想；ai＝AI 那手＋之後預想
  line(k, which) {
    const b0 = this.hist[k - 1], a = this.an[k - 1];
    const first = which === 'ai' ? a.cands[0].move : this.move(k);
    const after = which === 'ai' ? this.alt[k] : this.an[k];
    return { first, pv: after ? after.pv.slice(0, CFG.review.pvLen - 1) : [], after, b0 };
  },
  draw() {
    const k = this.k;
    if (this.mode && k >= 1 && this.an[k - 1]) {
      const L = this.line(k, this.mode), b = L.b0.clone(), nums = new Map(); let n = 0, last = -1;
      for (const p of [L.first, ...L.pv]) { if (p === PASS || b.play(p) < 0) break; nums.set(p, ++n); last = p; }
      rView.set({ board: b, numbers: nums, last, hoverColor: 0, own: L.after ? L.after.own : null });
      return;
    }
    const st = { board: this.hist[k], last: this.hist[k].lastMove, hoverColor: 0 };
    if (k >= 1 && this.an[k - 1]) {
      const best = this.an[k - 1].cands[0];
      if (best && best.move !== this.move(k) && best.move !== PASS) { st.marks = { 'AI': best.move }; st.markColor = { 'AI': '#3f8a4f' }; }
    } else if (k === 0 && this.an[0] && this.an[0].cands[0]) { st.marks = { 'AI': this.an[0].cands[0].move }; st.markColor = { 'AI': '#3f8a4f' }; }
    rView.set(st);
  },
  graph() {
    const n = this.hist.length, W = 340, H = 86, X = i => 6 + (W - 12) * (n <= 1 ? 0 : i / (n - 1)), Y = v => 6 + (H - 12) * (1 - v);
    let pts = [], dots = '';
    for (let i = 0; i < n; i++) { const v = this.blackWr(i); if (v != null) pts.push(`${X(i).toFixed(1)},${Y(v).toFixed(1)}`); }
    for (let k = 1; k < n; k++) {
      const j = this.judge(k); if (!j || !this.isMe(this.mover(k)) || (j.cls !== 'dub' && j.cls !== 'bad')) continue;
      const v = this.blackWr(k); if (v == null) continue;
      dots += `<circle cx="${X(k)}" cy="${Y(v)}" r="${j.cls === 'bad' ? 4 : 3}" fill="${RCLS[j.cls].c}"/>`;
    }
    return `<svg id="rGraph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px;display:block;background:#0003;border-radius:8px;cursor:pointer">
      <rect x="0" y="0" width="${W}" height="${H / 2}" fill="#00000030"/>
      <line x1="0" y1="${Y(.5)}" x2="${W}" y2="${Y(.5)}" stroke="#a8957c" stroke-dasharray="3 3" stroke-width=".8"/>
      <line x1="${X(this.k)}" y1="0" x2="${X(this.k)}" y2="${H}" stroke="#ffd34d" stroke-width="1.5"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="#f6ecd8" stroke-width="2" vector-effect="non-scaling-stroke"/>${dots}</svg>
      <div class="note" style="display:flex;justify-content:space-between"><span>上方＝黑棋領先、下方＝白棋領先</span><span>點曲線可以跳到那一手</span></div>`;
  },
  explainList(board, p, a) {
    let gain = null;
    const c = a && a.all.find(x => x.move === p);
    if (c && c.own && c.visits >= 150) gain = GoExplain.territoryGain(board, c.own, a.own, board.toPlay);
    return GoExplain.explainMove(board, p, { gain }).map(it => it.text);
  },
  compare(k, j) {
    const b0 = this.hist[k - 1], mv = this.move(k), best = j.best, out = [];
    const mine = GoExplain.explainMove(b0, mv, {}), ai = GoExplain.explainMove(b0, best, {});
    const urgent = it => ['u1', 'u2', 'u3', 'u6', 'u7', 'u8', 'u9'].includes(it.tag);
    if (mine.some(it => it.text.startsWith('注意：'))) out.push('你下的這手自己只剩一口氣，很危險。');
    if (ai.some(urgent) && !mine.some(urgent)) out.push(`這時盤上有更急的事：${ai.find(urgent).text}先處理急事，再去搶大場。`);
    else if (mv !== PASS && best !== PASS) {
      const r1 = GoExplain.region(b0, mv), r2 = GoExplain.region(b0, best);
      if (r1 !== r2) out.push(`方向上，AI 認為${r2}比${r1}更重要。`);
    }
    return out;
  },
  summary() {
    const cnt = {}, worst = [];
    let done = 0;
    for (let k = 1; k < this.hist.length; k++) {
      const j = this.judge(k); if (!j) continue; done++;
      if (!this.isMe(this.mover(k))) continue;
      cnt[j.cls] = (cnt[j.cls] || 0) + 1;
      if (j.cls === 'dub' || j.cls === 'bad') worst.push([j.loss, k]);
    }
    worst.sort((a, b) => b[0] - a[0]);
    const who = this.opts.opp === 'ai' ? '你的手' : '雙方的手';
    const order = ['top', 'good', 'ok', 'dub', 'bad'];
    let h = `<h4>總結</h4><p>${who}：${order.map(c => `<span style="color:${RCLS[c].c};font-weight:700">${RCLS[c].t} ${cnt[c] || 0}</span>`).join('、')}</p>`;
    if (worst.length) h += `<p>最值得檢討的${Math.min(3, worst.length)}手：${worst.slice(0, 3).map(([l, k]) => `<a class="rjump" data-k="${k}">第 ${k} 手 ${this.hist[k - 1].name(this.move(k))}（-${Math.round(l * 100)}%）</a>`).join('、')}</p>`;
    else if (done) h += '<p>目前分析到的手裡沒有明顯的疑問手。</p>';
    h += `<p class="note">評價看的是「這手讓自己的勝率掉了多少」：AI 首選＝和 AI 第一選擇一樣；好棋＝掉不到 ${Math.round(CFG.review.good * 100)}%；可以＝${Math.round(CFG.review.ok * 100)}% 以內；疑問手＝${Math.round(CFG.review.dubious * 100)}% 以內；惡手＝更多。勝率是電腦模擬的估計，差幾 % 以內不用太在意。按 ▶ 從第一手開始看。</p>`;
    return h;
  },
  render(bg) {
    const n = this.hist.length - 1, done = this.an.filter(Boolean).length;
    $('#rProg').textContent = done < this.hist.length ? `AI 分析中… ${done} / ${this.hist.length}（可以先看已分析的手）` : `分析完成，共 ${n} 手`;
    $('#rBar').style.width = (done / this.hist.length * 100) + '%';
    $('#rBar').parentNode.style.visibility = done < this.hist.length ? 'visible' : 'hidden';
    $('#rGraphBox').innerHTML = this.graph();
    $('#rCnt').textContent = this.k === 0 ? `開始 / ${n} 手` : `第 ${this.k} / ${n} 手`;
    this.draw();
    // 背景更新時，正在看的手如果已經有內容就不重畫（避免捲動跳掉）
    if (bg && this.shown === this.k && this.shownFull) return;
    this.body();
  },
  // 比較兩條路線的地盤：回傳 { pts: AI 那條多幾目（站在下這手的一方）, regions: [[區域, 目數]] }
  diffLines(k) {
    const c = this.mover(k), sg = c === BLACK ? 1 : -1, A = this.alt[k], M = this.an[k], b = this.hist[k - 1];
    if (!A || !M) return null;
    const reg = {};
    for (const p of b.points) { const d = (A.own[p] - M.own[p]) * sg; const r = GoExplain.region(b, p); reg[r] = (reg[r] || 0) + d; }
    const regions = Object.entries(reg).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
    return { pts: (A.score - M.score) * sg, regions, wrAI: 1 - A.wr, wrMine: 1 - M.wr };
  },
  replyText(k, which) {
    const L = this.line(k, which); if (!L.after || !L.pv.length) return null;
    const bb = L.b0.clone(); bb.play(L.first);
    const reply = L.pv[0], who = colName(bb.toPlay);
    const ex = GoExplain.explainMove(bb, reply, {}).map(it => it.text).filter(t => !t.startsWith('這手沒有立即'));
    return `${who}棋最好的應法是 ${bb.name(reply)}` + (ex.length ? `：${ex.join('')}` : '。');
  },
  body() {
    const k = this.k, box = $('#rBody');
    this.shown = k; this.shownFull = false;
    if (k === 0) { box.innerHTML = this.summary(); this.shownFull = !this.job; this.bindBody(); return; }
    const j = this.judge(k);
    const mv = this.move(k), c = this.mover(k), b0 = this.hist[k - 1], nm = b0.name(mv);
    if (!j) { box.innerHTML = `<h4>第 ${k} 手：${this.who(c)}下 ${nm}</h4><p class="note">AI 還在分析這一手，請稍等…</p>`; return; }
    const a = this.an[k - 1], me = this.isMe(c), cl = RCLS[j.cls], cn = colName(c);
    const bw = v => Math.round((c === BLACK ? v : 1 - v) * 100);
    const you = me ? (this.opts.opp === 'ai' ? '你' : '實戰') : '電腦';
    let h = `<h4>第 ${k} 手：${this.who(c)}下 ${nm} <span class="rbadge" style="background:${cl.c}">${cl.t}</span></h4>`;
    h += `<p class="note">黑棋勝率 ${bw(j.before)}% → ${bw(j.after)}%` + (j.loss >= 0.01 ? `（${cn}棋少了約 ${Math.round(j.loss * 100)}%）` : '') + `</p>`;
    if (j.cls === 'done') h += `<p class="note">這時勝負已經大致確定（勝率超過 96% 或低於 4%），AI 對每一手的差別不太敏感，評價僅供參考。</p>`;
    if (mv === j.best || j.best === PASS || mv === PASS) {
      h += `<div class="rsec"><b>這手的作用</b><ul>${this.explainList(b0, mv, a).map(t => `<li>${t}</li>`).join('')}</ul></div>`;
      h += `<p class="rsec">${mv === j.best ? (me ? '和 AI 的第一選擇一樣，下得好！' : '這是 AI 的第一選擇。') : (mv === PASS ? 'AI 認為盤上還有可以下的地方，不該虛手。' : '')}</p>`;
      if (a.pv.length && mv === j.best) h += `<div><button class="btn small" data-act="rmode" data-m="mine">${this.mode === 'mine' ? '回到實戰' : '看之後的預想'}</button></div>`;
    } else {
      const ai = j.best, an = b0.name(ai);
      h += `<p class="rsec">棋盤上綠色 <b style="color:#5fbf6f">AI</b> 是 AI 會下的位置。下面讓兩手都往下推演幾步，比較結果。</p>`;
      h += `<div class="rcmp"><div class="rcol mine"><b>${you}下的 ${nm}</b><ul>${this.explainList(b0, mv, a).map(t => `<li>${t}</li>`).join('')}</ul>`;
      const r1 = this.replyText(k, 'mine'); if (r1) h += `<p>接下來${r1}</p>`;
      h += `</div><div class="rcol ai"><b>AI 下的 ${an}</b><ul>${this.explainList(b0, ai, a).map(t => `<li>${t}</li>`).join('')}</ul>`;
      if (this.alt[k]) { const r2 = this.replyText(k, 'ai'); if (r2) h += `<p>接下來${r2}</p>`; }
      else { this.ensureAlt(k); h += `<p class="note">AI 正在推演這條路線…</p>`; }
      h += `</div></div>`;
      const d = this.diffLines(k);
      if (d) {
        const pts = d.pts, big = d.regions.filter(([r, v]) => Math.abs(v) >= 1).slice(0, 3);
        let t = `<div class="rsec rdiff"><b>差別在哪裡</b><ul>`;
        t += `<li>推演到最後，AI 的下法${pts >= 0.5 ? `大約多 <b>${pts.toFixed(1)} 目</b>` : pts <= -0.5 ? `反而少 ${(-pts).toFixed(1)} 目（但勝率較高，代表比較安全、不容易出事）` : '目數差不多，差別主要在棋的安全性'}，${cn}棋勝率 ${Math.round(d.wrAI * 100)}% 對 ${Math.round(d.wrMine * 100)}%。</li>`;
        for (const [r, v] of big) t += v > 0 ? `<li><b>${r}</b>：AI 的下法在這裡多約 ${v.toFixed(1)} 目。${you === '你' ? '你的下法' : '實戰的下法'}讓這一帶被對方拿走或變成雙方都不確定的地方。</li>` : `<li><b>${r}</b>：${you === '你' ? '你的下法' : '實戰的下法'}在這裡反而多約 ${(-v).toFixed(1)} 目，但整體還是不如 AI 的下法。</li>`;
        this.compare(k, j).forEach(x => { t += `<li>${x}</li>`; });
        t += `</ul><p class="note">兩個按鈕會在棋盤上擺出各自的推演（數字是順序），並用小方塊標出推演後預計的地盤：黑方塊＝黑棋的地、白方塊＝白棋的地。兩邊切換比較，看方塊在哪裡變多變少，就是差別所在。</p></div>`;
        h += t;
      }
      h += `<div style="margin-top:6px"><button class="btn small" data-act="rmode" data-m="mine">${this.mode === 'mine' ? '✓ ' : ''}${you}的下法之後</button><button class="btn small" data-act="rmode" data-m="ai" ${this.alt[k] ? '' : 'disabled'}>${this.mode === 'ai' ? '✓ ' : ''}AI 的下法之後</button>${this.mode ? '<button class="btn small dark" data-act="rmode" data-m="">回到實戰</button>' : ''}</div>`;
      if (!me && (j.cls === 'dub' || j.cls === 'bad') && this.opts.diff !== 'hard') h += `<p class="note">電腦在「${CFG.difficulty[this.opts.diff].name}」難度會故意犯一些錯，這手可能就是。下一手如果抓到機會，就是你的好機會。</p>`;
    }
    h += `<div style="margin-top:6px"><button class="btn small dark" id="rDeep" data-act="rdeep">深入分析這手（${a.po} → 約 ${a.po * 4} 次模擬）</button></div>`;
    box.innerHTML = h; this.shownFull = true; this.bindBody();
  },
  bindBody() { $$('#rBody .rjump').forEach(x => x.onclick = () => this.go(+x.dataset.k)); },
  graphClick(e) {
    const svg = e.target.closest('#rGraph'); if (!svg) return;
    const r = svg.getBoundingClientRect(), n = this.hist.length;
    this.go(Math.round((e.clientX - r.left - 6 * r.width / 340) / (r.width * (332 / 340)) * (n - 1)));
  },
  setMode(m) { this.mode = m || null; this.draw(); this.body(); },
  leave(to) { this.cancel(); if (to === 'game') show('game'); else show('menu'); }
};

/* ---------- 教學 ---------- */
const GRADE = { best: '正解', ok: '可以，但不是最好', bad: '不好' };
const GCOL = { best: '#3f8a4f', ok: '#c48a1d', bad: '#b8412f' };
const Lesson = {
  ui: 0, pi: 0, base: null, marks: null, answered: false, chosen: null, viewing: null, step: 0, frames: [], timer: null, from: 'lessons', tries: 0,
  progress() { return store.get('progress', {}); },
  renderList() {
    const prog = this.progress();
    $('#ulist').innerHTML = GoLessons.UNITS.map((u, i) => `
      <button class="ucard" data-i="${i}">
        <div class="ut">${u.icon} ${u.title}</div>
        <div class="up">原則：${u.principle.name}</div>
        <div class="dots">${u.problems.map(p => `<i class="${prog[p.id] === 'ok' ? 'ok' : prog[p.id] ? 'done' : ''}" title="${prog[p.id] === 'ok' ? '一次答對' : prog[p.id] ? '已練習' : '未練習'}"></i>`).join('')}</div>
      </button>`).join('');
    $$('#ulist .ucard').forEach(c => c.onclick = () => { Snd.tick(); this.openUnit(+c.dataset.i, 'lessons'); });
  },
  openUnit(i, from) {
    this.from = from || 'lessons';
    if (from === 'game') { this.returnGame = true; } else this.returnGame = false;
    this.ui = i; const prog = this.progress();
    const u = GoLessons.UNITS[i]; let pi = u.problems.findIndex(p => !prog[p.id]); if (pi < 0) pi = 0;
    this.pi = pi; show('lesson'); this.showProblem();
  },
  get unit() { return GoLessons.UNITS[this.ui]; },
  get prob() { return this.unit.problems[this.pi]; },
  showProblem() {
    this.stopPlay();
    const u = this.unit, pr = this.prob;
    const { b, marks } = fromDiagram(pr.rows); this.base = b; this.marks = marks;
    this.answered = false; this.chosen = null; this.viewing = null; this.frames = [b]; this.step = 0; this.tries = 0;
    $('#lTitle').textContent = `${u.icon} ${u.title}`;
    $('#lCount').textContent = `第 ${this.pi + 1} / ${u.problems.length} 題 ・ 黑棋先下`;
    $('#lQ').textContent = pr.q; $('#lHint').style.display = 'none'; $('#lHint').textContent = '提示：' + pr.hint;
    $('#lPre').style.display = ''; $('#lAns').style.display = 'none'; $('#lPrinciple').style.display = 'none'; $('#lNav').style.display = 'none';
    this.renderOpts(); this.draw(); resize();
  },
  keys() { return Object.keys(this.prob.options).sort(); },
  renderOpts() {
    const pr = this.prob;
    $('#lOpts').innerHTML = this.keys().map(k => {
      const o = pr.options[k], name = this.base.name(this.marks[k]);
      if (!this.answered) return `<button class="opt" data-k="${k}"><span class="lt">${k.toUpperCase()}</span><span>${name}</span></button>`;
      return `<button class="opt ${o.grade} ${this.viewing === k ? 'viewing' : ''}" data-k="${k}"><span class="lt">${k.toUpperCase()}</span><span>${o.title}</span><span class="gr">${GRADE[o.grade]}${this.chosen === k ? ' ・ 你的選擇' : ''}</span></button>`;
    }).join('');
    $$('#lOpts .opt').forEach(btn => btn.onclick = () => this.pick(btn.dataset.k));
  },
  pick(k) {
    if (paused) return;
    const pr = this.prob, o = pr.options[k];
    if (!this.answered) {
      this.answered = true; this.chosen = k; this.tries++;
      const prog = this.progress();
      if (!prog[pr.id] || prog[pr.id] !== 'ok') prog[pr.id] = (o.grade === 'best' && this.tries === 1 && !this.retried) ? 'ok' : 'done';
      store.set('progress', prog);
      o.grade === 'best' ? Snd.good() : o.grade === 'ok' ? Snd.okay() : Snd.bad();
      $('#lPre').style.display = 'none'; $('#lAns').style.display = ''; $('#lNav').style.display = '';
      this.renderPrinciple(); $('#lPrinciple').style.display = '';
      $('[data-act=lnext]').textContent = this.pi + 1 >= this.unit.problems.length ? '完成單元 ✓' : '下一題 ▶';
    } else Snd.tick();
    this.view(k);
  },
  view(k) {
    this.stopPlay();
    this.viewing = k; const pr = this.prob, o = pr.options[k];
    // 建立每一步的盤面
    const frames = [this.base]; let b = this.base.clone(); b.toPlay = BLACK;
    const notes = ['題目局面'], nums = [new Map()];
    let numMap = new Map();
    o.seq.forEach((s, i) => {
      const [mv, note] = s.split('|'); const p = b.parse(mv); const who = colName(b.toPlay);
      const cap = b.play(p);
      numMap = new Map([...numMap].filter(([q]) => b.b[q] !== EMPTY)); numMap.set(p, i + 1);
      frames.push(b.clone()); nums.push(new Map(numMap));
      notes.push(`${i + 1}. ${who} ${mv}${cap > 0 ? `（提 ${cap} 子）` : ''}${note ? '：' + note : ''}`);
    });
    this.frames = frames; this.notes = notes; this.nums = nums; this.step = 0;
    const isChosen = k === this.chosen;
    const v = $('#lVerdict'); v.className = 'verdict ' + o.grade;
    v.textContent = isChosen ? (o.grade === 'best' ? '✓ 正解！' : o.grade === 'ok' ? '△ 可以，但不是最好' : '✕ 不對') + `　${k.toUpperCase()}：${o.title}` : `選項 ${k.toUpperCase()}：${o.title}（${GRADE[o.grade]}）`;
    $('#lExplain').textContent = o.text;
    this.renderOpts(); this.draw();
    if (frames.length > 1) this.play();
  },
  renderPrinciple() {
    const p = this.unit.principle;
    $('#lPrinciple').innerHTML = `<h3>原則卡：${p.name}</h3><dl>
      <dt>原則</dt><dd>${p.rule}</dd>
      <dt>什麼時候用</dt><dd>${p.when}</dd>
      <dt>什麼時候不適用</dt><dd>${p.not}</dd>
      <dt>自我檢查</dt><dd>${p.check}</dd></dl>`;
  },
  draw() {
    const f = this.frames[this.step] || this.base;
    const markColor = {};
    if (this.answered) for (const k in this.prob.options) markColor[k] = GCOL[this.prob.options[k].grade];
    let last = -1;
    if (this.step > 0 && this.viewing) { const s = this.prob.options[this.viewing].seq[this.step - 1]; last = f.parse(s.split('|')[0]); }
    lView.set({
      board: f, marks: this.step === 0 ? this.marks : null, markColor,
      numbers: this.step > 0 ? this.nums[this.step] : null, last,
      hoverColor: 0
    });
    if (this.answered) {
      $('#lStep').textContent = this.notes ? this.notes[this.step] : '';
      $('#lStepCnt').textContent = this.frames.length > 1 ? `${this.step} / ${this.frames.length - 1}` : '';
    }
  },
  boardClick(p) {
    if (paused) return;
    for (const k in this.marks) if (this.marks[k] === p && this.prob.options[k]) return this.pick(k);
  },
  go(s) { this.stopPlay(); this.step = Math.max(0, Math.min(this.frames.length - 1, s)); this.draw(); },
  stepMove(d) {
    if (!this.answered) return;
    const s = this.step + d; if (s < 0 || s >= this.frames.length) return;
    this.step = s; if (d > 0) { Snd.stone(); } this.draw();
  },
  play() {
    this.stopPlay();
    if (this.step >= this.frames.length - 1) this.step = 0;
    this.draw();
    const tick = () => {
      if (paused) { this.timer = null; return; }
      if (this.step >= this.frames.length - 1) { this.timer = null; $('[data-act=vplay]').textContent = '▶ 播放'; return; }
      this.stepMove(1);
      this.timer = setTimeout(tick, settings.speed);
    };
    $('[data-act=vplay]').textContent = '❚❚ 停止';
    this.timer = setTimeout(tick, Math.min(600, settings.speed));
  },
  stopPlay() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } const b = $('[data-act=vplay]'); if (b) b.textContent = '▶ 播放'; },
  togglePlay() { if (!this.answered) return; if (this.timer) this.stopPlay(); else this.play(); },
  next() {
    this.retried = false;
    if (this.pi + 1 < this.unit.problems.length) { this.pi++; this.showProblem(); }
    else {
      toast(`「${this.unit.title}」單元完成！`);
      if (this.returnGame) { show('game'); Game.draw(); } else { this.renderList(); show('lessons'); }
    }
  },
  retry() { this.retried = true; this.showProblem(); }
};


/* ---------- 定石練習 ---------- */
const JVIEW = { x0: 7, y0: 0, w: 12 };
const Joseki = {
  j: null, ji: 0, idx: 0, b: null, nums: null, answered: false, viewing: null, wrong: 0, stepWrong: false, timer: null,
  _all: null, filt: Object.assign({ cat: 'classic', lv: 0 }, store.get('jfilt', {})),
  list() {
    if (!this._all) {
      const book = (window.GoJosekiBook || []).map(j => Object.assign({ book: true }, j));
      this._all = GoJoseki.JOSEKI.map(j => Object.assign({ cat: 'classic' }, j)).concat(book);
    }
    return this._all;
  },
  inFilter(j) {
    const f = this.filt;
    const cat = f.cat === 'other' ? !['classic', '星位', '小目'].includes(j.cat) : j.cat === f.cat;
    return cat && (!f.lv || j.level === f.lv);
  },
  // 依這個定石用到的範圍決定棋盤顯示哪一塊（一定包含右上角）
  viewFor(j) {
    let minX = 18, maxY = 0;
    const pts = [].concat(j.setup.B || [], j.setup.W || []);
    j.steps.forEach(s => { pts.push(s.m); (s.alts || []).forEach(a => pts.push(a.m)); });
    pts.forEach(s => { const x = s.charCodeAt(0) - 97, y = s.charCodeAt(1) - 97; minX = Math.min(minX, x); maxY = Math.max(maxY, y); });
    let w = Math.max(10, 18 - minX + 2, maxY + 2); w = Math.min(19, w);
    return { x0: 19 - w, y0: 0, w };
  },
  P(s) { return this.b.pt(s.charCodeAt(0) - 97, s.charCodeAt(1) - 97); },
  rec() { return store.get('joseki', {}); },
  renderList() {
    const rec = this.rec(), L = GoJoseki.LEVELS, BL = { 1: '入門', 2: '初級', 3: '中級', 4: '高級' }; let html = '', lv = 0;
    $$('#jCat button').forEach(b => b.classList.toggle('on', b.dataset.v === this.filt.cat));
    $$('#jLv button').forEach(b => b.classList.toggle('on', +b.dataset.v === this.filt.lv));
    $$('#jCat button').forEach(b => b.onclick = () => { Snd.tick(); this.filt.cat = b.dataset.v; store.set('jfilt', this.filt); this.renderList(); });
    $$('#jLv button').forEach(b => b.onclick = () => { Snd.tick(); this.filt.lv = +b.dataset.v; store.set('jfilt', this.filt); this.renderList(); });
    this.list().forEach((j, i) => {
      if (!this.inFilter(j)) return;
      if (j.level !== lv) { lv = j.level; html += `<div class="lvl">${j.book ? BL[lv] : L[lv]}</div>`; }
      const r = rec[j.id];
      html += `<button class="ucard" data-i="${i}"><div class="ut">${j.name}</div>
        <div class="up">${j.steps.length} 手 ・ ${r ? `最佳：${r.best} / ${j.steps.length} 手一次答對` : '未練習'}</div>
        <div class="dots">${j.steps.map((_, k) => `<i class="${r ? (k < r.best ? 'ok' : 'done') : ''}"></i>`).join('')}</div></button>`;
    });
    $('#jlist').innerHTML = html || '<div class="note">這個分類沒有這個難度的定石。</div>';
    $$('#jlist .ucard').forEach(c => c.onclick = () => { Snd.tick(); this.open(+c.dataset.i); });
  },
  open(i) {
    this.stopReplay();
    this.ji = i; this.j = this.list()[i]; const j = this.j;
    this.view = j.book ? this.viewFor(j) : JVIEW;
    this.b = new Board(19);
    (j.setup.B || []).forEach(s => this.b.b[this.P(s)] = BLACK);
    (j.setup.W || []).forEach(s => this.b.b[this.P(s)] = WHITE);
    this.b.toPlay = j.first === 'W' ? WHITE : BLACK;
    this.start = this.b.clone();
    this.idx = 0; this.wrong = 0; this.nums = new Map(); this.firstOk = 0; this.done = false;
    $('#jTitle').textContent = j.name;
    $('#jIntro').textContent = j.intro; $('#jIntro').style.display = '';
    $('#jEnd').style.display = 'none';
    show('joseki'); this.showStep();
  },
  get step() { return this.j.steps[this.idx]; },
  // 選項順序：用定石編號與手數決定，同一題每次一樣
  options() {
    const st = this.step;
    if (!st.alts || !st.alts.length) return [];
    const arr = [{ m: st.m, g: 'best', main: true, t: st.why }].concat(st.alts);
    let seed = 0; for (const ch of this.j.id + this.idx) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    for (let i = arr.length - 1; i > 0; i--) { seed = (seed * 1103515245 + 12345) >>> 0; const k = seed % (i + 1); [arr[i], arr[k]] = [arr[k], arr[i]]; }
    return arr.map((o, i) => Object.assign({ key: 'abcd'[i] }, o));
  },
  showStep() {
    this.answered = false; this.viewing = null; this.stepWrong = false; this.tried = new Set(); this.hintArea = null;
    if (this.step.c) this.b.toPlay = this.step.c === 'B' ? BLACK : WHITE;
    this.opts = this.options(); this.clickMode = !this.opts.length; this.clicks = 0;
    const who = colName(this.b.toPlay);
    $('#jTenuki').textContent = this.step.tenuki ? `（${colName(3 - this.b.toPlay)}棋上一手脫先，下在別的地方，所以又輪到${who}棋。）` : '';
    $('#jCount').textContent = `第 ${this.idx + 1} / ${this.j.steps.length} 手 ・ 輪到${who}棋 ・ 目前一次答對 ${this.firstOk} 手`;
    $('#jQ').textContent = this.clickMode ? `${who}棋下一手下哪裡？請直接點棋盤。` : `${who}棋下一手下哪裡？`;
    if (this.idx > 0) $('#jIntro').style.display = 'none';
    $('#jOptPanel').style.display = ''; $('#jReveal').style.display = '';
    $('#jAns').style.display = 'none';
    this.renderOpts(); this.draw();
  },
  renderOpts() {
    if (this.clickMode) {
      $('#jOpts').innerHTML = `<div class="note">書上這一手沒有列出其他選項，是接下來的正常手順。想一想${colName(this.b.toPlay)}棋要補哪裡、要攻哪裡，直接在棋盤上點。</div>`;
      return;
    }
    $('#jOpts').innerHTML = this.opts.map(o => {
      const name = this.b.name(this.P(o.m));
      const show = this.answered || this.tried.has(o.key);
      const cls = show ? o.g : '';
      const label = show ? (o.main ? '定石' : o.g === 'best' ? '也正確' : o.g === 'ok' ? '可以，但不是這題' : '不好') : '';
      return `<button class="opt ${cls} ${this.viewing === o.key ? 'viewing' : ''}" data-k="${o.key}"><span class="lt">${o.key.toUpperCase()}</span><span>${name}</span><span class="gr">${label}</span></button>`;
    }).join('');
    $$('#jOpts .opt').forEach(btn => btn.onclick = () => this.pick(btn.dataset.k));
  },
  draw() {
    const marks = {}, markColor = {};
    if (!this.done) for (const o of this.opts) { marks[o.key] = this.P(o.m); if (this.answered || this.tried.has(o.key)) markColor[o.key] = GCOL[o.g]; }
    const vo = (this.viewing && !this.done) ? this.opts.find(o => o.key === this.viewing) : null;
    if (this.clickMode && !this.done && this.answered) { marks['✓'] = this.P(this.step.m); markColor['✓'] = GCOL.best; }
    if (this.clickMode && !this.done && !this.answered && this.hintArea) Object.assign(marks, this.hintArea);
    const st = { board: this.b, view: this.view, marks: this.done ? null : marks, markColor, numbers: this.nums, last: this.b.lastMove, hoverColor: 0 };
    if (vo) { st.ghost = this.P(vo.m); st.hoverColor = this.b.toPlay; delete st.marks[vo.key]; }
    jView.set(st);
  },
  // 答完之後：補上局部判斷與書上的完整說明
  fillExtra() {
    const st = this.step, p = this.P(st.m);
    let loc = '';
    try { loc = GoExplain.explainMove(this.b, p, {}).filter(x => x.tag !== 'u10').map(x => x.text).join(' '); } catch (e) { loc = ''; }
    $('#jLocal').textContent = loc ? `局部判斷：${loc}` : '';
    $('#jNoteBox').style.display = st.note ? '' : 'none'; $('#jNoteBox').open = false;
    $('#jNote').textContent = st.note || '';
  },
  whyText(st) { return GoJoseki.sideText(st.why || '書上這一手沒有另外說明，是這個變化接下來的正常手順。'); },
  clickAnswer(p) {
    if (this.answered) return;
    const st = this.step, ans = this.P(st.m), name = this.b.name(ans);
    if (p !== ans && this.b.b[p] !== EMPTY) return;
    $('#jAns').style.display = '';
    if (p === ans) {
      this.answered = true; if (!this.stepWrong) this.firstOk++;
      Snd.good();
      $('#jVerdict').className = 'verdict best'; $('#jVerdict').textContent = `✓ 正確！${name}`;
      $('#jExplain').textContent = this.whyText(st); $('#jMain').textContent = '';
      $('#jReveal').style.display = 'none'; this.fillExtra();
    } else {
      if (!this.stepWrong) { this.stepWrong = true; this.wrong++; }
      this.clicks++; Snd.bad();
      $('#jVerdict').className = 'verdict bad'; $('#jVerdict').textContent = `✕ 不是 ${this.b.name(p)}`;
      if (this.clicks >= 2) {
        const [x, y] = this.b.xy(ans); this.hintArea = {}; let k = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (x + dx < 0 || x + dx > 18 || y + dy < 0 || y + dy > 18) continue;
          const q = this.b.pt(x + dx, y + dy);
          if (this.b.b[q] === EMPTY) this.hintArea['?' + (k++)] = q;
        }
        $('#jExplain').textContent = '提示：答案在棋盤上標「?」的範圍裡。';
      } else $('#jExplain').textContent = '再想一次。對方剛下的那手威脅到什麼？自己哪裡最需要補？';
      $('#jMain').textContent = '再點一次，或按「看正解」。'; $('#jLocal').textContent = ''; $('#jNoteBox').style.display = 'none';
    }
    $('#jNextBtn').style.display = this.answered ? '' : 'none';
    $('#jNextBtn').textContent = this.idx + 1 >= this.j.steps.length ? '完成 ✓' : '下一手 ▶';
    this.draw();
  },
  pick(k) {
    if (paused || this.done) return;
    const o = this.opts.find(x => x.key === k); if (!o) return;
    this.viewing = k;
    const T = GoJoseki.sideText, main = this.opts.find(x => x.main);
    $('#jAns').style.display = '';
    if (!this.answered) {
      this.tried.add(k);
      if (o.g === 'best') {
        this.answered = true; if (!this.stepWrong) this.firstOk++;
        Snd.good();
        $('#jVerdict').className = 'verdict best';
        $('#jVerdict').textContent = o.main ? '✓ 正確！' : '✓ 也正確！';
        $('#jExplain').textContent = o.main ? this.whyText(this.step) : T(o.t);
        $('#jMain').textContent = o.main ? '' : `這個定石接下來照主線走：${this.b.name(this.P(main.m))}。${this.whyText(this.step)}`;
        $('#jReveal').style.display = 'none'; this.fillExtra();
      } else {
        if (!this.stepWrong) { this.stepWrong = true; this.wrong++; }
        o.g === 'ok' ? Snd.okay() : Snd.bad();
        $('#jVerdict').className = 'verdict ' + o.g;
        $('#jVerdict').textContent = o.g === 'ok' ? (this.j.book ? '△ 書上也有這手，但不是這題的定石' : '△ 可以，但不是這個定石') : '✕ 不好';
        $('#jExplain').textContent = T(o.t); $('#jLocal').textContent = ''; $('#jNoteBox').style.display = 'none';
        $('#jMain').textContent = '再選一次，或按「看正解」。';
      }
    } else {
      Snd.tick();
      $('#jVerdict').className = 'verdict ' + o.g;
      $('#jVerdict').textContent = `${o.key.toUpperCase()}：${this.b.name(this.P(o.m))}（${o.main ? '定石' : o.g === 'best' ? '也正確' : o.g === 'ok' ? '可以，但不是這題' : '不好'}）`;
      $('#jExplain').textContent = o.main ? this.whyText(this.step) : T(o.t);
      $('#jMain').textContent = o.main ? '' : `定石的下法是 ${this.b.name(this.P(main.m))}。`;
    }
    $('#jNextBtn').style.display = this.answered ? '' : 'none';
    $('#jNextBtn').textContent = this.idx + 1 >= this.j.steps.length ? '完成 ✓' : '下一手 ▶';
    this.renderOpts(); this.draw();
  },
  reveal() {
    if (this.answered) return;
    if (!this.stepWrong) { this.stepWrong = true; this.wrong++; }
    this.answered = true;
    $('#jAns').style.display = '';
    const main = this.opts.find(x => x.main);
    if (main) this.viewing = main.key;
    $('#jVerdict').className = 'verdict best'; $('#jVerdict').textContent = `正解：${this.b.name(this.P(this.step.m))}`;
    $('#jExplain').textContent = this.whyText(this.step); $('#jMain').textContent = main ? '點其他選項可以看它們為什麼比較差。' : '';
    this.fillExtra();
    $('#jReveal').style.display = 'none';
    $('#jNextBtn').style.display = ''; $('#jNextBtn').textContent = this.idx + 1 >= this.j.steps.length ? '完成 ✓' : '下一手 ▶';
    this.renderOpts(); this.draw();
  },
  next() {
    if (!this.answered) return;
    const p = this.P(this.step.m);
    this.b.play(p); this.nums.set(p, this.idx + 1); Snd.stone();
    this.idx++;
    if (this.idx >= this.j.steps.length) return this.finish();
    this.showStep();
  },
  finish() {
    this.done = true;
    const j = this.j, n = j.steps.length, rec = this.rec();
    const prev = rec[j.id]; rec[j.id] = { best: Math.max(prev ? prev.best : 0, this.firstOk), last: this.firstOk };
    store.set('joseki', rec);
    $('#jOptPanel').style.display = 'none'; $('#jAns').style.display = 'none'; $('#jEnd').style.display = '';
    $('#jQ').textContent = ''; $('#jCount').textContent = `全部 ${n} 手`;
    $('#jResult').textContent = GoJoseki.sideText(j.result);
    $('#jScore').textContent = `一次就選對 ${this.firstOk} / ${n} 手` + (this.firstOk === n ? '，全部答對！' : '。選錯的手可以再練一次。');
    this.firstOk === n ? Snd.good() : Snd.okay();
    this.draw();
  },
  replay() {
    this.stopReplay();
    const j = this.j; let k = 0;
    const b = this.start.clone(), nums = new Map();
    const tick = () => {
      if (paused) { this.timer = null; return; }
      if (k >= j.steps.length) { this.timer = null; return; }
      const p = b.pt(j.steps[k].m.charCodeAt(0) - 97, j.steps[k].m.charCodeAt(1) - 97);
      if (j.steps[k].c) b.toPlay = j.steps[k].c === 'B' ? BLACK : WHITE;
      b.play(p); nums.set(p, k + 1); k++; Snd.stone();
      jView.set({ board: b, view: this.view, numbers: nums, last: p, hoverColor: 0 });
      this.timer = setTimeout(tick, settings.speed);
    };
    jView.set({ board: b, view: this.view, numbers: nums, hoverColor: 0 });
    this.timer = setTimeout(tick, 500);
  },
  stopReplay() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } },
  boardClick(p) {
    if (paused || this.done) return;
    if (this.clickMode) return this.clickAnswer(p);
    for (const o of this.opts) if (this.P(o.m) === p) return this.pick(o.key);
  }
};

/* ---------- 按鈕 ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  const a = t.dataset.act;
  if (!['vprev', 'vnext'].includes(a)) Snd.tick(900, 0.06);
  switch (a) {
    case 'lessons': Lesson.stopPlay(); Lesson.renderList(); show('lessons'); break;
    case 'setup': $$('#setup .ai-only').forEach(r => r.style.display = setup.opp === 'ai' ? '' : 'none'); show('setup'); break;
    case 'menu': show('menu'); break;
    case 'josekiList': Joseki.stopReplay(); Joseki.renderList(); show('josekiList'); break;
    case 'jreveal': Joseki.reveal(); break;
    case 'jnext': Joseki.next(); break;
    case 'jreplay': Joseki.replay(); break;
    case 'jretry': Joseki.open(Joseki.ji); break;
    case 'jnextJ': Joseki.open((Joseki.ji + 1) % Joseki.list().length); break;
    case 'start': Game.start(Object.assign({}, setup)); break;
    case 'help': openOverlay('help'); break;
    case 'closeHelp': closeOverlay('help'); break;
    case 'settings': syncSettingsUI(); openOverlay('settings'); break;
    case 'closeSettings': closeOverlay('settings'); break;
    case 'pause': pause(); break;
    case 'resume': resume(); break;
    case 'quit':
      closeOverlay('pause'); closeOverlay('result'); paused = false;
      if (Game.thinking) { Game.thinking.cancel(); Game.thinking = null; }
      Lesson.stopPlay(); Joseki.stopReplay(); Review.cancel(); show('menu'); break;
    case 'reviewStart': Review.open(); break;
    case 'rfirst': Review.go(0); break;
    case 'rprev': Review.go(Review.k - 1); break;
    case 'rnext': Review.go(Review.k + 1); break;
    case 'rlast': Review.go(Review.hist.length - 1); break;
    case 'rissue': Review.nextIssue(1); break;
    case 'rmode': Review.setMode(t.dataset.m); break;
    case 'rdeep': Review.deep(); break;
    case 'rgame': Review.leave('game'); break;
    case 'rmenu': Review.leave('menu'); break;
    case 'undo': Game.undo(); break;
    case 'hint': Game.showHint(); break;
    case 'estimate': Game.estimate(); break;
    case 'pass': Game.pass(); break;
    case 'resign': Game.resign(); break;
    case 'confirmScore': Game.confirmScore(); break;
    case 'resumePlay': Game.resumePlay(); break;
    case 'again': closeOverlay('result'); Game.start(Game.opts); break;
    case 'review': closeOverlay('result'); break;
    case 'lhint': $('#lHint').style.display = ''; break;
    case 'lnext': Lesson.next(); break;
    case 'lretry': Lesson.retry(); break;
    case 'vfirst': Lesson.go(0); break;
    case 'vprev': Lesson.stopPlay(); Lesson.stepMove(-1); break;
    case 'vnext': Lesson.stopPlay(); Lesson.stepMove(1); break;
    case 'vplay': Lesson.togglePlay(); break;
    case 'resetProgress': ask('確定清除所有練習紀錄？', () => { store.set('progress', {}); Lesson.renderList(); }); break;
    case 'askYes': closeOverlay('ask'); if (askCb) { const f = askCb; askCb = null; f(); } break;
    case 'askNo': closeOverlay('ask'); askCb = null; break;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('#settings').classList.contains('on')) return closeOverlay('settings');
    if ($('#help').classList.contains('on')) return closeOverlay('help');
    if ($('#ask').classList.contains('on')) { askCb = null; return closeOverlay('ask'); }
    if ($('#pause').classList.contains('on')) return resume();
    return pause();
  }
  if (paused || $('.overlay.on')) return;
  if (current === 'game') {
    const k = e.key.toLowerCase();
    if (k === 'z') Game.undo(); else if (k === 'h') Game.showHint(); else if (k === 'p') Game.pass();
  } else if (current === 'review') {
    if (e.key === 'ArrowRight') Review.go(Review.k + 1); else if (e.key === 'ArrowLeft') Review.go(Review.k - 1);
  } else if (current === 'joseki') {
    if ((e.key === 'Enter' || e.key === 'ArrowRight') && Joseki.answered && !Joseki.done) Joseki.next();
  } else if (current === 'lesson') {
    if (e.key === 'ArrowRight') { Lesson.stopPlay(); Lesson.stepMove(1); }
    else if (e.key === 'ArrowLeft') { Lesson.stopPlay(); Lesson.stepMove(-1); }
    else if (e.key === ' ') { e.preventDefault(); Lesson.togglePlay(); }
  }
});

syncSettingsUI();
$('#rGraphBox').addEventListener('click', e => Review.graphClick(e));
window.__go = { Game, Lesson, Joseki, Review };
})();
