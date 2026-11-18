// 奧林帕斯的獻祭 介面、音效、連線
(function () {
  'use strict';
  const C = window.CONFIG, E = window.Engine, G = C.gods, NG = G.length;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- 儲存（每個讀寫都包 try，私密模式也不會壞） ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('olys_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('olys_' + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem('olys_' + k); } catch (e) {} },
  };
  const settings = Object.assign({ music: 35, sfx: 70, style: 'greek', hints: 1, vib: 1, ai: 'normal', anim: 'normal' }, store.get('settings', {}));
  const saveSettings = () => store.set('settings', settings);
  let cid = store.get('cid', null);
  if (!cid) { cid = Math.random().toString(36).slice(2, 10); store.set('cid', cid); }

  // ---------- 狀態 ----------
  let S = null;          // 遊戲狀態（房主/單機：完整；加入者：自己的視角）
  let mode = null;       // 'ai' | 'local' | 'host' | 'guest'
  let mySeat = 0;        // 連線時自己的座位
  let viewer = 0;        // 同機輪流：目前拿著手機的人
  let seatInfo = [];     // [{name, online}]
  let sel = null;        // {action, idx:[]}
  let split = null;      // {a:[cards], b:[cards]}
  let respPick = null, respHidden = false;
  let lastSeq = -1, lastRoundShown = null, prevHand = null, newCard = null;
  let paused = false, aiTimer = 0, animUntil = 0;

  const me = () => mode === 'local' ? viewer : (mode === 'guest' || mode === 'host' ? mySeat : 0);
  const V = () => !S ? null : (mode === 'guest' ? S : E.view(S, me()));
  const actor = s => !s ? null : s.phase === 'respond' ? 1 - s.pending.from : s.phase === 'act' ? s.turn : null;

  // ---------- 外觀 ----------
  const fam = () => settings.style === 'fam';
  const gName = g => fam() ? G[g].famName : G[g].name;
  const gImg = (g, big) => fam() ? `assets/images/c_${G[g].fam}.png` : `assets/images/${G[g].key}${big ? '' : '_s'}.jpg`;
  const iImg = (g, big) => `assets/images/${G[g].item}${big ? '' : '_s'}.jpg`;
  function cardHTML(g, cls = '', attrs = '', style = '') {
    if (g === E.HIDDEN || g == null) return `<div class="card back ${cls}" style="${style}" ${attrs}></div>`;
    return `<div class="card ${cls}" style="--gc:${G[g].color};${style}" ${attrs}><img src="${iImg(g)}" alt="${G[g].itemName}" draggable="false"><span class="val">${G[g].value}</span><span class="nm">${G[g].itemName}</span></div>`;
  }

  // ---------- 音效（WebAudio，iOS 需要第一次觸碰解鎖） ----------
  let actx = null, master = null, musicBus = null;
  function unlockAudio() {
    try {
      if (!actx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
        master = actx.createGain(); master.connect(actx.destination);
        musicBus = actx.createGain(); musicBus.connect(master);
        // iOS 靜音開關下仍可播放的小技巧：播放一段無聲
        const b = actx.createBuffer(1, 1, 22050), s = actx.createBufferSource(); s.buffer = b; s.connect(actx.destination); s.start(0);
      }
      if (actx.state === 'suspended') actx.resume();
      applyMusic();
    } catch (e) {}
  }
  ['touchend', 'pointerup', 'keydown', 'click'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true }));

  function tone(freq, dur, type = 'sine', vol = 0.3, delay = 0, bus) {
    if (!actx) return;
    const level = bus ? 1 : settings.sfx / 100; if (level <= 0) return;
    const t0 = actx.currentTime + delay, g = actx.createGain(), o = actx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * level), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(bus || master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function pluck(freq, delay, vol, bus) { tone(freq, 1.6, 'triangle', vol, delay, bus); tone(freq * 2, 0.6, 'sine', vol * 0.35, delay, bus); }
  function whoosh() {
    if (!actx || settings.sfx <= 0) return;
    const n = actx.sampleRate * 0.35, b = actx.createBuffer(1, n, actx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
    const s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
    f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.8; g.gain.value = 0.35 * settings.sfx / 100;
    s.buffer = b; s.connect(f).connect(g).connect(master); s.start();
  }
  const sfx = {
    tap() { tone(1046, 0.06, 'triangle', 0.15); },
    card() { whoosh(); },
    myturn() { pluck(587, 0, 0.25); pluck(880, 0.12, 0.25); },
    offer() { [440, 554, 659].forEach((f, i) => pluck(f, i * 0.08, 0.2)); },
    favor() { [523, 659, 784, 1046].forEach((f, i) => pluck(f, i * 0.1, 0.22)); },
    win() { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => pluck(f, i * 0.13, 0.25)); },
    lose() { [440, 415, 392, 330].forEach((f, i) => pluck(f, i * 0.18, 0.2)); },
    err() { tone(180, 0.15, 'square', 0.1); },
  };

  // 背景音樂：程式產生的豎琴風旋律（多利安調式）
  const music = { timer: 0, next: 0, step: 0, note: 3 };
  const SCALE = [146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0, 440.0];
  function applyMusic() {
    if (!actx) return;
    musicBus.gain.value = settings.music / 100 * 0.45;
    if (settings.music > 0 && !music.timer) { music.next = actx.currentTime + 0.2; music.timer = setInterval(musicTick, 200); }
    if (settings.music <= 0 && music.timer) { clearInterval(music.timer); music.timer = 0; }
  }
  function musicTick() {
    if (!actx || actx.state !== 'running' || document.hidden) return;
    while (music.next < actx.currentTime + 0.6) {
      const t = music.next - actx.currentTime, st = music.step % 16;
      if (st === 0) { const root = [0, 3, 4, 0][Math.floor(music.step / 16) % 4]; tone(SCALE[root] / 2, 3.2, 'sine', 0.18, t, musicBus); pluck(SCALE[root], t, 0.12, musicBus); }
      if (st % 2 === 0 && Math.random() < 0.8) {
        music.note = Math.max(4, Math.min(11, music.note + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)]));
        pluck(SCALE[music.note], t, 0.13, musicBus);
      }
      music.step++; music.next += 0.32;
    }
  }

  // ---------- 小工具 ----------
  function show(id) { $$('.screen').forEach(e => e.classList.toggle('on', e.id === id)); window.scrollTo(0, 0); }
  function open(id) { $('#' + id).classList.add('on'); }
  function close(id) { $('#' + id).classList.remove('on'); }
  const isOpen = id => $('#' + id).classList.contains('on');
  $$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target.closest('[data-close]')) { close(o.id); onOverlayClosed(o.id); } }));
  function onOverlayClosed(id) { if (id === 'ovPause') { paused = false; scheduleAI(); } }
  function toast(html, ms = C.toastMs) {
    const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = html;
    const box = $('#toasts'); box.appendChild(d);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => d.remove(), ms);
  }
  let bannerT = 0;
  function banner(text) { const b = $('#banner'); b.textContent = text; b.classList.add('on'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), 1300); }
  function vibrate(ms) { if (settings.vib) try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }
  let wakeLock = null;
  async function keepAwake() { try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => wakeLock = null); } } catch (e) {} }
  const nameInput = $('#myName');
  nameInput.value = store.get('name', '');
  nameInput.addEventListener('input', () => store.set('name', nameInput.value.trim()));
  function myName(d) { return (nameInput.value || '').trim() || store.get('name', '') || d; }
  const nameOf = p => (S && S.names[p]) || '玩家';

  // ---------- 尺寸 ----------
  function layout(v) {
    const W = Math.min(window.innerWidth, 480), H = window.innerHeight;
    const c = Math.floor((W - 20 - 18) / 7);
    const n = v ? v.hands[me()].length : 7;
    const avail = W - 32;
    let hc = Math.min(H < 700 ? 56 : 66, Math.floor(avail / Math.max(n, 5)) + 12);
    const g = $('#game'); g.style.setProperty('--c', Math.min(c, H < 700 ? 44 : 60) + 'px'); g.style.setProperty('--hc', hc + 'px');
    return { avail, hc, n };
  }
  window.addEventListener('resize', () => { if (S) render(lastRendered); });

  // ---------- 繪製 ----------
  function render(vv, opt = {}) {
    const v = vv || shown || V(); if (!v) return;
    lastRendered = v;
    const m = me(), o = 1 - m, act = opt.judging ? null : actor(v);
    const L = layout(v);
    $('#roundLbl').textContent = `第 ${v.round} 回合`;
    let turn = '';
    if (v.phase === 'act') turn = act === m ? '輪到你獻祭' : `${esc(nameOf(o))} 獻祭中…`;
    else if (v.phase === 'respond') turn = act === m ? '請你挑選' : `${esc(nameOf(o))} 挑選中…`;
    else if (v.phase === 'roundEnd') turn = '回合結算';
    else if (v.phase === 'over') turn = `${esc(nameOf(v.winner))} 獲勝`;
    if (opt.judging) turn = '回合結算';
    $('#turnLbl').innerHTML = turn;

    // 對手
    const online = mode === 'host' || mode === 'guest' ? (seatInfo[o] ? seatInfo[o].online : true) : true;
    const oppTag = mode === 'ai' ? `電腦・${C.ai[aiLevel()].name}` : (mode === 'local' ? '同機' : (online ? '連線中' : '<span style="color:#ff9b8a">斷線</span>'));
    const oh = v.hands[o].length;
    $('#oppStrip').className = 'strip opp' + (act === o ? ' active' : '');
    $('#oppStrip').innerHTML = `<div class="who">${esc(nameOf(o))}<small>${oppTag}・手牌 ${oh}</small></div>
      <div class="hid">${hidSlots(v, o, false)}</div>
      <div class="toks">${C.actions.map((a, i) => `<span class="tok ${v.used[o][i] ? 'used' : ''}" data-tip="${i}">${a.icon}</span>`).join('')}</div>`;

    // 神殿
    let t = '';
    for (let g = 0; g < NG; g++) {
      const f = v.favor[g], oc = v.offer[o][g], mc = v.offer[m][g];
      t += `<div class="col" style="--gc:${G[g].color}">
        <div class="offers"><span class="cnt ${oc ? '' : 'zero'}" style="color:var(--opp)">${oc}</span><span class="chip ${oc ? '' : 'empty'}" data-chip="${o}-${g}">${oc ? `<img src="${iImg(g)}" alt="">` : ''}</span></div>
        <div class="marker">${f === o ? `<span class="coin opp" data-coin="${g}" ${opt.hideCoin === g ? 'style="visibility:hidden"' : ''}>眷</span>` : ''}</div>
        <div class="god ${fam() ? 'fam' : ''}" data-god="${g}"><img src="${gImg(g)}" alt="${esc(gName(g))}" draggable="false"><span class="val">${G[g].value}</span><span class="gname">${esc(gName(g))}</span></div>
        <div class="marker">${f === m ? `<span class="coin me" data-coin="${g}" ${opt.hideCoin === g ? 'style="visibility:hidden"' : ''}>眷</span>` : ''}</div>
        <div class="offers mine"><span class="chip ${mc ? '' : 'empty'}" data-chip="${m}-${g}">${mc ? `<img src="${iImg(g)}" alt="">` : ''}</span><span class="cnt ${mc ? '' : 'zero'}" style="color:var(--me)">${mc}</span></div>
      </div>`;
    }
    $('#temple').innerHTML = t;

    // 自己
    const sc = E.score(v.favor);
    $('#meStrip').className = 'strip me' + (act === m ? ' active' : '');
    $('#meStrip').innerHTML = `<div class="who">${esc(nameOf(m))}（你）<small>眷顧 <b id="scMeP">${sc.pts[m]}</b> 分・<b id="scMeG">${sc.cnt[m]}</b> 位神　｜　對手 <b id="scOpP">${sc.pts[o]}</b> 分・<b id="scOpG">${sc.cnt[o]}</b> 位</small></div>
      <div class="hid">${hidSlots(v, m, true)}</div>
      <div class="hid" title="牌庫"><span>牌庫</span><b id="deckN" style="color:var(--cream)">${v.deck.length}</b></div>`;

    // 行動按鈕
    const canAct = v.phase === 'act' && act === m;
    $('#acts').innerHTML = C.actions.map((a, i) => `<button class="act ${v.used[m][i] ? 'used' : ''} ${sel && sel.action === a.key ? 'on' : ''}" data-act="${a.key}" data-tip="${i}" ${!canAct || v.used[m][i] ? 'aria-disabled="true"' : ''}><b>${a.icon}</b>${a.name}<small>${a.cards} 張</small></button>`).join('');

    // 手牌
    let hand = v.hands[m];
    if (opt.hideNew && newCard != null && hand.indexOf(newCard) >= 0) { hand = hand.slice(); hand.splice(hand.indexOf(newCard), 1); }
    let nci = -1;
    const overlap = L.n > 1 && L.n * (L.hc + 4) > L.avail ? (L.avail - L.hc) / (L.n - 1) - L.hc : 4;
    $('#hand').innerHTML = hand.map((g, i) => cardHTML(g, (sel && sel.idx.includes(i) ? 'sel' : '') + (i === nci ? ' new' : ''), `data-hi="${i}"`, `margin-left:${i ? overlap : 0}px;z-index:${i}`)).join('') || '<div class="muted" style="align-self:center">手上沒有祭品了</div>';

    // 提示
    let hint = '', showConfirm = false, confirmOk = false;
    if (sel) {
      const A = C.actions[E.ACT[sel.action]];
      hint = `${A.icon} <b>${A.name}</b>：選 ${A.cards} 張（已選 ${sel.idx.length}）<br><small class="muted">${A.desc}</small>`;
      showConfirm = true; confirmOk = sel.idx.length === A.cards;
      $('#bConfirm').textContent = sel.action === 'tables' ? '下一步：分成兩份' : '確定獻上';
    } else if (v.phase === 'act' && act === m) hint = settings.hints ? '先點上面的一種行動，再選祭品' : '輪到你';
    else if (v.phase === 'respond' && act === m) hint = `<button class="btn small primary" id="bReopen">回到挑選</button>`;
    else if (v.phase === 'respond') hint = `等待 ${esc(nameOf(o))} 挑選你獻上的祭品…`;
    else if (v.phase === 'act') hint = mode === 'ai' ? '電腦思考中…' : `等待 ${esc(nameOf(o))}…`;
    else if (v.phase === 'roundEnd' || v.phase === 'over') hint = `<button class="btn small primary" id="bShowRound">看結算</button>`;
    $('#hint').innerHTML = hint;
    $('#confirm').classList.toggle('on', showConfirm);
    $('#bConfirm').disabled = !confirmOk;
    const r = $('#bReopen'); if (r) r.onclick = () => { respHidden = false; openRespond(); };
    const sr = $('#bShowRound'); if (sr) sr.onclick = () => showRound(true);
    renderPending(opt.judging ? null : v);
  }
  function hidSlots(v, p, mine) {
    let h = '';
    if (v.used[p][0]) {
      const s = v.secret[p];
      h += `<span class="slot ${s === E.HIDDEN ? 'back' : ''}" title="秘密祈禱">${s != null && s !== E.HIDDEN ? `<img src="${iImg(s)}" alt="">` : ''}</span>`;
    } else h += `<span class="slot">🕯️</span>`;
    if (v.used[p][1]) h += v.burned[p].map(b => `<span class="slot ${b === E.HIDDEN ? 'back' : ''}" title="焚燒" style="${mine ? 'opacity:.55' : ''}">${b !== E.HIDDEN ? `<img src="${iImg(b)}" alt="">` : ''}</span>`).join('');
    else h += `<span class="slot">🔥</span>`;
    return h;
  }

  // ---------- 滑鼠移上去顯示行動效果（手機：長按） ----------
  const tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip);
  function showTip(el) {
    const A = C.actions[+el.dataset.tip]; if (!A) return;
    const used = el.classList.contains('used');
    tip.innerHTML = `<b>${A.icon} ${A.name}</b>（拿出 ${A.cards} 張）<br>${A.desc}${used ? '<br><span class="muted">這回合已經用過</span>' : ''}`;
    tip.classList.add('on');
    const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2; x = Math.max(6, Math.min(window.innerWidth - tw - 6, x));
    let y = r.top - th - 8; if (y < 6) y = r.bottom + 8;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  document.addEventListener('pointerover', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const el = e.target.closest('[data-tip]'); if (el) showTip(el); else tip.classList.remove('on');
  });
  document.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') tip.classList.remove('on'); });
  let lpT = 0;
  document.addEventListener('touchstart', e => { const el = e.target.closest('[data-tip]'); clearTimeout(lpT); if (el) lpT = setTimeout(() => { showTip(el); setTimeout(() => tip.classList.remove('on'), 2500); }, 450); }, { passive: true });
  document.addEventListener('touchend', () => clearTimeout(lpT), { passive: true });

  // ---------- 動畫系統（排隊播放；動畫中點一下＝瞬間跳到結果） ----------
  const anim = { active: 0, skipping: false, list: new Set(), waiters: new Set(), queue: Promise.resolve(), swallow: false };
  const spd = () => settings.anim === 'off' ? 0 : settings.anim === 'fast' ? 0.5 : 1;
  const instant = () => anim.skipping || spd() === 0;
  function tween(el, frames, ms, opt = {}) {
    if (!el || !el.animate || instant()) return Promise.resolve();
    const a = el.animate(frames, { duration: ms * spd(), delay: (opt.delay || 0) * spd(), easing: opt.easing || 'cubic-bezier(.45,0,.3,1)', fill: 'both' });
    anim.list.add(a);
    return a.finished.catch(() => {}).then(() => { anim.list.delete(a); if (opt.keep !== true) try { a.cancel(); } catch (e) {} });
  }
  function wait(ms) {
    if (instant()) return Promise.resolve();
    return new Promise(res => { const done = () => { clearTimeout(t); anim.waiters.delete(done); res(); }; const t = setTimeout(done, ms * spd()); anim.waiters.add(done); });
  }
  function countTo(el, from, to, ms = 450) {
    if (!el) return Promise.resolve();
    if (instant() || from === to) { el.textContent = to; return Promise.resolve(); }
    return new Promise(res => {
      const t0 = performance.now(), dur = ms * spd();
      const done = () => { anim.waiters.delete(done); el.textContent = to; res(); };
      anim.waiters.add(done);
      (function step(t) { if (!anim.waiters.has(done)) return; const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(from + (to - from) * k); if (k < 1) requestAnimationFrame(step); else done(); })(t0);
    });
  }
  function skipAnim() {
    anim.skipping = true;
    anim.list.forEach(a => { try { a.finish(); } catch (e) {} });
    Array.from(anim.waiters).forEach(f => f());
  }
  function enqueue(fn) {
    anim.queue = anim.queue.then(async () => {
      anim.active++; $('#skipHint').classList.toggle('on', spd() > 0);
      try { await fn(); } catch (e) { console.error(e); }
      finally {
        anim.active--;
        if (!anim.active) { anim.skipping = false; flyLayer().innerHTML = ''; $('#skipHint').classList.remove('on'); }
      }
    });
    return anim.queue;
  }
  // 動畫播放中點畫面任何地方：跳過，而且這一下不算按到按鈕
  document.addEventListener('pointerdown', e => {
    if (anim.active && !anim.skipping && $('#game').classList.contains('on')) { anim.swallow = true; skipAnim(); e.preventDefault(); e.stopPropagation(); }
  }, true);
  document.addEventListener('click', e => { if (anim.swallow) { anim.swallow = false; e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('pointerup', () => setTimeout(() => { anim.swallow = false; }, 400), true);

  function flyLayer() { let L = $('#flyLayer'); if (!L) { L = document.createElement('div'); L.id = 'flyLayer'; document.body.appendChild(L); } return L; }
  const R = el => el ? el.getBoundingClientRect() : null;
  function ghost(html, r, cls = '') {
    const d = document.createElement('div'); d.className = 'ghost ' + cls; d.innerHTML = html;
    Object.assign(d.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    flyLayer().appendChild(d); return d;
  }
  // 從目前位置飛到 to（矩形），預設飛完就移除
  async function flyTo(d, to, ms = 600, opt = {}) {
    const r = R(d);
    const tf = `translate(${to.left - r.left}px,${to.top - r.top}px) scale(${to.width / r.width},${to.height / r.height})`;
    await tween(d, [{ transform: 'none', opacity: 1 }, { transform: tf, opacity: opt.fade ? 0 : 1 }], ms, { delay: opt.delay, keep: true });
    if (!opt.stay) d.remove();
  }
  async function flip(d, toHTML, ms = 360) { // 翻牌：寬度縮到 0，換正面，再展開
    await tween(d, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], ms / 2, { keep: true });
    d.innerHTML = toHTML;
    await tween(d, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], ms / 2);
  }
  function bump(el) { return tween(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.6)', offset: 0.35 }, { transform: 'scale(1)' }], 420, { easing: 'ease-out' }); }
  // 桌面中央排開的位置（groups：[[g,g],[g,g]] 或 [[g],[g],[g]]）
  function rowRects(groups) {
    const W = window.innerWidth, H = window.innerHeight, n = groups.flat().length;
    const cw = Math.min(70, (Math.min(W, 480) - 40) / Math.max(n, 3) - 8), ch = cw * 1.5, gap = 8, ggap = groups.length === 2 ? 26 : gap;
    const total = n * cw + (n - groups.length) * gap + (groups.length - 1) * ggap;
    let x = W / 2 - total / 2; const y = H * 0.42 - ch / 2, out = [];
    groups.forEach((gs, gi) => { gs.forEach((g, i) => { out.push({ left: x, top: y, width: cw, height: ch, g, gi }); x += cw + (i < gs.length - 1 ? gap : 0); }); x += ggap; });
    return out;
  }
  const pendGroups = P => P.type === 'oracle' ? P.cards.map(c => [c]) : P.groups;
  function renderPending(v) {
    const box = $('#pendRow');
    if (!v || v.phase !== 'respond' || !v.pending) { box.innerHTML = ''; box.className = ''; return; }
    const rs = rowRects(pendGroups(v.pending)), m = me();
    box.className = 'on' + (respHidden ? ' low' : '');
    box.innerHTML = `<div class="pcap" style="top:${rs[0].top - 30}px">${v.pending.from === m ? '你的' : esc(nameOf(v.pending.from)) + ' 的'}${C.actions[E.ACT[v.pending.type]].name}</div>` +
      rs.map((r, i) => `<div class="pcard" data-pi="${i}" style="left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px">${cardHTML(r.g)}</div>`).join('');
  }
  const chipEl = (side, g) => document.querySelector(`[data-chip="${side}-${g}"]`);
  function cntEl(side, g) { const c = chipEl(side, g); return c ? c.parentElement.querySelector('.cnt') : null; }
  // 卡片飛到神殿：飛之前數字先退回，抵達才 +1 並跳動
  async function cardsToChips(list) { // list: [{g, side, from(rect), glow}]
    list.forEach(it => { const c = cntEl(it.side, it.g), ch = chipEl(it.side, it.g); if (c) { c.textContent = +c.textContent - 1; if (+c.textContent <= 0) { c.classList.add('zero'); ch.style.opacity = '.15'; } } });
    await Promise.all(list.map(async (it, i) => {
      const d = ghost(cardHTML(it.g), it.from, it.glow || '');
      const ch = chipEl(it.side, it.g); if (!ch) { d.remove(); return; }
      await flyTo(d, R(ch), 620, { delay: i * 80 });
      const c = cntEl(it.side, it.g); if (c) { c.textContent = +c.textContent + 1; c.classList.remove('zero'); }
      ch.style.opacity = ''; sfx.tap(); bump(ch); bump(c);
    }));
    list.forEach(it => { const ch = chipEl(it.side, it.g); if (ch) ch.style.opacity = ''; }); // 跳過時也要恢復
  }
  const midRect = () => ({ left: window.innerWidth / 2 - 17, top: window.innerHeight * 0.4, width: 34, height: 51 });
  function oppHandRect() { const r = R($('#oppStrip .who')); return r ? { left: r.left + 20, top: r.top, width: 34, height: 51 } : midRect(); }
  function deckRect() { const r = R($('#deckN')); return r ? { left: r.left - 8, top: r.top - 14, width: 30, height: 45 } : midRect(); }
  function handRects() { return $$('#hand [data-hi]').map(el => ({ r: R(el), g: lastRendered ? lastRendered.hands[me()][+el.dataset.hi] : null })); }
  function takeRects(hr, cards, idx) { // 從手牌位置找出打出的牌的位置
    if (idx && idx.length === cards.length && idx.every(i => hr[i])) return idx.map(i => hr[i].r);
    const used = new Set();
    return cards.map(g => { const k = hr.findIndex((h, i) => !used.has(i) && h.g === g); if (k < 0) return hr[0] ? hr[0].r : deckRect(); used.add(k); return hr[k].r; });
  }

  // 抽牌：新牌從牌庫飛進手牌，其他牌讓位（FLIP）
  async function animateDraw(prevV, v, before) {
    const m = me(), o = 1 - m;
    if (v.hands[m].length === prevV.hands[m].length + 1 && newCard != null) {
      const els = $$('#hand [data-hi]'), ni = v.hands[m].indexOf(newCard), dr = deckRect();
      els.forEach((el, i) => {
        if (i === ni) { const r = R(el); el.style.opacity = '0'; const d = ghost(cardHTML(newCard), dr); flyTo(d, r, 550).then(() => { el.style.opacity = ''; }); }
        else { const ob = before[i < ni ? i : i - 1]; if (ob) { const r = R(el); tween(el, [{ transform: `translateX(${ob.r.left - r.left}px)` }, { transform: 'none' }], 420); } }
      });
      sfx.card();
      await wait(560); els.forEach(el => el.style.opacity = '');
    } else if (v.hands[o].length === prevV.hands[o].length + 1) {
      const d = ghost(cardHTML(E.HIDDEN), deckRect()); await flyTo(d, oppHandRect(), 450);
    }
  }

  // 一次狀態變化要播的動畫
  async function playEvent(prevV, v) {
    const ev = v.ev || {}, m = me(), o = 1 - m;
    const A = k => C.actions[E.ACT[k]];
    const hr = handRects(), pend = $$('#pendRow .pcard').map(R);
    const oldDeck = prevV ? prevV.deck.length : v.deck.length;
    let roundV = v;
    if (ev.roundEnd) { roundV = v; v = E.clone(v); } // 結算時先用結算前的畫面

    if (ev.type === 'round') {
      // 收牌：神殿上的祭品飛回牌庫
      close('ovRound');
      const back = [];
      for (let p = 0; p < 2; p++) for (let g = 0; g < NG; g++) if (prevV && prevV.offer[p][g]) { const ch = chipEl(p, g); if (ch) back.push({ g, r: R(ch) }); }
      if (back.length) { const dr = deckRect(); await Promise.all(back.map((b, i) => flyTo(ghost(cardHTML(b.g), b.r), dr, 500, { delay: i * 40, fade: true }))); }
      sfx.card();
      render(v);
      // 發牌
      const els = $$('#hand [data-hi]'); els.forEach(el => el.style.opacity = '0');
      const dn = $('#deckN'), total = v.deck.length + v.hands[0].length + v.hands[1].length;
      countTo(dn, total, v.deck.length, 1400);
      const jobs = [];
      els.forEach((el, i) => { const r = R(el); jobs.push(wait(i * 170).then(() => { const d = ghost(cardHTML(E.HIDDEN), deckRect()); return flyTo(d, r, 380).then(() => { el.style.opacity = ''; sfx.tap(); return tween(el, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 200); }); })); });
      for (let i = 0; i < v.hands[o].length; i++) jobs.push(wait(i * 170 + 85).then(() => flyTo(ghost(cardHTML(E.HIDDEN), deckRect()), oppHandRect(), 380)));
      await Promise.all(jobs); els.forEach(el => el.style.opacity = '');
      if (mode !== 'local') { const a = actor(v); await announce(a === m ? '你先手' : `${esc(nameOf(a))} 先手`, `第 ${v.round} 回合`, a === m ? 'me' : 'opp'); }
    } else if (ev.type === 'secret' || ev.type === 'burn') {
      if (ev.p !== m && mode !== 'local') await announce(`${esc(nameOf(ev.p))} 選擇了`, `${A(ev.type).icon} ${A(ev.type).name}`, 'opp');
      const n = ev.type === 'secret' ? 1 : 2;
      const cards = mode === 'local' || ev.p !== m ? new Array(n).fill(E.HIDDEN) : (ev.type === 'secret' ? [v.secret[m]] : v.burned[m].slice());
      const from = ev.p === m ? takeRects(hr, ev.type === 'secret' ? [v.secret[m]] : v.burned[m], playedIdx) : cards.map(oppHandRect);
      // 畫面先換成新狀態，但「下一位抽的牌」先藏著
      render(v, { hideNew: true });
      const strip = ev.p === m ? '#meStrip' : '#oppStrip', slots = $$(strip + ' .hid .slot');
      const targets = ev.type === 'secret' ? [slots[0]] : slots.slice(1, 3);
      targets.forEach(t => t && (t.style.visibility = 'hidden'));
      tokFlip(ev.p, ev.type);
      await Promise.all(cards.map((g, i) => flyTo(ghost(cardHTML(g), from[i] || oppHandRect()), R(targets[i] || slots[0]), 520, { delay: i * 90 })));
      targets.forEach(t => t && (t.style.visibility = ''));
      if (ev.type === 'burn') { sfx.card(); await Promise.all(targets.map(t => t && tween(t, [{ filter: 'brightness(2.2) sepia(1) hue-rotate(-20deg)' }, { filter: 'none' }], 500))); }
      if (!ev.roundEnd) { render(v); await animateDraw(prevV, v, hr); }
    } else if (ev.type === 'offer') {
      const groups = pendGroups(v.pending), rs = rowRects(groups), flat = groups.flat();
      if (ev.p !== m) { if (mode !== 'local') await announce(`${esc(nameOf(ev.p))} 選擇了`, `${A(ev.kind).icon} ${A(ev.kind).name}`, 'opp'); sfx.offer(); vibrate(60); respHidden = false; }
      const from = ev.p === m ? takeRects(hr, flat.slice().sort((a, b) => a - b), null) : flat.map(oppHandRect);
      // takeRects 依手牌順序配對；重新對應到 flat 順序
      const fromByCard = ev.p === m ? (() => { const used = new Set(); return flat.map(g => { const k = hr.findIndex((h, i) => !used.has(i) && h.g === g && (!playedIdx || playedIdx.includes(i))); const kk = k >= 0 ? k : hr.findIndex((h, i) => !used.has(i) && h.g === g); used.add(kk); return kk >= 0 ? hr[kk].r : deckRect(); }); })() : from;
      render(v); $('#pendRow').style.visibility = 'hidden';
      tokFlip(ev.p, ev.kind);
      const gs = flat.map((g, i) => ghost(cardHTML(ev.p === m ? g : E.HIDDEN), fromByCard[i]));
      await Promise.all(gs.map((d, i) => flyTo(d, rs[i], 520, { delay: i * 80, stay: true })));
      if (ev.p !== m) await Promise.all(gs.map((d, i) => wait(i * 60).then(() => flip(d, cardHTML(flat[i])))));
      $('#pendRow').style.visibility = ''; gs.forEach(d => d.remove());
      sfx.offer();
    } else if (ev.type === 'picked') {
      const its = cs => cs.map(c => G[c].itemName).join('＋');
      if (ev.from === m) toast(`${esc(nameOf(o))} 挑走 ${its(ev.mine)}，你得到 ${its(ev.theirs)}`, 3400);
      if (ev.p !== m && mode !== 'local') await announce(`${esc(nameOf(ev.p))} 挑好了`, '', 'opp');
      // 中央的牌：挑走的那份標上顏色，停一下再飛到兩邊
      const groups = ev.kind === 'oracle' ? [ev.mine, ev.theirs] : [ev.mine, ev.theirs];
      const rs = rowRects(groups);
      const startRects = pend.length === rs.length ? null : rs;
      render(v, { hideNew: true });
      const items = ev.mine.map(g => ({ g, side: ev.p, glow: ev.p === m ? 'gme' : 'gop' })).concat(ev.theirs.map(g => ({ g, side: ev.from, glow: ev.from === m ? 'gme' : 'gop' })));
      items.forEach((it, i) => it.from = rs[i]);
      const cap = ghost(`${ev.p === m ? '你' : esc(nameOf(ev.p))} 挑了左邊${ev.mine.length > 1 ? '這份' : '這張'}`, { left: 0, top: rs[0].top - 34, width: window.innerWidth, height: 26 }, 'flycap');
      const show = items.map((it, i) => ghost(cardHTML(it.g), it.from, it.glow));
      await Promise.all(show.map((d, i) => tween(d, [{ transform: 'scale(.85)', opacity: .6 }, { transform: 'scale(1)', opacity: 1 }], 260, { delay: i * 40 })));
      sfx.offer();
      await wait(650);
      show.forEach(d => d.remove()); cap.remove();
      await cardsToChips(items);
      if (!ev.roundEnd) { render(v); await animateDraw(prevV, v, hr); }
    } else render(v);

    if (ev.roundEnd) await playRoundEnd(roundV);
    else if (ev.type !== 'round') await announceTurn(prevV, v);
    else if (prevV && v.deck.length !== oldDeck && ev.type !== 'round') countTo($('#deckN'), oldDeck, v.deck.length, 300);
  }

  function tokFlip(p, key) {
    const i = E.ACT[key], el = p === me() ? $(`#acts [data-act="${key}"]`) : $(`#oppStrip .tok[data-tip="${i}"]`);
    if (el) tween(el, [{ transform: 'rotateY(0)', filter: 'none', opacity: 1 }, { transform: 'rotateY(90deg)', opacity: 1, offset: 0.5 }, { transform: 'rotateY(0)' }], 520);
  }

  // 回合結算：翻開秘密祈禱 → 一位一位神比較 → 金幣移動、分數累加
  async function playRoundEnd(v) {
    const Rz = v.result, m = me(), o = 1 - m;
    const pre = E.clone(v);
    pre.favor = Rz.before.slice();
    pre.offer = E.clone(Rz.offer);
    for (let p = 0; p < 2; p++) if (Rz.secret[p] != null) pre.offer[p][Rz.secret[p]]--;
    pre.phase = 'act'; pre.turn = null; pre.secret = Rz.secret.slice();
    pre.secret = pre.secret.map((s, p) => p === m || s == null ? s : E.HIDDEN);
    render(pre, { judging: true });
    await wait(350);
    banner('回合結算'); await wait(700);
    // 翻開秘密祈禱
    const flips = [];
    for (let p = 0; p < 2; p++) {
      const g = Rz.secret[p]; if (g == null) continue;
      const slot = $((p === m ? '#meStrip' : '#oppStrip') + ' .hid .slot');
      const mid = rowRects([[0, 0]])[p === m ? 1 : 0];
      flips.push((async () => {
        const d = ghost(cardHTML(p === m && mode !== 'local' ? g : E.HIDDEN), R(slot));
        if (slot) slot.style.visibility = 'hidden';
        await flyTo(d, mid, 450, { stay: true });
        if (!(p === m && mode !== 'local')) await flip(d, cardHTML(g));
        await wait(350); d.remove();
        pre.offer[p][g]++; render(pre, { judging: true });
        const s2 = $((p === m ? '#meStrip' : '#oppStrip') + ' .hid .slot'); if (s2) s2.style.visibility = 'hidden';
        const c = cntEl(p, g), ch = chipEl(p, g);
        if (c) { c.textContent = +c.textContent - 1; if (+c.textContent <= 0) { c.classList.add('zero'); ch.style.opacity = '.15'; } }
        const d2 = ghost(cardHTML(g), mid, p === m ? 'gme' : 'gop');
        await flyTo(d2, R(ch), 520);
        if (c) { c.textContent = +c.textContent + 1; c.classList.remove('zero'); } if (ch) { ch.style.opacity = ''; bump(ch); } bump(c);
      })());
    }
    await Promise.all(flips);
    render(pre, { judging: true });
    // 逐位神比較
    for (let g = 0; g < NG; g++) {
      const col = $$('#temple .col')[g]; if (!col) continue;
      col.classList.add('judge');
      const a = Rz.after[g], b = Rz.before[g];
      await wait(220);
      if (a !== b) {
        const oldSc = E.score(pre.favor);
        const from = $(`[data-coin="${g}"]`), godR = R(col.querySelector('.god'));
        const fr = from ? R(from) : { left: godR.left + godR.width / 2 - 9, top: godR.top + godR.height / 2 - 9, width: 18, height: 18 };
        pre.favor[g] = a; render(pre, { judging: true, judgeUpto: g, hideCoin: g });
        const to = $(`[data-coin="${g}"]`);
        const d = ghost(`<span class="coin ${a === m ? 'me' : 'opp'}">眷</span>`, fr, 'coinghost');
        sfx.favor();
        await flyTo(d, R(to), 520);
        if (to) { to.style.visibility = ''; bump(to); }
        const ns = E.score(pre.favor);
        await Promise.all([countTo($('#scMeP'), oldSc.pts[m], ns.pts[m]), countTo($('#scOpP'), oldSc.pts[o], ns.pts[o]), countTo($('#scMeG'), oldSc.cnt[m], ns.cnt[m], 300), countTo($('#scOpG'), oldSc.cnt[o], ns.cnt[o], 300)]);
      } else await wait(180);
      const c2 = $$('#temple .col')[g]; if (c2) c2.classList.remove('judge');
    }
    render(v);
    if (v.phase === 'over') await victory(v.winner === m || mode === 'local');
  }

  // 大字提示：誰做了什麼、輪到誰（可點一下跳過）
  async function announce(title, sub = '', cls = '') {
    if (instant()) return;
    const W = window.innerWidth, H = window.innerHeight;
    const d = ghost(`<div class="ann ${cls}"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>`, { left: 0, top: H * 0.17, width: W, height: 96 }, 'annwrap');
    await tween(d, [{ opacity: 0, transform: 'translateX(-36px)' }, { opacity: 1, transform: 'none' }], 260, { keep: true });
    await wait(820);
    await tween(d, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(36px)' }], 240, { keep: true });
    d.remove();
  }
  async function announceTurn(prevV, v) {
    if (mode === 'local' || !prevV) return;
    const a = actor(v), b = actor(prevV), m = me();
    if (a == null || (a === b && prevV.phase === v.phase)) return;
    if (a === m) await announce('輪到你', v.phase === 'respond' ? '挑選對手獻上的祭品' : '選一種行動獻祭', 'me');
    else await announce(`換 ${esc(nameOf(a))}`, v.phase === 'respond' ? '等待對方挑選' : (mode === 'ai' ? '電腦思考中…' : '等待對方行動'), 'opp');
  }

  async function victory(good) {
    const W = window.innerWidth, H = window.innerHeight, jobs = [];
    if (instant()) return;
    for (let i = 0; i < 46; i++) {
      const d = ghost('', { left: W / 2 - 6, top: H * 0.4, width: 12, height: 12 }, good ? 'spark' : 'spark dim');
      const ang = Math.random() * Math.PI * 2, dist = 80 + Math.random() * Math.min(W, 480) * 0.5;
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist * 0.6;
      jobs.push(tween(d, [{ transform: 'translate(0,0) scale(.4)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1, offset: 0.45 }, { transform: `translate(${dx * 1.1}px,${dy + H * 0.45}px) scale(.6)`, opacity: 0 }], 1500 + Math.random() * 600, { delay: Math.random() * 250, easing: 'ease-out', keep: true }).then(() => d.remove()));
    }
    await Promise.all(jobs);
  }

  // ---------- 操作 ----------
  $('#acts').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || b.getAttribute('aria-disabled') === 'true') return;
    sfx.tap();
    const k = b.dataset.act;
    if (sel && sel.action === k) sel = null;
    else {
      const keep = sel ? sel.idx : [];
      const need = C.actions[E.ACT[k]].cards;
      sel = { action: k, idx: keep.slice(0, need) };
    }
    render();
  });
  $('#hand').addEventListener('click', e => {
    const c = e.target.closest('[data-hi]'); if (!c) return;
    const v = V(); if (!v || v.phase !== 'act' || actor(v) !== me()) return;
    if (!sel) { if (settings.hints) toast('先選一種行動（上面四個按鈕）'); sfx.err(); return; }
    const i = +c.dataset.hi, need = C.actions[E.ACT[sel.action]].cards;
    const k = sel.idx.indexOf(i);
    if (k >= 0) sel.idx.splice(k, 1);
    else if (sel.idx.length < need) sel.idx.push(i);
    else if (need === 1) sel.idx = [i];
    else { sfx.err(); toast(`這個行動只要 ${need} 張`); return; }
    sfx.tap(); render();
  });
  $('#bCancel').onclick = () => { sel = null; render(); };
  $('#bConfirm').onclick = () => {
    const v = V(); if (!sel || !v) return;
    const cards = sel.idx.map(i => v.hands[me()][i]);
    if (sel.action === 'tables') { playedIdx = sel.idx.slice(); split = { a: cards.slice(0, 2), b: cards.slice(2) }; renderSplit(); open('ovSplit'); return; }
    const m = { type: 'act', action: sel.action, cards };
    playedIdx = sel.idx.slice(); sel = null; sfx.card(); doMove(m);
  };
  function renderSplit() {
    $('#pileA').innerHTML = split.a.map((g, i) => cardHTML(g, '', `data-pa="${i}"`)).join('');
    $('#pileB').innerHTML = split.b.map((g, i) => cardHTML(g, '', `data-pb="${i}"`)).join('');
  }
  $('#ovSplit').addEventListener('click', e => {
    const a = e.target.closest('[data-pa]'), b = e.target.closest('[data-pb]');
    if (!a && !b) return;
    sfx.tap();
    // 交換：點一張就和另一份的第一張對調，兩份永遠各兩張
    if (a) { const i = +a.dataset.pa; const sw = split.selB; if (sw != null) { [split.a[i], split.b[sw]] = [split.b[sw], split.a[i]]; split.selA = split.selB = null; } else split.selA = split.selA === i ? null : i; }
    if (b) { const i = +b.dataset.pb; const sw = split.selA; if (sw != null) { [split.b[i], split.a[sw]] = [split.a[sw], split.b[i]]; split.selA = split.selB = null; } else split.selB = split.selB === i ? null : i; }
    renderSplit();
    if (split.selA != null) $(`[data-pa="${split.selA}"]`).classList.add('sel');
    if (split.selB != null) $(`[data-pb="${split.selB}"]`).classList.add('sel');
  });
  $('#bSplitCancel').onclick = () => { close('ovSplit'); };
  $('#bSplitOk').onclick = () => {
    close('ovSplit');
    const m = { type: 'act', action: 'tables', groups: [split.a.slice(), split.b.slice()] };
    sel = null; split = null; sfx.card(); doMove(m);
  };
  // 第一次用分組時補一行提示
  $('#ovSplit .muted').textContent = '點一張祭品，再點另一份的祭品，兩張就會交換。對手會先挑走一份。';

  // 被要求挑選
  function openRespond() {
    const v = V(); if (!v || v.phase !== 'respond' || actor(v) !== me()) return;
    const P = v.pending, from = nameOf(P.from);
    respPick = null;
    $('#rTitle').textContent = P.type === 'oracle' ? '神諭抉擇' : '雙份供桌';
    $('#rDesc').innerHTML = P.type === 'oracle' ? `${esc(from)} 拿出三張祭品。<br>挑<b>一張</b>獻給你的神，另外兩張歸 ${esc(from)}。` : `${esc(from)} 分成兩份祭品。<br>挑<b>一份</b>獻給你的神，另一份歸 ${esc(from)}。`;
    const groups = P.type === 'oracle' ? P.cards.map(c => [c]) : P.groups;
    $('#rChoices').innerHTML = groups.map((gs, i) => `<div class="choice" data-pick="${i}">${gs.map(c => cardHTML(c)).join('')}</div>`).join('');
    $('#bRespond').disabled = true;
    open('ovRespond');
  }
  $('#rChoices').addEventListener('click', e => {
    const c = e.target.closest('[data-pick]'); if (!c) return;
    sfx.tap(); respPick = +c.dataset.pick;
    $$('#rChoices .choice').forEach(x => x.classList.toggle('on', x === c));
    $('#bRespond').disabled = false;
  });
  $('#bRespond').onclick = () => { if (respPick == null) return; close('ovRespond'); respHidden = false; sfx.card(); doMove({ type: 'respond', pick: respPick }); };
  $('#bRespondLook').onclick = () => { close('ovRespond'); respHidden = true; render(); };
  $('#pendRow').addEventListener('click', () => {});

  // 點神看大圖
  $('#temple').addEventListener('click', e => {
    const d = e.target.closest('[data-god]'); if (!d) return;
    const v = V(), g = +d.dataset.god, m = me(), o = 1 - m;
    const im = $('#gImg'); im.src = gImg(g, true); im.className = 'bigcard' + (fam() ? ' fam' : ''); im.style.setProperty('--gc', G[g].color);
    $('#gName').textContent = fam() ? `${G[g].famName}（${G[g].name}）` : `${G[g].name}・${G[g].title}`;
    const f = v.favor[g];
    $('#gInfo').innerHTML = `眷顧分數 <b>${G[g].value}</b> 分　祭品：<b>${G[g].itemName}</b>（共 ${G[g].value} 張）<br>
      你獻上 <b style="color:var(--me)">${v.offer[m][g]}</b>　對手獻上 <b style="color:var(--opp)">${v.offer[o][g]}</b><br>
      目前眷顧：${f == null ? '還沒有人' : (f === m ? '<b style="color:var(--me)">你</b>' : `<b style="color:var(--opp)">${esc(nameOf(o))}</b>`)}`;
    open('ovGod');
  });

  // ---------- 動作執行 ----------
  function doMove(m, seat) {
    const p = seat == null ? me() : seat;
    if (mode === 'guest') { net.send({ t: 'act', m }); return; }
    const err = E.validate(S, p, m);
    if (err) { toast(esc(err)); sfx.err(); render(); return; }
    E.apply(S, p, m);
    if (mode === 'host') { host.broadcast(); host.save(); }
    else saveLocal();
    afterChange();
  }

  // 狀態改變後：排進動畫佇列，播完再處理結算視窗、電腦、換人遮罩
  let shown = null, lastRendered = null, playedIdx = null;
  function afterChange() {
    const v = V(); if (!v) return;
    const m = me(), seqChanged = v.seq !== lastSeq;
    const hand = v.hands[m];
    let nc = null;
    if (prevHand && prevHand.round === v.round && prevHand.seat === m && hand.length === prevHand.h.length + 1) {
      const rest = prevHand.h.slice(); for (const c of hand) { const i = rest.indexOf(c); if (i >= 0) rest.splice(i, 1); else { nc = c; break; } }
    }
    prevHand = { round: v.round, seat: m, h: hand.slice() };
    lastSeq = v.seq;
    if (v.phase !== 'act' || actor(v) !== m) sel = null;
    const prevV = shown; shown = v;
    enqueue(async () => {
      newCard = nc;
      const ev = v.ev || {};
      if (seqChanged && v.ev && (prevV || ev.type === 'round') && $('#game').classList.contains('on') && !isOpen('ovPass')) await playEvent(prevV, v);
      playedIdx = null;
      if (v !== shown) return; // 後面還有新的狀態在排隊
      if (seqChanged && actor(v) === m && v.phase === 'act') { sfx.myturn(); vibrate(40); }
      await postEvent(v);
    });
  }
  async function postEvent(v) {
    const m = me();
    if (mode === 'local') { const a = actor(v); if (a != null && a !== viewer) { askPass(a); return; } }
    render(v);
    if (v.phase === 'respond' && actor(v) === m && !respHidden && !isOpen('ovPass')) openRespond();
    if ((v.phase === 'roundEnd' || v.phase === 'over') && lastRoundShown !== v.round + ':' + v.phase) await showRound(false, true);
    scheduleAI();
  }

  // ---------- 回合結算 ----------
  async function showRound(force, animate) {
    const v = V(); if (!v || !v.result) return;
    const R = v.result, m = me(), o = 1 - m;
    lastRoundShown = v.round + ':' + v.phase;
    let h = '';
    const sec = R.secret.map((s, p) => s == null ? null : s);
    h += `<div class="muted" style="text-align:center;font-size:14px;margin-bottom:6px">秘密祈禱翻開：你 ${sec[m] != null ? G[sec[m]].itemName : '—'}、對手 ${sec[o] != null ? G[sec[o]].itemName : '—'}</div>`;
    h += `<div class="res-row res-head"><span></span><span>神</span><span style="text-align:center">你</span><span style="text-align:center">對手</span><span style="text-align:center">眷顧</span></div>`;
    for (let g = 0; g < NG; g++) {
      const a = R.after[g], b = R.before[g], moved = a !== b;
      const lbl = a == null ? '<span class="muted">無</span>' : (a === m ? '<b style="color:var(--me)">你</b>' : '<b style="color:var(--opp)">對手</b>');
      h += `<div class="res-row ${fam() ? 'fam' : ''}" style="--gc:${G[g].color}"><img src="${gImg(g)}" alt=""><span>${esc(gName(g))} <small class="muted">${G[g].value} 分</small></span><span class="n" style="color:var(--me)" data-to="${R.offer[m][g]}">${R.offer[m][g]}</span><span class="n" style="color:var(--opp)" data-to="${R.offer[o][g]}">${R.offer[o][g]}</span><span class="fv" style="text-align:center">${lbl}${moved ? ' ✦' : ''}</span></div>`;
    }
    h += `<div class="sumline"><div>你<b style="color:var(--me)"><span id="rsMeP">${R.pts[m]}</span> 分</b><span id="rsMeG">${R.cnt[m]}</span> 位神</div><div>對手<b style="color:var(--opp)"><span id="rsOpP">${R.pts[o]}</span> 分</b><span id="rsOpG">${R.cnt[o]}</span> 位神</div></div>`;
    h += `<div class="muted" style="text-align:center;font-size:13px">✦＝這回合眷顧換人或新得到　目標：${C.winPoints} 分或 ${C.winGods} 位神</div>`;
    let btns = '';
    if (v.phase === 'over') {
      const iWin = R.winner === m;
      $('#roundTitle').textContent = mode === 'local' ? `${nameOf(R.winner)} 獲勝！` : (iWin ? '眾神眷顧你！' : `${nameOf(R.winner)} 獲勝`);
      h = `<p id="rsWin" style="text-align:center;font-size:17px">${esc(nameOf(R.winner))} ${R.why === 'points' ? `得到 ${R.pts[R.winner]} 分眷顧` : `得到 ${R.cnt[R.winner]} 位神的眷顧`}，贏得這場獻祭。</p>` + h;
      if (mode !== 'guest') btns += `<button class="btn primary" id="bAgain">再玩一局</button>`;
      else btns += `<div class="muted" style="text-align:center">等房主開新的一局…</div>`;
      btns += `<button class="btn" id="bLook">看看神殿</button><button class="btn ghost" id="bHome">回封面</button>`;
      if (!force && !animate) { if (mode === 'local' || iWin) sfx.win(); else sfx.lose(); }
    } else {
      $('#roundTitle').textContent = `第 ${R.round} 回合結算`;
      btns += `<button class="btn primary" id="bNext">開始第 ${R.round + 1} 回合</button><button class="btn" id="bLook">看看神殿</button>`;
    }
    $('#roundBody').innerHTML = h; $('#roundBtns').innerHTML = btns;
    const bn = $('#bNext'); if (bn) bn.onclick = () => { close('ovRound'); doMove({ type: 'next' }); };
    $('#bLook').onclick = () => close('ovRound');
    const ba = $('#bAgain'); if (ba) ba.onclick = () => { close('ovRound'); rematch(); };
    const bh = $('#bHome'); if (bh) bh.onclick = () => quitGame(true);
    open('ovRound');
    if (animate && !instant()) await tallyRound(v);
  }
  // 結算表：一位一位神清點，分數跟著累加，最後才公布結果
  async function tallyRound(v) {
    const R = v.result, m = me(), o = 1 - m;
    const title = $('#roundTitle'), finalTitle = title.textContent;
    const rows = $$('#roundBody .res-row:not(.res-head)'), win = $('#rsWin'), btns = $('#roundBtns');
    const ids = ['rsMeP', 'rsMeG', 'rsOpP', 'rsOpG'].map(i => $('#' + i));
    title.textContent = '清點眾神的眷顧…';
    rows.forEach(r => { r.style.opacity = '0'; r.querySelectorAll('.n').forEach(n => n.textContent = '0'); r.querySelector('.fv').style.visibility = 'hidden'; });
    ids.forEach(x => x && (x.textContent = '0'));
    if (win) win.style.visibility = 'hidden';
    btns.style.visibility = 'hidden';
    const tot = { p: [0, 0], c: [0, 0] };
    for (let g = 0; g < rows.length; g++) {
      const r = rows[g];
      r.scrollIntoView({ block: 'nearest' });
      await tween(r, [{ opacity: 0, transform: 'translateX(-24px)' }, { opacity: 1, transform: 'none' }], 240);
      r.style.opacity = '';
      const ns = Array.from(r.querySelectorAll('.n'));
      await Promise.all(ns.map(n => countTo(n, 0, +n.dataset.to, 380)));
      const fv = r.querySelector('.fv'); fv.style.visibility = '';
      const a = R.after[g];
      if (a != null) {
        sfx.tap(); await bump(fv);
        const side = a === m ? 0 : 1, op = tot.p[side], oc = tot.c[side];
        tot.p[side] += G[g].value; tot.c[side]++;
        await Promise.all([countTo(ids[side * 2], op, tot.p[side], 300), countTo(ids[side * 2 + 1], oc, tot.c[side], 200)]);
      } else await wait(160);
    }
    ids[0].textContent = R.pts[m]; ids[1].textContent = R.cnt[m]; ids[2].textContent = R.pts[o]; ids[3].textContent = R.cnt[o];
    await wait(300);
    title.textContent = finalTitle; bump(title);
    if (win) { win.style.visibility = ''; win.scrollIntoView({ block: 'nearest' }); await tween(win, [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], 320); }
    if (v.phase === 'over') { if (mode === 'local' || R.winner === m) sfx.win(); else sfx.lose(); } else sfx.favor();
    rows.forEach(r => { r.style.opacity = ''; r.querySelector('.fv').style.visibility = ''; r.querySelectorAll('.n').forEach(n => n.textContent = n.dataset.to); });
    if (win) win.style.visibility = '';
    btns.style.visibility = '';
    $('#roundBody').scrollTop = 0;
  }

  // ---------- 電腦 ----------
  const aiLevel = () => settings.ai in C.ai ? settings.ai : 'normal';
  function scheduleAI() {
    clearTimeout(aiTimer);
    if (mode !== 'ai' || !S || paused) return;
    const a = actor(S); if (a !== 1) return;
    aiTimer = setTimeout(() => {
      if (mode !== 'ai' || paused || actor(S) !== 1) return;
      const t0 = Date.now();
      const m = E.aiMove(E.view(S, 1), 1, aiLevel());
      setTimeout(() => { if (mode === 'ai' && !paused && actor(S) === 1) doMove(m, 1); }, Math.max(0, 250 - (Date.now() - t0)));
    }, C.aiDelayMs);
  }

  // ---------- 同機輪流 ----------
  function askPass(p) {
    $('#passName').textContent = nameOf(p); $('#passName2').textContent = nameOf(p);
    const v = S;
    $('#passWhy').textContent = v.phase === 'respond' ? `要挑選 ${nameOf(1 - p)} 獻上的祭品` : '輪到你獻祭';
    $$('.overlay').forEach(o => { if (o.id !== 'ovPass') o.classList.remove('on'); });
    open('ovPass'); $('#hand').innerHTML = '';
  }
  $('#bPassGo').onclick = () => { const a = actor(S); if (a != null) viewer = a; close('ovPass'); const v = V(); prevHand = { round: v.round, seat: me(), h: v.hands[me()].slice() }; lastSeq = S.seq; shown = v; sfx.myturn(); render(v); if (v.phase === 'respond' && actor(v) === me()) setTimeout(openRespond, 250); };

  // ---------- 開始遊戲 ----------
  function resetUI() { shown = null; lastRendered = null; playedIdx = null; sel = null; split = null; respHidden = false; lastSeq = -1; lastRoundShown = null; prevHand = null; newCard = null; paused = false; $$('.overlay').forEach(o => o.classList.remove('on')); }
  function startLocal(kind, names) {
    resetUI(); mode = kind; seatInfo = [];
    S = E.newGame(names); viewer = S.start;
    if (kind === 'ai') viewer = 0;
    saveLocal(); show('game'); keepAwake();
    prevHand = null;
    if (kind === 'local') { lastSeq = S.seq; shown = V(); askPass(S.turn); } else afterChange();
    toast(`${esc(nameOf(S.start))} 先手`);
  }
  function saveLocal() { if (mode === 'ai' || mode === 'local') store.set('save', { mode, S, viewer, ts: Date.now() }); }
  function rematch() {
    if (mode === 'host') { host.startGame(); return; }
    if (mode === 'ai' || mode === 'local') startLocal(mode, S.names.slice());
  }

  $('#bAI').onclick = () => { $$('#aiLevel button').forEach(b => b.classList.toggle('on', b.dataset.v === aiLevel())); open('ovAI'); };
  $('#aiLevel').onclick = e => { const b = e.target.closest('button'); if (!b) return; settings.ai = b.dataset.v; saveSettings(); $$('#aiLevel button').forEach(x => x.classList.toggle('on', x === b)); };
  $('#bAIGo').onclick = () => { close('ovAI'); unlockAudio(); startLocal('ai', [myName('你'), '電腦祭司']); };
  $('#bLocal').onclick = () => { const ns = store.get('localNames', []); $('#ln0').value = ns[0] || myName(''); $('#ln1').value = ns[1] || ''; open('ovLocal'); };
  $('#bLocalGo').onclick = () => {
    const names = [$('#ln0').value.trim() || '玩家一', $('#ln1').value.trim() || '玩家二'];
    store.set('localNames', names); close('ovLocal'); unlockAudio(); startLocal('local', names);
  };

  // ---------- 暫停、設定、說明 ----------
  $('#bPause').onclick = () => {
    paused = mode === 'ai'; clearTimeout(aiTimer);
    $('#pauseNote').textContent = mode === 'host' || mode === 'guest' ? '連線對戰中，對手那邊不會暫停。' : (mode === 'ai' ? '電腦也會等你。' : '');
    open('ovPause');
  };
  $('#pSet').onclick = () => openSettings();
  $('#pHelp').onclick = () => open('ovHelp');
  $('#pLog').onclick = () => {
    const lg = S ? S.log : [];
    $('#logList').innerHTML = lg.slice().reverse().map(l => `<div><span class="muted">R${l.r}</span> ${esc(l.t)}</div>`).join('') || '<div class="muted">還沒有紀錄</div>';
    open('ovLog');
  };
  $('#pQuit').onclick = () => quitGame(mode !== 'host' && mode !== 'guest');
  $('#bHelp').onclick = () => open('ovHelp');
  $('#bSet').onclick = () => openSettings();
  function openSettings() {
    $('#vMusic').value = settings.music; $('#vSfx').value = settings.sfx;
    $('#vMusicV').textContent = settings.music; $('#vSfxV').textContent = settings.sfx;
    segSet('#sStyle', settings.style); segSet('#sAnim', settings.anim); segSet('#sHints', String(settings.hints)); segSet('#sVib', String(settings.vib));
    open('ovSet');
  }
  function segSet(id, v) { $$(id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); }
  $('#vMusic').oninput = e => { settings.music = +e.target.value; $('#vMusicV').textContent = settings.music; unlockAudio(); applyMusic(); saveSettings(); };
  $('#vSfx').oninput = e => { settings.sfx = +e.target.value; $('#vSfxV').textContent = settings.sfx; saveSettings(); };
  $('#vSfx').onchange = () => sfx.myturn();
  $('#sStyle').onclick = e => { const b = e.target.closest('button'); if (!b) return; settings.style = b.dataset.v; segSet('#sStyle', settings.style); saveSettings(); drawCover(); drawHelp(); if (S) render(); };
  $('#sAnim').onclick = e => { const b = e.target.closest('button'); if (!b) return; settings.anim = b.dataset.v; segSet('#sAnim', settings.anim); saveSettings(); };
  $('#sHints').onclick = e => { const b = e.target.closest('button'); if (!b) return; settings.hints = +b.dataset.v; segSet('#sHints', String(settings.hints)); saveSettings(); if (S) render(); };
  $('#sVib').onclick = e => { const b = e.target.closest('button'); if (!b) return; settings.vib = +b.dataset.v; segSet('#sVib', String(settings.vib)); saveSettings(); };

  function drawHelp() {
    $('#hWinP').textContent = C.winPoints; $('#hWinG').textContent = C.winGods;
    $('#helpGods').innerHTML = G.map((g, i) => `<tr><td><b>${esc(gName(i))}</b>${fam() ? `<small class="muted">（${g.name}）</small>` : `<small class="muted">　${g.title}</small>`}</td><td style="text-align:center">${g.value} 分</td><td>${g.itemName}</td></tr>`).join('');
    $('#helpActs').innerHTML = C.actions.map(a => `<li>${a.icon} <b>${a.name}</b>：${a.desc}</li>`).join('');
  }
  function drawCover() {
    const n = NG;
    $('#coverFan').innerHTML = G.map((g, i) => {
      const k = i - (n - 1) / 2, ang = k * 9, W = Math.min(window.innerWidth, 480);
      const dx = k * W * 0.125, dy = k * k * 7;
      return `<img src="${fam() ? `assets/images/c_${g.fam}.png` : `assets/images/${g.key}.jpg`}" alt="" style="transform:translate(${dx}px,${dy}px) rotate(${ang}deg);z-index:${10 - Math.abs(k)};${fam() ? 'object-fit:contain;background:radial-gradient(circle at 50% 40%,#4a3424,#1a120c);' : ''}" draggable="false">`;
    }).join('');
  }

  // ---------- 連線：共用 ----------
  // PeerJS（WebRTC），房主手機就是伺服器；JSON 序列化避免 iOS Safari 二進位相容問題；加 TURN 中繼讓行動網路也能連
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
    const ph = new URLSearchParams(location.search).get('peerhost');
    // openExternalBrowser=1：LINE 開啟時改用 Safari/Chrome（LINE 內建瀏覽器常連不上）
    return `${base}?room=${code}&openExternalBrowser=1` + (ph ? `&peerhost=${ph}` : '');
  }
  function netStatus(on, text) { const n = $('#netstat'); n.classList.toggle('on', on); if (text) n.textContent = text; }
  function peerSupported() {
    if (typeof Peer === 'undefined') return '連線元件載入失敗，請重新整理頁面。';
    if (!window.RTCPeerConnection) return '這個瀏覽器不支援手機連線。請改用 Safari（iPhone）或 Chrome（Android／電腦）開啟。';
    return null;
  }

  // ---------- 房主 ----------
  const host = {
    peer: null, code: null, seats: [], retries: 0,
    start(code, restore) {
      const bad = peerSupported(); if (bad) { alert(bad); return; }
      resetUI(); mode = 'host'; mySeat = 0; this.code = code;
      if (restore) { this.seats = restore.seats.map((s, i) => ({ name: s.name, cid: s.cid, conn: null, online: i === 0, last: 0 })); S = restore.S || null; }
      else { this.seats = [{ name: myName('房主'), cid, conn: null, online: true, last: 0 }]; S = null; }
      seatInfo = this.seatSummary();
      this.open();
      if (S) { show('game'); lastSeq = S.seq; afterChange(); netStatus(true, '正在重新開房，對手會自動連回來…'); }
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
          if (this.retries++ < 10) { netStatus(true, '房間代碼還被佔用，重試中…'); setTimeout(() => this.open(), 3000); }
          else alert('這個房間代碼一直被佔用，請回封面重新開房。');
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
        if (i === 0) { conn.send({ t: 'reject', msg: '這支手機就是房主，不能加入自己的房間。請用另一支手機掃描。' }); return; }
        if (i < 0) {
          if (S) { conn.send({ t: 'reject', msg: '這局已經開始了，等下一局再加入。' }); return; }
          if (this.seats.length >= C.maxPlayers) { conn.send({ t: 'reject', msg: '房間已滿（兩人對戰）。' }); return; }
          this.seats.push({ name: String(d.name || '玩家').slice(0, 8), cid: d.cid, conn, online: true, last: Date.now() });
          i = this.seats.length - 1;
          sfx.tap(); vibrate(40);
        } else {
          const s = this.seats[i];
          if (s.conn && s.conn !== conn) try { s.conn.close(); } catch (e) {}
          s.conn = conn; s.online = true; s.last = Date.now();
          if (!S && d.name) s.name = String(d.name).slice(0, 8);
          if (S) toast(`${esc(s.name)} 回來了`);
        }
        this.save();
        if (S) { this.broadcast(); render(); } else this.broadcastLobby();
        return;
      }
      const i = this.seatOf(conn); if (i < 0) return;
      this.seats[i].last = Date.now();
      if (!this.seats[i].online) { this.seats[i].online = true; this.broadcastSeats(); if (S) render(); }
      if (d.t === 'ping') { try { conn.send({ t: 'pong' }); } catch (e) {} return; }
      if (d.t === 'act' && S) {
        const err = E.validate(S, i, d.m);
        if (err) { try { conn.send({ t: 'err', msg: err }); conn.send(this.stateMsg(i)); } catch (e) {} return; }
        E.apply(S, i, d.m);
        this.broadcast(); this.save();
        afterChange();
      }
    },
    onClose(conn) {
      const i = this.seatOf(conn); if (i < 0) return;
      const s = this.seats[i]; s.conn = null; s.online = false;
      if (S) { toast(`${esc(s.name)} 斷線了，等對方重新打開連結`); this.broadcastSeats(); render(); }
      else { this.seats.splice(i, 1); this.broadcastLobby(); }
      this.save();
    },
    seatSummary() { return this.seats.map(s => ({ name: s.name, online: s.online })); },
    stateMsg(i) { return { t: 'state', S: E.view(S, i), you: i, seats: this.seatSummary() }; },
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
      $('#lobbyMsg').textContent = ok ? '對手到了，按「開始遊戲」' : '等待對手加入…';
    },
    startGame() {
      resetUI();
      S = E.newGame(this.seats.map(s => s.name));
      this.broadcast(); this.save();
      show('game'); toast(`${esc(nameOf(S.start))} 先手`); afterChange();
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

  function drawPlayers(list, mine) {
    $('#pcount').textContent = `${list.length}/${C.maxPlayers}`;
    $('#plist').innerHTML = list.map((s, i) => `<li><span class="dot ${s.online ? '' : 'off'}"></span>${esc(s.name)}${i === 0 ? '（房主）' : ''}${i === mine ? '　← 你' : ''}</li>`).join('');
  }
  function drawQR(text) {
    try { const qr = qrcode(0, 'M'); qr.addData(text); qr.make(); $('#qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); }
    catch (e) { $('#qr').textContent = text; }
  }
  $('#bCopy').onclick = async () => {
    const link = inviteLink(host.code);
    try { if (navigator.share) { await navigator.share({ title: '奧林帕斯的獻祭', text: `一起來玩奧林帕斯的獻祭，房間代碼 ${host.code}`, url: link }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(link); toast('已複製邀請連結'); return; } catch (e) {}
    try { const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('已複製邀請連結'); }
    catch (e) { prompt('複製這個連結傳給對手：', link); }
  };
  $('#bStart').onclick = () => { if (mode === 'host') host.startGame(); };
  $('#bHost').onclick = () => { unlockAudio(); host.start(makeCode()); };

  // ---------- 加入的人 ----------
  const net = {
    peer: null, conn: null, code: null, lastMsg: 0, timer: 0, connecting: false, fails: 0, everOpen: false,
    join(code) {
      const bad = peerSupported(); if (bad) { alert(bad); return; }
      resetUI(); mode = 'guest'; S = null; this.code = code; this.fails = 0; this.everOpen = false;
      show('lobby');
      $('#lobbyHost').style.display = 'none'; $('#lobbyGuest').style.display = '';
      $('#guestCode').textContent = code; $('#bStart').style.display = 'none';
      $('#plist').innerHTML = ''; $('#pcount').textContent = ''; $('#lobbyMsg').textContent = '連線中…';
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
          if (!this.everOpen && this.fails >= 3) $('#lobbyMsg').innerHTML = `找不到房間 <b>${esc(this.code)}</b>。請確認代碼，並請房主保持畫面開著（螢幕不要關）。仍會繼續嘗試…`;
          netStatus(!!S, '找不到房主，正在重新連線…（請房主打開畫面）');
        } else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type)) {
          netStatus(!!S, '網路不穩，重新連線中…');
          if (!S) $('#lobbyMsg').textContent = '連不上配對伺服器，重試中…（請確認手機有網路）';
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
      const to = setTimeout(() => {
        if (this.conn === conn && !conn.open) {
          this.connecting = false; try { conn.close(); } catch (e) {} this.fails++;
          if (!this.everOpen && this.fails >= 2) $('#lobbyMsg').innerHTML = '連線比較慢，還在嘗試…<br><small>如果一直連不上：兩支手機都換成 Wi-Fi 或都用行動網路再試；LINE 裡打開的請改用 Safari／Chrome。</small>';
        }
      }, 12000);
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
      if (d.t === 'reject') { alert(d.msg); this.leave(); mode = null; show('cover'); return; }
      if (d.t === 'err') { toast(esc(d.msg)); sfx.err(); return; }
      if (d.t === 'lobby') {
        mySeat = d.you; seatInfo = d.seats; S = null;
        show('lobby'); $('#lobbyHost').style.display = 'none'; $('#lobbyGuest').style.display = '';
        $('#bStart').style.display = 'none';
        drawPlayers(d.seats, d.you); $('#lobbyMsg').textContent = '等房主開始遊戲…';
        store.set('lastRoom', { code: this.code, ts: Date.now() });
        return;
      }
      if (d.t === 'seats') { seatInfo = d.seats; if (S) render(); return; }
      if (d.t === 'state') {
        mySeat = d.you; seatInfo = d.seats || seatInfo;
        const fresh = !S || !$('#game').classList.contains('on') || (d.S.round === 1 && d.S.seq === 0 && (S.seq !== 0 || S.round !== 1));
        S = d.S;
        if (fresh) {
          resetUI(); show('game');
          if (S.seq === 0) toast(`${esc(nameOf(S.start))} 先手`); else lastSeq = S.seq;
        }
        afterChange();
        store.set('lastRoom', { code: this.code, ts: Date.now() });
      }
    },
    leave() { clearInterval(this.timer); try { this.conn && this.conn.close(); } catch (e) {} try { this.peer && this.peer.destroy(); } catch (e) {} this.peer = null; this.conn = null; },
  };

  $('#bJoin').onclick = () => { $('#joinCode').value = ''; $('#joinName').value = myName(''); open('ovJoin'); setTimeout(() => $('#joinCode').focus(), 50); };
  $('#joinName').addEventListener('input', e => { nameInput.value = e.target.value; store.set('name', e.target.value.trim()); });
  $('#bJoinGo').onclick = () => {
    const code = $('#joinCode').value.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (code.length !== C.roomCodeLength) { toast(`代碼是 ${C.roomCodeLength} 個英文字母`); return; }
    if (!myName('')) { toast('請先輸入你的名字'); $('#joinName').focus(); return; }
    close('ovJoin'); unlockAudio(); net.join(code);
  };
  $('#joinCode').addEventListener('keydown', e => { if (e.key === 'Enter') $('#bJoinGo').click(); });
  $('#bLeaveLobby').onclick = () => quitGame(true);

  function quitGame(clear) {
    clearTimeout(aiTimer);
    $$('.overlay').forEach(o => o.classList.remove('on'));
    if (mode === 'host') { try { host.peer && host.peer.destroy(); } catch (e) {} host.peer = null; if (clear) store.del('save'); }
    if (mode === 'guest') { net.leave(); store.del('lastRoom'); }
    if ((mode === 'ai' || mode === 'local') && clear) store.del('save');
    mode = null; S = null; sel = null; netStatus(false);
    show('cover'); refreshResume();
  }

  // ---------- 恢復 ----------
  function refreshResume() {
    const sv = store.get('save', null), b = $('#bResume');
    if (sv && Date.now() - sv.ts < 12 * 3600 * 1000 && (sv.S || sv.mode === 'host') && !(sv.S && sv.S.phase === 'over')) {
      b.style.display = '';
      b.textContent = sv.mode === 'host' ? `恢復上次的房間（代碼 ${sv.code}）` : (sv.mode === 'ai' ? '繼續上次和電腦的那一局' : '繼續上次同機的那一局');
    } else b.style.display = 'none';
  }
  $('#bResume').onclick = () => {
    const sv = store.get('save', null); if (!sv) return;
    unlockAudio();
    if (sv.mode === 'host') { host.start(sv.code, sv); return; }
    resetUI(); mode = sv.mode; S = sv.S; viewer = sv.viewer || 0; seatInfo = [];
    show('game'); keepAwake(); lastSeq = S.seq; lastRoundShown = null;
    if (mode === 'local') { const a = actor(S); if (a != null) { askPass(a); return; } }
    afterChange();
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
    if (app) { const w = $('#inappWarn'); w.style.display = ''; w.textContent = `你現在是在 ${app} 裡面開啟。如果連不上或沒有聲音，請點右上角選單，選「用瀏覽器開啟」（iPhone 用 Safari、Android 用 Chrome）。`; }
  })();

  // ---------- 啟動 ----------
  drawCover(); drawHelp(); refreshResume();
  // 預先載入圖片，避免第一次出牌時空白
  setTimeout(() => { G.forEach(g => [`${g.key}_s.jpg`, `${g.item}_s.jpg`, `${g.key}.jpg`, `c_${g.fam}.png`].forEach(f => { const im = new Image(); im.src = 'assets/images/' + f; })); }, 300);
  const q = new URLSearchParams(location.search);
  const room = (q.get('room') || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (room) {
    $('#joinCode').value = room; $('#joinName').value = myName('');
    const lr = store.get('lastRoom', null);
    if (lr && lr.code === room && Date.now() - lr.ts < 12 * 3600 * 1000 && myName('')) setTimeout(() => net.join(room), 0); // 重新整理或斷線後直接回座位
    else { open('ovJoin'); if (!myName('')) setTimeout(() => $('#joinName').focus(), 100); }
  }

  // 測試用
  window.__olys = { get busy() { return anim.active; }, get S() { return S; }, get mode() { return mode; }, doMove, host, net, get viewer() { return viewer; } };
})();
