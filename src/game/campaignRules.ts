import { Faction, StageConfig, Unit, VictoryCondition } from '../types';

export function getBattleOutcome(stage: StageConfig, units: Unit[], turn: number): 'ongoing' | 'victory' | 'defeat' {
  const hero = units.find((unit) => unit.characterId === 'protagonist' && unit.faction === Faction.Player && unit.isAlive);
  if (!hero) return 'defeat';
  const enemies = units.filter((unit) => unit.faction === Faction.Enemy && unit.isAlive);
  if (stage.victoryCondition === VictoryCondition.Rout && enemies.length === 0) return 'victory';
  if (stage.victoryCondition === VictoryCondition.DefeatBoss && !enemies.some((unit) => unit.isBoss)) return 'victory';
  // 第N回合的敌军阶段也必须完成，进入N+1回合才算守满N回合。
  if (stage.victoryCondition === VictoryCondition.Survive && turn > (stage.surviveTurns ?? 6)) return 'victory';
  if (stage.victoryCondition === VictoryCondition.Escape && hero.x === stage.escapeTarget?.x && hero.y === stage.escapeTarget?.y) return 'victory';
  return 'ongoing';
}
