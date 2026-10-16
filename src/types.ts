/**
 * 三国志·烈火之誓 - 核心类型定义
 * GBA 火焰纹章风格 SRPG 系统
 */

export enum Faction {
  Player = 'player', // 玩家我方 (蓝色)
  Enemy = 'enemy',   // 敌军 (红色)
  Ally = 'ally',     // 友军 (绿色)
  NPC = 'npc',       // 中立/平民 (黄色)
}

export enum WeaponType {
  Sword = 'sword',   // 剑 (克斧)
  Lance = 'lance',   // 枪 (克剑)
  Axe = 'axe',       // 斧 (克枪)
  Bow = 'bow',       // 弓 (克飞行, 远程)
  Anima = 'anima',   // 理魔法 (克光)
  Light = 'light',   // 光魔法 (克暗)
  Dark = 'dark',     // 暗魔法 (克理)
  Staff = 'staff',   // 杖 (回复/辅助)
  Item = 'item',     // 消耗品/转职道具
}

export enum TerrainType {
  Plains = 'plains',     // 平原 (消耗1, 回避0, 防御0)
  Forest = 'forest',     // 森林 (消耗2/骑3, 回避20, 防御1)
  Mountain = 'mountain', // 山地 (步3/骑不可, 回避30, 防御2)
  Peak = 'peak',         // 高峰 (仅飞行)
  River = 'river',       // 河流 (水上/飞行, 步5)
  Bridge = 'bridge',     // 桥梁 (消耗1, 回避0, 防御0)
  Castle = 'castle',     // 城池 (消耗1, 回避20, 防御2, 回血10%)
  Fort = 'fort',         // 要塞 (消耗1, 回避20, 防御2, 回血10%)
  Village = 'village',   // 村庄 (消耗1, 回避10, 防御0)
  Throne = 'throne',     // 王座 (消耗1, 回避30, 防御3, 回血10%)
  Desert = 'desert',     // 沙漠 (骑手受限)
  Snow = 'snow',         // 雪地
  Fire = 'fire',         // 烈火/熔岩 (每回合受5点伤害)
  Wall = 'wall',         // 墙壁 (不可通行)
  Gate = 'gate',         // 关隘 (消耗1, 回避20, 防御2)
}

export enum UnitClass {
  Lord = 'lord',                   // 领主/主公 (剑)
  GreatLord = 'great_lord',       // 统帅/大君 (剑/枪)
  Cavalier = 'cavalier',           // 轻骑兵 (枪/剑)
  Paladin = 'paladin',             // 圣骑士 (枪/剑/斧)
  Myrmidon = 'myrmidon',           // 剑士 (高技速, 剑)
  Swordmaster = 'swordmaster',     // 剑圣 (必杀+15, 剑)
  Fighter = 'fighter',             // 战士 (高力血, 斧)
  Warrior = 'warrior',             // 勇士 (斧/弓)
  Knight = 'knight',               // 重甲骑士 (高防, 枪)
  General = 'general',             // 将军 (枪/剑/斧, 巨防)
  Archer = 'archer',               // 弓兵 (弓)
  Sniper = 'sniper',               // 狙击手 (必杀+10, 弓)
  Mage = 'mage',                   // 魔道士 (理魔法)
  Sage = 'sage',                   // 贤者 (理/光/杖)
  Cleric = 'cleric',               // 僧侣/策士 (杖)
  Bishop = 'bishop',               // 司祭/神医 (光/杖)
  PegasusKnight = 'pegasus',       // 天马骑士 (飞行, 枪)
  WyvernRider = 'wyvern',          // 龙骑士 (飞行, 斧/枪)
  Thief = 'thief',                 // 盗贼 (开锁/偷盗, 剑)
  Assassin = 'assassin',           // 刺客 (瞬杀, 剑)
  Tactician = 'tactician',         // 军师 (光/理/杖)
  Warlord = 'warlord',             // 霸王/神将 (全武器)
}

export enum WeaponRank {
  E = 'E',
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
  S = 'S',
}

export interface UnitStats {
  hp: number;
  maxHp: number;
  str: number;     // 力量 (物理攻击)
  mag: number;     // 魔力 (魔法攻击)
  skl: number;     // 技巧 (命中与必杀)
  spd: number;     // 速度 (回避与攻速追击)
  lck: number;     // 幸运 (命中与回避/减敌必杀)
  def: number;     // 防御 (物理减伤)
  res: number;     // 魔防 (魔法减伤)
  con: number;     // 体格 (抵消武器重量)
  mov: number;     // 移动力
}

export interface GrowthRates {
  hp: number;
  str: number;
  mag: number;
  skl: number;
  spd: number;
  lck: number;
  def: number;
  res: number;
}

export interface Item {
  id: string;
  name: string;
  type: WeaponType;
  rank?: WeaponRank;
  might: number;       // 威力
  hit: number;         // 命中率
  crit: number;        // 必杀率
  weight: number;      // 重量
  minRange: number;    // 最小射程
  maxRange: number;    // 最大射程
  uses: number;        // 当前耐久
  maxUses: number;     // 最大耐久
  cost: number;        // 买入价
  icon: string;        // 武器图标ID
  description: string; // 说明
  effectiveAgainst?: string[]; // 特效 (如 [cavalier, knight, flying])
  isPromotionItem?: boolean;   // 是否转职道具
  promotesFrom?: UnitClass[];  // 适用转职职业
  isHealStaff?: boolean;       // 是否治疗杖
  healAmount?: number;         // 基础回复量
  statBoost?: Partial<UnitStats>; // 属性永久加成道具
}

export interface Unit {
  id: string;
  name: string;
  title: string;
  characterId: string;
  faction: Faction;
  unitClass: UnitClass;
  level: number;
  exp: number;
  stats: UnitStats;
  growths: GrowthRates;
  weaponRanks: Partial<Record<WeaponType, WeaponRank>>;
  inventory: Item[];
  equippedWeaponIndex: number;
  x: number;
  y: number;
  hasActed: boolean;
  isAlive: boolean;
  portraitId: string;
  expression?: 'normal' | 'smile' | 'angry';
  supports?: Record<string, 'C' | 'B' | 'A'>; // 角色ID -> 支援等级
  isBoss?: boolean;
  aiType?: 'attack' | 'guard' | 'healer' | 'boss' | 'escape';
  talkTargets?: string[]; // 可在战场中交谈的目标ID
}

export enum VictoryCondition {
  Rout = 'rout',              // 敌全灭
  Seize = 'seize',            // 制压王座/关隘
  DefeatBoss = 'defeat_boss',  // 击破Boss
  Survive = 'survive',        // 守卫 N 回合
  Escape = 'escape',          // 主角逃脱指定地点
}

export interface DialogueLine {
  speaker: string;
  speakerName: string;
  portraitId: string;
  expression?: 'normal' | 'smile' | 'angry';
  text: string;
  side?: 'left' | 'right';
}

export interface StageEvent {
  turn?: number;
  trigger?: 'turn_start' | 'visit_village' | 'talk' | 'boss_fight' | 'seize';
  villageX?: number;
  villageY?: number;
  talkInitiator?: string;
  talkTarget?: string;
  dialogue: DialogueLine[];
  rewardItem?: Item;
  rewardGold?: number;
  recruitUnit?: Unit;
  reinforcements?: Unit[];
}

export interface StageConfig {
  id: string;
  chapterNumber: number;  // 1-5
  stageNumber: number;    // 1-5
  isSecret?: boolean;     // 是否隐藏关
  title: string;
  subtitle: string;
  description: string;
  historicalNote: string; // 本关必须保留的演义事件与结果
  objective: string;
  meritReward: number;
  mapWidth: number;
  mapHeight: number;
  terrainGrid: TerrainType[][];
  playerSpawnPoints: { x: number; y: number }[];
  initialPlayerUnits: Unit[];
  enemyUnits: Unit[];
  allyUnits?: Unit[];
  victoryCondition: VictoryCondition;
  surviveTurns?: number;
  seizeTarget?: { x: number; y: number };
  escapeTarget?: { x: number; y: number };
  preBattleDialogue: DialogueLine[];
  postBattleDialogue: DialogueLine[];
  events: StageEvent[];
  bgmTheme: 'peace' | 'battle' | 'boss' | 'heroic' | 'crisis' | 'chinese';
}

export interface CombatForecast {
  attacker: Unit;
  defender: Unit;
  attackerWeapon: Item | null;
  defenderWeapon: Item | null;
  attackerDamage: number;
  attackerHit: number;
  attackerCrit: number;
  attackerDouble: boolean;
  defenderDamage: number;
  defenderHit: number;
  defenderCrit: number;
  defenderDouble: boolean;
  canDefenderCounter: boolean;
  attackerAdvantage: 'advantage' | 'disadvantage' | 'neutral';
  defenderAdvantage: 'advantage' | 'disadvantage' | 'neutral';
}

export interface CombatAction {
  isAttacker: boolean;
  isCrit: boolean;
  isHit: boolean;
  damage: number;
  defenderHpRemaining: number;
  attackerHpRemaining: number;
  weaponBroke?: boolean;
}

export interface LevelUpGain {
  hp: number;
  str: number;
  mag: number;
  skl: number;
  spd: number;
  lck: number;
  def: number;
  res: number;
}

export interface SaveSlot {
  id: number;
  timestamp: number;
  chapterTitle: string;
  chapterId: string;
  playTimeMinutes: number;
  partyUnits: Unit[];
  gold: number;
  casualMode: boolean;
  completedStages: string[];
  recruitedCharacters: string[];
  protagonistName: string;
}
