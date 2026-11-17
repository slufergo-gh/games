// =============================================================
//  同心協力（暫名）— 數值設定檔
//  要調平衡只改這個檔案，存檔後重新整理遊戲頁面即可生效。
//  單位：時間 = 秒；速度 = 每秒移動幾像素（畫面寬 960、高 540）
//  stars：過關時依成績給星星，[3 星門檻, 2 星門檻]，沒達到就 1 星
// =============================================================
window.CONFIG = {
  // ---------------- 按鍵（KeyboardEvent.code） ----------------
  keys: {
    p1: { up: ['KeyW'], down: ['KeyS'], act: ['KeyF', 'Space'] },               // 玩家 A（左手邊）
    p2: { up: ['ArrowUp'], down: ['ArrowDown'], act: ['Enter', 'NumpadEnter', 'Numpad0', 'Slash'] }, // 玩家 B（右手邊）
  },
  players: {
    p1: { name: '烏雞', img: 'wuji', color: '#3b82f6' },
    p2: { name: '略略', img: 'lala', color: '#ec4899' },
  },
  // 每關音樂（assets/audio/ 裡的檔名）
  music: { menu: 'menu', result: 'result', drive: 'play1', shield: 'play2', cannon: 'play3', carry: 'play1', row: 'play2', claw: 'play3' },
  defaultVolume: { music: 6, sfx: 7 },   // 0~10

  // ---------------- 第 1 關：開車 ----------------
  // A：W/S 控方向盤（上下移動）；B：↑ 油門、↓ 煞車
  drive: {
    distance: 12000,       // 終點距離（像素，畫面顯示 ÷10 = 公尺）
    timeLimit: 75,         // 時間限制
    lives: 3,              // 撞幾次就失敗
    maxSpeed: 380,         // 最高速度
    accel: 220,            // 踩油門每秒加速
    brake: 520,            // 踩煞車每秒減速
    drag: 40,              // 不踩時自然減速
    steerSpeed: 230,       // 方向盤上下移動速度
    crashSpeedKeep: 0.15,  // 撞到後剩下幾成速度
    invincible: 1.2,       // 撞到後無敵秒數
    obstacleGap: [240, 460], // 障礙物間隔（最短, 最長）
    obstacleSize: 30,      // 障礙物半徑
    doubleChance: 0.35,    // 同一排出現兩個障礙物的機率
    stars: [42, 55],       // 幾秒內抵達終點
  },

  // ---------------- 第 2 關：破盾打怪 ----------------
  // A：W/S 換跑道、F 敲破糖衣盾；B：↑/↓ 換跑道、Enter 攻擊（只能打沒盾的）
  shield: {
    goal: 15,              // 打倒幾隻過關
    lives: 3,              // 漏掉幾隻就失敗
    lanes: 3,
    spawnInterval: [2.6, 3.6], // 出怪間隔（隨進度縮短到 60%）
    enemySpeed: [40, 62],  // 敵人前進速度（最慢, 最快）
    enemyHp: 1,            // 破盾後要被 B 打幾下
    shieldTime: 2.5,       // 盾被敲破後幾秒長回來
    armoredChance: 0.3,    // 厚盾敵人機率（盾要敲兩下）
    armoredShield: 2,
    aCooldown: 0.35,       // A 敲盾冷卻
    bCooldown: 0.35,       // B 攻擊冷卻
    stars: [3, 2],         // 剩幾顆心
  },

  // ---------------- 第 3 關：發射大砲 ----------------
  // A：W/S 調角度；B：按住 Enter 蓄力、放開發射
  cannon: {
    shots: 10,             // 砲彈數
    angleMin: 5, angleMax: 80, angleSpeed: 35, // 角度範圍與每秒調整幾度
    powerMin: 250, powerMax: 820, // 力道範圍
    chargeTime: 1.3,       // 從最小到最大要幾秒（之後來回擺盪）
    gravity: 480,
    targetRadius: 26,
    // 目標位置（x, y），move = 上下移動幅度，speed = 移動速度
    targets: [
      { x: 560, y: 450 }, { x: 760, y: 450 }, { x: 640, y: 250, move: 70, speed: 1.2 },
      { x: 820, y: 300, move: 90, speed: 1.6 }, { x: 900, y: 450 },
    ],
    wall: { x: 420, top: 320, width: 30 }, // 中間的牆
    stars: [7, 4],         // 剩幾發砲彈
  },

  // ---------------- 第 4 關：扛蛋糕過橋 ----------------
  // A：W/S 抬高/放低左邊；B：↑/↓ 抬高/放低右邊（自動往前走）
  carry: {
    distance: 4200,
    walkSpeed: 85,
    plankLength: 260,      // 木板長
    armRange: 60,          // 手能抬高/放低的幅度
    armSpeed: 80,          // 手每秒移動
    slide: 650,            // 傾斜時蛋糕滑動力道（越大越難）
    friction: 1.2,         // 蛋糕摩擦（越大越好控制）
    terrainHeight: 45,     // 地形起伏高度
    terrainWave: [520, 330], // 地形起伏波長（越短越頻繁）
    lives: 3,              // 蛋糕掉幾次就失敗
    stars: [3, 2],         // 剩幾條命
  },

  // ---------------- 第 5 關：划船 ----------------
  // A：F 划左槳（船往右轉）；B：Enter 划右槳（船往左轉）；一起划 = 直走
  row: {
    distance: 5000,
    timeLimit: 90,
    lives: 3,
    strokePower: 55,       // 每划一下往前推的速度
    strokeTurn: 1.5,       // 每划一下的轉向力
    strokeCooldown: 0.3,   // 每支槳划槳間隔
    waterDrag: 1.0,        // 水的阻力
    turnDrag: 3.0,         // 轉向阻力
    riverWidth: 460,
    riverCurve: 130,       // 河道彎曲幅度
    rockGap: [260, 420],   // 石頭間隔
    rockSize: 26,
    invincible: 1.2,
    stars: [45, 60],       // 幾秒內抵達
  },

  // ---------------- 第 6 關：夾娃娃 ----------------
  // A：W/S 左右移動爪子；B：按住 Enter 放下爪子、放開夾起，夾著時再按一下放開
  claw: {
    timeLimit: 75,
    goal: 4,               // 要夾到幾個
    prizes: 8,             // 機台裡娃娃數
    moveSpeed: 220,
    dropSpeed: 200,
    riseSpeed: 220,
    grabRange: 28,         // 爪子中心離娃娃多近才夾得到
    slipChance: 0.15,      // 夾起來時滑掉機率
    chute: [40, 170],      // 出口範圍（x 從, 到）
    stars: [35, 15],       // 剩幾秒
  },
};
