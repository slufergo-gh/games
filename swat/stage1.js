// 第一關：大賣場危機
'use strict';
// ================= 場景（大賣場六區） =================
const S1_AREAS = [
  { name: '戶外停車場', en: 'AREA 1  PARKING LOT', start: [0, 1.6, -5], look: [0, 1.3, -20],
    env: { bg: 0x9ec8e8, near: 40, far: 160, sky: 0xffffff, gnd: 0x6a6050, hi: 0.75, sun: 0.7, amb: 0.25 } },
  { name: '地下停車場', en: 'AREA 2  UNDERGROUND', start: [10, -3.4, -55.5], look: [2, -3.8, -75],
    env: { bg: 0x101216, near: 12, far: 62, sky: 0xcfd8e0, gnd: 0x3a3a40, hi: 0.65, sun: 0.0, amb: 0.3 } },
  { name: '美食街', en: 'AREA 3  FOOD COURT', start: [0, 1.6, -136], look: [0, 1.4, -160],
    env: { bg: 0x3a2e24, near: 25, far: 90, sky: 0xfff0d8, gnd: 0x705a40, hi: 0.85, sun: 0.0, amb: 0.35 } },
  { name: '超市', en: 'AREA 4  SUPERMARKET', start: [0, 1.6, -178], look: [0, 1.4, -200],
    env: { bg: 0x2a3036, near: 25, far: 90, sky: 0xf4fbff, gnd: 0x606870, hi: 0.8, sun: 0.0, amb: 0.35 } },
  { name: '服飾店', en: 'AREA 5  BOUTIQUE', start: [-14, 1.6, -242], look: [-13, 1.4, -262],
    env: { bg: 0x2e2228, near: 22, far: 80, sky: 0xffe8f0, gnd: 0x6a5048, hi: 0.85, sun: 0.0, amb: 0.35 } },
  { name: '中央廣場', en: 'AREA 6  CENTRAL PLAZA', start: [-3.5, 1.6, -284], look: [0, 2, -310],
    env: { bg: 0x8aa8c4, near: 35, far: 130, sky: 0xfff8f0, gnd: 0x605848, hi: 0.75, sun: 0.25, amb: 0.25 } },
];
function parkedCar(x, y, z, ry, color) {
  const c = color || pick(CAR_COLORS);
  const along = Math.abs(Math.sin(ry)) > 0.5; // 車身沿 x
  const w = along ? 4.2 : 1.9, d = along ? 1.9 : 4.2;
  blk(x - w / 2, x + w / 2, y + 0.3, y + 0.95, z - d / 2, z + d / 2, c);
  const cw = along ? 2.2 : 1.7, cd = along ? 1.7 : 2.2;
  blk(x - cw / 2, x + cw / 2, y + 0.95, y + 1.45, z - cd / 2, z + cd / 2, 0x2a3440);
  blk(x - cw / 2 + 0.05, x + cw / 2 - 0.05, y + 1.45, y + 1.5, z - cd / 2 + 0.05, z + cd / 2 - 0.05, c);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wx = along ? sx * 1.35 : sx * 0.85, wz = along ? sz * 0.85 : sz * 1.35;
    blk(x + wx - 0.18, x + wx + 0.18, y, y + 0.6, z + wz - 0.18, z + wz + 0.18, 0x111111);
  }
}
function shelf(x, z0, z1, y0, color, full) {
  const len = Math.abs(z1 - z0), zc = (z0 + z1) / 2;
  blk(x - 0.1, x + 0.1, y0, y0 + 2.2, Math.min(z0, z1), Math.max(z0, z1), 0x8a9098); // 背板
  blk(x - 0.6, x + 0.6, y0, y0 + 0.12, Math.min(z0, z1), Math.max(z0, z1), color);
  for (const ez of [Math.min(z0, z1), Math.max(z0, z1)]) blk(x - 0.6, x + 0.6, y0, y0 + 2.2, ez - 0.05, ez + 0.05, color);
  const tiers = [0.12, 0.62, 1.12, 1.62];
  tiers.forEach((ty, ti) => {
    if (ti > 0) blk(x - 0.6, x + 0.6, y0 + ty - 0.04, y0 + ty, Math.min(z0, z1), Math.max(z0, z1), 0xb8bcc2);
    const kind = pick(['box', 'box', 'can', 'bottle', 'melon']);
    const pal = pick([[0xe04030, 0xf0d040, 0x3070d0], [0x30a050, 0xf0f0e0, 0xe08020], [0x9040b0, 0xe05090, 0x40c0d0], [0xd0b080, 0x806040, 0xe0e0d0]]);
    for (const side of [-1, 1]) {
      if (!full && side === 1 && x > 0 || !full && side === -1 && x < 0) { /* 遠側只擺一半 */ }
      const step = kind === 'box' ? 0.3 : 0.2;
      for (let z = Math.min(z0, z1) + 0.25; z < Math.max(z0, z1) - 0.2; z += step) {
        if (Math.random() < 0.08) continue;
        prod(kind, x + side * 0.38, y0 + ty, z, pick(pal), Math.PI / 2);
      }
    }
  });
}
function humanStatic(x, y, z) { } // 保留

function s1Build() {
  // ---------- 區域 1：戶外停車場 ----------
  curArea = 0; L = new Builder(false); G = new Builder(true);
  // 地面（挖掉坡道洞 x7~13, z-38~-50）
  tiles(-40, 7, -50, 12, 0, 4, 0x4a4c50, 0x46484c);
  tiles(13, 40, -50, 12, 0, 4, 0x4a4c50, 0x46484c);
  tiles(7, 13, -38, 12, 0, 2, 0x4a4c50, 0x46484c);
  // 草地與遠景
  L.quad(-120, 120, -50, -40 + 0, -0.02, 0x4a6a38);
  L.quad(-120, -40, -50, 60, -0.02, 0x4a6a38); L.quad(40, 120, -50, 60, -0.02, 0x4a6a38); L.quad(-120, 120, 12, 80, -0.02, 0x4a6a38);
  // 停車格白線
  for (const row of [-16, -30, -42]) for (let x = -20; x <= 20; x += 3) if (Math.abs(x) > 3 || row !== -16) {
    if (x > 6 && x < 14 && row === -42) continue;
    blk(x - 0.06, x + 0.06, 0.01, 0.02, row - 2.4, row + 2.4, 0xd8d8d0);
  }
  for (let z = 8; z > -36; z -= 4) blk(-0.1, 0.1, 0.01, 0.02, z - 1.2, z, 0xe0c040);
  // 停放的車
  [[-12, -16], [-6, -16], [6, -16], [12, -16], [-18, -16], [18, -16],
   [-16, -30], [-10, -30], [-4, -30], [14, -30], [20, -30],
   [-16, -42], [-10, -42], [-4, -42], [1, -42], [-20, -42]].forEach(([x, z]) => parkedCar(x, 0, z, 0));
  // 路燈
  for (const [x, z] of [[-3, -8], [3, -24], [-8, -36], [16, -8], [-20, -24]]) {
    blk(x - 0.1, x + 0.1, 0, 7, z - 0.1, z + 0.1, 0x606670);
    blk(x - 0.6, x + 0.6, 6.9, 7.2, z - 0.25, z + 0.25, 0x505660);
    blk(x - 0.5, x + 0.5, 6.85, 6.9, z - 0.2, z + 0.2, 0xfff4c0, G);
  }
  // 購物車
  for (const [x, z] of [[-1.8, -27], [9, -12], [-7.5, -38.2]]) { blk(x - 0.35, x + 0.35, 0.4, 1.0, z - 0.5, z + 0.5, 0xa0a8b0); blk(x - 0.3, x + 0.3, 0, 0.4, z - 0.4, z + 0.4, 0x707880); }
  // 三角錐
  for (const [x, z] of [[2.5, -10], [3, -12], [-2.6, -20], [6.5, -36], [13.5, -36]]) prod('cone', x, 0, z, 0xf06020);
  // 坡道（往下到地下停車場）
  L.add(new THREE.BoxGeometry(6, 0.2, 17.72), 10, -2.6, -46.5, 0x55585c, 0, -0.2860);
  blk(6.6, 7, -5, 0.9, -55, -38, 0x8a8a84); blk(13, 13.4, -5, 0.9, -55, -38, 0x8a8a84);
  blk(7, 13, -0.4, 0, -55, -50, 0x707070);
  blk(7, 13, 0.6, 0.9, -38.2, -37.8, 0xe0c040); // 坡道入口黃色橫桿
  blk(6.5, 7.1, 0.9, 2.6, -38.2, -37.8, 0xe0c040);
  // 賣場外牆
  wallX(-60, 60, 0, 16, -50.5, 1, 0xd8cdb4, [[-9, -1, 4], [7, 13, -0.1]]);
  blk(-9, -1, 0, 4, -50.4, -50.3, 0x2a3a48); // 玻璃門
  blk(-5.05, -4.95, 0, 4, -50.3, -50.2, 0x9aa0a8);
  blk(-14, 6, 9, 13, -49.9, -49.6, 0xc02820); // 招牌底
  blk(-13, 5, 9.6, 12.4, -49.6, -49.5, 0xfff0a0, G);
  for (let i = 0; i < 6; i++) blk(-12 + i * 2.8, -10.4 + i * 2.8, 10, 12, -49.5, -49.4, 0xc02820); // 招牌字（色塊）
  blk(-60, 60, 4, 4.6, -50, -49, 0xb0a490); // 雨遮
  // 遠方的樹
  for (let i = 0; i < 26; i++) {
    const x = (i % 2 ? -1 : 1) * rand(32, 60), z = rand(-48, 30);
    blk(x - 0.2, x + 0.2, 0, 2, z - 0.2, z + 0.2, 0x5a4030);
    L.add(new THREE.ConeGeometry(1.6, 4, 6), x, 3.6, z, 0x3a6a30);
  }
  // 圍牆
  blk(-40, 40, 0, 0.8, 11.8, 12.2, 0x9a9488);
  L.build(); G.build();

  // ---------- 區域 2：地下停車場 (地板 y=-5) ----------
  curArea = 1; L = new Builder(false); G = new Builder(true);
  const Y2 = -5;
  tiles(-20, 20, -125, -55, Y2, 5, 0x55575a, 0x515356);
  blk(-20, 20, -0.4, 0, -125, -55, 0x6a6a68); // 天花板
  blk(-20.5, -20, Y2, 0, -125, -55, 0x8a8880); blk(20, 20.5, Y2, 0, -125, -55, 0x8a8880);
  wallX(-20, 20, Y2, 0, -55.2, 0.4, 0x8a8880, [[7, 13, -0.4]]);
  wallX(-20, 20, Y2, 0, -125.2, 0.4, 0x8a8880, [[-3, 3, -1]]);
  blk(-20, -19.9, Y2, Y2 + 1, -125, -55, 0xd0b030); blk(19.9, 20, Y2, Y2 + 1, -125, -55, 0xd0b030);
  for (let z = -60; z >= -120; z -= 12) for (const x of [-9, 9]) {
    blk(x - 0.4, x + 0.4, Y2, 0, z - 0.4, z + 0.4, 0x9a9890);
    blk(x - 0.42, x + 0.42, Y2, Y2 + 1.2, z - 0.42, z + 0.42, 0xd0b030);
  }
  for (let z = -60; z >= -122; z -= 6) { blk(-1, 1, -0.5, -0.4, z - 1.6, z + 1.6, 0xf0f6ff, G); }
  for (let z = -58; z >= -124; z -= 4) blk(-0.1, 0.1, Y2 + 0.01, Y2 + 0.02, z - 1.5, z, 0xe0c040);
  for (let z = -58; z >= -123; z -= 3) for (const x of [-11.4, 11.4]) blk(x - 0.05, x + 0.05, Y2 + 0.01, Y2 + 0.02, z - 0.04, z + 0.04, 0xd8d8d0);
  [[-13.9, -62], [-13.9, -68], [-13.9, -74], [-13.9, -77], [-13.9, -90], [-13.9, -96], [-13.9, -102], [-13.9, -114], [-13.9, -120],
   [13.9, -62], [13.9, -65], [13.9, -71], [13.9, -78], [13.9, -86], [13.9, -93], [13.9, -100], [13.9, -105], [13.9, -111], [13.9, -117], [13.9, -122]]
    .forEach(([x, z]) => parkedCar(x, Y2, z, Math.PI / 2));
  // 出口標示
  blk(-2, 2, -1.2, -0.6, -124.9, -124.8, 0x20a050, G);
  // 手扶梯通道（往上到美食街）
  L.add(new THREE.BoxGeometry(6, 0.2, 11.18), 0, -2.6, -130, 0x707478, 0, 0.4636);
  L.add(new THREE.BoxGeometry(6, 0.3, 11.18), 0, 1.55, -130, 0x9a9890, 0, 0.4636);
  blk(-3.4, -3, Y2, 4.5, -135, -125, 0xa0a098); blk(3, 3.4, Y2, 4.5, -135, -125, 0xa0a098);
  L.add(new THREE.BoxGeometry(0.3, 1, 11.18), -2.7, -1.9, -130, 0x202428, 0, 0.4636);
  L.add(new THREE.BoxGeometry(0.3, 1, 11.18), 2.7, -1.9, -130, 0x202428, 0, 0.4636);
  for (const [x, z] of [[4.5, -70], [-5.5, -95], [6, -114]]) prod('cone', x, Y2, z, 0xf06020);
  L.build(); G.build();

  // ---------- 區域 3：美食街 ----------
  curArea = 2; L = new Builder(false); G = new Builder(true);
  tiles(-25, 25, -180, -135, 0, 1.5, 0xc8b898, 0xb8a888);
  blk(-25, 25, 6, 6.4, -180, -135, 0xe8e0d0);
  for (let z = -140; z > -178; z -= 5) for (const x of [-15, -5, 5, 15]) blk(x - 1.2, x + 1.2, 5.9, 6, z - 0.3, z + 0.3, 0xfff8e0, G);
  blk(-25.5, -25, 0, 6, -180, -135, 0xd8c8a8); blk(25, 25.5, 0, 6, -180, -135, 0xd8c8a8);
  wallX(-25, 25, 0, 6, -135.2, 0.4, 0xd8c8a8, [[-3, 3, 4]]);
  wallX(-25, 25, 0, 6, -180.2, 0.4, 0xb0a088, [[-5, 5, 4.5]]);
  // 攤位（左右各兩間）
  const stallCol = [0xc03020, 0x2a70b0, 0x30a050, 0xe0a020];
  [[-25, -15.5], [-15.5, -6], [6, 15.5], [15.5, 25]].forEach(([a, b], i) => {
    blk(a, b, 0, 0.85, -172, -171.2, 0xe8e4dc); blk(a, b, 0.85, 0.93, -172.1, -171.1, 0x6a5040);
    blk(a + 0.3, b - 0.3, 3, 4.2, -171.4, -171.2, stallCol[i]);
    blk(a + 0.8, b - 0.8, 3.2, 4.0, -171.2, -171.1, 0xfff4d0, G);
    blk(a, b, 4.2, 6, -171.4, -171.2, 0xd8c8a8);
    blk(a, b, 0, 0.02, -180, -172, 0x9a9a98);
    blk(a + 0.2, b - 0.2, 0, 0.9, -179.9, -179.0, 0xa8acb0); // 後方流理台
    blk(a + 0.5, a + 1.7, 0.9, 1.6, -179.8, -179.2, 0x606468);
    for (let k = 0; k < 4; k++) prod('cup', a + 1 + k * 0.9 + Math.random() * 0.3, 0.93, -171.6, pick([0xf0f0f0, 0xe03030, 0xf0d040]));
    for (let k = 0; k < 3; k++) prod('bottle', a + 3 + k * 1.2, 0.9, -179.5, pick([0x30a050, 0x8a3020, 0xe0d0a0]));
  });
  for (const x of [-15.5, 6, 15.5, -6]) blk(x - 0.1, x + 0.1, 0, 6, -180, -171.2, 0xc8b898);
  for (const x of [-20, -10, 10, 20]) blk(x - 0.7, x + 0.7, 0, 2.2, -179.95, -179.9, 0x3a2a20); // 廚房門
  // 柱子
  for (const [x, z] of [[-10, -150], [10, -150], [-10, -165], [10, -165]]) blk(x - 0.5, x + 0.5, 0, 6, z - 0.5, z + 0.5, 0xe0d8c8);
  // 桌椅
  const tables = [];
  for (const z of [-145, -152, -159]) for (const x of [-18, -14, -4.5, 4.5, 14, 18]) tables.push([x, z]);
  for (const x of [-18, -14, 14, 18]) tables.push([x, -165]);
  tables.forEach(([x, z]) => {
    if ((x === -4.5 && z === -152) || (x === 4.5 && z === -159)) return;
    blk(x - 0.6, x + 0.6, 0.72, 0.78, z - 0.6, z + 0.6, 0xf0ece0);
    blk(x - 0.06, x + 0.06, 0, 0.72, z - 0.06, z + 0.06, 0x707070);
    for (const [cx, cz] of [[-0.9, 0], [0.9, 0]]) { blk(x + cx - 0.22, x + cx + 0.22, 0.42, 0.48, z + cz - 0.22, z + cz + 0.22, 0xd04030); blk(x + cx - 0.22 + (cx > 0 ? 0.38 : 0), x + cx - 0.16 + (cx > 0 ? 0.38 : 0), 0.48, 0.95, z - 0.22, z + 0.22, 0xd04030); blk(x + cx - 0.04, x + cx + 0.04, 0, 0.42, z - 0.04, z + 0.04, 0x606060); }
    if (Math.random() < 0.7) prod('cup', x + rand(-0.3, 0.3), 0.78, z + rand(-0.3, 0.3), pick([0xffffff, 0xe03030, 0xf0d040, 0x40a0e0]));
    if (Math.random() < 0.4) prod('bottle', x + rand(-0.3, 0.3), 0.78, z + rand(-0.3, 0.3), pick([0x30a050, 0x8a3020]));
  });
  // 翻倒的桌子（掩體）
  for (const [x, z] of [[-6, -150], [6, -148], [-12, -156], [12, -158], [-4.5, -152.2], [4.5, -159.2], [-16, -166.2]]) {
    blk(x - 0.65, x + 0.65, 0, 1.0, z - 0.04, z + 0.04, 0xf0ece0); blk(x - 0.06, x + 0.06, 0.6, 0.66, z - 0.7, z - 0.04, 0x707070);
  }
  // 中間的盆栽
  for (const [x, z] of [[-2.2, -170], [2.2, -170]]) { blk(x - 0.5, x + 0.5, 0, 0.8, z - 0.5, z + 0.5, 0x8a6a4a); L.add(new THREE.ConeGeometry(0.7, 1.6, 6), x, 1.6, z, 0x3a7a3a); }
  L.build(); G.build();

  // ---------- 區域 4：超市 ----------
  curArea = 3; L = new Builder(false); G = new Builder(true);
  tiles(-25, 25, -245, -180, 0, 1, 0xc8c8c4, 0xbcbcb8);
  blk(-25, 25, 6, 6.4, -245, -180, 0xe8ecf0);
  for (let z = -184; z > -244; z -= 6) for (const x of [-17.6, -11.6, -5.6, 0, 5.6, 11.6, 17.6]) blk(x - 0.25, x + 0.25, 5.9, 6, z - 2, z + 2, 0xffffff, G);
  blk(-25.5, -25, 0, 6, -245, -180, 0xd0d8e0); blk(25, 25.5, 0, 6, -245, -180, 0xd0d8e0);
  wallX(-25, 25, 0, 6, -245.2, 0.4, 0xd0d8e0, [[-17, -11, 4.5], [8, 12, 2.5]]);
  blk(8, 12, 0, 2.5, -245.1, -245.0, 0x404850); // 倉庫門
  // 貨架
  const shelfCol = [0x3070b0, 0xc04030, 0x30a060, 0xe0a020];
  [-20.6, -14.6, -8.6, -2.6, 2.6, 8.6, 14.6, 20.6].forEach((x, i) => shelf(x, -190, -214, 0, shelfCol[i % 4], Math.abs(x) < 3));
  // 走道上方的分類牌
  for (const x of [-17.6, -11.6, -5.6, 0, 5.6, 11.6, 17.6]) { blk(x - 1, x + 1, 3.6, 4.2, -190.1, -190, pick(shelfCol)); blk(x - 0.05, x + 0.05, 4.2, 6, -190.08, -190.02, 0x808890); }
  // 冷凍櫃（右後）
  for (const [x0, x1] of [[6, 12], [15, 21]]) {
    blk(x0, x1, 0, 0.8, -232, -228, 0xe8eef2); blk(x0 + 0.1, x1 - 0.1, 0.8, 0.85, -231.9, -228.1, 0x8ad0f0, G);
    for (let x = x0 + 0.4; x < x1 - 0.3; x += 0.5) prod(pick(['box', 'can']), x, 0.85, -231.2, pick([0x60b0e0, 0xffffff, 0xe06050]));
  }
  blk(24, 25, 0, 2.4, -244, -220, 0xd8e4ea); blk(23.9, 24, 0.3, 2.2, -243.5, -220.5, 0x9ad8f8, G);
  // 結帳櫃台（左後）
  for (const x of [-22, -17, -12, -7]) {
    blk(x - 0.45, x + 0.45, 0, 0.8, -239, -233, 0x404650); blk(x - 0.47, x + 0.47, 0.8, 0.85, -239, -233, 0x202428);
    blk(x - 0.25, x + 0.25, 0.85, 1.2, -234.2, -233.6, 0x2a2e34); blk(x - 0.05, x + 0.05, 0.85, 2.6, -233.2, -233.1, 0x808890);
    blk(x - 0.3, x + 0.3, 2.6, 2.95, -233.2, -233.0, 0xe03030); blk(x - 0.2, x + 0.2, 2.65, 2.9, -233.0, -232.95, 0xfff0a0, G);
    for (let z = -238.5; z < -235; z += 0.45) prod(pick(['can', 'box', 'bottle']), x + rand(-0.15, 0.15), 0.85, z, pick([0xe04030, 0xf0d040, 0x3070d0, 0x30a050]));
  }
  // 入口處的特價堆
  for (const [x, z] of [[-8, -184], [8, -185]]) {
    blk(x - 1, x + 1, 0, 0.6, z - 1, z + 1, 0xc04030);
    for (let i = 0; i < 9; i++) prod('melon', x - 0.6 + (i % 3) * 0.6, 0.6, z - 0.6 + Math.floor(i / 3) * 0.6, 0x50a040);
  }
  L.build(); G.build();

  // ---------- 區域 5：服飾店 ----------
  curArea = 4; L = new Builder(false); G = new Builder(true);
  tiles(-25, 10, -282, -245, 0, 1.2, 0x9a7050, 0x8e6648);
  blk(-25, 10, 5, 5.4, -282, -245, 0xf0e8ec);
  for (let z = -250; z > -280; z -= 6) for (const x of [-20, -12, -4, 4]) blk(x - 0.6, x + 0.6, 4.9, 5, z - 0.6, z + 0.6, 0xfff0f4, G);
  blk(-25.5, -25, 0, 5, -282, -245, 0xe8d0d8); blk(10, 10.5, 0, 5, -282, -245, 0xe8d0d8);
  wallX(-25, 10, 0, 5, -282.2, 0.4, 0xe8d0d8, [[-6, -1, 3.6]]);
  // 衣架
  const rackClothes = [0xe04060, 0x3060c0, 0xf0f0f0, 0x202020, 0xe0c040, 0x40a080, 0xa060c0];
  for (const [x, z, horiz] of [[-22, -252, 1], [-6, -253, 1], [-21, -274, 0], [-2, -258, 0], [-17.5, -266, 1], [6, -262, 0]]) {
    const len = 2.4;
    if (horiz) {
      blk(x - len / 2, x + len / 2, 1.5, 1.56, z - 0.03, z + 0.03, 0xb0b0b8);
      for (const ex of [-len / 2, len / 2]) blk(x + ex - 0.04, x + ex + 0.04, 0, 1.56, z - 0.04, z + 0.04, 0xb0b0b8);
      for (let k = -len / 2 + 0.15; k < len / 2; k += 0.18) blk(x + k - 0.07, x + k + 0.07, 0.55, 1.45, z - 0.25, z + 0.25, pick(rackClothes));
    } else {
      blk(x - 0.03, x + 0.03, 1.5, 1.56, z - len / 2, z + len / 2, 0xb0b0b8);
      for (const ez of [-len / 2, len / 2]) blk(x - 0.04, x + 0.04, 0, 1.56, z + ez - 0.04, z + ez + 0.04, 0xb0b0b8);
      for (let k = -len / 2 + 0.15; k < len / 2; k += 0.18) blk(x - 0.25, x + 0.25, 0.55, 1.45, z + k - 0.07, z + k + 0.07, pick(rackClothes));
    }
  }
  // 展示桌（摺好的衣服）
  for (const [x, z] of [[-10, -250.5], [-8, -270]]) {
    blk(x - 1, x + 1, 0, 0.8, z - 0.6, z + 0.6, 0xf0e8e0);
    for (let i = 0; i < 6; i++) prod('box', x - 0.7 + (i % 3) * 0.7, 0.8, z - 0.25 + Math.floor(i / 3) * 0.5, pick(rackClothes));
  }
  // 試衣間（右後）
  for (let i = 0; i < 3; i++) {
    const x0 = 1.5 + i * 2.6;
    blk(x0, x0 + 0.1, 0, 2.6, -282, -279.5, 0xd8c0c8);
    blk(x0 + 0.1, x0 + 2.5, 2.3, 2.4, -279.6, -279.5, 0xb0b0b8);
    blk(x0 + 0.15, x0 + 2.45, 0.25, 2.3, -279.55, -279.45, [0x8a2040, 0x20408a, 0x2a6a40][i]);
  }
  blk(9.3, 9.4, 0, 2.6, -282, -279.5, 0xd8c0c8);
  // 收銀台
  blk(-10, -6, 0, 1.05, -277, -276.2, 0xf0e8e0); blk(-10.1, -5.9, 1.05, 1.12, -277.1, -276.1, 0x5a4048);
  // 櫥窗台座
  for (const [x, z] of [[-18, -256], [-10, -257], [-15, -261], [-7, -262], [-20, -264], [-12, -266], [-17, -270], [0, -272], [5, -270], [-1, -277], [7, -275]])
    cyl(0.45, 0.15, x, 0.075, z, 0xf8f0f4, 8);
  L.build(); G.build();
  // 假人（有些是喬裝的壞人）
  [['m1', -18, -256, 0], ['m2', -10, -257, 0], ['m3', -15, -261, 1], ['m4', -7, -262, 0], ['m5', -20, -264, 0], ['m6', -12, -266, 1], ['m7', -17, -270, 1],
   ['m8', 0, -272, 1], ['m9', 5, -270, 0], ['m10', -1, -277, 1], ['m11', 7, -275, 1]].forEach(([id, x, z, bad]) => spawnMannequin(id, x, z, !!bad));

  // ---------- 區域 6：中央廣場 ----------
  curArea = 5; L = new Builder(false); G = new Builder(true);
  tiles(-30, 30, -336, -282, 0, 2, 0xa8a49c, 0x989088);
  blk(-30.5, -30, 0, 14, -336, -282, 0xd0c8b8); blk(30, 30.5, 0, 14, -336, -282, 0xd0c8b8);
  wallX(-30, 30, 0, 14, -282.3, 0.4, 0xd0c8b8, [[-6, -1, 3.6]]);
  blk(-30, 30, 0, 14, -336.4, -336, 0xc8c0b0);
  blk(-30, -10, 14, 14.4, -336, -282, 0xe0dcd4); blk(10, 30, 14, 14.4, -336, -282, 0xe0dcd4);
  blk(-10, 10, 14.3, 14.4, -336, -282, 0xd8f0ff, G); // 天窗
  for (let z = -286; z > -334; z -= 6) blk(-10, 10, 13.8, 14.3, z - 0.15, z + 0.15, 0xa0a8b0);
  // 二樓走廊
  for (const s of [-1, 1]) {
    const xa = s * 22, xb = s * 30;
    blk(Math.min(xa, xb), Math.max(xa, xb), 5, 5.3, -336, -282, 0xd8d0c0);
    blk(Math.min(xa, xb), Math.max(xa, xb), 4.8, 5.0, -336, -282, 0xb0a898);
    blk(s * 22 - 0.1, s * 22 + 0.1, 5.3, 6.4, -336, -282, 0x9ab8c8); // 欄杆（玻璃）
    blk(s * 22 - 0.12, s * 22 + 0.12, 6.4, 6.5, -336, -282, 0x808890);
    for (let z = -290; z > -334; z -= 10) blk(s * 22.5 - 0.4, s * 22.5 + 0.4, 0, 5, z - 0.4, z + 0.4, 0xe0d8c8);
    for (let z = -286; z > -334; z -= 8) { // 店面
      blk(s * 29.8 - 0.1, s * 29.8 + 0.1, 0.2, 4, z - 3, z + 3, pick([0x40607a, 0x7a4050, 0x507a40, 0x7a6a40]));
      blk(s * 29.8 - 0.1, s * 29.8 + 0.1, 5.6, 8.5, z - 3, z + 3, pick([0x40607a, 0x7a4050, 0x507a40, 0x7a6a40]));
      blk(s * 29.6 - 0.05, s * 29.6 + 0.05, 8.6, 9.2, z - 2, z + 2, 0xfff0c0, G);
    }
  }
  // 花台（掩體）
  for (const [x, z] of [[-7, -301], [7, -301]]) { blk(x - 1.2, x + 1.2, 0, 0.8, z - 1.2, z + 1.2, 0x9a8a78); L.add(new THREE.ConeGeometry(0.5, 1.2, 6), x, 1.4, z, 0x3a7a3a); }
  // 中央噴水池
  // 表演舞台
  blk(-10, 10, 0, 1.2, -331, -322, 0x3a2a30); blk(-10, 10, 1.2, 1.25, -331, -322, 0x5a3a40);
  blk(-12, 12, 1.2, 9, -331.6, -331, 0x24202a);
  blk(-8, 8, 4, 8, -330.95, -330.9, 0xd03050); blk(-7, 7, 4.6, 7.4, -330.9, -330.85, 0xffe080, G);
  blk(-10.5, 10.5, 8.6, 9, -328, -327.6, 0x505058); for (const x of [-10.3, 10.3]) blk(x - 0.15, x + 0.15, 1.2, 9, -327.95, -327.65, 0x505058);
  for (let x = -8; x <= 8; x += 4) blk(x - 0.25, x + 0.25, 8.3, 8.6, -327.9, -327.7, 0xfff8d0, G);
  for (const x of [-11.5, 11.5]) { blk(x - 0.7, x + 0.7, 0, 3.2, -324.7, -323.3, 0x1a1a1e); cyl(0.4, 0.05, x, 2.4, -323.27, 0x404048); }
  for (let i = 0; i < 4; i++) blk(-3 + i * 1.6, -2.2 + i * 1.6, 0, 0.3 + i * 0.3, -322, -321.4 + 0, 0x3a2a30); // 舞台階梯（裝飾）
  // 長椅
  for (const [x, z] of [[-14, -296], [14, -296], [-14, -312], [14, -312]]) { blk(x - 1.2, x + 1.2, 0.4, 0.5, z - 0.3, z + 0.3, 0x8a6a4a); blk(x - 1.1, x + 1.1, 0, 0.4, z - 0.2, z + 0.2, 0x505050); }
  L.build(); G.build();
}


// ================= Boss =================
function s1SpawnBoss() {
  const h = makeHuman({ shirt: 0x9a3024, pants: 0x34344a, skin: 0xc89070, head: 0x8a2018, face: 'mask', vest: 0x4a4a50, bandana: 0xe04020, gun: true, grenadeHand: true, scale: C.boss.scale, shoe: 0x3a2a1a });
  h.root.position.set(-9, 1.25, -326); scene.add(h.root);
  const bhp = Math.round(C.boss.hp * diff().bossHpMul);
  boss = { h, hp: bhp, max: bhp, alive: true, state: 'intro', t: 0, dir: 1, phase: 1, idle: 0, summonT: rand(...C.boss.summonEvery), bigs: [], minions: 0, last: 'throw', flashT: 0, hitFlash: 0, dead: false };
  h.hb.forEach(m => { m.userData.boss = true; });
  $('bossbar').style.display = 'block'; $('bossName').textContent = 'BOSS　爆破狂 雷克斯'; updBoss();
  setMusic(BOSS_BGM);
  bigText('爆破狂 雷克斯', '', 2.2); sayKey('s1boss', 2);
  boss.update = bossUpdate; boss.hit = (ud, point) => bossHit(ud, point);
  boss.targets = () => (boss.alive ? boss.h.hb.concat(boss.bigs.map(x => x.hit)) : []);
  boss.botTarget = () => { if (!boss.alive) return null; const bg = boss.bigs.filter(x => !x.back && !x.held && x.pause <= 0).sort((a, z) => z.s - a.s)[0]; return bg ? bg.g.position.clone() : boss.phase === 1 ? boss.h.body.localToWorld(V3(0, 1.2, 0)) : null; }; boss.aimers = () => (boss.alive && boss.state === 'aim' ? [boss] : []);
  boss.cleanup = () => { removeBig(); scene.remove(h.root); };
  return boss;
}
function updBoss() { $('bossfill').style.width = Math.max(0, boss.hp / boss.max * 100) + '%'; }
function bossFace() { const r = boss.h.root; r.rotation.y = Math.atan2(camera.position.x - r.position.x, camera.position.z - r.position.z); }
function bossHit(ud, point) {
  if (!boss.alive) return;
  if (ud.part === 'big') return bigHit(ud.bigRef, point);
  const head = ud.part === 'head';
  // 直接打他：傷害很低（打手榴彈回去才有感）
  combo++; maxCombo = Math.max(maxCombo, combo); score += 20; updHud();
  if (!boss.immuneSaid && boss.hp < boss.max * 0.97) { boss.immuneSaid = true; sayKey('s1bossImmune', 2); }
  bossDamage(C.boss.shotDamage * (head ? C.enemy.headMul : 1), point, head);
}
function bossDamage(dmg, point, head) {
  const h = boss.h;
  boss.hp -= dmg; sfx(head ? 'kill' : 'hit'); spark(point, 0xffe0a0);
  boss.hitFlash = 0.08; h.mats.forEach(m => m.emissive && m.emissive.setHex(0x553300));
  if (boss.phase === 1 && boss.hp <= boss.max * C.boss.phase2At) {
    boss.phase = 2; boss.last = 'throw'; sayKey('s1boss2', 2);
    if (boss.state === 'windup') { boss.state = 'idle'; boss.t = 0; boss.idle = 1.0; h.grenade.visible = false; }
  }
  if (boss.hp <= 0) {
    sayReset(); sayKey('s1bossDown', 2); removeBig();
    boss.hp = 0; boss.alive = false; boss.state = 'dead'; boss.t = 0; h.flash.visible = false; h.grenade.visible = false;
    stats.kills++; addScore(C.score.bossKill, h.root.position.clone().add(V3(0, 3, 0)), '擊倒 Boss', '#ffd040');
    slowmo = 1.6; sfx('boom');
    ents.forEach(e => { if (e.type === 'enemy' && e.alive) { e.state = 'dead'; e.t = 0; e.alive = false; } });
  }
  updBoss();
}
// 第二階段的巨大手榴彈：打中會被推回去，打滿次數就飛回雷克斯身上爆炸
function bigSpawn(n) {
  const c = C.boss, r = c.bigSize;
  // 還有舊的手榴彈沒處理完就要丟新的：舊的直接消失（避免卡在半空中）
  boss.bigs.forEach(bg => { spark(bg.g.position, 0xc0c0c0); scene.remove(bg.g); });
  boss.bigs = [];
  const right = V3(1, 0, 0).applyQuaternion(camera.quaternion), fwd = V3(0, 0, -1).applyQuaternion(camera.quaternion);
  for (let i = 0; i < n; i++) {
    const side = n > 1 ? (i - (n - 1) / 2) * 2 : 0; // -1 / +1
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshLambertMaterial({ color: 0x3a5a2a })));
    for (const y of [-0.35, 0, 0.35]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02 * Math.cos(y), r * 1.02 * Math.cos(y), r * 0.12, 12), new THREE.MeshLambertMaterial({ color: 0x2a4220 })); band.position.y = Math.sin(y) * r; g.add(band); }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(r * 0.5, r * 0.4, r * 0.5), new THREE.MeshLambertMaterial({ color: 0x8a8a80 })); cap.position.y = r * 0.95; g.add(cap);
    const lever = new THREE.Mesh(new THREE.BoxGeometry(r * 0.15, r * 0.9, r * 0.12), new THREE.MeshLambertMaterial({ color: 0x8a8a80 })); lever.position.set(r * 0.32, r * 0.55, 0); lever.rotation.z = -0.3; g.add(lever);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3020 })); lamp.position.y = r * 1.25; g.add(lamp);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(r * 1.3, 8, 6), HB_MAT); hit.userData.boss = true; hit.userData.part = 'big'; g.add(hit);
    scene.add(g);
    const to = camera.position.clone().addScaledVector(fwd, 1.8).addScaledVector(right, side * c.bigSpread).add(V3(0, -0.3, 0));
    const bg = { g, hit, lamp, side, from: V3(), to, s: 0, hits: 0, back: false, held: true, pause: i * c.bigGap, t: 0 };
    hit.userData.bigRef = bg; boss.bigs.push(bg); bigHold(bg);
  }
}
function bigHold(bg) { bg.from.copy(boss.h.root.position).add(V3(bg.side * 0.9, 4.4, 0.3)); bg.g.position.copy(bg.from); }
function bigRemove(bg) { scene.remove(bg.g); boss.bigs = boss.bigs.filter(x => x !== bg); }
function removeBig() { if (boss && boss.bigs) { boss.bigs.forEach(bg => scene.remove(bg.g)); boss.bigs = []; } }
function bigHit(bg, point) {
  if (!bg || bg.back || bg.held) return true;
  const c = C.boss;
  bg.hits++; spark(point, 0xffe080); sfx('armor');
  if (boss.phase === 2) { bg.s = Math.max(0, bg.s - c.bigPush); bg.pause = Math.max(bg.pause, 0.18); } // 第二階段：被打退
  // 第一階段：不後退也不變慢，只計算打中次數
  combo++; maxCombo = Math.max(maxCombo, combo); score += 80; updHud();
  if (bg.hits >= c.bigHits) { bg.back = true; popup('打回去！', point, '#ffb040', true); sfx('go'); }
  else popup(bg.hits + ' / ' + c.bigHits, point, '#ffe070');
  return true;
}
function bigUpdate(dt) {
  const b = boss, c = C.boss; if (!b.bigs || !b.bigs.length) return;
  b.bigs.slice().forEach(bg => {
    if (!b.alive) return;
    bg.t += dt;
    bg.lamp.visible = Math.floor(bg.t * (bg.s > 0.6 ? 14 : 5)) % 2 === 0;
    if (bg.held) { bigHold(bg); return; }
    if (bg.back) bg.s -= dt / c.bigReturn;
    else if (bg.pause > 0) bg.pause -= dt;
    else bg.s += dt / ((b.phase === 2 ? c.bigFlight2 : c.bigFlight) * diff().fireWaitMul);
    const s = clamp(bg.s, 0, 1);
    bg.g.position.lerpVectors(bg.from, bg.to, s); bg.g.position.y += Math.sin(s * Math.PI) * c.bigArc;
    bg.g.rotation.x += dt * (bg.back ? -9 : 2.5); bg.g.rotation.z += dt * 1.3;
    if (bg.back && bg.s <= 0) {
      const p = bg.from.clone(); bigRemove(bg); explode(p, 5);
      addScore(C.score.interrupt || 400, p.clone().add(V3(0, 0.6, 0)), '反擊', '#ffb040');
      const L = VO.lines.s1bossBack; if (L) say(Array.isArray(L) ? L[Math.floor(Math.random() * L.length)] : L, 1);
      if (b.state !== 'summon') { b.state = 'stagger'; b.t = 0; }
      bossDamage(c.bigDamage, p, false);
    } else if (!bg.back && bg.s >= 1) {
      const p = bg.g.position.clone(); bigRemove(bg); explode(p, 5);
      $('flash').style.transition = 'none'; $('flash').style.opacity = 0.8; requestAnimationFrame(() => { $('flash').style.transition = 'opacity .6s'; $('flash').style.opacity = 0; });
      playerHurt(c.bigHurt);
    }
  });
}
function bossUpdate(dt) {
  const b = boss, h = b.h, r = h.root;
  if (b.hitFlash > 0) { b.hitFlash -= dt; if (b.hitFlash <= 0) h.mats.forEach(m => m.emissive && m.emissive.setHex(0)); }
  if (b.flashT > 0) { b.flashT -= dt; if (b.flashT <= 0) h.flash.visible = false; }
  b.t += dt;
  const walk = (speed) => {
    r.position.x += b.dir * speed * dt;
    if (r.position.x > 6) b.dir = -1; if (r.position.x < -6) b.dir = 1;
    const sw = Math.sin(gameTime * 10) * 0.5; h.legL.rotation.x = sw; h.legR.rotation.x = -sw;
  };
  const stand = () => { h.legL.rotation.x = h.legR.rotation.x = 0; };
  if (b.state !== 'dead') bossFace();
  bigUpdate(dt);
  switch (b.state) {
    case 'intro':
      r.position.x = lerp(-9, 0, Math.min(1, b.t / 2.2)); { const sw = Math.sin(gameTime * 10) * 0.5; h.legL.rotation.x = sw; h.legR.rotation.x = -sw; }
      h.armR.rotation.x = -0.4; h.armL.rotation.x = -0.3;
      if (b.t > 2.6) { b.state = 'idle'; b.t = 0; b.idle = 0.6; stand(); }
      break;
    case 'idle': {
      walk(C.boss.moveSpeed * (b.phase === 2 ? 1.4 : 1));
      h.armR.rotation.x = lerp(h.armR.rotation.x, -0.4, 0.2); h.armL.rotation.x = lerp(h.armL.rotation.x, -0.3, 0.2); h.armL.rotation.z = 0;
      if (b.phase === 2) b.summonT -= dt;
      if (b.t >= b.idle) {
        stand(); b.t = 0;
        if (b.phase === 2 && b.summonT <= 0 && b.minions < C.boss.summonMax) { b.state = 'summon'; b.summonT = rand(...C.boss.summonEvery); }
        else { b.state = 'bigWind'; b.last = 'throw'; bigSpawn(b.phase === 2 ? C.boss.bigCount2 : 1); sfx('reveal'); }
      }
      break;
    }
    case 'aim': {
      const a = Math.min(1, b.t / 0.2);
      h.armR.rotation.x = lerp(-0.4, -Math.PI / 2, a); h.armL.rotation.x = lerp(-0.3, -1.3, a); h.armL.rotation.z = lerp(0, 0.5, a);
      if (b.t >= b.wait) { h.flash.visible = true; b.flashT = 0.08; sfx('enemyShot'); playerHurt(1); b.state = 'idle'; b.t = 0; b.idle = rand(...(b.phase === 2 ? C.boss.idleTime2 : C.boss.idleTime)); }
      break;
    }
    case 'windup': {
      const k = Math.min(1, b.t / C.boss.windup);
      h.armR.rotation.x = lerp(-0.4, Math.PI * 0.85, easeOut(k)); h.armL.rotation.x = -0.6;
      r.position.y = 1.25 + Math.sin(b.t * 30) * 0.01;
      if (k >= 1) {
        h.grenade.visible = false;
        const n = C.boss.grenades1;
        const from = h.grenade.getWorldPosition(V3(0, 0, 0));
        for (let i = 0; i < n; i++) throwGrenade(from, i, n, { dur: C.boss.grenadeFlight });
        b.state = 'throwEnd'; b.t = 0;
      }
      break;
    }
    case 'bigWind': { // 雙手把巨大手榴彈舉過頭
      const k = Math.min(1, b.t / C.boss.bigWindup);
      h.armR.rotation.x = h.armL.rotation.x = lerp(-0.4, Math.PI * 0.95, easeOut(k));
      if (k >= 1) { b.bigs.forEach(bg => { bg.held = false; bg.from.copy(bg.g.position); }); b.state = 'bigWait'; b.t = 0; sfx('go'); }
      break;
    }
    case 'bigWait':
      h.armR.rotation.x = lerp(h.armR.rotation.x, -0.5, 0.15); h.armL.rotation.x = lerp(h.armL.rotation.x, -0.4, 0.15);
      if (!b.bigs.length) { b.state = 'idle'; b.t = 0; b.idle = rand(...(b.phase === 2 ? C.boss.idleTime2 : C.boss.idleTime)); }
      break;
    case 'throwEnd':
      h.armR.rotation.x = lerp(Math.PI * 0.85, -0.6, Math.min(1, b.t / 0.25));
      if (b.t > 0.5) { b.state = 'idle'; b.t = 0; b.idle = rand(...(b.phase === 2 ? C.boss.idleTime2 : C.boss.idleTime)); }
      break;
    case 'stagger':
      r.rotation.x = -Math.sin(Math.min(1, b.t / C.boss.staggerTime) * Math.PI) * 0.35;
      h.armR.rotation.x = lerp(h.armR.rotation.x, -0.2, 0.2);
      if (b.t >= C.boss.staggerTime) { r.rotation.x = 0; b.state = 'idle'; b.t = 0; b.idle = 0.8; }
      break;
    case 'summon': {
      h.armL.rotation.x = Math.PI * 0.9; h.armL.rotation.z = -0.3;
      if (b.t > 0.7 && !b.summoned) {
        b.summoned = true;
        const spots = [
          { at: [-9.4, -324.2], from: [-11.6, -325.4], pop: 'side' }, { at: [9.4, -324.2], from: [11.6, -325.4], pop: 'side' },
          { at: [-7.5, -324], from: [-9.5, -330.5], y: 1.25, pop: 'run' }, { at: [7.5, -324], from: [9.5, -330.5], y: 1.25, pop: 'run' }];
        const chosen = spots.sort(() => Math.random() - 0.5).slice(0, C.boss.summonCount);
        chosen.forEach(s => { spawnHuman(Object.assign({ k: 'thug', minion: true, y: s.y !== undefined ? s.y : 0, shots: 2 }, s), null); b.minions++; });
      }
      if (b.t > 1.2) { b.summoned = false; b.state = 'idle'; b.t = 0; b.idle = 1.0; h.armL.rotation.z = 0; }
      break;
    }
    case 'dead': {
      const k = Math.min(1, b.t / 1.0);
      r.rotation.x = -easeOut(k) * Math.PI / 2 * 0.95;
      if (b.t > 1.4) setOpacity(b, Math.max(0, 1 - (b.t - 1.4) / 0.8));
      if (b.t > 3.0 && !b.done) { b.done = true; scene.remove(r); }
      break;
    }
  }
}


// ================= 關卡腳本 =================
// type: move（鏡頭移動，可帶 ambush 途中伏擊）/ cut（停下來打，waves 依序出現）/ boss / end
// 敵人：k:'thug'（armored:true 為重裝）/'hostage'/'staff'（民眾、店員）/'car'（開車出來，riders 下車）/'reveal'（喬裝假人 id）
// pop：side = 從掩體後面橫移出來；up = 從掩體後面站起來；run = 從遠處跑過來
const S1_LEVEL = [
  { a: 0, type: 'tut' }, // 教學（可跳過）
  // ===== 區域 1：戶外停車場（教學） =====
  { a: 0, type: "cut", waves: [
    [{ k: "thug", at: [-4.3, -18.8], from: [-6, -18.9], pop: "side" }],
    [{ k: "thug", at: [5.45, -18.94], pop: "side", crouch: true, from: [6, -18.7] }, { k: "thug", at: [-5.83, -19.52], from: [-11.5, -19], pop: "side", t: 0.9 }, { k: "thug", at: [3.5, -24], from: [10, -25], pop: "run", t: 1.4 }, { k: "bonus", at: [-2, -31], from: [-10, -31.5], pop: "run", t: 0.4 }],
    [{ k: "thug", at: [1.2, -22], from: [-6, -24.5], pop: "run" }, { k: "thug", at: [-5.69, -19.09], pop: "side", t: 0.6, crouch: true, from: [-6.5, -18.7] }],
    [{ k: "thug", at: [-4.3, -18.8], from: [-6, -18.9], pop: "side" }, { k: "thug", at: [5.45, -18.94], pop: "side", t: 0.3, crouch: true, from: [6, -18.7] }, { k: "thug", at: [0.5, -25], from: [8, -26], pop: "run", t: 0.8 }],
  ] },
  { a: 0, type: "move", to: [3, 1.6, -21], look: [-2.2, 1.3, -45], dur: 2.6 },
  { a: 0, type: "cut", say: 's1_hostage', waves: [
    [{ k: "thug", at: [-3.49, -32.91], pop: "side", crouch: true, from: [-4, -32.6] }, { k: "bonus", at: [-8.2, -32.7], from: [-10, -32.8], pop: "side", t: 0.7 }, { k: "thug", at: [1.5, -30.5], from: [8, -38], pop: "run", t: 1.2 }],
    [{ cam: [2.5, 1.6, -33], look: [-3, 1.3, -48] }, { k: "hostage", at: [-4.87, -48], from: [-11, -47.5], pop: "run" }, { k: "thug", at: [2.19, -44.85], pop: "side", t: 0.5, crouch: true, from: [1, -44.7] }, { k: "thug", at: [-2.2, -46.5], from: [-5, -49.6], pop: "run", t: 1.1 }, { k: "bonus", at: [-1, -48.5], from: [-5, -49.6], pop: "run", t: 1.6, mg: true }],
    [{ k: "thug", at: [2.9, -44.7], from: [1, -44.8], pop: "side" }, { k: "thug", at: [-8.2, -44.7], from: [-10, -44.8], pop: "side", t: 0.4 }, { k: "thug", at: [-3.48, -44.99], pop: "side", t: 1, crouch: true, from: [-4, -44.7] }, { k: "bonus", at: [-12.5, -46], from: [-15, -48], pop: "run", t: 1.4 }],
  ] },
  { a: 0, type: "move", to: [10, 1.6, -35.5], look: [10, 0, -55], dur: 2.2 },
  { a: 0, type: "move", to: [10, -3.4, -55.5], look: [6, -3.8, -75], dur: 2.8, ambush: [{ t: 1.6, k: "thug", at: [10.8, -68], y: -5, from: [3, -75], pop: "run" }] },
  // ===== 區域 2：地下停車場 =====
  { a: 1, type: "move", to: [3, -3.4, -72], look: [0, -4, -90], dur: 2.8 },
  { a: 1, type: "cut", waves: [
    [{ k: "thug", at: [-7.5, -84.8], from: [-9, -84.9], pop: "side" }, { k: "thug", at: [7.5, -84.8], from: [9, -84.9], pop: "side", t: 0.6 }, { k: "thug", at: [1.5, -92], from: [0, -110], pop: "run", t: 1.2 }, { k: "thug", at: [-7.5, -96.8], from: [-9, -96.9], pop: "side", t: 0.9 }],
    [{ k: "car", from: [-13.9, -86], to: [-1, -86], ry: 1.5708, dur: 1.5, color: 2775712, riders: [{ at: [-4.2, -87.1], from: [-1.6, -87.6] }, { at: [2.3, -87.1], from: [-0.2, -87.6] }] }, { k: "thug", at: [7.5, -84.8], from: [9, -84.9], pop: "side", t: 1.6 }],
    [{ cam: [4.5, -3.4, -82], look: [0, -4, -100] }, { k: "thug", at: [7.5, -96.8], from: [9, -96.9], pop: "side" }, { k: "thug", at: [3, -99], from: [0, -118], pop: "run", t: 0.3 }, { k: "thug", at: [-7.5, -96.8], from: [-9, -96.9], pop: "side", t: 1 }, { k: "bonus", at: [-3, -114], from: [-6, -122], pop: "run", t: 0.5, mg: true }],
  ] },
  { a: 1, type: "move", to: [5, -3.4, -93], look: [0, -4, -115], dur: 2 },
  { a: 1, type: "cut", waves: [
    [{ k: "car", from: [-2, -124], to: [-2, -108], ry: 0, dur: 1.4, color: 14211280, riders: [{ at: [-4.6, -104.6], from: [-3.6, -108] }, { at: [0.6, -111.6], from: [-3.6, -109.5] }, { at: [-5, -111.2], from: [-3.6, -110], armored: true }] }, { k: "thug", at: [4, -112], from: [8, -124], pop: "run", t: 1 }],
    [{ k: "hostage", at: [6.5, -102], from: [12, -102], pop: "run" }, { k: "thug", at: [-7.5, -108.8], from: [-9, -108.9], pop: "side", t: 0.4 }, { k: "thug", at: [1, -104], from: [-8, -121], pop: "run", armored: true, t: 0.9 }, { k: "bonus", at: [6, -121], from: [9, -124.5], pop: "run", t: 0.6 }],
  ] },
  { a: 1, type: "move", to: [3, -3.4, -110], look: [0, -3.6, -125], dur: 2.2, ambush: [{ t: 0.8, k: "thug", at: [7.5, -120.8], from: [9, -120.9], pop: "side" }] },
  { a: 1, type: "cut", waves: [
    [{ k: "thug", at: [-1.5, -120], from: [0, -124.5], pop: "run" }, { k: "thug", at: [3.5, -121], from: [1, -124.5], pop: "run", t: 0.6 }, { k: "thug", at: [-6, -122.5], from: [-9, -123.5], pop: "run", t: 1.1 }, { k: "thug", at: [7.5, -120.8], from: [9, -120.9], pop: "side", t: 1.5 }],
    [{ k: "thug", at: [5, -121.5], from: [9, -124.5], pop: "run" }, { k: "thug", at: [0.5, -121], from: [0, -124.8], pop: "run", armored: true, t: 0.5 }, { k: "staff", apron: 3170464, at: [-4.5, -122], from: [-9, -121.5], pop: "run", t: 0.3 }],
  ] },
  { a: 1, type: "move", to: [0, -3.4, -121.5], look: [0, -2, -135], dur: 1.6 },
  { a: 1, type: "move", to: [0, -3.4, -124.8], look: [0, 0, -138], dur: 0.8 },
  { a: 1, type: "move", to: [0, 1.6, -135.5], look: [0, 1.6, -150], dur: 2.8 },
  // ===== 區域 3：美食街 =====
  { a: 2, type: "move", to: [0, 1.6, -137.6], look: [0, 1.2, -162], dur: 1 },
  { a: 2, type: "cut", waves: [
    [{ k: "thug", at: [-6, -150.6], pop: "up" }, { k: "thug", at: [6, -148.6], pop: "up", t: 0.5 }, { k: "thug", at: [-4.5, -152.7], pop: "up", t: 1.1 }, { k: "thug", at: [3.5, -152], from: [8, -160], pop: "run", t: 1.3 }],
    [{ cam: [0, 1.6, -154], look: [0, 1.2, -172] }, { k: "hostage", at: [-2.5, -164], from: [-8, -166], pop: "run" }, { k: "thug", at: [-8.5, -172.7], pop: "up", t: 0.3 }, { k: "thug", at: [9, -172.7], pop: "up", t: 0.8 }, { k: "thug", at: [-11.5, -173.3], from: [-10, -179.4], pop: "run", t: 1.3 }],
    [{ k: "thug", at: [7.2, -166.6], from: [10, -166.7], pop: "side" }, { k: "thug", at: [-9.5, -173.5], from: [-10, -179.4], pop: "run", armored: true, t: 0.5 }, { k: "thug", at: [-1.31, -170.92], pop: "side", t: 1.2, crouch: true, from: [-2.2, -170.8] }],
  ] },
  { a: 2, type: "move", to: [-6, 1.6, -163], look: [-14, 1.3, -175], dur: 2 },
  { a: 2, type: "cut", waves: [
    [{ k: "staff", at: [-10.5, -172.8], pop: "up" }, { k: "thug", at: [-13.5, -172.7], pop: "up", t: 0.4 }, { k: "thug", at: [-7.5, -172.7], pop: "up", t: 0.9 }],
    [{ k: "thug", at: [-19.5, -173.4], from: [-20, -179.4], pop: "run" }, { k: "thug", at: [-8, -173.5], from: [-10, -179.4], pop: "run", t: 0.5 }, { k: "thug", at: [-12, -172.7], pop: "up", t: 1 }],
    [{ k: "thug", at: [-14.5, -173.4], from: [-10, -179.4], pop: "run" }, { k: "thug", at: [-8, -172.7], pop: "up", t: 0.5 }, { k: "thug", at: [-11, -173.4], from: [-10, -179.4], pop: "run", t: 1.2 }],
  ] },
  { a: 2, type: "move", to: [5, 1.6, -165], look: [14, 1.3, -175], dur: 1.8 },
  { a: 2, type: "cut", waves: [
    [{ k: "thug", at: [8.5, -172.7], pop: "up" }, { k: "thug", at: [14, -172.7], pop: "up", t: 0.35 }, { k: "thug", at: [22, -172.7], pop: "up", t: 0.7 }],
    [{ k: "bonus", at: [19.5, -173.4], from: [20, -179.4], pop: "run" }, { k: "staff", at: [12, -172.8], pop: "up", apron: 3186768 }, { k: "thug", at: [10.5, -173.3], from: [10, -179.4], pop: "run", t: 0.8 }],
    [{ k: "thug", at: [14, -172.7], pop: "up" }, { k: "thug", at: [22, -172.7], pop: "up", t: 0.4 }, { k: "thug", at: [11.5, -173.4], from: [10, -179.4], pop: "run", t: 0.9 }],
  ] },
  { a: 2, type: "move", to: [0, 1.6, -175], look: [0, 1.5, -195], dur: 1.6 },
  { a: 2, type: "move", to: [0, 1.6, -182], look: [0, 1.5, -200], dur: 1.4 },
  // ===== 區域 4：超市 =====
  { a: 3, type: "move", to: [0, 1.6, -187.5], look: [0, 1.3, -214], dur: 1.8, ambush: [{ t: 0.6, k: "thug", at: [1, -203], from: [5.5, -216.5], pop: "run" }] },
  { a: 3, type: "cut", waves: [
    [{ k: "thug", at: [-2.8, -198], y: 2.2, pop: "up", drop: 2.2 }, { k: "thug", at: [-0.4, -205], from: [-5, -217.5], pop: "run", t: 0.6 }, { k: "thug", at: [2.8, -201], y: 2.2, pop: "up", drop: 2.2, t: 1.2 }],
    [{ cam: [0, 1.6, -196], look: [0, 1.4, -214] }, { k: "thug", at: [2.8, -208], y: 2.2, pop: "up", drop: 2.2 }, { k: "thug", at: [1.2, -212], from: [6, -218], pop: "run", t: 0.5 }, { k: "thug", at: [-2.8, -204], y: 2.2, pop: "up", drop: 2.2, t: 1.1 }, { k: "thug", at: [-2.8, -214], y: 2.2, pop: "up", drop: 2.2, t: 1.5 }],
    [{ cam: [0, 1.6, -203], look: [0, 1.4, -220] }, { k: "thug", at: [0, -214], from: [-4, -219.5], pop: "run", armored: true }, { k: "hostage", at: [1.6, -215.5], from: [6, -219], pop: "run", t: 0.2 }, { k: "thug", at: [-2.8, -210], y: 2.2, pop: "up", drop: 2.2, t: 0.8 }, { k: "bonus", at: [-3.5, -232], from: [-6, -236], pop: "run", t: 0.3, mg: true }],
  ] },
  { a: 3, type: "move", to: [0, 1.6, -217.5], look: [0, 1.4, -232], dur: 2, ambush: [{ t: 0.9, k: "thug", at: [3, -218.5], from: [7, -218.6], pop: "side" }] },
  { a: 3, type: "move", to: [5, 1.6, -222], look: [14, 1.3, -234], dur: 1.2 },
  { a: 3, type: "cut", waves: [
    [{ k: "thug", at: [9, -232.7], pop: "up" }, { k: "thug", at: [18, -232.7], pop: "up", t: 0.5 }, { k: "thug", at: [21.5, -238.5], from: [22, -243], pop: "run", t: 1 }, { k: "thug", at: [16, -236.5], from: [22, -243], pop: "run", t: 1.5 }],
    [{ k: "thug", at: [10, -238], from: [10, -244.6], pop: "run" }, { k: "thug", at: [13.5, -232.7], pop: "up", armored: true, t: 0.4 }, { k: "thug", at: [7, -239.5], from: [10, -244.6], pop: "run", t: 1.2 }, { k: "bonus", at: [18, -242.5], from: [10, -244.6], pop: "run", t: 0.5 }],
    [{ k: "thug", at: [9, -232.7], pop: "up" }, { k: "thug", at: [18, -232.7], pop: "up", t: 0.4 }, { k: "thug", at: [14, -237.5], from: [10, -244.6], pop: "run", t: 0.8 }],
  ] },
  { a: 3, type: "move", to: [-6, 1.6, -228], look: [-14, 1.2, -238], dur: 2.2 },
  { a: 3, type: "cut", waves: [
    [{ k: "thug", at: [-8.49, -236.37], pop: "side", crouch: true, from: [-7.9, -236.5] }, { k: "staff", at: [-16, -234], pop: "up", apron: 14712864 }, { k: "thug", at: [-12.9, -235], pop: "up", t: 0.5 }, { k: "thug", at: [-17.9, -237.5], pop: "up", t: 1 }],
    [{ k: "thug", at: [-14, -241.5], from: [-14, -246], pop: "run" }, { k: "thug", at: [-19, -242.5], from: [-15.5, -246], pop: "run", t: 0.5 }, { k: "thug", at: [-22.9, -235.5], pop: "up", armored: true, t: 0.9 }, { k: "bonus", at: [-23.5, -241], from: [-24, -244], pop: "run", t: 1.2 }],
    [{ k: "thug", at: [-9.66, -236.11], pop: "side", crouch: true, from: [-7.9, -236.5] }, { k: "thug", at: [-17.9, -237.5], pop: "up", t: 0.4 }, { k: "thug", at: [-10.5, -241.5], from: [-14, -246], pop: "run", t: 0.9 }],
  ] },
  { a: 3, type: "move", to: [-14, 1.6, -241], look: [-14, 1.5, -255], dur: 2 },
  // ===== 區域 5：服飾店 =====
  { a: 4, type: "move", to: [-14, 1.6, -249], look: [-12, 1.3, -268], dur: 1.8 },
  { a: 4, type: "cut", waves: [
    [{ k: "reveal", id: "m3", t: 1.2 }, { k: "thug", at: [-4.5, -258], from: [-1, -262], pop: "run", t: 2 }],
    [{ k: "reveal", id: "m6" }, { k: "thug", at: [-19.5, -260.5], from: [-24, -262], pop: "run", t: 0.8 }, { k: "bonus", at: [-20, -278], from: [-24, -279], pop: "run", t: 0.3 }],
    [{ cam: [-13, 1.6, -256], look: [-11, 1.3, -272] }, { k: "reveal", id: "m7" }, { k: "thug", at: [-11, -270], from: [-10, -278], pop: "run", t: 0.4 }, { k: "thug", at: [-8, -270.7], pop: "up", t: 1 }],
  ] },
  { a: 4, type: "move", to: [-4, 1.6, -265], look: [3, 1.3, -280], dur: 2.2 },
  { a: 4, type: "cut", waves: [
    [{ k: "reveal", id: "m8" }, { k: "thug", at: [5.9, -278.6], from: [5.9, -281], pop: "side", t: 0.7 }, { k: "thug", at: [-3, -277], from: [-6, -281], pop: "run", t: 1.2 }],
    [{ k: "hostage", at: [-1.8, -275.5], from: [-5, -281], pop: "run" }, { k: "reveal", id: "m11", t: 0.3 }, { k: "thug", at: [3.3, -278.6], from: [3.3, -281], pop: "side", t: 1 }],
    [{ k: "reveal", id: "m10" }, { k: "thug", at: [8.4, -278.6], from: [8.4, -281], pop: "side", armored: true, t: 0.5 }],
  ] },
  { a: 4, type: "move", to: [-3.5, 1.6, -279], look: [-3.5, 1.6, -295], dur: 1.6 },
  { a: 4, type: "move", to: [-3.5, 1.6, -285], look: [0, 1.8, -305], dur: 1.2 },
  // ===== 區域 6：中央廣場 =====
  { a: 5, type: "move", to: [0, 1.6, -290], look: [0, 2.2, -310], dur: 1.6 },
  { a: 5, type: "cut", waves: [
    [{ k: "thug", at: [-7, -302.6], pop: "up" }, { k: "thug", at: [7, -302.6], pop: "up", t: 0.5 }, { k: "thug", at: [-3, -305], from: [-12, -320], pop: "run", t: 1 }],
    [{ k: "bonus", at: [-22.8, -327], y: 5.3, pop: "up" }, { k: "bonus", at: [22.8, -326], y: 5.3, pop: "up", t: 0.6, mg: true }, { k: "hostage", at: [-2.5, -306], from: [-12, -306], pop: "run", t: 0.2 }],
    [{ cam: [0, 1.6, -303], look: [0, 2, -322] }, { k: "thug", at: [-5, -318], from: [-9, -324], pop: "run" }, { k: "thug", at: [5, -316], from: [9, -324], pop: "run", t: 0.5 }, { k: "thug", at: [0, -323.5], y: 1.25, from: [-9.5, -330.5], pop: "run", armored: true, t: 1 }, { k: "thug", at: [3, -323.5], y: 1.25, from: [9.5, -330.5], pop: "run", t: 1.4 }],
  ] },
  { a: 5, type: "move", to: [0, 1.6, -311], look: [0, 2.8, -326], dur: 2.2 },
  { a: 5, type: "boss" },
  { a: 5, type: "end" },
];
// 修正 ambush 第一筆寫法（地下停車場入口）
S1_LEVEL.forEach(s => (s.ambush || []).forEach(a => { if (a.atXZ) { a.at = a.atXZ; } }));


registerStage({ id: 1, name: '大賣場危機', en: 'STAGE 1  SHOPPING MALL', desc: '搶匪佔領了購物中心。從停車場一路攻進中央廣場。',
  brief: { head: '任務檔案 #0613 ／ 代號「午夜特賣」／ 機密', text: ['週五晚上七點，城東購物中心的燈，一盞一盞熄滅。', '搶匪沒有碰金庫。他們在找一個不在任何清單上的包裹。', '保全主任已經失聯 [[████]] 分鐘。沒有人知道包裹裡裝著什麼——除了一個人。'] },
  // 背景音樂：各區同一首音樂檔（換區接著播）；Boss 戰在 s1SpawnBoss 裡切換
  music: Array(S1_AREAS.length).fill({ file: 'assets/audio/stage1_bgm.mp3' }),
  areas: S1_AREAS, level: S1_LEVEL, build: s1Build, floorY: a => (a === 1 ? -5 : 0), spawnBoss: s1SpawnBoss,
  title: { pos: [0, 2.2, 6], look: [0, 1.5, -30] } });
