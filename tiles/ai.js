// 花磚老厝 電腦對手（簡單／普通／困難）
(function (root) {
  const E = root.Engine;
  const cfg = () => root.CONFIG;
  const clone = o => JSON.parse(JSON.stringify(o));

  // 估計某位玩家版面的價值：回合結束時會拿到的分數＋未完成排的進度＋終局加分的潛力－破磚
  function evalBoard(p, level) {
    const C = cfg(), W = cfg().ai.weights;
    const wall = p.wall.map(r => r.slice());
    let v = 0;
    // 放滿的排：照回合結算順序模擬貼磚
    for (let r = 0; r < 5; r++) {
      const L = p.lines[r];
      if (L.count === r + 1) {
        const c = E.wallCol(r, L.color);
        wall[r][c] = true;
        v += E.scoreTile(wall, r, c);
      }
    }
    // 未放滿的排：越接近滿越有價值，排越長越難完成
    for (let r = 0; r < 5; r++) {
      const L = p.lines[r];
      if (L.count > 0 && L.count < r + 1) {
        const c = E.wallCol(r, L.color);
        const tmp = wall.map(x => x.slice()); tmp[r][c] = true;
        const pts = E.scoreTile(tmp, r, c);
        v += pts * (L.count / (r + 1)) * W.partial - (r + 1 - L.count) * W.missing;
      }
    }
    // 破磚列
    let pen = 0;
    for (let i = 0; i < p.floor.length && i < C.floorPenalties.length; i++) pen += C.floorPenalties[i];
    v += pen * W.floor;
    if (level >= 3) {
      // 終局加分潛力（只有困難會想）
      for (let c = 0; c < 5; c++) { const n = wall.filter(row => row[c]).length; v += (n * n) / 25 * C.bonusColumn * W.bonus; }
      for (let r = 0; r < 5; r++) { const n = wall[r].filter(Boolean).length; v += (n * n) / 25 * C.bonusRow * W.bonus; }
      for (let k = 0; k < 5; k++) { let n = 0; for (let r = 0; r < 5; r++) if (wall[r][E.wallCol(r, k)]) n++; v += (n * n) / 25 * C.bonusColor * W.bonus; }
      // 中間的格子比較好連分
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (wall[r][c] && !p.wall[r][c]) v += (c === 2 ? W.center : 0);
    }
    return v;
  }

  function moveValue(s, pi, m, level) {
    const t = clone(s);
    E.applyTake(t, pi, m.src, m.color, m.line);
    let v = evalBoard(t.players[pi], level) - evalBoard(s.players[pi], level);
    if (t.lastAction.gotMarker) v += cfg().ai.weights.marker;
    return { v, after: t };
  }

  function bestReply(t, pi, level) {
    const moves = E.legalMoves(t, pi);
    let best = 0;
    for (const m of moves) { const { v } = moveValue(t, pi, m, level); if (v > best) best = v; }
    return best;
  }

  // level：1 簡單、2 普通、3 困難
  function choose(s, pi, level, rng = Math.random) {
    const moves = E.legalMoves(s, pi);
    if (!moves.length) return null;
    const A = cfg().ai;
    const scored = moves.map(m => ({ m, ...moveValue(s, pi, m, level) }));
    if (level >= 3) {
      const opp = (pi + 1) % s.n;
      scored.forEach(x => {
        const empty = x.after.center.length === 0 && x.after.factories.every(f => f.length === 0);
        if (!empty) x.v -= bestReply(x.after, opp, 2) * A.weights.deny;
      });
    }
    const noise = A.noise[level] || 0;
    scored.forEach(x => { x.v += (rng() * 2 - 1) * noise; });
    scored.sort((a, b) => b.v - a.v);
    if (level === 1 && rng() < A.easyRandom) {
      const ok = scored.filter(x => x.m.line < 5);
      const pool = ok.length ? ok : scored;
      return pool[Math.floor(rng() * pool.length)].m;
    }
    return scored[0].m;
  }

  const api = { choose, evalBoard };
  root.AI = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
