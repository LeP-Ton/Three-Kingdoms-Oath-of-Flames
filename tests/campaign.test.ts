import assert from 'node:assert/strict';
import test from 'node:test';
import { getInitialPartyUnits, createHistoricalAlly } from '../src/data/charactersData';
import { ALL_STAGES } from '../src/data/stagesData';
import { getMilitaryRank, recruitTroop, prepareParty, settleParty } from '../src/data/campaignData';
import { getBattleOutcome } from '../src/game/campaignRules';
import { useTechnology } from '../src/game/technologyEngine';
import { computeAiTurn } from '../src/game/aiEngine';
import { calculateMovementRange } from '../src/game/pathfinding';
import { simulateCombat } from '../src/game/combatEngine';
import { Faction, TerrainType, VictoryCondition } from '../src/types';

test('初始只有玄霄，携带科技装备，没有直属部队', () => {
  const party = getInitialPartyUnits();
  assert.equal(party.length, 1);
  assert.equal(party[0].name, '玄霄');
  assert.deepEqual(party[0].inventory.map((item) => item.id), ['pulse_carbine', 'nano_medkit']);
});

test('战功达到门槛才晋升；招兵校验编制、军资和兵种', () => {
  const party = getInitialPartyUnits();
  assert.equal(getMilitaryRank(99).capacity, 0);
  assert.equal(getMilitaryRank(100).name, '伍长');
  assert.equal(getMilitaryRank(299).capacity, 1);
  assert.equal(getMilitaryRank(300).capacity, 2);
  assert.equal(getMilitaryRank(99999).capacity, 5);
  assert.equal(recruitTroop(party, 0, 1200, 'spear', 1), null);
  assert.equal(recruitTroop(party, 100, 299, 'spear', 1), null);
  assert.equal(recruitTroop(party, 100, 1200, 'guanyu', 1), null);
  const recruited = recruitTroop(party, 100, 1200, 'spear', 1)!;
  assert.equal(recruited.gold, 900);
  assert.equal(recruited.party.length, 2);
  assert.equal(recruitTroop(recruited.party, 100, 900, 'archer', 1), null);
  const expanded = recruitTroop(recruited.party, 300, 900, 'archer', 1)!;
  assert.equal(expanded.party.length, 3);
  assert.equal(party.length, 1);
});

test('科技治疗友军、不能越距或复活，消耗能量与玄霄行动', () => {
  const hero = { ...getInitialPartyUnits()[0], x: 1, y: 1 };
  const ally = { ...createHistoricalAlly('guanyu', 3), x: 3, y: 1 };
  ally.stats.hp = 5;
  const result = useTechnology([hero, ally], 6, 'first_aid', ally.id)!;
  assert.equal(result.energy, 4);
  assert.equal(result.units[1].stats.hp, 20);
  assert.equal(result.units[0].hasActed, true);
  assert.equal(ally.stats.hp, 5);
  assert.equal(useTechnology(result.units, 4, 'first_aid', ally.id), null);
  assert.equal(useTechnology([hero, ally], 1, 'first_aid', ally.id), null);
  assert.equal(useTechnology([hero, { ...ally, x: 6 }], 6, 'first_aid', ally.id), null);
  assert.equal(useTechnology([hero, { ...ally, isAlive: false }], 6, 'first_aid', ally.id), null);
});

test('脉冲只能打敌军，击破后正确更新存活状态', () => {
  const hero = { ...getInitialPartyUnits()[0], x: 1, y: 1 };
  const enemy = structuredClone(ALL_STAGES[0].enemyUnits[0]);
  enemy.x = 2; enemy.y = 1; enemy.stats.hp = 8;
  const result = useTechnology([hero, enemy], 6, 'pulse', enemy.id)!;
  assert.equal(result.units[1].stats.hp, 0);
  assert.equal(result.units[1].isAlive, false);
  assert.equal(useTechnology([hero], 6, 'pulse', hero.id), null);
});

test('友军自主攻击敌军，绝不攻击玄霄；双方可以穿过同阵营单位', () => {
  const terrain = Array.from({ length: 5 }, () => Array<TerrainType>(6).fill(TerrainType.Plains));
  const hero = { ...getInitialPartyUnits()[0], x: 1, y: 2 };
  const ally = { ...createHistoricalAlly('guanyu', 3), x: 0, y: 2 };
  const enemy = { ...structuredClone(ALL_STAGES[0].enemyUnits[0]), x: 3, y: 2 };
  const units = [hero, ally, enemy];
  const movement = calculateMovementRange(ally, 6, 5, terrain, units);
  assert.equal(movement.has('1,2'), true);
  assert.equal(movement.has('3,2'), false);
  const action = computeAiTurn(ally, 6, 5, terrain, units);
  assert.equal(action.actionType, 'attack');
  assert.equal(action.targetUnit?.faction, Faction.Enemy);
  assert.notDeepEqual(action.destination, { x: hero.x, y: hero.y });
  const hostileAction = computeAiTurn(enemy, 6, 5, terrain, units);
  assert.ok([Faction.Player, Faction.Ally].includes(hostileAction.targetUnit!.faction));
});

test('友军医官可自主治疗玄霄，并避开占用格', () => {
  const terrain = Array.from({ length: 5 }, () => Array<TerrainType>(6).fill(TerrainType.Plains));
  const hero = { ...getInitialPartyUnits()[0], x: 2, y: 2 };
  hero.stats.hp = 5;
  const healer = { ...createHistoricalAlly('sunqian', 3), x: 0, y: 2 };
  const action = computeAiTurn(healer, 6, 5, terrain, [hero, healer]);
  assert.equal(action.actionType, 'heal');
  assert.equal(action.targetUnit?.id, hero.id);
  assert.notDeepEqual(action.destination, { x: hero.x, y: hero.y });
});

test('玄霄倒下优先失败，刘备存活也不能代替主角', () => {
  const hero = { ...getInitialPartyUnits()[0], isAlive: false };
  assert.equal(getBattleOutcome(ALL_STAGES[0], [hero, createHistoricalAlly('liubei', 2)], 1), 'defeat');
});

test('守满六回合需进入第七回合，撤离仅由玄霄触发', () => {
  const hero = getInitialPartyUnits()[0];
  const survival = ALL_STAGES.find((stage) => stage.victoryCondition === VictoryCondition.Survive)!;
  assert.equal(getBattleOutcome(survival, [hero], 6), 'ongoing');
  assert.equal(getBattleOutcome(survival, [hero], 7), 'victory');
  const escape = ALL_STAGES.find((stage) => stage.victoryCondition === VictoryCondition.Escape)!;
  const ally = { ...createHistoricalAlly('liubei', 2), ...escape.escapeTarget };
  assert.equal(getBattleOutcome(escape, [hero, ally], 1), 'ongoing');
  assert.equal(getBattleOutcome(escape, [{ ...hero, ...escape.escapeTarget }], 1), 'victory');
});

test('战后保留等级经验，经典模式移除阵亡部队，科技补给不污染原对象', () => {
  const party = recruitTroop(getInitialPartyUnits(), 100, 1200, 'spear', 1)!.party;
  const battle = structuredClone(party);
  battle[0].level = 4; battle[0].exp = 25; battle[0].inventory[0].uses = 1;
  battle[1].isAlive = false; battle[1].stats.hp = 0;
  const classic = settleParty(party, battle, false);
  assert.equal(classic.length, 1);
  assert.equal(classic[0].level, 4);
  assert.equal(classic[0].exp, 25);
  assert.equal(classic[0].inventory[0].uses, 30);
  const casual = settleParty(party, battle, true);
  assert.equal(casual.length, 2);
  assert.equal(casual[1].stats.hp, casual[1].stats.maxHp);
  assert.equal(battle[0].inventory[0].uses, 1);
  assert.equal(prepareParty(party)[0].inventory[0].uses, 30);
});

test('无耐久武器不能攻击或反击，也不会让追击凭空发生', () => {
  const hero = getInitialPartyUnits()[0];
  const enemy = structuredClone(ALL_STAGES[0].enemyUnits[0]);
  hero.inventory[0].uses = 0;
  enemy.inventory[0].uses = 0;
  const result = simulateCombat(hero, enemy, 1);
  assert.equal(result.actions.length, 0);
  assert.equal(result.expGained, 0);
});

test('25关配置、部署与历史人物出场顺序完整，原始模板不会被战斗污染', () => {
  assert.equal(ALL_STAGES.length, 25);
  assert.equal(new Set(ALL_STAGES.map((stage) => stage.id)).size, 25);
  for (const stage of ALL_STAGES) {
    const occupied = [...stage.playerSpawnPoints, ...stage.enemyUnits, ...(stage.allyUnits ?? [])].map(({ x, y }) => `${x},${y}`);
    assert.equal(new Set(occupied).size, occupied.length, stage.subtitle);
    assert.ok(stage.allyUnits?.every((unit) => unit.faction === Faction.Ally));
    assert.ok(stage.historicalNote && stage.objective && stage.meritReward > 0);
    const explorer = { ...getInitialPartyUnits()[0], ...stage.playerSpawnPoints[0] };
    explorer.stats.mov = 100;
    const reachable = calculateMovementRange(explorer, stage.mapWidth, stage.mapHeight, stage.terrainGrid, [explorer]);
    assert.ok(reachable.has(`${stage.seizeTarget!.x},${stage.seizeTarget!.y}`), `${stage.subtitle}据点不可达`);
    assert.ok(reachable.has(`${stage.escapeTarget!.x},${stage.escapeTarget!.y}`), `${stage.subtitle}撤离点不可达`);
    for (const { x, y } of [...stage.playerSpawnPoints, ...(stage.allyUnits ?? []), ...stage.enemyUnits, stage.seizeTarget!, stage.escapeTarget!]) {
      assert.ok(x >= 0 && x < stage.mapWidth && y >= 0 && y < stage.mapHeight);
      assert.notEqual(stage.terrainGrid[y][x], TerrainType.Wall);
    }
  }
  const late = ALL_STAGES.slice(22);
  assert.ok(late.every((stage) => !stage.allyUnits?.some((unit) => ['guanyu', 'zhangfei'].includes(unit.characterId))));
  const final = ALL_STAGES.at(-1)!;
  assert.equal(final.subtitle, '五丈秋风');
  assert.ok(final.allyUnits?.every((unit) => !['liubei', 'zhaoyun', 'zhugeliang'].includes(unit.characterId)));
  const originalHp = ALL_STAGES[0].allyUnits![0].stats.hp;
  const copied = structuredClone(ALL_STAGES[0].allyUnits!);
  copied[0].stats.hp = 1;
  assert.equal(ALL_STAGES[0].allyUnits![0].stats.hp, originalHp);
});
