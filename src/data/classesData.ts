/**
 * 三国志·烈火之誓 - 兵种与转职数据
 * 严格按照 GBA 火纹系统设定兵种上限、移动力与转职晋升
 */

import { UnitClass, WeaponType, TerrainType, UnitStats } from '../types';

export interface ClassDefinition {
  id: UnitClass;
  name: string;
  isPromoted: boolean;
  promotesTo?: UnitClass[];
  movement: number;
  usableWeapons: WeaponType[];
  promotionGains?: Partial<UnitStats>;
  description: string;
}

export const CLASSES_DATABASE: Record<UnitClass, ClassDefinition> = {
  [UnitClass.Lord]: {
    id: UnitClass.Lord,
    name: '领主/少主',
    isPromoted: false,
    promotesTo: [UnitClass.GreatLord],
    movement: 5,
    usableWeapons: [WeaponType.Sword],
    description: '年轻的主帅，身负汉室宗亲或义军领袖之望，攻守均衡。',
  },
  [UnitClass.GreatLord]: {
    id: UnitClass.GreatLord,
    name: '三军统帅',
    isPromoted: true,
    movement: 6,
    usableWeapons: [WeaponType.Sword, WeaponType.Lance],
    promotionGains: { hp: 4, str: 3, skl: 2, spd: 2, def: 3, res: 2, mov: 1 },
    description: '统御万军的威武主君，掌握枪剑双绝，全属性大幅强化。',
  },
  [UnitClass.Cavalier]: {
    id: UnitClass.Cavalier,
    name: '轻骑兵',
    isPromoted: false,
    promotesTo: [UnitClass.Paladin],
    movement: 7,
    usableWeapons: [WeaponType.Lance, WeaponType.Sword],
    description: '机动力极高的骑乘兵种，能灵活使用枪与剑。',
  },
  [UnitClass.Paladin]: {
    id: UnitClass.Paladin,
    name: '圣骑士',
    isPromoted: true,
    movement: 8,
    usableWeapons: [WeaponType.Lance, WeaponType.Sword, WeaponType.Axe],
    promotionGains: { hp: 3, str: 2, skl: 2, spd: 2, def: 2, res: 3, mov: 1 },
    description: '身经百战的铁骑首领，奔驰沙场如入无人之境，精通全物理兵刃。',
  },
  [UnitClass.Myrmidon]: {
    id: UnitClass.Myrmidon,
    name: '剑士',
    isPromoted: false,
    promotesTo: [UnitClass.Swordmaster],
    movement: 5,
    usableWeapons: [WeaponType.Sword],
    description: '追求极致剑技的武者，技巧与速度卓越，回避率极高。',
  },
  [UnitClass.Swordmaster]: {
    id: UnitClass.Swordmaster,
    name: '剑圣',
    isPromoted: true,
    movement: 6,
    usableWeapons: [WeaponType.Sword],
    promotionGains: { hp: 5, str: 2, skl: 3, spd: 3, def: 2, res: 1, mov: 1 },
    description: '人剑合一的绝顶宗师，自带 +15% 必杀补正，出招快若雷霆。',
  },
  [UnitClass.Fighter]: {
    id: UnitClass.Fighter,
    name: '狂战士/战将',
    isPromoted: false,
    promotesTo: [UnitClass.Warrior],
    movement: 5,
    usableWeapons: [WeaponType.Axe],
    description: '天生神力的悍勇步卒，HP与攻击力超群。',
  },
  [UnitClass.Warrior]: {
    id: UnitClass.Warrior,
    name: '勇士',
    isPromoted: true,
    movement: 6,
    usableWeapons: [WeaponType.Axe, WeaponType.Bow],
    promotionGains: { hp: 5, str: 3, skl: 2, spd: 1, def: 3, res: 1, mov: 1 },
    description: '兼具无双臂力与百步穿杨弓术的无敌猛将。',
  },
  [UnitClass.Knight]: {
    id: UnitClass.Knight,
    name: '重甲骑士',
    isPromoted: false,
    promotesTo: [UnitClass.General],
    movement: 4,
    usableWeapons: [WeaponType.Lance],
    description: '全身覆盖重装钢甲的钢铁壁垒，防御极高但移动迟缓。',
  },
  [UnitClass.General]: {
    id: UnitClass.General,
    name: '镇国将军',
    isPromoted: true,
    movement: 5,
    usableWeapons: [WeaponType.Lance, WeaponType.Axe, WeaponType.Sword],
    promotionGains: { hp: 4, str: 3, skl: 2, spd: 2, def: 4, res: 3, mov: 1 },
    description: '一夫当关万夫莫开的军团砥柱，能抵御千军万马的冲锋。',
  },
  [UnitClass.Archer]: {
    id: UnitClass.Archer,
    name: '弓手',
    isPromoted: false,
    promotesTo: [UnitClass.Sniper],
    movement: 5,
    usableWeapons: [WeaponType.Bow],
    description: '擅长2格远程打击的猎手，克制飞行部队。',
  },
  [UnitClass.Sniper]: {
    id: UnitClass.Sniper,
    name: '神射手/狙击手',
    isPromoted: true,
    movement: 6,
    usableWeapons: [WeaponType.Bow],
    promotionGains: { hp: 4, str: 3, skl: 3, spd: 2, def: 2, res: 2, mov: 1 },
    description: '箭无虚发的当代后羿，自带 +10% 必杀率。',
  },
  [UnitClass.Mage]: {
    id: UnitClass.Mage,
    name: '魔道士',
    isPromoted: false,
    promotesTo: [UnitClass.Sage],
    movement: 5,
    usableWeapons: [WeaponType.Anima],
    description: '研习天地五行阴阳之道的学者，能造成穿透护甲的法术伤害。',
  },
  [UnitClass.Sage]: {
    id: UnitClass.Sage,
    name: '贤者',
    isPromoted: true,
    movement: 6,
    usableWeapons: [WeaponType.Anima, WeaponType.Light, WeaponType.Staff],
    promotionGains: { hp: 4, mag: 3, skl: 2, spd: 2, def: 1, res: 3, mov: 1 },
    description: '参透天地大道的智者，既通晓破坏玄法，亦能施展治愈奇术。',
  },
  [UnitClass.Cleric]: {
    id: UnitClass.Cleric,
    name: '策士/医师',
    isPromoted: false,
    promotesTo: [UnitClass.Bishop],
    movement: 5,
    usableWeapons: [WeaponType.Staff],
    description: '救死扶伤的军医与祭祀，以法杖护佑同袍性命。',
  },
  [UnitClass.Bishop]: {
    id: UnitClass.Bishop,
    name: '神医/司祭',
    isPromoted: true,
    movement: 6,
    usableWeapons: [WeaponType.Staff, WeaponType.Light],
    promotionGains: { hp: 3, mag: 3, skl: 2, spd: 2, def: 2, res: 4, mov: 1 },
    description: '妙手回春的再世华佗，并掌握圣光法术惩治邪佞。',
  },
  [UnitClass.PegasusKnight]: {
    id: UnitClass.PegasusKnight,
    name: '天马骑士',
    isPromoted: false,
    movement: 7,
    usableWeapons: [WeaponType.Lance],
    description: '凌空飞行的空战骑士，不受山川河流阻碍，但畏惧弓箭。',
  },
  [UnitClass.WyvernRider]: {
    id: UnitClass.WyvernRider,
    name: '飞龙骑士',
    isPromoted: true,
    movement: 7,
    usableWeapons: [WeaponType.Lance, WeaponType.Axe],
    description: '驾驭凶猛飞龙的空中霸者，拥有卓越的机动与护甲。',
  },
  [UnitClass.Thief]: {
    id: UnitClass.Thief,
    name: '斥候/盗贼',
    isPromoted: false,
    promotesTo: [UnitClass.Assassin],
    movement: 6,
    usableWeapons: [WeaponType.Sword],
    description: '身法敏捷的探马，无需钥匙即可开启宝箱与关门，视野宽广。',
  },
  [UnitClass.Assassin]: {
    id: UnitClass.Assassin,
    name: '影杀者',
    isPromoted: true,
    movement: 6,
    usableWeapons: [WeaponType.Sword],
    promotionGains: { hp: 3, str: 2, skl: 3, spd: 3, def: 1, res: 2 },
    description: '隐于暗影中的冷酷刺客，必杀时有几率触发一击必杀！',
  },
  [UnitClass.Tactician]: {
    id: UnitClass.Tactician,
    name: '天下第一军师',
    isPromoted: true,
    movement: 6,
    usableWeapons: [WeaponType.Anima, WeaponType.Light, WeaponType.Staff],
    description: '诸葛武侯专属传奇职业，运筹帷幄之中，决胜千里之外。',
  },
  [UnitClass.Warlord]: {
    id: UnitClass.Warlord,
    name: '无双战神',
    isPromoted: true,
    movement: 8,
    usableWeapons: [WeaponType.Lance, WeaponType.Sword, WeaponType.Bow],
    description: '温侯吕布专属传奇职业，睥睨群雄，武力冠绝天下。',
  },
};

/**
 * 地形移动消耗矩阵 (Class Movement Cost Table)
 */
export function getTerrainMoveCost(unitClass: UnitClass, terrain: TerrainType): number {
  // 飞行单位 (天马/飞龙)
  if (unitClass === UnitClass.PegasusKnight || unitClass === UnitClass.WyvernRider) {
    if (terrain === TerrainType.Wall) return 999;
    return 1; // 飞行单位全地形消耗1
  }

  // 骑兵单位 (轻骑/圣骑)
  if (unitClass === UnitClass.Cavalier || unitClass === UnitClass.Paladin || unitClass === UnitClass.Warlord) {
    switch (terrain) {
      case TerrainType.Plains:
      case TerrainType.Bridge:
      case TerrainType.Gate:
        return 1;
      case TerrainType.Forest:
        return 3;
      case TerrainType.Desert:
        return 3;
      case TerrainType.Snow:
        return 2;
      case TerrainType.River:
      case TerrainType.Mountain:
      case TerrainType.Peak:
      case TerrainType.Wall:
        return 999; // 不可通行
      default:
        return 1;
    }
  }

  // 重甲骑士 (铠兵)
  if (unitClass === UnitClass.Knight || unitClass === UnitClass.General) {
    switch (terrain) {
      case TerrainType.Forest:
        return 2;
      case TerrainType.Mountain:
        return 4;
      case TerrainType.Desert:
        return 3;
      case TerrainType.River:
      case TerrainType.Peak:
      case TerrainType.Wall:
        return 999;
      default:
        return 1;
    }
  }

  // 常规步兵 (剑士、弓兵、魔道、领主等)
  switch (terrain) {
    case TerrainType.Forest:
      return 2;
    case TerrainType.Mountain:
      return 3;
    case TerrainType.Desert:
      return 2;
    case TerrainType.Snow:
      return 2;
    case TerrainType.River:
      return 5;
    case TerrainType.Peak:
    case TerrainType.Wall:
      return 999;
    default:
      return 1;
  }
}

/**
 * 地形防御与回避收益 (Terrain Avoid & Defense bonus)
 */
export function getTerrainBonus(terrain: TerrainType): { name: string; avoid: number; def: number; healPct: number; heal: number } {
  switch (terrain) {
    case TerrainType.Forest:
      return { name: '森林', avoid: 20, def: 1, healPct: 0, heal: 0 };
    case TerrainType.Mountain:
      return { name: '山地', avoid: 30, def: 2, healPct: 0, heal: 0 };
    case TerrainType.Peak:
      return { name: '高峰', avoid: 40, def: 2, healPct: 0, heal: 0 };
    case TerrainType.Fort:
      return { name: '要塞', avoid: 20, def: 2, healPct: 10, heal: 10 };
    case TerrainType.Castle:
      return { name: '城池', avoid: 20, def: 2, healPct: 10, heal: 10 };
    case TerrainType.Throne:
      return { name: '王座', avoid: 30, def: 3, healPct: 10, heal: 10 };
    case TerrainType.Gate:
      return { name: '关隘', avoid: 30, def: 3, healPct: 10, heal: 10 };
    case TerrainType.Village:
      return { name: '村庄', avoid: 10, def: 0, healPct: 0, heal: 0 };
    case TerrainType.River:
      return { name: '河流', avoid: 0, def: 0, healPct: 0, heal: 0 };
    case TerrainType.Bridge:
      return { name: '桥梁', avoid: 0, def: 0, healPct: 0, heal: 0 };
    case TerrainType.Desert:
      return { name: '沙漠', avoid: 5, def: 0, healPct: 0, heal: 0 };
    case TerrainType.Snow:
      return { name: '雪原', avoid: 5, def: 0, healPct: 0, heal: 0 };
    case TerrainType.Fire:
      return { name: '烈焰', avoid: 0, def: 0, healPct: 0, heal: 0 };
    case TerrainType.Wall:
      return { name: '石墙', avoid: 0, def: 0, healPct: 0, heal: 0 };
    default:
      return { name: '平原', avoid: 0, def: 0, healPct: 0, heal: 0 };
  }
}
