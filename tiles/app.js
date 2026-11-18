// 花磚老厝 介面、音效、連線
(function () {
  'use strict';
  const C = window.CONFIG, E = window.Engine;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // ---------- 儲存（每個讀寫都包 try，私密模式也不會壞） ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('hlc_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('hlc_' + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem('hlc_' + k); } catch (e) {} },
  };
  const settings = Object.assign({ music: 40, sfx: 70, style: 'photo', hints: 1, vib: 1, anim: 'normal' }, store.get('settings', {}));
  let cid = store.get('cid', null);
  if (!cid) { cid = Math.random().toString(36).slice(2, 10); store.set('cid', cid); }

  // ---------- 狀態 ----------
  let S = null;            // 遊戲狀態
  let mode = null;         // 'local' | 'ai' | 'host' | 'guest'
  let aiLevels = {};       // 電腦座位 → 難度
  let aiTimer = 0;
  let mySeat = 0;
  let sel = null;          // {src, color}
  let seatInfo = [];       // [{name, online}]
  let pendingEnd = false;
  let newCells = {};       // 本回合剛貼上的牆格 "p-r-c"
  let V = null;            // 動畫中顯示的中間狀態
  let animating = false;

  // ---------- 花磚 ----------
  function T(k, cls = '', attrs = '') {
    if (k === E.MARK) return `<span class="t ${cls}" ${attrs}><svg viewBox="0 0 100 100"><use href="#tm"/></svg></span>`;
    if (settings.style === 'photo') return `<span class="t ${cls}" ${attrs}><img src="assets/images/tile_${C.tiles[k].key}.png" alt="${C.tiles[k].name}" draggable="false"></span>`;
    return `<span class="t ${cls}" ${attrs}><svg viewBox="0 0 100 100"><use href="#t${k}"/></svg></span>`;
  }
  const tname = k => C.tiles[k].name;

  // ---------- 音效（WebAudio，iOS 需要第一次觸碰解鎖） ----------
  let actx = null, musicGain = null, bgmSrc = null;
  const bgm = $('#bgm');
  function unlockAudio() {
    try {
      if (!actx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
        // iOS 不能直接改 <audio>.volume，改走 GainNode
        try { bgmSrc = actx.createMediaElementSource(bgm); musicGain = actx.createGain(); bgmSrc.connect(musicGain).connect(actx.destination); } catch (e) { bgmSrc = null; }
      }
      if (actx.state === 'suspended') actx.resume();
      applyMusic();
    } catch (e) {}
  }
  function applyMusic() {
    const v = settings.music / 100 * 0.7;
    if (musicGain) musicGain.gain.value = v; else bgm.volume = v;
    if (settings.music > 0 && actx) { const p = bgm.play(); if (p && p.catch) p.catch(() => {}); }
    else bgm.pause();
  }
  ['touchend', 'pointerup', 'keydown'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true }));

  function tone(freq, dur, type = 'sine', vol = 0.3, delay = 0) {
    if (!actx || settings.sfx <= 0) return;
    const t0 = actx.currentTime + delay, g = actx.createGain(), o = actx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol * settings.sfx / 100, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function clack(delay = 0) { // 陶磚碰撞聲
    if (!actx || settings.sfx <= 0) return;
    const t0 = actx.currentTime + delay, n = actx.sampleRate * 0.06, b = actx.createBuffer(1, n, actx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
    const s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
    f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 1.4; g.gain.value = 0.7 * settings.sfx / 100;
    s.buffer = b; s.connect(f).connect(g).connect(actx.destination); s.start(t0);
  }
  const sfx = {
    pick() { tone(880, 0.08, 'triangle', 0.2); },
    place(n = 1) { for (let i = 0; i < Math.min(n, 5); i++) clack(i * 0.07); },
    myturn() { tone(660, 0.15, 'sine', 0.25); tone(990, 0.25, 'sine', 0.25, 0.12); },
    score() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'triangle', 0.22, i * 0.09)); },
    bad() { tone(220, 0.25, 'sawtooth', 0.12); },
    win() { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.28, 'triangle', 0.22, i * 0.12)); },
    err() { tone(180, 0.15, 'square', 0.1); },
  };

  // ---------- 畫面切換 ----------
  function show(id) { $$('.screen').forEach(e => e.classList.toggle('on', e.id === id)); window.scrollTo(0, 0); }
  function open(id) { $('#' + id).classList.add('on'); }
  function close(id) { $('#' + id).classList.remove('on'); }
  $$('.overlay').forEach(o => o.addEventListener('click', e => {
    if (e.target.matches('[data-close]')) { close(o.id); onOverlayClosed(o.id); }
  }));
  function onOverlayClosed(id) {
    if (id === 'ovSum' && pendingEnd) { pendingEnd = false; showEnd(); }
  }

  function toast(html, ms = C.toastMs) {
    const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = html;
    const box = $('#toasts'); box.appendChild(d);
    while (box.children.length > 2) box.firstChild.remove();
    setTimeout(() => d.remove(), ms);
  }
  let bannerT = 0;
  function banner(text) {
    const b = $('#banner'); b.textContent = text; b.classList.add('on');
    clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), C.anim.bannerMs * Math.max(spd(), 0.5));
  }
  function vibrate(ms) { if (settings.vib) try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

  // 螢幕不要自動關（支援的瀏覽器才有）
  let wakeLock = null;
  async function keepAwake() { try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => wakeLock = null); } } catch (e) {} }

  // ---------- 尺寸 ----------
  function sizes() {
    const W = Math.min(window.innerWidth, 560);
    const cell = Math.max(20, Math.min(44, Math.floor((W - 36) / 11.4)));
    const nOpp = S ? S.n - 1 : 1;
    const per = (W - 20 - 8 * (nOpp - 1)) / nOpp - 22;
    const mini = Math.max(7, Math.min(nOpp === 1 ? 14 : 11, Math.floor(per / 11.4)));
    const fc = S ? S.factories.length : 5;
    const perRow = fc <= 5 ? fc : Math.ceil(fc / 2);
    const fsize = Math.min(fc > 5 ? 60 : 78, Math.floor((W - 32) / perRow) - 6);
    return { cell, mini, fsize, ft: Math.floor(fsize * 0.3) };
  }

  // ---------- 繪製 ----------
  function boardHTML(p, pi, c, opt = {}) {
    let h = `<div class="board ${opt.mini ? 'mini' : ''}" style="--c:${c}px" data-player="${pi}"><div class="lines">`;
    for (let r = 0; r < 5; r++) {
      const L = p.lines[r], valid = opt.valid && opt.valid.includes(r);
      h += `<div class="line ${valid ? 'valid' : ''}" data-line="${r}">`;
      for (let j = 0; j <= r; j++) {
        const filled = j >= r + 1 - L.count;
        h += `<span class="slot">${filled ? T(L.color) : ''}</span>`;
      }
      h += `</div>`;
    }
    h += `</div><div class="wall">`;
    for (let r = 0; r < 5; r++) for (let col = 0; col < 5; col++) {
      const k = E.wallColor(r, col), isNew = newCells[pi + '-' + r + '-' + col];
      h += `<span class="cell ${isNew ? 'new' : ''}" data-r="${r}" data-c="${col}"><span class="ghost">${T(k)}</span>${p.wall[r][col] ? T(k) : ''}</span>`;
    }
    const fvalid = opt.valid && opt.valid.includes(5);
    h += `</div><div class="floor ${fvalid ? 'valid' : ''}" data-line="5"><span class="flbl">破磚</span>`;
    C.floorPenalties.forEach((pen, i) => {
      const x = p.floor[i];
      h += `<span class="fslot">${x !== undefined ? T(x) : `<span class="pen">${pen}</span>`}</span>`;
    });
    h += `</div></div>`;
    return h;
  }

  // 畫面顯示的狀態：動畫進行中顯示中間狀態 V，否則顯示真正的狀態 S
  function view() { return V || S; }
  function myView() { const S = view(); return mode === 'local' ? S.turn : mySeat; }
  function isMyTurn() { const S = view(); return !animating && S && S.phase === 'pick' && (mode === 'local' || S.turn === mySeat); }

  function validLines() {
    const S = view();
    if (!sel || !settings.hints) return sel ? [0, 1, 2, 3, 4, 5] : null;
    const p = S.players[myView()];
    return [0, 1, 2, 3, 4, 5].filter(l => E.canPlace(p, l, sel.color));
  }

  function render() {
    const S = view();
    if (!S) return;
    const z = sizes(), me = myView();
    $('#roundLbl').textContent = `第 ${S.round} 回合`;
    const turnName = S.players[S.turn].name;
    const tl = $('#turnLbl');
    if (S.phase === 'over') { tl.textContent = '遊戲結束'; tl.classList.remove('me'); }
    else if (mode === 'local') { tl.textContent = `輪到 ${turnName}`; tl.classList.add('me'); }
    else { tl.textContent = S.turn === mySeat ? '輪到你了！' : (mode === 'ai' ? `${turnName} 思考中…` : `等待 ${turnName}…`); tl.classList.toggle('me', S.turn === mySeat); }

    // 對手
    const order = [];
    for (let k = 1; k < S.n; k++) order.push((me + k) % S.n);
    $('#opps').innerHTML = order.map(i => `<div class="opp ${i === S.turn && S.phase === 'pick' ? 'turn' : ''}" data-opp="${i}"><div class="nm"><span>${mode !== 'local' && seatInfo[i] && !seatInfo[i].online ? '<span style="color:#c33">●斷線 </span>' : ''}${esc(S.players[i].name)}</span><span><b data-sc="${i}">${S.players[i].score}</b> 分 🔍</span></div>${boardHTML(S.players[i], i, z.mini, { mini: true })}</div>`).join('');

    // 公共區
    const pub = $('#public');
    pub.style.setProperty('--ft', z.ft + 'px');
    pub.classList.toggle('dim', !!sel);
    $('#factories').innerHTML = S.factories.map((f, i) => {
      const tiles = f.slice().sort((a, b) => a - b).map(k => T(k, 'pick' + (sel && sel.src === i && sel.color === k ? ' sel' : ''), `data-src="${i}" data-color="${k}"`)).join('');
      return `<div class="factory ${f.length ? '' : 'empty'}" data-src="${i}" style="width:${z.fsize}px;height:${z.fsize}px;gap:${Math.max(2, Math.floor(z.fsize * .04))}px"><span class="fno">${i + 1}</span>${tiles}</div>`;
    }).join('');
    let ch = '<span class="lbl">中央</span>';
    if (S.markerInCenter) ch += `<span class="grp">${T(E.MARK, '', 'data-marker="1"')}</span>`;
    for (let k = 0; k < 5; k++) {
      const n = S.center.filter(x => x === k).length;
      if (!n) continue;
      ch += `<span class="grp">` + Array.from({ length: n }, () => T(k, 'pick' + (sel && sel.src === 'c' && sel.color === k ? ' sel' : ''), `data-src="c" data-color="${k}"`)).join('') + `</span>`;
    }
    if (!S.center.length && !S.markerInCenter) ch += '<span class="muted" style="color:#9c8668">（空）</span>';
    $('#center').innerHTML = ch;

    // 我的版面
    const mp = S.players[me];
    // 依剩下的螢幕高度縮放自己的版面，盡量一頁看完不用捲動
    const mineTop = $('#mine').getBoundingClientRect().top + window.scrollY;
    const hFit = Math.floor((window.innerHeight - mineTop - 64 - 50) / 6.9);
    z.cell = Math.max(22, Math.min(z.cell, hFit));
    $('#mine').innerHTML = `<div class="hdr"><span>${mode === 'local' ? esc(mp.name) + ' 的老厝' : '我的老厝'}</span><span class="sc"><b data-sc="${me}">${mp.score}</b> 分</span></div>` +
      boardHTML(mp, me, z.cell, { valid: isMyTurn() ? validLines() : null });

    // 提示列
    const hint = $('#hint');
    hint.classList.toggle('me', isMyTurn());
    if (animating) hint.innerHTML = '<span style="opacity:.8">點一下畫面可以跳過動畫</span>';
    else if (S.phase === 'over') hint.innerHTML = `<button class="btn small gold" id="hResult">看結果</button>`;
    else if (!isMyTurn()) hint.textContent = `等待 ${turnName} 拿磚…`;
    else if (!sel) hint.textContent = (mode === 'local' ? `${turnName}：` : '輪到你！') + '點窯或中央的花磚';
    else {
      const pool = sel.src === 'c' ? S.center : S.factories[sel.src];
      const n = pool.filter(x => x === sel.color).length;
      hint.innerHTML = `拿 ${n} 塊 ${T(sel.color, '', 'style="width:22px;height:22px"')} ${tname(sel.color)} → 點發光的排 <button class="btn small" id="hCancel">取消</button>`;
    }
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  window.addEventListener('resize', () => render());

  // ---------- 操作 ----------
  $('#public').addEventListener('click', e => {
    const t = e.target.closest('.pick');
    if (!t || !S) return;
    if (!isMyTurn()) { toast('還沒輪到你'); sfx.err(); return; }
    const src = t.dataset.src === 'c' ? 'c' : +t.dataset.src, color = +t.dataset.color;
    if (sel && sel.src === src && sel.color === color) sel = null;
    else { sel = { src, color }; sfx.pick(); }
    render();
  });
  $('#mine').addEventListener('click', e => {
    const ln = e.target.closest('.line,.floor');
    if (!ln || !sel || !isMyTurn()) {
      if (ln && isMyTurn() && !sel) toast('先在上面點一種花磚');
      return;
    }
    const line = +ln.dataset.line;
    const err = E.validate(S, S.turn, sel.src, sel.color, line);
    if (err) { toast(err); sfx.err(); return; }
    const m = { src: sel.src, color: sel.color, line };
    sel = null;
    doMove(m);
  });
  $('#hint').addEventListener('click', e => {
    if (e.target.id === 'hCancel') { sel = null; render(); }
    if (e.target.id === 'hResult') showEnd();
  });
  $('#opps').addEventListener('click', e => {
    const o = e.target.closest('[data-opp]'); if (!o) return;
    showBoard(+o.dataset.opp);
  });
  function showBoard(i) {
    const S = view();
    const W = Math.min(window.innerWidth - 32, 420) - 36;
    $('#bvName').textContent = `${S.players[i].name}　${S.players[i].score} 分`;
    $('#bvBoard').innerHTML = boardHTML(S.players[i], i, Math.min(36, Math.floor(W / 11.4)));
    open('ovBoard');
  }

  function doMove(m) {
    if (mode === 'guest') { net.send({ t: 'act', ...m }); render(); return; }
    const prev = JSON.parse(JSON.stringify(S));
    const err = E.apply(S, S.turn, m.src, m.color, m.line);
    if (err) { toast(err); return; }
    const next = S; S = prev;
    receiveState(next);
    if (mode === 'host') { host.broadcast(); host.save(); }
    if (mode === 'local' || mode === 'ai') saveLocal();
  }

  // ---------- 過程動畫（點一下畫面可跳過） ----------
  const SPEED = { slow: 1.6, normal: 1, fast: 0.55, off: 0 };
  const spd = () => (SPEED[settings.anim] !== undefined ? SPEED[settings.anim] : 1);
  const A = C.anim;
  let skipFlag = false, waiters = [], queue = Promise.resolve(), pending = 0, scoreRolls = [];
  function wait(ms) {
    if (skipFlag || spd() === 0) return Promise.resolve();
    return new Promise(r => {
      const w = { r };
      w.t = setTimeout(() => { waiters = waiters.filter(x => x !== w); r(); }, ms * spd());
      waiters.push(w);
    });
  }
  function skipAnim() {
    if (!animating) return;
    skipFlag = true;
    waiters.forEach(w => { clearTimeout(w.t); w.r(); }); waiters = [];
    $$('.flyer,.pop').forEach(e => e.remove());
    scoreRolls.forEach(f => f()); scoreRolls = [];
  }
  $('#skipLayer').addEventListener('pointerdown', e => { e.preventDefault(); skipAnim(); });
  function setAnimating(on) {
    animating = on;
    $('#skipLayer').classList.toggle('on', on);
    document.documentElement.style.setProperty('--spd', String(spd() || 0.01));
  }
  const rectOf = el => (el ? el.getBoundingClientRect() : null);
  const live = () => !skipFlag && spd() > 0;

  // 一塊花磚從 from 飛到 to
  function flyTile(k, from, to, ms, delay = 0, fade = false) {
    if (!from || !to || !live()) return;
    const d = document.createElement('div'); d.className = 'flyer';
    d.innerHTML = T(k); d.firstChild.style.width = '100%'; d.firstChild.style.height = '100%';
    const dur = ms * spd(), del = delay * spd();
    Object.assign(d.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', transitionDuration: dur + 'ms', transitionDelay: del + 'ms' });
    document.body.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(d.style, { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px', opacity: fade ? '0' : '1' })));
    setTimeout(() => d.remove(), dur + del + 60);
  }
  // 目的地的磚先藏起來，飛到了再出現
  function arriveLater(el, ms, sound = true) {
    const t = el && el.querySelector('.t');
    if (t) t.style.visibility = 'hidden';
    setTimeout(() => { if (t) t.style.visibility = ''; if (sound && live()) clack(); }, ms * spd());
  }
  // 飄出來的數字（+3、-2）
  function pop(rect, text, cls = '') {
    if (!rect || !live()) return;
    const d = document.createElement('div'); d.className = 'pop ' + cls; d.textContent = text;
    d.style.left = (rect.left + rect.width / 2) + 'px'; d.style.top = (rect.top + rect.height / 2) + 'px';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), A.popMs * spd() + 50);
  }
  // 分數數字滾動到新值
  function rollScores(before) {
    const st = view();
    st.players.forEach((p, i) => {
      const from = before[i], to = p.score;
      const els = $$(`[data-sc="${i}"]`);
      if (from === to || !els.length) return;
      if (!live()) { els.forEach(e => e.textContent = to); return; }
      const dur = A.scoreRollMs * spd(), t0 = performance.now();
      let done = false;
      const fin = () => { if (done) return; done = true; els.forEach(e => { e.textContent = to; e.classList.remove('up', 'down'); }); };
      scoreRolls.push(fin);
      els.forEach(e => { e.textContent = from; e.classList.add(to > from ? 'up' : 'down'); });
      const step = t => {
        if (done) return;
        const q = Math.min(1, (t - t0) / dur);
        els.forEach(e => e.textContent = Math.round(from + (to - from) * q));
        if (q < 1) requestAnimationFrame(step); else fin();
      };
      requestAnimationFrame(step);
    });
  }

  // 收到新狀態：排進動畫佇列（真正的狀態 S 立刻更新，畫面慢慢演）
  function receiveState(next) {
    const prev = S;
    S = next;
    if (sel && !((sel.src === 'c' ? S.center : S.factories[sel.src]) || []).includes(sel.color)) sel = null;
    pending++;
    if (pending > 1) skipAnim(); // 後面還有動作在排隊，前一段直接跳到結果
    queue = queue.then(() => playTransition(prev, next)).catch(e => console.error(e)).then(() => { pending--; });
  }

  async function playTransition(prev, next) {
    skipFlag = false;
    const a = next.lastAction;
    const onGame = $('#game').classList.contains('on');
    const isNew = !!(prev && a && a.seq === prev.seq + 1 && onGame);
    const roundEnded = !!(isNew && next.roundSummary && (!prev.roundSummary || next.roundSummary.round !== prev.roundSummary.round));
    const turnChanged = prev && (prev.turn !== next.turn || prev.round !== next.round);
    const wasOver = prev && prev.phase === 'over';
    newCells = {};
    if (isNew) toast(T(a.color) + esc(describe(a, next)));
    if (isNew && spd() > 0) {
      setAnimating(true);
      V = prev; render();
      try { await animTake(prev, a, roundEnded ? next : null); } catch (e) { console.error(e); }
    } else if (isNew) {
      sfx.place(a.count);
      if (roundEnded) next.roundSummary.items.forEach(it => it.placed.forEach(pl => newCells[it.player + '-' + pl.r + '-' + pl.c] = 1));
    }
    $$('.flyer,.pop').forEach(e => e.remove()); hideChoice();
    scoreRolls.forEach(f => f()); scoreRolls = [];
    V = (next === S) ? null : next; // 佇列裡還有後續狀態時，先停在這一步的結果
    setAnimating(false); skipFlag = false;
    if (!isMyTurn()) sel = null;
    render();

    if (roundEnded) {
      if (spd() === 0) sfx.score();
      showSummary();
      if (next.phase === 'over' && !wasOver) pendingEnd = true;
    } else if (next.phase === 'over' && !wasOver && prev) setTimeout(showEnd, 300);
    setTimeout(maybeAI, 0);
    if (turnChanged && next.phase === 'pick') {
      if (mode === 'local') banner(`輪到 ${next.players[next.turn].name}`);
      else if (next.turn === mySeat) { banner('輪到你了'); sfx.myturn(); vibrate(120); }
      else if (!roundEnded) { banner(`換 ${next.players[next.turn].name}`); if (live()) tone(520, 0.12, 'sine', 0.12); }
    }
  }

  function showChoice(html) { const c = $('#choice'); c.innerHTML = html; c.classList.add('on'); }
  function hideChoice() { $('#choice').classList.remove('on'); }

  // 拿磚：亮起 → 飛到備料列／破磚列，同窯剩下的滑進中央
  async function animTake(prev, a, endState) {
    const pi = a.player;
    const srcBox = a.src === 'c' ? $('#center') : $(`#factories .factory[data-src="${a.src}"]`);
    const takenEls = srcBox ? Array.from(srcBox.querySelectorAll(`.t[data-color="${a.color}"]`)) : [];
    const restEls = (a.src !== 'c' && srcBox) ? Array.from(srcBox.querySelectorAll('.t[data-color]')).filter(e => +e.dataset.color !== a.color) : [];
    const markerEl = a.gotMarker ? $('#center [data-marker]') : null;
    $('#public').classList.add('dim');
    takenEls.forEach(e => e.classList.add('sel'));
    if (markerEl) markerEl.classList.add('sel');
    if (live()) sfx.pick();
    const others = mode !== 'local' && pi !== mySeat;
    let tgtEl = null;
    if (others && live()) {
      const nm = prev.players[pi].name;
      const where = a.src === 'c' ? '中央' : `第 ${a.src + 1} 座窯`;
      const to = a.line < 5 ? `第 ${a.line + 1} 排` : '破磚列';
      showChoice(`${esc(nm)} 選了：${where}的 ${T(a.color, '', 'style="width:22px;height:22px"')}${tname(a.color)} ×${a.count} → ${to}`);
      tgtEl = document.querySelector(`.board[data-player="${pi}"] [data-line="${a.line}"]`);
      if (tgtEl) tgtEl.classList.add('target');
      await wait(A.choiceMs);
    } else await wait(A.highlightMs);
    hideChoice();
    if (tgtEl) tgtEl.classList.remove('target');
    const takenR = takenEls.map(rectOf);
    const restR = restEls.map(e => ({ k: +e.dataset.color, r: rectOf(e) }));
    const markR = rectOf(markerEl);

    const mid = JSON.parse(JSON.stringify(prev));
    E.applyTake(mid, pi, a.src, a.color, a.line);
    V = mid; render();
    const board = document.querySelector(`.board[data-player="${pi}"]`);
    if (!board) return;
    const P0 = prev.players[pi];
    const fslots = Array.from(board.querySelectorAll('.fslot'));
    const dests = [];
    if (a.line < 5) {
      const slots = Array.from(board.querySelectorAll(`.line[data-line="${a.line}"] .slot`));
      const oldC = P0.lines[a.line].count;
      for (let i = 0; i < a.placed; i++) dests.push({ el: slots[a.line - oldC - i], lost: false });
    }
    let fi = P0.floor.length, markDest = null;
    if (a.gotMarker && C.firstMarkerPenalty && fi < fslots.length) { markDest = fslots[fi]; fi++; }
    for (let i = 0; i < a.overflow; i++, fi++) {
      if (fi < fslots.length) dests.push({ el: fslots[fi], lost: false });
      else dests.push({ el: fslots[fslots.length - 1], lost: true }); // 破磚列滿了：飛過去消失
    }
    const ms = A.flyMs, st = A.staggerMs;
    dests.forEach((d, i) => {
      flyTile(a.color, takenR[i] || takenR[takenR.length - 1], rectOf(d.el), ms, i * st, d.lost);
      if (!d.lost) arriveLater(d.el, ms + i * st);
    });
    if (markDest) { flyTile(E.MARK, markR, rectOf(markDest), ms, 0); arriveLater(markDest, ms, false); }
    // 剩下的磚滑進中央
    const used = {};
    restR.forEach((x, i) => {
      const all = $$(`#center .t[data-color="${x.k}"]`);
      used[x.k] = (used[x.k] || 0) + 1;
      const el = all[all.length - used[x.k]];
      if (!el) return;
      flyTile(x.k, x.r, rectOf(el), ms, i * st * 0.6);
      arriveLater(el, ms + i * st * 0.6, false);
    });
    await wait(ms + Math.max(dests.length, restR.length, 1) * st + 80);
    if (endState) await animTiling(mid, endState);
  }

  // 回合結算：逐排貼上牆 → 計分 → 破磚扣分 →（終局加分｜補磚開新回合）
  async function animTiling(mid, end) {
    const W = JSON.parse(JSON.stringify(mid)); V = W;
    const rs = end.roundSummary;
    render();
    if (live()) banner(`第 ${rs.round} 回合結算`);
    await wait(A.roundPauseMs);
    for (let r = 0; r < 5; r++) {
      const moves = [];
      rs.items.forEach(it => it.placed.forEach(pl => { if (pl.r === r) moves.push({ p: it.player, ...pl }); }));
      if (!moves.length) continue;
      const before = W.players.map(p => p.score);
      moves.forEach(m => {
        const b = document.querySelector(`.board[data-player="${m.p}"]`); if (!b) return;
        const slots = Array.from(b.querySelectorAll(`.line[data-line="${r}"] .slot`));
        const cell = b.querySelector(`.cell[data-r="${r}"][data-c="${m.c}"]`);
        const last = slots[slots.length - 1];
        flyTile(m.color, rectOf(last), rectOf(cell), A.flyMs);
        const lt = last && last.querySelector('.t'); if (lt) lt.style.visibility = 'hidden';
        slots.slice(0, -1).forEach(s => { const t = s.querySelector('.t'); if (t) t.classList.add('fadeout'); });
      });
      await wait(A.flyMs);
      moves.forEach(m => { const P = W.players[m.p]; P.wall[r][m.c] = true; P.lines[r] = { color: null, count: 0 }; P.score += m.pts; });
      render(); rollScores(before);
      moves.forEach(m => {
        const cell = document.querySelector(`.board[data-player="${m.p}"] .cell[data-r="${r}"][data-c="${m.c}"]`);
        if (cell) { cell.classList.add('new'); pop(rectOf(cell), '+' + m.pts, 'plus'); }
      });
      if (live()) { clack(); tone(620 + r * 90, 0.18, 'triangle', 0.2); }
      await wait(A.rowPauseMs);
    }
    // 先手牌的位置（之後飛回中央）
    let markRect = null;
    W.players.forEach((P, i) => {
      const idx = P.floor.indexOf(E.MARK);
      if (idx >= 0) markRect = rectOf(document.querySelectorAll(`.board[data-player="${i}"] .fslot`)[idx]);
    });
    // 破磚列逐格扣分
    const pens = rs.items.filter(it => it.penalty);
    if (pens.length) {
      const maxN = Math.max(...pens.map(it => W.players[it.player].floor.length));
      for (let i = 0; i < maxN; i++) {
        const before = W.players.map(p => p.score);
        pens.forEach(it => {
          const P = W.players[it.player]; if (i >= P.floor.length) return;
          const fs = document.querySelectorAll(`.board[data-player="${it.player}"] .fslot`)[i];
          pop(rectOf(fs), String(C.floorPenalties[i]), 'minus');
          const t = fs && fs.querySelector('.t'); if (t) t.classList.add('fadeout');
          P.score = Math.max(0, P.score + C.floorPenalties[i]);
        });
        rollScores(before);
        if (live()) tone(300 - i * 20, 0.12, 'square', 0.08);
        await wait(A.floorStepMs);
      }
      await wait(200);
    }
    rs.items.forEach(it => { const P = W.players[it.player]; P.floor = []; P.score = it.after; });

    if (end.phase === 'over') {
      // 終局加分：橫排、直排、集色逐項演出
      render();
      if (live()) banner('終局加分');
      await wait(A.roundPauseMs);
      const kinds = [
        { key: 'row', pts: C.bonusRow, label: '橫排' },
        { key: 'col', pts: C.bonusColumn, label: '直排' },
        { key: 'color', pts: C.bonusColor, label: '集色' },
      ];
      for (const kd of kinds) {
        const before = W.players.map(p => p.score);
        let any = false;
        W.players.forEach((P, pi) => {
          const b = document.querySelector(`.board[data-player="${pi}"]`); if (!b) return;
          const groups = [];
          for (let x = 0; x < 5; x++) {
            let cells = [];
            if (kd.key === 'row') cells = [0, 1, 2, 3, 4].map(c => [x, c]);
            if (kd.key === 'col') cells = [0, 1, 2, 3, 4].map(r => [r, x]);
            if (kd.key === 'color') cells = [0, 1, 2, 3, 4].map(r => [r, E.wallCol(r, x)]);
            if (cells.every(([r, c]) => P.wall[r][c])) groups.push(cells);
          }
          groups.forEach(cells => {
            any = true; P.score += kd.pts;
            const els = cells.map(([r, c]) => b.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`));
            els.forEach(e => e && e.classList.add('glow'));
            pop(rectOf(els[kd.key === 'row' ? 4 : kd.key === 'col' ? 4 : 2]), `${kd.label} +${kd.pts}`, 'plus');
          });
        });
        if (!any) continue;
        rollScores(before);
        if (live()) sfx.score();
        await wait(A.bonusStepMs);
        $$('.cell.glow').forEach(e => e.classList.remove('glow'));
      }
    } else {
      // 補磚：新回合的花磚一塊塊落進窯裡，先手牌回到中央
      V = end; render();
      const tiles = $$('#factories .t');
      if (live()) tiles.forEach((t, i) => { t.style.animationDelay = (i * A.refillStaggerMs * spd()) + 'ms'; t.classList.add('dropin'); });
      const mk = $('#center [data-marker]');
      if (mk && markRect) { flyTile(E.MARK, markRect, rectOf(mk), A.flyMs); arriveLater(mk.parentElement, A.flyMs, false); }
      for (let i = 0; i < Math.min(tiles.length, 12); i++) setTimeout(() => { if (live()) clack(); }, i * A.refillStaggerMs * 3 * spd());
      await wait(tiles.length * A.refillStaggerMs + 450);
    }
  }
  function describe(a, s) {
    const nm = s.players[a.player].name;
    let t = `${nm} 從${a.src === 'c' ? '中央' : `第 ${a.src + 1} 座窯`}拿 ${a.count} 塊${tname(a.color)}`;
    t += a.line < 5 ? `，放第 ${a.line + 1} 排` : '，全丟進破磚列';
    if (a.line < 5 && a.overflow) t += `（${a.overflow} 塊掉進破磚列）`;
    if (a.gotMarker) t += '，拿到先手牌';
    return t;
  }

  function showSummary() {
    const rs = S.roundSummary; if (!rs) return;
    $('#sumTitle').textContent = `第 ${rs.round} 回合結算`;
    $('#sumList').innerHTML = rs.items.map(it => {
      const p = S.players[it.player];
      const tiles = it.placed.map(pl => `<span>${T(pl.color)}+${pl.pts}</span>`).join('');
      return `<div class="sumrow"><div class="nm"><span>${esc(p.name)}</span><span>${it.before} → ${it.after} 分</span></div>
        <div class="det">${tiles || '這回合沒有貼磚'}${it.penalty ? `<span style="color:#9b3b30">破磚 ${it.penalty}</span>` : ''}</div></div>`;
    }).join('');
    open('ovSum');
  }

  let endTimers = [];
  function showEnd() {
    if (!S || !S.result) return;
    endTimers.forEach(clearTimeout); endTimers = [];
    const res = S.result, me = mode === 'local' ? -1 : mySeat;
    const win = res.winners.map(i => S.players[i].name).join('、');
    const finalTitle = res.winners.includes(me) ? '你贏了！' : `${win} 獲勝！`;
    // 依座位順序逐一清點，最後才排名、公布贏家
    const order = res.items.slice().sort((x, y) => x.player - y.player);
    $('#endTitle').textContent = '清點分數…';
    $('#endList').innerHTML = order.map(r => `<div class="sumrow tally" data-p="${r.player}">
      <div class="nm"><span>${esc(S.players[r.player].name)}</span><span style="font-size:20px"><b class="tsc">0</b> 分</span></div>
      <div class="det tsteps">
        <span class="ts" data-add="${r.before}">牆面 ${r.before}</span>
        <span class="ts" data-add="${r.rows * C.bonusRow}">＋ 橫排 ${r.rows}×${C.bonusRow}</span>
        <span class="ts" data-add="${r.cols * C.bonusColumn}">＋ 直排 ${r.cols}×${C.bonusColumn}</span>
        <span class="ts" data-add="${r.colors * C.bonusColor}">＋ 集色 ${r.colors}×${C.bonusColor}</span>
      </div></div>`).join('') + '<div class="muted" id="endSkip" style="text-align:center">點一下清單可以直接看結果</div>';
    const btns = ['#bAgain', '#eView', '#bHome'];
    btns.forEach(id => $(id).style.visibility = 'hidden');
    open('ovEnd');
    const step = (spd() || 0) * 1;
    const finish = () => {
      endTimers.forEach(clearTimeout); endTimers = [];
      // 排名
      const rows = $$('#endList .tally');
      const byP = {}; rows.forEach(el => byP[el.dataset.p] = el);
      const sorted = res.items.slice().sort((x, y) => y.final - x.final || y.rows - x.rows);
      const list = $('#endList');
      sorted.forEach((r, idx) => {
        const el = byP[r.player];
        el.querySelectorAll('.ts').forEach(t => t.classList.add('on'));
        el.querySelector('.tsc').textContent = r.final;
        el.querySelector('.nm span').textContent = `${idx + 1}. ${S.players[r.player].name}`;
        if (res.winners.includes(r.player)) el.classList.add('win');
        list.appendChild(el);
      });
      const sk = $('#endSkip'); if (sk) sk.remove();
      if (mode === 'guest') list.insertAdjacentHTML('beforeend', '<div class="muted" style="text-align:center">等房主按「再玩一局」</div>');
      $('#endTitle').textContent = finalTitle;
      btns.forEach(id => $(id).style.visibility = '');
      $('#bAgain').style.display = (mode === 'guest') ? 'none' : '';
      sfx.win();
      $('#endList').onclick = null;
    };
    $('#endList').onclick = finish;
    if (!step) { finish(); return; }
    let t = 400;
    order.forEach(r => {
      const el = $(`#endList .tally[data-p="${r.player}"]`);
      let sum = 0;
      endTimers.push(setTimeout(() => el.classList.add('now'), t * step));
      el.querySelectorAll('.ts').forEach(ts => {
        const add = +ts.dataset.add;
        t += A.tallyMs;
        endTimers.push(setTimeout(() => {
          ts.classList.add('on');
          const from = sum; sum += add; const to = sum;
          const sc = el.querySelector('.tsc');
          const t0 = performance.now(), dur = 400 * step;
          const roll = now => { const q = Math.min(1, (now - t0) / dur); sc.textContent = Math.round(from + (to - from) * q); if (q < 1) requestAnimationFrame(roll); };
          requestAnimationFrame(roll);
          if (add > 0) tone(500 + Math.min(add, 40) * 12, 0.15, 'triangle', 0.18); else clack();
        }, t * step));
      });
      t += A.tallyMs;
      endTimers.push(setTimeout(() => el.classList.remove('now'), t * step));
    });
    endTimers.push(setTimeout(finish, (t + A.tallyMs) * step));
  }
  $('#eView').onclick = () => close('ovEnd');
  $('#bAgain').onclick = () => {
    close('ovEnd');
    const names = S.players.map(p => p.name);
    newCells = {}; sel = null;
    if (mode === 'local') { S = E.newGame(names); saveLocal(); render(); banner(`輪到 ${S.players[S.turn].name}`); }
    if (mode === 'ai') { S = E.newGame(names); saveLocal(); render(); announceFirst(); maybeAI(); }
    if (mode === 'host') { S = E.newGame(names); host.broadcast(); host.save(); render(); announceFirst(); }
  };
  function announceFirst() {
    if (!S) return;
    if (mode === 'local') banner(`${S.players[S.turn].name} 先開始`);
    else if (S.turn === mySeat) { banner('你先開始'); sfx.myturn(); vibrate(120); }
    else banner(`${S.players[S.turn].name} 先開始`);
  }
  $('#bHome').onclick = () => quitGame(true);

  // ---------- 暫停、設定、說明、紀錄 ----------
  $('#bPause').onclick = () => {
    $('#pauseNote').textContent = (mode === 'local' || mode === 'ai') ? '' : '連線遊戲不會暫停其他人的畫面；輪到你時會震動提醒。';
    open('ovPause');
  };
  $('#pSet').onclick = () => openSettings();
  $('#pHelp').onclick = () => open('ovHelp');
  $('#pLog').onclick = () => {
    const lines = [];
    (S ? S.log : []).forEach(l => {
      if (l.type === 'round') lines.push(`<b>— 第 ${l.round} 回合，${esc(S.players[l.first].name)} 先 —</b>`);
      if (l.type === 'take') lines.push(esc(describe(l, S)));
      if (l.type === 'tiling') l.items.forEach(it => lines.push(`${esc(S.players[it.player].name)} 貼磚結算：${it.before} → ${it.after} 分`));
      if (l.type === 'over') lines.push(`<b>遊戲結束</b>`);
    });
    $('#logList').innerHTML = lines.reverse().map(x => `<div>${x}</div>`).join('') || '還沒有紀錄';
    open('ovLog');
  };
  $('#pQuit').onclick = () => { if (confirmQuit()) quitGame(true); };
  function confirmQuit() {
    if (mode === 'host') return window.confirm('你是房主，離開後其他人就不能繼續了（之後可以在封面「恢復上次的房間」）。確定離開？');
    return window.confirm('確定離開這局？');
  }
  $('#bHelp').onclick = () => open('ovHelp');
  $('#bSet').onclick = () => openSettings();

  function openSettings() {
    $('#vMusic').value = settings.music; $('#vSfx').value = settings.sfx;
    $('#vMusicV').textContent = settings.music; $('#vSfxV').textContent = settings.sfx;
    segSet('#sStyle', settings.style); segSet('#sAnim', settings.anim); segSet('#sHints', String(settings.hints)); segSet('#sVib', String(settings.vib));
    open('ovSet');
  }
  function segSet(id, v) { $$(id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); }
  function saveSettings() { store.set('settings', settings); }
  $('#vMusic').oninput = e => { settings.music = +e.target.value; $('#vMusicV').textContent = settings.music; unlockAudio(); applyMusic(); saveSettings(); };
  $('#vSfx').oninput = e => { settings.sfx = +e.target.value; $('#vSfxV').textContent = settings.sfx; saveSettings(); };
  $('#vSfx').onchange = () => sfx.place(2);
  $('#sStyle').onclick = e => { const v = e.target.dataset.v; if (!v) return; settings.style = v; segSet('#sStyle', v); saveSettings(); render(); drawCover(); drawHelpTiles(); };
  $('#sAnim').onclick = e => { const v = e.target.dataset.v; if (!v) return; settings.anim = v; segSet('#sAnim', v); saveSettings(); };
  $('#sHints').onclick = e => { const v = e.target.dataset.v; if (!v) return; settings.hints = +v; segSet('#sHints', v); saveSettings(); render(); };
  $('#sVib').onclick = e => { const v = e.target.dataset.v; if (!v) return; settings.vib = +v; segSet('#sVib', v); saveSettings(); };

  function drawCover() {
    let h = '';
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) h += T(E.wallColor(r, c), '', 'style="width:52px;height:52px"');
    $('#coverTiles').innerHTML = h;
  }
  function drawHelpTiles() {
    $('#helpTiles').innerHTML = C.tiles.map((t, k) => `<span class="tl" style="margin-right:10px">${T(k, '', 'style="width:26px;height:26px"')} ${t.name}</span>`).join('') +
      `<br><span class="muted">每種 ${C.tilesPerColor} 塊，共 ${C.tilesPerColor * 5} 塊。牆面上每一橫排、每一直排五種花磚各一塊，位置是固定的（淡淡的圖案就是該放的位置）。</span>`;
  }

  // ---------- 名字 ----------
  const nameInput = $('#myName');
  nameInput.value = store.get('name', '');
  nameInput.addEventListener('input', () => store.set('name', nameInput.value.trim()));
  function myName(def) { const n = nameInput.value.trim(); return n || def; }

  // ---------- 同機輪流 ----------
  let lsN = 2;
  function drawLocalNames() {
    const saved = store.get('localNames', []);
    $('#lsNames').innerHTML = Array.from({ length: lsN }, (_, i) => `<div class="set-row" style="margin:8px 0"><input class="txt" maxlength="8" data-i="${i}" value="${esc(saved[i] || (i === 0 && myName('') ? myName('') : '玩家' + (i + 1)))}"></div>`).join('');
  }
  $('#bLocal').onclick = () => { drawLocalNames(); show('localSetup'); };
  $('#lsCount').onclick = e => { const n = e.target.dataset.n; if (!n) return; lsN = +n; $$('#lsCount button').forEach(b => b.classList.toggle('on', b.dataset.n === n)); drawLocalNames(); };
  $('#bLocalBack').onclick = () => show('cover');
  $('#bLocalStart').onclick = () => {
    const names = $$('#lsNames input').map((x, i) => x.value.trim() || '玩家' + (i + 1));
    store.set('localNames', names);
    mode = 'local'; seatInfo = []; newCells = {}; sel = null;
    S = E.newGame(names);
    saveLocal(); show('game'); render(); keepAwake(); announceFirst();
  };
  function saveLocal() { store.set('save', { mode, S, aiLevels, ts: Date.now() }); }

  // ---------- 對戰電腦 ----------
  let aiN = 1, aiLv = store.get('aiLevel', 2);
  const LV_NOTE = { 1: '電腦常常亂拿，適合剛學規則。', 2: '電腦會挑對自己最有利的拿法。', 3: '電腦會想終局加分，也會考慮不讓你拿到好磚。' };
  function drawAISetup() {
    $$('#aiLevel button').forEach(b => b.classList.toggle('on', +b.dataset.v === aiLv));
    $$('#aiCount button').forEach(b => b.classList.toggle('on', +b.dataset.n === aiN));
    $('#aiLevelNote').textContent = LV_NOTE[aiLv];
  }
  $('#bAI').onclick = () => { drawAISetup(); show('aiSetup'); };
  $('#aiCount').onclick = e => { const n = e.target.dataset.n; if (!n) return; aiN = +n; drawAISetup(); };
  $('#aiLevel').onclick = e => { const v = e.target.dataset.v; if (!v) return; aiLv = +v; store.set('aiLevel', aiLv); drawAISetup(); };
  $('#bAIBack').onclick = () => show('cover');
  $('#bAIStart').onclick = () => {
    unlockAudio();
    const names = [myName('你')];
    aiLevels = {};
    for (let i = 1; i <= aiN; i++) { names.push(C.ai.names[i - 1] || ('電腦' + i)); aiLevels[i] = aiLv; }
    mode = 'ai'; mySeat = 0; seatInfo = []; newCells = {}; sel = null; V = null;
    S = E.newGame(names);
    saveLocal(); show('game'); render(); keepAwake(); announceFirst(); maybeAI();
  };
  function aiBusy() { return animating || pending > 0 || $$('.overlay.on').length > 0; }
  function maybeAI() {
    if (mode !== 'ai' || !S || S.phase !== 'pick' || S.turn === mySeat || aiTimer) return;
    if (aiBusy()) { aiTimer = setTimeout(() => { aiTimer = 0; maybeAI(); }, 400); return; }
    aiTimer = setTimeout(() => {
      aiTimer = 0;
      if (mode !== 'ai' || !S || S.phase !== 'pick' || S.turn === mySeat) return;
      if (aiBusy()) { maybeAI(); return; }
      const m = AI.choose(S, S.turn, aiLevels[S.turn] || 2);
      if (m) doMove(m);
    }, C.ai.thinkMs * Math.max(spd(), 0.25));
  }

  // ---------- 連線：共用 ----------
  // PeerJS（WebRTC），房主手機就是伺服器；用 JSON 序列化避免 iOS Safari 的二進位相容問題
  const PEER_OPTS = { debug: 1, config: { iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
  ], sdpSemantics: 'unified-plan' } };
  // 測試用：?peerhost=localhost:9000 改用自架配對伺服器
  (function () { const ph = new URLSearchParams(location.search).get('peerhost'); if (ph) { const [h, pt] = ph.split(':'); Object.assign(PEER_OPTS, { host: h, port: +(pt || 9000), path: '/', secure: false }); } })();
  function makeCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; let s = ''; for (let i = 0; i < C.roomCodeLength; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
  function inviteLink(code) {
    const base = location.href.split('?')[0].split('#')[0];
    // openExternalBrowser=1：LINE 掃碼時改用 Safari/Chrome 開啟（LINE 內建瀏覽器常連不上）
    const ph = new URLSearchParams(location.search).get('peerhost');
    return `${base}?room=${code}&openExternalBrowser=1` + (ph ? `&peerhost=${ph}` : '');
  }
  function netStatus(on, text) { const n = $('#netstat'); n.classList.toggle('on', on); if (text) n.textContent = text; }
  function peerSupported() {
    if (typeof Peer === 'undefined') return '連線元件載入失敗，請重新整理頁面。';
    if (!window.RTCPeerConnection) return '這個瀏覽器不支援手機連線。請改用 Safari（iPhone）或 Chrome（Android/電腦）開啟。';
    if (location.protocol === 'file:') return null; // 電腦直接開檔也能連
    return null;
  }

  // ---------- 房主 ----------
  const host = {
    peer: null, code: null, seats: [], retries: 0,
    start(code, restore) {
      const bad = peerSupported(); if (bad) { alert(bad); return; }
      mode = 'host'; mySeat = 0; this.code = code;
      if (restore) { this.seats = restore.seats.map((s, i) => ({ name: s.name, cid: s.cid, conn: null, online: i === 0, last: 0 })); S = restore.S || null; }
      else { this.seats = [{ name: myName('房主'), cid, conn: null, online: true, last: 0 }]; S = null; }
      this.open();
      if (S) { show('game'); render(); netStatus(true, '正在重新開房，朋友會自動連回來…'); }
      else this.showLobby();
      keepAwake();
    },
    open() {
      if (this.peer) try { this.peer.destroy(); } catch (e) {}
      const p = this.peer = new Peer(C.peerPrefix + this.code, PEER_OPTS);
      p.on('open', () => { this.retries = 0; netStatus(false); this.save(); if (!S) this.showLobby(); });
      p.on('connection', conn => this.onConn(conn));
      p.on('disconnected', () => { if (this.peer === p && !p.destroyed) setTimeout(() => { try { p.reconnect(); } catch (e) {} }, 1500); });
      p.on('error', err => {
        if (this.peer !== p) return;
        if (err.type === 'unavailable-id') {
          // 剛重新整理時舊的代碼可能還沒釋放，等一下再試
          if (this.retries++ < 10) { netStatus(true, '房間代碼還被佔用，重試中…'); setTimeout(() => this.open(), 3000); }
          else { alert('這個房間代碼一直被佔用，請回封面重新開房。'); }
        } else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type)) {
          netStatus(true, '連不上配對伺服器，重試中…（請確認手機有網路）');
          setTimeout(() => { if (this.peer === p && !p.destroyed) { if (p.disconnected) try { p.reconnect(); } catch (e) { this.open(); } else this.open(); } }, 3000);
        } else if (err.type === 'browser-incompatible') alert('這個瀏覽器不支援手機連線。請改用 Safari 或 Chrome。');
        else console.warn('peer error', err.type, err);
      });
    },
    onConn(conn) {
      conn.on('data', d => this.onData(conn, d));
      conn.on('close', () => this.onClose(conn));
      conn.on('error', () => this.onClose(conn));
    },
    seatOf(conn) { return this.seats.findIndex(s => s.conn === conn); },
    onData(conn, d) {
      if (!d || typeof d !== 'object') return;
      if (d.t === 'hello') {
        let i = this.seats.findIndex(s => s.cid === d.cid);
        if (i === 0) { conn.send({ t: 'reject', msg: '這支手機就是房主，不能再加入自己的房間。' }); return; }
        if (i < 0) {
          if (S) { conn.send({ t: 'reject', msg: '這局已經開始了，等下一局再加入。' }); return; }
          if (this.seats.length >= C.maxPlayers) { conn.send({ t: 'reject', msg: `房間已滿（最多 ${C.maxPlayers} 人）。` }); return; }
          this.seats.push({ name: String(d.name || '玩家').slice(0, 8), cid: d.cid, conn, online: true, last: Date.now() });
          i = this.seats.length - 1;
          sfx.pick();
        } else {
          const s = this.seats[i];
          if (s.conn && s.conn !== conn) try { s.conn.close(); } catch (e) {}
          s.conn = conn; s.online = true; s.last = Date.now();
          if (!S && d.name) s.name = String(d.name).slice(0, 8);
          if (S) toast(`${esc(s.name)} 回來了`);
        }
        this.save();
        if (S) this.broadcast(); else this.broadcastLobby();
        return;
      }
      const i = this.seatOf(conn); if (i < 0) return;
      this.seats[i].last = Date.now();
      if (!this.seats[i].online) { this.seats[i].online = true; this.broadcastSeats(); }
      if (d.t === 'ping') { try { conn.send({ t: 'pong' }); } catch (e) {} return; }
      if (d.t === 'act' && S) {
        const err = E.validate(S, i, d.src, d.color, d.line);
        if (err) { try { conn.send({ t: 'err', msg: err }); conn.send(this.stateMsg(i)); } catch (e) {} return; }
        const prev = JSON.parse(JSON.stringify(S));
        E.apply(S, i, d.src, d.color, d.line);
        const next = S; S = prev;
        receiveState(next);
        this.broadcast(); this.save();
      }
    },
    onClose(conn) {
      const i = this.seatOf(conn); if (i < 0) return;
      const s = this.seats[i]; s.conn = null; s.online = false;
      if (S) { toast(`${esc(s.name)} 斷線了，等他重新打開連結`); this.broadcastSeats(); render(); }
      else { this.seats.splice(i, 1); this.broadcastLobby(); }
      this.save();
    },
    seatSummary() { return this.seats.map(s => ({ name: s.name, online: s.online })); },
    stateMsg(i) { return { t: 'state', S, you: i, seats: this.seatSummary() }; },
    broadcast() {
      seatInfo = this.seatSummary();
      this.seats.forEach((s, i) => { if (i && s.conn && s.conn.open) try { s.conn.send(this.stateMsg(i)); } catch (e) {} });
    },
    broadcastSeats() {
      seatInfo = this.seatSummary();
      this.seats.forEach((s, i) => { if (i && s.conn && s.conn.open) try { s.conn.send({ t: 'seats', seats: seatInfo }); } catch (e) {} });
    },
    broadcastLobby() {
      const list = this.seatSummary();
      this.seats.forEach((s, i) => { if (i && s.conn && s.conn.open) try { s.conn.send({ t: 'lobby', seats: list, you: i, code: this.code }); } catch (e) {} });
      if (mode === 'host' && !S) this.showLobby();
    },
    showLobby() {
      show('lobby');
      $('#lobbyHost').style.display = ''; $('#lobbyGuest').style.display = 'none';
      $('#roomCode').textContent = this.code;
      drawQR(inviteLink(this.code));
      drawPlayers(this.seatSummary(), 0);
      const ok = this.seats.length >= C.minPlayers;
      $('#bStart').disabled = !ok; $('#bStart').style.display = '';
      $('#lobbyMsg').textContent = ok ? '人到齊就按開始' : `至少 ${C.minPlayers} 人才能開始`;
    },
    startGame() {
      S = E.newGame(this.seats.map(s => s.name));
      newCells = {}; sel = null;
      this.broadcast(); this.save();
      show('game'); render(); announceFirst();
    },
    save() { store.set('save', { mode: 'host', code: this.code, S, seats: this.seats.map(s => ({ name: s.name, cid: s.cid })), ts: Date.now() }); },
    tick() {
      if (mode !== 'host') return;
      const now = Date.now(); let ch = false;
      this.seats.forEach((s, i) => { if (i && s.online && s.last && now - s.last > 15000) { s.online = false; ch = true; } });
      if (ch && S) { this.broadcastSeats(); render(); }
    },
  };
  setInterval(() => host.tick(), 5000);

  function drawPlayers(list, me) {
    $('#pcount').textContent = `${list.length}/${C.maxPlayers}`;
    $('#plist').innerHTML = list.map((s, i) => `<li><span class="dot ${s.online ? '' : 'off'}"></span>${esc(s.name)}${i === 0 ? '（房主）' : ''}${i === me ? '　← 你' : ''}</li>`).join('');
  }
  function drawQR(text) {
    try {
      const qr = qrcode(0, 'M'); qr.addData(text); qr.make();
      $('#qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    } catch (e) { $('#qr').textContent = text; }
  }
  $('#bCopy').onclick = async () => {
    const link = inviteLink(host.code);
    try { if (navigator.share) { await navigator.share({ title: '花磚老厝', text: `一起來玩花磚老厝，房間代碼 ${host.code}`, url: link }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(link); toast('已複製邀請連結'); return; } catch (e) {}
    try { const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('已複製邀請連結'); }
    catch (e) { prompt('複製這個連結傳給朋友：', link); }
  };
  $('#bStart').onclick = () => { if (mode === 'host') host.startGame(); };
  $('#bHost').onclick = () => { unlockAudio(); host.start(makeCode()); };

  // ---------- 加入的人 ----------
  const net = {
    peer: null, conn: null, code: null, joined: false, lastMsg: 0, timer: 0, connecting: false, fails: 0, everOpen: false,
    join(code) {
      const bad = peerSupported(); if (bad) { alert(bad); return; }
      mode = 'guest'; this.code = code; this.joined = false; this.fails = 0; this.everOpen = false;
      show('lobby');
      $('#lobbyHost').style.display = 'none'; $('#lobbyGuest').style.display = '';
      $('#guestCode').textContent = code; $('#bStart').style.display = 'none';
      $('#plist').innerHTML = ''; $('#lobbyMsg').textContent = '連線中…';
      this.makePeer();
      clearInterval(this.timer);
      this.timer = setInterval(() => this.heartbeat(), 4000);
      keepAwake();
    },
    makePeer() {
      if (this.peer) try { this.peer.destroy(); } catch (e) {}
      const p = this.peer = new Peer(PEER_OPTS);
      p.on('open', () => this.connect());
      p.on('disconnected', () => { if (this.peer === p && !p.destroyed) setTimeout(() => { try { p.reconnect(); } catch (e) {} }, 1500); });
      p.on('error', err => {
        if (this.peer !== p) return;
        if (err.type === 'peer-unavailable') {
          this.connecting = false; this.fails++;
          if (!this.everOpen && this.fails >= 3) { $('#lobbyMsg').innerHTML = `找不到房間 <b>${this.code}</b>。請確認代碼，並請房主保持畫面開著（螢幕不要關）。仍會繼續嘗試…`; }
          netStatus(!!S, '找不到房主，正在重新連線…（請房主打開畫面）');
        } else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type)) {
          netStatus(true, '網路不穩，重新連線中…');
          $('#lobbyMsg').textContent = '連不上配對伺服器，重試中…（請確認手機有網路）';
          setTimeout(() => { if (this.peer === p) this.makePeer(); }, 3000);
        } else if (err.type === 'browser-incompatible') alert('這個瀏覽器不支援手機連線。請改用 Safari 或 Chrome。');
        else console.warn('peer error', err.type);
      });
    },
    connect() {
      if (!this.peer || this.peer.destroyed || this.peer.disconnected) return;
      if (this.conn) try { this.conn.close(); } catch (e) {}
      this.connecting = true;
      const conn = this.conn = this.peer.connect(C.peerPrefix + this.code, { reliable: true, serialization: 'json' });
      const to = setTimeout(() => { if (this.conn === conn && !conn.open) { this.connecting = false; try { conn.close(); } catch (e) {} this.fails++; } }, 10000);
      conn.on('open', () => {
        clearTimeout(to); this.connecting = false; this.fails = 0; this.everOpen = true; this.lastMsg = Date.now();
        conn.send({ t: 'hello', cid, name: myName('玩家') });
        netStatus(false);
      });
      conn.on('data', d => { if (this.conn === conn) this.onData(d); });
      conn.on('close', () => { if (this.conn === conn) { this.connecting = false; netStatus(true, '連線中斷，正在重新連線…'); } });
      conn.on('error', () => { if (this.conn === conn) this.connecting = false; });
    },
    heartbeat() {
      if (mode !== 'guest') return;
      const c = this.conn;
      if (c && c.open) {
        try { c.send({ t: 'ping' }); } catch (e) {}
        if (Date.now() - this.lastMsg > 12000) { netStatus(true, '連線中斷，正在重新連線…'); try { c.close(); } catch (e) {} this.conn = null; }
        return;
      }
      if (this.connecting) return;
      if (!this.peer || this.peer.destroyed) { this.makePeer(); return; }
      if (this.peer.disconnected) { try { this.peer.reconnect(); } catch (e) { this.makePeer(); } return; }
      this.connect();
    },
    send(m) {
      if (this.conn && this.conn.open) try { this.conn.send(m); return; } catch (e) {}
      toast('連線中斷，動作沒有送出，重新連線後請再點一次'); sfx.err();
    },
    onData(d) {
      this.lastMsg = Date.now();
      if (!d || typeof d !== 'object') return;
      if (d.t === 'pong') return;
      if (d.t === 'reject') { alert(d.msg); this.leave(); show('cover'); mode = null; return; }
      if (d.t === 'err') { toast(esc(d.msg)); sfx.err(); return; }
      if (d.t === 'lobby') {
        mySeat = d.you; seatInfo = d.seats;
        if (S) { S = null; }
        show('lobby'); $('#lobbyHost').style.display = 'none'; $('#lobbyGuest').style.display = '';
        $('#bStart').style.display = 'none';
        drawPlayers(d.seats, d.you); $('#lobbyMsg').textContent = '等房主開始遊戲…';
        store.set('lastRoom', { code: this.code, ts: Date.now() });
        return;
      }
      if (d.t === 'seats') { seatInfo = d.seats; render(); return; }
      if (d.t === 'state') {
        mySeat = d.you; seatInfo = d.seats || seatInfo;
        const fresh = !S || !$('#game').classList.contains('on') || (d.S.round === 1 && d.S.seq === 0 && (S.seq !== 0 || S.round !== 1));
        if (fresh) { S = d.S; newCells = {}; sel = null; close('ovEnd'); close('ovSum'); show('game'); render(); announceFirst(); }
        else receiveState(d.S);
        store.set('lastRoom', { code: this.code, ts: Date.now() });
      }
    },
    leave() { clearInterval(this.timer); try { this.conn && this.conn.close(); } catch (e) {} try { this.peer && this.peer.destroy(); } catch (e) {} this.peer = null; this.conn = null; },
  };

  $('#bJoin').onclick = () => { $('#joinCode').value = ''; open('ovJoin'); setTimeout(() => $('#joinCode').focus(), 50); };
  $('#bJoinGo').onclick = () => {
    const code = $('#joinCode').value.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (code.length !== C.roomCodeLength) { toast(`代碼是 ${C.roomCodeLength} 個英文字母`); return; }
    if (!myName('')) { toast('請先在封面輸入你的名字'); close('ovJoin'); nameInput.focus(); return; }
    close('ovJoin'); unlockAudio(); net.join(code);
  };
  $('#joinCode').addEventListener('keydown', e => { if (e.key === 'Enter') $('#bJoinGo').click(); });

  $('#bLeaveLobby').onclick = () => quitGame(true);

  function quitGame(clear) {
    $$('.overlay').forEach(o => o.classList.remove('on'));
    if (mode === 'host') { try { host.peer && host.peer.destroy(); } catch (e) {} host.peer = null; if (clear) store.del('save'); }
    if (mode === 'guest') net.leave();
    if ((mode === 'local' || mode === 'ai') && clear) store.del('save');
    clearTimeout(aiTimer); aiTimer = 0;
    skipAnim(); V = null; setAnimating(false);
    mode = null; S = null; sel = null; netStatus(false);
    show('cover'); refreshResume();
  }

  // ---------- 恢復 ----------
  function refreshResume() {
    const sv = store.get('save', null), b = $('#bResume');
    if (sv && Date.now() - sv.ts < 12 * 3600 * 1000 && (sv.S || sv.mode === 'host')) {
      b.style.display = '';
      b.textContent = sv.mode === 'host' ? `恢復上次的房間（代碼 ${sv.code}）` : (sv.mode === 'ai' ? '繼續上次對戰電腦的那一局' : '繼續上次同機的那一局');
    } else b.style.display = 'none';
  }
  $('#bResume').onclick = () => {
    const sv = store.get('save', null); if (!sv) return;
    unlockAudio();
    if (sv.mode === 'host') host.start(sv.code, sv);
    else { mode = sv.mode === 'ai' ? 'ai' : 'local'; aiLevels = sv.aiLevels || {}; mySeat = 0; S = sv.S; seatInfo = []; newCells = {}; sel = null; show('game'); render(); keepAwake(); maybeAI(); }
  };

  // ---------- 手機切到背景再回來 ----------
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    wakeLock = null; if (S || mode) keepAwake();
    if (mode === 'host' && host.peer) { if (host.peer.destroyed) host.open(); else if (host.peer.disconnected) try { host.peer.reconnect(); } catch (e) { host.open(); } }
    if (mode === 'guest') net.heartbeat();
    if (actx && actx.state !== 'running') actx.resume().catch(() => {});
  });
  window.addEventListener('pageshow', e => { if (e.persisted && mode === 'guest') net.heartbeat(); });

  // ---------- 內建瀏覽器提醒 ----------
  (function () {
    const ua = navigator.userAgent || '';
    let app = null;
    if (/Line\//i.test(ua)) app = 'LINE';
    else if (/FBAN|FBAV|FB_IAB/i.test(ua)) app = 'Facebook';
    else if (/Instagram/i.test(ua)) app = 'Instagram';
    else if (/MicroMessenger/i.test(ua)) app = '微信';
    if (app) {
      const w = $('#inappWarn'); w.style.display = '';
      w.textContent = `你現在是在 ${app} 裡面開啟。如果連不上或沒有聲音，請點右上角選單，選「用瀏覽器開啟」（iPhone 用 Safari、Android 用 Chrome）。`;
    }
  })();

  // ---------- 啟動 ----------
  drawCover(); drawHelpTiles(); refreshResume();
  const q = new URLSearchParams(location.search);
  const room = (q.get('room') || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (room) {
    $('#joinCode').value = room;
    // 網址帶房號：顯示加入視窗（需要點一下，iPhone 才能播聲音）
    open('ovJoin');
    const lr = store.get('lastRoom', null);
    if (lr && lr.code === room && Date.now() - lr.ts < 12 * 3600 * 1000 && myName('')) {
      // 重新整理或斷線後再打開同一個連結：直接回到座位
      setTimeout(() => { close('ovJoin'); net.join(room); }, 0);
    } else if (!myName('')) setTimeout(() => toast('先輸入名字再按加入'), 300);
    // 加入視窗裡也放名字欄位，方便掃碼的人
    if (!$('#joinName')) {
      $('#joinCode').insertAdjacentHTML('beforebegin', `<div class="muted" style="margin:4px 0">你的名字</div><input id="joinName" class="txt" maxlength="8" style="margin-bottom:10px" value="${esc(myName(''))}" placeholder="輸入名字">`);
      $('#joinName').addEventListener('input', e => { nameInput.value = e.target.value; store.set('name', e.target.value.trim()); });
    }
  }
  // 圖片載入失敗時退回手繪圖樣
  const probe = new Image();
  probe.onerror = () => { if (settings.style === 'photo') { settings.style = 'draw'; drawCover(); drawHelpTiles(); render(); } };
  probe.src = `assets/images/tile_${C.tiles[0].key}.png`;

  // 測試用
  window.__hlc = { get S() { return S; }, get mode() { return mode; }, doMove, host, net };
})();
