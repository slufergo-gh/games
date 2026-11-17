// 第三關：軍火秘密基地
(() => {
'use strict';
// 歌劇院→隧道→噴水池→白色走廊實際相連；觀測台搭電梯下到實驗室；實驗室後門通往地下瀑布
const AOFF = [[300, 40.8], [300, 0], [300, 0], [300, -100.2], [300, -100.2], [300, -100.2], [1200, 54.8], [1200, 0]];
let OX = 0, OZ = 0;
const B = (x0, x1, y0, y1, z0, z1, c, G_) => blk(x0 + OX, x1 + OX, y0, y1, z0 + OZ, z1 + OZ, c, G_);
const BX = (w, h, d, x, y, z, c, ry, rx, G_) => bx(w, h, d, x + OX, y, z + OZ, c, ry, rx, G_);
const CY = (r, h, x, y, z, c, seg, G_) => cyl(r, h, x + OX, y, z + OZ, c, seg, G_);
const TI = (x0, x1, z0, z1, y, size, a, b) => tiles(x0 + OX, x1 + OX, z0 + OZ, z1 + OZ, y, size, a, b);
const WX = (x0, x1, y0, y1, z, t, c, holes) => wallX(x0 + OX, x1 + OX, y0, y1, z + OZ, t, c, (holes || []).map(h => [h[0] + OX, h[1] + OX, h[2]]));
const PR = (type, x, y, z, c, ry) => prod(type, x + OX, y, z + OZ, c, ry);
const AD = (geo, x, y, z, c, ry, rx, rz, G_) => (G_ || L).add(geo, x + OX, y, z + OZ, c, ry, rx, rz);
const GP = (id, x0, x1, y0, y1, z0, z1) => glassPane(id, x0 + OX, x1 + OX, y0, y1, z0 + OZ, z1 + OZ);
const area = (a) => { curArea = a; OX = AOFF[a][0]; OZ = AOFF[a][1]; L = new Builder(false); G = new Builder(true); };
const done = () => { L.build(); G.build(); };

const AREAS = [
  { name: '歌劇院', en: 'AREA 1  OPERA HOUSE', start: [0, 1.6, 0], look: [0, 2.4, -26],
    env: { bg: 0x1a0c0c, near: 22, far: 80, sky: 0xffe0c0, gnd: 0x4a1a1a, hi: 0.8, sun: 0.0, amb: 0.33 } },
  { name: '地下隧道', en: 'AREA 2  ANCIENT TUNNEL', start: [0, 1.6, 2], look: [0, 1.6, -20],
    env: { bg: 0x0e0c0a, near: 10, far: 50, sky: 0xffc080, gnd: 0x3a2e22, hi: 0.75, sun: 0.0, amb: 0.3 } },
  { name: '地下噴水池', en: 'AREA 3  UNDERGROUND FOUNTAIN', start: [0, 1.6, -50], look: [0, 2, -72],
    env: { bg: 0x101418, near: 20, far: 80, sky: 0xd8e8ff, gnd: 0x3a3430, hi: 0.75, sun: 0.0, amb: 0.3 } },
  { name: '白色走廊', en: 'AREA 4  WHITE CORRIDOR', start: [0, 1.6, 2], look: [0, 1.6, -20],
    env: { bg: 0xc8d4dc, near: 25, far: 90, sky: 0xf4f8ff, gnd: 0x8a98a4, hi: 0.72, sun: 0.0, amb: 0.3 } },
  { name: '玻璃走廊', en: 'AREA 5  GLASS CORRIDOR', start: [0, 1.6, -40], look: [0, 1.6, -60],
    env: { bg: 0xa8b8c4, near: 25, far: 90, sky: 0xf4f8ff, gnd: 0x7a8a98, hi: 0.72, sun: 0.0, amb: 0.3 } },
  { name: '觀測台', en: 'AREA 6  OBSERVATION DECK', start: [0, 1.6, -82], look: [0, 3, -105],
    env: { bg: 0x0a0e18, near: 30, far: 110, sky: 0xc8d8ff, gnd: 0x303848, hi: 0.75, sun: 0.0, amb: 0.33 } },
  { name: '實驗室', en: 'AREA 7  LABORATORY', start: [0, 1.6, 5.8], look: [0, 1.6, -20],
    env: { bg: 0xb8c4cc, near: 22, far: 80, sky: 0xf4f8ff, gnd: 0x80909a, hi: 0.72, sun: 0.0, amb: 0.3 } },
  { name: '地下瀑布', en: 'AREA 8  WATERFALL CAVERN', start: [0, 1.7, 2], look: [0, 7, -30],
    env: { bg: 0x0c1418, near: 40, far: 140, sky: 0xc0e0ff, gnd: 0x283038, hi: 0.75, sun: 0.25, amb: 0.3 } },
];

function statue(x, z, c) {
  B(x - 0.8, x + 0.8, 0, 1.0, z - 0.8, z + 0.8, 0x8a8070);
  B(x - 0.5, x + 0.5, 1.0, 2.2, z - 0.35, z + 0.35, c || 0xb0a890);
  B(x - 0.7, x + 0.7, 2.2, 3.0, z - 0.35, z + 0.35, c || 0xb0a890);
  B(x - 0.25, x + 0.25, 3.0, 3.5, z - 0.25, z + 0.25, c || 0xb0a890);
  B(x - 0.95, x - 0.7, 2.0, 2.9, z - 0.15, z + 0.15, c || 0xb0a890); B(x + 0.7, x + 0.95, 2.0, 2.9, z - 0.15, z + 0.15, c || 0xb0a890);
}
function torch(x, z, side) { B(x - 0.1, x + 0.1, 2.2, 2.8, z - 0.1, z + 0.1, 0x3a2a1a); B(x - 0.15, x + 0.15, 2.8, 3.1, z - 0.15, z + 0.15, 0xffa040, G); }
function crate(x, z, w, h, d, c) { B(x - w / 2, x + w / 2, 0, h, z - d / 2, z + d / 2, c || 0x4a5a3a); B(x - w / 2 - 0.02, x + w / 2 + 0.02, h * 0.45, h * 0.55, z - d / 2 - 0.02, z + d / 2 + 0.02, 0x2a3424); }
function labTable(x, z, w, d) { B(x - w / 2, x + w / 2, 0, 0.82, z - d / 2, z + d / 2, 0xd8dce0); B(x - w / 2 - 0.05, x + w / 2 + 0.05, 0.82, 0.9, z - d / 2 - 0.05, z + d / 2 + 0.05, 0x505860); }
function proto(x, z, ry) { // 製作中的機器人（不會動）
  const y = 0.9;
  B(x - 0.55, x + 0.55, y, y + 0.35, z - 0.9, z + 0.9, 0x7a8088); // 躺著的身體
  B(x - 0.4, x + 0.4, y + 0.35, y + 0.75, z - 0.6, z + 0.6, 0x9aa0a8);
  B(x - 0.3, x + 0.3, y + 0.1, y + 0.5, z - 1.5, z - 0.95, 0xb0b8c0); B(x - 0.2, x + 0.2, y + 0.3, y + 0.4, z - 1.51, z - 1.49, 0xff3020, G);
  B(x - 0.8, x - 0.6, y, y + 0.2, z - 0.6, z + 0.9, 0x606870); B(x + 0.6, x + 0.8, y, y + 0.2, z - 0.6, z + 0.4, 0x606870);
  for (let i = 0; i < 3; i++) B(x - 0.4 + i * 0.4, x - 0.36 + i * 0.4, y + 0.75, 4.5, z - 0.02 + i * 0.1, z + 0.02 + i * 0.1, pick([0xd03030, 0x30a0d0, 0xe0c020])); // 吊著的電線
  B(x - 0.15, x + 0.15, 4.5, 4.7, z - 0.15, z + 0.15, 0x505860);
}
// 電梯車廂：P = 門口中心與方向（u 橫向、v 往車廂裡）
const ELV = { obs: { x: 12.4, z: -90, ux: 0, uz: -1, vx: 1, vz: 0, wt: 0.4, a: 3 }, lab: { x: 0, z: 4.3, ux: 1, uz: 0, vx: 0, vz: 1, wt: 0.3, a: 6 } };
function EB(P, u0, u1, y0, y1, v0, v1, c, G_) {
  const xa = P.x + P.ux * u0 + P.vx * v0, xb = P.x + P.ux * u1 + P.vx * v1, za = P.z + P.uz * u0 + P.vz * v0, zb = P.z + P.uz * u1 + P.vz * v1;
  B(Math.min(xa, xb), Math.max(xa, xb), y0, y1, Math.min(za, zb), Math.max(za, zb), c, G_);
}
function elevCar(P) {
  EB(P, -1.5, 1.5, 0, 0.03, 0, 2.8, 0x8a929a); EB(P, -1.5, 1.5, 2.8, 2.95, 0, 2.8, 0xd8dce0); EB(P, -0.6, 0.6, 2.76, 2.8, 0.9, 1.9, 0xeefaff, G);
  EB(P, -1.65, -1.5, 0, 2.95, 0, 2.95, 0xb8c0c8); EB(P, 1.5, 1.65, 0, 2.95, 0, 2.95, 0xb8c0c8); EB(P, -1.65, 1.65, 0, 2.95, 2.8, 2.95, 0xb8c0c8);
  EB(P, -1.3, 1.3, 0.95, 1.0, 2.7, 2.8, 0xd0d0d0); EB(P, -1.5, -1.45, 0.95, 1.0, 0.4, 2.7, 0xd0d0d0); EB(P, 1.45, 1.5, 0.95, 1.0, 0.4, 2.7, 0xd0d0d0);
  EB(P, 1.38, 1.5, 1.0, 1.6, 0.25, 0.55, 0x404850); EB(P, 1.36, 1.38, 1.1, 1.5, 0.32, 0.48, 0xffb040, G);
  EB(P, -0.4, 0.4, 2.48, 2.66, 0.02, 0.06, 0xff8020, G);
  const w = P.wt; EB(P, -1.25, -1.0, 0, 2.65, -w - 0.06, -w, 0x9aa8b4); EB(P, 1.0, 1.25, 0, 2.65, -w - 0.06, -w, 0x9aa8b4); EB(P, -1.25, 1.25, 2.4, 2.65, -w - 0.06, -w, 0x9aa8b4);
  EB(P, -0.3, 0.3, 2.8, 2.95, -w - 0.06, -w, 0x40e0ff, G); EB(P, -1, 1, -0.05, 0, -w - 0.1, 0.05, 0x8a929a);
}
function tube(x, z) { CY(0.55, 2.6, x, 1.5, z, 0x40e0a0, 10, G); B(x - 0.65, x + 0.65, 0, 0.2, z - 0.65, z + 0.65, 0x505860); B(x - 0.65, x + 0.65, 2.8, 3.0, z - 0.65, z + 0.65, 0x505860); }

let doorL = null, doorR = null, doorT = -1;
function build() {
  // ===== 區域 1：歌劇院 =====
  area(0);
  TI(-14, 14, -36, 4, 0, 2, 0x5a1418, 0x521216);
  B(-14, 14, 12, 12.4, -36, 4, 0x2a1414);
  B(-14.4, -14, 0, 12, -36, 4, 0x5a2a20); B(14, 14.4, 0, 12, -36, 4, 0x5a2a20); WX(-14, 14, 0, 12, -36.2, 0.4, 0x3a1a18, [[-1.6, 1.6, 3.0]]); B(-1.6, 1.6, -0.05, 0, -36.9, -35.9, 0x3a3028);
  for (let i = 0; i < 4; i++) B(-1.2, 1.2, 0, 1.16 - 0.29 * i, -32 - 0.64 * (i + 1), -32 - 0.64 * i, 0x3a2418); // 暗門後的樓梯
  B(-0.4, 0.4, 3.9, 4.0, -34.6, -34.1, 0xffc080, G); B(-1.9, -1.6, 0, 3.2, -36.05, -35.95, 0x6a4a30); B(1.6, 1.9, 0, 3.2, -36.05, -35.95, 0x6a4a30);
  for (let z = -2; z > -17; z -= 1.6) for (const s of [-1, 1]) { B(s * 1.4, s * 11, 0, 0.45, z - 0.35, z + 0.25, 0x8a1a20); B(s * 1.4, s * 11, 0.45, 0.9, z + 0.1, z + 0.3, 0x8a1a20); } // 座位
  B(-12, 12, 0, 1.4, -32, -20, 0x3a2418); B(-12.1, 12.1, 1.4, 1.45, -32, -19.9, 0x6a4a30); // 舞台
  for (const s of [-1, 1]) { B(s * 7, s * 12, 1.45, 11, -21, -20.6, 0x5a2a20); B(s * 6.2, s * 7.4, 1.45, 9, -22.5, -21, 0xa01820); B(s * 7.5, s * 9.5, 1.45, 8, -26, -25.5, 0x8a1418); } // 側幕
  B(-7, 7, 9, 11, -21, -20.6, 0x5a2a20); B(-6.2, 6.2, 8.2, 9, -21.6, -21, 0xa01820); // 鏡框、上幕
  WX(-12, 12, 1.45, 10, -31.8, 0.4, 0x2a3a5a, [[-1.2, 1.2, 3.9]]); B(-10, 10, 4, 8, -31.55, -31.5, 0x3a5a8a); // 布景
  B(-2.45, -1.25, 1.45, 3.9, -31.6, -31.54, 0x201010); // 打開的暗門（舞台後方）
  B(-2.4, 2.4, 1.45, 2.1, -27.4, -26.6, 0x6a5a40); // 布景箱
  B(-1.2, 1.2, 1.38, 1.46, -25.6, -24.4, 0x2a1a10); // 活板門
  for (const s of [-1, 1]) for (const z of [-6, -11, -16]) { B(s * 11.5, s * 14, 4, 4.3, z - 2.2, z + 2.2, 0x6a3a28); B(s * 11.5 - 0.1, s * 11.5 + 0.1, 4.3, 5.1, z - 2.2, z + 2.2, 0xc0a040); B(s * 11.5, s * 14, 4.3, 7, z - 2.3, z - 2.1, 0x5a2a20); } // 包廂
  for (const s of [-1, 1]) for (const z of [-6, -11, -16]) B(s * 13.5, s * 14, 4.3, 7, z - 2.2, z + 2.2, 0x3a1a18);
  AD(new THREE.ConeGeometry(1.6, 1.2, 10), 0, 10.6, -10, 0xffe8a0, 0, Math.PI, 0, G);
  for (let x = -10; x <= 10; x += 4) B(x - 0.3, x + 0.3, 11.6, 11.8, -21.5, -21.2, 0xfff0c0, G);
  B(-12, 12, 0, 1.0, -19.9, -19.5, 0x2a1810); // 樂池欄
  done();

  // ===== 區域 2：地下隧道 + 區域 3：噴水池 =====
  area(1);
  TI(-4, 4, -50, 4, 0, 2, 0x4a4036, 0x443a30);
  B(-4.4, -4, 0, 5, -50, 4, 0x5a4c3c); B(4, 4.4, 0, 5, -50, 4, 0x5a4c3c);
  B(-4, 4, 5, 5.4, -24, 4, 0x3a3028); B(-4, 4, 5, 5.4, -50, -27, 0x3a3028); B(-4, -1.5, 5, 5.4, -27, -24, 0x3a3028); B(1.5, 4, 5, 5.4, -27, -24, 0x3a3028);
  B(-1.7, -1.5, 5, 9, -27.2, -23.8, 0x4a3e30); B(1.5, 1.7, 5, 9, -27.2, -23.8, 0x4a3e30); B(-1.7, 1.7, 5, 9, -27.2, -27, 0x4a3e30); B(-1.7, 1.7, 5, 9, -24, -23.8, 0x4a3e30); B(-1.7, 1.7, 9, 9.2, -27.2, -23.8, 0x1a1410); B(-0.3, 0.3, 8.9, 9, -25.8, -25.2, 0xffc080, G); // 塌陷後露出的洞
  AD(new THREE.BoxGeometry(2, 0.4, 54), -3.4, 4.8, -23, 0x4a3e30, 0, 0, -0.5); AD(new THREE.BoxGeometry(2, 0.4, 54), 3.4, 4.8, -23, 0x4a3e30, 0, 0, 0.5);
  for (let z = 0; z > -50; z -= 8) { torch(-3.85, z, -1); torch(3.85, z - 4, 1); }
  statue(-2.5, -10); statue(2.5, -14, 0x9a9488); statue(-2.6, -21, 0xa8a090); statue(2.6, -27); statue(-2.6, -36, 0x9a9488); statue(2.6, -41);
  for (const [x, z] of [[-3.7, -16], [3.7, -20], [-3.7, -30], [3.7, -34]]) { B(x - 0.08, x + 0.08, 1.4, 3.0, z - 1.0, z + 1.0, 0xc0a040); B(x - 0.06, x + 0.06, 1.55, 2.85, z - 0.85, z + 0.85, pick([0x5a3a2a, 0x2a4a5a, 0x6a5a2a])); } // 畫
  for (const [x, z] of [[1.6, -8], [-1.8, -17], [1.8, -24], [-1.8, -31]]) { B(x - 0.3, x + 0.3, 0, 0.9, z - 0.3, z + 0.3, 0x8a8070); PR('flask', x, 0.9, z, pick([0x3a7aaa, 0xaa4a3a, 0xc0a040])); } // 花瓶台
  B(-1, 1, 0, 0.7, -45, -43, 0x6a5a48); // 石棺
  // 噴水池大廳
  TI(-14, 14, -84, -50, 0, 2, 0x504a42, 0x4a443c);
  WX(-14, 14, 0, 10, -50, 0.4, 0x5a4c3c, [[-4, 4, 5]]);
  B(-14.4, -14, 0, 10, -84, -50, 0x5a4c3c); B(14, 14.4, 0, 10, -84, -50, 0x5a4c3c); B(-14, 14, 10, 10.4, -84, -50, 0x2a2420);
  CY(4, 0.7, 0, 0.35, -66, 0x8a8070, 16); CY(3.6, 0.1, 0, 0.66, -66, 0x3a8ac0, 16, G); CY(0.7, 4.5, 0, 2.6, -66, 0x9a9080, 8); CY(1.4, 0.3, 0, 4.9, -66, 0x9a9080, 10); CY(0.3, 1.2, 0, 5.6, -66, 0x9a9080, 6);
  for (const [x, z] of [[-9, -56], [9, -56], [-10, -68], [10, -68], [-9, -78], [9, -78]]) { CY(0.8, 10, x, 5, z, 0x8a8070, 8); B(x - 1, x + 1, 0, 0.5, z - 1, z + 1, 0x7a7060); }
  // 盡頭的石門（藏在噴水池後面的入口）與兩側壁泉
  WX(-14, 14, 0, 10, -84, 0.4, 0x5a4c3c, [[-3, 3, 5.2]]);
  B(-3.6, -3, 0, 5.8, -84.3, -83.6, 0x8a7a64); B(3, 3.6, 0, 5.8, -84.3, -83.6, 0x8a7a64); B(-3.6, 3.6, 5.2, 5.8, -84.3, -83.6, 0x8a7a64);
  B(-1.2, 1.2, 5.85, 6.6, -84.0, -83.7, 0x9a7a3a); // 門楣上的青銅徽章
  for (const x of [-7.5, 7.5]) {
    B(x - 1.6, x + 1.6, 0, 0.6, -83.6, -81.8, 0x8a8070); B(x - 1.4, x + 1.4, 0.5, 0.56, -83.5, -82.0, 0x3a8ac0, G); // 壁泉水盆
    B(x - 0.5, x + 0.5, 2.6, 3.4, -83.6, -83.2, 0x9a9080); B(x - 0.2, x + 0.2, 2.7, 2.95, -83.2, -82.9, 0x9a7a3a); // 獸頭出水口
    B(x - 0.12, x + 0.12, 0.55, 2.75, -82.95, -82.75, 0x7ac0f0, G); // 流下來的水
  }
  crate(-6, -80, 1.6, 1.3, 1.6); crate(6.2, -80.5, 2.2, 1.1, 1.4, 0x5a5a4a); crate(-11, -73, 1.8, 1.2, 1.8);
  TI(-3, 3, -96, -84.2, 0, 2, 0xd8dce0, 0xd0d4d8); B(-3.2, -3, 0, 5.2, -96, -84.2, 0xe8ecf0); B(3, 3.2, 0, 5.2, -96, -84.2, 0xe8ecf0); B(-3, 3, 5.2, 5.4, -96, -84.2, 0xf0f4f8);
  done();

  // ===== 區域 4～6：白色走廊、玻璃走廊、觀測台 =====
  area(3);
  TI(-3, 3, -90, 4, 0, 1, 0xe4e8ec, 0xdce0e4);
  B(-3, 3, 4, 4.2, -90, 4, 0xf4f8fa);
  for (let z = 2; z > -88; z -= 3) { B(-0.6, 0.6, 3.96, 4.0, z - 1.2, z, 0xe0f8ff, G); B(-3, 3, 0.01, 0.02, z - 0.05, z, 0x60d0ff, G); }
  B(-3.2, 3.2, 4.0, 5.4, 4.0, 4.2, 0xe8ecf0); B(-3, 3, -0.05, 0, 3.9, 4.3, 0xd0d4d8); // 和石門通道的接縫
  // 白色走廊兩側：有凹進去的門
  for (const s of [-1, 1]) {
    const hs = s < 0 ? [-8, -18, -28] : [-13, -23, -33];
    let z = 4; hs.forEach(hz => { B(s * 3 - 0.1, s * 3 + 0.1, 0, 4, hz + 1.0, z, 0xeef2f4); z = hz - 1.0; });
    B(s * 3 - 0.1, s * 3 + 0.1, 0, 4, -40, z, 0xeef2f4);
    hs.forEach(hz => { B(Math.min(s * 3, s * 4.4), Math.max(s * 3, s * 4.4), 0, 4, hz - 1.1, hz - 1.0, 0xd0d8dc); B(Math.min(s * 3, s * 4.4), Math.max(s * 3, s * 4.4), 0, 4, hz + 1.0, hz + 1.1, 0xd0d8dc); B(s * 4.4 - 0.1, s * 4.4 + 0.1, 0, 4, hz - 1.1, hz + 1.1, 0x9aa8b4); B(Math.min(s * 3, s * 4.4), Math.max(s * 3, s * 4.4), 3.9, 4, hz - 1.1, hz + 1.1, 0xd0d8dc); B(s * 2.95, s * 3.0, 3.3, 3.5, hz - 0.9, hz + 0.9, 0xff5030, G); });
    B(s * 2.9 - 0.05, s * 2.9 + 0.05, 1.0, 1.06, -40, 4, 0x60d0ff, G);
  }
  B(-1.4, -0.4, 0, 1.0, -21, -20, 0xb8c4cc); B(0.6, 1.8, 0, 0.9, -30, -29, 0xb8c4cc); // 補給箱
  // 玻璃走廊（左邊是玻璃，外面是機器狗的格納庫）
  B(3, 3.2, 0, 4, -84, -40, 0xeef2f4);
  for (let z = -40; z > -84; z -= 4) { B(-3.15, -2.95, 0, 4, z - 0.15, z + 0.15, 0xb0bcc8); B(-3.15, -2.95, 0, 0.5, z - 4, z, 0xb0bcc8); }
  for (let i = 0; i < 11; i++) { const z = -40 - i * 4; GP('g' + i, -3.05, -3.05, 0.5, 4, z - 3.85, z - 0.15); }
  TI(-14, -3, -84, -40, -0.02, 2, 0x5a646e, 0x56606a); B(-14, -3, 6, 6.2, -84, -40, 0x3a424a); B(-14.4, -14, 0, 6, -84, -40, 0x6a747e);
  for (let z = -44; z > -82; z -= 6) { B(-12, -8, 0, 0.3, z - 1.5, z + 1.5, 0x30383e); B(-12, -11.8, 0.3, 2.8, z - 1.5, z + 1.5, 0x8a949e); B(-9, -8.6, 2.5, 2.8, z - 1.2, z + 1.2, 0xffa020, G); } // 充電台
  for (let z = -42; z > -84; z -= 8) B(-10, -6, 5.9, 6, z - 0.5, z, 0xfff0d0, G);
  // 觀測台：前方是大窗戶，外面是巨大的豎井
  WX(-14, 14, 0, 9, -84, 0.3, 0xe8ecf0, [[-3, 3, 4]]);
  TI(-12, 12, -96, -84.2, 0, 2, 0xd8dce0, 0xd0d4d8);
  B(-12.4, -12, 0, 6, -96, -84, 0xe8ecf0); B(12, 12.4, 0, 6, -96, -91, 0xe8ecf0); B(12, 12.4, 0, 6, -89, -84, 0xe8ecf0); B(12, 12.4, 2.4, 6, -91, -89, 0xe8ecf0); B(-12, 12, 6, 6.3, -96, -84, 0xf0f4f8);
  elevCar(ELV.obs); B(11.95, 12, 3.0, 3.3, -90.6, -89.4, 0x40ff80, G); // 往實驗室的電梯
  B(-12, 12, 0, 1.0, -96.2, -95.8, 0xc8d0d8); B(-12, 12, 4.8, 6, -96.2, -95.8, 0xc8d0d8); for (const x of [-12, -9.5, 9.5, 12]) B(x - 0.15, x + 0.15, 1.0, 4.8, -96.2, -95.8, 0xc8d0d8); // 窗框（中間不放，免得擋到無人機）
  B(-8, -4, 0, 1.0, -88, -87, 0xb8c4cc); B(4, 8, 0, 1.0, -89, -88, 0xb8c4cc); // 控制台
  B(-80, 80, -30, -29, -260, -96.5, 0x101820); for (let i = 0; i < 40; i++) B(-60 + i * 3, -59.5 + i * 3, -5, 30, -170, -169.5, pick([0x1a2430, 0x202a38]));
  for (let i = 0; i < 30; i++) { const x = rand(-50, 50), y = rand(-20, 25); B(x - 0.15, x + 0.15, y - 0.15, y + 0.15, -168, -167.8, pick([0xff3020, 0x40e0ff, 0xffe080]), G); }
  done();

  // ===== 區域 7：實驗室 =====
  area(6);
  TI(-14, 14, -44, 4, 0, 2, 0xe0e4e8, 0xd8dce0);
  B(-14, 14, 6, 6.2, -44, 4, 0xf4f8fa);
  // 左牆：中間一段是可以炸開的牆（後面有小房間），後段有高處通風口
  B(-14.4, -14, 0, 6, -18, 4, 0xe8ecf0); B(-14.4, -14, 3.2, 6, -22, -18, 0xe8ecf0); B(-14.4, -14, 0, 6, -33, -22, 0xe8ecf0); B(-14.4, -14, 0, 3.0, -35, -33, 0xe8ecf0); B(-14.4, -14, 4.2, 6, -35, -33, 0xe8ecf0); B(-14.4, -14, 0, 6, -44, -35, 0xe8ecf0);
  B(-19, -14.4, 0, 0.02, -23, -17, 0x505860); B(-19.2, -19, 0, 3.4, -23, -17, 0x6a747e); B(-19, -14.4, 0, 3.4, -23.2, -23, 0x6a747e); B(-19, -14.4, 0, 3.4, -17, -16.8, 0x6a747e); B(-19, -14.4, 3.2, 3.4, -23, -17, 0x4a525a);
  crate(-18, -22, 1.2, 1.0, 1.2); crate(-18.2, -17.9, 1.0, 1.4, 1.0, 0x5a5a4a); B(-17, -16.4, 3.1, 3.2, -20.3, -19.7, 0xfff0d0, G);
  // 右牆：前段高處通風口
  B(14, 14.4, 0, 6, -7, 4, 0xe8ecf0); B(14, 14.4, 0, 3.0, -9, -7, 0xe8ecf0); B(14, 14.4, 4.2, 6, -9, -7, 0xe8ecf0); B(14, 14.4, 0, 6, -44, -9, 0xe8ecf0);
  for (const [s, z0] of [[1, -9], [-1, -35]]) { const a = s * 14.4, b = s * 16; B(Math.min(a, b), Math.max(a, b), 2.95, 3.0, z0, z0 + 2, 0x30383e); B(Math.min(a, b), Math.max(a, b), 4.2, 4.25, z0, z0 + 2, 0x30383e); B(b - 0.05, b + 0.05, 3, 4.2, z0, z0 + 2, 0x20262c); B(Math.min(a, b), Math.max(a, b), 3, 4.2, z0 - 0.05, z0, 0x30383e); B(Math.min(a, b), Math.max(a, b), 3, 4.2, z0 + 2, z0 + 2.05, 0x30383e); B(s * 13.98 - 0.02, s * 13.98 + 0.02, 2.9, 3.0, z0 - 0.1, z0 + 2.1, 0x9aa8b4); BX(0.04, 1.0, 1.9, s * 13.7, 2.4, z0 + 1, 0x8a949e, 0, 0.0); }
  WX(-14, 14, 0, 6, -44.2, 0.4, 0xe8ecf0, [[-1.5, 1.5, 2.4]]); WX(-14, 14, 0, 6, 4.15, 0.3, 0xe8ecf0, [[-1, 1, 2.4]]);
  elevCar(ELV.lab); B(-1.8, -1.5, 0, 2.6, -43.95, -43.9, 0xffc040, G); B(1.5, 1.8, 0, 2.6, -43.95, -43.9, 0xffc040, G); B(-1.8, 1.8, 2.4, 2.6, -43.95, -43.9, 0xffc040, G);
  for (let z = 0; z > -42; z -= 6) for (const x of [-8, 0, 8]) B(x - 1.5, x + 1.5, 5.95, 6, z - 0.4, z + 0.4, 0xeefaff, G);
  labTable(-5, -10, 3.2, 1.6); labTable(5.5, -12, 3.2, 1.6); labTable(-6, -24, 3.2, 1.6); labTable(6, -26, 3.2, 1.6); labTable(0, -34, 4, 1.6);
  for (const [x, z] of [[-5, -10], [5.5, -12], [-6, -24], [6, -26]]) proto(x, z);
  for (const [x, z] of [[-1, -34], [1.2, -34.3]]) { PR('flask', x, 0.9, z, 0x40e0a0); PR('flask', x + 0.4, 0.9, z + 0.2, 0xe040a0); }
  for (const [x, z] of [[-4.3, -9.6], [6.3, -11.6], [-5.2, -23.6], [6.8, -25.5]]) PR('flask', x, 0.9, z, pick([0x40e0a0, 0x40a0e0, 0xe0c040]));
  for (const z of [-6, -16, -30, -38]) { tube(-12.4, z); tube(12.4, z); }
  for (let x = -10; x <= 10; x += 2.5) { if (Math.abs(x) < 2) continue; B(x - 1, x + 1, 0, 1.0, -43.4, -42.6, 0xb8c4cc); B(x - 0.8, x + 0.8, 1.3, 2.3, -43.6, -43.5, 0x2060a0, G); } // 電腦
  done();

  // ===== 區域 8：地下瀑布 =====
  area(7);
  TI(-40, 40, -60, 10, 0, 4, 0x3a3a38, 0x363634);
  B(-40, 40, -2, -0.3, -80, -60, 0x1a5a7a); B(-40, 40, -0.32, -0.3, -80, -60, 0x2a7aa0, G); // 瀑布底的水潭
  B(-44, -40, 0, 40, -80, 10, 0x30302c); B(40, 44, 0, 40, -80, 10, 0x30302c);
  for (let i = 0; i < 18; i++) { const x = rand(-38, 38), z = rand(-55, -2); if (Math.abs(x) < 16 && z > -40) continue; B(x - rand(1, 3), x + rand(1, 3), 0, rand(1, 5), z - rand(1, 3), z + rand(1, 3), pick([0x3a3834, 0x45423c])); }
  B(-40, -20, 0, 40, -82, -80, 0x30302c); B(20, 40, 0, 40, -82, -80, 0x30302c);
  WX(-44, 44, 0, 40, 10.2, 0.4, 0x30302c, [[-1.5, 1.5, 2.4]]); B(-1.5, 1.5, -0.05, 0, 9.9, 10.9, 0x3a3a38); // 和實驗室相連的前壁
  for (const s of [-1, 1]) B(s * 3 - 0.4, s * 3 + 0.4, 0, 0.6, -8, -6, 0x4a4840); // 小掩體
  done();
}

// 會動的東西：石門、瀑布、Boss 用的石柱
let fall = null, fallTex = null, pillars = [];
// 會掉下來／飛出去的碎塊（天花板塌陷、炸開的牆）
let chunks = [], elev = {};
function mkChunks(tag, list, mat) {
  list.forEach(([x, y, z, w, h, d]) => { const m = stageObj(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); m.position.set(x, y, z); chunks.push({ tag, m, base: V3(x, y, z), vel: V3(), spin: V3(), on: false, size: Math.min(w, h, d) }); });
}
function buildDyn() {
  chunks = []; elev = {};
  { // 隧道天花板（洞上面的蓋子）
    const o = AOFF[1], L2 = [], mat = new THREE.MeshLambertMaterial({ color: 0x3a3028 });
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) L2.push([o[0] - 1 + i, 5.2, o[1] - 24.75 - j * 1.5, 1.0, 0.4, 1.5]);
    for (let i = 0; i < 8; i++) L2.push([o[0] + rand(-1.3, 1.3), 5.3, o[1] + rand(-26.8, -24.2), 0.3, 0.25, 0.3]);
    mkChunks('collapse', L2, mat);
  }
  { // 實驗室可以炸開的牆
    const o = AOFF[6], L2 = [], mat = new THREE.MeshLambertMaterial({ color: 0xe0e4e8 });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) L2.push([o[0] - 14.2, 0.533 + j * 1.067, o[1] - 18.5 - i, 0.4, 1.06, 0.99]);
    mkChunks('wall', L2, mat);
  }
  // 電梯門
  const dm = new THREE.MeshLambertMaterial({ color: 0xa8b4c0 }), lm2 = new THREE.MeshBasicMaterial({ color: 0x40e0ff });
  for (const key of ['obs', 'lab']) {
    const P = ELV[key], o = AOFF[P.a], panels = [];
    for (const sd of [-1, 1]) {
      const g = new THREE.Group(); const geo = P.ux ? new THREE.BoxGeometry(1.05, 2.4, 0.06) : new THREE.BoxGeometry(0.06, 2.4, 1.05);
      g.add(new THREE.Mesh(geo, dm)); const st = new THREE.Mesh(P.ux ? new THREE.BoxGeometry(0.04, 2.2, 0.07) : new THREE.BoxGeometry(0.07, 2.2, 0.04), lm2);
      const ou = -sd * 0.48; st.position.set(P.ux * ou, 0, P.uz * ou); g.add(st);
      panels.push({ g: stageObj(g), sd });
    }
    elev[key] = { P, o, panels, k: key === 'obs' ? 1 : 0, target: key === 'obs' ? 1 : 0 };
    placeElev(elev[key]);
  }
  const o = AOFF[2], m = new THREE.MeshLambertMaterial({ color: 0x6e604c }), lm = new THREE.MeshLambertMaterial({ color: 0x9a7a3a }); // 石門（青銅鑲邊）
  const mk = (x) => { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.BoxGeometry(3, 5.2, 0.3), m); p.position.y = 2.6; g.add(p); const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.6, 0.32), lm); l.position.set(x > 0 ? -1.3 : 1.3, 2.6, 0); g.add(l); g.position.set(o[0] + x, 0, -84 + o[1]); return stageObj(g); };
  doorL = mk(-1.5); doorR = mk(1.5); doorT = -1;
  // 瀑布（用會捲動的貼圖）
  const c = document.createElement('canvas'); c.width = 32; c.height = 64; const x = c.getContext('2d');
  for (let i = 0; i < 64; i++) for (let j = 0; j < 32; j++) { const v = 170 + Math.random() * 85; x.fillStyle = `rgb(${v * 0.75 | 0},${v * 0.9 | 0},${v | 0})`; x.fillRect(j, i, 1, 1); }
  fallTex = new THREE.CanvasTexture(c); fallTex.wrapS = fallTex.wrapT = THREE.RepeatWrapping; fallTex.repeat.set(8, 4); fallTex.magFilter = THREE.NearestFilter;
  fall = stageObj(new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ map: fallTex })));
  fall.position.set(AOFF[7][0], 20, -80.5);
  // 石柱
  pillars = [];
  const pm = new THREE.MeshLambertMaterial({ color: 0x8a8274 });
  for (const px of [-9, 9, 0]) {
    const g = new THREE.Group(); g.position.set(AOFF[7][0] + px, 0, -40);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 16, 8), pm); col.position.y = 8; g.add(col);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 4), pm); cap.position.y = 16.3; g.add(cap);
    const crack = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.5, 3.3), new THREE.MeshBasicMaterial({ color: 0xff8020 })); crack.position.y = 5; crack.visible = false; g.add(crack);
    const hb = new THREE.Mesh(new THREE.BoxGeometry(4.2, 14, 4.2), HB_MAT); hb.position.y = 8; g.add(hb); hb.userData.boss = true; hb.userData.part = 'pillar';
    stageObj(g); pillars.push({ g, crack, hb, x: px, base: g.position.clone(), state: 'up', hp: 0 });
  }
}
function placeElev(E) {
  const { P, o } = E;
  E.panels.forEach(p => { const u = p.sd * lerp(0.52, 1.55, easeIO(E.k)); p.g.position.set(o[0] + P.x + P.ux * u + P.vx * 0.1, 1.2, o[1] + P.z + P.uz * u + P.vz * 0.1); });
}
function resetDyn() {
  chunks.forEach(c => { c.on = false; c.m.position.copy(c.base); c.m.rotation.set(0, 0, 0); c.m.visible = true; });
  for (const key in elev) { const E = elev[key]; E.k = E.target = key === 'obs' ? 1 : 0; placeElev(E); }
  doorT = -1; if (doorL) { doorL.position.x = AOFF[2][0] - 1.5; doorR.position.x = AOFF[2][0] + 1.5; }
  pillars.forEach(p => { p.g.quaternion.identity(); p.g.position.copy(p.base); p.state = 'up'; p.crack.visible = false; p.g.visible = true; });
}
function fx(sp) {
  if (sp.id === 'door') { doorT = 0; sfx('reveal'); }
  if (sp.id === 'hint') { hint(sp.text, 2.4); sfx('reveal'); }
  if (sp.id === 'collapse' || sp.id === 'wall') { // 碎塊開始飛
    chunks.forEach(c => { if (c.tag !== sp.id) return; c.on = true;
      c.vel.set(rand(-1, 1), rand(-0.5, 1), rand(-1, 1)); if (sp.id === 'wall') c.vel.set(rand(3, 7), rand(1, 4), rand(-2, 2));
      c.spin.set(rand(-6, 6), rand(-6, 6), rand(-6, 6)); });
    sfx('boom'); shakeT = 0.6; shakeA = 0.08;
    const p = sp.id === 'wall' ? V3(AOFF[6][0] - 14, 1.5, AOFF[6][1] - 20) : V3(AOFF[1][0], 5, AOFF[1][1] - 25.5);
    for (let i = 0; i < 6; i++) spark(p.clone().add(V3(rand(-1, 1), rand(-1, 1), rand(-1.5, 1.5))), 0xc0b8a0);
  }
  if (sp.id === 'elevClose') { elev.obs.target = 0; sfx('reveal'); }
  if (sp.id === 'elevOpen') { elev.lab.target = 1; sfx('reveal'); }
  if (sp.id === 'ride') { shakeT = 1.2; shakeA = 0.01; sfx('charge'); }
}
function tick(dt) {
  chunks.forEach(c => { if (!c.on) return; c.vel.y -= 14 * dt; c.m.position.addScaledVector(c.vel, dt); c.m.rotation.x += c.spin.x * dt; c.m.rotation.y += c.spin.y * dt; c.m.rotation.z += c.spin.z * dt;
    if (c.m.position.y <= c.size / 2) { c.m.position.y = c.size / 2; if (Math.abs(c.vel.y) > 2) { c.vel.y *= -0.25; c.vel.x *= 0.5; c.vel.z *= 0.5; c.spin.multiplyScalar(0.4); } else { c.on = false; c.m.rotation.x = Math.round(c.m.rotation.x / (Math.PI / 2)) * Math.PI / 2; c.m.rotation.z = Math.round(c.m.rotation.z / (Math.PI / 2)) * Math.PI / 2; } } });
  for (const key in elev) { const E = elev[key]; if (E.k !== E.target) { E.k = E.target > E.k ? Math.min(E.target, E.k + dt / 0.9) : Math.max(E.target, E.k - dt / 0.9); placeElev(E); } }
  if (fallTex) fallTex.offset.y += dt * 1.6;
  if (doorT >= 0 && doorT < 1) { doorT = Math.min(1, doorT + dt / 1.2); const k = easeIO(doorT); doorL.position.x = AOFF[2][0] - 1.5 - k * 3; doorR.position.x = AOFF[2][0] + 1.5 + k * 3; }
}

// ================= Boss：鋼鐵巨像 泰坦 =================
const BC = () => C.boss3;
function spawnBoss() {
  const ox = AOFF[7][0], c = BC();
  const R = new THREE.Group(); R.position.set(ox, 0, -26); scene.add(R);
  const mats = [];
  const M = (col, basic) => { const m = basic ? new THREE.MeshBasicMaterial({ color: col }) : new THREE.MeshLambertMaterial({ color: col }); mats.push(m); return m; };
  const add = (geo, m, x, y, z, p) => { const s = new THREE.Mesh(geo, m); s.position.set(x, y, z); (p || R).add(s); return s; };
  const body = M(0x5a6470), dark = M(0x2a2e34), trim = M(0xd0a020), glow = M(0xff3020, true), cyan = M(0x40e0ff, true);
  // 腳
  const legs = [];
  for (const s of [-1, 1]) {
    const lg = new THREE.Group(); lg.position.set(s * 2.6, 0, 0); R.add(lg);
    add(BXG(2.0, 6.2, 2.2), body, 0, 3.1, 0, lg); add(BXG(2.6, 1.0, 3.2), dark, 0, 0.5, 0.3, lg);
    const hatch = add(BXG(1.2, 1.4, 0.1), cyan, 0, 3.4, 1.12, lg);
    add(BXG(2.1, 0.3, 2.3), trim, 0, 5.2, 0, lg);
    const hb = add(BXG(2.4, 6.4, 2.6), HB_MAT, 0, 3.2, 0, lg); hb.userData.boss = true; hb.userData.part = 'leg';
    legs.push({ g: lg, hatch, hb, s });
  }
  // 身體
  const torso = new THREE.Group(); torso.position.set(0, 6.2, 0); R.add(torso);
  add(BXG(3.6, 1.2, 2.4), dark, 0, 0.6, 0, torso);
  add(BXG(6.0, 4.2, 3.4), body, 0, 3.3, 0, torso); add(BXG(6.1, 0.4, 3.5), trim, 0, 1.4, 0, torso);
  add(BXG(2.4, 1.4, 0.2), cyan, 0, 3.8, 1.75, torso); // 駕駛艙
  const tHB = add(BXG(6.2, 5.6, 3.6), HB_MAT, 0, 2.8, 0, torso); tHB.userData.boss = true; tHB.userData.part = 'armor';
  // 頭
  const head = new THREE.Group(); head.position.set(0, 5.4, 0); torso.add(head);
  add(BXG(2.4, 1.7, 2.2), body, 0, 0.85, 0, head); add(BXG(1.9, 0.35, 0.1), glow, 0, 1.0, 1.12, head);
  const charge = add(new THREE.SphereGeometry(0.35, 8, 6), M(0xff4020, true), 0, 0.5, 1.25, head); charge.visible = false;
  const hHB = add(BXG(2.6, 1.9, 2.4), HB_MAT, 0, 0.85, 0, head); hHB.userData.boss = true; hHB.userData.part = 'head';
  // 手臂（可 360 度旋轉）
  const arms = [];
  for (const s of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(s * 3.6, 4.4, 0.4); torso.add(pv);
    add(BXG(1.6, 1.6, 1.6), trim, 0, 0, 0, pv);
    add(BXG(1.1, 5.0, 1.1), body, 0, -2.8, 0, pv);
    const pod = add(BXG(1.9, 1.6, 1.9), dark, 0, -5.9, 0, pv);
    for (let i = 0; i < 4; i++) add(BXG(0.3, 0.2, 0.3), M(0xffa020, true), -0.45 + (i % 2) * 0.9, -6.75, -0.45 + Math.floor(i / 2) * 0.9, pv);
    const tip = new THREE.Object3D(); tip.position.set(0, -6.9, 0.3); pv.add(tip);
    const hb = add(BXG(2.4, 7.6, 2.4), HB_MAT, 0, -3.6, 0, pv); hb.userData.boss = true; hb.userData.part = 'arm'; hb.userData.side = s;
    arms.push({ pv, hb, tip, s, hp: Math.round(c.armHp * diff().bossHpMul), alive: true, ang: s < 0 ? 0 : Math.PI, st: 'rest', st_t: rand(...c.armRest) * 0.5 + (s > 0 ? 1.4 : 0), spinV: 0, fired: false, rockets: [], flash: 0 });
  }
  const b = { R, legs, torso, head, charge, arms, mats, tHB, hHB, phase: 'intro', t: 0, alive: true, done: false, hitFlash: 0, armorT: 0,
    form: null, formOK: 0, formRound: 0, pillar: null, pillarsDone: 0, laserT: 0, ox };
  $('bossbar').style.display = 'block';
  setMusic(BOSS_BGM);
  bigText('鋼鐵巨像 泰坦', '', 2.4); sayKey('s3boss', 2); sayKey('s3bossArms', 2);
  b.update = dt => upd(b, dt);
  b.hit = (ud, point, o) => hit(b, ud, point, o);
  b.targets = () => targets(b);
  b.aimers = () => aimers(b);
  b.cleanup = () => { scene.remove(R); if (b.form) b.form.drones.forEach(d => scene.remove(d.g)); if (b.beam) scene.remove(b.beam); };
  b.botTarget = () => botTarget(b);
  updBar(b);
  return b;
}
function updBar(b) {
  const c = BC(); let k = 1, name = 'BOSS　鋼鐵巨像 泰坦';
  if (b.phase === 'arms' || b.phase === 'intro') { k = (b.arms.reduce((s, a) => s + Math.max(0, a.hp), 0)) / (Math.round(c.armHp * diff().bossHpMul) * 2); name += '（雙臂）'; }
  else if (b.phase === 'legs' || b.phase === 'legsIntro') { k = 1 - b.formOK / c.formations; name += '（腳部）'; }
  else if (b.phase === 'head' || b.phase === 'collapse') { k = 1 - b.pillarsDone / c.pillars; name += '（頭部）'; }
  else k = 0;
  $('bossName').textContent = name; $('bossfill').style.width = Math.max(0, k * 100) + '%';
}
function targets(b) {
  const list = [];
  if (!b.alive) return list;
  if (b.phase === 'arms') b.arms.forEach(a => { if (a.alive) list.push(a.hb); });
  if (b.phase === 'legs' && b.form) b.form.drones.forEach(d => { if (d.alive) list.push(d.hb); });
  if (b.phase === 'head' && b.pillar && b.pillar.state === 'active') list.push(b.pillar.hb);
  if (b.phase === 'arms' || b.phase === 'legs') list.push(b.tHB);
  if (b.phase === 'head') list.push(b.hHB);
  return list;
}
function aimers(b) {
  const out = [];
  if (b.phase === 'legs' && b.form && b.form.state === 'hold') { const d = b.form.drones.find(x => x.special && x.alive); if (d) out.push({ h: { body: d.g, root: d.g }, t: b.form.t, wait: b.form.wait, state: 'aim', ringY: 0 }); }
  if (b.phase === 'head' && b.pillar && b.pillar.state === 'active') out.push({ h: { body: b.pillar.ring, root: b.pillar.g }, t: b.laserT, wait: b.laserWait, state: 'aim', ringY: 0 });
  return out;
}
function botTarget(b) {
  if (b.phase === 'arms') { const a = b.arms.find(x => x.alive && x.st === 'spin'); return a ? a.pv.localToWorld(V3(0, -5.6, 0)) : null; }
  if (b.phase === 'legs' && b.form && b.form.state === 'hold') { const d = b.form.drones.find(x => x.special && x.alive); return d ? d.g.position.clone() : null; }
  if (b.phase === 'head' && b.pillar && b.pillar.state === 'active') return b.pillar.ring.getWorldPosition(V3(0, 0, 0));
  return null;
}
function flash(b) { b.hitFlash = 0.08; b.mats.forEach(m => m.emissive && m.emissive.setHex(0x442200)); }
function hit(b, ud, point, o) {
  if (!b.alive) return false;
  const c = BC();
  if (ud.part === 'armor' || ud.part === 'head') {
    spark(point, 0xc0c8d0); sfx('metal');
    if (b.armorT <= 0) { popup(b.phase === 'arms' ? '打旋轉的手臂！' : b.phase === 'legs' ? '打顏色不一樣的無人機！' : '打後面的石柱！', point, '#c0d0ff'); b.armorT = 1.5; }
    return ud.part !== 'head'; // 頭部階段子彈會穿過去打到後面的石柱
  }
  if (ud.part === 'arm') {
    const a = b.arms.find(x => x.hb === o); if (!a || !a.alive) return false;
    if (a.st !== 'spin') { spark(point, 0xc0c8d0); sfx('metal'); return true; } // 只有正在旋轉的手臂打得動
    if (a.rockets.some(g => grenades.includes(g) && !g.dead)) { // 飛彈還在飛：要先打掉
      spark(point, 0xc0c8d0); sfx('metal'); if (b.armorT <= 0) { if (!b.rocketSaid) { b.rocketSaid = true; sayKey('s3bossRocket', 2); } b.armorT = 1.0; } return true;
    }
    a.hp--; a.flash = 0.08; sfx('armor'); spark(point, 0xffe0a0); combo++; maxCombo = Math.max(maxCombo, combo); score += 50; updHud(); flash(b);
    if (a.hp <= 0) breakArm(b, a);
    updBar(b); return true;
  }
  if (ud.part === 'fdrone') {
    const d = ud.fd; if (!d || !d.alive || !b.form) return false;
    if (d.special) {
      b.form.drones.forEach(x => { if (x.alive) { x.alive = false; explode(x.g.position.clone(), x.special ? 2.2 : 1.2); scene.remove(x.g); } });
      b.formOK++; b.form.state = 'cleared'; b.form.t = 0;
      addScore(C.score.formation, point, '命中！', '#80ffff');
      const lg = b.legs[b.formOK % 2]; explode(lg.g.localToWorld(V3(0, 3.4, 1.2)), 2.5);
      if (b.formOK >= c.formations) startCollapse(b);
      updBar(b);
    } else {
      d.alive = false; explode(d.g.position.clone(), 1.0); scene.remove(d.g); addScore(60, point, '', '#c0e0ff');
    }
    return true;
  }
  if (o === (b.pillar && b.pillar.hb)) {
    const p = b.pillar; p.hp--; spark(point, 0xd0c0a0); sfx('prop'); combo++; maxCombo = Math.max(maxCombo, combo); score += 50; updHud();
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(sparkGeo, new THREE.MeshLambertMaterial({ color: 0x8a8274 })); m.scale.setScalar(4); m.position.copy(point); scene.add(m); fxs.push({ kind: 'fall', mesh: m, vel: V3(rand(-2, 2), rand(1, 3), rand(1, 3)), spin: V3(rand(-5, 5), 0, rand(-5, 5)), t: 0, floor: 0.1, life: 1.5 }); }
    if (p.hp <= 0) { p.state = 'falling'; p.t = 0; p.crack.visible = false; sfx('crash'); bigText('倒下來了！', '', 1.2); }
    return true;
  }
  return false;
}
function breakArm(b, a) {
  a.alive = false; const pos = a.pv.localToWorld(V3(0, -3, 0));
  explode(pos, 4); explode(a.pv.localToWorld(V3(0, -6, 0)), 3); sfx('crash');
  addScore(C.score.armBreak, pos, '手臂破壞', '#ffd040');
  // 掉下來的手臂
  const g = new THREE.Mesh(BXG(1.1, 5.4, 1.1), new THREE.MeshLambertMaterial({ color: 0x5a6470 }));
  g.position.copy(pos); g.rotation.z = a.ang; scene.add(g);
  fxs.push({ kind: 'fall', mesh: g, vel: V3(a.s * 2, 2, 1.5), spin: V3(1, 0, a.s * 3), t: 0, floor: 0.6, life: 6 });
  a.pv.visible = false;
  if (b.arms.every(x => !x.alive)) { b.phase = 'legsIntro'; setTimeout(() => updBar(b), 0); b.t = 0; grenades.forEach(g => g.dead = true); bigText('手臂全毀！', '', 1.4); sayKey('s3bossLegs', 2); }
}
const FORMS = [
  n => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return V3(Math.cos(a) * 3.6, 5 + Math.sin(a) * 2.4, 0); }),     // 圓
  n => Array.from({ length: n }, (_, i) => V3((i - (n - 1) / 2) * 1.7, 4.5 + Math.abs(i - (n - 1) / 2) * 0.8, 0)),                        // V 字
  n => Array.from({ length: n }, (_, i) => V3((i - (n - 1) / 2) * 1.6, 4 + (i % 2) * 2.2, 0)),                                           // 鋸齒
  n => Array.from({ length: n }, (_, i) => V3(((i % 4) - 1.5) * 2.2, 3.4 + Math.floor(i / 4) * 2.2, 0)),                                 // 方陣
];
function startForm(b) {
  const c = BC(), n = c.formDrones + Math.min(2, b.formRound);
  const shape = FORMS[b.formRound % FORMS.length](n);
  const sp = Math.floor(Math.random() * n);
  const drones = shape.map((p, i) => {
    const special = i === sp;
    const h = makeDrone(special ? 0xffc020 : 0x8a929c); const g = h.root; h.body.scale.setScalar(1.7);
    const leg = b.legs[i % 2]; const st = leg.g.localToWorld(V3(0, 3.4, 1.3));
    g.position.copy(st); scene.add(g);
    h.hb[0].userData.boss = true; h.hb[0].userData.part = 'fdrone';
    if (special) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 4, 12), new THREE.MeshBasicMaterial({ color: 0xffe040 })); ring.rotation.x = Math.PI / 2; g.add(ring); }
    const d = { g, h, hb: h.hb[0], special, alive: true, slot: p, from: st };
    h.hb[0].userData.fd = d;
    return d;
  });
  b.form = { drones, state: 'fly', t: 0, mode: b.formRound % 4, wait: c.formTime * diff().fireWaitMul * Math.max(0.7, 1 - b.formRound * 0.06), center: V3(b.ox, 0, -17), spin: (b.formRound % 2 ? -1 : 1) * (0.6 + b.formRound * 0.15) };
  b.formRound++; sfx('buzz');
}
function updForm(b, dt) {
  const f = b.form, c = BC(); f.t += dt;
  const rot = gameTime * f.spin;
  // 整個陣形高速移動：轉圈、左右飛舞、8 字、上下波浪（依回合輪流）
  const mv = c.formMove, tt = f.t * mv; let cx = 0, cy = 0, cz = 0;
  if (f.mode === 0) { cx = Math.cos(tt * 1.8) * 5.5; cy = Math.sin(tt * 1.8) * 1.6; }
  else if (f.mode === 1) { cx = Math.sin(tt * 2.6) * 7; cz = Math.cos(tt * 1.3) * 1.5; }
  else if (f.mode === 2) { cx = Math.sin(tt * 1.7) * 6.5; cy = Math.sin(tt * 3.4) * 1.8; }
  else { cx = Math.sin(tt * 2.2) * 5; cy = Math.cos(tt * 4.4) * 1.2; cz = Math.sin(tt * 2.2) * 2; }
  const slotPos = (d) => { const p = d.slot; const x = p.x * Math.cos(rot) - (p.y - 5) * Math.sin(rot) * 0.35; return V3(f.center.x + cx + x, p.y + cy + Math.sin(gameTime * 2 + p.x) * 0.2, f.center.z + cz + Math.sin(rot + p.x) * 0.6); };
  f.drones.forEach(d => { if (!d.alive) return; d.h.rotors.forEach((r, i) => r.rotation.y += dt * 40 * (i % 2 ? 1 : -1)); d.g.rotation.y = Math.atan2(camera.position.x - d.g.position.x, camera.position.z - d.g.position.z); if (d.special) d.h.mats.forEach(m => m.emissive && m.emissive.setHex(Math.floor(gameTime * 8) % 2 ? 0x664400 : 0)); });
  if (f.state === 'fly') {
    const k = Math.min(1, f.t / 0.8);
    f.drones.forEach(d => { if (d.alive) d.g.position.lerpVectors(d.from, slotPos(d), easeOut(k)); });
    if (k >= 1) { f.state = 'hold'; f.t = 0; }
  } else if (f.state === 'hold') {
    f.drones.forEach(d => { if (d.alive) d.g.position.lerp(slotPos(d), Math.min(1, dt * 14)); });
    if (f.t >= f.wait) { // 沒打中：全部開火
      f.drones.forEach(d => { if (d.alive) { d.h.flash.visible = true; } }); sfx('enemyShot'); playerHurt(c.formDamage);
      f.state = 'leave'; f.t = 0;
    }
  } else if (f.state === 'leave') {
    f.drones.forEach(d => { if (d.alive) { d.h.flash.visible = f.t < 0.1; d.g.position.y += dt * 8; } });
    if (f.t > 1.0) { f.drones.forEach(d => scene.remove(d.g)); b.form = null; b.t = 0; }
  } else if (f.state === 'cleared') { if (f.t > 0.3) { b.form = null; b.t = 0; } }
}
function startCollapse(b) {
  b.phase = 'collapse'; b.t = 0; if (b.form) { b.form.drones.forEach(d => scene.remove(d.g)); b.form = null; }
  b.legs.forEach(l => explode(l.g.localToWorld(V3(0, 3, 1)), 4)); sfx('crash'); slowmo = 1.0;
  bigText('腳部爆炸！', '', 1.6);
}
function nextPillar(b) {
  const p = pillars.find(x => x.state === 'up'); if (!p) return;
  p.state = 'active'; p.hp = BC().pillarHp; p.crack.visible = true; b.pillar = p;
  if (!p.ring) { p.ring = new THREE.Object3D(); p.ring.position.set(0, p.x === 0 ? 11 : 7.5, 1.6); p.g.add(p.ring); }
  b.laserT = 0; b.laserWait = BC().laserTime * diff().fireWaitMul; b.charge.visible = true; sfx('charge');
}
function upd(b, dt) {
  const c = BC(), R = b.R; b.t += dt;
  if (b.hitFlash > 0) { b.hitFlash -= dt; if (b.hitFlash <= 0) b.mats.forEach(m => m.emissive && m.emissive.setHex(0)); }
  if (b.armorT > 0) b.armorT -= dt;
  // 手臂轉動與火箭
  if (b.phase === 'arms' || b.phase === 'intro') {
    b.arms.forEach(a => {
      if (!a.alive) return;
      // 手臂平常慢慢擺動；開始高速旋轉後才發射飛彈
      a.st_t -= dt;
      if (b.phase === 'arms') {
        // 一次只有一隻手臂旋轉，畫面上最多只有那一組飛彈（3 顆）
        const busy = b.arms.some(x => x !== a && x.alive && (x.st === 'spin' || (x.rockets || []).some(g => grenades.includes(g) && !g.dead)));
        if (a.st === 'rest' && a.st_t <= 0 && !busy) { a.st = 'spin'; a.st_t = c.armSpinTime; a.fired = false; a.opened = false; sfx('charge'); }
        else if (a.st === 'spin') {
          if (!a.fired && a.st_t <= c.armSpinTime - c.armFireDelay) {
            a.fired = true; const from = a.tip.getWorldPosition(V3(0, 0, 0));
            a.rockets = []; for (let i = 0; i < c.rockets; i++) a.rockets.push(throwGrenade(from, i, c.rockets, { rocket: true, dur: c.rocketFlight, arc: 1.4, damage: c.rocketDamage, gap: 0.35, hitRadius: 0.55 }));
          }
          const flying = a.fired && a.rockets.some(g => grenades.includes(g) && !g.dead);
          if (a.fired && !flying && !a.opened) { a.opened = true; a.st_t = Math.max(a.st_t, c.armOpenTime); } // 飛彈都處理完：繼續轉一段時間讓玩家打
          if (a.st_t <= 0 && a.fired && !flying) { a.st = 'rest'; a.st_t = rand(...c.armRest); b.arms.forEach(x => { if (x !== a) x.st_t = Math.max(x.st_t, 0.8); }); }
        }
      }
      const tv = a.st === 'spin' ? c.armSpin : 0.25;
      a.spinV = lerp(a.spinV, tv, Math.min(1, dt * 3));
      a.ang += dt * a.spinV * a.s * (b.phase === 'intro' ? 0.4 : 1); a.pv.rotation.z = a.ang;
    });
  }
  R.position.y = Math.sin(gameTime * 1.2) * 0.08;
  switch (b.phase) {
    case 'intro': { R.position.z = lerp(-34, -26, easeOut(Math.min(1, b.t / 2.4))) + AOFF[7][1]; if (b.t < 2.4 && Math.floor(b.t * 2.5) !== Math.floor((b.t - dt) * 2.5)) { shakeT = 0.3; shakeA = 0.1; sfx('boom'); } if (b.t > 2.8) { b.phase = 'arms'; b.t = 0; } break; }
    case 'arms': break;
    case 'legsIntro': if (b.t > 2.4) { b.phase = 'legs'; b.t = 0; } break;
    case 'legs': {
      b.legs.forEach(l => { l.hatch.material.color.setHex(Math.floor(gameTime * 6) % 2 ? 0x40e0ff : 0x104050); });
      if (b.form) updForm(b, dt); else if (b.t > 1.0) startForm(b);
      break;
    }
    case 'collapse': {
      const k = Math.min(1, b.t / 1.6);
      b.legs.forEach(l => { l.g.scale.y = Math.max(0.15, 1 - easeIn(k) * 0.85); l.g.rotation.z = l.s * k * 0.5; });
      b.torso.position.y = lerp(6.2, 0.6, easeIn(k)); b.torso.rotation.x = k * 0.25;
      b.head.rotation.x = -k * 0.25;
      if (k >= 1 && !b.landed) { b.landed = true; shakeT = 0.6; shakeA = 0.25; sfx('crash'); explode(R.position.clone().add(V3(0, 1, 2)), 5); }
      if (b.t > 2.6) { b.phase = 'head'; b.t = 0; bigText('只剩下頭了！', '', 1.6); sayKey('s3bossHead', 2); b.headDelay = 1.6; }
      break;
    }
    case 'head': {
      b.head.rotation.y = Math.sin(gameTime * 0.8) * 0.15;
      // 第三階段：同時有機器狗衝過來
      b.dogT = (b.dogT === undefined ? c.dogEvery * 0.5 : b.dogT) - dt;
      if (b.dogT <= 0) {
        b.dogT = c.dogEvery;
        const alive = ents.filter(e => e.kind === 'dog' && e.alive).length;
        for (let i = 0; i < c.dogCount && alive + i < c.dogMax; i++) { const s = pick([-1, 1]); spawnDog({ k: 'dog', from: [b.ox + s * rand(10, 16), rand(-22, -12)] }, null); }
      }
      if (!b.pillar) { b.headDelay -= dt; if (b.headDelay <= 0) nextPillar(b); break; }
      const p = b.pillar;
      if (p.state === 'active') {
        b.laserT += dt; const k = b.laserT / b.laserWait;
        b.charge.scale.setScalar(0.5 + k * 2.2); b.charge.material.color.setHex(Math.floor(gameTime * (6 + k * 20)) % 2 ? 0xff4020 : 0xffd040);
        p.crack.material.color.setHex(Math.floor(gameTime * 6) % 2 ? 0xff8020 : 0xffe040);
        if (b.laserT >= b.laserWait) fireLaser(b);
      } else if (p.state === 'falling') {
        p.t += dt; const k = Math.min(1, p.t / 1.1);
        const head = b.head.getWorldPosition(V3(0, 0, 0)); const dir = V3(head.x - p.base.x, 0, head.z - p.base.z).normalize();
        const axis = V3(dir.z, 0, -dir.x); p.g.quaternion.setFromAxisAngle(axis, easeIn(k) * Math.PI / 2 * 0.9);
        b.charge.scale.multiplyScalar(0.92);
        if (k >= 1) {
          p.state = 'down'; b.pillar = null; b.pillarsDone++; b.charge.visible = false;
          shakeT = 0.7; shakeA = 0.3; sfx('crash'); explode(head.clone().add(V3(0, 1, 0)), 6); explode(head.clone().add(V3(rand(-2, 2), 2, 0)), 4);
          addScore(C.score.pillar, head.clone().add(V3(0, 3, 0)), '壓中！', '#ffd040');
          b.head.position.y = Math.max(2.4, b.head.position.y - 1.0); b.head.rotation.z = (b.pillarsDone % 2 ? 0.25 : -0.25);
          updBar(b);
          if (b.pillarsDone >= c.pillars) { die(b); } else { b.headDelay = 1.4; b.head.rotation.z = 0; }
        }
      }
      if (b.beam) { b.beamT -= dt; if (b.beamT <= 0) { scene.remove(b.beam); b.beam = null; } }
      break;
    }
    case 'dead': {
      if (Math.random() < dt * 8) explode(R.position.clone().add(V3(rand(-4, 4), rand(0.5, 4), rand(-2, 2))), rand(2, 5));
      if (b.t > 2.2) setOpacity({ h: { mats: b.mats } }, Math.max(0, 1 - (b.t - 2.2) / 1.0));
      if (b.t > 3.4 && !b.done) { b.done = true; scene.remove(R); }
      break;
    }
  }
}
function fireLaser(b) {
  const head = b.charge.getWorldPosition(V3(0, 0, 0)); const to = camera.position.clone().add(V3(0, -0.3, 0));
  const len = head.distanceTo(to);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, len, 6), new THREE.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0.8 }));
  beam.position.copy(head).lerp(to, 0.5); beam.quaternion.setFromUnitVectors(V3(0, 1, 0), to.clone().sub(head).normalize());
  scene.add(beam); b.beam = beam; b.beamT = 0.35;
  sfx('laser'); $('flash').style.transition = 'none'; $('flash').style.opacity = 0.6; requestAnimationFrame(() => { $('flash').style.transition = 'opacity .5s'; $('flash').style.opacity = 0; });
  const iv = invuln; invuln = 0; playerHurt(BC().laserDamage); if (hp > 0) invuln = Math.max(iv, invuln);
  b.laserT = 0; b.charge.scale.setScalar(0.5); sfx('charge');
}
function die(b) {
  ents.forEach(e => { if (e.kind === 'dog' && e.alive) { e.state = 'dead'; e.t = 0; e.alive = false; } });
  sayReset(); sayKey('s3bossDown', 2);
  b.alive = false; b.phase = 'dead'; b.t = 0; stats.kills++;
  addScore(C.score.bossKill, b.R.position.clone().add(V3(0, 5, 0)), '擊倒 Boss', '#ffd040');
  slowmo = 1.8; sfx('boom'); updBar(b);
}

// ================= 關卡腳本（區域座標） =================
// LEVEL-BEGIN
const T = (at, o) => Object.assign({ k: 'thug', look: 'merc', at }, o || {});
const H = (at, o) => Object.assign({ k: 'thug', look: 'heavy', at }, o || {});
const GR = (at, o) => Object.assign({ k: 'thug', look: 'gren', at }, o || {});
const LEVEL = [
  // ===== 1 歌劇院 =====
  { a: 0, type: 'move', to: [0, 1.6, -5], look: [0, 2.6, -26], dur: 2.0 },
  { a: 0, type: 'cut', waves: [
    [T([-4.6, -23.4], { look: 'guard', y: 1.45, from: [-8.5, -23.4], pop: 'side' }), T([4.6, -23.4], { look: 'guard', y: 1.45, from: [8.5, -23.4], pop: 'side', t: 0.7 })],
    [T([0, -25], { look: 'guard', y: 1.45, pop: 'up', drop: 1.4 }), T([-3.2, -26.2], { look: 'guard', y: 1.45, from: [-3.2, -28.5], pop: 'side', t: 0.5 }), T([3.4, -26.2], { look: 'guard', y: 1.45, from: [3.4, -28.5], pop: 'side', t: 0.9 }), { k: 'bonus', at: [-6.3, -28.8], y: 1.45, from: [-11, -28.8], pop: 'run', t: 0.6 }],
    [{ cam: [0, 1.6, -5], look: [-7, 4, -15] }, T([-11.2, -11], { look: 'guard', y: 4.3, from: [-11.2, -13.1], pop: 'side' }), T([-11.2, -16.6], { look: 'guard', y: 4.3, from: [-11.2, -18.1], pop: 'side', t: 0.5 }), T([-2.2, -11.5], { look: 'guard', from: [-4, -11.7], pop: 'side', crouch: true, t: 0.9 })],
    [{ cam: [0, 1.6, -5], look: [7, 4, -15] }, T([11.2, -11], { look: 'guard', y: 4.3, from: [11.2, -13.1], pop: 'side' }), T([11.2, -16.6], { look: 'guard', y: 4.3, from: [11.2, -18.1], pop: 'side', t: 0.4 }), T([2.2, -13], { look: 'guard', from: [4, -13.2], pop: 'side', crouch: true, t: 0.8 }), { k: 'bonus', at: [11.2, -9.6], y: 4.3, from: [11.2, -11.6], pop: 'side', t: 1.1, mg: true }],
  ] },
  { a: 0, type: 'move', to: [0, 1.6, -15], look: [0, 2.6, -32], dur: 2.0 },
  { a: 0, type: 'cut', waves: [
    [T([-4.6, -23.4], { look: 'guard', y: 1.45, from: [-8.5, -23.4], pop: 'side' }), T([0.2, -27.6], { look: 'guard', y: 1.45, from: [3.6, -27.6], pop: 'side', t: 0.4 }), T([4.6, -23.4], { look: 'guard', y: 1.45, from: [8.5, -23.4], pop: 'side', t: 0.8, armored: true })],
    [T([-2, -25], { look: 'guard', y: 1.45, pop: 'up', drop: 1.4 }), T([2.5, -29.5], { look: 'guard', y: 1.45, from: [9, -29.5], pop: 'run', t: 0.3 }), T([-5.5, -29.5], { look: 'guard', y: 1.45, from: [-9, -29.5], pop: 'run', t: 0.7 }), T([5.8, -24.5], { look: 'guard', y: 1.45, from: [8.6, -24.5], pop: 'side', t: 1.1 })],
  ] },
  { a: 0, type: 'move', to: [0, 3.0, -22], look: [0, 2.8, -32], dur: 2.0 },
  { a: 0, type: 'move', to: [0, 3.0, -30], look: [0, 2.8, -40], dur: 1.6 },
  { a: 0, type: 'move', to: [0, 3.0, -32.4], look: [0, 2.0, -42], dur: 0.9 },
  { a: 0, type: 'move', to: [0, 1.6, -35.3], look: [0, 1.6, -50], dur: 1.3 },
  // ===== 2 地下隧道（暗門後的樓梯直接下來） =====
  { a: 1, type: 'move', to: [0, 1.6, 2], look: [0, 1.6, -20], dur: 1.6 },
  { a: 1, type: 'cut', waves: [
    [T([-1.1, -10.3], { from: [-2.5, -10.6], pop: 'side' }), T([1.1, -14.3], { from: [2.5, -14.6], pop: 'side', t: 0.7 })],
    [{ cam: [0, 1.6, -8], look: [0, 1.6, -30] }, T([-1.1, -21.3], { from: [-2.6, -21.6], pop: 'side' }), T([1.1, -27.3], { from: [2.6, -27.6], pop: 'side', t: 0.6 })],
  ] },
  { a: 1, type: 'move', to: [0, 1.6, -14], look: [0, 1.6, -36], dur: 1.6, ambush: [T([-0.9, -21.3], { t: 0.8, from: [-2.6, -21.6], pop: 'side' })] },
  { a: 1, type: 'cut', waves: [
    [{ k: 'fx', id: 'collapse' }, { k: 'say', id: 's3_collapse' }],
    [{ cam: [0, 1.6, -15], look: [0, 4.2, -25.5], dur: 0.5 }, T([-0.7, -24.6], { from: [-0.7, -24.6], fy: 7.5, pop: 'side', popTime: 0.7 }), T([0.8, -26.2], { from: [0.8, -26.2], fy: 7.5, pop: 'side', popTime: 0.7, t: 0.9, armored: true })],
    [{ cam: [0, 1.6, -14], look: [0, 1.6, -36], dur: 0.6 }, T([1.1, -27.3], { from: [2.6, -27.6], pop: 'side' }), T([-1.8, -29], { from: [0, -49], pop: 'run', t: 0.5 })],
    [{ cam: [0, 1.6, -22], look: [0, 1.6, -44] }, T([0.9, -41.3], { from: [2.6, -41.6], pop: 'side' }), T([-1.6, -31], { from: [-1.8, -32.5], pop: 'side', crouch: true, t: 0.4 }), T([-0.9, -36.3], { from: [-2.6, -36.6], pop: 'side', t: 0.8 })],
  ] },
  { a: 1, type: 'move', to: [0, 1.6, -32], look: [0, 1.6, -50], dur: 2.0, ambush: [T([1.6, -44.6], { t: 0.6, from: [0.2, -45.6], pop: 'side', crouch: true }), T([-1.6, -44.6], { t: 1.4, from: [-0.2, -45.6], pop: 'side', crouch: true })] },
  // ===== 3 地下噴水池 =====
  { a: 2, type: 'move', to: [0, 1.6, -52], look: [0, 2, -72], dur: 2.6 },
  { a: 2, type: 'cut', waves: [
    [T([-4.5, -59], { from: [-12, -58], pop: 'run' }), T([4.5, -60], { from: [12, -58], pop: 'run', t: 0.5 }), T([-1.6, -61.8], { from: [0, -62.3], pop: 'side', crouch: true, t: 1.0 })],
    [T([1.8, -61.8], { from: [0, -62.3], pop: 'side', crouch: true }), T([-8.3, -67.5], { from: [-10.5, -68.6], pop: 'side', t: 0.4 }), T([8.3, -67.5], { from: [10.5, -68.6], pop: 'side', t: 0.8 }), { k: 'bonus', at: [-5, -74], from: [-12, -74], pop: 'run', t: 0.6 }],
    [T([-4.5, -62], { from: [-12, -62], pop: 'run' }), T([4.5, -63], { from: [12, -64], pop: 'run', t: 0.3 }), T([3, -73], { from: [3, -82], pop: 'run', t: 0.8, armored: true })],
  ] },
  { a: 2, type: 'move', to: [-5.5, 1.6, -66], look: [0, 2.6, -84], dur: 2.4 },
  { a: 2, type: 'cut', say: 's3_door', waves: [
    [{ k: 'fx', id: 'door' }, T([-1.2, -82], { from: [-1.2, -92], pop: 'run', t: 1.0 }), T([1.6, -82.5], { from: [1.6, -93], pop: 'run', t: 1.4 })],
    [T([-4.6, -79.5], { from: [-6.2, -80.2], pop: 'side', crouch: true }), T([4.8, -79.2], { from: [6.2, -80.6], pop: 'side', crouch: true, t: 0.4 }), T([0.2, -83], { from: [0.2, -94], pop: 'run', t: 0.8, armored: true }), { k: 'bonus', at: [8.2, -78.5], from: [12, -76], pop: 'run', t: 1.0, mg: true }],
  ] },
  { a: 2, type: 'move', to: [0, 1.6, -80], look: [0, 1.8, -96], dur: 2.0 },
  { a: 2, type: 'move', to: [0, 1.6, -92], look: [0, 1.6, -110], dur: 1.2 },
  // ===== 4 白色走廊 =====
  { a: 3, type: 'move', to: [0, 1.6, 2], look: [0, 1.6, -20], dur: 1.2 },
  { a: 3, type: 'cut', waves: [
    [T([-1.4, -8], { from: [-3.6, -8], pop: 'side' }), H([1.2, -13], { from: [3.6, -13], pop: 'side', t: 0.7 })],
    [GR([-1.4, -18], { from: [-3.6, -18], pop: 'side' }), T([0.4, -16], { from: [0.4, -40], pop: 'run', t: 0.6 })],
  ] },
  { a: 3, type: 'move', to: [0, 1.6, -8], look: [0, 1.6, -30], dur: 1.8, ambush: [H([1.4, -23], { t: 0.8, from: [3.6, -23], pop: 'side' })] },
  { a: 3, type: 'cut', waves: [
    [GR([-1.4, -28], { from: [-3.6, -28], pop: 'side' }), T([1.4, -23], { from: [3.6, -23], pop: 'side', t: 0.5 })],
    [H([1.4, -23], { from: [3.6, -23], pop: 'side' }), GR([-1.4, -18], { from: [-3.6, -18], pop: 'side', t: 0.5 }), { k: 'bonus', at: [-1.6, -38], from: [-1.6, -50], pop: 'run', t: 0.3 }],
  ] },
  { a: 3, type: 'move', to: [0, 1.6, -26], look: [0, 1.6, -50], dur: 2.4, ambush: [GR([1.4, -33], { t: 0.8, from: [3.6, -33], pop: 'side' }), H([-1.2, -38], { t: 2.0, from: [-1.2, -60], pop: 'run' })] },
  // 回頭：剛經過的門裡追出來
  { a: 3, type: 'cut', waves: [
    [{ cam: [0, 1.6, -27], look: [0, 1.5, 0], dur: 0.6 }, { k: 'say', id: 's3_back' }, T([-2.2, -18], { from: [-3.6, -18], pop: 'side' }), H([1.8, -13], { from: [3.6, -13], pop: 'side', t: 0.5 }), GR([-1.8, -8], { from: [-3.6, -8], pop: 'side', t: 1.0 })],
    [T([0.3, -10], { from: [0.3, 3], pop: 'run', t: 0.4 }), { k: 'bonus', at: [-1.5, -3], from: [-1.5, 4], pop: 'run', t: 0.7 }],
    [{ cam: [0, 1.6, -27], look: [0, 1.6, -50], dur: 0.6 }, T([1.8, -33], { from: [3.6, -33], pop: 'side' }), T([-0.6, -38], { from: [-0.6, -56], pop: 'run', t: 0.5 })],
  ] },
  // ===== 5 玻璃走廊（機器狗） =====
  { a: 4, type: 'move', to: [0.8, 1.6, -42], look: [-1.5, 1.4, -62], dur: 2.0 },
  { a: 4, type: 'cut', waves: [
    [{ k: 'dog', from: [-5.5, -54], glass: 'g3' }, T([1.4, -58], { from: [1.4, -75], pop: 'run', t: 0.6 })],
    [{ k: 'dog', from: [-5.5, -58], glass: 'g4' }, { k: 'dog', from: [-6.5, -63], glass: 'g5', t: 0.8 }, GR([1.6, -60], { from: [1.6, -76], pop: 'run', t: 0.4 })],
    [{ k: 'dog', from: [-5.5, -50], glass: 'g2' }, H([0.8, -62], { from: [0.8, -80], pop: 'run', t: 0.3 }), { k: 'dog', from: [-6, -66], glass: 'g6', t: 1.2 }, { k: 'bonus', at: [-8, -70], from: [-12, -70], pop: 'run', t: 0.6 }],
  ] },
  { a: 4, type: 'move', to: [0.8, 1.6, -58], look: [-1.5, 1.4, -80], dur: 2.2, ambush: [{ k: 'dog', t: 1.0, from: [-5.5, -70], glass: 'g7' }] },
  { a: 4, type: 'cut', waves: [
    [{ k: 'dog', from: [-5.5, -72], glass: 'g8' }, { k: 'dog', from: [-6.5, -76], glass: 'g9', t: 0.7 }, T([1.4, -74], { from: [1.4, -84], pop: 'run', t: 0.3 })],
    [{ k: 'dog', from: [-5.5, -78], glass: 'g10' }, GR([1.6, -76], { from: [1.6, -86], pop: 'run', t: 0.4 }), { k: 'dog', from: [-9, -74], t: 1.0 }, { k: 'bonus', at: [-9.5, -80], from: [-13, -80], pop: 'run', t: 0.6, mg: true }],
  ] },
  // ===== 6 觀測台（無人機） =====
  { a: 5, type: 'move', to: [0, 1.6, -80], look: [0, 1.8, -95], dur: 1.6 },
  { a: 5, type: 'move', to: [0, 1.6, -85.2], look: [0, 3.2, -110], dur: 1.2 },
  { a: 5, type: 'cut', waves: [
    [{ k: 'drone', at: [-5, -104], y: 3.5, from: [-30, -110] }, { k: 'drone', at: [-1.5, -106], y: 4.5, from: [-30, -112], t: 0.5 }, { k: 'drone', at: [2, -104], y: 3.0, from: [30, -110], t: 1.0 }, { k: 'drone', at: [5.5, -106], y: 4.2, from: [30, -112], t: 1.5 }],
    [{ k: 'drone', at: [-6, -102], y: 2.8, from: [-6, -102], fy: -20 }, { k: 'drone', at: [-2, -103], y: 3.6, from: [-2, -103], fy: -20, t: 0.4 }, { k: 'drone', at: [2, -103], y: 3.6, from: [2, -103], fy: -20, t: 0.8 }, { k: 'drone', at: [6, -102], y: 2.8, from: [6, -102], fy: -20, t: 1.2 }, T([-3, -94], { from: [-11, -94], pop: 'run', t: 0.6 })],
    [{ k: 'drone', at: [-4, -100], y: 5.0, from: [-4, -100], fy: 25 }, { k: 'drone', at: [0, -101], y: 4.2, from: [0, -101], fy: 25, t: 0.3 }, { k: 'drone', at: [4, -100], y: 5.0, from: [4, -100], fy: 25, t: 0.6 }, GR([3.5, -93.5], { from: [11, -93.5], pop: 'run', t: 0.4 }), { k: 'bonus', at: [-1, -94.5], from: [-11, -94.5], pop: 'run', t: 1.0 }],
    [{ k: 'drone', at: [-7, -105], y: 3.8, from: [-30, -105] }, { k: 'drone', at: [-3.5, -103], y: 2.6, from: [-30, -103], t: 0.25 }, { k: 'drone', at: [0, -105], y: 4.8, from: [30, -105], t: 0.5 }, { k: 'drone', at: [3.5, -103], y: 2.6, from: [30, -103], t: 0.75 }, { k: 'drone', at: [7, -105], y: 3.8, from: [30, -105], t: 1.0 }, H([0.5, -94.6], { from: [11, -94.6], pop: 'run', t: 0.5 })],
  ] },
  // 搭電梯下去實驗室
  { a: 5, type: 'move', to: [9.5, 1.6, -90], look: [20, 1.6, -90], dur: 1.6 },
  { a: 5, type: 'move', to: [13.9, 1.6, -90], look: [20, 1.6, -90], dur: 0.9 },
  { a: 5, type: 'move', to: [13.9, 1.6, -90], look: [0, 1.6, -90], dur: 1.0 },
  { a: 5, type: 'cut', waves: [[{ k: 'fx', id: 'elevClose' }], [{ k: 'fx', id: 'ride' }], [{ k: 'fx', id: 'ride' }]] },
  // ===== 7 實驗室 =====
  { a: 6, type: 'warp', seamless: true, to: [0, 1.6, 5.8], look: [0, 1.6, -20] },
  { a: 6, type: 'cut', waves: [[{ k: 'fx', id: 'elevOpen' }]] },
  { a: 6, type: 'move', to: [0, 1.6, 2], look: [0, 1.5, -20], dur: 1.2 },
  { a: 6, type: 'cut', waves: [
    [T([-2.9, -10.6], { from: [-4.6, -10.8], pop: 'side', crouch: true }), T([7.6, -12.6], { from: [6, -12.8], pop: 'side', crouch: true, t: 0.6 }), { k: 'hostage', look: 'sci', at: [1.5, -7], from: [12, -7], pop: 'run', t: 0.2 }],
    [GR([3.4, -12.6], { from: [5, -12.8], pop: 'side', crouch: true }), T([8, -9], { from: [15, -8], fy: 3.05, roll: true, pop: 'side', popTime: 0.9, t: 0.4 }), T([-9, -14], { from: [-13, -14], pop: 'run', t: 0.8 }), { k: 'bonus', at: [0.4, -30], from: [0.4, -42], pop: 'run', t: 0.5 }],
    [H([-1.6, -18], { from: [-1.6, -40], pop: 'run' }), T([-3.6, -17], { from: [-13, -17], pop: 'run', t: 0.4 }), { k: 'hostage', look: 'sci', at: [2.6, -17], from: [13, -17], pop: 'run', t: 0.3 }, GR([0.6, -19.5], { from: [0.6, -40], pop: 'run', t: 0.9 })],
  ] },
  { a: 6, type: 'move', to: [0, 1.6, -15], look: [0, 1.5, -40], dur: 2.2 },
  // 牆壁被炸開、通風口翻滾進來
  { a: 6, type: 'cut', waves: [
    [{ cam: [0, 1.6, -15], look: [-8, 1.5, -21], dur: 0.6 }, { k: 'fx', id: 'wall' }, { k: 'say', id: 's3_wall' }, H([-10.5, -19.6], { from: [-16.5, -19.6], pop: 'run', t: 0.5 }), T([-9.5, -22.6], { from: [-17, -21], pop: 'run', t: 1.0 }), T([-11, -16.8], { from: [-16.5, -18.2], pop: 'run', t: 1.5 })],
    [{ cam: [0, 1.6, -15], look: [-4, 1.8, -36], dur: 0.6 }, T([-9.5, -33.5], { from: [-15, -34], fy: 3.05, roll: true, pop: 'side', popTime: 0.9 }), GR([-4.5, -27], { from: [-12, -27], pop: 'run', t: 0.6 }), T([3.5, -30], { from: [3.5, -42], pop: 'run', t: 1.2 })],
  ] },
  { a: 6, type: 'cut', waves: [
    [{ cam: [0, 1.6, -15], look: [0, 1.5, -40], dur: 0.6 }, T([-3.9, -24.6], { from: [-5.6, -24.8], pop: 'side', crouch: true }), T([8.1, -26.6], { from: [6.4, -26.8], pop: 'side', crouch: true, t: 0.5 }), GR([2.6, -34.6], { from: [1, -34.8], pop: 'side', crouch: true, t: 1.0 })],
    [H([-2.6, -34.6], { from: [-1, -34.8], pop: 'side', crouch: true }), T([3.9, -26.6], { from: [5.6, -26.8], pop: 'side', crouch: true, t: 0.4 }), { k: 'hostage', look: 'sci', at: [-4.2, -30.5], from: [-12, -32], pop: 'run', t: 0.6 }, T([-3, -21], { from: [-12, -19], pop: 'run', t: 1.0 })],
    [H([0.3, -30], { from: [0.3, -42], pop: 'run' }), GR([-5, -33], { from: [-12, -36], pop: 'run', t: 0.4 }), GR([5, -33], { from: [12, -36], pop: 'run', t: 0.8 }), { k: 'bonus', at: [-5, -41.5], from: [-11, -41.5], pop: 'run', t: 0.5, mg: true }],
  ] },
  { a: 6, type: 'move', to: [2.8, 1.6, -36], look: [0, 1.6, -60], dur: 2.2 },
  { a: 6, type: 'move', to: [0, 1.6, -41], look: [0, 2.0, -60], dur: 1.2 },
  // ===== 8 地下瀑布 Boss（實驗室後門出去） =====
  { a: 7, type: 'move', to: [0, 1.7, 2], look: [0, 7, -30], dur: 2.6 },
  { a: 7, type: 'boss' },
  { a: 7, type: 'end' },
];
// LEVEL-END

const sh2 = (p, o) => p && [p[0] + o[0], p[1] + o[1]];
const sh3 = (p, o) => p && [p[0] + o[0], p[1], p[2] + o[1]];
function shiftSpec(sp, o) {
  if (sp.cam) { sp.cam = sh3(sp.cam, o); sp.look = sh3(sp.look, o); return; }
  if (sp.at) sp.at = sh2(sp.at, o); if (sp.from) sp.from = sh2(sp.from, o); if (sp.to) sp.to = sh2(sp.to, o);
}
LEVEL.forEach(s => {
  const o = AOFF[s.a];
  if (s.to) s.to = sh3(s.to, o); if (s.look) s.look = sh3(s.look, o);
  (s.ambush || []).forEach(a => shiftSpec(a, o));
  (s.waves || []).forEach(w => w.forEach(sp => shiftSpec(sp, o)));
});
AREAS.forEach((A, i) => { A.start = sh3(A.start, AOFF[i]); A.look = sh3(A.look, AOFF[i]); });

// 第三關各區的背景音樂（音樂檔，換區時接著播）；Boss 戰的音樂在 spawnBoss 裡
const BGM = { file: 'assets/audio/stage3_bgm.mp3' };
const MUS = [BGM, BGM, BGM, BGM, BGM, BGM, BGM, BGM];
registerStage({ id: 3, name: '軍火秘密基地', en: 'STAGE 3  SECRET ARMS BASE', desc: '歌劇院底下藏著軍火商的秘密基地。最深處有巨大的機器人。',
  brief: { head: '任務檔案 #0615 ／ 代號「終幕」／ 極機密', text: ['所有線索，都指向同一座百年歌劇院。', '台上的演出照常進行；台下三十公尺，有人正在替一場 [[████]] 調音。', '這是最後一幕。沒有謝幕。'] },
  areas: AREAS, level: LEVEL, build: () => { build(); buildDyn(); }, floorY: () => 0, spawnBoss, tick, fx, reset: resetDyn, music: MUS,
  title: { pos: [AOFF[6][0], 2.4, AOFF[6][1] + 3], look: [AOFF[6][0], 1.2, AOFF[6][1] - 30], sway: 5 } });
})();
