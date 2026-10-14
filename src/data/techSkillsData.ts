/**
 * 三国志·烈火之誓 - 未来智能机器人科技技能与直属小队军阶系统
 * 科技技能：高频离子斩、战术雷达、纳米修复、EMP脉冲、动能护盾、轨道校准
 * 军阶系统：战功升职解锁直属卫队编制名额（初始0人，最高5人）
 */

import { TechSkill, TechSkillId, MilitaryRankInfo, Unit, UnitClass, WeaponRank, WeaponType, Faction } from '../types';
import { createBaseUnit } from './charactersData';

export type { TechSkill, TechSkillId };

export const TECH_SKILLS: Record<TechSkillId, TechSkill> = {
  plasma_slash: {
    id: 'plasma_slash',
    name: '高频离子斩',
    nameEn: 'Plasma Ion Slash',
    energyCost: 20,
    range: 1,
    targetType: 'enemy',
    description: '激活等离子超周波共振，光刃以分子级速度振动撕裂敌军护甲。',
    techEffectText: '攻击威力+6，无视敌方50%防御，重甲单位额外+8伤害',
    unlockRank: 1,
  },
  tactical_radar: {
    id: 'tactical_radar',
    name: '量子战术雷达',
    nameEn: 'Quantum Tactical Radar',
    energyCost: 15,
    range: 3,
    targetType: 'area',
    description: '启动高精光学与热红外雷达，向周遭3格内的友方部队同步战场弱点坐标。',
    techEffectText: '3格内所有友军与直属部队命中率+25%、回避率+20%、必杀率+15% (持续2回合)',
    unlockRank: 1,
  },
  nanite_repair: {
    id: 'nanite_repair',
    name: '纳米修复矩阵',
    nameEn: 'Nanite Repair Matrix',
    energyCost: 20,
    range: 1,
    targetType: 'ally',
    description: '喷射高浓度医用自复制微型纳米机器人，瞬间缝合创伤并修复机体损伤。',
    techEffectText: '为自身或相邻友方/直属单位恢复22点HP，并重置负面减益',
    unlockRank: 2,
  },
  emp_shock: {
    id: 'emp_shock',
    name: '电磁脉冲过载',
    nameEn: 'EMP Overload Shock',
    energyCost: 25,
    range: 2,
    targetType: 'enemy',
    description: '定向发射超高频微波电磁脉冲，令目标重型武器与神经机能瞬间过载麻痹。',
    techEffectText: '造成12点直接真实破甲伤害，并使目标陷入过载：无法反击且移动力-2 (持续1回合)',
    unlockRank: 3,
  },
  kinetic_shield: {
    id: 'kinetic_shield',
    name: '动能偏转护盾',
    nameEn: 'Kinetic Deflector Shield',
    energyCost: 20,
    range: 0,
    targetType: 'self',
    description: '机体展开六边形聚合光子偏转力场，吸收即将到来的物理与法术冲击。',
    techEffectText: '生成一个可吸收25点伤害的能量护盾，优先抵扣伤害',
    unlockRank: 4,
  },
  orbital_strike: {
    id: 'orbital_strike',
    name: '轨道动能校准',
    nameEn: 'Orbital Kinetic Calibration',
    energyCost: 35,
    range: 3,
    targetType: 'enemy',
    description: '向近地时空轨道锚点发送校准坐标，引导超高速钨合金动能弹轰击敌方阵地。',
    techEffectText: '远程轰击！造成26点高额范围破甲伤害，目标周围1格敌军受到50%溅射伤害',
    unlockRank: 5,
  },
};

export const MILITARY_RANKS: MilitaryRankInfo[] = [
  {
    rankLevel: 1,
    title: '客卿试作机',
    titleEn: 'Guest Vanguard Unit',
    requiredMerits: 0,
    squadCap: 0,
    description: '意外穿越至东汉桃园，初涉乱世，尚无官身部属，作为单兵客卿协助刘备。',
    rankReward: '初始解锁技能：高频离子斩、量子战术雷达',
  },
  {
    rankLevel: 2,
    title: '别部什长',
    titleEn: 'Decurion Squad Leader',
    requiredMerits: 100,
    squadCap: 1,
    description: '初战斩将立功，获刘备授以什长铜印，特许组建并统率1名直属精锐卫士。',
    rankReward: '直属小队编制：1人 · 解锁技能：纳米修复矩阵 · 开放招募【先锋冲锋锐士】',
  },
  {
    rankLevel: 3,
    title: '陷阵百夫长',
    titleEn: 'Centurion Commander',
    requiredMerits: 300,
    squadCap: 2,
    description: '平定黄巾之乱功勋卓著，晋升百夫长，直属小队扩充为战术突击组。',
    rankReward: '直属小队编制：2人 · 解锁技能：电磁脉冲过载 · 开放招募【神机连弩卫】',
  },
  {
    rankLevel: 4,
    title: '牙门偏将',
    titleEn: 'Junior Frontline General',
    requiredMerits: 600,
    squadCap: 3,
    description: '从讨董联军至徐州保卫战屡立奇功，受封牙门偏将，直属小队升级为战术亲军。',
    rankReward: '直属小队编制：3人 · 解锁技能：动能偏转护盾 · 开放招募【重装陷阵铁卫】',
  },
  {
    rankLevel: 5,
    title: '荡寇校尉',
    titleEn: 'Vanguard Colonel',
    requiredMerits: 1000,
    squadCap: 4,
    description: '赤壁烽烟、博望破敌，军威大振！刘皇叔亲自授拜荡寇校尉，统辖独立特勤卫队。',
    rankReward: '直属小队编制：4人 · 解锁技能：轨道动能校准 · 开放招募【战地纳米医官】',
  },
  {
    rankLevel: 6,
    title: '前军大都督',
    titleEn: 'Grand Commander of Vanguard',
    requiredMerits: 1500,
    squadCap: 5,
    description: '克荆益、定汉中，封拜大都督！未来科技与三国名将浑然一体，直属卫队威震天下！',
    rankReward: '直属小队编制：5人（满编） · 全属性成长率+10% · 直属部队全攻防+2',
  },
];

export function getRankByMerits(merits: number): MilitaryRankInfo {
  for (let i = MILITARY_RANKS.length - 1; i >= 0; i--) {
    if (merits >= MILITARY_RANKS[i].requiredMerits) {
      return MILITARY_RANKS[i];
    }
  }
  return MILITARY_RANKS[0];
}

// 直属小队兵种招揽模板
export interface DirectSquadCandidate {
  id: string;
  name: string;
  role: string;
  unitClass: UnitClass;
  costGold: number;
  requiredRank: number;
  description: string;
  createUnit: () => Unit;
}

export const SQUAD_CANDIDATES: DirectSquadCandidate[] = [
  {
    id: 'sq_vanguard',
    name: '先锋冲锋锐士',
    role: '先锋突击',
    unitClass: UnitClass.Myrmidon,
    costGold: 300,
    requiredRank: 2,
    description: '身披紧凑轻铠的死士剑客，接受过战术协同训练，善于近身斩首与突袭。',
    createUnit: () => {
      const u = createBaseUnit(
        `sq_van_${Date.now()}`,
        '直属锐士·林冲',
        '近卫剑士',
        'squad_guard',
        UnitClass.Myrmidon,
        3,
        { hp: 24, str: 9, mag: 0, skl: 11, spd: 12, lck: 7, def: 5, res: 2, con: 8, mov: 5 },
        { hp: 70, str: 50, mag: 5, skl: 60, spd: 65, lck: 40, def: 35, res: 20 },
        ['iron_sword', 'vulnerary'],
        { [WeaponType.Sword]: WeaponRank.C }
      );
      u.isDirectSquad = true;
      u.squadRole = '先锋锐士';
      return u;
    },
  },
  {
    id: 'sq_scout',
    name: '游骑斥候兵',
    role: '机动巡哨',
    unitClass: UnitClass.Cavalier,
    costGold: 400,
    requiredRank: 2,
    description: '乘骑矫健战马的高机动侦察骑兵，移动力高达7格，负责抢占要道与包抄。',
    createUnit: () => {
      const u = createBaseUnit(
        `sq_sco_${Date.now()}`,
        '直属游骑·赵勇',
        '巡哨轻骑',
        'squad_guard',
        UnitClass.Cavalier,
        3,
        { hp: 25, str: 9, mag: 0, skl: 8, spd: 9, lck: 6, def: 7, res: 2, con: 10, mov: 7 },
        { hp: 75, str: 45, mag: 5, skl: 50, spd: 50, lck: 40, def: 45, res: 25 },
        ['iron_lance', 'vulnerary'],
        { [WeaponType.Lance]: WeaponRank.C }
      );
      u.isDirectSquad = true;
      u.squadRole = '游骑斥候';
      return u;
    },
  },
  {
    id: 'sq_arbalest',
    name: '神机连弩卫',
    role: '精准射手',
    unitClass: UnitClass.Archer,
    costGold: 500,
    requiredRank: 3,
    description: '配备改良型连发劲弩的精锐射手，由战枢雷达实时提供弹道测算，命中极高。',
    createUnit: () => {
      const u = createBaseUnit(
        `sq_arb_${Date.now()}`,
        '神机弩卫·张扬',
        '百步穿杨',
        'squad_guard',
        UnitClass.Archer,
        4,
        { hp: 23, str: 10, mag: 0, skl: 13, spd: 10, lck: 8, def: 5, res: 3, con: 7, mov: 5 },
        { hp: 65, str: 55, mag: 0, skl: 70, spd: 55, lck: 50, def: 30, res: 30 },
        ['steel_bow', 'vulnerary'],
        { [WeaponType.Bow]: WeaponRank.C }
      );
      u.isDirectSquad = true;
      u.squadRole = '神机连弩';
      return u;
    },
  },
  {
    id: 'sq_ironclad',
    name: '重装陷阵铁卫',
    role: '铜墙铁壁',
    unitClass: UnitClass.Knight,
    costGold: 650,
    requiredRank: 4,
    description: '身负百斤重型鱼鳞冷锻甲的大盾卫士，专司抵御敌阵骑步冲锋，护卫战枢侧翼。',
    createUnit: () => {
      const u = createBaseUnit(
        `sq_iro_${Date.now()}`,
        '陷阵铁卫·李敢',
        '不动如山',
        'squad_guard',
        UnitClass.Knight,
        5,
        { hp: 32, str: 12, mag: 0, skl: 7, spd: 5, lck: 4, def: 14, res: 3, con: 15, mov: 4 },
        { hp: 90, str: 60, mag: 0, skl: 40, spd: 30, lck: 30, def: 65, res: 20 },
        ['iron_lance', 'javelin', 'vulnerary'],
        { [WeaponType.Lance]: WeaponRank.C }
      );
      u.isDirectSquad = true;
      u.squadRole = '陷阵重甲';
      return u;
    },
  },
  {
    id: 'sq_medic',
    name: '战地纳米医官',
    role: '战场后勤',
    unitClass: UnitClass.Cleric,
    costGold: 700,
    requiredRank: 5,
    description: '携带战枢配发的纳米凝胶与急救战法，兼修华佗五禽戏与科技医疗，保障全队存活。',
    createUnit: () => {
      const u = createBaseUnit(
        `sq_med_${Date.now()}`,
        '随军医官·陈济',
        '悬壶济世',
        'squad_guard',
        UnitClass.Cleric,
        5,
        { hp: 22, str: 2, mag: 10, skl: 8, spd: 8, lck: 10, def: 4, res: 11, con: 6, mov: 5 },
        { hp: 60, str: 10, mag: 65, skl: 50, spd: 50, lck: 60, def: 25, res: 70 },
        ['heal_staff', 'mend_staff', 'vulnerary'],
        { [WeaponType.Staff]: WeaponRank.C }
      );
      u.isDirectSquad = true;
      u.squadRole = '战地医官';
      return u;
    },
  },
];
