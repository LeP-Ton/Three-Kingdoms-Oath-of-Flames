/**
 * 三国志·烈火之誓 - 30 大关卡完整配置 (25 主线关 + 5 隐藏关)
 * 剧情严格遵循《三国演义》脉络与 GBA《火焰纹章》战役关卡设计
 */

import {
  StageConfig,
  VictoryCondition,
  TerrainType,
  UnitClass,
  Faction,
  WeaponType,
  WeaponRank,
  Unit,
} from '../types';
import { ITEMS_DATABASE } from './itemsData';
import { createBaseUnit } from './charactersData';

// 简便地形生成器
function generateGrid(
  width: number,
  height: number,
  defaultTerrain: TerrainType = TerrainType.Plains,
  features: { type: TerrainType; x: number; y: number; w?: number; h?: number }[] = []
): TerrainType[][] {
  const grid: TerrainType[][] = [];
  for (let y = 0; y < height; y++) {
    const row: TerrainType[] = [];
    for (let x = 0; x < width; x++) {
      row.push(defaultTerrain);
    }
    grid.push(row);
  }

  for (const f of features) {
    const w = f.w || 1;
    const h = f.h || 1;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const tx = f.x + dx;
        const ty = f.y + dy;
        if (ty >= 0 && ty < height && tx >= 0 && tx < width) {
          grid[ty][tx] = f.type;
        }
      }
    }
  }

  return grid;
}

// 敌军创建辅助器
function createEnemyUnit(
  id: string,
  name: string,
  title: string,
  portraitId: string,
  unitClass: UnitClass,
  level: number,
  x: number,
  y: number,
  weaponIds: string[],
  isBoss: boolean = false,
  aiType: 'attack' | 'guard' | 'boss' | 'healer' = 'attack'
): Unit {
  const hpBase = 18 + level * 2 + (isBoss ? 10 : 0);
  const strBase = 5 + Math.floor(level * 0.8) + (isBoss ? 4 : 0);
  const sklBase = 4 + Math.floor(level * 0.7);
  const spdBase = 4 + Math.floor(level * 0.7);
  const defBase = 3 + Math.floor(level * 0.6) + (isBoss ? 3 : 0);
  const resBase = 1 + Math.floor(level * 0.4);

  return {
    id,
    name,
    title,
    characterId: portraitId,
    faction: Faction.Enemy,
    unitClass,
    level,
    exp: 0,
    stats: {
      hp: hpBase,
      maxHp: hpBase,
      str: strBase,
      mag: Math.floor(level * 0.6),
      skl: sklBase,
      spd: spdBase,
      lck: 4 + Math.floor(level * 0.5),
      def: defBase,
      res: resBase,
      con: 8,
      mov: 5,
    },
    growths: { hp: 50, str: 40, mag: 20, skl: 40, spd: 40, lck: 30, def: 30, res: 20 },
    weaponRanks: { [WeaponType.Sword]: WeaponRank.D, [WeaponType.Lance]: WeaponRank.D, [WeaponType.Axe]: WeaponRank.D },
    inventory: weaponIds.map((wid) => ({ ...(ITEMS_DATABASE[wid] || ITEMS_DATABASE.iron_sword) })),
    equippedWeaponIndex: 0,
    x,
    y,
    hasActed: false,
    isAlive: true,
    portraitId,
    expression: isBoss ? 'angry' : 'normal',
    isBoss,
    aiType,
  };
}

export const ALL_STAGES: StageConfig[] = [
  // ==========================================
  // 第一章：黄巾起义 (1-1 至 1-5)
  // ==========================================
  {
    id: 'stage_1_1',
    chapterNumber: 1,
    stageNumber: 1,
    title: '第一章 第一关',
    subtitle: '涿县募兵',
    description: '苍天已死，黄天当立。幽州涿县贼众四起，少主与玄德招募义军，首战告捷。',
    mapWidth: 14,
    mapHeight: 12,
    terrainGrid: generateGrid(14, 12, TerrainType.Plains, [
      { type: TerrainType.Forest, x: 3, y: 2, w: 2, h: 2 },
      { type: TerrainType.Forest, x: 8, y: 7, w: 2, h: 2 },
      { type: TerrainType.Mountain, x: 0, y: 0, w: 2, h: 4 },
      { type: TerrainType.Mountain, x: 12, y: 8, w: 2, h: 4 },
      { type: TerrainType.Village, x: 7, y: 3 },
      { type: TerrainType.River, x: 5, y: 0, w: 1, h: 12 },
      { type: TerrainType.Bridge, x: 5, y: 6 },
    ]),
    playerSpawnPoints: [
      { x: 1, y: 6 },
      { x: 2, y: 5 },
      { x: 2, y: 7 },
      { x: 1, y: 4 },
    ],
    initialPlayerUnits: [], // 动态拉取初始队伍
    enemyUnits: [
      createEnemyUnit('e_1_1', '黄巾贼兵', '前锋', 'fighter', UnitClass.Fighter, 1, 7, 6, ['iron_axe']),
      createEnemyUnit('e_1_2', '黄巾贼兵', '长矛手', 'knight', UnitClass.Knight, 1, 9, 4, ['iron_lance']),
      createEnemyUnit('e_1_3', '黄巾剑徒', '斥候', 'swordmaster', UnitClass.Myrmidon, 1, 9, 8, ['iron_sword']),
      createEnemyUnit('e_boss_1', '邓茂', '黄巾小头目', 'boss', UnitClass.Fighter, 2, 11, 6, ['steel_axe'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Rout,
    bgmTheme: 'heroic',
    preBattleDialogue: [
      { speaker: 'liubei', speakerName: '刘备', portraitId: 'liubei', text: '天下大乱，盗贼蜂起。今逢壮士，愿与君共讨黄巾，安抚黎民！' },
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '皇叔仁德素著，我等誓死相随！前方黄巾贼众当道，先破其锋锐！' },
      { speaker: 'guanyu', speakerName: '关羽', portraitId: 'guanyu', text: '兄长勿忧！剑克斧、斧克枪、枪克剑。此乃兵家相克之道，看某取贼首脑！' },
    ],
    postBattleDialogue: [
      { speaker: 'zhangfei', speakerName: '张飞', portraitId: 'zhangfei', text: '哈哈！杀得痛快！这帮乌合之众，不堪某一矛之击！' },
      { speaker: 'liubei', speakerName: '刘备', portraitId: 'liubei', text: '首战虽捷，然黄巾主力尚在广宗，不可轻敌。速整军前行。' },
    ],
    events: [
      {
        trigger: 'visit_village',
        villageX: 7,
        villageY: 3,
        dialogue: [
          { speaker: 'villager', speakerName: '老丈', portraitId: 'cleric', text: '义军英雄救了俺们村！这瓶金创伤药请将军务必收下！' },
        ],
        rewardItem: ITEMS_DATABASE.vulnerary,
        rewardGold: 500,
      },
    ],
  },
  {
    id: 'stage_1_2',
    chapterNumber: 1,
    stageNumber: 2,
    title: '第一章 第二关',
    subtitle: '黄巾来袭',
    description: '黄巾贼党夜袭营寨，敌众我寡。利用森林与要塞的地形回避优势，坚守营地6回合！',
    mapWidth: 16,
    mapHeight: 12,
    terrainGrid: generateGrid(16, 12, TerrainType.Plains, [
      { type: TerrainType.Forest, x: 2, y: 3, w: 3, h: 4 },
      { type: TerrainType.Fort, x: 4, y: 5 },
      { type: TerrainType.Fort, x: 4, y: 7 },
      { type: TerrainType.Mountain, x: 0, y: 0, w: 16, h: 2 },
      { type: TerrainType.Mountain, x: 0, y: 10, w: 16, h: 2 },
    ]),
    playerSpawnPoints: [
      { x: 3, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 7 },
      { x: 4, y: 7 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_2_1', '黄巾先锋', '骑兵', 'cavalier', UnitClass.Cavalier, 2, 11, 4, ['iron_lance']),
      createEnemyUnit('e_2_2', '黄巾先锋', '斧兵', 'fighter', UnitClass.Fighter, 2, 11, 8, ['iron_axe']),
      createEnemyUnit('e_2_3', '黄巾弓手', '弓手', 'archer', UnitClass.Archer, 2, 13, 5, ['iron_bow']),
      createEnemyUnit('e_2_4', '黄巾弓手', '弓手', 'archer', UnitClass.Archer, 2, 13, 7, ['iron_bow']),
      createEnemyUnit('e_boss_2', '程远志', '黄巾别部司马', 'boss', UnitClass.Fighter, 3, 14, 6, ['steel_axe'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Survive,
    surviveTurns: 6,
    bgmTheme: 'battle',
    preBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '敌人趁夜偷袭！前有要塞与茂密树林，进可攻退可守！' },
      { speaker: 'guanyu', speakerName: '关羽', portraitId: 'guanyu', text: '入林避矢，据垒固防。林木可增二分回避，要塞能缓回气血！' },
    ],
    postBattleDialogue: [
      { speaker: 'liubei', speakerName: '刘备', portraitId: 'liubei', text: '贼军败走！守御严密，天佑义军！' },
    ],
    events: [],
  },
  {
    id: 'stage_1_3',
    chapterNumber: 1,
    stageNumber: 3,
    title: '第一章 第三关',
    subtitle: '广宗城外',
    description: '进抵冀州广宗！城外黄巾重兵集结，击破贼帅高升，肃清城外据点。',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Castle, x: 13, y: 6, w: 2, h: 2 },
      { type: TerrainType.Gate, x: 12, y: 6, w: 1, h: 2 },
      { type: TerrainType.River, x: 7, y: 0, w: 1, h: 14 },
      { type: TerrainType.Bridge, x: 7, y: 4 },
      { type: TerrainType.Bridge, x: 7, y: 9 },
      { type: TerrainType.Village, x: 3, y: 2 },
    ]),
    playerSpawnPoints: [
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 1, y: 9 },
      { x: 2, y: 9 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_3_1', '城防步兵', '长矛', 'knight', UnitClass.Knight, 3, 8, 4, ['iron_lance']),
      createEnemyUnit('e_3_2', '城防步兵', '长矛', 'knight', UnitClass.Knight, 3, 8, 9, ['iron_lance']),
      createEnemyUnit('e_3_3', '黄巾术士', '道童', 'cleric', UnitClass.Mage, 3, 10, 6, ['fire_tome']),
      createEnemyUnit('e_3_4', '黄巾铁骑', '突骑', 'cavalier', UnitClass.Cavalier, 3, 11, 3, ['steel_lance']),
      createEnemyUnit('e_boss_3', '高升', '黄巾大将', 'boss', UnitClass.General, 4, 13, 6, ['steel_lance', 'javelin'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'battle',
    preBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '越过护城河就是广宗城关！敌守将高升身披重甲，注意用破甲兵刃或法术破敌！' },
    ],
    postBattleDialogue: [
      { speaker: 'guanyu', speakerName: '关羽', portraitId: 'guanyu', text: '贼将伏诛！广宗门户已洞开！' },
    ],
    events: [
      {
        trigger: 'visit_village',
        villageX: 3,
        villageY: 2,
        dialogue: [{ speaker: 'villager', speakerName: '村中铁匠', portraitId: 'fighter', text: '义军大人们，这把破甲剑拿去斩断贼军铁铠！' }],
        rewardItem: ITEMS_DATABASE.armorslayer,
      },
    ],
  },
  {
    id: 'stage_1_4',
    chapterNumber: 1,
    stageNumber: 4,
    title: '第一章 第四关',
    subtitle: '夜袭粮仓',
    description: '深入敌后制压黄巾粮仓。注意角落的隐秘村落，或藏有旷世奇珍！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Forest, x: 3, y: 3, w: 3, h: 3 },
      { type: TerrainType.Fort, x: 13, y: 6 },
      { type: TerrainType.Village, x: 1, y: 1 }, // 隐藏村庄
      { type: TerrainType.Village, x: 13, y: 2 },
    ]),
    playerSpawnPoints: [
      { x: 2, y: 11 },
      { x: 3, y: 11 },
      { x: 2, y: 12 },
      { x: 3, y: 12 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_4_1', '守粮贼兵', '斧卫', 'fighter', UnitClass.Fighter, 4, 7, 7, ['steel_axe']),
      createEnemyUnit('e_4_2', '守粮贼兵', '弓手', 'archer', UnitClass.Archer, 4, 9, 5, ['steel_bow']),
      createEnemyUnit('e_4_3', '守粮法师', '道徒', 'cleric', UnitClass.Mage, 4, 11, 7, ['thunder_tome']),
      createEnemyUnit('e_boss_4', '管亥', '黄巾猛将', 'boss', UnitClass.Warrior, 5, 13, 6, ['killer_axe'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Seize,
    seizeTarget: { x: 13, y: 6 },
    bgmTheme: 'battle',
    preBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '制压中央粮仓要塞即可断绝贼军补给！西北隅似有隐秘古村，切莫遗漏。' },
    ],
    postBattleDialogue: [
      { speaker: 'liubei', speakerName: '刘备', portraitId: 'liubei', text: '粮仓既克，张角主力已陷绝境！' },
    ],
    events: [
      {
        trigger: 'visit_village',
        villageX: 1,
        villageY: 1,
        dialogue: [{ speaker: 'villager', speakerName: '世外隐士', portraitId: 'cleric', text: '年轻的主帅，黄天当衰，汉运当兴。这本《秘传之书》赠予你！' }],
        rewardItem: ITEMS_DATABASE.hero_crest,
        rewardGold: 1000,
      },
    ],
  },
  {
    id: 'stage_1_5',
    chapterNumber: 1,
    stageNumber: 5,
    title: '第一章 第五关',
    subtitle: '黄巾主力决战',
    description: '天公将军张角登坛作法，呼风唤雨！击破张角，终结黄巾之乱！',
    mapWidth: 18,
    mapHeight: 16,
    terrainGrid: generateGrid(18, 16, TerrainType.Plains, [
      { type: TerrainType.Throne, x: 15, y: 7 }, // 张角法坛
      { type: TerrainType.Mountain, x: 8, y: 0, w: 2, h: 5 },
      { type: TerrainType.Mountain, x: 8, y: 11, w: 2, h: 5 },
      { type: TerrainType.Forest, x: 5, y: 4, w: 2, h: 8 },
      { type: TerrainType.Fort, x: 12, y: 4 },
      { type: TerrainType.Fort, x: 12, y: 10 },
    ]),
    playerSpawnPoints: [
      { x: 1, y: 7 },
      { x: 2, y: 6 },
      { x: 2, y: 8 },
      { x: 1, y: 6 },
      { x: 1, y: 8 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_5_1', '黄巾铁骑', '护法', 'cavalier', UnitClass.Cavalier, 5, 8, 7, ['steel_lance']),
      createEnemyUnit('e_5_2', '黄巾狂徒', '斧王', 'fighter', UnitClass.Fighter, 5, 11, 4, ['steel_axe']),
      createEnemyUnit('e_5_3', '黄巾狂徒', '斧王', 'fighter', UnitClass.Fighter, 5, 11, 10, ['steel_axe']),
      createEnemyUnit('e_5_4', '黄巾道长', '雷法师', 'cleric', UnitClass.Mage, 6, 13, 6, ['thunder_tome']),
      createEnemyUnit('e_5_5', '张梁', '人公将军', 'fighter', UnitClass.Warrior, 6, 13, 8, ['steel_axe', 'hand_axe'], true, 'boss'),
      createEnemyUnit('e_boss_zhangjiao', '张角', '天公将军', 'zhangjiao', UnitClass.Sage, 7, 15, 7, ['taiping_secret', 'lightning_tome'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'boss',
    preBattleDialogue: [
      { speaker: 'zhangjiao', speakerName: '张角', portraitId: 'zhangjiao', text: '汉室气数已尽！贫道奉九天太上之命，施符布雨，逆我者死！' },
      { speaker: 'liubei', speakerName: '刘备', portraitId: 'liubei', text: '以妖言惑众，涂炭生灵！今日便是你伏法之时！' },
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '张角法力滔天，魔防极高，诸将奋力突围，斩其帅旗！' },
    ],
    postBattleDialogue: [
      { speaker: 'zhangjiao', speakerName: '张角', portraitId: 'zhangjiao', text: '天意……难道黄天亦不能代汉乎……！' },
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '黄巾祸乱已平！然而董卓进京废立，这天下……大乱才刚刚开始！' },
    ],
    events: [],
  },

  // ==========================================
  // 第二章：群雄逐鹿 (2-1 至 2-5)
  // ==========================================
  {
    id: 'stage_2_1',
    chapterNumber: 2,
    stageNumber: 1,
    title: '第二章 第一关',
    subtitle: '虎牢关前',
    description: '十八路诸侯讨董！虎牢关前温侯吕布一人独当万军。在此关只需坚持8回合，万不可轻犯其锋！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Gate, x: 14, y: 6, w: 2, h: 2 },
      { type: TerrainType.Mountain, x: 12, y: 0, w: 4, h: 5 },
      { type: TerrainType.Mountain, x: 12, y: 9, w: 4, h: 5 },
      { type: TerrainType.Fort, x: 6, y: 4 },
      { type: TerrainType.Fort, x: 6, y: 9 },
    ]),
    playerSpawnPoints: [
      { x: 1, y: 6 },
      { x: 2, y: 5 },
      { x: 2, y: 7 },
      { x: 1, y: 5 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_21_1', '西凉铁骑', '先锋', 'cavalier', UnitClass.Cavalier, 6, 8, 5, ['steel_lance']),
      createEnemyUnit('e_21_2', '西凉铁骑', '先锋', 'cavalier', UnitClass.Cavalier, 6, 8, 7, ['steel_lance']),
      createEnemyUnit('e_21_3', '西凉飞熊军', '重甲', 'knight', UnitClass.Knight, 6, 10, 6, ['steel_lance']),
      // 吕布本尊 (极高属性神将，在此关作为不可逾越之障碍)
      createEnemyUnit('e_boss_lubu', '吕布', '温侯飞将', 'lubu', UnitClass.Warlord, 15, 13, 6, ['fangtian_halberd'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Survive,
    surviveTurns: 6,
    bgmTheme: 'crisis',
    preBattleDialogue: [
      { speaker: 'lubu', speakerName: '吕布', portraitId: 'lubu', text: '关东鼠辈！谁敢与我吕奉先决一死战！' },
      { speaker: 'zhangfei', speakerName: '张飞', portraitId: 'zhangfei', text: '三姓家奴休得猖狂！燕人张翼德在此！' },
      { speaker: 'liubei', speakerName: '刘备', portraitId: 'liubei', text: '二弟三弟，吕布英勇非凡，不可意气用事，守住阵线即可！' },
    ],
    postBattleDialogue: [
      { speaker: 'lubu', speakerName: '吕布', portraitId: 'lubu', text: '哼，算尔等命大！西凉军，回关！' },
    ],
    events: [],
  },
  {
    id: 'stage_2_2',
    chapterNumber: 2,
    stageNumber: 2,
    title: '第二章 第二关',
    subtitle: '界桥之战',
    description: '公孙瓒与袁绍争雄磐河！常山赵子龙单骑救主，展现弓骑兵配合作战的极致！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.River, x: 0, y: 7, w: 16, h: 2 },
      { type: TerrainType.Bridge, x: 7, y: 7, w: 2, h: 2 },
      { type: TerrainType.Forest, x: 3, y: 2, w: 3, h: 3 },
      { type: TerrainType.Forest, x: 10, y: 10, w: 3, h: 3 },
    ]),
    playerSpawnPoints: [
      { x: 7, y: 11 },
      { x: 6, y: 12 },
      { x: 8, y: 12 },
      { x: 7, y: 13 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_22_1', '河北大戟士', '精锐', 'knight', UnitClass.Knight, 7, 7, 4, ['steel_lance']),
      createEnemyUnit('e_22_2', '先登死士', '神射', 'archer', UnitClass.Archer, 7, 5, 3, ['steel_bow']),
      createEnemyUnit('e_22_3', '先登死士', '神射', 'archer', UnitClass.Archer, 7, 9, 3, ['steel_bow']),
      createEnemyUnit('e_boss_wenchou', '文丑', '河北名将', 'boss', UnitClass.Paladin, 8, 7, 2, ['killer_lance'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Rout,
    bgmTheme: 'battle',
    preBattleDialogue: [
      { speaker: 'zhaoyun', speakerName: '赵云', portraitId: 'zhaoyun', text: '某乃常山赵子龙！今日见玄德公仁义，愿为先锋破敌！' },
      { speaker: 'liubei', speakerName: '刘备', portraitId: 'liubei', text: '得子龙相助，如虎添翼！诸军压过界桥！' },
    ],
    postBattleDialogue: [
      { speaker: 'zhaoyun', speakerName: '赵云', portraitId: 'zhaoyun', text: '贼将退避，河北军溃散矣！愿一生效命于主公账下！' },
    ],
    events: [],
  },
  {
    id: 'stage_2_3',
    chapterNumber: 2,
    stageNumber: 3,
    title: '第二章 第三关',
    subtitle: '宛城之夜',
    description: '张绣夜袭曹营，四面伏兵突起！掩护主帅突破重围，逃至脱出地点！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Fire, x: 4, y: 4, w: 2, h: 2 },
      { type: TerrainType.Fire, x: 9, y: 8, w: 2, h: 2 },
      { type: TerrainType.Gate, x: 15, y: 6 }, // 逃脱点
      { type: TerrainType.Forest, x: 1, y: 8, w: 3, h: 3 },
    ]),
    playerSpawnPoints: [
      { x: 1, y: 6 },
      { x: 2, y: 5 },
      { x: 2, y: 7 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_23_1', '宛城精兵', '伏兵', 'fighter', UnitClass.Fighter, 7, 6, 4, ['steel_axe']),
      createEnemyUnit('e_23_2', '宛城精兵', '伏兵', 'cavalier', UnitClass.Cavalier, 7, 6, 8, ['steel_lance']),
      createEnemyUnit('e_23_3', '宛城刺客', '暗袭', 'thief', UnitClass.Thief, 8, 10, 6, ['killing_edge']),
      createEnemyUnit('e_boss_zhangxiu', '张绣', '北地枪王', 'boss', UnitClass.Paladin, 9, 13, 6, ['killer_lance'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Escape,
    escapeTarget: { x: 15, y: 6 },
    bgmTheme: 'crisis',
    preBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '贾诩用计深远，营中起火，伏兵无数！全员杀出一条血路，往东面关隘突围！' },
    ],
    postBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '呼……终于摆脱了宛城追兵！' },
    ],
    events: [],
  },
  {
    id: 'stage_2_4',
    chapterNumber: 2,
    stageNumber: 4,
    title: '第二章 第四关',
    subtitle: '下邳围城',
    description: '决水淹下邳！城池浸水，水攻后部分平原化为浅水，骑兵受阻，唯步兵与飞将方能进退自如！制压城门！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.River, x: 0, y: 4, w: 16, h: 3 }, // 水浸区
      { type: TerrainType.Castle, x: 12, y: 8, w: 3, h: 3 },
      { type: TerrainType.Gate, x: 11, y: 9 },
    ]),
    playerSpawnPoints: [
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_24_1', '陷阵营', '重步', 'knight', UnitClass.General, 9, 8, 8, ['steel_lance']),
      createEnemyUnit('e_24_2', '并州飞骑', '骑手', 'cavalier', UnitClass.Cavalier, 9, 6, 10, ['steel_sword']),
      createEnemyUnit('e_boss_gaoshun', '高顺', '陷阵营统领', 'boss', UnitClass.General, 10, 11, 9, ['silver_lance'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Seize,
    seizeTarget: { x: 11, y: 9 },
    bgmTheme: 'battle',
    preBattleDialogue: [
      { speaker: 'guanyu', speakerName: '关羽', portraitId: 'guanyu', text: '水淹下邳，吕布已成瓮中之鳖。高顺陷阵营忠义刚烈，小心其重戟破阵！' },
    ],
    postBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '下邳已克！吕布退守白门楼！' },
    ],
    events: [],
  },
  {
    id: 'stage_2_5',
    chapterNumber: 2,
    stageNumber: 5,
    title: '第二章 第五关',
    subtitle: '白门楼',
    description: '终局对决！温侯吕布身陷重围，战意滔天！击破吕布，或达成特殊条件将其说服！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Throne, x: 13, y: 6 },
      { type: TerrainType.Wall, x: 10, y: 2, w: 1, h: 10 },
      { type: TerrainType.Gate, x: 10, y: 6 },
      { type: TerrainType.Fort, x: 6, y: 3 },
      { type: TerrainType.Fort, x: 6, y: 9 },
    ]),
    playerSpawnPoints: [
      { x: 1, y: 6 },
      { x: 2, y: 5 },
      { x: 2, y: 7 },
      { x: 1, y: 5 },
      { x: 1, y: 7 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_25_1', '并州骁骑', '突骑', 'cavalier', UnitClass.Paladin, 10, 7, 4, ['silver_lance']),
      createEnemyUnit('e_25_2', '并州骁骑', '突骑', 'cavalier', UnitClass.Paladin, 10, 7, 8, ['silver_lance']),
      createEnemyUnit('e_25_3', '白门死士', '剑圣', 'swordmaster', UnitClass.Swordmaster, 10, 9, 6, ['killing_edge']),
      createEnemyUnit('e_boss_lubu_final', '吕布', '天下无双', 'lubu', UnitClass.Warlord, 12, 13, 6, ['fangtian_halberd'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'boss',
    preBattleDialogue: [
      { speaker: 'lubu', speakerName: '吕布', portraitId: 'lubu', text: '大耳贼！大丈夫生居天地间，岂能郁郁久居人下！今日谁能阻我！' },
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '温侯神勇，若能弃暗投明，随我匡扶社稷，岂不胜过丧身于此！' },
    ],
    postBattleDialogue: [
      { speaker: 'lubu', speakerName: '吕布', portraitId: 'lubu', text: '好武艺……我吕奉先一生唯服真正英雄……！' },
      { speaker: 'liubei', speakerName: '刘备', portraitId: 'liubei', text: '一代虓虎，终落白门楼。然天下群雄并起，赤壁风云又将至！' },
    ],
    events: [],
  },

  // ==========================================
  // 第三章：赤壁之战 (3-1 至 3-5)
  // ==========================================
  {
    id: 'stage_3_1',
    chapterNumber: 3,
    stageNumber: 1,
    title: '第三章 第一关',
    subtitle: '长坂坡',
    description: '曹操八十万大军南下！当阳长坂坡，赵子龙单骑救幼主，张翼德据水断桥！护送平民脱出！',
    mapWidth: 18,
    mapHeight: 14,
    terrainGrid: generateGrid(18, 14, TerrainType.Plains, [
      { type: TerrainType.River, x: 8, y: 0, w: 2, h: 14 },
      { type: TerrainType.Bridge, x: 8, y: 6, w: 2, h: 2 },
      { type: TerrainType.Forest, x: 4, y: 2, w: 3, h: 4 },
      { type: TerrainType.Forest, x: 4, y: 8, w: 3, h: 4 },
    ]),
    playerSpawnPoints: [
      { x: 3, y: 6 },
      { x: 4, y: 5 },
      { x: 4, y: 7 },
      { x: 2, y: 6 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_31_1', '虎豹骑', '曹魏精骑', 'cavalier', UnitClass.Paladin, 11, 13, 4, ['silver_lance']),
      createEnemyUnit('e_31_2', '虎豹骑', '曹魏精骑', 'cavalier', UnitClass.Paladin, 11, 13, 8, ['silver_lance']),
      createEnemyUnit('e_31_3', '曹军重装弩手', '弩卫', 'archer', UnitClass.Sniper, 11, 15, 6, ['steel_bow']),
      createEnemyUnit('e_boss_caochun', '曹纯', '虎豹骑统领', 'boss', UnitClass.Paladin, 12, 16, 6, ['silver_lance', 'javelin'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Survive,
    surviveTurns: 6,
    bgmTheme: 'crisis',
    preBattleDialogue: [
      { speaker: 'zhangfei', speakerName: '张飞', portraitId: 'zhangfei', text: '我乃燕人张翼德也！谁敢与我决一死战？！当阳桥头，看谁敢近前半步！' },
      { speaker: 'zhaoyun', speakerName: '赵云', portraitId: 'zhaoyun', text: '怀抱阿斗，誓死突出重围！' },
    ],
    postBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '赵将军忠肝义胆，翼德声如巨雷，曹军退走，速速前往江夏！' },
    ],
    events: [],
  },
  {
    id: 'stage_3_2',
    chapterNumber: 3,
    stageNumber: 2,
    title: '第三章 第二关',
    subtitle: '江夏集结',
    description: '诸葛孔明联吴抗曹，诸葛亮正式加入军中！扫荡江夏城外曹魏探马。',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Castle, x: 2, y: 6, w: 2, h: 2 },
      { type: TerrainType.River, x: 10, y: 0, w: 2, h: 14 },
      { type: TerrainType.Bridge, x: 10, y: 6, w: 2, h: 2 },
    ]),
    playerSpawnPoints: [
      { x: 3, y: 6 },
      { x: 2, y: 5 },
      { x: 2, y: 7 },
      { x: 1, y: 6 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_32_1', '曹魏先锋骑', '精骑', 'cavalier', UnitClass.Paladin, 12, 12, 4, ['silver_lance']),
      createEnemyUnit('e_32_2', '曹魏步军', '大刀队', 'fighter', UnitClass.Warrior, 12, 12, 8, ['silver_axe']),
      createEnemyUnit('e_32_3', '曹魏策士', '军师', 'cleric', UnitClass.Sage, 12, 14, 6, ['thunder_tome']),
      createEnemyUnit('e_boss_wenpin', '文聘', '荆州大将', 'boss', UnitClass.General, 13, 15, 6, ['silver_lance'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Rout,
    bgmTheme: 'heroic',
    preBattleDialogue: [
      { speaker: 'zhugeliang', speakerName: '诸葛亮', portraitId: 'zhugeliang', text: '亮不才，蒙皇叔三顾茅庐。曹贼虽众，然人心不服，水土不伏，必破之！' },
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '有军师在此，三军振奋！全军出击！' },
    ],
    postBattleDialogue: [
      { speaker: 'zhugeliang', speakerName: '诸葛亮', portraitId: 'zhugeliang', text: '此战告捷，亮当亲往江东，说服孙权共同拒曹！' },
    ],
    events: [],
  },
  {
    id: 'stage_3_3',
    chapterNumber: 3,
    stageNumber: 3,
    title: '第三章 第三关',
    subtitle: '舌战群儒',
    description: '诸葛亮柴桑舌战东吴谋士！以法术与口才破除江东群儒阵线，赢得孙权联盟！',
    mapWidth: 16,
    mapHeight: 12,
    terrainGrid: generateGrid(16, 12, TerrainType.Plains, [
      { type: TerrainType.Throne, x: 14, y: 5 },
      { type: TerrainType.Fort, x: 8, y: 3 },
      { type: TerrainType.Fort, x: 8, y: 7 },
    ]),
    playerSpawnPoints: [
      { x: 1, y: 5 },
      { x: 2, y: 4 },
      { x: 2, y: 6 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_33_1', '张昭辩徒', '策士', 'cleric', UnitClass.Sage, 12, 6, 3, ['lightning_tome']),
      createEnemyUnit('e_33_2', '虞翻辩徒', '策士', 'cleric', UnitClass.Sage, 12, 6, 7, ['fire_tome']),
      createEnemyUnit('e_boss_zhangzhao', '张昭', '东吴重臣', 'boss', UnitClass.Sage, 13, 14, 5, ['lightning_tome', 'mend_staff'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'chinese',
    preBattleDialogue: [
      { speaker: 'zhugeliang', speakerName: '诸葛亮', portraitId: 'zhugeliang', text: '儒者有君子之儒，有小人之儒。今曹操以百万之众虎视江南，诸公何以一味主和！' },
      { speaker: 'zhouyu', speakerName: '周瑜', portraitId: 'zhouyu', text: '好一个孔明先生！瑜亦决意抗曹，愿与使君结同盟之好！' },
    ],
    postBattleDialogue: [
      { speaker: 'zhouyu', speakerName: '周瑜', portraitId: 'zhouyu', text: '东吴水师即日调发，赤壁一决雌雄！' },
    ],
    events: [],
  },
  {
    id: 'stage_3_4',
    chapterNumber: 3,
    stageNumber: 4,
    title: '第三章 第四关',
    subtitle: '草船借箭',
    description: '大雾漫江，孔明草船借箭！在浓雾视野受限的环境下，收集曹营十万支雕翎箭！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.River, [
      { type: TerrainType.Bridge, x: 4, y: 2, w: 8, h: 2 }, // 草船木舟
      { type: TerrainType.Bridge, x: 4, y: 6, w: 8, h: 2 },
      { type: TerrainType.Bridge, x: 4, y: 10, w: 8, h: 2 },
      { type: TerrainType.Castle, x: 14, y: 5, w: 2, h: 4 }, // 曹军水寨
    ]),
    playerSpawnPoints: [
      { x: 4, y: 3 },
      { x: 5, y: 3 },
      { x: 4, y: 7 },
      { x: 5, y: 7 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_34_1', '曹军水寨弓手', '连弩', 'archer', UnitClass.Sniper, 13, 13, 3, ['steel_bow']),
      createEnemyUnit('e_34_2', '曹军水寨弓手', '连弩', 'archer', UnitClass.Sniper, 13, 13, 7, ['steel_bow']),
      createEnemyUnit('e_34_3', '曹军水寨弓手', '连弩', 'archer', UnitClass.Sniper, 13, 13, 11, ['steel_bow']),
      createEnemyUnit('e_boss_caoren', '曹仁', '征南大将军', 'caoren', UnitClass.General, 14, 15, 7, ['silver_lance', 'steel_bow'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Survive,
    surviveTurns: 6,
    bgmTheme: 'battle',
    preBattleDialogue: [
      { speaker: 'zhugeliang', speakerName: '诸葛亮', portraitId: 'zhugeliang', text: '江上大雾垂江，曹操多疑必不敢出，只遣弓弩乱射。擂鼓呐喊，引箭自来！' },
    ],
    postBattleDialogue: [
      { speaker: 'zhugeliang', speakerName: '诸葛亮', portraitId: 'zhugeliang', text: '哈哈！谢曹丞相赐箭十万有余！周都督无话可说了。' },
    ],
    events: [],
  },
  {
    id: 'stage_3_5',
    chapterNumber: 3,
    stageNumber: 5,
    title: '第三章 第五关',
    subtitle: '火烧赤壁',
    description: '东风已至，烈焰腾空！铁索连环的八十万曹军水寨化为火海！击破曹丞相本阵！',
    mapWidth: 18,
    mapHeight: 16,
    terrainGrid: generateGrid(18, 16, TerrainType.River, [
      { type: TerrainType.Bridge, x: 0, y: 4, w: 18, h: 8 }, // 连环大船
      { type: TerrainType.Fire, x: 4, y: 5, w: 3, h: 2 },
      { type: TerrainType.Fire, x: 8, y: 7, w: 4, h: 2 },
      { type: TerrainType.Fire, x: 12, y: 5, w: 2, h: 2 },
      { type: TerrainType.Throne, x: 16, y: 8 }, // 曹操帅台
    ]),
    playerSpawnPoints: [
      { x: 1, y: 7 },
      { x: 2, y: 6 },
      { x: 2, y: 8 },
      { x: 1, y: 8 },
      { x: 1, y: 9 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_35_1', '魏军近卫', '铁卫', 'knight', UnitClass.General, 13, 10, 6, ['silver_lance']),
      createEnemyUnit('e_35_2', '魏军骁将', '圣骑', 'cavalier', UnitClass.Paladin, 13, 10, 10, ['silver_sword']),
      createEnemyUnit('e_35_3', '张辽', '威震逍遥津', 'zhangliao', UnitClass.Paladin, 14, 13, 8, ['killer_lance']),
      createEnemyUnit('e_boss_caocao', '曹操', '魏武帝', 'caocao', UnitClass.GreatLord, 15, 16, 8, ['qinggang_sword', 'elixir'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'boss',
    preBattleDialogue: [
      { speaker: 'zhouyu', speakerName: '周瑜', portraitId: 'zhouyu', text: '羽扇纶巾，谈笑间，樯橹灰飞烟灭！曹孟德，今日便是你的末日！' },
      { speaker: 'caocao', speakerName: '曹操', portraitId: 'caocao', text: '赤壁烈火虽炽，岂能焚尽我曹操荡平天下之志！全军迎敌！' },
    ],
    postBattleDialogue: [
      { speaker: 'caocao', speakerName: '曹操', portraitId: 'caocao', text: '天下三分……终不可逆乎……！撤军华容道！' },
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '赤壁大捷！曹军远遁江北，三国鼎立之势已成！' },
    ],
    events: [],
  },

  // ==========================================
  // 第四章：三足鼎立 (4-1 至 4-5)
  // ==========================================
  {
    id: 'stage_4_1',
    chapterNumber: 4,
    stageNumber: 1,
    title: '第四章 第一关',
    subtitle: '荆州争夺',
    description: '三家逐鹿荆楚大地！刘备借得荆州，各据城池要塞。制压中央南郡！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Castle, x: 8, y: 6, w: 2, h: 2 },
      { type: TerrainType.Gate, x: 7, y: 6 },
      { type: TerrainType.River, x: 0, y: 10, w: 16, h: 2 },
      { type: TerrainType.Bridge, x: 8, y: 10, w: 2, h: 2 },
    ]),
    playerSpawnPoints: [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_41_1', '曹仁部曲', '铁卫', 'knight', UnitClass.General, 13, 8, 5, ['silver_lance']),
      createEnemyUnit('e_41_2', '曹仁部曲', '勇士', 'fighter', UnitClass.Warrior, 13, 10, 5, ['silver_axe']),
      createEnemyUnit('e_boss_caoren_jingzhou', '曹仁', '征南大将', 'caoren', UnitClass.General, 14, 8, 6, ['silver_lance'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Seize,
    seizeTarget: { x: 8, y: 6 },
    bgmTheme: 'battle',
    preBattleDialogue: [
      { speaker: 'guanyu', speakerName: '关羽', portraitId: 'guanyu', text: '荆襄九郡，乃兵家必争之地。今日誓取南郡！' },
    ],
    postBattleDialogue: [
      { speaker: 'liubei', speakerName: '刘备', portraitId: 'liubei', text: '荆州既定，进可西取益州，北定中原！' },
    ],
    events: [],
  },
  {
    id: 'stage_4_2',
    chapterNumber: 4,
    stageNumber: 2,
    title: '第四章 第二关',
    subtitle: '汉中攻防',
    description: '定军山下，老将黄忠力斩夏侯渊！在极其险峻的高山关隘中坚守定军山阵地！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Mountain, [
      { type: TerrainType.Plains, x: 2, y: 2, w: 12, h: 10 },
      { type: TerrainType.Fort, x: 5, y: 6 },
      { type: TerrainType.Fort, x: 10, y: 6 },
      { type: TerrainType.Peak, x: 0, y: 0, w: 16, h: 2 },
    ]),
    playerSpawnPoints: [
      { x: 4, y: 6 },
      { x: 5, y: 6 },
      { x: 4, y: 7 },
      { x: 5, y: 7 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_42_1', '魏国山地轻骑', '骑将', 'cavalier', UnitClass.Paladin, 14, 11, 4, ['silver_lance']),
      createEnemyUnit('e_42_2', '魏国神射手', '狙击', 'archer', UnitClass.Sniper, 14, 11, 8, ['steel_bow']),
      createEnemyUnit('e_boss_xiahouyuan', '夏侯渊', '妙才虎步关右', 'xiahouyuan', UnitClass.Paladin, 15, 13, 6, ['silver_lance', 'killer_bow'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Survive,
    surviveTurns: 6,
    bgmTheme: 'battle',
    preBattleDialogue: [
      { speaker: 'huangzhong', speakerName: '黄忠', portraitId: 'huangzhong', text: '老夫虽白首，此弓尚能穿石！今日教夏侯渊识我黄汉升神箭！' },
    ],
    postBattleDialogue: [
      { speaker: 'huangzhong', speakerName: '黄忠', portraitId: 'huangzhong', text: '定军山大胜！汉中王气象已成！' },
    ],
    events: [],
  },
  {
    id: 'stage_4_3',
    chapterNumber: 4,
    stageNumber: 3,
    title: '第四章 第三关',
    subtitle: '合肥之战',
    description: '张辽八百破十万，威震逍遥津！迎击全面强化、战力惊人的合肥守将张辽！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Bridge, x: 6, y: 6, w: 4, h: 2 },
      { type: TerrainType.River, x: 0, y: 5, w: 16, h: 4 },
      { type: TerrainType.Castle, x: 13, y: 6, w: 2, h: 2 },
    ]),
    playerSpawnPoints: [
      { x: 2, y: 6 },
      { x: 1, y: 5 },
      { x: 1, y: 7 },
      { x: 2, y: 7 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_43_1', '并州精锐铁骑', '突骑', 'cavalier', UnitClass.Paladin, 15, 9, 5, ['silver_lance']),
      createEnemyUnit('e_43_2', '合肥铁甲卫', '巨铠', 'knight', UnitClass.General, 15, 9, 7, ['silver_lance']),
      createEnemyUnit('e_boss_zhangliao_hefei', '张辽', '逍遥津战神', 'zhangliao', UnitClass.Paladin, 16, 13, 6, ['silver_lance', 'killer_axe', 'elixir'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'boss',
    preBattleDialogue: [
      { speaker: 'zhangliao', speakerName: '张辽', portraitId: 'zhangliao', text: '辽在此，东吴鼠辈谁敢渡桥一步！' },
      { speaker: 'ganning', speakerName: '甘宁', portraitId: 'ganning', text: '孟德有张辽，孤有甘兴霸！看我锦帆飞贼破阵！' },
    ],
    postBattleDialogue: [
      { speaker: 'zhangliao', speakerName: '张辽', portraitId: 'zhangliao', text: '好身手……今日棋逢对手，痛快！' },
    ],
    events: [],
  },
  {
    id: 'stage_4_4',
    chapterNumber: 4,
    stageNumber: 4,
    title: '第四章 第四关',
    subtitle: '夷陵之火',
    description: '陆逊火烧连营七百里！战局逆转，烈火封路，少主与诸将保护先主退往白帝城！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Fire, x: 4, y: 2, w: 4, h: 10 },
      { type: TerrainType.Gate, x: 15, y: 6 }, // 白帝城逃脱口
      { type: TerrainType.Forest, x: 10, y: 3, w: 3, h: 8 },
    ]),
    playerSpawnPoints: [
      { x: 1, y: 6 },
      { x: 2, y: 5 },
      { x: 2, y: 7 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_44_1', '东吴解烦兵', '轻骑', 'cavalier', UnitClass.Paladin, 15, 8, 4, ['silver_lance']),
      createEnemyUnit('e_44_2', '东吴水陆步兵', '锐士', 'swordmaster', UnitClass.Swordmaster, 15, 8, 8, ['silver_sword']),
      createEnemyUnit('e_boss_luxun', '陆逊', '儒将都督', 'luxun', UnitClass.Sage, 16, 12, 6, ['fire_tome', 'mend_staff'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Escape,
    escapeTarget: { x: 15, y: 6 },
    bgmTheme: 'crisis',
    preBattleDialogue: [
      { speaker: 'liubei', speakerName: '刘备', portraitId: 'liubei', text: '朕不听丞相之言，以致连营尽焚……悔之莫及！' },
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '陛下快走！我等断后，退入白帝城借八阵图阻敌！' },
    ],
    postBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '终于脱险进入白帝城……' },
    ],
    events: [],
  },
  {
    id: 'stage_4_5',
    chapterNumber: 4,
    stageNumber: 5,
    title: '第四章 第五关',
    subtitle: '白帝城托孤',
    description: '白帝托孤，鞠躬尽瘁。击退追击的陆逊前锋，继承先主义气！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Throne, x: 3, y: 6 }, // 白帝宫
      { type: TerrainType.Castle, x: 2, y: 5, w: 3, h: 3 },
      { type: TerrainType.Mountain, x: 0, y: 0, w: 16, h: 2 },
      { type: TerrainType.Mountain, x: 0, y: 12, w: 16, h: 2 },
    ]),
    playerSpawnPoints: [
      { x: 3, y: 6 },
      { x: 4, y: 5 },
      { x: 4, y: 7 },
      { x: 5, y: 6 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_45_1', '东吴大将', '勇将', 'fighter', UnitClass.Warrior, 16, 11, 4, ['silver_axe']),
      createEnemyUnit('e_45_2', '东吴铁甲', '护军', 'knight', UnitClass.General, 16, 11, 8, ['silver_lance']),
      createEnemyUnit('e_boss_zhuran', '朱然', '江东骁将', 'boss', UnitClass.Paladin, 16, 13, 6, ['silver_lance'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'heroic',
    preBattleDialogue: [
      { speaker: 'zhugeliang', speakerName: '诸葛亮', portraitId: 'zhugeliang', text: '先帝托孤，臣安敢不竭股肱之力，效忠贞之节，继之以死乎！' },
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '愿随丞相北伐中原，复兴汉室！' },
    ],
    postBattleDialogue: [
      { speaker: 'zhugeliang', speakerName: '诸葛亮', portraitId: 'zhugeliang', text: '吴蜀修好，天下归一的最后决战……便在关陇天险！' },
    ],
    events: [],
  },

  // ==========================================
  // 第五章：三分归一 (5-1 至 5-5)
  // ==========================================
  {
    id: 'stage_5_1',
    chapterNumber: 5,
    stageNumber: 1,
    title: '第五章 第一关',
    subtitle: '剑阁天险',
    description: '一夫当关，万夫莫开！姜维据守剑阁栈道，制压魏军关塞！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Mountain, [
      { type: TerrainType.Plains, x: 0, y: 6, w: 16, h: 2 }, // 唯一狭长栈道
      { type: TerrainType.Gate, x: 13, y: 6, w: 2, h: 2 },
    ]),
    playerSpawnPoints: [
      { x: 1, y: 6 },
      { x: 1, y: 7 },
      { x: 2, y: 6 },
      { x: 2, y: 7 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_51_1', '魏国铁骑', '关防', 'cavalier', UnitClass.Paladin, 17, 9, 6, ['silver_lance']),
      createEnemyUnit('e_51_2', '魏国神弩手', '狙击', 'archer', UnitClass.Sniper, 17, 11, 6, ['longbow']),
      createEnemyUnit('e_boss_zhonghui', '钟会', '镇西将军', 'boss', UnitClass.General, 18, 14, 6, ['silver_lance'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Seize,
    seizeTarget: { x: 13, y: 6 },
    bgmTheme: 'battle',
    preBattleDialogue: [
      { speaker: 'jiangwei', speakerName: '姜维', portraitId: 'jiangwei', text: '剑阁栈道险峻，我等誓保蜀道不失！' },
    ],
    postBattleDialogue: [
      { speaker: 'jiangwei', speakerName: '姜维', portraitId: 'jiangwei', text: '剑阁已定！然而听闻邓艾潜越阴平小道，大事不妙！' },
    ],
    events: [],
  },
  {
    id: 'stage_5_2',
    chapterNumber: 5,
    stageNumber: 2,
    title: '第五章 第二关',
    subtitle: '邓艾偷渡',
    description: '邓艾裹毡滚崖，奇兵出阴平！敌军自后方包抄而来，坚守大营迎接增援！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Mountain, x: 0, y: 0, w: 4, h: 14 },
      { type: TerrainType.Fort, x: 10, y: 6 },
    ]),
    playerSpawnPoints: [
      { x: 10, y: 6 },
      { x: 9, y: 5 },
      { x: 9, y: 7 },
      { x: 11, y: 6 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_52_1', '阴平奇兵', '死士', 'swordmaster', UnitClass.Swordmaster, 18, 5, 4, ['silver_sword']),
      createEnemyUnit('e_52_2', '阴平奇兵', '死士', 'swordmaster', UnitClass.Swordmaster, 18, 5, 8, ['silver_sword']),
      createEnemyUnit('e_boss_dengai', '邓艾', '征西名将', 'boss', UnitClass.Paladin, 19, 4, 6, ['silver_lance', 'elixir'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Survive,
    surviveTurns: 6,
    bgmTheme: 'crisis',
    preBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '邓艾当真奇谋用兵！自绝壁而降！诸将速速列阵迎敌！' },
    ],
    postBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '险胜奇兵！速回成都固守！' },
    ],
    events: [],
  },
  {
    id: 'stage_5_3',
    chapterNumber: 5,
    stageNumber: 3,
    title: '第五章 第三关',
    subtitle: '成都攻防',
    description: '成都外城保卫战！多波敌军精锐狂攻，全歼来犯敌军！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Castle, x: 2, y: 5, w: 4, h: 4 },
      { type: TerrainType.River, x: 10, y: 0, w: 2, h: 14 },
      { type: TerrainType.Bridge, x: 10, y: 6, w: 2, h: 2 },
    ]),
    playerSpawnPoints: [
      { x: 3, y: 6 },
      { x: 4, y: 6 },
      { x: 3, y: 7 },
      { x: 4, y: 7 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_53_1', '晋魏中军', '圣骑', 'cavalier', UnitClass.Paladin, 18, 13, 4, ['silver_lance']),
      createEnemyUnit('e_53_2', '晋魏中军', '勇士', 'fighter', UnitClass.Warrior, 18, 13, 8, ['silver_axe']),
      createEnemyUnit('e_53_3', '晋魏近卫', '将军', 'knight', UnitClass.General, 19, 11, 6, ['silver_lance']),
      createEnemyUnit('e_boss_simazhao', '司马昭', '晋王', 'boss', UnitClass.GreatLord, 19, 14, 6, ['silver_sword'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.Rout,
    bgmTheme: 'battle',
    preBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '此战关乎汉祚存亡！人在城在，绝不退后半步！' },
    ],
    postBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '成都守住了！北伐终局将至！' },
    ],
    events: [],
  },
  {
    id: 'stage_5_4',
    chapterNumber: 5,
    stageNumber: 4,
    title: '第五章 第四关',
    subtitle: '最后的名将',
    description: '进抵洛阳关前！晋国集结天下最后之猛将名臣布阵，势要决出真龙！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Fort, x: 6, y: 4 },
      { type: TerrainType.Fort, x: 6, y: 9 },
      { type: TerrainType.Gate, x: 14, y: 6, w: 2, h: 2 },
    ]),
    playerSpawnPoints: [
      { x: 1, y: 6 },
      { x: 2, y: 5 },
      { x: 2, y: 7 },
      { x: 1, y: 7 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_54_1', '西晋禁卫', '龙骑', 'cavalier', UnitClass.Paladin, 19, 10, 4, ['silver_lance']),
      createEnemyUnit('e_54_2', '西晋禁卫', '剑圣', 'swordmaster', UnitClass.Swordmaster, 19, 10, 8, ['silver_sword']),
      createEnemyUnit('e_boss_yanghu', '羊祜', '都督荆州', 'boss', UnitClass.General, 20, 14, 6, ['silver_lance', 'elixir'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'battle',
    preBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '洛阳关隘就在眼前！司马懿本阵即在城中！' },
    ],
    postBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '破关入城！最终一战！' },
    ],
    events: [],
  },
  {
    id: 'stage_5_5',
    chapterNumber: 5,
    stageNumber: 5,
    title: '第五章 第五关',
    subtitle: '天下归一',
    description: '洛阳皇宫大殿！司马懿集结阴阳玄冥之气，多阶段终焉决战！天下苍生，系于此战！',
    mapWidth: 18,
    mapHeight: 16,
    terrainGrid: generateGrid(18, 16, TerrainType.Throne, [
      { type: TerrainType.Plains, x: 1, y: 1, w: 16, h: 14 },
      { type: TerrainType.Throne, x: 15, y: 7, w: 2, h: 2 },
      { type: TerrainType.Fire, x: 8, y: 4, w: 2, h: 2 },
      { type: TerrainType.Fire, x: 8, y: 10, w: 2, h: 2 },
    ]),
    playerSpawnPoints: [
      { x: 2, y: 7 },
      { x: 3, y: 6 },
      { x: 3, y: 8 },
      { x: 2, y: 6 },
      { x: 2, y: 8 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_55_1', '幽冥死卫', '暗影剑圣', 'swordmaster', UnitClass.Swordmaster, 20, 10, 5, ['killing_edge']),
      createEnemyUnit('e_55_2', '幽冥死卫', '暗影武神', 'fighter', UnitClass.Warrior, 20, 10, 9, ['killer_axe']),
      createEnemyUnit('e_55_3', '幽冥术士', '邪法师', 'cleric', UnitClass.Sage, 20, 12, 7, ['flux_tome']),
      createEnemyUnit('e_boss_simayi', '司马懿', '宣皇帝·玄冥化身', 'simayi', UnitClass.Sage, 20, 15, 7, ['taiping_secret', 'flux_tome', 'elixir'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'boss',
    preBattleDialogue: [
      { speaker: 'simayi', speakerName: '司马懿', portraitId: 'simayi', text: '鹰视狼顾，隐忍数十年，今日终登大宝！尔等萤烛之火，也敢与皓月争辉！' },
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '司马仲达！天下者，天下人之天下，非尔一姓私器！今日便结束这乱世浩劫！' },
      { speaker: 'zhugeliang', speakerName: '诸葛亮', portraitId: 'zhugeliang', text: '仲达，五丈原之誓，今日便在此作个了断！' },
    ],
    postBattleDialogue: [
      { speaker: 'simayi', speakerName: '司马懿', portraitId: 'simayi', text: '亮……孔明……想不到终究……输你一着……！' },
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '烽烟尽散，万家灯火重明。四海归一，海晏河清！' },
    ],
    events: [],
  },

  // ==========================================
  // 5 大隐藏关 (Hidden Stages)
  // ==========================================
  {
    id: 'stage_secret_1',
    chapterNumber: 1,
    stageNumber: 6,
    isSecret: true,
    title: '隐藏关 1',
    subtitle: '太平要术',
    description: '南华老仙秘境！限时8回合夺取天书秘术！5回合内访问深处草庐可邂逅绝代佳人貂蝉！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Forest, x: 2, y: 2, w: 12, h: 10 },
      { type: TerrainType.Village, x: 13, y: 2 }, // 貂蝉草庐
      { type: TerrainType.Throne, x: 13, y: 11 }, // 宝箱/秘台
    ]),
    playerSpawnPoints: [
      { x: 1, y: 6 },
      { x: 2, y: 5 },
      { x: 2, y: 7 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_s1_1', '幻影妖道', '黄巾幻灵', 'cleric', UnitClass.Mage, 7, 7, 4, ['thunder_tome']),
      createEnemyUnit('e_s1_2', '幻影妖道', '黄巾幻灵', 'cleric', UnitClass.Mage, 7, 7, 8, ['thunder_tome']),
      createEnemyUnit('e_boss_s1', '幻影天公', '心魔之影', 'zhangjiao', UnitClass.Sage, 9, 13, 11, ['taiping_secret'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    surviveTurns: 8,
    bgmTheme: 'chinese',
    preBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '此地弥漫仙灵之气，相传乃南华仙人密境！8回合内必须夺取仙术！' },
    ],
    postBattleDialogue: [
      { speaker: 'diaochan', speakerName: '貂蝉', portraitId: 'diaochan', text: '将军英武除魔，救小女子于幽境，愿伴将军左右，平定天下！' },
    ],
    events: [
      {
        trigger: 'visit_village',
        villageX: 13,
        villageY: 2,
        dialogue: [{ speaker: 'diaochan', speakerName: '貂蝉', portraitId: 'diaochan', text: '小女貂蝉，蒙将军相救，愿以此身相报！' }],
        rewardItem: ITEMS_DATABASE.master_seal,
      },
    ],
  },
  {
    id: 'stage_secret_2',
    chapterNumber: 2,
    stageNumber: 6,
    isSecret: true,
    title: '隐藏关 2',
    subtitle: '辕门射戟',
    description: '营门设宴，温侯试弓！少主与飞将吕布一对一较量武艺，胜之吕布诚心归顺！',
    mapWidth: 14,
    mapHeight: 12,
    terrainGrid: generateGrid(14, 12, TerrainType.Plains, [
      { type: TerrainType.Throne, x: 11, y: 5 },
      { type: TerrainType.Fort, x: 6, y: 5 },
    ]),
    playerSpawnPoints: [
      { x: 2, y: 5 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_boss_lubu_duel', '吕布', '飞将温侯', 'lubu', UnitClass.Warlord, 16, 11, 5, ['fangtian_halberd'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'boss',
    preBattleDialogue: [
      { speaker: 'lubu', speakerName: '吕布', portraitId: 'lubu', text: '少主！当日白门楼承你恩义，今日一对一决战，若能胜我，我吕奉先愿奉你为主，马首是瞻！' },
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '请温侯赐教！' },
    ],
    postBattleDialogue: [
      { speaker: 'lubu', speakerName: '吕布', portraitId: 'lubu', text: '痛快！心服口服！主公在上，受吕布一拜！方天画戟愿为主公斩尽天下之敌！' },
    ],
    events: [],
  },
  {
    id: 'stage_secret_3',
    chapterNumber: 3,
    stageNumber: 6,
    isSecret: true,
    title: '隐藏关 3',
    subtitle: '借东风',
    description: '七星坛上卧龙借东风！神医华佗现身相助，解锁诸葛亮隐藏传奇战技！',
    mapWidth: 14,
    mapHeight: 12,
    terrainGrid: generateGrid(14, 12, TerrainType.Plains, [
      { type: TerrainType.Throne, x: 7, y: 2 }, // 七星坛
      { type: TerrainType.Forest, x: 2, y: 4, w: 10, h: 6 },
    ]),
    playerSpawnPoints: [
      { x: 7, y: 10 },
      { x: 6, y: 10 },
      { x: 8, y: 10 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_s3_1', '东吴刺客', '暗探', 'thief', UnitClass.Assassin, 14, 4, 5, ['killing_edge']),
      createEnemyUnit('e_s3_2', '东吴刺客', '暗探', 'thief', UnitClass.Assassin, 14, 10, 5, ['killing_edge']),
      createEnemyUnit('e_boss_s3', '徐盛', '追击都尉', 'boss', UnitClass.General, 15, 7, 4, ['silver_lance'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'chinese',
    preBattleDialogue: [
      { speaker: 'zhugeliang', speakerName: '诸葛亮', portraitId: 'zhugeliang', text: '东风已借，周瑜必遣人来害亮！子龙速备快船！' },
      { speaker: 'huatuo', speakerName: '华佗', portraitId: 'huatuo', text: '老朽行医至此，见军师行此通天彻地之术，愿效犬马之劳！' },
    ],
    postBattleDialogue: [
      { speaker: 'huatuo', speakerName: '华佗', portraitId: 'huatuo', text: '天下疮痍，老朽愿入军中救死扶伤，普济苍生！' },
    ],
    events: [],
  },
  {
    id: 'stage_secret_4',
    chapterNumber: 4,
    stageNumber: 6,
    isSecret: true,
    title: '隐藏关 4',
    subtitle: '五丈原',
    description: '五丈原秋风星落，乌角仙人左慈施展七星续命奇术！逆天改命！',
    mapWidth: 16,
    mapHeight: 14,
    terrainGrid: generateGrid(16, 14, TerrainType.Plains, [
      { type: TerrainType.Throne, x: 8, y: 6 },
      { type: TerrainType.Mountain, x: 0, y: 0, w: 16, h: 2 },
      { type: TerrainType.Mountain, x: 0, y: 12, w: 16, h: 2 },
    ]),
    playerSpawnPoints: [
      { x: 3, y: 6 },
      { x: 2, y: 5 },
      { x: 2, y: 7 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_s4_1', '司马鬼卒', '阴兵', 'swordmaster', UnitClass.Swordmaster, 18, 11, 4, ['silver_sword']),
      createEnemyUnit('e_s4_2', '司马鬼卒', '阴兵', 'fighter', UnitClass.Warrior, 18, 11, 8, ['silver_axe']),
      createEnemyUnit('e_boss_s4', '幽冥司马懿', '心魔幻象', 'simayi', UnitClass.Sage, 20, 13, 6, ['taiping_secret'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'crisis',
    preBattleDialogue: [
      { speaker: 'zuoci', speakerName: '左慈', portraitId: 'zuoci', text: '哈哈！天下分合皆有数，老道见丞相忠义动天，特借七星灯为尔续命二十载！' },
      { speaker: 'zhugeliang', speakerName: '诸葛亮', portraitId: 'zhugeliang', text: '谢仙人成全！汉室重光，指日可待！' },
    ],
    postBattleDialogue: [
      { speaker: 'zuoci', speakerName: '左慈', portraitId: 'zuoci', text: '有趣有趣，且看少主与孔明如何重铸朗朗乾坤！' },
    ],
    events: [],
  },
  {
    id: 'stage_secret_5',
    chapterNumber: 5,
    stageNumber: 6,
    isSecret: true,
    title: '最终隐藏关',
    subtitle: '英灵殿',
    description: '全隐藏英雄收齐与天下大定之至高试炼！与华夏历代古之神将英灵切磋，开启真·大团圆结局！',
    mapWidth: 18,
    mapHeight: 16,
    terrainGrid: generateGrid(18, 16, TerrainType.Throne, [
      { type: TerrainType.Plains, x: 1, y: 1, w: 16, h: 14 },
      { type: TerrainType.Castle, x: 15, y: 7, w: 2, h: 2 },
    ]),
    playerSpawnPoints: [
      { x: 2, y: 7 },
      { x: 3, y: 6 },
      { x: 3, y: 8 },
      { x: 1, y: 7 },
      { x: 2, y: 6 },
    ],
    initialPlayerUnits: [],
    enemyUnits: [
      createEnemyUnit('e_yingling_1', '武圣关云长', '真武神君', 'guanyu', UnitClass.Paladin, 20, 11, 4, ['green_dragon_blade']),
      createEnemyUnit('e_yingling_2', '飞将吕奉先', '无双英魂', 'lubu', UnitClass.Warlord, 20, 11, 10, ['fangtian_halberd']),
      createEnemyUnit('e_yingling_3', '常山赵子龙', '银枪神英', 'zhaoyun', UnitClass.Paladin, 20, 13, 7, ['silver_lance']),
      createEnemyUnit('e_boss_yingling', '轩辕圣皇', '始祖英灵', 'boss', UnitClass.GreatLord, 20, 15, 7, ['qinggang_sword', 'elixir'], true, 'boss'),
    ],
    victoryCondition: VictoryCondition.DefeatBoss,
    bgmTheme: 'heroic',
    preBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '此处乃英灵殿堂！历代古今名将在此见证我等武道与仁德！诸位同袍，全力以赴！' },
    ],
    postBattleDialogue: [
      { speaker: 'protagonist', speakerName: '少主', portraitId: 'protagonist', text: '万民安泰，海内归一。英雄长在，浩气永存！真·天下一统大结局达成！' },
    ],
    events: [],
  },
];
