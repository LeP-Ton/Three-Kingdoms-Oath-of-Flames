/**
 * 三国志·烈火之誓 - 角色基础属性、成长率与名将全录档案库
 * 玩家扮演一台意外穿越到东汉末年的未来智能机器人（代号：天工·玄霄 / Chronos-VII），
 * 以高频离子斩、战术雷达等科技能力与直属小队参与经典战役，与自主行动的友方三国名将协同作战。
 * 遵循《三国演义》人物性格、重要事件与经典战役结局。
 */

import { Unit, Faction, UnitClass, WeaponRank, WeaponType } from '../types';
import { ITEMS_DATABASE } from './itemsData';

export function createBaseUnit(
  id: string,
  name: string,
  title: string,
  characterId: string,
  unitClass: UnitClass,
  level: number,
  stats: { hp: number; str: number; mag: number; skl: number; spd: number; lck: number; def: number; res: number; con: number; mov: number },
  growths: { hp: number; str: number; mag: number; skl: number; spd: number; lck: number; def: number; res: number },
  inventoryIds: string[],
  weaponRanks: Partial<Record<WeaponType, WeaponRank>> = {},
  supports: Record<string, 'C' | 'B' | 'A'> = {}
): Unit {
  return {
    id,
    name,
    title,
    characterId,
    faction: Faction.Player,
    unitClass,
    level,
    exp: 0,
    stats: {
      ...stats,
      maxHp: stats.hp,
    },
    growths,
    weaponRanks,
    inventory: inventoryIds.map((itemId) => {
      const baseItem = ITEMS_DATABASE[itemId] || ITEMS_DATABASE.iron_sword;
      return { ...baseItem };
    }),
    equippedWeaponIndex: 0,
    x: 0,
    y: 0,
    hasActed: false,
    isAlive: true,
    portraitId: characterId,
    expression: 'normal',
    supports,
  };
}

// 初始玩家队伍（第1章涿县起兵：机器人主角独自一人降临，初始无直属部队，以客卿身份与刘关张协同起兵）
export function getInitialPartyUnits(protagonistName: string = '天工·玄霄'): Unit[] {
  // 1. 未来智能战枢机器人主角 (Model: Chronos-VII)
  const robotHero = createBaseUnit(
    'p_hero',
    protagonistName,
    '时空战枢·智能机体',
    'protagonist',
    UnitClass.Lord,
    1,
    { hp: 22, str: 9, mag: 4, skl: 10, spd: 9, lck: 7, def: 7, res: 4, con: 9, mov: 5 },
    { hp: 85, str: 60, mag: 35, skl: 65, spd: 65, lck: 45, def: 50, res: 35 },
    ['plasma_blade', 'nanite_pack'],
    { [WeaponType.Sword]: WeaponRank.D },
    { liubei: 'C' }
  );
  robotHero.isRobot = true;
  robotHero.energy = 60;
  robotHero.maxEnergy = 60;
  robotHero.techSkills = ['plasma_slash', 'tactical_radar'];
  robotHero.isDirectSquad = false;

  // 2. 友方名将·刘备 (玄德)
  const liubei = createBaseUnit(
    'p_liubei',
    '刘备',
    '仁德皇叔',
    'liubei',
    UnitClass.Lord,
    2,
    { hp: 22, str: 6, mag: 2, skl: 7, spd: 7, lck: 10, def: 6, res: 4, con: 8, mov: 5 },
    { hp: 75, str: 45, mag: 25, skl: 50, spd: 50, lck: 70, def: 45, res: 40 },
    ['iron_sword', 'vulnerary'],
    { [WeaponType.Sword]: WeaponRank.D },
    { guanyu: 'C', zhangfei: 'C', p_hero: 'C' }
  );

  // 3. 友方名将·关羽 (云长)
  const guanyu = createBaseUnit(
    'p_guanyu',
    '关羽',
    '美髯公',
    'guanyu',
    UnitClass.Cavalier,
    3,
    { hp: 26, str: 10, mag: 0, skl: 9, spd: 8, lck: 5, def: 8, res: 2, con: 12, mov: 7 },
    { hp: 85, str: 65, mag: 10, skl: 60, spd: 50, lck: 40, def: 50, res: 20 },
    ['iron_lance', 'steel_lance', 'vulnerary'],
    { [WeaponType.Lance]: WeaponRank.C, [WeaponType.Sword]: WeaponRank.D },
    { liubei: 'C', zhangfei: 'C' }
  );

  // 4. 友方名将·张飞 (翼德)
  const zhangfei = createBaseUnit(
    'p_zhangfei',
    '张飞',
    '万夫不当',
    'zhangfei',
    UnitClass.Fighter,
    3,
    { hp: 28, str: 11, mag: 0, skl: 6, spd: 7, lck: 4, def: 6, res: 0, con: 14, mov: 5 },
    { hp: 90, str: 70, mag: 5, skl: 45, spd: 45, lck: 35, def: 40, res: 15 },
    ['iron_axe', 'hand_axe', 'vulnerary'],
    { [WeaponType.Axe]: WeaponRank.C },
    { liubei: 'C', guanyu: 'C' }
  );

  // 5. 随军策士/医官 (孙乾)
  const sunqian = createBaseUnit(
    'p_sunqian',
    '孙乾',
    '持重策士',
    'sunqian',
    UnitClass.Cleric,
    2,
    { hp: 18, str: 1, mag: 6, skl: 5, spd: 6, lck: 8, def: 2, res: 7, con: 6, mov: 5 },
    { hp: 55, str: 5, mag: 60, skl: 40, spd: 45, lck: 55, def: 20, res: 65 },
    ['heal_staff', 'vulnerary'],
    { [WeaponType.Staff]: WeaponRank.D }
  );

  // 注意：初始直属卫队为 0 人！后续需通过战功升职后招揽直属士兵
  return [robotHero, liubei, guanyu, zhangfei, sunqian];
}

// 随章节剧情加入的三国名将
export const RECRUITABLE_CHARACTERS: Record<string, () => Unit> = {
  // 赵云 (第2章界桥之战登场)
  zhaoyun: () =>
    createBaseUnit(
      'p_zhaoyun',
      '赵云',
      '常山赵子龙',
      'zhaoyun',
      UnitClass.Cavalier,
      6,
      { hp: 30, str: 12, mag: 1, skl: 13, spd: 13, lck: 9, def: 9, res: 4, con: 10, mov: 7 },
      { hp: 85, str: 60, mag: 15, skl: 65, spd: 65, lck: 55, def: 45, res: 30 },
      ['steel_lance', 'javelin', 'vulnerary'],
      { [WeaponType.Lance]: WeaponRank.B, [WeaponType.Sword]: WeaponRank.C }
    ),

  // 诸葛亮 (第3章江夏集结/草船借箭登场)
  zhugeliang: () =>
    createBaseUnit(
      'p_zhugeliang',
      '诸葛亮',
      '卧龙先生',
      'zhugeliang',
      UnitClass.Tactician,
      12,
      { hp: 32, str: 2, mag: 18, skl: 16, spd: 14, lck: 15, def: 7, res: 15, con: 7, mov: 6 },
      { hp: 70, str: 10, mag: 75, skl: 70, spd: 60, lck: 65, def: 35, res: 70 },
      ['thunder_tome', 'lightning_tome', 'mend_staff', 'elixir'],
      { [WeaponType.Anima]: WeaponRank.A, [WeaponType.Light]: WeaponRank.B, [WeaponType.Staff]: WeaponRank.A }
    ),

  // 黄忠 (老将，第4章汉中攻防加入)
  huangzhong: () =>
    createBaseUnit(
      'p_huangzhong',
      '黄忠',
      '百步穿杨',
      'huangzhong',
      UnitClass.Sniper,
      10,
      { hp: 35, str: 15, mag: 1, skl: 17, spd: 13, lck: 10, def: 10, res: 5, con: 11, mov: 6 },
      { hp: 75, str: 55, mag: 10, skl: 70, spd: 45, lck: 45, def: 40, res: 25 },
      ['yangyouji_bow', 'steel_bow', 'vulnerary'],
      { [WeaponType.Bow]: WeaponRank.A }
    ),

  // 马超 (第4章汉中登场)
  machao: () =>
    createBaseUnit(
      'p_machao',
      '马超',
      '西凉锦马超',
      'machao',
      UnitClass.Paladin,
      11,
      { hp: 36, str: 16, mag: 0, skl: 14, spd: 15, lck: 8, def: 11, res: 4, con: 13, mov: 8 },
      { hp: 80, str: 65, mag: 10, skl: 60, spd: 65, lck: 40, def: 45, res: 25 },
      ['killer_lance', 'steel_sword', 'vulnerary'],
      { [WeaponType.Lance]: WeaponRank.A, [WeaponType.Sword]: WeaponRank.B }
    ),

  // 魏延 (狂战骁将)
  weiyan: () =>
    createBaseUnit(
      'p_weiyan',
      '魏延',
      '长驱悍将',
      'weiyan',
      UnitClass.Warrior,
      10,
      { hp: 38, str: 17, mag: 0, skl: 12, spd: 11, lck: 6, def: 12, res: 2, con: 15, mov: 6 },
      { hp: 85, str: 65, mag: 5, skl: 50, spd: 45, lck: 35, def: 45, res: 15 },
      ['killer_axe', 'hammer', 'vulnerary'],
      { [WeaponType.Axe]: WeaponRank.A, [WeaponType.Bow]: WeaponRank.D }
    ),

  // 姜维 (第5章天水归降)
  jiangwei: () =>
    createBaseUnit(
      'p_jiangwei',
      '姜维',
      '天水麒麟',
      'jiangwei',
      UnitClass.Swordmaster,
      13,
      { hp: 37, str: 15, mag: 8, skl: 17, spd: 18, lck: 12, def: 11, res: 9, con: 10, mov: 6 },
      { hp: 80, str: 55, mag: 40, skl: 65, spd: 65, lck: 50, def: 45, res: 40 },
      ['killing_edge', 'silver_sword', 'elixir'],
      { [WeaponType.Sword]: WeaponRank.S }
    ),

  // 孙策 (江东小霸王)
  sunce: () =>
    createBaseUnit(
      'p_sunce',
      '孙策',
      '小霸王',
      'sunce',
      UnitClass.Paladin,
      9,
      { hp: 34, str: 15, mag: 1, skl: 13, spd: 14, lck: 11, def: 10, res: 5, con: 12, mov: 8 },
      { hp: 85, str: 65, mag: 10, skl: 55, spd: 60, lck: 50, def: 45, res: 30 },
      ['steel_lance', 'hand_axe', 'vulnerary'],
      { [WeaponType.Lance]: WeaponRank.A, [WeaponType.Axe]: WeaponRank.B }
    ),

  // 周瑜 (赤壁大都督)
  zhouyu: () =>
    createBaseUnit(
      'p_zhouyu',
      '周瑜',
      '美周郎',
      'zhouyu',
      UnitClass.Sage,
      11,
      { hp: 30, str: 3, mag: 17, skl: 15, spd: 15, lck: 14, def: 7, res: 13, con: 8, mov: 6 },
      { hp: 70, str: 15, mag: 70, skl: 65, spd: 65, lck: 60, def: 35, res: 65 },
      ['fire_tome', 'mend_staff', 'vulnerary'],
      { [WeaponType.Anima]: WeaponRank.A, [WeaponType.Staff]: WeaponRank.B }
    ),

  // 甘宁 (百骑劫魏营)
  ganning: () =>
    createBaseUnit(
      'p_ganning',
      '甘宁',
      '锦帆豪侠',
      'ganning',
      UnitClass.Swordmaster,
      10,
      { hp: 36, str: 16, mag: 0, skl: 15, spd: 17, lck: 10, def: 9, res: 3, con: 11, mov: 6 },
      { hp: 85, str: 60, mag: 5, skl: 60, spd: 65, lck: 50, def: 40, res: 20 },
      ['killing_edge', 'steel_sword', 'vulnerary'],
      { [WeaponType.Sword]: WeaponRank.A }
    ),

  // 夏侯惇 (曹魏元勋)
  xiahoudun: () =>
    createBaseUnit(
      'p_xiahoudun',
      '夏侯惇',
      '独眼苍狼',
      'xiahoudun',
      UnitClass.General,
      12,
      { hp: 42, str: 18, mag: 0, skl: 13, spd: 11, lck: 8, def: 18, res: 6, con: 16, mov: 5 },
      { hp: 90, str: 65, mag: 5, skl: 55, spd: 40, lck: 40, def: 60, res: 25 },
      ['silver_lance', 'steel_lance', 'vulnerary'],
      { [WeaponType.Lance]: WeaponRank.S }
    ),

  // 张辽 (威震逍遥津)
  zhangliao: () =>
    createBaseUnit(
      'p_zhangliao',
      '张辽',
      '五子良将之首',
      'zhangliao',
      UnitClass.Paladin,
      13,
      { hp: 40, str: 17, mag: 1, skl: 16, spd: 16, lck: 11, def: 14, res: 8, con: 13, mov: 8 },
      { hp: 85, str: 60, mag: 10, skl: 65, spd: 60, lck: 50, def: 50, res: 35 },
      ['killer_lance', 'steel_axe', 'elixir'],
      { [WeaponType.Lance]: WeaponRank.S, [WeaponType.Axe]: WeaponRank.A }
    ),

  // --- 隐藏角色 (Hidden Characters) ---
  diaochan: () =>
    createBaseUnit(
      'p_diaochan',
      '貂蝉',
      '闭月红颜',
      'diaochan',
      UnitClass.Bishop,
      8,
      { hp: 25, str: 2, mag: 14, skl: 14, spd: 16, lck: 18, def: 5, res: 14, con: 6, mov: 6 },
      { hp: 65, str: 10, mag: 65, skl: 60, spd: 70, lck: 80, def: 30, res: 75 },
      ['physic_staff', 'lightning_tome', 'elixir'],
      { [WeaponType.Staff]: WeaponRank.A, [WeaponType.Light]: WeaponRank.B }
    ),

  lubu: () =>
    createBaseUnit(
      'p_lubu',
      '吕布',
      '飞将无双',
      'lubu',
      UnitClass.Warlord,
      16,
      { hp: 50, str: 24, mag: 0, skl: 20, spd: 22, lck: 8, def: 17, res: 6, con: 17, mov: 8 },
      { hp: 95, str: 75, mag: 5, skl: 70, spd: 70, lck: 30, def: 50, res: 20 },
      ['fangtian_halberd', 'killer_bow', 'elixir'],
      { [WeaponType.Lance]: WeaponRank.S, [WeaponType.Bow]: WeaponRank.A, [WeaponType.Sword]: WeaponRank.A }
    ),

  huatuo: () =>
    createBaseUnit(
      'p_huatuo',
      '华佗',
      '再世神医',
      'huatuo',
      UnitClass.Bishop,
      15,
      { hp: 36, str: 1, mag: 20, skl: 18, spd: 15, lck: 20, def: 8, res: 18, con: 7, mov: 6 },
      { hp: 70, str: 5, mag: 80, skl: 70, spd: 55, lck: 85, def: 35, res: 80 },
      ['physic_staff', 'mend_staff', 'elixir'],
      { [WeaponType.Staff]: WeaponRank.S, [WeaponType.Light]: WeaponRank.A }
    ),

  zuoci: () =>
    createBaseUnit(
      'p_zuoci',
      '左慈',
      '乌角仙人',
      'zuoci',
      UnitClass.Sage,
      18,
      { hp: 40, str: 0, mag: 23, skl: 21, spd: 19, lck: 16, def: 10, res: 22, con: 8, mov: 6 },
      { hp: 75, str: 5, mag: 85, skl: 75, spd: 65, lck: 60, def: 40, res: 85 },
      ['taiping_secret', 'flux_tome', 'elixir'],
      { [WeaponType.Anima]: WeaponRank.S, [WeaponType.Dark]: WeaponRank.A }
    ),
};

export const INITIAL_PARTY: Unit[] = getInitialPartyUnits();

// -------------------------------------------------------------
// 首页人物全录大典 (All Character Dossiers Database)
// 包含三国演义考据、专属立绘ID、演义性格、经典名言、特技与属性
// -------------------------------------------------------------
export interface CharacterDossier {
  id: string;
  name: string;
  courtesyName: string; // 字
  title: string;
  faction: string;
  factionKey: 'cyber' | 'shu' | 'wei' | 'wu' | 'qun';
  unitClass: string;
  portraitId: string;
  weaponType: string;
  signatureSkill: string;
  signatureWeapon: string;
  quote: string;
  historicalBio: string; // 《三国演义》考据
  stats: {
    hp: number;
    str: number;
    mag: number;
    skl: number;
    spd: number;
    lck: number;
    def: number;
    res: number;
    mov: number;
  };
}

export const ALL_CHARACTERS_ROSTER: CharacterDossier[] = [
  // --- 1. 未来战枢与直属卫队 ---
  {
    id: 'protagonist',
    name: '天工·玄霄',
    courtesyName: '代号 Chronos-7',
    title: '未来时空战枢·智能机体',
    faction: '未来战枢',
    factionKey: 'cyber',
    unitClass: '领主 / 智能机动战枢',
    portraitId: 'protagonist',
    weaponType: '高频离子光刃 / 量子武器',
    signatureSkill: '量子战术雷达 / 纳米自愈矩阵 / 离子斩',
    signatureWeapon: '高频离子刃 (破甲)',
    quote: '“核心协议确认：辅助刘备，扫平海内。时空曲率坍缩点已锁定，全系统过载充能！”',
    historicalBio: '来自高维纪元的战术协调智能机器人，因时空跳跃事故穿越至公元184年涿县桃园。经量子推演，认同刘备仁德匡世理念，以客卿身份襄助蜀汉。初始单机作战无直属部曲，随战功积累升职拜将，逐步组建并扩编直属特种卫队。',
    stats: { hp: 22, str: 9, mag: 4, skl: 10, spd: 9, lck: 7, def: 7, res: 4, mov: 5 },
  },
  {
    id: 'squad_guard_elite',
    name: '直属卫队·锐士',
    courtesyName: '编制士兵',
    title: '主角直属冲锋锐士',
    faction: '直属卫队',
    factionKey: 'cyber',
    unitClass: '剑士 / 近卫轻步',
    portraitId: 'squad_guard',
    weaponType: '精钢长剑 / 破阵短刃',
    signatureSkill: '协同突击 (与战枢相邻时命中+15%)',
    signatureWeapon: '精锻环首刀',
    quote: '“誓随战枢将军冲锋陷阵，万死不辞！”',
    historicalBio: '玄霄通过战功升职为什长后，亲自招募并操练的直属突击死士。装备战枢测算强化的防弹甲片与步战利刃，纪律严明，专司近卫攻坚。',
    stats: { hp: 24, str: 9, mag: 0, skl: 11, spd: 12, lck: 7, def: 5, res: 2, mov: 5 },
  },

  // --- 2. 蜀汉英豪 (Shu Han) ---
  {
    id: 'liubei',
    name: '刘备',
    courtesyName: '玄德',
    title: '仁德昭烈·汉昭烈帝',
    faction: '蜀汉',
    factionKey: 'shu',
    unitClass: '领主 / 仁德之君',
    portraitId: 'liubei',
    weaponType: '双股剑',
    signatureSkill: '仁义之风 (周围3格友军回避+10%)',
    signatureWeapon: '雌雄双股剑',
    quote: '“屈身守分，以待天时。吾宁死，亦不作不义之事！”',
    historicalBio: '汉中山靖王之后。少孤贫，贩履织席为业，身长七尺五寸，垂手下膝，顾自见其耳。涿县与关张桃园三结义，誓同生死。依曹操、投袁绍、托刘表，屡经蹉跎而不改匡扶汉室之仁心，三顾茅庐得孔明，终成鼎足帝业。',
    stats: { hp: 22, str: 6, mag: 2, skl: 7, spd: 7, lck: 10, def: 6, res: 4, mov: 5 },
  },
  {
    id: 'guanyu',
    name: '关羽',
    courtesyName: '云长',
    title: '美髯公·武圣威震华夏',
    faction: '蜀汉',
    factionKey: 'shu',
    unitClass: '圣骑士 / 关圣帝君',
    portraitId: 'guanyu',
    weaponType: '青龙偃月刀',
    signatureSkill: '武圣绝尘 (先制反击，对骑兵必杀+20%)',
    signatureWeapon: '冷艳锯·青龙偃月刀',
    quote: '“玉可碎而不可改其白，竹可焚而不可毁其节。身虽殒，名可垂于竹帛也！”',
    historicalBio: '字云长，河东解良人。丹凤眼、卧蚕眉、面如重枣、美髯及腹。温酒斩华雄、斩颜良诛文丑、过五关斩六将、千里走单骑、华容道义释曹操。水淹七军擒于禁斩庞德，威震华夏，曹操几欲迁都避其锋芒。',
    stats: { hp: 26, str: 10, mag: 0, skl: 9, spd: 8, lck: 5, def: 8, res: 2, mov: 7 },
  },
  {
    id: 'zhangfei',
    name: '张飞',
    courtesyName: '翼德',
    title: '万夫不当·车骑将军',
    faction: '蜀汉',
    factionKey: 'shu',
    unitClass: '狂战士 / 虎臣',
    portraitId: 'zhangfei',
    weaponType: '丈八蛇矛',
    signatureSkill: '当阳怒吼 (周围2格敌军防御-3)',
    signatureWeapon: '丈八点钢蛇矛',
    quote: '“我乃燕人张翼德也！谁敢与我决一死战？！”',
    historicalBio: '字翼德，涿郡人。豹头环眼，燕颔虎须，声若巨雷，势如奔马。长坂坡当阳桥头一声厉喝，吓退曹军百万雄师，断桥截流。义释严颜深明大义，智取瓦口关大败张郃，性格刚直烈火，勇冠三军。',
    stats: { hp: 28, str: 11, mag: 0, skl: 6, spd: 7, lck: 4, def: 6, res: 0, mov: 5 },
  },
  {
    id: 'zhaoyun',
    name: '赵云',
    courtesyName: '子龙',
    title: '常山真龙·虎威将军',
    faction: '蜀汉',
    factionKey: 'shu',
    unitClass: '圣骑士 / 银枪神将',
    portraitId: 'zhaoyun',
    weaponType: '龙胆亮银枪',
    signatureSkill: '一身是胆 (HP低于50%时回避与必杀+25%)',
    signatureWeapon: '龙胆亮银枪 / 青釭剑',
    quote: '“吾乃常山赵子龙也！百万曹军之中，何惧之有！”',
    historicalBio: '字子龙，常山真定人。身长八尺，姿颜雄伟。界桥初战救公孙瓒，长坂坡单骑救阿斗，七进七出杀曹军名将五十余员，夺青釭宝剑。截江夺阿斗，汉水空营拒曹兵，刘备赞曰：“子龙一身都是胆也！”',
    stats: { hp: 30, str: 12, mag: 1, skl: 13, spd: 13, lck: 9, def: 9, res: 4, mov: 7 },
  },
  {
    id: 'zhugeliang',
    name: '诸葛亮',
    courtesyName: '孔明',
    title: '卧龙·蜀汉丞相武乡侯',
    faction: '蜀汉',
    factionKey: 'shu',
    unitClass: '军师 / 卧龙贤相',
    portraitId: 'zhugeliang',
    weaponType: '白羽扇 / 理光双法杖',
    signatureSkill: '八阵神谋 (全图天候掌控，法术命中100%)',
    signatureWeapon: '白羽阴阳扇',
    quote: '“鞠躬尽瘁，死而后已。运筹帷幄之中，决胜千里之外。”',
    historicalBio: '号卧龙，琅琊阳都人。隐居隆中，好为《梁父吟》。刘备三顾茅庐，孔明陈《隆中对》定三分天下。火烧博望、火烧新野、舌战群儒、借东风火烧赤壁、智取汉中、七擒孟获、六出祁山，鞠躬尽瘁，忠贞照千古。',
    stats: { hp: 32, str: 2, mag: 18, skl: 16, spd: 14, lck: 15, def: 7, res: 15, mov: 6 },
  },
  {
    id: 'huangzhong',
    name: '黄忠',
    courtesyName: '汉升',
    title: '百步穿杨·后将军刚侯',
    faction: '蜀汉',
    factionKey: 'shu',
    unitClass: '狙击手 / 烈弓老将',
    portraitId: 'huangzhong',
    weaponType: '养由基弓 / 铁胎大弓',
    signatureSkill: '定军斩将 (反击距离+1，对Boss必杀+15%)',
    signatureWeapon: '养由基穿杨弓',
    quote: '“老夫虽年逾六旬，若开硬弓，尚能连发三矢而透七札！”',
    historicalBio: '字汉升，南阳人。长沙之战与关羽斗百余合不分胜负，箭射关羽盔缨报不杀之恩。归刘备后入川破刘璋，定军山一役居高临下金鼓齐鸣，刀劈魏国西线主帅夏侯渊，威名震蜀中，五虎大将之一。',
    stats: { hp: 35, str: 15, mag: 1, skl: 17, spd: 13, lck: 10, def: 10, res: 5, mov: 6 },
  },
  {
    id: 'machao',
    name: '马超',
    courtesyName: '孟起',
    title: '西凉锦马超·骠骑将军',
    faction: '蜀汉',
    factionKey: 'shu',
    unitClass: '圣骑士 / 狮盔西凉统帅',
    portraitId: 'machao',
    weaponType: '虎头湛金枪',
    signatureSkill: '神威西凉 (骑乘冲锋伤害+4)',
    signatureWeapon: '虎头湛金枪',
    quote: '“曹贼！杀吾父弟之仇，不共戴天，今日誓取汝首！”',
    historicalBio: '字孟起，扶风茂陵人。汉伏波将军马援之后。面白如玉，目若朗星，狮盔兽带，人称“锦马超”。潼关一战连败于禁、张郃，杀得曹操割须弃袍。渭桥大战许褚，葭萌关夜战张飞数百回合，勇冠西凉。',
    stats: { hp: 36, str: 16, mag: 0, skl: 14, spd: 15, lck: 8, def: 11, res: 4, mov: 8 },
  },
  {
    id: 'weiyan',
    name: '魏延',
    courtesyName: '文长',
    title: '破羌骁将·南郑侯',
    faction: '蜀汉',
    factionKey: 'shu',
    unitClass: '勇士 / 狂骨战将',
    portraitId: 'weiyan',
    weaponType: '狂骨巨斧 / 斩马大刀',
    signatureSkill: '子午奇袭 (侧翼攻击必定触发连击)',
    signatureWeapon: '嗜血精钢斧',
    quote: '“谁敢杀我？！汉中重镇，亮自以文长当之！”',
    historicalBio: '字文长，义阳人。长沙反杀韩玄救黄忠迎刘备。入蜀作战战功彪炳，刘备破格拔擢为汉中太守，镇守北方门户十余载固若金汤。随孔明北伐勇猛善战，屡立战功，提出了著名的奇袭子午谷之计。',
    stats: { hp: 38, str: 17, mag: 0, skl: 12, spd: 11, lck: 6, def: 12, res: 2, mov: 6 },
  },
  {
    id: 'jiangwei',
    name: '姜维',
    courtesyName: '伯约',
    title: '幼麒·大将军九伐中原',
    faction: '蜀汉',
    factionKey: 'shu',
    unitClass: '剑圣 / 文武双全',
    portraitId: 'jiangwei',
    weaponType: '绿沉枪 / 倚天双刃',
    signatureSkill: '继志北伐 (连击次数+1，死斗意志)',
    signatureWeapon: '绿沉宝枪',
    quote: '“我计不成，乃天命也！愿陛下忍数日之辱，臣欲使社稷危而复安，日月幽而复明！”',
    historicalBio: '字伯约，天水冀县人。少孤，好郑氏学，才兼文武。孔明一出祁山见其机智过人，设计收服，倾囊相授兵书连弩法。孔明星落五丈原后，姜维承继遗志，九伐中原，鏖战邓艾钟会，至死方休。',
    stats: { hp: 37, str: 15, mag: 8, skl: 17, spd: 18, lck: 12, def: 11, res: 9, mov: 6 },
  },
  {
    id: 'sunqian',
    name: '孙乾',
    courtesyName: '公佑',
    title: '持重之臣·秉忠将军',
    faction: '蜀汉',
    factionKey: 'shu',
    unitClass: '司祭 / 随军策士',
    portraitId: 'sunqian',
    weaponType: '治愈权杖 / 庇护圣书',
    signatureSkill: '从容斡旋 (周围友军受伤害减免3点)',
    signatureWeapon: '仁者慈悲圣杖',
    quote: '“主公志在天下，乾愿效犬马之劳，奔走四方以全大义。”',
    historicalBio: '字公佑，北海人。陶谦推其为名士荐予刘备。刘备颠沛流离奔波半生，孙乾常为使者周旋于袁绍、曹操、刘表之间，应对得体未尝辱命。蜀汉建立后位列文臣首屈一指，谦和厚重。',
    stats: { hp: 18, str: 1, mag: 6, skl: 5, spd: 6, lck: 8, def: 2, res: 7, mov: 5 },
  },

  // --- 3. 曹魏巨擘 (Cao Wei) ---
  {
    id: 'caocao',
    name: '曹操',
    courtesyName: '孟德',
    title: '乱世奸雄·魏武帝',
    faction: '曹魏',
    factionKey: 'wei',
    unitClass: '霸王 / 大统帅',
    portraitId: 'caocao',
    weaponType: '倚天剑 / 青釭剑',
    signatureSkill: '短歌雄才 (指挥范围内敌军命中-15%)',
    signatureWeapon: '倚天镇国剑',
    quote: '“宁教我负天下人，休教天下人负我！对酒当歌，人生几何！”',
    historicalBio: '字孟德，小字阿瞒，沛国谯县人。治世之能臣，乱世之奸雄。行刺董卓起义兵，奉天子以令不臣。官渡之战以弱胜强破袁绍一统北方，横槊赋诗战赤壁。雄才大略，兼具文学武略，魏国基业奠定者。',
    stats: { hp: 38, str: 16, mag: 12, skl: 16, spd: 14, lck: 15, def: 14, res: 11, mov: 6 },
  },
  {
    id: 'simayi',
    name: '司马懿',
    courtesyName: '仲达',
    title: '冢虎·太傅宣皇帝',
    faction: '曹魏',
    factionKey: 'wei',
    unitClass: '贤者 / 深谋军师',
    portraitId: 'simayi',
    weaponType: '阴阳折扇 / 暗影雷法',
    signatureSkill: '鹰视狼顾 (受致命伤时锁血1点并反击)',
    signatureWeapon: '玄水阴阳扇',
    quote: '“夫将兵者，不耻于退，而耻于不知所进退。夫为人者，当忍人之所不能忍！”',
    historicalBio: '字仲达，河内温县人。少有奇节，聪明多大略。有狼顾之相，曹操深忌之。智拒关羽攻势，五丈原坚壁清野耗死孔明。隐忍高平陵一举诛灭曹爽，尽掌魏国军政大权，三家归晋之奠基元祖。',
    stats: { hp: 36, str: 5, mag: 19, skl: 17, spd: 14, lck: 16, def: 11, res: 16, mov: 6 },
  },
  {
    id: 'zhangliao',
    name: '张辽',
    courtesyName: '文远',
    title: '威震逍遥津·征东将军晋阳侯',
    faction: '曹魏',
    factionKey: 'wei',
    unitClass: '圣骑士 / 五子良将之首',
    portraitId: 'zhangliao',
    weaponType: '问天大刀 / 银枪',
    signatureSkill: '召虎破军 (移动力+1，击破敌军可再移动)',
    signatureWeapon: '古锭问天刀',
    quote: '“辽来也！江东小儿闻张辽大名，夜不敢啼！”',
    historicalBio: '字文远，雁门马邑人。原随吕布，白门楼关羽保举投曹操。从征柳城白狼山阵斩单于蹋顿。合肥逍遥津之战，以八百步骑破孙权十万大军，斩杀吴将两员，几擒孙权，江南闻风丧胆，小儿夜啼止声。',
    stats: { hp: 40, str: 17, mag: 1, skl: 16, spd: 16, lck: 11, def: 14, res: 8, mov: 8 },
  },
  {
    id: 'xiahoudun',
    name: '夏侯惇',
    courtesyName: '元让',
    title: '拔矢啖睛·大将军高安乡侯',
    faction: '曹魏',
    factionKey: 'wei',
    unitClass: '将军 / 铁血独眼督',
    portraitId: 'xiahoudun',
    weaponType: '灭天重枪 / 巨斧',
    signatureSkill: '啖睛刚烈 (受到暴击后下一次反击必定必杀)',
    signatureWeapon: '苍狼寒铁枪',
    quote: '“父精母血，不可弃也！贼将纳命来！”',
    historicalBio: '字元让，沛国谯县人。汉夏侯婴之后。曹操起兵最早的心腹骁将。讨吕布征徐州，被曹性暗箭射中左目，拔箭带睛，大呼“父精母血不可弃”啖之，复策马刺死曹性，满营皆惊。治军俭朴，好学尚礼。',
    stats: { hp: 42, str: 18, mag: 0, skl: 13, spd: 11, lck: 8, def: 18, res: 6, mov: 5 },
  },
  {
    id: 'xiahouyuan',
    name: '夏侯渊',
    courtesyName: '妙才',
    title: '虎步关右·征西将军博昌侯',
    faction: '曹魏',
    factionKey: 'wei',
    unitClass: '轻骑兵 / 疾风射手',
    portraitId: 'xiahouyuan',
    weaponType: '流星雕弓 / 飞骑长枪',
    signatureSkill: '三日五百 (平原移动消耗减半，先攻)',
    signatureWeapon: '紫电雕弓',
    quote: '“典军校尉夏侯渊，三日五百，六日一千，兵贵神速！”',
    historicalBio: '字妙才，沛国谯县人。夏侯惇族弟。擅千里奔袭与出其不意，曹军称“典军校尉夏侯渊，三日五百，六日一千”。平马超韩遂，虎步关右横扫羌氐。定军山镇守汉中，遭法正黄忠居高突袭战殁。',
    stats: { hp: 36, str: 16, mag: 0, skl: 16, spd: 17, lck: 9, def: 11, res: 5, mov: 8 },
  },
  {
    id: 'caoren',
    name: '曹仁',
    courtesyName: '子孝',
    title: '金城铁壁·大司马陈侯',
    faction: '曹魏',
    factionKey: 'wei',
    unitClass: '将军 / 镇南壁垒',
    portraitId: 'caoren',
    weaponType: '玄铁重盾 / 镇山枪',
    signatureSkill: '金城汤池 (驻守据点时减伤50%)',
    signatureWeapon: '八门锁金甲',
    quote: '“仁在此据守，关羽纵有翻江倒海之能，休想越雷池一步！”',
    historicalBio: '字子孝，曹操从弟。少好弓马弋猎，后严整守节。江陵之战孤身突入孙权数千骑兵阵中救出牛金，勇冠三军。襄樊之役被关羽大军水淹七军死死围困，誓死不退激励士卒，终坚守至徐晃援兵赶到破围。',
    stats: { hp: 44, str: 17, mag: 0, skl: 12, spd: 9, lck: 10, def: 20, res: 7, mov: 5 },
  },

  // --- 4. 东吴豪杰 (Eastern Wu) ---
  {
    id: 'sunce',
    name: '孙策',
    courtesyName: '伯符',
    title: '小霸王·吴长沙桓王',
    faction: '东吴',
    factionKey: 'wu',
    unitClass: '圣骑士 / 破阵统领',
    portraitId: 'sunce',
    weaponType: '霸王破阵枪 / 劈山斧',
    signatureSkill: '小霸王英姿 (主动冲锋必杀率+20%)',
    signatureWeapon: '霸王黄金槊',
    quote: '“若天命在吴，策当扫平江东六郡，拓定东南霸业！”',
    historicalBio: '字伯符，吴郡富春人。孙坚长子。少有名声，勇冠江东。孙坚死后以传国玉玺质袁术借兵数千，渡江平定江东六郡八十一州，英气杰济，猛锐冠世，人皆称“江东小霸王”。惜英年早逝，托孤周瑜孙权。',
    stats: { hp: 34, str: 15, mag: 1, skl: 13, spd: 14, lck: 11, def: 10, res: 5, mov: 8 },
  },
  {
    id: 'zhouyu',
    name: '周瑜',
    courtesyName: '公瑾',
    title: '美周郎·大都督赤壁总帅',
    faction: '东吴',
    factionKey: 'wu',
    unitClass: '贤者 / 水军大都督',
    portraitId: 'zhouyu',
    weaponType: '焦尾古琴 / 赤壁烈火权杖',
    signatureSkill: '火攻天下 (火攻范围威力+50%，水战攻速+4)',
    signatureWeapon: '焦尾琴刃',
    quote: '“雄姿英发，羽扇纶巾，谈笑间，樯橹灰飞烟灭！”',
    historicalBio: '字公瑾，庐江舒县人。风姿英发，精通音律，江南谣曰“曲有误，周郎顾”。与孙策结为总角至交同娶二乔。赤壁之战挂帅总督三军，采纳黄盖苦肉计借东南风火烧曹操战船八百里，奠定天下三分之局。',
    stats: { hp: 30, str: 3, mag: 17, skl: 15, spd: 15, lck: 14, def: 7, res: 13, mov: 6 },
  },
  {
    id: 'luxun',
    name: '陆逊',
    courtesyName: '伯言',
    title: '儒将帅才·吴丞相江陵侯',
    faction: '东吴',
    factionKey: 'wu',
    unitClass: '贤者 / 儒生督相',
    portraitId: 'luxun',
    weaponType: '白羽折扇 / 烈焰火卷',
    signatureSkill: '火烧连营 (森林地形敌人受火伤翻倍)',
    signatureWeapon: '白虹流火扇',
    quote: '“刘备自矜用兵，连营七百里，此乃兵家大忌！今以火攻之，必溃不成军！”',
    historicalBio: '字伯言，吴郡华亭人。世家名宿。袭取荆州时示弱骄关羽之心。夷陵之战受命于危难之中，面对刘备亲率蜀汉倾国之兵，坚守猇亭不战，待蜀军师老疲弊连营七百里，以一把大火焚尽蜀军精锐，定鼎江东。',
    stats: { hp: 32, str: 4, mag: 18, skl: 16, spd: 15, lck: 13, def: 8, res: 14, mov: 6 },
  },
  {
    id: 'ganning',
    name: '甘宁',
    courtesyName: '兴霸',
    title: '锦帆游侠·折冲将军西陵太守',
    faction: '东吴',
    factionKey: 'wu',
    unitClass: '剑圣 / 狂风斩客',
    portraitId: 'ganning',
    weaponType: '双刀铁索 / 雕翎箭',
    signatureSkill: '百骑劫营 (夜战与奇袭移动+2，免反击)',
    signatureWeapon: '锦帆链刃',
    quote: '“孟德有张辽，孤有甘兴霸，足相敌也！”',
    historicalBio: '字兴霸，巴郡临江人。少有气力好游侠，以锦缎为舟帆，佩铜铃，人闻铃声皆知甘宁来。投孙权后战功赫赫，濡须口之战衔枚夜袭，率百人敢死队直插曹营斩首而还，无折一人，孙权叹为奇才。',
    stats: { hp: 36, str: 16, mag: 0, skl: 15, spd: 17, lck: 10, def: 9, res: 3, mov: 6 },
  },
  {
    id: 'taishici',
    name: '太史慈',
    courtesyName: '子义',
    title: '笃烈重义·建昌都尉',
    faction: '东吴',
    factionKey: 'wu',
    unitClass: '勇士 / 铁戟神箭',
    portraitId: 'taishici',
    weaponType: '狂岚双戟 / 贯石弓',
    signatureSkill: '笃义贯石 (近战双击，远程命中+20%)',
    signatureWeapon: '双铁戟·追风弓',
    quote: '“大丈夫生于乱世，当带三尺之剑，立不世之功！今所志未遂，奈何死乎！”',
    historicalBio: '字子义，东莱黄县人。美须髯，猿臂善射，弦不虚发。单骑突围孔融北海之围。神亭岭与小霸王孙策大战数百回合酣畅淋漓，难分伯仲。后归孙策孙权，镇抚山越重诺守信，笃烈英勇。',
    stats: { hp: 37, str: 16, mag: 0, skl: 16, spd: 15, lck: 9, def: 12, res: 4, mov: 6 },
  },

  // --- 5. 群雄异人 (Others & Mystics) ---
  {
    id: 'lubu',
    name: '吕布',
    courtesyName: '奉先',
    title: '人中吕布·飞将温侯',
    faction: '群雄',
    factionKey: 'qun',
    unitClass: '神将 / 战神',
    portraitId: 'lubu',
    weaponType: '方天画戟',
    signatureSkill: '天下无双 (攻速+4，无视武器克制反噬)',
    signatureWeapon: '方天画戟·赤兔马',
    quote: '“人中吕布，马中赤兔！方天画戟之下，何人敢撄其锋？！”',
    historicalBio: '字奉先，五原九原人。身材伟岸，戴三叉束发紫金冠，持方天画戟，骑嘶风赤兔马。虎牢关独战刘关张三英，濮阳城火烧曹操，辕门射戟一箭定和。勇力冠绝三国群雄，惜反复无常，终陨命下邳白门楼。',
    stats: { hp: 50, str: 24, mag: 0, skl: 20, spd: 22, lck: 8, def: 17, res: 6, mov: 8 },
  },
  {
    id: 'diaochan',
    name: '貂蝉',
    courtesyName: '闭月',
    title: '倾国绝代·四大美人',
    faction: '群雄',
    factionKey: 'qun',
    unitClass: '司祭 / 倾国飞燕',
    portraitId: 'diaochan',
    weaponType: '流云水袖 / 祈愿法杖',
    signatureSkill: '连环闭月 (再行动周围友军，令敌军男性混乱)',
    signatureWeapon: '七星宝刀 / 连环绫',
    quote: '“妾身虽弱女子，亦知天下兴亡。愿舍粉身碎骨，以安汉室社稷！”',
    historicalBio: '司徒王允义女。年二八，容貌倾城，见者神魂颠倒。见董卓祸乱天下，挺身而出以连环计周旋于董卓、吕布父子之间，使凤仪亭掷戟生嫌，终借吕布之手除董卓大恶，名垂青史。',
    stats: { hp: 25, str: 2, mag: 14, skl: 14, spd: 16, lck: 18, def: 5, res: 14, mov: 6 },
  },
  {
    id: 'dongzhuo',
    name: '董卓',
    courtesyName: '仲颖',
    title: '西凉魔王·太师相国',
    faction: '群雄',
    factionKey: 'qun',
    unitClass: '霸王 / 凶暴枭首',
    portraitId: 'dongzhuo',
    weaponType: '巨阙狂刃 / 沉金战斧',
    signatureSkill: '暴虐横行 (攻击附带吸血20%，防御极高)',
    signatureWeapon: '西凉碎骨刃',
    quote: '“顺我者昌，逆我者亡！这天下是刘家的，也是老夫的！”',
    historicalBio: '字仲颖，陇西临洮人。膂力过人，双带两鞬左右驰射。何进召其进京诛宦官，董卓趁乱引西凉铁骑入洛阳，废少帝立献帝，弑太后焚洛阳迁都长安，倒行逆施残虐百姓，终被王允吕布合谋所诛。',
    stats: { hp: 48, str: 20, mag: 2, skl: 11, spd: 8, lck: 5, def: 19, res: 8, mov: 5 },
  },
  {
    id: 'zhangjiao',
    name: '张角',
    courtesyName: '天公',
    title: '大贤良师·太平道领袖',
    faction: '群雄',
    factionKey: 'qun',
    unitClass: '魔道统帅 / 太平仙师',
    portraitId: 'zhangjiao',
    weaponType: '九节杖 / 太平雷卷',
    signatureSkill: '苍天已死 (召雷术全屏震荡，黄巾狂热)',
    signatureWeapon: '南华九节杖',
    quote: '“苍天已死，黄天当立！岁在甲子，天下大吉！”',
    historicalBio: '钜鹿人。入山采药遇南华老仙授《太平要术》三卷，号“大贤良师”。施符水治病聚徒数十万，分设三十六方。中平元年掀起波及全国的黄巾大起义，拉开三国东汉末年乱世割据之序幕。',
    stats: { hp: 35, str: 1, mag: 18, skl: 15, spd: 12, lck: 12, def: 6, res: 17, mov: 5 },
  },
  {
    id: 'huatuo',
    name: '华佗',
    courtesyName: '元化',
    title: '杏林圣手·建安神医',
    faction: '群雄',
    factionKey: 'qun',
    unitClass: '司祭 / 医家宗师',
    portraitId: 'huatuo',
    weaponType: '青囊医典 / 银针药葫',
    signatureSkill: '刮骨疗毒 (驱散全部减益，恢复满额生命)',
    signatureWeapon: '青囊救世书',
    quote: '“君侯箭毒入骨，需割皮开肉，刮骨去毒，其声悉悉，君侯饮酒弈棋自若也！”',
    historicalBio: '字元化，沛国谯县人。通晓经书，尤精于方药、针灸、外科学，发明“麻沸散”开腹手术，创五禽戏强身。曾为关羽刮骨疗毒，谈笑自若。后欲为曹操开颅治头风，曹操疑其害己下狱致死，青囊书焚于卒妇。',
    stats: { hp: 36, str: 1, mag: 20, skl: 18, spd: 15, lck: 20, def: 8, res: 18, mov: 6 },
  },
  {
    id: 'zuoci',
    name: '左慈',
    courtesyName: '元放',
    title: '乌角仙人·峨眉方士',
    faction: '群雄',
    factionKey: 'qun',
    unitClass: '贤者 / 天仙方术士',
    portraitId: 'zuoci',
    weaponType: '遁甲天书 / 拂尘仙剑',
    signatureSkill: '奇门遁甲 (瞬移全图任意无障碍格，免除物法伤害)',
    signatureWeapon: '九天遁甲天书',
    quote: '“公位极人臣，富贵已极，何不退步随贫道往峨眉山修道？何苦恋此虚名！”',
    historicalBio: '字元放，庐江人。少有神通，居天柱山学道，得《九丹金液仙经》。曹操宴请百官，左慈以铜盆钓鲈鱼、紫金杯分饮温酒、掷杯化白鸠戏弄曹操，遁入羊群戏谑权贵，神龙见首不见尾之当世异人。',
    stats: { hp: 40, str: 0, mag: 23, skl: 21, spd: 19, lck: 16, def: 10, res: 22, mov: 6 },
  },
];
