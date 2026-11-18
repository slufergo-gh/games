// 奧林帕斯的獻祭 規則引擎（純資料，介面和連線都透過這裡改變狀態）
(function () {
  'use strict';
  const C = window.CONFIG;
  const NG = C.gods.length;
  const NA = C.actions.length;
  const ACT = {}; C.actions.forEach((a, i) => ACT[a.key] = i);
  const HIDDEN = -1;

  function shuffle(a, rnd = Math.random) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function fullDeck() { const d = []; C.gods.forEach((g, i) => { for (let k = 0; k < g.value; k++) d.push(i); }); return d; }
  const clone = o => JSON.parse(JSON.stringify(o));

  function newGame(names, first) {
    const S = {
      names: names.slice(0, 2), round: 0, start: first == null ? (Math.random() < 0.5 ? 0 : 1) : first,
      favor: new Array(NG).fill(null), seq: 0, log: [], winner: null, ev: null,
    };
    newRound(S);
    return S;
  }

  function newRound(S) {
    S.round++;
    if (S.round > 1) S.start = 1 - S.start;
    const deck = shuffle(fullDeck());
    S.removed = deck.splice(0, C.removedPerRound);
    S.hands = [deck.splice(0, C.handSize), deck.splice(0, C.handSize)];
    S.deck = deck;
    S.used = [new Array(NA).fill(false), new Array(NA).fill(false)];
    S.secret = [null, null];
    S.burned = [[], []];
    S.offer = [new Array(NG).fill(0), new Array(NG).fill(0)];
    S.pending = null; S.result = null;
    S.turn = S.start;
    S.phase = 'act';
    draw(S, S.turn);
    sortHand(S.hands[0]); sortHand(S.hands[1]);
    S.log.push({ r: S.round, t: `第 ${S.round} 回合開始，${S.names[S.start]} 先手` });
  }
  function sortHand(h) { h.sort((a, b) => a - b); }
  function draw(S, p) { if (S.deck.length) { S.hands[p].push(S.deck.pop()); sortHand(S.hands[p]); S.drawn = p; } }

  // 從手牌拿掉指定的牌（cards 是神的編號，可重複），回傳是否成功
  function takeFrom(hand, cards) {
    const h = hand.slice();
    for (const c of cards) { const i = h.indexOf(c); if (i < 0) return null; h.splice(i, 1); }
    return h;
  }

  // 驗證：回傳錯誤字串，沒問題回傳 null
  function validate(S, p, m) {
    if (!m || typeof m !== 'object') return '動作格式錯誤';
    if (S.phase === 'over') return '遊戲已經結束';
    if (m.type === 'next') return S.phase === 'roundEnd' ? null : '還不能進入下一回合';
    if (m.type === 'act') {
      if (S.phase !== 'act') return S.phase === 'respond' ? '要先等對手挑選' : '現在不能行動';
      if (S.turn !== p) return '還沒輪到你';
      const a = ACT[m.action]; if (a == null) return '沒有這個行動';
      if (S.used[p][a]) return '這個行動這回合已經用過了';
      const need = C.actions[a].cards;
      let cards = m.cards;
      if (m.action === 'tables') {
        if (!Array.isArray(m.groups) || m.groups.length !== 2 || m.groups.some(g => !Array.isArray(g) || g.length !== need / 2)) return '要分成兩份，每份兩張';
        cards = m.groups[0].concat(m.groups[1]);
      }
      if (!Array.isArray(cards) || cards.length !== need) return `要選 ${need} 張祭品`;
      if (cards.some(c => !Number.isInteger(c) || c < 0 || c >= NG)) return '卡牌錯誤';
      if (!takeFrom(S.hands[p], cards)) return '手上沒有這些祭品';
      return null;
    }
    if (m.type === 'respond') {
      if (S.phase !== 'respond' || !S.pending) return '現在不用挑選';
      if (p !== 1 - S.pending.from) return '要等對手挑選';
      const n = S.pending.type === 'oracle' ? S.pending.cards.length : 2;
      if (!Number.isInteger(m.pick) || m.pick < 0 || m.pick >= n) return '請選一個';
      return null;
    }
    return '不認得的動作';
  }

  function apply(S, p, m) {
    S.seq++;
    const N = S.names;
    if (m.type === 'next') { newRound(S); S.ev = { type: 'round' }; return; }
    if (m.type === 'act') {
      const a = ACT[m.action];
      const cards = m.action === 'tables' ? m.groups[0].concat(m.groups[1]) : m.cards;
      S.hands[p] = takeFrom(S.hands[p], cards);
      S.used[p][a] = true;
      const nm = C.actions[a].name;
      if (m.action === 'secret') {
        S.secret[p] = cards[0];
        S.log.push({ r: S.round, p, t: `${N[p]} 使用「${nm}」，蓋了一張祭品` });
        S.ev = { type: 'secret', p };
        endTurn(S);
      } else if (m.action === 'burn') {
        S.burned[p] = cards.slice();
        S.log.push({ r: S.round, p, t: `${N[p]} 使用「${nm}」，焚燒了兩張祭品` });
        S.ev = { type: 'burn', p };
        endTurn(S);
      } else if (m.action === 'oracle') {
        S.pending = { type: 'oracle', from: p, cards: cards.slice() };
        S.phase = 'respond';
        S.log.push({ r: S.round, p, t: `${N[p]} 使用「${nm}」：${cards.map(c => C.gods[c].itemName).join('、')}` });
        S.ev = { type: 'offer', p, kind: 'oracle' };
      } else {
        S.pending = { type: 'tables', from: p, groups: [m.groups[0].slice(), m.groups[1].slice()] };
        S.phase = 'respond';
        S.log.push({ r: S.round, p, t: `${N[p]} 使用「${nm}」：${m.groups.map(g => g.map(c => C.gods[c].itemName).join('＋')).join(' ／ ')}` });
        S.ev = { type: 'offer', p, kind: 'tables' };
      }
      return;
    }
    if (m.type === 'respond') {
      const P = S.pending, from = P.from;
      let mine, theirs;
      if (P.type === 'oracle') { mine = [P.cards[m.pick]]; theirs = P.cards.filter((_, i) => i !== m.pick); }
      else { mine = P.groups[m.pick]; theirs = P.groups[1 - m.pick]; }
      mine.forEach(c => S.offer[p][c]++);
      theirs.forEach(c => S.offer[from][c]++);
      S.log.push({ r: S.round, p, t: `${N[p]} 挑了 ${mine.map(c => C.gods[c].itemName).join('＋')}，${N[from]} 得到 ${theirs.map(c => C.gods[c].itemName).join('＋')}` });
      S.ev = { type: 'picked', p, from, kind: P.type, pick: m.pick, mine: mine.slice(), theirs: theirs.slice() };
      S.pending = null;
      endTurn(S);
    }
  }

  function endTurn(S) {
    if (S.used.every(u => u.every(Boolean))) { endRound(S); return; }
    S.turn = 1 - S.turn;
    S.phase = 'act';
    draw(S, S.turn);
  }

  function score(favor) {
    const pts = [0, 0], cnt = [0, 0];
    favor.forEach((f, g) => { if (f != null) { pts[f] += C.gods[g].value; cnt[f]++; } });
    return { pts, cnt };
  }

  function endRound(S) {
    const before = S.favor.slice();
    for (let p = 0; p < 2; p++) if (S.secret[p] != null) S.offer[p][S.secret[p]]++;
    for (let g = 0; g < NG; g++) {
      if (S.offer[0][g] > S.offer[1][g]) S.favor[g] = 0;
      else if (S.offer[1][g] > S.offer[0][g]) S.favor[g] = 1;
    }
    const sc = score(S.favor);
    let w = null, why = '';
    for (let p = 0; p < 2; p++) if (sc.pts[p] >= C.winPoints) { w = p; why = 'points'; }
    if (w == null) for (let p = 0; p < 2; p++) if (sc.cnt[p] >= C.winGods) { w = p; why = 'gods'; }
    S.result = { round: S.round, before, after: S.favor.slice(), offer: clone(S.offer), secret: S.secret.slice(), burned: clone(S.burned), removed: S.removed.slice(), pts: sc.pts, cnt: sc.cnt, winner: w, why };
    S.turn = null;
    S.ev = { type: 'roundEnd' };
    if (w != null) {
      S.winner = w; S.phase = 'over';
      S.log.push({ r: S.round, t: `${S.names[w]} 獲勝！（${sc.pts[w]} 分、${sc.cnt[w]} 位神）` });
    } else {
      S.phase = 'roundEnd';
      S.log.push({ r: S.round, t: `第 ${S.round} 回合結束：${S.names[0]} ${sc.pts[0]} 分／${sc.cnt[0]} 位神，${S.names[1]} ${sc.pts[1]} 分／${sc.cnt[1]} 位神` });
    }
  }

  // 給某位玩家看的狀態（藏起對手手牌、對手的秘密與焚燒、牌庫）
  function view(S, p) {
    const V = clone(S), o = 1 - p;
    const reveal = S.phase === 'roundEnd' || S.phase === 'over';
    V.hands[o] = S.hands[o].map(() => HIDDEN);
    V.deck = S.deck.map(() => HIDDEN);
    if (!reveal) {
      V.removed = S.removed.map(() => HIDDEN);
      if (V.secret[o] != null) V.secret[o] = HIDDEN;
      V.burned[o] = S.burned[o].map(() => HIDDEN);
    }
    V.viewer = p;
    return V;
  }

  // ---------------- 電腦對手（蒙地卡羅模擬） ----------------
  // 小型快速模擬器：只模擬到這回合結束
  function combos(arr, k) { // 回傳不重複（以數值多重集合）的組合
    const out = [], seen = new Set(), a = arr.slice().sort((x, y) => x - y);
    (function rec(start, cur) {
      if (cur.length === k) { const key = cur.join(','); if (!seen.has(key)) { seen.add(key); out.push(cur.slice()); } return; }
      for (let i = start; i < a.length; i++) { cur.push(a[i]); rec(i + 1, cur); cur.pop(); }
    })(0, []);
    return out;
  }
  function candidates(hand, used) {
    const out = [];
    C.actions.forEach((A, a) => {
      if (used[a]) return;
      if (A.cards > hand.length) return;
      const cs = combos(hand, A.cards);
      if (A.key === 'tables') {
        const seen = new Set();
        cs.forEach(c => {
          [[[c[0], c[1]], [c[2], c[3]]], [[c[0], c[2]], [c[1], c[3]]], [[c[0], c[3]], [c[1], c[2]]]].forEach(gs => {
            const k = gs.map(g => g.slice().sort().join('')).sort().join('|');
            if (!seen.has(k)) { seen.add(k); out.push({ type: 'act', action: 'tables', groups: gs }); }
          });
        });
      } else cs.forEach(c => out.push({ type: 'act', action: A.key, cards: c }));
    });
    return out;
  }
  function randPick(a, rnd) { return a[Math.floor(rnd() * a.length)]; }
  // 模擬策略：帶一點常識的隨機（秘密留重要的牌、焚燒沒用的牌、分配時隨機）
  function cardWorth(sim, p, c) { // 這張牌對 p 有多重要
    const g = C.gods[c], diff = sim.offer[p][c] - sim.offer[1 - p][c];
    const owned = sim.hands[p].filter(x => x === c).length;
    let w = g.value;
    if (diff + owned > g.value / 2 + 1) w *= 0.4;      // 已經穩了
    if (sim.favor[c] === p) w *= 0.85;
    return w + Math.random() * 1.5;
  }
  function rollPolicyAct(sim, p, rnd) {
    const free = []; sim.used[p].forEach((u, a) => { if (!u) free.push(a); });
    const a = randPick(free, rnd), A = C.actions[a];
    const h = sim.hands[p].slice();
    if (A.key === 'secret' || A.key === 'burn') {
      h.sort((x, y) => cardWorth(sim, p, y) - cardWorth(sim, p, x));
      return { type: 'act', action: A.key, cards: A.key === 'secret' ? [h[0]] : h.slice(-2) };
    }
    shuffle(h, rnd); const cards = h.slice(0, A.cards);
    if (A.key === 'tables') return { type: 'act', action: 'tables', groups: [[cards[0], cards[1]], [cards[2], cards[3]]] };
    return { type: 'act', action: A.key, cards };
  }
  function rollPolicyRespond(sim, p) { // 挑「對自己最有利」的那份（貪心）
    const P = sim.pending; let best = 0, bv = -1e9;
    const n = P.type === 'oracle' ? P.cards.length : 2;
    for (let i = 0; i < n; i++) {
      const mine = P.type === 'oracle' ? [P.cards[i]] : P.groups[i];
      let v = 0; mine.forEach(c => { v += C.gods[c].value * (sim.offer[p][c] <= sim.offer[1 - p][c] + 1 ? 1.2 : 0.4); });
      const theirs = P.type === 'oracle' ? P.cards.filter((_, j) => j !== i) : P.groups[1 - i];
      theirs.forEach(c => { v -= C.gods[c].value * (sim.offer[1 - p][c] <= sim.offer[p][c] + 1 ? 1.0 : 0.3); });
      if (v > bv) { bv = v; best = i; }
    }
    return { type: 'respond', pick: best };
  }
  function evalEnd(sim, me) {
    const r = sim.result; if (!r) return 0;
    if (r.winner === me) return 100;
    if (r.winner === 1 - me) return -100;
    return (r.pts[me] - r.pts[1 - me]) * 2 + (r.cnt[me] - r.cnt[1 - me]) * 3;
  }
  function simulate(sim, me, rnd) {
    let guard = 0;
    while (sim.phase === 'act' || sim.phase === 'respond') {
      if (guard++ > 40) break;
      if (sim.phase === 'respond') apply(sim, 1 - sim.pending.from, rollPolicyRespond(sim, 1 - sim.pending.from));
      else apply(sim, sim.turn, rollPolicyAct(sim, sim.turn, rnd));
    }
    return evalEnd(sim, me);
  }
  // 依照 AI 看得到的資訊，隨機補上看不到的牌
  function determinize(S, me, rnd) {
    const o = 1 - me, sim = {
      names: S.names, round: S.round, start: S.start, favor: S.favor.slice(), seq: 0, log: [], winner: null,
      hands: [S.hands[0].slice(), S.hands[1].slice()], deck: [], removed: [], used: [S.used[0].slice(), S.used[1].slice()],
      secret: S.secret.slice(), burned: [S.burned[0].slice(), S.burned[1].slice()], offer: [S.offer[0].slice(), S.offer[1].slice()],
      pending: S.pending ? clone(S.pending) : null, turn: S.turn, phase: S.phase, result: null,
    };
    // 已知：自己手牌、自己秘密、自己焚燒、雙方獻上、等待挑選中的牌
    const pool = fullDeck();
    const rm = c => { const i = pool.indexOf(c); if (i >= 0) pool.splice(i, 1); };
    S.hands[me].forEach(rm);
    if (S.secret[me] != null) rm(S.secret[me]);
    S.burned[me].forEach(rm);
    for (let p = 0; p < 2; p++) S.offer[p].forEach((n, g) => { for (let k = 0; k < n; k++) rm(g); });
    if (S.pending) (S.pending.type === 'oracle' ? S.pending.cards : S.pending.groups.flat()).forEach(rm);
    shuffle(pool, rnd);
    sim.hands[o] = pool.splice(0, S.hands[o].length);
    if (S.secret[o] != null) sim.secret[o] = pool.pop();
    sim.burned[o] = pool.splice(0, S.burned[o].length);
    sim.deck = pool.splice(0, S.deck.length);
    sim.removed = pool;
    return sim;
  }
  function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // 回傳電腦要做的動作（me＝電腦的座位）
  function aiMove(S, me, level) {
    const samples = (C.ai[level] || C.ai.normal).samples;
    const rnd = mulberry((Math.random() * 1e9) | 0);
    let cands;
    if (S.phase === 'respond') {
      const n = S.pending.type === 'oracle' ? S.pending.cards.length : 2;
      cands = []; for (let i = 0; i < n; i++) cands.push({ type: 'respond', pick: i });
    } else cands = candidates(S.hands[me], S.used[me]);
    if (cands.length === 1) return cands[0];
    if (samples <= 0) return randPick(cands, rnd);
    let best = cands[0], bv = -1e9;
    for (const m of cands) {
      let tot = 0;
      for (let k = 0; k < samples; k++) {
        const sim = determinize(S, me, rnd);
        apply(sim, me, m);
        tot += simulate(sim, me, rnd);
      }
      const v = tot / samples + rnd() * 0.01;
      if (v > bv) { bv = v; best = m; }
    }
    return best;
  }

  window.Engine = { newGame, validate, apply, view, score, aiMove, HIDDEN, ACT, clone };
})();
