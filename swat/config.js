// 藍腹鷴特勤隊 — 所有可調數值都在這裡（三關共用，各關專屬的放在 stage2、stage3）。改完存檔、重新整理遊戲頁面即可生效。
// 時間單位：秒。距離單位：公尺。
window.CONFIG = {
  game: {
    renderScale: 0.5,   // 內部解析度（越小越有 PS1 的鋸齒感，也越省效能）
    fov: 55,            // 視角（越小畫面越「拉近」，敵人看起來越大）
  },

  // 難度：hp = 開局血量；fireWaitMul = 敵人從出現到開火的等待時間倍率（越大越簡單）
  // magazine = 彈匣容量；enemyHpAdd = 每個敵人多幾滴血（加分小兵、民眾不算）；bossHpMul = Boss 血量倍率
  difficulty: {
    easy:   { label: '簡單', hp: 7, fireWaitMul: 1.6, magazine: 10, enemyHpAdd: 0, bossHpMul: 1.0 },
    normal: { label: '普通', hp: 5, fireWaitMul: 1.0, magazine: 6, enemyHpAdd: 0, bossHpMul: 1.0 },
    hard:   { label: '困難', hp: 3, fireWaitMul: 0.75, magazine: 6, enemyHpAdd: 1, bossHpMul: 1.3 },
  },

  player: {
    magazine: 6,        // 彈匣容量
    reloadTime: 0.15,   // 換彈時間
    fireCooldown: 0.12, // 兩發之間最短間隔
    hurtInvuln: 0.6,    // 被打中後的無敵時間（避免同時被多人打中瞬間死亡）
    maxHp: 9,           // 撿急救包最多補到幾格
  },

  // 第一關各區敵人開火等待時間倍率（第一區是教學，所以比較慢）
  areaWaitMul: [1.6, 1.15, 1.0, 0.95, 0.9, 0.9],
  // 第二關、第三關各區倍率（第二關 8 區、第三關 8 區）
  stage2: { areaWaitMul: [1.3, 1.1, 1.0, 0.95, 0.95, 0.95, 0.95, 0.9], cabinScale: 1.0 }, // cabinScale：客房區敵人大小（其他地方是 enemy.scale）
  stage3: { areaWaitMul: [1.1, 1.0, 0.95, 0.95, 0.95, 1.0, 0.9, 0.9] },

  enemy: {
    scale: 1.3,         // 敵人、民眾、假人的體型倍率（畫面上看起來更大、更好打）
    hitboxScale: 1.35,  // 命中判定框比外觀大多少（只放寬寬度與頭部，不影響高度）
    thug:    { hp: 1, fireWait: 1.75, refireWait: 1.4,  shots: 2, popTime: 0.32, runSpeed: 5.5 },
    armored: { hp: 3, fireWait: 1.85, refireWait: 1.5, shots: 3, popTime: 0.4,  runSpeed: 4.0 },
    // 喬裝假人：revealTime = 眼睛發紅到舉槍的時間（這段時間打中算「看穿」）
    disguise: { hp: 1, revealTime: 0.7, fireWait: 1.4, refireWait: 1.25, shots: 2 },
    // 健身房壯漢（第二關）
    muscle:  { hp: 2, fireWait: 1.9, refireWait: 1.4, shots: 2, popTime: 0.4, runSpeed: 4.5 },
    // 重裝傭兵（第三關，比重裝兵更硬）
    heavy:   { hp: 5, fireWait: 2.0, refireWait: 1.4, shots: 3, popTime: 0.45, runSpeed: 3.5 },
    // 手榴彈傭兵：倒數結束會舉手丟手榴彈（windup 秒內打倒就丟不出來），沒打掉的手榴彈扣 damage 格血
    grenadier: { hp: 1, fireWait: 2.0, refireWait: 2.2, shots: 2, popTime: 0.35, runSpeed: 5.0, windup: 0.6, flight: 1.5, damage: 2 },
    // 機器狗：打破玻璃衝向玩家，跑到面前自爆
    dog:     { hp: 2, speed: 5.0, damage: 1 },
    // 無人機：小、會飛、會開槍
    drone:   { hp: 1, fireWait: 2.0, refireWait: 1.6, shots: 2, speed: 9, size: 1.6 },   // size：外觀與判定框大小
    // 同時有多個敵人時，每多一個正在冒出或瞄準的敵人，開火等待再 +20%（最多算 4 個，也就是最多 +80%）
    crowdWait: 0.2,
    crowdMax: 4,
    corpseTime: 1.3,    // 敵人被打倒後站著踉蹌的時間（這段時間可以追擊），之後才倒下消失
    // 加分小兵（金色衣服）：只作勢開槍不會傷人，停留 stay 秒後離開
    bonus: { stay: 4.5 },
    hostageStay: 1.0,   // 同一波敵人全部解決後，民眾再停留幾秒才離開
    headMul: 2,         // 爆頭傷害倍率
  },

  boss: {
    hp: 110,
    scale: 1.6,         // Boss 體型
    phase2At: 0.7,      // 血量剩這個比例以下進入第二階段（110 × 0.7 = 77 血是第二階段）
    moveSpeed: 2.2,     // 舞台上左右移動速度
    idleTime: [1.2, 1.8],       // 第一階段兩次丟手榴彈之間的間隔（隨機範圍）
    idleTime2: [0.9, 1.4],      // 第二階段間隔
    shotDamage: 0.3,    // 直接打他的傷害（身體；爆頭 ×2）。打手榴彈回去才是主要傷害
    staggerTime: 1.2,   // 被自己的手榴彈炸到後踉蹌時間
    // 雷克斯只丟巨大手榴彈：打中手榴彈會把它推回去，打滿次數就飛回去炸他
    bigWindup: 1.0,     // 舉起巨大手榴彈的時間
    bigFlight: 3.2,     // 第一階段：飛到玩家面前的時間（× 難度等待倍率）
    bigFlight2: 3.6,    // 第二階段（一次兩顆，稍慢一點）
    bigCount2: 2,       // 第二階段一次丟幾顆
    bigGap: 0.7,        // 第二顆晚幾秒出發
    bigSpread: 0.9,     // 兩顆左右分開的距離
    bigArc: 2.5,        // 拋物線高度
    bigSize: 0.6,       // 半徑（公尺）
    bigHits: 4,         // 每顆要打中幾次才會被打回去
    bigPush: 0.2,       // 第二階段：每打中一次往回推多少（0～1，1 = 整段距離）
    bigReturn: 0.8,     // 打回去飛回雷克斯身上的時間
    bigDamage: 8,       // 打回去炸到雷克斯的傷害
    bigHurt: 2,         // 沒打回去、在玩家面前爆炸扣幾格血
    summonEvery: [6, 12], // 第二階段不定期叫小兵：每次隔幾秒（隨機範圍）
    summonCount: 2,     // 一次叫幾個
    summonMax: 3,       // 場上手下最多幾個
  },

  // 第二關 Boss：舞王 迪亞哥。跳舞移動中打不到；從一邊衝到另一邊，途中停下的瞬間打中＝打斷（回到中央）
  boss2: {
    hp: 70,
    scale: 1.5,
    phase2At: 0.5,      // 血量剩多少比例進入第二階段
    dashSpeed: 10,      // 跳舞移動速度（公尺/秒）
    dashSpeed2: 13,     // 第二階段
    sideX: 10,          // 左右兩邊（桌子旁）離中央的距離
    stops: 2,           // 從一邊移到另一邊途中停幾次
    stops2: 3,          // 第二階段
    stopTime: 0.9,      // 每次停下的時間（× 難度倍率），這段時間打中就打斷
    stopTime2: 0.7,
    interruptDamage: 3, // 打斷時額外傷害
    staggerTime: 0.8,   // 打斷後踉蹌，之後回到中央
    centerTime: 1.0,    // 在中央跳舞多久才再出發（這段時間可以打，但不算打斷）
    grabTime: 1.0,      // 到另一邊拿杯子／酒瓶到丟出的時間（× 難度倍率）
    throws: 2,          // 一次丟幾個（每個都可以打掉）
    throws2: 3,
    throwFlight: 1.6,
    showTime: 3.5,      // 第二階段開場無敵舞技的時間
    jumpEvery: 2,       // 第二階段：每回到中央幾次就跳一次 1080 度
    jumpTime: 2.4,      // 在空中的時間（× 難度倍率）
    jumpHeight: 5,
    jumpHits: 3,        // 空中要打中幾次才會掉下來
    jumpDamage: 4,      // 打下來時額外傷害
    downTime: 1.6,      // 掉下來後倒地的時間（可以繼續打）
    plates: 2,          // 沒打下來：落地後連丟幾個盤子
    plateGap: 0.6,      // 盤子之間的間隔
    plateFlight: 1.4,
    plateCount: [1, 3],      // 第一階段一次丟幾個盤子（隨機範圍）
    plateCount2: [1, 3],     // 第二階段
    volleyFlight: 1.4,       // 不定期丟盤子：只丟 1 個時飛到面前的時間（原本的速度）
    volleySlow: 0.25,        // 每多 1 個盤子，飛行時間多幾成（2 個 ×1.25、3 個 ×1.5，越多越慢）
    plateEvery: [2.2, 4.0],  // 全程不定期丟盤子：每次隔幾秒（第一階段，× 難度等待倍率）
    plateEvery2: [1.5, 2.8], // 第二階段
  },
  // 第三關 Boss：巨大機器人
  boss3: {
    armHp: 22,          // 每隻手臂血量
    armSpin: 3.2,       // 手臂高速旋轉時的速度（弧度/秒）；平常只慢慢擺動
    armRest: [2.0, 3.2], // 每隻手臂兩次旋轉之間的休息時間
    armSpinTime: 2.6,   // 每次高速旋轉多久
    armFireDelay: 0.9,  // 開始旋轉後幾秒才發射飛彈（飛彈還在飛時手臂打不動，要先打掉飛彈）
    armOpenTime: 2.5,   // 飛彈都打掉（或飛完）後，手臂再轉幾秒（這段時間可以打手臂）
    rockets: 3,         // 一次發射幾發（每發可以打掉）；一次只有一隻手臂旋轉，畫面上最多就這幾發
    rocketFlight: 2.8,  // 飛彈飛到面前的時間（越大越慢）
    rocketDamage: 1,
    formations: 4,      // 腳要成功打中幾次特別色無人機才會爆炸
    formDrones: 7,      // 每次放出幾台
    formTime: 2.8,      // 擺好陣形後幾秒開火（× 難度倍率）
    formDamage: 1,
    formMove: 1.0,      // 無人機陣形整體移動（轉圈、左右飛舞）的速度倍率
    pillarHp: 6,        // 石柱要打幾槍才倒
    laserTime: 7,       // 雷射集氣時間（× 難度倍率），時間到雷射打玩家
    laserDamage: 2,
    pillars: 3,         // 壓中幾次打倒
    dogEvery: 3.5,      // 第三階段：每隔幾秒放出機器狗
    dogCount: 1,        // 每次放幾隻
    dogMax: 3,          // 場上最多幾隻
  },

  grenade: {
    flightTime: 1.6,    // 手榴彈飛到玩家面前的時間
    arc: 2.6,           // 拋物線高度
    hitRadius: 0.38,    // 手榴彈可被打中的半徑（比外觀大一點）
    damage: 1,
  },

  score: {
    base: 100,          // 打倒一個敵人的基本分
    reactionBonus: 200, // 反應獎勵：敵人一冒出就打倒拿滿，越接近開火越少
    headBonus: 100,     // 爆頭加分
    revealBonus: 300,   // 在喬裝假人舉槍前打倒
    overkill: 30,       // 敵人倒下、還沒消失前再打中的追擊分（也會累積連擊）
    overkillMax: 8,     // 每個敵人最多可以追擊幾次
    bonus: 400,         // 加分小兵額外加分（加在基本分上）
    comboStep: 0.1,     // 每連擊一次倍率 +0.1
    comboMax: 3,        // 連擊倍率上限
    hostagePenalty: 500,// 誤擊民眾扣分（同時扣 1 格血）
    prop: 10,           // 打爛商品
    grenade: 150,       // 打掉空中的手榴彈
    star: 1000,         // 金星道具
    interrupt: 400,     // 打斷 Boss
    jumpKnock: 800,     // 把空中轉圈的舞王打下來
    armBreak: 2000,     // 打斷機器人手臂
    formation: 600,     // 打中特別色無人機
    pillar: 1500,       // 石柱壓中機器人
    bossKill: 5000,
    noDamageBonus: 3000,// 全程沒被打中
    continuePenalty: 0.5,// 每接關一次，結算分數 × 這個值
    rank: { S: 100000, A: 70000, B: 40000 }, // 以下為 C
  },

  // 主角台詞（台詞內容在 voice.js）
  voice: {
    secPerChar: 0.13,  // 每個字顯示幾秒
    minTime: 2.0,      // 每句最少顯示幾秒
    barkGap: 6,        // 隨機台詞（打倒敵人等）最少間隔幾秒
    killChance: 0.12,  // 打倒一般敵人時講話的機率
  },
  // 第一關教學（可跳過，設定可關閉）
  tutorial: {
    targets: [[-2.6, 1.5, -14], [0, 1.9, -15], [2.6, 1.5, -14]], // 練習靶位置
    enemy: { k: 'thug', at: [-4.3, -18.8], from: [-6, -18.9], pop: 'side', wait: 4, hp: 1 }, // 練習敵人（wait 秒後才開槍）
    hostage: { k: 'hostage', at: [1.5, -20], from: [9, -21], pop: 'run' }, // 練習民眾
    hostageTime: 3.0, // 民眾停留幾秒後離開
  },
  items: {
    chance: 0.06,       // 打爛商品時掉出道具的機率
    medkitShare: 0.35,  // 掉出的道具中急救包的比例（其餘為金星）
    life: 5,            // 道具停留秒數（要射擊才能拿到）
    maxPerArea: 3,
    ammoChance: 0.07,   // 打倒敵人時掉出彈夾的機率（打中彈夾＝子彈直接補滿，子彈打光時也能打）
  },

  // 機關槍：打倒標示「BONUS 機槍」的加分小兵取得，按住左鍵連射，用完就沒有，不能換彈補滿
  mg: {
    ammo: 100,          // 一次給幾發
    rate: 0.08,         // 每發間隔（秒），0.08 約每秒 12 發
  },
};
