/* ===== 用原則解讀一手棋（提示用）===== */
(function (root) {
  const G = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : root.GoEngine;
  const { EMPTY, PASS } = G;

  // 征子/叫吃後能否吃掉（只考慮氣與反提）
  function canKill(b, target, depth) {
    const col = b.b[target];
    if (col !== 1 && col !== 2) return true;
    const g = b.group(target), L = g.libs.length, atk = b.toPlay !== col;
    if (depth <= 0) return L <= 1 && atk;
    if (atk) {
      if (L === 1) return true;
      if (L > 2) return false;
      for (const m of g.libs) { const c = b.clone(); if (c.play(m) < 0) continue; if (canKill(c, target, depth - 1)) return true; }
      return false;
    }
    if (L >= 3) return false;
    const cands = new Set(g.libs);
    for (const s of g.stones) for (const d of b.dirs) { const q = s + d; if (b.b[q] === 3 - col) { const gg = b.group(q); if (gg.libs.length === 1) cands.add(gg.libs[0]); } }
    for (const m of cands) { const c = b.clone(); if (c.play(m) < 0) continue; if (!canKill(c, target, depth - 1)) return false; }
    return true;
  }

  function region(b, p) {
    const [x, y] = b.xy(p), n = b.n, t = n / 3;
    const cx = x < t ? 0 : x >= n - t ? 2 : 1, cy = y < t ? 0 : y >= n - t ? 2 : 1;
    return [['左上角', '上邊', '右上角'], ['左邊', '中央', '右邊'], ['左下角', '下邊', '右下角']][cy][cx];
  }
  const colName = c => c === 1 ? '黑' : '白';

  // 回傳 [{text, tag}]，tag 對應教學單元
  function explainMove(board, p, extra) {
    const out = [];
    if (p === PASS) return [{ text: '虛手：盤上已經沒有能增加地盤的地方了。', tag: '' }];
    const c = board.toPlay, o = 3 - c, me = colName(c), op = colName(o);
    const before = board;
    // 提子 / 救子（下之前）
    const seen = new Set(); let capN = 0;
    const ownAtari = [];
    for (const d of before.dirs) {
      const r = p + d, v = before.b[r];
      if ((v === 1 || v === 2) && !seen.has(r)) {
        const g = before.group(r); g.stones.forEach(s => seen.add(s));
        if (v === o && g.libs.length === 1) capN += g.stones.length;
        if (v === c && g.libs.length === 1) ownAtari.push(g);
      }
    }
    const after = before.clone(); const cap = after.play(p);
    if (cap < 0) return [{ text: '這裡不能下（禁著點或打劫）。', tag: '' }];
    const ng = after.group(p), myLibs = ng.libs.length;
    if (cap > 0) out.push({ text: `提掉${op}棋 ${cap} 子。`, tag: 'u1' });
    if (ownAtari.length) {
      const n = ownAtari.reduce((s, g) => s + g.stones.length, 0);
      if (myLibs >= 2) out.push({ text: `救出被叫吃的 ${n} 子（現在有 ${myLibs} 口氣）。` + (cap > 0 ? '提子同時也是逃跑。' : ''), tag: 'u3' });
    }
    // 叫吃 / 雙叫吃 / 征子
    const seen2 = new Set(); const ataris = []; const reduced = [];
    for (const d of after.dirs) {
      const r = p + d;
      if (after.b[r] === o && !seen2.has(r)) {
        const g = after.group(r); g.stones.forEach(s => seen2.add(s));
        if (g.libs.length === 1) ataris.push({ g, r });
        else if (g.libs.length === 2) reduced.push(g);
      }
    }
    if (ataris.length >= 2) out.push({ text: `雙叫吃！${op}棋兩塊同時只剩一口氣，只能救一邊。`, tag: 'u6' });
    else if (ataris.length === 1) {
      const { g, r } = ataris[0];
      let t = `叫吃${op}棋 ${g.stones.length} 子（只剩一口氣）。`;
      if (canKill(after, r, 30)) t += '而且它逃不掉（逃出去還是被追著吃）。';
      else t += '不過它可以逃出去，要注意叫吃的方向。';
      out.push({ text: t, tag: 'u2' });
    }
    if (myLibs === 1 && cap === 0) out.push({ text: `注意：這手下完自己只剩一口氣，${op}棋可以直接提掉。`, tag: 'u1' });
    // 連接 / 切斷
    const myGroups = new Set(), opGroups = new Set();
    for (const d of before.dirs) {
      const r = p + d, v = before.b[r];
      if (v === c) myGroups.add(before.group(r).stones.reduce((a, b) => Math.min(a, b)));
      if (v === o) opGroups.add(before.group(r).stones.reduce((a, b) => Math.min(a, b)));
    }
    if (myGroups.size >= 2) out.push({ text: `把${me}棋 ${myGroups.size} 塊連成一塊，不會被切斷。`, tag: 'u8' });
    if (opGroups.size >= 2 && !ataris.length && cap === 0) out.push({ text: `切斷${op}棋，讓它分成 ${opGroups.size} 塊各自求活。`, tag: 'u8' });
    if (reduced.length && !ataris.length) out.push({ text: `緊${op}棋的氣，${op}棋只剩兩口氣了。`, tag: 'u7' });
    // 自己的弱棋長氣
    if (!ownAtari.length) {
      for (const d of before.dirs) {
        const r = p + d;
        if (before.b[r] === c) { const l = before.group(r).libs.length; if (l === 2 && myLibs >= 4) { out.push({ text: `替只剩兩口氣的${me}棋長氣（現在 ${myLibs} 口氣）。`, tag: 'u3' }); break; } }
      }
    }
    // 開局：附近沒有棋子
    if (!out.length) {
      const [x, y] = before.xy(p), n = before.n;
      let near = false;
      for (const q of before.points) { if (before.b[q] === 1 || before.b[q] === 2) { const [qx, qy] = before.xy(q); if (Math.abs(qx - x) + Math.abs(qy - y) <= 2) near = true; } }
      const line = Math.min(x, y, n - 1 - x, n - 1 - y) + 1;
      const rg = region(before, p);
      if (!near && (line === 1 || (line === 2 && before.moveNum >= n))) {
        out.push({ text: `下在第 ${line} 線（很靠邊），附近也沒有需要處理的棋，能圍到的地很少。這種位置通常是收官時才下。`, tag: '' });
      } else if (!near) {
        if (rg.endsWith('角')) out.push({ text: `佔${rg}：角落有兩條邊線幫忙圍地，最省力。（第 ${line} 線）`, tag: 'u10' });
        else if (rg === '中央') out.push({ text: '往中央發展，限制對方擴張。', tag: 'u10' });
        else out.push({ text: `在${rg}展開，擴大地盤。（第 ${line} 線）`, tag: 'u10' });
      }
    }
    // 地盤估計（來自 AI 模擬）
    if (extra && extra.gain && extra.gain.n >= 2) {
      out.push({ text: `模擬結果：這手主要的價值在${extra.gain.where}，大約讓 ${extra.gain.n} 個點變成${me}棋的地。`, tag: '' });
    }
    if (!out.length) out.push({ text: '這手沒有立即的戰術目的，是 AI 依模擬判斷整體最有利的位置。', tag: '' });
    return out;
  }

  // 用某候選手的地盤分布與全體平均比較，找出主要獲利區域
  function territoryGain(board, candOwn, rootOwn, color) {
    if (!candOwn) return null;
    const sign = color === 1 ? 1 : -1, sums = {};
    let total = 0;
    for (const p of board.points) {
      const d = (candOwn[p] - rootOwn[p]) * sign;
      if (d > 0.15) { const r = region(board, p); sums[r] = (sums[r] || 0) + 1; total++; }
    }
    let best = null; for (const k in sums) if (!best || sums[k] > sums[best]) best = k;
    return best ? { where: best, n: sums[best] } : null;
  }

  const api = { explainMove, territoryGain, canKill, region };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GoExplain = api;
})(typeof window !== 'undefined' ? window : globalThis);
