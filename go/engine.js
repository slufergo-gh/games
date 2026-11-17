/* ===== 圍棋規則引擎 =====
 * 盤面用加邊框的一維陣列：W = n+2，索引 p = (y+1)*W + (x+1)
 * 0 空、1 黑、2 白、3 邊界。PASS = -1
 */
(function (root) {
  const EMPTY = 0, BLACK = 1, WHITE = 2, EDGE = 3, PASS = -1;
  const COLS = 'ABCDEFGHJKLMNOPQRST';

  class Board {
    constructor(n) {
      this.n = n; this.W = n + 2; this.len = this.W * this.W;
      this.b = new Int8Array(this.len);
      for (let i = 0; i < this.len; i++) {
        const x = i % this.W, y = (i / this.W) | 0;
        this.b[i] = (x === 0 || y === 0 || x === this.W - 1 || y === this.W - 1) ? EDGE : EMPTY;
      }
      this.dirs = [1, -1, this.W, -this.W];
      this.diag = [this.W + 1, this.W - 1, -this.W + 1, -this.W - 1];
      this.toPlay = BLACK; this.ko = -1; this.caps = [0, 0, 0]; this.passes = 0;
      this.mark = new Int32Array(this.len); this.stamp = 1;
      this.stack = new Int32Array(this.len);
      this.points = [];
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) this.points.push((y + 1) * this.W + x + 1);
      this.lastMove = PASS; this.moveNum = 0;
    }
    clone() {
      const c = Object.create(Board.prototype);
      c.n = this.n; c.W = this.W; c.len = this.len; c.b = this.b.slice();
      c.dirs = this.dirs; c.diag = this.diag; c.toPlay = this.toPlay; c.ko = this.ko;
      c.caps = this.caps.slice(); c.passes = this.passes;
      c.mark = new Int32Array(this.len); c.stamp = 1; c.stack = new Int32Array(this.len);
      c.points = this.points; c.lastMove = this.lastMove; c.moveNum = this.moveNum;
      return c;
    }
    pt(x, y) { return (y + 1) * this.W + x + 1; }
    xy(p) { return [p % this.W - 1, ((p / this.W) | 0) - 1]; }
    // 座標名稱：欄字母（略過 I）＋列數字（最上面為 1）
    name(p) { if (p === PASS) return '虛手'; const [x, y] = this.xy(p); return COLS[x] + (y + 1); }
    parse(s) {
      s = s.trim().toUpperCase(); if (s === 'PASS') return PASS;
      const x = COLS.indexOf(s[0]), r = parseInt(s.slice(1), 10);
      if (x < 0 || x >= this.n || !(r >= 1 && r <= this.n)) throw new Error('bad coord ' + s);
      return this.pt(x, r - 1);
    }
    // 取得整塊棋與氣：回傳 {stones:[], libs:[]}
    group(p) {
      const c = this.b[p], st = ++this.stamp, stones = [], libs = [];
      const stack = [p]; this.mark[p] = st;
      while (stack.length) {
        const q = stack.pop(); stones.push(q);
        for (const d of this.dirs) {
          const r = q + d; if (this.mark[r] === st) continue;
          const v = this.b[r];
          if (v === c) { this.mark[r] = st; stack.push(r); }
          else if (v === EMPTY) { this.mark[r] = st; libs.push(r); }
        }
      }
      return { stones, libs };
    }
    // 快速數氣（最多數到 max），回傳氣數；this._lastLib 為最後找到的一口氣
    libs(p, max) {
      const c = this.b[p], st = ++this.stamp, S = this.stack; let sp = 0, n = 0;
      S[sp++] = p; this.mark[p] = st;
      while (sp) {
        const q = S[--sp];
        for (let k = 0; k < 4; k++) {
          const r = q + this.dirs[k]; if (this.mark[r] === st) continue;
          const v = this.b[r];
          if (v === c) { this.mark[r] = st; S[sp++] = r; }
          else if (v === EMPTY) { this.mark[r] = st; n++; this._lastLib = r; if (n >= max) return n; }
        }
      }
      return n;
    }
    removeGroup(p) {
      const c = this.b[p], S = this.stack; let sp = 0, n = 0;
      S[sp++] = p; this.b[p] = EMPTY;
      while (sp) {
        const q = S[--sp]; n++;
        for (let k = 0; k < 4; k++) { const r = q + this.dirs[k]; if (this.b[r] === c) { this.b[r] = EMPTY; S[sp++] = r; } }
      }
      return n;
    }
    // 自己的眼（給模擬用）：四周都是自己或邊，斜角對方不超過 1（在邊上 0）
    isEyeish(p, c) {
      if (this.b[p] !== EMPTY) return false;
      for (let k = 0; k < 4; k++) { const v = this.b[p + this.dirs[k]]; if (v !== c && v !== EDGE) return false; }
      let bad = 0, edge = 0; const o = 3 - c;
      for (let k = 0; k < 4; k++) { const v = this.b[p + this.diag[k]]; if (v === o) bad++; else if (v === EDGE) edge = 1; }
      return bad + edge < 2;
    }
    // 是否合法（不改變盤面）
    isLegal(p, c) {
      if (c === undefined) c = this.toPlay;
      if (p === PASS) return true;
      if (this.b[p] !== EMPTY || p === this.ko) return false;
      const o = 3 - c;
      for (let k = 0; k < 4; k++) {
        const r = p + this.dirs[k], v = this.b[r];
        if (v === EMPTY) return true;
      }
      // 沒有直接的空點：看能不能提子、或連到有其他氣的自己棋
      this.b[p] = c;
      let ok = false;
      for (let k = 0; k < 4 && !ok; k++) {
        const r = p + this.dirs[k], v = this.b[r];
        if (v === o && this.libs(r, 1) === 0) ok = true;
        else if (v === c && this.libs(r, 1) > 0) ok = true;
      }
      this.b[p] = EMPTY;
      return ok;
    }
    // 下一手；合法回傳提子數（>=0），不合法回傳 -1
    play(p) {
      const c = this.toPlay, o = 3 - c;
      if (p === PASS) { this.passes++; this.ko = -1; this.toPlay = o; this.lastMove = PASS; this.moveNum++; return 0; }
      if (this.b[p] !== EMPTY || p === this.ko) return -1;
      this.b[p] = c;
      let cap = 0, capPt = -1;
      for (let k = 0; k < 4; k++) {
        const r = p + this.dirs[k];
        if (this.b[r] === o && this.libs(r, 1) === 0) { const n = this.removeGroup(r); cap += n; capPt = r; }
      }
      if (cap === 0 && this.libs(p, 1) === 0) { this.b[p] = EMPTY; return -1; }
      // 打劫：只提一子、且自己是單獨一子只有一氣
      this.ko = -1;
      if (cap === 1) {
        let single = true;
        for (let k = 0; k < 4; k++) if (this.b[p + this.dirs[k]] === c) { single = false; break; }
        if (single && this.libs(p, 2) === 1) this.ko = capPt;
      }
      this.caps[c] += cap; this.passes = 0; this.toPlay = o; this.lastMove = p; this.moveNum++;
      return cap;
    }
    // 數子法（中國規則）面積：dead 為被判定死亡的子集合（Set）
    areaScore(komi, dead) {
      const b = this.b.slice();
      if (dead) for (const p of dead) b[p] = EMPTY;
      const own = new Int8Array(this.len); // 每點歸屬 1 黑 2 白 0 中立
      let black = 0, white = 0;
      const seen = new Uint8Array(this.len);
      for (const p of this.points) {
        if (b[p] === BLACK) { black++; own[p] = 1; }
        else if (b[p] === WHITE) { white++; own[p] = 2; }
        else if (!seen[p]) {
          const region = [], st = [p]; seen[p] = 1; let touch = 0;
          while (st.length) {
            const q = st.pop(); region.push(q);
            for (const d of this.dirs) {
              const r = q + d, v = b[r];
              if (v === EMPTY && !seen[r]) { seen[r] = 1; st.push(r); }
              else if (v === BLACK) touch |= 1; else if (v === WHITE) touch |= 2;
            }
          }
          if (touch === 1) { black += region.length; for (const q of region) own[q] = 1; }
          else if (touch === 2) { white += region.length; for (const q of region) own[q] = 2; }
        }
      }
      return { black, white, score: black - white - komi, own };
    }
    hash() { let h = ''; for (const p of this.points) h += this.b[p]; return h + this.toPlay + this.ko; }
  }

  const api = { Board, EMPTY, BLACK, WHITE, EDGE, PASS, COLS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GoEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
