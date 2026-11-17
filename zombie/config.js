// 傭兵團：屍潮突破 — 所有可調數值都在這裡。改完存檔、重新整理遊戲頁面即可生效。
// 距離單位：公尺（角色身高約 1.8）。時間單位：秒。速度單位：公尺/秒。
// 畫面「往上」= 往前推進。
window.CONFIG = {
  game: {
    campaignStages: 3,      // 破關模式關數
    renderScale: 0.42,      // 內部解析度（設定畫面可以改：清晰 / 標準 / 復古）
    maxZombies: 340,        // 場上殭屍上限
    roadHalf: 9,            // 道路半寬（可活動寬度 18）
    retreatLimit: 8,        // 最多可以從「最前進過的位置」往後退幾公尺
    lineBehind: 5,          // 紅線（放跑判定線）在後退線再往後幾公尺
    pushDelay: 20,          // 開局幾秒後，後退線開始自己往前推（逼玩家前進）
    pushSpeed: 1.0,         // 後退線往前推的速度（公尺/秒）
    leaveDistance: 4,       // 殭屍越過玩家這麼遠之後就不再追，直接往下跑（跑過紅線 = 放跑）
    stageClearHealPct: 0.3, // 過關回復最大血量的 30%
  },

  stage: {
    baseLength: 240,        // 第 1 關長度
    lengthPerStage: 30,     // 每關多長
    hpMul: 0.4,             // 每關殭屍血量 +40%
    speedMul: 0.07,         // 每關殭屍速度 +7%
    densityMul: 0.18,       // 每關出怪頻率 +18%
    bossTrigger: 40,        // 離終點多遠時屍王出現
  },

  // 過關評價：分數 = 擊殺 x killPoints − 放跑 x leakPenalty + 時間獎勵
  // 時間獎勵 = (標準時間 − 過關秒數) x timePoints（不會低於 0）
  score: {
    killPoints: 10, leakPenalty: 20, timePoints: 40,
    parTime: 150, parTimePerStage: 20,      // 第 1 關標準時間 150 秒，每關 +20
    rankS: 7000, rankA: 5000, rankB: 3000,  // 第 1 關門檻，之後每關 x(1 + 0.25 x (關數-1))
    rankPerStage: 0.25,
  },

  player: { radius: 0.45, hurtInvuln: 0.5 },

  roll: { distance: 5.5, duration: 0.3, invuln: 0.36, cooldown: 1.0 },

  // ===== 四位傭兵 =====
  chars: {
    soldier: {
      name: '士兵', hp: 110, speed: 6.2,
      // 普攻：往面向方向開槍，子彈「穿透一整列」
      attack: { damage: 14, interval: 0.2, range: 20, bulletSpeed: 42, lines: 2, lineGap: 1.0, knockback: 1.2 },
      // 絕招：火焰放射器（朝面向噴，可邊走邊噴）
      ult: { killsNeeded: 60, duration: 3, range: 6.5, arc: 1.5, dps: 70, tick: 0.12 },
    },
    martial: {
      name: '武道家', hp: 140, speed: 6.8,
      // 普攻：三段連擊，前方扇形（arc 弧度）；第三段是重擊，360 度迴旋（finisherArc）
      attack: { damage: 28, interval: 0.24, range: 3.0, arc: 3.0, finisherMul: 2.0, finisherRange: 4.0, finisherArc: 6.28, finisherInterval: 0.4, knockback: 2, step: 0.1 },
      // 絕招：集氣後震地（集氣中不能動，全程無敵）
      ult: { killsNeeded: 50, chargeTime: 1.0, damage: 160, radius: 9, knockback: 14, stun: 1.0, invulnAfter: 0.3 },
    },
    scientist: {
      name: '科學家', hp: 95, speed: 6.0,
      // 普攻：拋出實驗藥瓶，延遲落地後留下持續傷害的藥池
      attack: { interval: 0.6, flasks: 1, throwDist: 7, flight: 0.55, impactDamage: 6, radius: 2.4, dps: 14, duration: 2.5, spread: 2.2 },
      // 絕招：超大範圍化學藥劑，定身 + 中毒 + 傷害
      ult: { killsNeeded: 70, throwDist: 9, flight: 0.7, radius: 9, impactDamage: 60, stun: 3, poisonDps: 15, poisonTime: 6 },
    },
    cultist: {
      name: '邪教崇拜者', hp: 125, speed: 6.0,
      // 普攻：禱告。站著不動完成一次禱告；移動（含翻滾）會打斷。集滿 4 次邪神出拳
      attack: { prayTime: 0.7, praysNeeded: 4, punches: 1, punchGap: 0.55, punchDist: 7, damage: 320, radius: 7, telegraph: 0.35 },
      // 絕招：短時間無敵，可以安心禱告
      ult: { killsNeeded: 50, duration: 6 },
    },
  },

  // ===== 升級（關卡中升級，三選一）。每升一級的效果 =====
  levelUp: { base: 15, perLevel: 12, perLevelSq: 1 },  // 所需經驗 = 15 + 12x(Lv-1) + 1x(Lv-1)^2，一隻殭屍給的經驗見下方 xp
  upgrades: {
    // 通用
    hp:       { max: 5, maxHp: 20 },            // 最大血量 +20（同時補 20）
    speed:    { max: 4, speedPct: 0.07 },       // 移速 +7%
    rollcd:   { max: 3, cooldownPct: 0.15 },    // 翻滾冷卻 -15%
    charge:   { max: 3, killsPct: 0.15 },       // 絕招所需擊殺 -15%
    regen:    { max: 3, perSec: 0.5 },          // 每秒回血
    // 士兵
    s_dmg:    { max: 5, damagePct: 0.2 },       // 子彈傷害 +20%
    s_lines:  { max: 3, lines: 1 },             // 多一道平行彈道
    s_rate:   { max: 4, intervalMul: 0.86 },    // 射擊間隔 x0.86
    s_range:  { max: 3, range: 4 },             // 射程 +4
    s_flame:  { max: 3, dpsPct: 0.3, range: 1.0 },     // 火焰傷害 +30%、距離 +1
    s_flame2: { max: 2, duration: 1 },          // 火焰持續 +1 秒
    // 武道家
    m_dmg:    { max: 5, damagePct: 0.2 },
    m_range:  { max: 3, range: 0.4 },           // 拳腳距離 +0.4
    m_speed:  { max: 4, intervalMul: 0.86 },    // 出拳間隔 x0.86
    m_wave:   { max: 3, length: 5, damagePct: 0.6 }, // 重擊放出直線氣勁：長度每級 +5，傷害 = 重擊的 60%
    m_quake:  { max: 3, radius: 1.5, damagePct: 0.3 }, // 震地半徑 +1.5、傷害 +30%
    m_heal:   { max: 3, healPerKill: 0.3 },     // 每擊殺回 0.3 血
    // 科學家
    c_dmg:    { max: 5, dpsPct: 0.25 },         // 藥池傷害 +25%
    c_radius: { max: 3, radius: 0.5 },          // 藥池半徑 +0.5
    c_dur:    { max: 3, duration: 1.0 },        // 藥池持續 +1 秒
    c_flask:  { max: 3, flasks: 1 },            // 一次多丟一瓶
    c_rate:   { max: 4, intervalMul: 0.86 },    // 投擲間隔 x0.86
    c_ult:    { max: 3, radius: 2, stun: 1 },   // 絕招半徑 +2、定身 +1 秒
    // 邪教崇拜者
    k_pray:   { max: 3, prayMul: 0.82 },        // 禱告時間 x0.82
    k_dmg:    { max: 5, damagePct: 0.3 },       // 邪神拳傷害 +30%
    k_radius: { max: 3, radius: 1.2 },          // 邪神拳範圍 +1.2
    k_punch:  { max: 2, punches: 1 },           // 邪神多揍一拳（最多 3 拳）
    k_fewer:  { max: 1, prays: 1 },             // 需要的禱告次數 -1
    k_ult:    { max: 3, duration: 2 },          // 無敵時間 +2 秒
  },

  // ===== 殭屍（第 1 關的基礎值，之後每關依 stage 設定成長） =====
  zombies: {
    walker:  { name: '行屍',   hp: 13,   speed: 1.6, damage: 6,  xp: 1, radius: 0.45, knockResist: 0,   fromStage: 1, weight: 10 },
    runner:  { name: '狂奔者', hp: 10,   speed: 3.4, damage: 7,  xp: 1, radius: 0.4,  knockResist: 0,   fromStage: 1, weight: 1.5 },
    brute:   { name: '胖屍',   hp: 90,   speed: 1.2, damage: 14, xp: 4, radius: 0.85, knockResist: 0.8, fromStage: 2, weight: 0.8 },
    spitter: { name: '吐酸者', hp: 18,   speed: 1.4, damage: 5,  xp: 2, radius: 0.45, knockResist: 0,   fromStage: 2, weight: 0.9,
               spitRange: 11, spitInterval: 3.5, spitWindup: 0.6, acidSpeed: 9, acidDamage: 10 },
    // 第 2 關新增
    bomber:  { name: '爆炸殭屍', hp: 45, speed: 1.3, damage: 8, xp: 3, radius: 0.5, knockResist: 0.3, fromStage: 2, weight: 0.7,
               blastRadius: 3.8, blastDamage: 80, blastPlayerDamage: 20 },   // 被打倒就爆炸：炸殭屍、炸玩家、炸掉障礙物
    toxic:   { name: '毒液殭屍', hp: 24, speed: 1.3, damage: 5, xp: 3, radius: 0.45, knockResist: 0, fromStage: 2, weight: 0.6,
               spitRange: 12, spitInterval: 4, spitWindup: 0.6, flight: 0.8, puddleRadius: 1.6, puddleDps: 10, puddleTime: 4 },
    // 第 3 關新增
    laser:   { name: '雷射殭屍', hp: 35, speed: 1.1, damage: 6, xp: 4, radius: 0.45, knockResist: 0, fromStage: 3, weight: 0.6,
               keepRange: 13, laserRange: 22, aimTime: 1.0, beamTime: 0.25, laserWidth: 0.8, laserDamage: 18, laserInterval: 4.5 },
    shield:  { name: '屏障殭屍', hp: 60, speed: 1.2, damage: 10, xp: 4, radius: 0.55, knockResist: 0.9, fromStage: 3, weight: 0,
               groupSize: [2, 3], groupChance: 0.35, blockAngle: 75 },  // 2~3 隻排成牆，正面 ±75 度擋下普攻；絕招和爆炸可破盾
    boss:    { name: '屍王',   hp: 1500, speed: 2.0, damage: 22, xp: 40, radius: 1.7, knockResist: 1,
               hpPerStage: 0.6, attackInterval: 3.2,
               slamRadius: 5, slamWindup: 1.0, slamDamage: 30,
               chargeWindup: 0.8, chargeSpeed: 15, chargeTime: 0.7, chargeDamage: 26 },
  },
  aggroRange: 16,           // 殭屍在這距離內會轉向追玩家，否則一直往下走
  attackCooldown: 0.9,      // 殭屍貼身攻擊間隔

  spawn: {
    rowInterval: 1.8,       // 每隔幾秒從前方湧出一批（成排）
    rows: [1, 3],           // 一批幾排
    rowSpacing: 1.6,        // 排與排間距
    colSpacing: 1.6,        // 同一排殭屍間距
    ahead: 30,              // 在玩家前方多遠生成
    startRows: 8,           // 開局時前方就有幾排
    bossSpawnMul: 0.5,      // 屍王出現後出怪頻率 x0.5
  },

  drops: { medkitChance: 0.008, medkitHeal: 20 },
};
