// 花磚老厝 規則引擎（純資料，房主與同機模式共用）
(function (root) {
  const MARK = -1; // 先手牌

  function cfg() { return root.CONFIG; }
  function wallColor(r, c) { return (c - r + 5) % 5; }
  function wallCol(r, color) { return (color + r) % 5; }

  function shuffle(a, rng) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function newGame(names, rng = Math.random) {
    const C = cfg();
    const n = names.length;
    const bag = [];
    for (let k = 0; k < 5; k++) for (let i = 0; i < C.tilesPerColor; i++) bag.push(k);
    shuffle(bag, rng);
    const s = {
      n, round: 0, phase: 'pick', turn: 0, nextFirst: Math.floor(rng() * n),
      markerInCenter: true, bag, lid: [],
      factories: [], center: [],
      players: names.map(name => ({
        name, score: 0,
        lines: [0, 1, 2, 3, 4].map(() => ({ color: null, count: 0 })),
        wall: [0, 1, 2, 3, 4].map(() => [false, false, false, false, false]),
        floor: [],
      })),
      log: [], lastAction: null, roundSummary: null, result: null, seq: 0,
    };
    startRound(s, rng);
    return s;
  }

  function draw(s, rng) {
    if (s.bag.length === 0) {
      if (s.lid.length === 0) return null;
      s.bag = shuffle(s.lid, rng); s.lid = [];
    }
    return s.bag.pop();
  }

  function startRound(s, rng) {
    const C = cfg();
    s.round++;
    s.turn = s.nextFirst;
    s.markerInCenter = true;
    s.center = [];
    s.factories = [];
    const fc = C.factoryCount[s.n] || (2 * s.n + 1);
    for (let f = 0; f < fc; f++) {
      const t = [];
      for (let i = 0; i < C.tilesPerFactory; i++) {
        const x = draw(s, rng);
        if (x === null) break;
        t.push(x);
      }
      s.factories.push(t);
    }
    s.log.push({ type: 'round', round: s.round, first: s.turn });
  }

  function canPlace(p, line, color) {
    if (line === 5) return true; // 破磚列
    const L = p.lines[line];
    if (L.count >= line + 1) return false;
    if (L.color !== null && L.color !== color) return false;
    if (p.wall[line][wallCol(line, color)]) return false;
    return true;
  }

  // src: 0..F-1 為窯，'c' 為中央；line: 0..4 備料列，5 破磚列
  function validate(s, pi, src, color, line) {
    if (s.phase !== 'pick') return '現在不能拿磚';
    if (pi !== s.turn) return '還沒輪到你';
    const pool = src === 'c' ? s.center : s.factories[src];
    if (!pool || !pool.includes(color)) return '那裡沒有這個顏色';
    if (!(line >= 0 && line <= 5)) return '位置不對';
    if (!canPlace(s.players[pi], line, color)) return '這排不能放這個顏色';
    return null;
  }

  function addFloor(s, p, items) {
    const C = cfg();
    for (const x of items) {
      if (p.floor.length < C.floorPenalties.length) p.floor.push(x);
      else if (x !== MARK) s.lid.push(x);
    }
  }

  function apply(s, pi, src, color, line, rng = Math.random) {
    const err = validate(s, pi, src, color, line);
    if (err) return err;
    const p = s.players[pi];
    let taken = 0, gotMarker = false, toCenter = [];
    if (src === 'c') {
      taken = s.center.filter(x => x === color).length;
      s.center = s.center.filter(x => x !== color);
      if (s.markerInCenter) { gotMarker = true; s.markerInCenter = false; s.nextFirst = pi; }
    } else {
      const f = s.factories[src];
      taken = f.filter(x => x === color).length;
      toCenter = f.filter(x => x !== color);
      s.center.push(...toCenter);
      s.factories[src] = [];
    }
    let placed = 0, overflow = 0;
    if (line < 5) {
      const L = p.lines[line];
      const room = line + 1 - L.count;
      placed = Math.min(room, taken);
      overflow = taken - placed;
      L.color = color; L.count += placed;
    } else overflow = taken;
    const floorItems = [];
    if (gotMarker && cfg().firstMarkerPenalty) floorItems.push(MARK);
    for (let i = 0; i < overflow; i++) floorItems.push(color);
    addFloor(s, p, floorItems);
    if (gotMarker && !cfg().firstMarkerPenalty) {} // 不佔格
    s.seq++;
    s.lastAction = { seq: s.seq, player: pi, src, color, count: taken, line, placed, overflow, gotMarker, toCenter: toCenter.length };
    s.log.push({ type: 'take', ...s.lastAction });

    const empty = s.center.length === 0 && s.factories.every(f => f.length === 0);
    if (empty) endRound(s, rng);
    else s.turn = (s.turn + 1) % s.n;
    return null;
  }

  function scoreTile(wall, r, c) {
    let h = 1, v = 1;
    for (let x = c - 1; x >= 0 && wall[r][x]; x--) h++;
    for (let x = c + 1; x < 5 && wall[r][x]; x++) h++;
    for (let y = r - 1; y >= 0 && wall[y][c]; y--) v++;
    for (let y = r + 1; y < 5 && wall[y][c]; y++) v++;
    if (h > 1 && v > 1) return h + v;
    return Math.max(h, v);
  }

  function endRound(s, rng) {
    const C = cfg();
    const summary = [];
    s.players.forEach((p, pi) => {
      const before = p.score;
      const placed = [];
      for (let r = 0; r < 5; r++) {
        const L = p.lines[r];
        if (L.count === r + 1) {
          const c = wallCol(r, L.color);
          p.wall[r][c] = true;
          const pts = scoreTile(p.wall, r, c);
          p.score += pts;
          placed.push({ r, c, color: L.color, pts });
          for (let i = 0; i < r; i++) s.lid.push(L.color);
          L.color = null; L.count = 0;
        }
      }
      let pen = 0;
      p.floor.forEach((x, i) => { pen += C.floorPenalties[i]; if (x !== MARK) s.lid.push(x); });
      p.score = Math.max(0, p.score + pen);
      p.floor = [];
      summary.push({ player: pi, placed, penalty: pen, before, after: p.score });
    });
    s.roundSummary = { round: s.round, items: summary };
    s.log.push({ type: 'tiling', round: s.round, items: summary });

    const over = s.players.some(p => p.wall.filter(row => row.every(Boolean)).length >= C.endWhenRowsComplete);
    if (over) finish(s);
    else startRound(s, rng);
  }

  function bonuses(p) {
    const C = cfg();
    let rows = 0, cols = 0, colors = 0;
    for (let r = 0; r < 5; r++) if (p.wall[r].every(Boolean)) rows++;
    for (let c = 0; c < 5; c++) if (p.wall.every(row => row[c])) cols++;
    for (let k = 0; k < 5; k++) {
      let all = true;
      for (let r = 0; r < 5; r++) if (!p.wall[r][wallCol(r, k)]) all = false;
      if (all) colors++;
    }
    return { rows, cols, colors, pts: rows * C.bonusRow + cols * C.bonusColumn + colors * C.bonusColor };
  }

  function finish(s) {
    s.phase = 'over';
    const res = s.players.map((p, pi) => {
      const b = bonuses(p);
      const before = p.score;
      p.score += b.pts;
      return { player: pi, before, ...b, final: p.score };
    });
    const best = Math.max(...res.map(r => r.final));
    let tied = res.filter(r => r.final === best);
    if (tied.length > 1) {
      const br = Math.max(...tied.map(r => r.rows));
      tied = tied.filter(r => r.rows === br);
    }
    s.result = { items: res, winners: tied.map(r => r.player) };
    s.log.push({ type: 'over', winners: s.result.winners });
  }

  // 列出某玩家所有合法動作（測試與提示用）
  function legalMoves(s, pi) {
    const out = [];
    const srcs = s.factories.map((f, i) => i).filter(i => s.factories[i].length).concat(s.center.length ? ['c'] : []);
    for (const src of srcs) {
      const pool = src === 'c' ? s.center : s.factories[src];
      for (const color of [...new Set(pool)]) {
        for (let line = 0; line <= 5; line++) if (canPlace(s.players[pi], line, color)) out.push({ src, color, line });
      }
    }
    return out;
  }

  const api = { MARK, wallColor, wallCol, newGame, apply, validate, canPlace, legalMoves, bonuses, scoreTile };
  root.Engine = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
