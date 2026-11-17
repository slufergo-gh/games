/* ===== 電腦 AI：蒙地卡羅樹搜尋（MCTS + RAVE + 先驗知識）=====
 * 依賴 GoEngine（engine.js）
 */
(function (root) {
  const G = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : root.GoEngine;
  const { EMPTY, BLACK, WHITE, EDGE, PASS } = G;

  const DEFAULTS = { raveK: 800, explore: 0.12, priorN: 12, komi: 7, maxPlayoutFactor: 3 };

  function rnd(n) { return (Math.random() * n) | 0; }

  // 下在 p 之後自己那塊會不會只剩一口氣（且沒有提子）。回傳該塊大小，0 = 不是自緊一氣
  function selfAtariSize(bd, p, c) {
    const o = 3 - c; let empties = 0;
    for (let k = 0; k < 4; k++) if (bd.b[p + bd.dirs[k]] === EMPTY) empties++;
    if (empties >= 2) return 0;
    for (let k = 0; k < 4; k++) {
      const r = p + bd.dirs[k];
      if (bd.b[r] === o && bd.libs(r, 2) === 1) return 0; // 會提子
    }
    bd.b[p] = c;
    const l = bd.libs(p, 2);
    let size = 0;
    if (l <= 1) size = bd.group(p).stones.length;
    bd.b[p] = EMPTY;
    return size;
  }

  // 模擬用的走法：先處理最後一手造成的叫吃，否則隨機
  function playoutMove(bd) {
    const c = bd.toPlay, o = 3 - c, lm = bd.lastMove;
    if (lm !== PASS && lm >= 0 && Math.random() < 0.92) {
      // 1. 對方最後一手那塊只剩一氣 → 提掉
      if (bd.b[lm] === o && bd.libs(lm, 2) === 1) { const L = bd._lastLib; if (bd.isLegal(L, c)) return L; }
      // 2. 最後一手旁邊自己的棋被叫吃 → 逃或提對方
      for (let k = 0; k < 4; k++) {
        const r = lm + bd.dirs[k];
        if (bd.b[r] === c && bd.libs(r, 2) === 1) {
          const L = bd._lastLib;
          // 先看能不能提掉包圍它的對方棋
          const g = bd.group(r);
          for (const s of g.stones) for (let j = 0; j < 4; j++) {
            const q = s + bd.dirs[j];
            if (bd.b[q] === o && bd.libs(q, 2) === 1) { const L2 = bd._lastLib; if (bd.isLegal(L2, c)) return L2; }
          }
          if (bd.isLegal(L, c) && !selfAtariSize(bd, L, c)) return L;
        }
      }
    }
    // 隨機（略過自己的眼、略過大塊自緊一氣）
    const pts = bd.points, n = pts.length; let start = rnd(n);
    for (let i = 0; i < n; i++) {
      const p = pts[(start + i) % n];
      if (bd.b[p] !== EMPTY || p === bd.ko) continue;
      if (bd.isEyeish(p, c)) continue;
      if (!bd.isLegal(p, c)) continue;
      const sa = selfAtariSize(bd, p, c);
      if (sa >= 2 && Math.random() < 0.95) continue;
      if (sa === 1 && Math.random() < 0.5) continue;
      return p;
    }
    return PASS;
  }

  // 終局數子（模擬結束時：子 + 只被一色包圍的空點）
  function finalOwner(bd, out) {
    let s = 0;
    for (const p of bd.points) {
      const v = bd.b[p];
      if (v === BLACK) { out[p] = 1; s++; }
      else if (v === WHITE) { out[p] = 2; s--; }
      else {
        let t = 0;
        for (let k = 0; k < 4; k++) { const w = bd.b[p + bd.dirs[k]]; if (w === BLACK) t |= 1; else if (w === WHITE) t |= 2; }
        out[p] = t === 1 ? 1 : t === 2 ? 2 : 0; s += t === 1 ? 1 : t === 2 ? -1 : 0;
      }
    }
    return s;
  }

  function simulate(bd, movesOut, colorsOut) {
    const maxMoves = bd.n * bd.n * DEFAULTS.maxPlayoutFactor;
    let passes = 0;
    for (let i = 0; i < maxMoves; i++) {
      const c = bd.toPlay, m = playoutMove(bd);
      if (m === PASS) { passes++; bd.play(PASS); if (passes >= 2) break; continue; }
      passes = 0; bd.play(m);
      if (movesOut) { movesOut.push(m); colorsOut.push(c); }
    }
  }

  // 先驗：給每個候選手一個「看起來好不好」的初始勝率
  function priorOf(bd, p, c) {
    const o = 3 - c, n = bd.n;
    let pr = 0.5;
    const [x, y] = bd.xy(p);
    const line = Math.min(x, y, n - 1 - x, n - 1 - y) + 1;
    const early = bd.moveNum < n * 1.2;
    // 提子 / 逃子
    for (let k = 0; k < 4; k++) {
      const r = p + bd.dirs[k];
      if (bd.b[r] === o && bd.libs(r, 2) === 1) pr = Math.max(pr, 0.8 + Math.min(0.15, bd.group(r).stones.length * 0.03));
      else if (bd.b[r] === c && bd.libs(r, 2) === 1) {
        let empt = 0; for (let j = 0; j < 4; j++) if (bd.b[p + bd.dirs[j]] === EMPTY) empt++;
        if (empt >= 2) pr = Math.max(pr, 0.72);
      }
    }
    const sa = selfAtariSize(bd, p, c);
    if (sa >= 2) pr = Math.min(pr, 0.12); else if (sa === 1) pr = Math.min(pr, 0.35);
    if (pr === 0.5) {
      if (line === 1) pr = early ? 0.2 : 0.4;
      else if (line === 2 && early) pr = 0.4;
      else if ((line === 3 || line === 4) && early) pr = 0.6;
      // 靠近最後一手
      const lm = bd.lastMove;
      if (lm >= 0) { const [lx, ly] = bd.xy(lm); if (Math.abs(lx - x) + Math.abs(ly - y) <= 2) pr += 0.06; }
    }
    return pr;
  }

  class Node {
    constructor(move, color, parent) {
      this.move = move; this.color = color; this.parent = parent;
      this.N = 0; this.Wn = 0; this.rN = 0; this.rW = 0; this.children = null; this.own = null;
    }
  }

  class MCTS {
    constructor(board, opts) {
      this.opts = Object.assign({}, DEFAULTS, opts || {});
      this.board = board.clone();
      this.root = new Node(PASS, 3 - board.toPlay, null);
      this.playouts = 0;
      const L = board.len;
      this.rootOwn = new Float32Array(L);
      this.firstColor = new Int8Array(L);
      this.ownTmp = new Int8Array(L);
    }
    expand(node, bd) {
      const c = bd.toPlay; node.children = [];
      const N0 = this.opts.priorN;
      for (const p of bd.points) {
        if (bd.b[p] !== EMPTY || !bd.isLegal(p, c)) continue;
        if (bd.isEyeish(p, c)) continue;
        const ch = new Node(p, c, node);
        const pr = priorOf(bd, p, c);
        ch.N = N0; ch.Wn = N0 * pr; ch.prior = pr;
        node.children.push(ch);
      }
    }
    select(node) {
      const K = this.opts.raveK, C = this.opts.explore, lnN = Math.log(node.N + 1);
      let best = null, bv = -1e9;
      for (const ch of node.children) {
        const q = ch.Wn / ch.N;
        const beta = Math.sqrt(K / (3 * ch.N + K));
        const r = ch.rN > 0 ? ch.rW / ch.rN : q;
        const v = (1 - beta) * q + beta * r + C * Math.sqrt(lnN / ch.N);
        if (v > bv) { bv = v; best = ch; }
      }
      return best;
    }
    iterate() {
      const bd = this.board.clone();
      let node = this.root; const path = [node], moves = [], colors = [];
      // 選擇
      while (node.children && node.children.length) {
        const ch = this.select(node);
        moves.push(ch.move); colors.push(bd.toPlay);
        bd.play(ch.move); node = ch; path.push(node);
      }
      // 擴展（拜訪過一定次數才展開）
      if (!node.children && (node === this.root || node.N >= this.opts.priorN + 1)) {
        this.expand(node, bd);
        if (node.children.length) {
          const ch = this.select(node);
          moves.push(ch.move); colors.push(bd.toPlay);
          bd.play(ch.move); node = ch; path.push(node);
        }
      }
      const treeLen = moves.length;
      simulate(bd, moves, colors);
      const own = this.ownTmp;
      const s = finalOwner(bd, own) - this.opts.komi;
      const winner = s > 0 ? BLACK : WHITE;
      // 地盤統計
      const ro = this.rootOwn;
      for (const p of bd.points) ro[p] += own[p] === 1 ? 1 : own[p] === 2 ? -1 : 0;
      if (path.length > 1) {
        const c1 = path[1];
        if (!c1.own) { c1.own = new Float32Array(bd.len); c1.ownN = 0; }
        for (const p of bd.points) c1.own[p] += own[p] === 1 ? 1 : own[p] === 2 ? -1 : 0;
        c1.ownN++; c1.scoreSum = (c1.scoreSum || 0) + s;
      }
      this.scoreSum = (this.scoreSum || 0) + s;
      // 反向更新（含 AMAF）
      const fc = this.firstColor; fc.fill(0);
      for (let i = moves.length - 1; i >= treeLen; i--) fc[moves[i]] = colors[i];
      for (let d = path.length - 1; d >= 0; d--) {
        const nd = path[d];
        nd.N++; if (nd.color === winner) nd.Wn++;
        if (d < treeLen) fc[moves[d]] = colors[d];
        if (nd.children) {
          for (const ch of nd.children) {
            if (fc[ch.move] === ch.color) { ch.rN++; if (ch.color === winner) ch.rW++; }
          }
        }
      }
      this.playouts++;
    }
    run(ms, maxPlayouts) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms && this.playouts < maxPlayouts) {
        for (let i = 0; i < 20 && this.playouts < maxPlayouts; i++) this.iterate();
      }
      return this.playouts >= maxPlayouts;
    }
    // 結果：候選手依拜訪次數排序；勝率皆以「輪到下的一方」計
    result() {
      const kids = (this.root.children || []).slice().sort((a, b) => b.N - a.N);
      const N0 = this.opts.priorN;
      const total = Math.max(1, this.playouts);
      const ownership = new Float32Array(this.board.len);
      for (const p of this.board.points) ownership[p] = this.rootOwn[p] / total;
      const cand = kids.map(ch => ({
        move: ch.move, visits: ch.N - N0,
        winrate: ch.N > N0 ? (ch.Wn - N0 * ch.prior) / (ch.N - N0) : ch.prior,
        own: ch.own ? Array.from(ch.own, v => v / ch.ownN) : null,
        score: ch.ownN ? ch.scoreSum / ch.ownN : null
      }));
      const rootWin = cand.length ? cand[0].winrate : 0.5;
      return { candidates: cand, best: cand.length ? cand[0].move : PASS, winrate: rootWin, ownership, score: this.scoreSum / total, playouts: this.playouts, toPlay: this.board.toPlay };
    }
  }

  // 非同步搜尋（分段執行，不卡畫面）
  function searchAsync(board, o, onDone, onProgress) {
    const m = new MCTS(board, { komi: o.komi });
    const t0 = Date.now(); let cancelled = false;
    function step() {
      if (cancelled) return;
      const done = m.run(25, o.maxPlayouts);
      if (onProgress) onProgress(Math.min(1, Math.max((Date.now() - t0) / o.timeMs, m.playouts / o.maxPlayouts)));
      if (done || Date.now() - t0 >= o.timeMs) onDone(m.result(), m);
      else setTimeout(step, 0);
    }
    setTimeout(step, 0);
    return { cancel() { cancelled = true; } };
  }

  // 只用隨機模擬估計每點歸屬（終局判斷死子用）
  function estimateOwnership(board, playouts, komi) {
    const sum = new Float32Array(board.len), tmp = new Int8Array(board.len);
    for (let i = 0; i < playouts; i++) {
      const bd = board.clone(); bd.passes = 0;
      simulate(bd, null, null);
      finalOwner(bd, tmp);
      for (const p of board.points) sum[p] += tmp[p] === 1 ? 1 : tmp[p] === 2 ? -1 : 0;
    }
    for (const p of board.points) sum[p] /= playouts;
    return sum;
  }
  function guessDead(board, playouts, komi) {
    const own = estimateOwnership(board, playouts, komi), dead = new Set();
    for (const p of board.points) {
      const v = board.b[p];
      if (v === BLACK && own[p] < -0.3) dead.add(p);
      else if (v === WHITE && own[p] > 0.3) dead.add(p);
    }
    return { dead, own };
  }

  const api = { MCTS, searchAsync, estimateOwnership, guessDead, selfAtariSize, DEFAULTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GoAI = api;
})(typeof window !== 'undefined' ? window : globalThis);
