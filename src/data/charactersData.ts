/**
 * 三国志·烈火之誓 - 角色基础属性、成长率与初始配置数据
 * 包含 25+ 位蜀、魏、吴名将与隐藏传奇角色
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

// 初始玩家队伍（第1章涿县起兵阵容）
export function getInitialPartyUnits(protagonistName: string = '玄霄'): Unit[] {
  return [
    // 1. 原创主角
    createBaseUnit(
      'p_hero',
      protagonistName,
      '潜龙义士',
      'protagonist',
      UnitClass.Lord,
      1,
      { hp: 20, str: 7, mag: 1, skl: 8, spd: 8, lck: 6, def: 5, res: 2, con: 8, mov: 5 },
      { hp: 80, str: 55, mag: 15, skl: 60, spd: 60, lck: 50, def: 40, res: 25 },
      ['iron_sword', 'vulnerary'],
      { [WeaponType.Sword]: WeaponRank.D },
      { liubei: 'C' }
    ),

    // 2. 刘备 (玄德)
    createBaseUnit(
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
    ),

    // 3. 关羽 (云长)
    createBaseUnit(
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
    ),

    // 4. 张飞 (翼德)
    createBaseUnit(
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
    ),

    // 5. 随军策士/医官 (简雍/孙乾)
    createBaseUnit(
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
    ),
  ];
}

// 随章节加入的角色库
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
  // 1. 貂蝉 (隐藏关1获取)
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

  // 2. 吕布 (隐藏关2/白门楼说服获取)
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

  // 3. 华佗 (隐藏关3/名医加入)
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

  // 4. 左慈 (隐藏关4加入)
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

