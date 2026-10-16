import { Faction, Unit } from '../types';
import { getDistance } from './pathfinding';

export type TechnologyAbility = 'first_aid' | 'pulse';
export const TECHNOLOGY_ENERGY = 6;

export function useTechnology(units: Unit[], energy: number, ability: TechnologyAbility, targetId: string): { units: Unit[]; energy: number } | null {
  const hero = units.find((unit) => unit.characterId === 'protagonist' && unit.faction === Faction.Player && unit.isAlive);
  const target = units.find((unit) => unit.id === targetId && unit.isAlive);
  if (!hero || hero.hasActed || !target || energy < 2 || getDistance(hero.x, hero.y, target.x, target.y) > 3) return null;
  if (ability === 'first_aid' && (target.faction === Faction.Enemy || target.stats.hp >= target.stats.maxHp)) return null;
  if (ability === 'pulse' && target.faction !== Faction.Enemy) return null;
  const hp = ability === 'first_aid'
    ? Math.min(target.stats.maxHp, target.stats.hp + 15)
    : Math.max(0, target.stats.hp - 8);
  return {
    energy: energy - 2,
    units: units.map((unit) => ({
      ...unit,
      hasActed: unit.id === hero.id ? true : unit.hasActed,
      ...(unit.id === target.id ? { stats: { ...unit.stats, hp }, isAlive: hp > 0 } : {}),
    })),
  };
}
