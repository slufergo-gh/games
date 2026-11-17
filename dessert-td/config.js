// =============================================================
//  我們這一家大戰甜點 — 數值設定檔
//  要調平衡只改這個檔案就好，存檔後重新整理遊戲頁面即可生效。
//  單位說明：
//    時間 = 秒；速度 = 每秒移動幾像素（一格寬 110 像素）
//    射程 = 幾格；攻擊頻率 rate = 每隔幾秒攻擊一次（越小越快）
// =============================================================
window.CONFIG = {
  global: {
    startBubbles: { day: 150, night: 300, boss: 600 }, // 開局泡泡
    skyBubbleValue: 25,          // 天上掉下來的泡泡價值
    skyBubbleInterval: [6, 9],   // 天上掉泡泡的間隔（最短, 最長）
    bubbleLife: 12,              // 泡泡落地後幾秒消失
    cardSlots: 8,                // 每關最多帶幾位角色
    projectileSpeed: 420,        // 直線子彈速度
    mowerSpeed: 450,             // 吸塵器速度
    firstWave: 40,               // 第一波甜點出現時間
    waveInterval: 25,            // 每波間隔
    upgradeMult: [1, 1.5, 2.1],  // Lv1 / Lv2 / Lv3 的能力倍率（升級時也會補滿血）
    killDropChance: 0.3,         // 打倒甜點時掉泡泡的機率（0 = 不掉）
    killDropValue: 25,           // 打倒甜點掉的泡泡價值
  },

  // 開局就有的角色
  startUnlocked: ['lala', 'wuji'],

  // ---------------- 吉祥物 ----------------
  // cost 費用｜cooldown 卡片冷卻｜hp 血量｜atk 攻擊力｜rate 攻擊頻率｜range 射程（格）
  // upgrade.cost = [升到 Lv2 的費用, 升到 Lv3 的費用]；upgrade.stat = 升級時變強的數值
  defenders: {
    lala: {
      name: '大長今略略', img: 'lala.png', role: '產泡泡',
      desc: '每隔一段時間吹出泡泡，是一切的起點。',
      intro: '噗噗噗～我是大長今略略！我會一直吹泡泡給大家用，泡泡冒出來的時候記得點一下收下來喔♪ 想要更多夥伴，就先多放幾個我吧！',
      cost: 50, cooldown: 7.5, hp: 300,
      produce: 25, interval: 15, firstDelay: [2, 4],
      upgrade: { cost: [50, 100], stat: 'produce' },
    },
    wuji: {
      name: '烏雞', img: 'wuji.png', role: '射紙飛機',
      desc: '朝同一條線射出紙飛機。',
      intro: '咻～紙飛機出發！我會朝前面一直射紙飛機，便宜又可靠，守線的好幫手就是我啦！',
      cost: 100, cooldown: 7.5, hp: 300,
      atk: 20, rate: 1.4, range: 9,
      upgrade: { cost: [75, 150], stat: 'atk' },
    },
    mei: {
      name: '烏雞妹妹', img: 'mei.png', role: '冰彈',
      desc: '射出冰彈，打中的甜點會變慢（移動和啃咬都變慢）。',
      intro: '冷冰冰的冰彈送給你～被我打中的甜點會變得慢吞吞，連啃東西都變慢喔！',
      cost: 150, cooldown: 7.5, hp: 300,
      atk: 20, rate: 1.4, range: 9, slow: 0.5, slowTime: 3,
      upgrade: { cost: [100, 175], stat: 'atk' },
    },
    didi: {
      name: '烏雞弟弟', img: 'didi.png', role: '連射',
      desc: '一次連射兩架小紙飛機。',
      intro: '噠噠！一次連射兩架小紙飛機，火力是哥哥的兩倍，連射是我的拿手絕活～',
      cost: 200, cooldown: 7.5, hp: 300,
      atk: 20, shots: 2, rate: 1.4, range: 9,
      upgrade: { cost: [125, 200], stat: 'atk' },
    },
    laoda: {
      name: '老大', img: 'laoda.png', role: '擋路',
      desc: '血超厚，負責擋住甜點。棒棒糖撐竿兵跳不過他。',
      intro: '嗯哼，交給我擋住吧！我超級耐咬，棒棒糖撐竿兵想跳過我？門都沒有！',
      cost: 50, cooldown: 30, hp: 4000,
      upgrade: { cost: [50, 100], stat: 'hp' },
    },
    gf: {
      name: '老大女朋友', img: 'gf.png', role: '補血',
      desc: '幫周圍 3×3 格內的夥伴（含自己）回血。',
      intro: '受傷了嗎？我來幫你呼呼～站在我身邊一圈的夥伴都會慢慢回血喔♥',
      cost: 125, cooldown: 15, hp: 300,
      heal: 40, rate: 3, range: 1,
      upgrade: { cost: [75, 125], stat: 'heal' },
    },
    cookie: {
      name: '餅乾怪獸', img: 'cookie.png', role: '吞食',
      desc: '一口吞掉面前的甜點，之後要嚼一陣子。三層蛋糕和 Boss 吞不下，只能咬一大口。',
      intro: '好餓好餓～啊嗚！一口就把甜點吞掉！不過要嚼好久才能吃下一個，三層蛋糕太大了只能咬一口啦。',
      cost: 150, cooldown: 7.5, hp: 300,
      range: 1.35, chew: 25, bigBite: 400,
      upgrade: { cost: [75, 150], stat: 'chew' }, // 升級後嚼得更快
    },
    bean: {
      name: '小綠豆', img: 'bean.png', role: '拋飯糰',
      desc: '把飯糰拋過去，會越過頭盔和鐵桶直接打本體。',
      intro: '嘿咻～把飯糰拋得高高的！馬卡龍頭盔和巧克力鐵桶都擋不住，直接砸中甜點本人！',
      cost: 100, cooldown: 7.5, hp: 300,
      atk: 30, rate: 2.6, range: 9,
      upgrade: { cost: [75, 150], stat: 'atk' },
    },
    kwuji: {
      name: '韓國烏雞', img: 'kwuji.png', role: '泡菜炸彈',
      desc: '放下後馬上爆炸，炸掉周圍 3×3 格的甜點。一次性。',
      intro: '泡菜炸彈準備～三、二、一，砰！身邊一圈的甜點通通炸飛，不過只能用一次喔。',
      cost: 150, cooldown: 35, hp: 9999,
      atk: 1800, fuse: 1.0, radius: 1.5,
      upgrade: null,
    },
    rabbit: {
      name: '兔兔', img: 'rabbit.png', role: '跳跳地雷',
      desc: '先躲在地下準備，準備好後甜點一碰到就爆炸。一次性。',
      intro: '我先躲進土裡準備一下下～亮紅燈就準備好囉！誰踩到我就「蹦」！只能用一次喔。',
      cost: 25, cooldown: 20, hp: 300,
      atk: 1800, arm: 12,
      upgrade: { cost: [25, 50], stat: 'arm' }, // 升級後準備得更快
    },
    kuku: {
      name: 'kuku', img: 'kuku.png', role: '三線雪球',
      desc: '一次朝上、中、下三條線丟雪球。',
      intro: '嘿！一次丟三顆雪球，上面、中間、下面三條線一起照顧，放在中間最划算！',
      cost: 325, cooldown: 7.5, hp: 300,
      atk: 20, rate: 1.4, range: 9,
      upgrade: { cost: [150, 250], stat: 'atk' },
    },
    devil: {
      name: '惡魔', img: 'devil.png', role: '噴火',
      desc: '朝前方 3 格噴火，範圍內的甜點全部燒到。',
      intro: '呼～噴火！前面三格裡的甜點全部烤得香噴噴，擠在一起的甜點最怕我了！',
      cost: 175, cooldown: 7.5, hp: 300,
      atk: 40, rate: 1.5, range: 3,
      upgrade: { cost: [100, 175], stat: 'atk' },
    },
  },

  // ---------------- 甜點大軍 ----------------
  // hp 血量｜armor 護甲（先扣護甲，小綠豆的飯糰會無視）｜speed 移動速度｜bite 每秒啃咬傷害｜points 出場點數（越強越貴）
  enemies: {
    cupcake:   { name: '杯子蛋糕兵',   hp: 200, armor: 0,    speed: 22, bite: 50, points: 1, desc: '最普通的甜點兵。' },
    macaron:   { name: '馬卡龍頭盔兵', hp: 200, armor: 370,  speed: 22, bite: 50, points: 2, desc: '頭上戴著馬卡龍，比較耐打。' },
    chocolate: { name: '巧克力鐵桶兵', hp: 200, armor: 1100, speed: 22, bite: 50, points: 4, desc: '頭上頂著巧克力鐵桶，非常硬。' },
    donut:     { name: '甜甜圈',       hp: 300, armor: 0,    speed: 55, speedAfter: 22, impact: 150, bite: 50, points: 2, desc: '滾得很快，撞到夥伴會造成傷害，之後頭暈變慢。' },
    lollipop:  { name: '棒棒糖撐竿兵', hp: 340, armor: 0,    speed: 45, speedAfter: 20, bite: 50, points: 2, desc: '會跳過第一個擋路的夥伴（跳不過老大）。' },
    pudding:   { name: '布丁',         hp: 400, armor: 0,    speed: 18, bite: 50, points: 3, split: 2, splitHp: 120, splitSpeed: 30, desc: '被打倒時會分裂成兩個小布丁。' },
    icecream:  { name: '冰淇淋',       hp: 500, armor: 0,    speed: 18, bite: 50, points: 3, aura: 1.6, auraSlow: 1.6, desc: '身邊很冷，附近夥伴攻擊變慢（攻擊間隔 ×1.6）。' },
    popcorn:   { name: '爆米花桶',     hp: 250, armor: 0,    speed: 30, bite: 0,  points: 3, fuse: 1.2, blast: 500, desc: '碰到夥伴後會爆炸，炸傷周圍 3×3 格。' },
    cake:      { name: '三層蛋糕',     hp: 3000, armor: 0,   speed: 11, bite: 200, points: 8, desc: '巨大坦克，餅乾怪獸也吞不下。' },
    boss:      { name: '超級婚禮蛋糕', hp: 10000, armor: 0,  speed: 0,  bite: 0, points: 0,
                 throwEvery: 20, throwDmg: 250, summonEvery: 15, summonCount: 2, enrageAt: 0.5,
                 desc: '最終 Boss。會丟奶油砸夥伴、召喚甜點。血量低於一半會暴怒加速。' },
  },

  // ---------------- 關卡 ----------------
  // waves 波數｜flags 大波數量｜b0 第一波點數｜bg 每波增加點數｜pool 會出現的甜點｜unlock 過關解鎖角色
  levels: [
    { id: '1-1', scene: 0, waves: 5,  flags: 1, b0: 1,   bg: 0.24, pool: ['cupcake'], unlock: 'laoda' },
    { id: '1-2', scene: 0, waves: 7,  flags: 1, b0: 1,   bg: 0.32, pool: ['cupcake', 'macaron'], unlock: 'rabbit' },
    { id: '1-3', scene: 0, waves: 9,  flags: 1, b0: 1.5, bg: 0.39, pool: ['cupcake', 'macaron', 'donut'], unlock: 'mei' },
    { id: '1-4', scene: 0, waves: 10, flags: 2, b0: 2,   bg: 0.42,  pool: ['cupcake', 'macaron', 'donut', 'chocolate'], unlock: 'kwuji' },
    { id: '1-5', scene: 0, waves: 12, flags: 2, b0: 2,   bg: 0.49,  pool: ['cupcake', 'macaron', 'donut', 'chocolate', 'lollipop'], unlock: 'bean' },
    { id: '2-1', scene: 1, waves: 10, flags: 1, b0: 2,   bg: 0.42,  pool: ['cupcake', 'macaron', 'donut', 'lollipop'], unlock: 'cookie' },
    { id: '2-2', scene: 1, waves: 12, flags: 2, b0: 2,   bg: 0.49,  pool: ['cupcake', 'macaron', 'lollipop', 'pudding'], unlock: 'didi' },
    { id: '2-3', scene: 1, waves: 12, flags: 2, b0: 2.5, bg: 0.52, pool: ['cupcake', 'macaron', 'pudding', 'icecream'], unlock: 'gf' },
    { id: '2-4', scene: 1, waves: 14, flags: 2, b0: 2.5, bg: 0.56,  pool: ['cupcake', 'macaron', 'chocolate', 'icecream', 'popcorn'], unlock: 'devil' },
    { id: '2-5', scene: 1, waves: 15, flags: 3, b0: 3,   bg: 0.59, pool: ['cupcake', 'macaron', 'chocolate', 'donut', 'lollipop', 'pudding', 'icecream', 'popcorn'], unlock: 'kuku' },
    { id: '3-1', scene: 2, waves: 14, flags: 2, b0: 3,   bg: 0.63,  pool: ['cupcake', 'macaron', 'chocolate', 'donut', 'lollipop', 'popcorn'] },
    { id: '3-2', scene: 2, waves: 15, flags: 2, b0: 3,   bg: 0.7,  pool: ['cupcake', 'macaron', 'chocolate', 'pudding', 'cake'] },
    { id: '3-3', scene: 2, waves: 16, flags: 3, b0: 3.5, bg: 0.73, pool: ['cupcake', 'macaron', 'chocolate', 'donut', 'lollipop', 'icecream', 'cake'] },
    { id: '3-4', scene: 2, waves: 18, flags: 3, b0: 3.5, bg: 0.77,  pool: ['cupcake', 'macaron', 'chocolate', 'pudding', 'icecream', 'popcorn', 'cake'] },
    { id: '3-5', scene: 2, waves: 20, flags: 3, b0: 4,   bg: 0.84,  pool: ['cupcake', 'macaron', 'chocolate', 'donut', 'lollipop', 'pudding', 'icecream', 'popcorn', 'cake'] },
    { id: 'B',   scene: 2, boss: true, pool: ['cupcake', 'macaron', 'chocolate', 'donut', 'lollipop', 'pudding', 'icecream', 'popcorn'] },
  ],

  // 無盡模式：第 i 波（從 0 算）的點數 = b0 + i × bg，每 10 波一次大波
  endless: { scene: 2, b0: 2, bg: 0.63, bigEvery: 10,
             pool: ['cupcake', 'macaron', 'chocolate', 'donut', 'lollipop', 'pudding', 'icecream', 'popcorn', 'cake'] },

  bigWaveMult: 2, // 大波的點數倍率
};
