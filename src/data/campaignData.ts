import { Faction, Unit, UnitClass, WeaponRank, WeaponType } from '../types';
import { createBaseUnit } from './charactersData';
import { ITEMS_DATABASE } from './itemsData';

export const MILITARY_RANKS = [
  { name: '义勇', merit: 0, capacity: 0 },
  { name: '伍长', merit: 100, capacity: 1 },
  { name: '什长', merit: 300, capacity: 2 },
  { name: '屯长', merit: 600, capacity: 3 },
  { name: '军侯', merit: 1000, capacity: 4 },
  { name: '校尉', merit: 1600, capacity: 5 },
] as const;

export function getMilitaryRank(merit: number) {
  return [...MILITARY_RANKS].reverse().find((rank) => merit >= rank.merit) ?? MILITARY_RANKS[0];
}

export const TROOP_TYPES = [
  { id: 'spear', name: '长枪队', unitClass: UnitClass.Knight, weapon: 'iron_lance', type: WeaponType.Lance, cost: 300, description: '守住阵线，掩护玄霄与友军。' },
  { id: 'archer', name: '弓弩队', unitClass: UnitClass.Archer, weapon: 'iron_bow', type: WeaponType.Bow, cost: 350, description: '两格远射，需要前排保护。' },
  { id: 'infantry', name: '刀盾队', unitClass: UnitClass.Myrmidon, weapon: 'iron_sword', type: WeaponType.Sword, cost: 300, description: '灵活突进，抢占局部据点。' },
] as const;

export function recruitTroop(party: Unit[], merit: number, gold: number, typeId: string, chapter: number): { party: Unit[]; gold: number } | null {
  const type = TROOP_TYPES.find((entry) => entry.id === typeId);
  const subordinates = party.filter((unit) => unit.characterId !== 'protagonist');
  if (!type || subordinates.length >= getMilitaryRank(merit).capacity || gold < type.cost) return null;
  const level = 1 + (chapter - 1) * 3;
  let serial = 1;
  while (party.some((unit) => unit.id === `troop_${type.id}_${serial}`)) serial++;
  const troop = createBaseUnit(
    `troop_${type.id}_${serial}`, `${type.name}·${serial}`, '玄霄直属部队', type.unitClass, type.unitClass, level,
    { hp: 24 + level * 2, str: 7 + level, mag: 0, skl: 6 + level, spd: 5 + level, lck: 5, def: 6 + level, res: 3 + Math.floor(level / 2), con: 10, mov: 5 },
    { hp: 80, str: 55, mag: 0, skl: 50, spd: 45, lck: 40, def: 50, res: 30 },
    [type.weapon, 'vulnerary'], { [type.type]: WeaponRank.C },
  );
  return { party: [...party, troop], gold: gold - type.cost };
}

// 战前补给与战后整编统一深拷贝，避免一场战斗污染人物模板或上一份存档。
export function prepareParty(party: Unit[]): Unit[] {
  return party.map((unit) => {
    const inventory = unit.inventory.map((item) => ({ ...item }));
    if (unit.characterId === 'protagonist') {
      for (const id of ['pulse_carbine', 'nano_medkit']) {
        const index = inventory.findIndex((item) => item.id === id);
        if (index >= 0) inventory[index] = { ...ITEMS_DATABASE[id] };
        else inventory.push({ ...ITEMS_DATABASE[id] });
      }
    }
    return { ...unit, faction: Faction.Player, isAlive: true, hasActed: false, stats: { ...unit.stats, hp: unit.stats.maxHp }, inventory };
  });
}

export function settleParty(party: Unit[], battleUnits: Unit[], casualMode: boolean): Unit[] {
  return prepareParty(party.flatMap((unit) => {
    const result = battleUnits.find((entry) => entry.id === unit.id) ?? unit;
    return result.isAlive || casualMode || unit.characterId === 'protagonist' ? [result] : [];
  }));
}
