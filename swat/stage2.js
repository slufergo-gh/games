// 第二關：偷渡郵輪
(() => {
'use strict';
// 每一區用自己的座標原點蓋場景（彼此離很遠，霧會遮住），關卡腳本也用各區的區域座標，最後統一加上位移
// 各區實際相連：上一區的出口門＝下一區的入口
const AOFF = [[0, 0], [0, 0], [0, -156.2], [3.5, -228.6], [15.5, -285.0], [15.5, -377.2], [15.5, -420.1], [15.5, -470.7]];
const CW = 3.0, HW = 2.6; // 船艙走廊、客房走廊半寬
let OX = 0, OZ = 0;
const B = (x0, x1, y0, y1, z0, z1, c, G_) => blk(x0 + OX, x1 + OX, y0, y1, z0 + OZ, z1 + OZ, c, G_);
const BX = (w, h, d, x, y, z, c, ry, rx, G_) => bx(w, h, d, x + OX, y, z + OZ, c, ry, rx, G_);
const CY = (r, h, x, y, z, c, seg, G_) => cyl(r, h, x + OX, y, z + OZ, c, seg, G_);
const TI = (x0, x1, z0, z1, y, size, a, b) => tiles(x0 + OX, x1 + OX, z0 + OZ, z1 + OZ, y, size, a, b);
const WX = (x0, x1, y0, y1, z, t, c, holes) => wallX(x0 + OX, x1 + OX, y0, y1, z + OZ, t, c, (holes || []).map(h => [h[0] + OX, h[1] + OX, h[2]]));
const PR = (type, x, y, z, c, ry) => prod(type, x + OX, y, z + OZ, c, ry);
const AD = (geo, x, y, z, c, ry, rx, rz, G_) => (G_ || L).add(geo, x + OX, y, z + OZ, c, ry, rx, rz);
const area = (a) => { curArea = a; OX = AOFF[a][0]; OZ = AOFF[a][1]; L = new Builder(false); G = new Builder(true); };
const done = () => { L.build(); G.build(); };

const AREAS = [
  { name: '沙灘', en: 'AREA 1  BEACH', start: [0, 1.6, -2], look: [0, 1.3, -20],
    env: { bg: 0x8ec8f0, near: 45, far: 170, sky: 0xf0f4ff, gnd: 0x9a8060, hi: 0.65, sun: 0.6, amb: 0.22 } },
  { name: '遊艇碼頭', en: 'AREA 2  MARINA', start: [0, 1.6, -58], look: [-3, 1.6, -80],
    env: { bg: 0x9cc8ec, near: 45, far: 170, sky: 0xffffff, gnd: 0x5a7080, hi: 0.8, sun: 0.75, amb: 0.3 } },
  { name: '走廊・輪機室', en: 'AREA 3  ENGINE ROOM', start: [0, 1.6, 1.5], look: [0, 1.5, -20],
    env: { bg: 0x141618, near: 14, far: 60, sky: 0xffe8c8, gnd: 0x3a3430, hi: 0.7, sun: 0.0, amb: 0.32 } },
  { name: '賭場', en: 'AREA 4  CASINO', start: [0, 1.6, -2], look: [0, 1.4, -20],
    env: { bg: 0x1a0c10, near: 22, far: 80, sky: 0xffe0b0, gnd: 0x5a2020, hi: 0.85, sun: 0.0, amb: 0.35 } },
  { name: '客房區', en: 'AREA 5  CABINS', start: [0, 1.6, 2], look: [0, 1.5, -20],
    env: { bg: 0x1e1814, near: 16, far: 60, sky: 0xfff0d8, gnd: 0x5a4030, hi: 0.8, sun: 0.0, amb: 0.33 } },
  { name: '健身房', en: 'AREA 6  GYM', start: [0, 1.6, -1], look: [0, 1.5, -20],
    env: { bg: 0x20242a, near: 22, far: 70, sky: 0xf4fbff, gnd: 0x404448, hi: 0.85, sun: 0.0, amb: 0.35 } },
  { name: '游泳池', en: 'AREA 7  POOL DECK', start: [8, 1.6, -1], look: [4, 1.2, -20],
    env: { bg: 0x3a4a7a, near: 35, far: 130, sky: 0xffd8b0, gnd: 0x405070, hi: 0.75, sun: 0.45, amb: 0.3 } },
  { name: '舞廳', en: 'AREA 8  BALLROOM', start: [0, 1.7, -9], look: [0, 2, -28],
    env: { bg: 0x120818, near: 22, far: 80, sky: 0xffc0f0, gnd: 0x402050, hi: 0.75, sun: 0.0, amb: 0.35 } },
];

// ---------- 小物件 ----------
function palm(x, z, lean) {
  for (let i = 0; i < 6; i++) CY(0.22 - i * 0.02, 1.2, x + lean * i * 0.25, 0.6 + i * 1.15, z, 0x8a6a40, 6);
  const tx = x + lean * 1.5, ty = 7.2;
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; AD(new THREE.BoxGeometry(3.2, 0.08, 0.7), tx + Math.cos(a) * 1.4, ty - 0.3, z + Math.sin(a) * 1.4, 0x3a8a3a, -a, 0, -0.35); }
}
function umbrella(x, z, c) {
  CY(0.05, 2.4, x, 1.2, z, 0xdddddd, 5);
  AD(new THREE.ConeGeometry(1.5, 0.6, 8), x, 2.6, z, c);
}
function lounger(x, z, ry) { BX(0.7, 0.3, 1.9, x, 0.3, z, 0xf0f0f0, ry || 0); BX(0.7, 0.08, 0.6, x, 0.6, z - 0.75, 0xf0f0f0, ry || 0, -0.6); }
function rock(x, z, w, h, d) { B(x - w / 2, x + w / 2, 0, h, z - d / 2, z + d / 2, 0x7a7468); B(x - w / 2 + 0.3, x + w / 2 - 0.4, h, h + 0.25, z - d / 2 + 0.3, z + d / 2 - 0.3, 0x8a8478); }
function yacht(xc, zc, len, c) {
  const W = 2.3;
  B(xc - W, xc + W, -0.7, 1.0, zc - len / 2, zc + len / 2, 0xf4f4f0);
  B(xc - W - 0.02, xc + W + 0.02, 0.15, 0.4, zc - len / 2, zc + len / 2, c);
  AD(new THREE.BoxGeometry(W * 1.42, 1.7, W * 1.42), xc, 0.15, zc - len / 2, 0xf4f4f0, Math.PI / 4); // 船頭
  B(xc - 1.6, xc + 1.6, 1.0, 2.6, zc - len * 0.3, zc + len * 0.15, 0xf0f0f0);
  B(xc - 1.65, xc + 1.65, 1.75, 2.25, zc - len * 0.3 + 0.3, zc + len * 0.15 - 0.3, 0x203040);
  B(xc - 1.8, xc + 1.8, 2.6, 2.72, zc - len * 0.3, zc + len * 0.06, 0xe8e8e4);
  for (const sx of [-1.75, 1.75]) B(xc + sx - 0.03, xc + sx + 0.03, 2.72, 3.0, zc - len * 0.3, zc + len * 0.06, 0xb0b8c0);
  B(xc - 0.6, xc + 0.6, 2.72, 3.6, zc - len * 0.2, zc - len * 0.1, 0xe0e0e0); // 駕駛台
  for (const sx of [-W + 0.05, W - 0.05]) B(xc + sx - 0.03, xc + sx + 0.03, 1.0, 1.45, zc - len / 2, zc + len / 2, 0xc0c8d0); // 欄杆
}
function door(x, z, ry, c) { BX(1.1, 2.2, 0.08, x, 1.1, z, c, ry); }
function chandelier(x, y, z) { AD(new THREE.ConeGeometry(0.9, 0.7, 8), x, y, z, 0xffe8a0, 0, Math.PI, 0, G); CY(0.03, 1.2, x, y + 0.9, z, 0xc0a040, 4); }
function slot(x, z, ry) {
  BX(0.9, 1.9, 0.8, x, 0.95, z, 0x6a2a6a, ry || 0); BX(0.7, 0.5, 0.05, x + Math.sin(ry || 0) * 0.41, 1.35, z + Math.cos(ry || 0) * 0.41, pick([0xffd040, 0x40e0ff, 0xff60a0]), ry || 0, 0, G);
  BX(0.92, 0.25, 0.82, x, 2.0, z, 0xe0b030, ry || 0);
}
function cardTable(x, z) {
  B(x - 1.3, x + 1.3, 0, 0.7, z - 0.7, z + 0.7, 0x4a2a18); B(x - 1.35, x + 1.35, 0.7, 0.76, z - 0.75, z + 0.75, 0x1a6a3a);
  for (let i = 0; i < 4; i++) PR('chips', x - 0.9 + i * 0.6, 0.76, z + 0.4, pick([0xd02020, 0x2050d0, 0x20a040, 0x222222]));
  PR('chips', x - 0.3, 0.76, z - 0.3, 0xd02020); PR('chips', x + 0.3, 0.76, z - 0.25, 0x2050d0);
  PR('cards', x, 0.76, z, 0xf4f0e8); PR('cards', x + 0.8, 0.76, z - 0.2, 0xc02030);
}
function cabinDoor(x, z, side) { // side=-1 左邊牆，+1 右邊牆；門寬 1.4，房間深 3.2
  const wx = side * HW, ox = wx + side * 3.2, x0 = Math.min(wx, ox), x1 = Math.max(wx, ox);
  B(x0, x1, 0, 0.02, z - 1.4, z + 1.4, 0x6a5040); // 房間地板
  B(x0, x1, 2.8, 2.9, z - 1.4, z + 1.4, 0x3a3028);
  B(ox - 0.1, ox + 0.1, 0, 2.8, z - 1.4, z + 1.4, 0x5a4a3a);
  B(x0, x1, 0, 2.8, z - 1.5, z - 1.4, 0x5a4a3a);
  B(x0, x1, 0, 2.8, z + 1.4, z + 1.5, 0x5a4a3a);
  B(Math.min(wx + side * 2.2, wx + side * 3.1), Math.max(wx + side * 2.2, wx + side * 3.1), 0, 0.55, z - 1.3, z + 0.2, 0xe8e0d0); // 床
  B(Math.min(wx + side * 2.9, wx + side * 3.1), Math.max(wx + side * 2.9, wx + side * 3.1), 0.55, 1.1, z - 1.3, z + 0.2, 0x8a5a3a);
  B(Math.min(wx + side * 2.5, wx + side * 3.1), Math.max(wx + side * 2.5, wx + side * 3.1), 0, 1.9, z + 0.75, z + 1.38, 0x7a5a3a); // 衣櫃
  B(wx - 0.08, wx + 0.08, 2.3, 2.8, z - 0.7, z + 0.7, 0xc8b8a0);
  BX(1.3, 2.2, 0.06, wx + side * 0.7, 1.1, z - 1.35, 0x8a4a2a); // 打開的門板（貼著牆）
  B(wx - 0.05, wx + 0.05, 2.35, 2.55, z + 0.8, z + 1.1, 0xffe0a0, G); // 房號燈
  B(Math.min(wx + side * 1.4, wx + side * 1.8), Math.max(wx + side * 1.4, wx + side * 1.8), 2.84, 2.88, z - 0.2, z + 0.2, 0xfff0c0, G); // 房間燈
}

function build() {
  // ===== 區域 1：沙灘 =====
  area(0);
  TI(-14, 30, -62, 16, 0, 4, 0xc4ac7a, 0xbea676);
  B(-160, -14, -0.4, -0.25, -260, 60, 0x2a74ac); // 海
  B(-14.8, -13.9, -0.24, -0.2, -62, 16, 0xe8f0f0);
  rock(-5, -14, 2.6, 1.0, 1.8); rock(6, -15, 2.8, 1.05, 1.8); rock(-11, -27, 3, 1.3, 2.2);
  // 海灘酒吧
  B(4.5, 9.5, 0, 0.95, -30.6, -29.4, 0x8a5a30); B(4.3, 9.7, 0.95, 1.05, -30.8, -29.2, 0xa87040);
  for (const [x, z] of [[4.6, -33.4], [9.4, -33.4], [4.6, -29.3], [9.4, -29.3]]) B(x - 0.12, x + 0.12, 0, 3, z - 0.12, z + 0.12, 0x6a4a28);
  B(4, 10, 3, 3.35, -34, -28.6, 0xc8a060); B(4.5, 9.5, 0, 3, -33.6, -33.4, 0x9a6a3a);
  B(4.6, 9.4, 1.5, 1.56, -33.4, -33.0, 0x6a4a28);
  for (let x = 5; x < 9.3; x += 0.35) PR('bottle', x, 1.56, -33.2, pick([0x2a7a3a, 0x8a5a2a, 0xd0d0e0]));
  PR('glass', 6, 1.05, -30, 0xe0f0ff); PR('glass', 7.5, 1.05, -30.1, 0xe0f0ff); PR('glass', 8.6, 1.05, -29.9, 0xffe080);
  // 翻倒的小船
  B(-5.8, -2.2, 0, 0.8, -32.7, -31.3, 0x3a6aa0); B(-5.6, -2.4, 0.8, 0.95, -32.2, -31.8, 0x2a4a70);
  // 救生員塔
  for (const [x, z] of [[-10.2, -45.2], [-7.8, -45.2], [-10.2, -42.8], [-7.8, -42.8]]) B(x - 0.1, x + 0.1, 0, 2.4, z - 0.1, z + 0.1, 0xe8e0d0);
  B(-10.4, -7.6, 2.3, 2.5, -45.4, -42.6, 0xe8e0d0); B(-10.4, -7.6, 2.5, 4.4, -45.4, -45.1, 0xd04030);
  B(-10.4, -10.1, 2.5, 4.4, -45.4, -44.0, 0xd04030); B(-7.9, -7.6, 2.5, 4.4, -45.4, -44.0, 0xd04030);
  B(-10.6, -7.4, 4.4, 4.6, -45.6, -42.4, 0xd04030); B(-10.4, -7.6, 3.0, 3.06, -42.7, -42.6, 0xe8e0d0);
  AD(new THREE.BoxGeometry(0.8, 0.1, 3.4), -9, 1.2, -41.6, 0xe8e0d0, 0, 0.75);
  [[2, -8, 0xe04040], [-8, -21, 0x40a0e0], [11, -18, 0xf0c020], [-1.5, -41, 0x40c070], [12.5, -44, 0xe060a0]].forEach(([x, z, c]) => umbrella(x, z, c));
  lounger(3.2, -9.5); lounger(0.8, -9.5); lounger(-7, -22.5); lounger(10, -19.5); lounger(-0.5, -42.5); lounger(13.5, -45.5);
  for (const [x, z, l] of [[16, -6, 0.3], [18, -22, 0.2], [15.5, -38, 0.35], [19, -52, 0.25], [-16.5, 8, -0.3]]) palm(x, z, l);
  PR('melon', 1.5, 0, -12, 0xf0f0f0); PR('melon', -3, 0, -25, 0xff6040);
  B(14, 30, 0, 3.5, -60, -56, 0xe0d8c8); B(14, 30, 3.5, 3.8, -61, -55, 0x2a6aa0); // 碼頭管理處
  done();

  // ===== 區域 2：遊艇碼頭 =====
  area(1);
  B(-14, 160, -0.75, -0.6, -300, -62, 0x2a6a9a); // 海
  TI(-3.5, 3.5, -142, -62, 0, 1.4, 0x9a7048, 0x926a44);
  B(-3.5, 3.5, -0.62, -0.02, -142, -62, 0x6a4a2a);
  for (let z = -64; z > -142; z -= 6) for (const x of [-3.6, 3.6]) B(x - 0.15, x + 0.15, -0.7, 0.5, z - 0.15, z + 0.15, 0x5a3a20);
  for (const [z, s] of [[-84, -1], [-107, -1], [-73, 1], [-96, 1], [-121, 1]]) { const x0 = s < 0 ? -12 : 3.5, x1 = s < 0 ? -3.5 : 12; B(x0, x1, -0.5, -0.02, z - 0.7, z + 0.7, 0x8a6440); }
  yacht(-8.6, -72, 12, 0x1c3a6a); yacht(-8.6, -96, 13, 0xa02828); yacht(-8.6, -119, 12, 0x2a7a5a);
  yacht(8.6, -84, 12, 0x303030); yacht(8.6, -108, 13, 0x1c3a6a);
  for (let z = -66; z > -140; z -= 8) for (const x of [-3.3, 3.3]) { CY(0.06, 1.1, x, 0.55, z, 0xd0d0d0, 5); B(x - 0.15, x + 0.15, 1.1, 1.3, z - 0.15, z + 0.15, 0xfff0c0, G); }
  // 郵輪
  B(-70, -2.2, -0.7, 24, -152, -150, 0xf4f4f0); B(2.2, 70, -0.7, 24, -152, -150, 0xf4f4f0); B(-2.2, 2.2, 3.0, 24, -152, -150, 0xf4f4f0);
  B(-70, -2.6, -0.7, 2.2, -150.02, -149.92, 0x1c2a5a); B(2.6, 70, -0.7, 2.2, -150.02, -149.92, 0x1c2a5a); // 藍色船身條紋：凸出牆面，避免和白牆重疊閃爍
  B(-2.6, -2.2, 0, 3.3, -150.02, -149.88, 0xb0b8c0); B(2.2, 2.6, 0, 3.3, -150.02, -149.88, 0xb0b8c0); B(-2.6, 2.6, 3.0, 3.4, -150.02, -149.88, 0xb0b8c0); // 艙門框
  B(-3.5, 3.5, -0.6, 0, -150, -142, 0x9a7048); B(-2.2, 2.2, -0.05, 0, -152.3, -150, 0x5a4a3a); // 碼頭延伸到艙門
  for (let y = 4; y < 22; y += 3.2) for (let x = -66; x < 66; x += 2.5) { if (Math.abs(x) < 4 && y < 7) continue; B(x, x + 1.2, y, y + 0.9, -150.05, -149.98, 0xfff4c0, G); }
  B(-12, 12, 7.6, 7.8, -150, -147.6, 0xe8e8e4); // 甲板陽台
  B(-12, 12, 8.75, 8.85, -147.7, -147.6, 0xd0d8e0);
  for (let x = -12; x <= 12; x += 3) B(x - 0.05, x + 0.05, 7.8, 8.8, -147.7, -147.6, 0xd0d8e0);
  for (const x of [-20, -9, 9, 20]) { B(x - 3, x + 3, 10, 11.4, -149.4, -147.4, 0xff8020); B(x - 2.8, x + 2.8, 11.4, 11.8, -149.2, -147.6, 0xf0f0f0); }
  for (const x of [-6, 6]) { B(x - 0.6, x + 0.6, 0, 1.0, -141, -139.6, 0x5a5a5a); } // 纜樁
  B(-5, -2.6, 0, 1.3, -138, -136, 0x8a6a40); B(2.6, 4.6, 0, 1.0, -137.5, -136, 0x6a7a8a); // 貨箱
  done();

  // ===== 區域 3：走廊、輪機室 =====
  area(2);
  TI(-CW, CW, -35, 4.2, 0, 1.2, 0x6a1c24, 0x621a22);
  B(-CW, CW, 3, 3.2, -35, 4.2, 0xd8d0c0);
  for (const s of [-1, 1]) {
    const holes = s < 0 ? [-8, -18, -27] : [-12, -22, -30];
    let z = 4.2; holes.forEach(hz => { B(s * CW - 0.1, s * CW + 0.1, 0, 3, hz + 0.8, z, 0xc8b898); z = hz - 0.8; });
    B(s * CW - 0.1, s * CW + 0.1, 0, 3, -35, z, 0xc8b898);
    const o = s * (CW + 1.4);
    holes.forEach(hz => { B(Math.min(s * CW, o), Math.max(s * CW, o), 0, 3, hz - 0.9, hz - 0.8, 0xb8a888); B(Math.min(s * CW, o), Math.max(s * CW, o), 0, 3, hz + 0.8, hz + 0.9, 0xb8a888); B(o - 0.1, o + 0.1, 0, 3, hz - 0.9, hz + 0.9, 0x6a4a30); B(Math.min(s * CW, o), Math.max(s * CW, o), 2.9, 3.0, hz - 0.9, hz + 0.9, 0xb8a888); });
    B(s * (CW - 0.1) - 0.05, s * (CW - 0.1) + 0.05, 0.9, 0.95, -35, 4.2, 0x8a6a40);
  }
  for (let z = 0; z > -34; z -= 4) B(-0.5, 0.5, 2.95, 3.0, z - 0.6, z, 0xfff0d0, G);
  // 走廊裡的行李推車、消防箱（可躲的掩體）
  B(1.0, 2.6, 0, 1.15, -15.6, -14.6, 0x8a6a40); B(1.1, 2.5, 1.15, 1.2, -15.5, -14.7, 0xc0a040);
  B(1.3, 1.9, 1.2, 1.7, -15.4, -14.8, 0x3a5a8a); B(1.95, 2.45, 1.2, 1.55, -15.4, -14.9, 0x8a3030);
  B(-CW + 0.1, -CW + 0.35, 1.0, 2.0, -24.6, -23.6, 0xc02020);
  B(-2.4, -1.2, 0, 0.9, -33.2, -32.2, 0x6a5a4a); // 木箱
  WX(-14, 14, 0, 9, -35.2, 0.4, 0x5a5a58, [[-1.5, 1.5, 2.6]]); B(-1.5, 1.5, -0.05, 0, -35.5, -34.9, 0x3a3a3a); B(2.3, 4.7, -0.05, 0, -68.7, -67.9, 0x3a3a3a);
  // 輪機室
  TI(-14, 14, -68, -35.4, 0, 2, 0x4a4a4c, 0x444446);
  B(-14, 14, 9, 9.3, -68, -35.4, 0x303234);
  B(-14.4, -14, 0, 9, -68, -35.4, 0x5a5a58); B(14, 14.4, 0, 9, -68, -35.4, 0x5a5a58); WX(-14, 14, 0, 9, -68.2, 0.4, 0x5a5a58, [[2.3, 4.7, 2.8]]); B(2.1, 2.3, 0, 3, -68, -67.9, 0xd0b030); B(4.7, 4.9, 0, 3, -68, -67.9, 0xd0b030); // 往賭場的門
  for (const s of [-1, 1]) { // 主引擎
    B(Math.min(s * 4, s * 9), Math.max(s * 4, s * 9), 0, 2.8, -56, -42, 0x7a3a2a);
    for (let z = -44; z > -56; z -= 3) { CY(0.7, 1.4, s * 6.5, 3.5, z, 0x9a9a9a, 8); B(s * 6.5 - 0.2, s * 6.5 + 0.2, 4.2, 4.6, z - 0.2, z + 0.2, 0x5a5a5a); }
    B(Math.min(s * 4, s * 4.2), Math.max(s * 4, s * 4.2), 0.3, 2.5, -55, -43, 0x5a2a20);
    CY(1.6, 6, s * 11.5, 3, -60, 0x8a8a80, 10); B(s * 11.5 - 0.3, s * 11.5 + 0.3, 6, 9, -60.3, -59.7, 0x6a6a68);
    for (const y of [5.5, 6.5, 7.5]) AD(new THREE.CylinderGeometry(0.18, 0.18, 33, 6), s * 13.6, y, -52, s < 0 ? 0xa04030 : 0x3a6a9a, 0, Math.PI / 2);
  }
  B(-14, 14, 4.0, 4.2, -68, -64.6, 0x606468); // 後方走道
  B(-14, 14, 5.15, 5.25, -64.7, -64.6, 0xd0b030); for (let x = -14; x <= 14; x += 2) B(x - 0.04, x + 0.04, 4.2, 5.2, -64.7, -64.6, 0xd0b030);
  for (const x of [-12.6, 12.6]) AD(new THREE.BoxGeometry(1.0, 0.15, 5.6), x, 2.05, -64, 0x707070, 0, -0.8);
  B(-1.6, 1.6, 0, 1.1, -60, -59, 0x4a5a6a); B(-1.5, 1.5, 1.1, 1.4, -60, -59.4, 0x2a3a4a); B(-1.2, 1.2, 1.15, 1.35, -59.42, -59.38, 0x60ff90, G); // 控制台
  for (const x of [-3, 3]) B(x - 0.5, x + 0.5, 0, 0.55, -39, -37.6, 0x8a6a30); // 工具箱
  for (let z = -40; z > -66; z -= 6) for (const x of [-7, 7]) B(x - 1, x + 1, 8.85, 9, z - 0.3, z + 0.3, 0xfff0c0, G);
  for (const [x, z] of [[-3.4, -62], [6, -63], [-12.5, -48], [12.5, -45]]) { CY(0.35, 1.0, x, 0.5, z, pick([0x2a5a9a, 0xb03020, 0x3a3a3a]), 8); }
  // 輪機室細節：直立管線、閥門、儀表、警示線、排氣管
  for (const s of [-1, 1]) {
    for (const z of [-38, -44, -50, -57, -63]) { CY(0.22, 9, s * 13.5, 4.5, z, s < 0 ? 0x8a8a80 : 0x6a7a8a, 8); CY(0.32, 0.25, s * 13.5, 2.0, z, 0x505050, 8); }
    for (const z of [-41, -47, -53]) { AD(new THREE.TorusGeometry(0.35, 0.06, 5, 10), s * 13.2, 1.5, z, 0xc02020, Math.PI / 2); B(s * 13.85 - 0.05, s * 13.85 + 0.05, 2.6, 3.4, z - 0.5, z + 0.5, 0x202428); B(s * 13.78 - 0.02, s * 13.78 + 0.02, 2.75, 3.25, z - 0.35, z + 0.35, 0xfff0a0, G); }
    for (let z = -42; z > -57; z -= 1) B(Math.min(s * 3.6, s * 3.9), Math.max(s * 3.6, s * 3.9), 0.005, 0.015, z - 0.5, z, (Math.abs(z) % 2) ? 0xe0c020 : 0x202020); // 警示線
    AD(new THREE.CylinderGeometry(0.5, 0.5, 6, 8), s * 6.5, 6.0, -49, 0x6a6a68, 0, 0, Math.PI / 2); // 排氣總管
    CY(0.45, 3.2, s * 6.5, 7.4, -42.5, 0x6a6a68, 8);
  }
  for (const x of [-9.5, -6, 8, 11]) { B(x - 0.6, x + 0.6, 0, 2.2, -67.9, -67.3, 0x3a4a5a); B(x - 0.5, x + 0.5, 1.3, 1.9, -67.32, -67.28, 0x101418); B(x - 0.4, x - 0.2, 1.5, 1.6, -67.28, -67.26, 0x60ff90, G); B(x + 0.1, x + 0.3, 1.5, 1.6, -67.28, -67.26, 0xff5030, G); } // 配電盤
  done();

  // ===== 區域 4：賭場 =====
  area(3);
  TI(-16, 16, -52, 4, 0, 2, 0x7a1820, 0x701620);
  B(-16, 16, 6, 6.3, -52, 4, 0x2a1418);
  B(-16.4, -16, 0, 6, -52, 4, 0x4a1a1e); B(16, 16.4, 0, 6, -52, 4, 0x4a1a1e);
  WX(-16, 16, 0, 6, -52.2, 0.4, 0x4a1a1e, [[12 - HW, 12 + HW, 2.8]]); B(12 - HW, 12 + HW, -0.05, 0, -52.5, -51.9, 0x3a3a3a); WX(-16.4, 16.4, 0, 6, 3.95, 0.1, 0x4a1a1e, [[-1.2, 1.2, 2.8]]);
  B(12 - HW - 0.3, 12 - HW, 0, 3.1, -51.95, -51.85, 0xc8a040); B(12 + HW, 12 + HW + 0.3, 0, 3.1, -51.95, -51.85, 0xc8a040); B(12 - HW - 0.3, 12 + HW + 0.3, 2.8, 3.1, -51.95, -51.85, 0xc8a040);
  B(-16, -15.9, 3, 3.2, -52, 4, 0xc8a040); B(15.9, 16, 3, 3.2, -52, 4, 0xc8a040); WX(-16, 16, 3, 3.2, -51.95, 0.1, 0xc8a040, [[12 - HW - 0.3, 12 + HW + 0.3]]);
  for (const [x, z] of [[-7, -8], [7, -8], [0, -22], [-8, -36], [8, -36]]) chandelier(x, 5, z);
  cardTable(-4.5, -11); cardTable(4.5, -12); cardTable(-6.5, -25); cardTable(6, -26); cardTable(-10.5, -13.5);
  for (const [x, z] of [[-4, -36], [4, -36]]) { CY(1.3, 0.76, x, 0.38, z, 0x1a6a3a, 12); CY(0.5, 0.1, x, 0.8, z, 0x8a4a20, 12); PR('chips', x + 0.8, 0.76, z + 0.3, 0xd02020); PR('chips', x - 0.8, 0.76, z + 0.2, 0x111111); PR('chips', x, 0.76, z + 0.9, 0x2050d0); }
  for (let z = -4; z > -30; z -= 1.0) { slot(-14.5, z, Math.PI / 2); slot(14.5, z, -Math.PI / 2); }
  for (let x = -12.5; x <= -9; x += 0.95) slot(x, -19, 0); for (let x = 9; x <= 12.5; x += 0.95) slot(x, -19, 0);
  B(-9, 9, 0, 1.0, -46.6, -45.4, 0x5a2a18); B(-9.2, 9.2, 1.0, 1.1, -46.8, -45.2, 0x8a5a30);
  B(-9, 9, 0, 3.4, -50.6, -50.2, 0x3a2018); B(-9, 9, 1.6, 1.66, -50.2, -49.8, 0x5a3a28); B(-9, 9, 2.4, 2.46, -50.2, -49.8, 0x5a3a28);
  for (let x = -8.6; x < 8.6; x += 0.4) { PR('bottle', x, 1.66, -50, pick([0x2a7a3a, 0x8a5a2a, 0xd0d0e0, 0x8a2a3a])); PR('glass', x + 0.2, 2.46, -50, 0xe0f0ff); }
  for (let x = -8; x < 8.5; x += 1.6) PR('glass', x, 1.1, -46, 0xffe080);
  B(-15.5, -11, 0, 2.6, -46, -42, 0x6a5a3a); B(-15.5, -11, 1.0, 2.2, -42.05, -41.95, 0x202020); // 兌換處
  B(-3, 3, 4.6, 5.4, -51.9, -51.8, 0xffd040, G); // 招牌
  done();

  // ===== 區域 5：客房區 =====
  area(4);
  TI(-HW, HW, -72, 4, 0, 1.3, 0x2a3a5a, 0x283656);
  B(-HW, HW, 2.8, 3.0, -72, 4, 0xe8e0d0);
  const doors = [];
  for (let z = -6; z > -66; z -= 6) { doors.push([z, -1]); doors.push([z - 3, 1]); }
  for (const s of [-1, 1]) {
    const zs = doors.filter(d => d[1] === s).map(d => d[0]).sort((a, b) => b - a);
    let z = 4; zs.forEach(dz => { B(s * HW - 0.1, s * HW + 0.1, 0, 2.8, dz + 0.7, z, 0xd8c8a8); B(s * HW - 0.1, s * HW + 0.1, 2.3, 2.8, dz - 0.7, dz + 0.7, 0xd8c8a8); z = dz - 0.7; });
    B(s * HW - 0.1, s * HW + 0.1, 0, 2.8, -72, z, 0xd8c8a8);
    B(s * (HW - 0.08) - 0.04, s * (HW - 0.08) + 0.04, 0, 0.15, -72, 4, 0x6a4a30);
  }
  doors.forEach(([z, s]) => cabinDoor(0, z, s));
  for (let z = 0; z > -70; z -= 3) B(-0.4, 0.4, 2.78, 2.8, z - 0.4, z, 0xfff4d0, G);
  // 盡頭大廳
  TI(-9, 9, -88, -72, 0, 2, 0x5a4a3a, 0x544636);
  B(-9, 9, 4.5, 4.7, -88, -72, 0xe0d8c8);
  WX(-9, 9, 0, 4.5, -72, 0.2, 0xd8c8a8, [[-HW, HW, 2.8]]);
  B(-9.2, -9, 0, 4.5, -88, -72, 0xd8c8a8); B(9, 9.2, 0, 4.5, -88, -72, 0xd8c8a8); WX(-9.2, 9.2, 0, 4.5, -88.1, 0.2, 0xd8c8a8, [[-1.2, 1.2, 2.6]]); B(-1.2, 1.2, -0.05, 0, -88.3, -87.9, 0x3a3a3a);
  B(-1.45, -1.2, 0, 2.85, -87.95, -87.85, 0x8a6a40); B(1.2, 1.45, 0, 2.85, -87.95, -87.85, 0x8a6a40); B(-1.45, 1.45, 2.6, 2.85, -87.95, -87.85, 0x8a6a40); B(-1, 1, 3.0, 3.4, -87.95, -87.85, 0x40ff80, G); // 往健身房
  for (const x of [-4, 4]) { B(x - 1.2, x + 1.2, 0, 3, -87.9, -87.8, 0xb0b4b8); B(x - 0.02, x + 0.02, 0, 3, -87.8, -87.75, 0x505458); B(x - 0.3, x + 0.3, 3.2, 3.5, -87.85, -87.75, 0xffa040, G); }
  B(-6.5, -3.5, 0, 0.6, -80, -79, 0x8a3a3a); B(-6.5, -3.5, 0.6, 1.2, -79.1, -78.9, 0x8a3a3a); // 沙發
  B(3.5, 6.5, 0, 0.6, -80, -79, 0x8a3a3a); B(3.5, 6.5, 0.6, 1.2, -79.1, -78.9, 0x8a3a3a);
  CY(0.5, 0.5, -7, 0.25, -82, 0x8a6a40, 10); AD(new THREE.ConeGeometry(0.5, 1.4, 6), -8, 0.7, -74, 0x3a7a3a); AD(new THREE.ConeGeometry(0.5, 1.4, 6), 8, 0.7, -74, 0x3a7a3a);
  done();

  // ===== 區域 6：健身房 =====
  area(5);
  TI(-12, 12, -38, 4, 0, 2, 0x2a2c30, 0x26282c);
  B(-12, 12, 4.5, 4.7, -38, 4, 0xe8eef0);
  B(-12.4, -12, 0, 4.5, -38, 4, 0xd0d8dc); B(12, 12.4, 0, 4.5, -38, 4, 0xd0d8dc); B(-12.4, -9.2, 0, 4.5, 4, 4.2, 0xd0d8dc); B(9.2, 12.4, 0, 4.5, 4, 4.2, 0xd0d8dc);
  WX(-12, 12, 0, 4.5, -38.2, 0.4, 0xb8c8d4, [[6.8, 9.2, 2.6]]); B(6.8, 9.2, -0.05, 0, -38.5, -37.9, 0x3a3a3a); B(-11, 6.4, 0.4, 3.6, -37.99, -37.95, 0x8aa0b8); B(9.6, 11, 0.4, 3.6, -37.99, -37.95, 0x8aa0b8); // 鏡子牆＋往泳池的門
  B(6.55, 6.8, 0, 2.85, -37.98, -37.9, 0x8a8a8a); B(9.2, 9.45, 0, 2.85, -37.98, -37.9, 0x8a8a8a); B(6.55, 9.45, 2.6, 2.85, -37.98, -37.9, 0x8a8a8a); B(7.2, 8.8, 3.0, 3.4, -37.98, -37.9, 0x40ff80, G);
  for (let z = -6; z > -22; z -= 2.6) { B(-10.4, -9.6, 0, 0.3, z - 1, z + 1, 0x303030); B(-10.45, -9.55, 0.3, 1.3, z - 1.05, z - 0.95, 0x808890); B(-10.5, -9.5, 1.25, 1.35, z - 1.05, z - 0.75, 0x404448); } // 跑步機
  for (const z of [-12, -24]) { B(9.8, 11.8, 0, 0.12, z - 1.5, z + 1.5, 0x303030); B(9.8, 10.0, 0, 1.9, z - 1.5, z + 1.5, 0x505458); for (let k = 0; k < 3; k++) B(10.0, 11.6, 0.4 + k * 0.55, 0.46 + k * 0.55, z - 1.5, z + 1.5, 0x606468); for (let i = 0; i < 6; i++) PR('can', 10.7 + (i % 2) * 0.5, 0.46 + Math.floor(i / 2) * 0.55, z - 1.1 + i * 0.4, 0x202020); } // 啞鈴架
  for (const [x, z] of [[4, -8], [-4, -10]]) { B(x - 0.3, x + 0.3, 0, 0.5, z - 0.9, z + 0.9, 0x303030); B(x - 1.1, x + 1.1, 1.05, 1.12, z - 0.7, z - 0.6, 0xa0a0a0); for (const sx of [-1, 1]) { CY(0.3, 0.1, x + sx * 1.0, 1.08, z - 0.65, 0x202020, 10); B(x + sx * 0.5 - 0.04, x + sx * 0.5 + 0.04, 0, 1.08, z - 0.7, z - 0.6, 0x606468); } } // 臥推
  // 拳擊擂台
  B(-4.5, 4.5, 0, 0.8, -32, -23, 0x2a3a6a); B(-4.6, 4.6, 0.8, 0.85, -32.1, -22.9, 0xe0e0e0);
  for (const [x, z] of [[-4.4, -23.1], [4.4, -23.1], [-4.4, -31.9], [4.4, -31.9]]) B(x - 0.1, x + 0.1, 0.85, 2.5, z - 0.1, z + 0.1, 0xc02020);
  for (const y of [1.3, 1.8, 2.3]) { B(-4.4, 4.4, y, y + 0.04, -23.12, -23.08, 0xf0f0f0); B(-4.42, -4.38, y, y + 0.04, -31.9, -23.1, 0xf0f0f0); B(4.38, 4.42, y, y + 0.04, -31.9, -23.1, 0xf0f0f0); }
  for (const [x, z] of [[-9, -29], [-7, -33], [9.5, -32]]) { CY(0.32, 1.3, x, 2.0, z, 0x8a2020, 8); CY(0.02, 1.8, x, 3.6, z, 0x808080, 4); }
  for (let x = -9; x <= 9; x += 6) B(x - 1, x + 1, 4.45, 4.5, -20, -18, 0xffffff, G);
  for (let x = -6; x <= 6; x += 3) PR('bottle', x, 0, -36.5, 0x40a0e0);
  done();

  // ===== 區域 7：游泳池 =====
  area(6);
  TI(-14, 14, -8, 4, 0, 2, 0xd8d0c0, 0xd0c8b8); TI(-14, 14, -46, -30, 0, 2, 0xd8d0c0, 0xd0c8b8);
  TI(-14, -6, -30, -8, 0, 2, 0xd8d0c0, 0xd0c8b8); TI(6, 14, -30, -8, 0, 2, 0xd8d0c0, 0xd0c8b8);
  B(-6, 6, -0.32, -0.3, -30, -8, 0x2a9ad0, G); // 水面
  B(-6.2, 6.2, -2.4, -2.2, -30.2, -7.8, 0x2a6aa0);
  B(-6.3, -6, -2.4, 0.05, -30.3, -7.7, 0xf0f0f0); B(6, 6.3, -2.4, 0.05, -30.3, -7.7, 0xf0f0f0);
  B(-6.3, 6.3, -2.4, 0.05, -8, -7.7, 0xf0f0f0); B(-6.3, 6.3, -2.4, 0.05, -30.3, -30, 0xf0f0f0);
  for (const z of [-12, -18, -24]) for (const s of [-1, 1]) lounger(s * 9, z, 0);
  for (const [x, z, c] of [[-11.5, -15, 0xe04040], [11.5, -21, 0x40a0e0]]) umbrella(x, z, c);
  B(7, 13, 0, 1.0, -40, -38.8, 0x6a5a4a); B(6.8, 13.2, 1.0, 1.1, -40.2, -38.6, 0x9a7a5a); B(7.4, 12.6, 2.8, 3.1, -42, -38, 0x2a7aaa); for (const x of [7.5, 12.5]) B(x - 0.1, x + 0.1, 1.1, 2.8, -41.8, -41.6, 0x6a5a4a); // 池畔酒吧
  for (let x = 7.6; x < 12.6; x += 0.5) PR('glass', x, 1.1, -39.4, pick([0xffc080, 0x80e0ff, 0xff80c0]));
  // 溜滑梯塔
  for (const [x, z] of [[-11, -36], [-8.6, -36], [-11, -38.4], [-8.6, -38.4]]) B(x - 0.12, x + 0.12, 0, 3.6, z - 0.12, z + 0.12, 0xf0c020);
  B(-11.2, -8.4, 3.5, 3.7, -38.6, -35.8, 0xf0c020); B(-11.2, -8.4, 3.7, 4.3, -38.6, -38.4, 0xf05040);
  AD(new THREE.BoxGeometry(1.2, 0.2, 9), -8, 2.0, -31.5, 0x40a0e0, -0.5, 0.42);
  B(-14.3, -14, 0, 1.1, -46.6, 4, 0xc0c8d0); B(14, 14.3, 0, 1.1, -46.6, 4, 0xc0c8d0); TI(-14, 14, -46.6, -46, 0, 0.6, 0xd8d0c0, 0xd0c8b8);
  // 舞廳外牆（泳池後方）
  WX(-16.4, 16.4, 0, 9, -46.75, 0.3, 0x3a1a40, [[-1.6, 1.6, 3.2]]); B(-1.6, 1.6, -0.05, 0, -47.0, -46.5, 0x3a3a3a); B(-1.9, 1.9, 3.2, 3.6, -46.6, -46.5, 0xff40c0, G); B(-6, 6, 5.2, 6.4, -46.6, -46.5, 0x8a2aa0, G);
  B(-1.9, -1.6, 0, 3.2, -46.6, -46.5, 0xffc040, G); B(1.6, 1.9, 0, 3.2, -46.6, -46.5, 0xffc040, G);
  B(-200, 200, -6, -5.8, -300, -46.5, 0x1a2a4a); // 遠方的海
  WX(-14, 14, 0, 6, 4.35, 0.3, 0xe8e0d0, [[6.8, 9.2, 2.6]]); B(6.8, 9.2, -0.05, 0, 3.9, 4.6, 0x3a3a3a); B(-2, 2, 2.6, 3.4, 4.1, 4.2, 0xfff0c0, G);
  for (const [x, z] of [[-3, -14], [2.5, -21], [-1, -26], [4, -11]]) PR('melon', x, -0.42, z, pick([0xf0d020, 0xff6040, 0xf0f0f0]));
  done();

  // ===== 區域 8：舞廳 =====
  area(7);
  TI(-16, 16, -36, 4, 0, 2, 0x2a1830, 0x24142a);
  B(-16, 16, 9, 9.3, -36, 4, 0x140a18);
  B(-16.4, -16, 0, 9, -36, 4, 0x3a1a40); B(16, 16.4, 0, 9, -36, 4, 0x3a1a40); B(-16, 16, 0, 9, -36.4, -36, 0x3a1a40);
  B(-1.9, -1.6, 0, 3.2, 3.6, 3.75, 0xffc040, G); B(1.6, 1.9, 0, 3.2, 3.6, 3.75, 0xffc040, G); B(-1.9, 1.9, 3.2, 3.5, 3.6, 3.75, 0xffc040, G);
  B(-9, 9, 0, 1.3, -36, -26, 0x2a1a2a); B(-9.1, 9.1, 1.3, 1.35, -36, -25.9, 0x6a3a7a); // DJ 舞台
  B(-2, 2, 1.35, 2.4, -31, -29.8, 0x202020); B(-1.8, 1.8, 2.4, 2.5, -30.9, -29.9, 0x404040);
  for (const x of [-7.5, 7.5]) { B(x - 1, x + 1, 1.35, 4.6, -32, -30.2, 0x181818); CY(0.6, 0.05, x, 3.6, -30.15, 0x404040, 10); CY(0.4, 0.05, x, 2.3, -30.15, 0x404040, 10); }
  B(-8, 8, 5, 8, -35.9, -35.8, 0x8a2aa0, G);
  for (const s of [-1, 1]) for (const z of [-8, -14, -20, -26]) { CY(0.6, 0.75, s * 12, 0.375, z, 0x5a2a5a, 10); PR('glass', s * 12 + 0.2, 0.75, z, 0xff80e0); PR('glass', s * 12 - 0.2, 0.75, z + 0.2, 0x80e0ff); B(s * 13.4 - 0.25, s * 13.4 + 0.25, 0, 0.5, z - 0.25, z + 0.25, 0x7a3a7a); }
  for (const s of [-1, 1]) { B(s * 10 - 0.4, s * 10 + 0.4, 0, 9, -26.4, -25.6, 0x6a3a7a); B(s * 10 - 0.4, s * 10 + 0.4, 0, 9, -6.4, -5.6, 0x6a3a7a); }
  done();
}

// 會動的東西：舞池燈、鏡球
let disco = [], ball = null;
function buildDyn() {
  disco = []; const ox = AOFF[7][0], oz = AOFF[7][1];
  const geo = new THREE.PlaneGeometry(1.9, 1.9); geo.rotateX(-Math.PI / 2);
  for (let x = -7; x <= 7; x += 2) for (let z = -11; z >= -23; z -= 2) {
    const m = stageObj(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x400040 }))); m.position.set(x + ox, 0.02, z + oz); m.userData.ph = Math.random() * 6; disco.push(m);
  }
  ball = stageObj(new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), new THREE.MeshBasicMaterial({ color: 0xe0e0f0, wireframe: false })));
  ball.position.set(ox, 7.6, -17 + oz);
}
const DCOL = [0xff2a8a, 0x2affd0, 0xffe02a, 0x8a2aff, 0x2a8aff, 0xff6a2a];
function tick(dt, t) {
  if (ball) ball.rotation.y += dt * 1.5;
  const beat = Math.floor(t * 2.2);
  disco.forEach((m, i) => { const k = (i * 7 + beat + Math.floor(m.userData.ph)) % 9; m.material.color.setHex(k < DCOL.length ? DCOL[k] : 0x200820); });
}

// ================= Boss：舞王 迪亞哥 =================
// 從一邊跳舞衝到另一邊，途中會停幾次；停下時打中＝打斷、回到中央。成功到另一邊就拿桌上的杯子／酒瓶丟過來。
// 第二階段：先秀一段無敵舞技，之後多了「跳到空中轉 1080 度」，要在空中打下來，否則落地連丟兩個盤子。
const BC = () => C.boss2;
function propMesh(kind) {
  const g = new THREE.Group();
  if (kind === 'plate') {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.05, 12), new THREE.MeshLambertMaterial({ color: 0xf8f8f8 })); g.add(m);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.02, 12), new THREE.MeshLambertMaterial({ color: 0xe02a6a })); r.position.y = 0.025; g.add(r);
  } else if (kind === 'bottle') {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.42, 8), new THREE.MeshLambertMaterial({ color: pick([0x2a7a3a, 0x8a5a2a, 0x8a2a3a]) })); g.add(m);
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.2, 6), m.material); n.position.y = 0.3; g.add(n);
  } else {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.07, 0.24, 8), new THREE.MeshLambertMaterial({ color: pick([0xff80e0, 0x80e0ff, 0xffe080]) })); g.add(m);
  }
  return g;
}
const POSES = [
  { aR: [-2.9, 0, 0.3], aL: [-0.2, 0, -0.6], lean: 0.1 },   // 單手指天
  { aR: [-1.6, 0, 1.2], aL: [-1.6, 0, -1.2], lean: 0 },     // 雙手張開
  { aR: [-0.5, 0, 0.9], aL: [-2.6, 0, -0.4], lean: -0.12 }, // 反手指天
  { aR: [-2.2, 0, 0.6], aL: [-2.2, 0, -0.6], lean: 0.05 },  // 雙手高舉
];
function spawnBoss() {
  const ox = AOFF[7][0], oz = AOFF[7][1], c = BC();
  const h = makeHuman({ shirt: 0xf4f4f4, pants: 0xf4f4f4, skin: 0xc89070, face: 'goggles', head: 0xc89070, vest: 0xe02a6a, gun: false, scale: c.scale, shoe: 0xf4f4f4 });
  const afro = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.52), new THREE.MeshLambertMaterial({ color: 0x1a1008 })); afro.position.set(0, 0.42, -0.04); h.head.add(afro); h.mats.push(afro.material);
  const hold = new THREE.Group(); hold.position.set(0, -0.85, 0.05); h.armR.add(hold); // 手上拿的東西
  h.root.position.set(ox, 1.35, -29 + oz); scene.add(h.root);
  const bhp = Math.round(c.hp * diff().bossHpMul);
  const b = { h, hold, held: null, hp: bhp, max: bhp, alive: true, state: 'intro', t: 0, wait: 1, phase: 1, flashT: 0, hitFlash: 0, done: false, missT: 0, ox, oz, side: 0, lastSide: 0, cycles: 0, jumpHit: 0, plates: 0, plateT: 3 };
  h.hb.forEach(m => { m.userData.boss = true; });
  $('bossbar').style.display = 'block'; $('bossName').textContent = 'BOSS　舞王 迪亞哥';
  setMusic(BOSS_BGM);
  bigText('舞王 迪亞哥', '', 2.2); sayKey('s2boss', 2);
  b.update = dt => upd(b, dt); b.hit = (ud, point) => hit(b, ud.part === 'head', point);
  b.targets = () => (b.alive ? h.hb : []);
  b.aimers = () => (b.alive && ['stop', 'grab', 'jump'].includes(b.state) ? [b] : []);
  b.cleanup = () => scene.remove(h.root);
  b.botTarget = () => (b.alive && ['stop', 'grab', 'jump', 'stagger', 'center'].includes(b.state) ? h.body.localToWorld(V3(0, 1.2, 0)) : null);
  updBar(b);
  return b;
}
function updBar(b) { $('bossfill').style.width = Math.max(0, b.hp / b.max * 100) + '%'; }
function face(b) { const r = b.h.root; r.rotation.y = Math.atan2(camera.position.x - r.position.x, camera.position.z - r.position.z); }
const P = (b, x, z) => V3(b.ox + x, 0, b.oz + z);
function setPose(b, Q, k) {
  const h = b.h;
  h.armR.rotation.set(lerp(h.armR.rotation.x, Q.aR[0], k), 0, lerp(h.armR.rotation.z, Q.aR[2], k));
  h.armL.rotation.set(lerp(h.armL.rotation.x, Q.aL[0], k), 0, lerp(h.armL.rotation.z, Q.aL[2], k));
  h.body.rotation.z = lerp(h.body.rotation.z, Q.lean, k);
}
function dashTo(b, p, next) {
  const sp = b.phase === 2 ? BC().dashSpeed2 : BC().dashSpeed;
  b.from = b.h.root.position.clone(); b.from.y = 0; b.tgt = p; b.dur = Math.max(0.3, b.from.distanceTo(p) / sp); b.t = 0; b.after = next; b.state = 'dash';
  b.h.root.rotation.x = 0; b.h.body.rotation.z = 0;
}
function startCross(b, side) {
  const c = BC(); b.side = side; b.lastSide = side;
  const n = b.phase === 2 ? c.stops2 : c.stops, x0 = b.h.root.position.x - b.ox, x1 = side * c.sideX;
  b.way = []; for (let i = 1; i <= n; i++) b.way.push(P(b, lerp(x0, x1, i / (n + 1)) + rand(-1, 1), rand(-19.5, -13)));
  b.way.push(P(b, x1, side < 0 ? -14.8 : -19.2)); // 最後停在桌子旁邊
  b.seg = 0; dashTo(b, b.way[0], 'seg');
}
function toCenter(b) { dashTo(b, P(b, 0, -16.5), 'center'); }
function hit(b, head, point) {
  if (!b.alive) return false;
  const c = BC(), h = b.h;
  if (['dash', 'intro', 'show', 'fall', 'down'].includes(b.state)) {
    if (b.missT <= 0) { popup(b.state === 'show' ? '無敵！' : b.state === 'dash' ? '太快了！' : '倒地中', point, '#c0c0ff'); b.missT = 0.8; }
    return false;
  }
  let dmg = head ? C.enemy.headMul : 1;
  if (b.state === 'stop') {
    dmg += c.interruptDamage; b.state = 'stagger'; b.t = 0;
    popup('打斷！', point, '#ffb040', true); addScore(C.score.interrupt, point.clone().add(V3(0, 0.6, 0)), '', '#ffb040');
  } else if (b.state === 'jump') {
    b.jumpHit++; popup(`${b.jumpHit}/${c.jumpHits}`, point, '#ffe080');
    if (b.jumpHit >= c.jumpHits) { dmg += c.jumpDamage; b.state = 'fall'; b.t = 0; b.fallFrom = h.root.position.clone(); popup('打下來了！', point, '#ffb040', true); addScore(C.score.jumpKnock, point.clone().add(V3(0, 0.6, 0)), '', '#ffb040'); }
  } else { combo++; maxCombo = Math.max(maxCombo, combo); score += 50; updHud(); }
  b.hp -= dmg; sfx(head ? 'kill' : 'hit'); spark(point, 0xffe0a0);
  b.hitFlash = 0.08; h.mats.forEach(m => m.emissive && m.emissive.setHex(0x553300));
  if (b.hp <= 0) {
    sayReset(); sayKey('s2bossDown', 2);
    b.hp = 0; b.alive = false; b.state = 'dead'; b.t = 0; dropHeld(b);
    stats.kills++; addScore(C.score.bossKill, h.root.position.clone().add(V3(0, 3, 0)), '擊倒 Boss', '#ffd040');
    slowmo = 1.6; sfx('boom');
  } else if (b.phase === 1 && b.hp <= b.max * c.phase2At) {
    b.phase = 2; b.state = 'show'; b.t = 0; dropHeld(b); h.root.rotation.x = 0;
    b.showFrom = h.root.position.clone(); b.showFrom.y = 0;
    sayKey('s2bossShow', 2); sfx('reveal');
  }
  updBar(b);
  return true;
}
// 一次丟一組盤子：隨機 1～3 個（左右散開、每個可打掉）；盤子越多飛得越慢
function plateVolley(b) {
  const c = BC(), r = b.phase === 2 ? c.plateCount2 : c.plateCount;
  const n = r[0] + Math.floor(Math.random() * (r[1] - r[0] + 1));
  const dur = c.volleyFlight * (1 + c.volleySlow * (n - 1));
  const from = b.h.armL.getWorldPosition(V3(0, 0, 0)).add(V3(0, 0.3, 0));
  b.volley = [];
  for (let i = 0; i < n; i++) b.volley.push(throwGrenade(from, i, n, { mesh: propMesh('plate'), dur, arc: 0.8, hitRadius: 0.45, spin: true, gap: 0.15 }));
  sfx('go');
}
function dropHeld(b) { if (b.held) { b.hold.remove(b.held); b.held = null; } }
function upd(b, dt) {
  const h = b.h, r = h.root, c = BC();
  if (b.hitFlash > 0) { b.hitFlash -= dt; if (b.hitFlash <= 0) h.mats.forEach(m => m.emissive && m.emissive.setHex(0)); }
  if (b.missT > 0) b.missT -= dt;
  b.t += dt;
  const legs = (sp, a) => { const sw = Math.sin(gameTime * sp) * (a || 0.7); h.legL.rotation.x = sw; h.legR.rotation.x = -sw; };
  const dance = (sp) => { h.armR.rotation.set(-1.5 + Math.sin(gameTime * sp) * 1.2, 0, 0.8); h.armL.rotation.set(-1.5 - Math.sin(gameTime * sp) * 1.2, 0, -0.8); };
  const wm = diff().fireWaitMul;
  // 全程不定期丟盤子（跳舞移動中也會丟），盤子可以在空中打掉
  if (b.alive && !['intro', 'show', 'fall', 'down', 'plates', 'dead'].includes(b.state)) {
    b.plateT -= dt;
    // 上一組盤子還在飛就先不丟，避免兩組疊在一起（畫面上最多 3 個）
    const flying = (b.volley || []).some(g => !g.dead && grenades.includes(g));
    if ((b.plateT <= 0 || b.volleyNow) && !flying) {
      b.volleyNow = false;
      b.plateT = rand(...(b.phase === 2 ? c.plateEvery2 : c.plateEvery)) * wm;
      plateVolley(b);
    }
  }
  switch (b.state) {
    case 'intro': {
      const k = Math.min(1, b.t / 2.2);
      if (k < 0.5) r.position.set(b.ox, 1.35, b.oz - 29 + k * 2 * 3); else r.position.set(b.ox, lerp(1.35, 0, (k - 0.5) * 2) + Math.sin((k - 0.5) * 2 * Math.PI) * 1.2, b.oz + lerp(-26, -16.5, (k - 0.5) * 2));
      r.rotation.y += dt * 10; legs(16);
      h.armR.rotation.set(-2.8, 0, 0.3); h.armL.rotation.set(-0.3, 0, -0.5);
      if (b.t > 2.4) { r.position.y = 0; b.state = 'center'; b.t = 0; }
      break;
    }
    case 'center': { // 在中央跳一下舞，再決定往哪邊
      face(b); legs(10, 0.4); dance(9); r.position.y = Math.abs(Math.sin(b.t * 8)) * 0.12; h.body.rotation.z = Math.sin(b.t * 6) * 0.12;
      if (b.t >= c.centerTime) {
        r.position.y = 0; h.body.rotation.z = 0; b.cycles++;
        if (b.phase === 2 && b.cycles % c.jumpEvery === 0) { b.state = 'jump'; b.t = 0; b.jumpHit = 0; b.wait = c.jumpTime * wm; b.jumpBase = r.position.clone(); sfx('go'); b.volleyNow = true; } // 起跳時一定丟一組（上一組飛完就馬上丟）
        else startCross(b, b.lastSide ? -b.lastSide : pick([-1, 1]));
      }
      break;
    }
    case 'dash': {
      const k = Math.min(1, b.t / b.dur);
      r.position.lerpVectors(b.from, b.tgt, easeIO(k)); r.position.y = Math.abs(Math.sin(k * Math.PI * 2)) * 0.25;
      r.rotation.y += dt * 16; legs(22); dance(18);
      if (k >= 1) {
        r.position.y = 0; h.legL.rotation.x = h.legR.rotation.x = 0;
        if (b.after === 'center') { b.state = 'center'; b.t = 0; }
        else if (b.after === 'seg') {
          if (b.seg < b.way.length - 1) { b.state = 'stop'; b.t = 0; b.pose = pick(POSES); b.wait = (b.phase === 2 ? c.stopTime2 : c.stopTime) * wm; sfx('go'); }
          else { b.state = 'grab'; b.t = 0; b.wait = c.grabTime * wm; }
        }
      }
      break;
    }
    case 'stop': { // 停下擺姿勢：打中就打斷
      face(b); setPose(b, b.pose, Math.min(1, dt * 14));
      if (b.t >= b.wait) { b.seg++; dashTo(b, b.way[b.seg], 'seg'); }
      break;
    }
    case 'grab': { // 到了另一邊：拿起桌上的杯子或酒瓶丟過來
      const k = b.t / b.wait;
      if (k < 0.45) { r.rotation.y = Math.atan2(b.side, 0); h.armR.rotation.set(-0.9, 0, 0.3); h.body.rotation.x = 0.3; }
      else {
        if (!b.held) { b.held = propMesh(pick(['bottle', 'glass'])); b.hold.add(b.held); sfx('prop'); }
        face(b); h.body.rotation.x = 0; h.armR.rotation.set(lerp(h.armR.rotation.x, Math.PI * 0.85, dt * 6), 0, 0.2); h.armL.rotation.set(-1.2, 0, -0.8);
      }
      if (b.t >= b.wait) {
        const from = b.hold.getWorldPosition(V3(0, 0, 0)); dropHeld(b);
        const n = b.phase === 2 ? c.throws2 : c.throws;
        for (let i = 0; i < n; i++) throwGrenade(from, i, n, { mesh: propMesh(pick(['bottle', 'glass'])), dur: c.throwFlight, arc: 1.2, gap: 0.2, hitRadius: 0.42 });
        sfx('go'); h.armR.rotation.set(-1.4, 0, 0);
        startCross(b, -b.side);
      }
      break;
    }
    case 'stagger': {
      face(b); r.rotation.x = -Math.sin(Math.min(1, b.t / c.staggerTime) * Math.PI) * 0.3; h.body.rotation.z = Math.sin(b.t * 20) * 0.1;
      h.armR.rotation.set(-0.3, 0, 0.6); h.armL.rotation.set(-0.3, 0, -0.6);
      if (b.t >= c.staggerTime) { r.rotation.x = 0; h.body.rotation.z = 0; b.lastSide = 0; toCenter(b); }
      break;
    }
    case 'show': { // 第二階段開場的無敵舞技
      const k = Math.min(1, b.t / c.showTime);
      const ctr = P(b, 0, -16.5); r.position.lerpVectors(b.showFrom, ctr, Math.min(1, k * 3));
      r.position.y = Math.abs(Math.sin(b.t * 5)) * 0.8; r.rotation.y += dt * (8 + 10 * Math.sin(b.t * 2)); legs(20); dance(16);
      h.mats.forEach(m => m.emissive && m.emissive.setHex(Math.floor(b.t * 8) % 2 ? 0x402060 : 0));
      if (k >= 1) { h.mats.forEach(m => m.emissive && m.emissive.setHex(0)); r.position.y = 0; b.state = 'center'; b.t = 0; b.cycles = c.jumpEvery - 1; }
      break;
    }
    case 'jump': { // 跳到空中轉 1080 度：期間打中 jumpHits 次就掉下來
      const k = Math.min(1, b.t / b.wait);
      r.position.set(b.jumpBase.x, Math.sin(k * Math.PI) * c.jumpHeight, b.jumpBase.z);
      r.rotation.y = Math.atan2(camera.position.x - r.position.x, camera.position.z - r.position.z) + k * Math.PI * 6;
      h.armR.rotation.set(-3, 0, 0.4); h.armL.rotation.set(-3, 0, -0.4); h.legL.rotation.x = -0.5; h.legR.rotation.x = 0.3;
      if (k >= 1) { r.position.y = 0; h.legL.rotation.x = h.legR.rotation.x = 0; b.state = 'plates'; b.t = 0; b.plates = 0; if (!b.plateSaid) { b.plateSaid = true; sayKey('s2bossPlates', 2); } }
      break;
    }
    case 'plates': { // 沒被打下來：落地後連丟兩個盤子
      face(b); h.armR.rotation.set(-1.6 + Math.sin(b.t * 12) * 0.6, 0, 0.6);
      if (b.plates === 0 && (b.volley || []).some(g => !g.dead && grenades.includes(g))) b.t = 0; // 等起跳那組盤子飛完
      if (b.plates < c.plates && b.t >= b.plates * c.plateGap) {
        throwGrenade(h.armR.getWorldPosition(V3(0, 0, 0)).add(V3(0, 0.3, 0)), 0, 1, { mesh: propMesh('plate'), dur: c.plateFlight, arc: 0.8, hitRadius: 0.45, spin: true });
        b.plates++; sfx('go');
      }
      if (b.t >= c.plates * c.plateGap + 0.5) { b.state = 'center'; b.t = 0; }
      break;
    }
    case 'fall': {
      const k = Math.min(1, b.t / 0.4); r.position.y = lerp(b.fallFrom.y, 0, k * k); r.rotation.x = -k * Math.PI / 2 * 0.9;
      if (k >= 1) { b.state = 'down'; b.t = 0; shakeT = 0.25; shakeA = 0.08; sfx('boom'); }
      break;
    }
    case 'down': {
      if (b.t >= c.downTime) { r.rotation.x = 0; toCenter(b); }
      break;
    }
    case 'dead': {
      const k = Math.min(1, b.t / 1.2); r.position.y = Math.max(0, r.position.y - dt * 6); r.rotation.y += dt * 8 * (1 - k); r.rotation.x = -easeOut(Math.max(0, (b.t - 0.6) / 0.8)) * Math.PI / 2 * 0.95;
      if (b.t > 1.8) setOpacity(b, Math.max(0, 1 - (b.t - 1.8) / 0.8));
      if (b.t > 3.0 && !b.done) { b.done = true; scene.remove(r); }
      break;
    }
  }
}

// ================= 關卡腳本（區域座標） =================
// LEVEL-BEGIN
const T = (at, o) => Object.assign({ k: 'thug', at }, o || {});
const D = (at, t, o) => Object.assign({ k: 'thug', look: 'diver', at, y: -0.8, pop: 'up', drop: 1.8, splash: -0.3, t: t || 0 }, o || {});
const LEVEL = [
  // ===== 1 沙灘 =====
  { a: 0, type: 'cut', waves: [
    [T([-3.3, -14.2], { look: 'beach', from: [-5.5, -14.6], pop: 'side' }), T([4.3, -15.4], { look: 'beach', from: [6.5, -15.6], pop: 'side', t: 0.8 })],
    [{ cam: [1, 1.6, -8], look: [1, 1.3, -30] }, T([-1.5, -19], { look: 'beach', from: [-9, -23], pop: 'run' }), { k: 'hostage', look: 'tourist', at: [3, -17], from: [12, -14], pop: 'run', t: 0.2 }, T([-8.6, -26.5], { look: 'beach', from: [-11, -27.5], pop: 'side', t: 0.9 }), { k: 'bonus', at: [10.5, -26], from: [16, -26], pop: 'run', t: 0.6 }],
    [{ cam: [1, 1.6, -16], look: [2, 1.3, -35] }, T([3.2, -27.8], { look: 'beach', from: [5.5, -31.6], pop: 'side', crouch: true }), T([-1.5, -31.5], { look: 'beach', from: [-3.8, -32.2], pop: 'side', crouch: true, t: 0.5 }), T([10.3, -28.5], { look: 'beach', from: [16, -30], pop: 'run', t: 1.0 })],
  ] },
  { a: 0, type: 'move', to: [0, 1.6, -27], look: [-3, 1.8, -45], dur: 2.6 },
  { a: 0, type: 'cut', waves: [
    [T([-9, -42.9], { look: 'beach', y: 2.5, from: [-9, -44.7], pop: 'side' }), T([-2.2, -37], { look: 'beach', from: [-6, -48], pop: 'run', t: 0.6 }), T([3.8, -35.5], { look: 'beach', from: [9, -36], pop: 'run', t: 1.1 })],
    [{ k: 'hostage', look: 'tourist', at: [0.5, -35], from: [-5, -50], pop: 'run' }, T([-6.2, -36.5], { look: 'beach', from: [-12, -38], pop: 'run', t: 0.3 }), T([5.5, -40], { look: 'beach', from: [12, -46], pop: 'run', t: 0.9 }), { k: 'bonus', at: [-4, -52], from: [-12, -54], pop: 'run', t: 1.2, mg: true }],
  ] },
  { a: 0, type: 'move', to: [0, 1.6, -48], look: [0, 1.6, -70], dur: 2.4, ambush: [T([4.5, -57], { t: 1.6, look: 'beach', from: [14, -58], pop: 'run' })] },
  // ===== 2 遊艇碼頭 =====
  { a: 1, type: 'move', to: [0, 1.6, -60], look: [-3, 1.8, -76], dur: 1.8 },
  { a: 1, type: 'cut', waves: [
    [T([-7.4, -67.4], { look: 'sailor', y: 1.0, from: [-7.4, -70.8], pop: 'side' }), T([-8.6, -73], { look: 'sailor', y: 2.72, pop: 'up', t: 0.7 }), T([-6.9, -77], { look: 'sailor', y: 1.0, from: [-9.2, -77], pop: 'side', t: 1.3 })],
    [T([1, -72], { look: 'sailor', from: [1, -90], pop: 'run' }), T([7.4, -79.4], { look: 'sailor', y: 1.0, from: [7.4, -82.8], pop: 'side', t: 0.6 }), T([-1.5, -76], { look: 'sailor', from: [-1.5, -95], pop: 'run', t: 1.2 }), { k: 'bonus', at: [-8.6, -97], y: 2.72, pop: 'up', t: 0.5 }],
  ] },
  { a: 1, type: 'move', to: [0.5, 1.6, -86], look: [-6, 1.8, -100], dur: 2.2 },
  { a: 1, type: 'cut', waves: [
    [T([-7.4, -91.6], { look: 'sailor', y: 1.0, from: [-7.4, -95], pop: 'side' }), T([-7.8, -96.2], { look: 'sailor', y: 2.72, pop: 'up', t: 0.6 }), T([-6.9, -101.5], { look: 'sailor', y: 1.0, from: [-9.5, -101.5], pop: 'side', t: 1.1 }), { k: 'hostage', look: 'tourist', at: [-1.2, -96], from: [-1.2, -112], pop: 'run', t: 0.2 }],
    [{ cam: [0.5, 1.6, -92], look: [6, 1.8, -108] }, T([7.4, -103.4], { look: 'sailor', y: 1.0, from: [7.4, -106.9], pop: 'side' }), T([8.6, -109], { look: 'sailor', y: 2.72, pop: 'up', t: 0.5 }), T([1.6, -100], { look: 'sailor', from: [1.6, -118], pop: 'run', t: 0.4, armored: true }), { k: 'bonus', at: [-1, -126], from: [-1, -140], pop: 'run', t: 0.8 }],
  ] },
  { a: 1, type: 'move', to: [0, 1.6, -131], look: [0, 4.2, -150], dur: 3.0 },
  { a: 1, type: 'cut', say: 's2_ship', waves: [
    [T([-4.5, -148.8], { look: 'sailor', y: 7.8, from: [-14, -148.8], pop: 'run' }), T([3.8, -148.8], { look: 'sailor', y: 7.8, from: [13, -148.8], pop: 'run', t: 0.4 }), T([-1.4, -137.2], { look: 'sailor', from: [-3.8, -137.2], pop: 'side', t: 0.9 })],
    [T([1.6, -136.8], { look: 'sailor', from: [3.6, -136.8], pop: 'side', crouch: true }), T([-0.8, -141], { look: 'sailor', from: [7, -142], pop: 'run', t: 0.5, armored: true }), T([0.8, -148.8], { look: 'sailor', y: 7.8, from: [12, -148.8], pop: 'run', t: 1.0 }), { k: 'bonus', at: [-9.5, -148.8], y: 7.8, from: [-14, -148.8], pop: 'run', t: 0.3 }],
  ] },
  { a: 1, type: 'move', to: [0, 1.6, -141], look: [0, 1.8, -160], dur: 1.4 },
  // ===== 3 走廊、輪機室（從艙門直接走進去） =====
  { a: 2, type: 'move', to: [0, 1.6, 1.5], look: [0, 1.5, -20], dur: 2.0 },
  { a: 2, type: 'cut', waves: [
    [T([-2, -8], { look: 'sailor', from: [-3.9, -8], pop: 'side' }), T([2, -12], { look: 'sailor', from: [3.9, -12], pop: 'side', t: 0.7 })],
    [T([0.5, -16.2], { look: 'sailor', from: [1.8, -16.2], pop: 'side', crouch: true }), T([-1.6, -19.5], { look: 'sailor', from: [-1.6, -34], pop: 'run', t: 0.5 }), T([-2, -8], { look: 'sailor', from: [-3.9, -8], pop: 'side', t: 1.0 })],
  ] },
  { a: 2, type: 'move', to: [0, 1.6, -6], look: [0.3, 1.5, -30], dur: 1.6, ambush: [T([-2, -18], { t: 0.5, look: 'sailor', from: [-3.9, -18], pop: 'side' }), T([0.4, -27], { t: 1.3, look: 'sailor', from: [0.4, -40], pop: 'run' })] },
  { a: 2, type: 'move', to: [0, 1.6, -21], look: [0, 1.5, -34], dur: 2.0, ambush: [T([-2, -27], { t: 0.6, look: 'sailor', from: [-3.9, -27], pop: 'side' }), T([2, -30], { t: 1.4, look: 'sailor', from: [3.9, -30], pop: 'side' })] },
  { a: 2, type: 'cut', waves: [
    [{ cam: [0, 1.6, -22], look: [0, 1.5, 0], dur: 0.6 }, { k: 'say', id: 's2_back1' }, T([-2, -18], { look: 'sailor', from: [-3.9, -18], pop: 'side' }), T([-0.4, -12], { look: 'sailor', from: [-0.4, -2], pop: 'run', t: 0.6 })],
    [T([-2, -8], { look: 'sailor', from: [-3.9, -8], pop: 'side' }), T([0.8, -6], { look: 'sailor', from: [0.8, 4], pop: 'run', t: 0.4, armored: true }), { k: 'bonus', at: [-1.2, 0], from: [-1.2, 6], pop: 'run', t: 0.6 }],
    [{ cam: [0, 1.6, -22], look: [0, 1.5, -40], dur: 0.6 }, T([-0.7, -33.6], { look: 'sailor', from: [-1.8, -33.6], pop: 'side', crouch: true }), T([1.2, -30], { look: 'sailor', from: [1.2, -44], pop: 'run', t: 0.5 })],
  ] },
  { a: 2, type: 'move', to: [0, 1.6, -31], look: [0, 1.6, -40], dur: 1.2 },
  { a: 2, type: 'move', to: [0, 1.7, -37.5], look: [-1, 2.2, -58], dur: 1.4 },
  { a: 2, type: 'cut', say: 's2_engine', waves: [
    [T([-2.6, -45], { look: 'sailor', from: [-4.6, -45], pop: 'side' }), T([2.6, -48], { look: 'sailor', from: [4.6, -48], pop: 'side', t: 0.6 })],
    [T([-5.6, -48.5], { look: 'sailor', y: 2.8, pop: 'up', drop: 1.5 }), T([5.6, -51.5], { look: 'sailor', y: 2.8, pop: 'up', drop: 1.5, t: 0.5 }), T([0.5, -52], { look: 'sailor', from: [0.5, -64], pop: 'run', t: 0.9 })],
    [T([-2.6, -52], { look: 'sailor', from: [-4.6, -52], pop: 'side', armored: true }), T([2.6, -45.5], { look: 'sailor', from: [4.6, -45.5], pop: 'side', t: 0.4 }), { k: 'bonus', at: [-3, -66.3], y: 4.2, from: [-14, -66.3], pop: 'run', t: 0.6 }],
  ] },
  { a: 2, type: 'move', to: [0, 1.7, -47], look: [0, 2.6, -66], dur: 1.8 },
  { a: 2, type: 'cut', waves: [
    [T([-5, -66.3], { look: 'sailor', y: 4.2, from: [-14, -66.3], pop: 'run' }), T([4, -66.3], { look: 'sailor', y: 4.2, from: [14, -66.3], pop: 'run', t: 0.4 }), T([-2.4, -59.6], { look: 'sailor', from: [-0.6, -59.6], pop: 'side', crouch: true, t: 0.9 })],
    [T([-6.2, -61.8], { look: 'sailor', from: [-14, -63], pop: 'run' }), T([6.2, -61.8], { look: 'sailor', from: [14, -63], pop: 'run', t: 0.4 }), T([3.5, -58], { look: 'sailor', from: [3.5, -72], pop: 'run', t: 0.8, armored: true }), { k: 'bonus', at: [-9, -66.3], y: 4.2, from: [-14, -66.3], pop: 'run', t: 1.0, mg: true }],
  ] },
  { a: 2, type: 'move', to: [3.5, 1.6, -62], look: [3.5, 1.6, -80], dur: 1.8 },
  // ===== 4 賭場 =====
  { a: 3, type: 'move', to: [0, 1.6, -2], look: [0, 1.4, -20], dur: 1.6 },
  { a: 3, type: 'cut', waves: [
    [T([-2.6, -11.6], { look: 'casino', from: [-4.2, -11.8], pop: 'side', crouch: true }), T([6.4, -12.6], { look: 'casino', from: [4.8, -12.8], pop: 'side', crouch: true, t: 0.6 }), { k: 'hostage', look: 'tourist', at: [1.5, -7], from: [12, -6], pop: 'run', t: 0.2 }],
    [T([2.6, -12.6], { look: 'casino', from: [4.2, -12.8], pop: 'side', crouch: true }), T([-8, -19.6], { look: 'casino', from: [-9.6, -20.3], pop: 'side', t: 0.5 }), T([8, -19.6], { look: 'casino', from: [9.6, -20.3], pop: 'side', t: 0.9 }), { k: 'bonus', at: [0, -28], from: [0, -40], pop: 'run', t: 0.3 }],
    [T([-2.5, -20], { look: 'casino', from: [-4, -30], pop: 'run' }), T([2.6, -21], { look: 'casino', from: [5, -30], pop: 'run', t: 0.4 }), T([0.3, -19], { look: 'casino', from: [0, -34], pop: 'run', t: 0.9, armored: true })],
  ] },
  { a: 3, type: 'move', to: [0, 1.6, -17], look: [0, 1.4, -42], dur: 2.4 },
  { a: 3, type: 'cut', waves: [
    [T([-4.6, -25.6], { look: 'casino', from: [-6.2, -25.8], pop: 'side', crouch: true }), T([4.1, -26.6], { look: 'casino', from: [5.7, -26.8], pop: 'side', crouch: true, t: 0.5 }), T([-2.4, -36.6], { look: 'casino', from: [-4, -36.8], pop: 'side', crouch: true, t: 1.0 }), { k: 'hostage', look: 'tourist', at: [1.6, -30], from: [1.6, -44], pop: 'run', t: 0.3 }],
    [T([2.4, -36.6], { look: 'casino', from: [4, -36.8], pop: 'side', crouch: true }), T([-3, -34], { look: 'casino', from: [-10, -38], pop: 'run', t: 0.4 }), T([5.5, -33], { look: 'casino', from: [10, -38], pop: 'run', t: 0.8 }), T([-6, -33], { look: 'casino', from: [-12, -40], pop: 'run', t: 1.2, armored: true })],
    [T([-8, -31], { look: 'casino', from: [-14, -34], pop: 'run' }), T([8, -30], { look: 'casino', from: [14, -34], pop: 'run', t: 0.3 }), T([0.4, -33], { look: 'casino', from: [0.4, -48], pop: 'run', t: 0.7 }), { k: 'bonus', at: [-6.5, -46], y: 1.1, from: [-9.5, -46], pop: 'run', t: 0.5, mg: true }, { k: 'bonus', at: [9.5, -45], from: [14, -45], pop: 'run', t: 1.0 }],
  ] },
  { a: 3, type: 'move', to: [12, 1.6, -46], look: [12, 1.5, -70], dur: 2.6 },
  // ===== 5 客房區 =====
  { a: 4, type: 'move', to: [0, 1.6, 2], look: [0, 1.5, -20], dur: 1.6 },
  { a: 4, type: 'cut', waves: [
    [T([-1.7, -6], { look: 'sailor', from: [-3.7, -6], pop: 'side' }), T([1.7, -9], { look: 'sailor', from: [3.7, -9], pop: 'side', t: 0.6 })],
    [T([-1.7, -12], { look: 'sailor', from: [-3.7, -12], pop: 'side' }), { k: 'hostage', look: 'tourist', at: [1.7, -15], from: [3.7, -15], pop: 'side', t: 0.2 }, T([-0.6, -19], { look: 'sailor', from: [-0.6, -40], pop: 'run', t: 0.8 })],
    [T([0.5, -14], { look: 'sailor', from: [0.5, -40], pop: 'run' }), T([-1.7, -18], { look: 'sailor', from: [-3.7, -18], pop: 'side', t: 0.5 })],
  ] },
  { a: 4, type: 'move', to: [0, 1.6, -16], look: [0, 1.5, -40], dur: 2.0 },
  // 轉頭看進客房
  { a: 4, type: 'cut', say: 's2_peek', waves: [
    [{ cam: [1.4, 1.6, -18], look: [-7, 1.2, -18], dur: 0.7 }, T([-4.6, -18.8], { look: 'sailor', pop: 'up', drop: 1.2 }), T([-2.3, -17.6], { look: 'sailor', from: [-4.4, -17.0], pop: 'run', t: 0.7 })],
    [{ cam: [-1.4, 1.6, -21], look: [7, 1.2, -21], dur: 0.8 }, T([4.6, -21.8], { look: 'sailor', pop: 'up', drop: 1.2 }), { k: 'hostage', look: 'tourist', at: [3.0, -20.6], from: [4.4, -20.0], pop: 'run', t: 0.4 }],
    [{ cam: [0, 1.6, -21], look: [0, 1.5, -45], dur: 0.7 }, T([1.7, -27], { look: 'sailor', from: [3.7, -27], pop: 'side' }), T([-1.7, -30], { look: 'sailor', from: [-3.7, -30], pop: 'side', t: 0.6, armored: true })],
  ] },
  { a: 4, type: 'move', to: [0, 1.6, -36], look: [0, 1.5, -60], dur: 3.0, ambush: [
    T([1.7, -33], { t: 0.6, look: 'sailor', from: [3.7, -33], pop: 'side' }),
    T([-1.7, -42], { t: 1.6, look: 'sailor', from: [-3.7, -42], pop: 'side' }),
    { k: 'bonus', t: 2.2, at: [1.7, -45], from: [3.7, -45], pop: 'side' }] },
  // 回頭：剛經過的客房衝出敵人
  { a: 4, type: 'cut', waves: [
    [{ cam: [0, 1.6, -37], look: [0, 1.5, -10], dur: 0.6 }, { k: 'say', id: 's2_back2' }, T([-1.7, -30], { look: 'sailor', from: [-3.7, -30], pop: 'side' }), T([1.7, -27], { look: 'sailor', from: [3.7, -27], pop: 'side', t: 0.5 }), { k: 'hostage', look: 'tourist', at: [-1.7, -24], from: [-3.7, -24], pop: 'side', t: 0.9 }],
    [T([1.7, -33], { look: 'sailor', from: [3.7, -33], pop: 'side' }), T([-0.4, -26], { look: 'sailor', from: [-0.4, -6], pop: 'run', t: 0.3 }), T([-1.7, -24], { look: 'sailor', from: [-3.7, -24], pop: 'side', t: 0.8 })],
    [{ cam: [0, 1.6, -37], look: [0, 1.5, -60], dur: 0.6 }, T([1.7, -45], { look: 'sailor', from: [3.7, -45], pop: 'side' }), T([0.4, -50], { look: 'sailor', from: [0.4, -70], pop: 'run', t: 0.5 })],
  ] },
  { a: 4, type: 'move', to: [0, 1.6, -52], look: [0, 1.5, -75], dur: 3.4, ambush: [
    T([-1.7, -48], { t: 0.6, look: 'sailor', from: [-3.7, -48], pop: 'side' }),
    { k: 'hostage', look: 'tourist', t: 1.6, at: [1.7, -51], from: [3.7, -51], pop: 'side' },
    T([-1.7, -60], { t: 2.4, look: 'sailor', from: [-3.7, -60], pop: 'side' })] },
  { a: 4, type: 'cut', waves: [
    [{ cam: [1.4, 1.6, -54], look: [-7, 1.2, -54], dur: 0.7 }, T([-4.6, -54.8], { look: 'sailor', pop: 'up', drop: 1.2 }), T([-2.4, -53.6], { look: 'sailor', from: [-4.4, -53.0], pop: 'run', t: 0.7, armored: true })],
    [{ cam: [0, 1.6, -54], look: [0, 1.6, -80], dur: 0.6 }, T([-1.7, -60], { look: 'sailor', from: [-3.7, -60], pop: 'side' }), T([-1.7, -66], { look: 'sailor', from: [-3.7, -66], pop: 'side', t: 0.5 }), T([1.7, -63], { look: 'sailor', from: [3.7, -63], pop: 'side', t: 1.0 })],
  ] },
  { a: 4, type: 'move', to: [0, 1.6, -74], look: [0, 1.6, -88], dur: 2.6 },
  { a: 4, type: 'cut', say: 's2_lobby', waves: [
    [T([-4, -87], { look: 'sailor', from: [-4, -89], pop: 'side' }), T([4, -87], { look: 'sailor', from: [4, -89], pop: 'side', t: 0.5 }), T([-2.6, -79.6], { look: 'sailor', from: [-4.5, -80.4], pop: 'side', crouch: true, t: 0.9 })],
    [T([2.8, -79.6], { look: 'sailor', from: [4.5, -80.4], pop: 'side', crouch: true }), T([0.3, -84], { look: 'sailor', from: [0.3, -94], pop: 'run', t: 0.3, armored: true }), T([-7.5, -84], { look: 'sailor', from: [-7.5, -87.5], pop: 'side', t: 0.8 }), { k: 'bonus', at: [7.5, -85], from: [7.5, -87.5], pop: 'side', t: 0.5, mg: true }],
  ] },
  { a: 4, type: 'move', to: [0, 1.6, -85], look: [0, 1.6, -100], dur: 1.8 },
  // ===== 6 健身房 =====
  { a: 5, type: 'move', to: [0, 1.6, -1], look: [0, 1.5, -20], dur: 1.6 },
  { a: 5, type: 'cut', waves: [
    [T([-6.5, -12], { look: 'muscle', from: [-10, -12], pop: 'run' }), T([6.2, -13], { look: 'muscle', from: [8.6, -12], pop: 'side', t: 0.6 })],
    [T([-2.5, -17], { look: 'muscle', from: [-12, -19], pop: 'run' }), T([4, -18], { look: 'muscle', from: [11, -20], pop: 'run', t: 0.5 }), T([-6, -20], { from: [-10, -20], pop: 'run', t: 0.9 })],
  ] },
  { a: 5, type: 'move', to: [0, 1.6, -11], look: [0, 1.8, -30], dur: 2.0 },
  { a: 5, type: 'cut', say: 's2_ring', waves: [
    [T([-2.5, -24.5], { look: 'muscle', y: 0.85, pop: 'up', drop: 1.0 }), T([2.5, -24.5], { look: 'muscle', y: 0.85, pop: 'up', drop: 1.0, t: 0.5 }), { k: 'bonus', at: [0, -30], y: 0.85, pop: 'up', drop: 1.0, t: 0.9 }],
    [T([-3, -28.5], { look: 'muscle', y: 0.85, pop: 'up', drop: 1.0 }), T([3, -27.5], { look: 'muscle', y: 0.85, pop: 'up', drop: 1.0, t: 0.4 }), T([-6.5, -22], { from: [-11, -25], pop: 'run', t: 0.9 }), T([6.5, -23], { from: [11, -26], pop: 'run', t: 1.3 })],
    [T([0.2, -29], { look: 'muscle', y: 0.85, pop: 'up', drop: 1.0 }), T([-5, -21], { look: 'muscle', from: [-11, -20], pop: 'run', t: 0.4 }), T([5, -21.5], { look: 'muscle', from: [11, -19], pop: 'run', t: 0.8 }), { k: 'bonus', at: [-8.5, -33], from: [-11.5, -33], pop: 'side', t: 0.5 }],
  ] },
  { a: 5, type: 'move', to: [8, 1.6, -30], look: [8, 1.5, -50], dur: 2.4 },
  // ===== 7 游泳池 =====
  { a: 6, type: 'move', to: [8, 1.6, -1], look: [4, 1.2, -20], dur: 1.8 },
  { a: 6, type: 'move', to: [0, 1.6, -3], look: [0, 0.6, -22], dur: 1.2 },
  { a: 6, type: 'cut', waves: [
    [D([-2.5, -14]), D([3, -16], 0.7)],
    [D([0.3, -20]), D([-4, -24], 0.4), D([4.2, -22], 0.8), T([-8.5, -22], { look: 'beach', from: [-13, -22], pop: 'run', t: 1.2 })],
    [T([7.5, -16], { look: 'beach', from: [13, -16], pop: 'run' }), D([-1.8, -12], 0.3), { k: 'hostage', look: 'tourist', at: [-7.5, -15], from: [-13, -15], pop: 'run', t: 0.5 }, D([1.2, -28], 0.9, { k: 'bonus' })],
  ] },
  { a: 6, type: 'move', to: [7.5, 1.6, -5], look: [5, 1.2, -30], dur: 1.6 },
  { a: 6, type: 'move', to: [7.5, 1.6, -16], look: [2, 1.2, -34], dur: 1.6 },
  { a: 6, type: 'cut', waves: [
    [D([2.4, -22]), D([0, -28], 0.4), T([8.5, -36.5], { look: 'beach', from: [10, -39.6], pop: 'side', t: 0.8 }), D([3, -30], 1.2)],
    [D([4, -23]), D([5, -26], 0.3), D([-3.5, -29], 0.6), T([12, -34], { look: 'beach', from: [13.5, -39], pop: 'side', t: 1.0, armored: true }), { k: 'bonus', at: [-3.5, -44], from: [-12, -44], pop: 'run', t: 0.5, mg: true }],
  ] },
  { a: 6, type: 'move', to: [7, 1.6, -33], look: [3, 1.5, -50], dur: 1.8 },
  { a: 6, type: 'move', to: [0, 1.6, -43], look: [0, 1.9, -60], dur: 1.6 },
  // ===== 8 舞廳 =====
  { a: 7, type: 'move', to: [0, 1.7, -9], look: [0, 2, -28], dur: 2.2 },
  { a: 7, type: 'cut', waves: [
    [T([-6.2, -27.5], { look: 'disco', y: 1.35, from: [-7.5, -30.5], pop: 'side' }), T([6.2, -27.5], { look: 'disco', y: 1.35, from: [7.5, -30.5], pop: 'side', t: 0.5 }), T([-5, -18], { look: 'disco', from: [-12, -14], pop: 'run', t: 1.0 })],
    [T([5, -17], { look: 'disco', from: [12, -14], pop: 'run' }), T([0.3, -28.8], { look: 'disco', y: 1.35, from: [0.3, -31.2], pop: 'side', crouch: true, t: 0.4 }), T([-3, -21], { look: 'disco', from: [-9, -24], pop: 'run', t: 0.8 }), T([3.5, -22], { look: 'disco', from: [9, -24], pop: 'run', t: 1.1 }), { k: 'bonus', at: [-9, -24.5], from: [-12, -24.5], pop: 'run', t: 0.6 }],
  ] },
  { a: 7, type: 'move', to: [0, 1.7, 1], look: [0, 1.8, -17], dur: 1.4 },
  { a: 7, type: 'boss' },
  { a: 7, type: 'end' },
];
// LEVEL-END

// 把各區的區域座標換成世界座標
const sh2 = (p, o) => p && [p[0] + o[0], p[1] + o[1]];
const sh3 = (p, o) => p && [p[0] + o[0], p[1], p[2] + o[1]];
function shiftSpec(sp, o) {
  if (sp.cam) { sp.cam = sh3(sp.cam, o); sp.look = sh3(sp.look, o); return; }
  if (sp.at) sp.at = sh2(sp.at, o); if (sp.from) sp.from = sh2(sp.from, o); if (sp.to) sp.to = sh2(sp.to, o);
  (sp.riders || []).forEach(r => shiftSpec(r, o));
}
LEVEL.forEach(s => {
  const o = AOFF[s.a];
  if (s.a === 4) [...(s.ambush || []), ...(s.waves || []).flat()].forEach(sp => { if (sp.at && sp.scale === undefined) sp.scale = C.stage2.cabinScale; }); // 客房區天花板低，敵人小一點
  if (s.to) s.to = sh3(s.to, o); if (s.look) s.look = sh3(s.look, o);
  (s.ambush || []).forEach(a => shiftSpec(a, o));
  (s.waves || []).forEach(w => w.forEach(sp => shiftSpec(sp, o)));
});
AREAS.forEach((A, i) => { A.start = sh3(A.start, AOFF[i]); A.look = sh3(A.look, AOFF[i]); });

// 第二關各區的背景音樂（音樂檔，換區時接著播）；Boss 戰的音樂在 spawnBoss 裡
const BGM = { file: 'assets/audio/stage2_bgm.mp3' };
const MUS = [BGM, BGM, BGM, BGM, BGM, BGM, BGM, BGM];
registerStage({ id: 2, name: '偷渡郵輪', en: 'STAGE 2  CRUISE SHIP', desc: '走私集團躲在豪華郵輪上。從沙灘、碼頭一路打進舞廳。',
  brief: { head: '任務檔案 #0614 ／ 代號「末班船」／ 機密', text: ['包裹被送上一艘從未出現在任何航運紀錄裡的豪華郵輪。', '船上有賭場、有舞會，還有一個比誰都會跳舞的男人。', '天亮之前，它就會駛出領海。帶著 [[██████]] 和所有答案。'] },
  areas: AREAS, level: LEVEL, build: () => { build(); buildDyn(); }, floorY: () => 0, spawnBoss, tick, music: MUS, fx: sp => { if (sp.id === 'hint') { hint(sp.text, 2.2); sfx('reveal'); } },
  title: { pos: [AOFF[3][0], 2.4, AOFF[3][1] + 4], look: [AOFF[3][0], 1.2, AOFF[3][1] - 30], sway: 5 } });
})();
