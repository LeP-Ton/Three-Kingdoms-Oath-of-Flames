/**
 * 三国志·烈火之誓 (Three Kingdoms: Oath of Fire)
 * 对标 GBA 火焰纹章核心系列（封印/烈火/圣魔）
 * 主游戏容器与状态机核心驱动器
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Unit,
  StageConfig,
  Faction,
  VictoryCondition,
  LevelUpGain,
  TerrainType,
  WeaponType,
} from './types';
import { ALL_STAGES } from './data/stagesData';
import { getInitialPartyUnits } from './data/charactersData';
import { getMilitaryRank, prepareParty, recruitTroop, settleParty } from './data/campaignData';
import { TECHNOLOGY_ENERGY, TechnologyAbility, useTechnology } from './game/technologyEngine';
import { getBattleOutcome } from './game/campaignRules';
import { calculateMovementRange, calculateAttackRange, calculateDangerZone, ReachableTile, getDistance } from './game/pathfinding';
import { computeAiTurn } from './game/aiEngine';
import { audio } from './audio/retroAudio';
import { ART_ASSETS } from './graphics/imageAssets';
import { getPortraitDataUrl } from './graphics/pixelAssets';

import { GameCanvas } from './components/GameCanvas';
import { DialogueBox } from './components/DialogueBox';
import { CombatArena } from './components/CombatArena';
import { LevelUpModal } from './components/LevelUpModal';
import { PrepScreen } from './components/PrepScreen';
import { GbaControls } from './components/GbaControls';
import { SaveLoadModal, SaveSlotData } from './components/SaveLoadModal';
import { DebugPanel } from './components/DebugPanel';
import { DesignDocModal } from './components/DesignDocModal';

type GameMode =
  | 'title'
  | 'prep'
  | 'battle'
  | 'dialogue'
  | 'combat_duel'
  | 'stage_clear'
  | 'game_over'
  | 'victory_ending';

interface ActiveCombatData {
  attacker: Unit;
  defender: Unit;
  distance: number;
}

export default function App() {
  // 核心游戏状态
  const [mode, setMode] = useState<GameMode>('title');
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [party, setParty] = useState<Unit[]>(getInitialPartyUnits);
  const [merit, setMerit] = useState(0);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [technologyEnergy, setTechnologyEnergy] = useState(TECHNOLOGY_ENERGY);
  const [technologyAbility, setTechnologyAbility] = useState<TechnologyAbility | null>(null);
  const [visitedVillages, setVisitedVillages] = useState<string[]>([]);
  const resolutionRef = useRef(false);
  const rewardedRef = useRef(false);
  const generationRef = useRef(0);
  const stageStartPartyRef = useRef<Unit[]>(getInitialPartyUnits());
  const stageStartGoldRef = useRef(1200);
  const [gold, setGold] = useState(1200);
  const [casualMode, setCasualMode] = useState(false); // 经典/轻松模式

  // 当前关卡进行时状态
  const currentStage: StageConfig = ALL_STAGES[currentStageIndex] || ALL_STAGES[0];
  const [battleUnits, setBattleUnits] = useState<Unit[]>([]);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [phase, setPhase] = useState<'player' | 'ally' | 'enemy'>('player');
  const [phaseBanner, setPhaseBanner] = useState<string | null>(null);

  // 战棋光标与选择状态
  const [cursorPos, setCursorPos] = useState({ x: 1, y: 6 });
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [originalUnitPos, setOriginalUnitPos] = useState<{ x: number; y: number } | null>(null);
  const [movementRange, setMovementRange] = useState<Map<string, ReachableTile>>(new Map());
  const [attackRange, setAttackRange] = useState<Set<string>>(new Set());
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [dangerZone, setDangerZone] = useState<Set<string>>(new Set());

  // 行动指令菜单 (移动后弹出：攻击、道具、访问、制压、待机、取消)
  const [actionMenu, setActionMenu] = useState<{
    unit: Unit;
    x: number;
    y: number;
    options: ('attack' | 'staff' | 'item' | 'visit' | 'seize' | 'wait' | 'cancel')[];
  } | null>(null);

  // 攻击目标选择状态
  const [targetingEnemies, setTargetingEnemies] = useState<Unit[]>([]);

  // 弹窗与子系统状态
  const [activeDialogue, setActiveDialogue] = useState<StageConfig['preBattleDialogue'] | null>(null);
  const [onDialogueFinishCallback, setOnDialogueFinishCallback] = useState<(() => void) | null>(null);
  const [activeCombat, setActiveCombat] = useState<ActiveCombatData | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ unit: Unit; gain: LevelUpGain } | null>(null);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load' | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showDesignDoc, setShowDesignDoc] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // 初始化或关卡切换时载入 BGM
  useEffect(() => {
    if (mode === 'battle' || mode === 'prep') {
      audio.startBgm(currentStage.bgmTheme);
    }
  }, [mode, currentStage.bgmTheme]);

  // 重新计算全图危险区
  const refreshDangerZone = useCallback((units: Unit[]) => {
    const enemies = units.filter((u) => u.isAlive && u.faction === Faction.Enemy);
    const dz = calculateDangerZone(enemies, currentStage.mapWidth, currentStage.mapHeight, currentStage.terrainGrid, units);
    setDangerZone(dz);
  }, [currentStage]);

  // 启动新战役章节
  const initStage = useCallback((stageToLoad: StageConfig, deployedParty: Unit[] = party) => {
    generationRef.current++;
    resolutionRef.current = false;
    rewardedRef.current = false;
    stageStartPartyRef.current = structuredClone(party);
    stageStartGoldRef.current = gold;
    setTechnologyEnergy(TECHNOLOGY_ENERGY);
    setTechnologyAbility(null);
    setVisitedVillages([]);
    setActiveCombat(null);
    setLevelUpData(null);
    // 部署玩家选派的武将
    const placedPlayerUnits: Unit[] = [];
    const spawnPoints = stageToLoad.playerSpawnPoints;

    prepareParty(deployedParty).slice(0, spawnPoints.length).forEach((unit, idx) => {
      const sp = spawnPoints[idx];
      placedPlayerUnits.push({
        ...unit,
        x: sp.x,
        y: sp.y,
        hasActed: false,
        isAlive: true,
        faction: Faction.Player,
      });
    });

    // 载入敌军
    const enemies = structuredClone(stageToLoad.enemyUnits);
    const allies = structuredClone(stageToLoad.allyUnits ?? []);
    const all = [...placedPlayerUnits, ...allies, ...enemies];

    setBattleUnits(all);
    setCurrentTurn(1);
    setPhase('player');
    setSelectedUnit(null);
    setActionMenu(null);
    setTargetingEnemies([]);
    setMovementRange(new Map());
    setAttackRange(new Set());
    setCursorPos({ x: placedPlayerUnits[0]?.x || 1, y: placedPlayerUnits[0]?.y || 1 });

    setDangerZone(calculateDangerZone(enemies, stageToLoad.mapWidth, stageToLoad.mapHeight, stageToLoad.terrainGrid, all));

    // 播放战前剧情对话
    if (stageToLoad.preBattleDialogue && stageToLoad.preBattleDialogue.length > 0) {
      setMode('dialogue');
      setActiveDialogue(stageToLoad.preBattleDialogue);
      setOnDialogueFinishCallback(() => () => {
        setMode('battle');
        triggerPhaseBanner('玄霄军行动');
      });
    } else {
      setMode('battle');
      triggerPhaseBanner('玄霄军行动');
    }
  }, [party, gold, refreshDangerZone]);

  // 回合横幅提示
  const triggerPhaseBanner = (text: string) => {
    setPhaseBanner(text);
    audio.playPhaseChange();
    setTimeout(() => {
      setPhaseBanner(null);
    }, 1200);
  };

  // 检查胜利与失败判定
  const checkBattleCondition = (currentUnits: Unit[], turn: number): boolean => {
      if (resolutionRef.current) return true;
      const outcome = getBattleOutcome(currentStage, currentUnits, turn);
      if (outcome === 'defeat') {
        audio.playGameOver();
        setMode('game_over');
        resolutionRef.current = true;
        return true;
      }

      const isVictory = outcome === 'victory';

      if (isVictory) {
        resolutionRef.current = true;
        audio.playVictory();
        if (currentStage.postBattleDialogue && currentStage.postBattleDialogue.length > 0) {
          setMode('dialogue');
          setActiveDialogue(currentStage.postBattleDialogue);
          setOnDialogueFinishCallback(() => () => {
            handleStageVictoryFinish(currentUnits);
          });
        } else {
          handleStageVictoryFinish(currentUnits);
        }
      }
      return isVictory;
  };

  // 关卡胜利结算
  const handleStageVictoryFinish = (units: Unit[] = battleUnits) => {
    if (rewardedRef.current) return;
    rewardedRef.current = true;
    resolutionRef.current = true;
    generationRef.current++;
    setParty((previous) => settleParty(previous, units, casualMode));
    if (!completedStages.includes(currentStage.id)) {
      setGold((prev) => prev + 1500);
      setMerit((prev) => prev + currentStage.meritReward);
      setCompletedStages((prev) => [...prev, currentStage.id]);
    }

    if (currentStageIndex >= ALL_STAGES.length - 1 || currentStage.id === 'stage_5_5') {
      setMode('victory_ending');
    } else {
      setMode('stage_clear');
    }
  };

  // 推进至下一关
  const proceedToNextStage = () => {
    audio.playMenuConfirm();
    const nextIdx = currentStageIndex + 1;
    if (nextIdx < ALL_STAGES.length) {
      setCurrentStageIndex(nextIdx);
      setMode('prep');
    } else {
      setMode('victory_ending');
    }
  };

  // 玩家棋盘交互逻辑
  const handleTileClick = (tx: number, ty: number) => {
    if (phase !== 'player' || mode !== 'battle') return;
    if (technologyAbility) {
      const target = battleUnits.find((unit) => unit.isAlive && unit.x === tx && unit.y === ty);
      const result = target && useTechnology(battleUnits, technologyEnergy, technologyAbility, target.id);
      if (!result) { audio.playMenuCancel(); return; }
      setBattleUnits(result.units);
      setTechnologyEnergy(result.energy);
      setTechnologyAbility(null);
      setSelectedUnit(null);
      setActionMenu(null);
      setMovementRange(new Map());
      setAttackRange(new Set());
      refreshDangerZone(result.units);
      if (!checkBattleCondition(result.units, currentTurn)) checkTurnEnd(result.units);
      return;
    }

    // 1. 如果处于攻击目标选取状态
    if (targetingEnemies.length > 0 && selectedUnit) {
      const targetEnemy = targetingEnemies.find((e) => e.x === tx && e.y === ty);
      if (targetEnemy) {
        audio.playMenuConfirm();
        const dist = getDistance(selectedUnit.x, selectedUnit.y, targetEnemy.x, targetEnemy.y);
        setActiveCombat({ attacker: selectedUnit, defender: targetEnemy, distance: dist });
        setTargetingEnemies([]);
        setMode('combat_duel');
        return;
      }
    }

    // 2. 如果已经选中了移动后单位并打开了菜单，点击其他区域取消
    if (actionMenu) {
      return;
    }

    // 3. 点击己方尚未行动的单位：选中并展开移动/攻击范围
    const clickedUnit = battleUnits.find((u) => u.isAlive && u.x === tx && u.y === ty);

    if (!selectedUnit) {
      if (clickedUnit) {
        audio.playUnitSelect();
        setCursorPos({ x: tx, y: ty });

        if (clickedUnit.faction === Faction.Player && !clickedUnit.hasActed) {
          setSelectedUnit(clickedUnit);
          setOriginalUnitPos({ x: tx, y: ty });
          const reachable = calculateMovementRange(
            clickedUnit,
            currentStage.mapWidth,
            currentStage.mapHeight,
            currentStage.terrainGrid,
            battleUnits
          );
          setMovementRange(reachable);

          const weapon = clickedUnit.inventory[clickedUnit.equippedWeaponIndex] || null;
          const atkRange = calculateAttackRange(reachable, weapon, currentStage.mapWidth, currentStage.mapHeight);
          setAttackRange(atkRange);
        } else {
          // 查看敌方或已行动单位的范围
          const weapon = clickedUnit.inventory[clickedUnit.equippedWeaponIndex] || null;
          const reachable = calculateMovementRange(
            clickedUnit,
            currentStage.mapWidth,
            currentStage.mapHeight,
            currentStage.terrainGrid,
            battleUnits
          );
          setMovementRange(reachable);
          setAttackRange(calculateAttackRange(reachable, weapon, currentStage.mapWidth, currentStage.mapHeight));
        }
      } else {
        // 点击空地重置高亮
        setSelectedUnit(null);
        setMovementRange(new Map());
        setAttackRange(new Set());
      }
    } else {
      // 4. 已有选中单位，点击目标格子进行位移
      const key = `${tx},${ty}`;
      if (movementRange.has(key)) {
        // 格子不能被其他存活队友或敌人占据
        const isOccupied = battleUnits.some(
          (u) => u.isAlive && u.id !== selectedUnit.id && u.x === tx && u.y === ty
        );

        if (!isOccupied) {
          audio.playMoveStep();
          // 更新单位位置
          const movedUnit = { ...selectedUnit, x: tx, y: ty };
          setBattleUnits((prev) => prev.map((u) => (u.id === selectedUnit.id ? movedUnit : u)));
          setSelectedUnit(movedUnit);
          setCursorPos({ x: tx, y: ty });
          setMovementRange(new Map());
          setAttackRange(new Set());

          // 计算可用行动指令
          const weapon = movedUnit.inventory[movedUnit.equippedWeaponIndex] || null;
          const options: ('attack' | 'staff' | 'item' | 'visit' | 'seize' | 'wait' | 'cancel')[] = [];

          // 检查攻击范围内是否有存活敌军
          if (weapon && weapon.uses > 0 && weapon.type !== WeaponType.Item && weapon.type !== WeaponType.Staff) {
            const enemiesInRange = battleUnits.filter((e) => {
              if (!e.isAlive || e.faction !== Faction.Enemy) return false;
              const d = getDistance(tx, ty, e.x, e.y);
              return d >= weapon.minRange && d <= weapon.maxRange;
            });
            if (enemiesInRange.length > 0) {
              options.push('attack');
            }
          }

          // 检查是否有可用消耗道具
          const hasUsableItem = movedUnit.inventory.some((it) => it.type === WeaponType.Item && it.uses > 0 && it.healAmount);
          if (hasUsableItem) {
            options.push('item');
          }

          // 检查访问村庄事件
          const terrain = currentStage.terrainGrid[ty]?.[tx];
          if (terrain === TerrainType.Village && !visitedVillages.includes(`${tx},${ty}`)) {
            options.push('visit');
          }

          // 检查制压
          if (
            tx === currentStage.seizeTarget?.x && ty === currentStage.seizeTarget?.y &&
            currentStage.victoryCondition === VictoryCondition.Seize
          ) {
            options.push('seize');
          }

          options.push('wait');
          options.push('cancel');

          setActionMenu({ unit: movedUnit, x: tx, y: ty, options });
        }
      } else {
        // 取消选定
        audio.playMenuCancel();
        setSelectedUnit(null);
        setMovementRange(new Map());
        setAttackRange(new Set());
      }
    }
  };

  // 行动指令处理
  const handleActionSelect = (action: string) => {
    if (!actionMenu) return;
    const { unit, x, y } = actionMenu;

    if (action === 'cancel') {
      audio.playMenuCancel();
      // 回退至原始位置
      if (originalUnitPos) {
        setBattleUnits((prev) =>
          prev.map((u) => (u.id === unit.id ? { ...u, x: originalUnitPos.x, y: originalUnitPos.y } : u))
        );
        setCursorPos(originalUnitPos);
      }
      setSelectedUnit(null);
      setActionMenu(null);
      return;
    }

    if (action === 'wait') {
      audio.playMenuConfirm();
      const updatedUnits = battleUnits.map((u) => (u.id === unit.id ? { ...u, hasActed: true } : u));
      setBattleUnits(updatedUnits);
      setSelectedUnit(null);
      setActionMenu(null);
      if (!checkBattleCondition(updatedUnits, currentTurn)) checkTurnEnd(updatedUnits);
      return;
    }

    if (action === 'attack') {
      audio.playMenuConfirm();
      const weapon = unit.inventory[unit.equippedWeaponIndex] || null;
      if (!weapon) return;

      const enemies = battleUnits.filter((e) => {
        if (!e.isAlive || e.faction !== Faction.Enemy) return false;
        const d = getDistance(x, y, e.x, e.y);
        return d >= weapon.minRange && d <= weapon.maxRange;
      });

      setTargetingEnemies(enemies);
      setActionMenu(null);
      return;
    }

    if (action === 'visit') {
      if (visitedVillages.includes(`${x},${y}`)) return;
      setVisitedVillages((prev) => [...prev, `${x},${y}`]);
      audio.playLevelUp();
      const villageEvent = currentStage.events?.find(
        (ev) => ev.trigger === 'visit_village' && ev.villageX === x && ev.villageY === y
      );
      if (villageEvent) {
        if (villageEvent.rewardGold) {
          setGold((prev) => prev + (villageEvent.rewardGold || 0));
        }
        if (villageEvent.rewardItem && unit.inventory.length < 5) {
          unit.inventory.push({ ...villageEvent.rewardItem });
        }
        if (villageEvent.dialogue) {
          setMode('dialogue');
          setActiveDialogue(villageEvent.dialogue);
          setOnDialogueFinishCallback(() => () => {
            setMode('battle');
            checkTurnEnd(updatedUnits);
          });
        }
      }
      const updatedUnits = battleUnits.map((u) => (u.id === unit.id ? { ...u, hasActed: true } : u));
      setBattleUnits(updatedUnits);
      setSelectedUnit(null);
      setActionMenu(null);
      if (!villageEvent?.dialogue?.length) checkTurnEnd(updatedUnits);
      return;
    }

    if (action === 'seize') {
      if (x !== currentStage.seizeTarget?.x || y !== currentStage.seizeTarget?.y) return;
      resolutionRef.current = true;
      audio.playVictory();
      setSelectedUnit(null);
      setActionMenu(null);
      setMode('dialogue');
      setActiveDialogue(currentStage.postBattleDialogue);
      setOnDialogueFinishCallback(() => () => handleStageVictoryFinish(battleUnits));
      return;
    }

    if (action === 'item') {
      // 快速使用药水
      audio.playItemUse();
      const itemIdx = unit.inventory.findIndex((it) => it.type === WeaponType.Item && it.uses > 0 && it.healAmount);
      if (itemIdx >= 0) {
        const item = unit.inventory[itemIdx];
        const healedHp = Math.min(unit.stats.maxHp, unit.stats.hp + (item.healAmount ?? 10));
        item.uses -= 1;
        if (item.uses <= 0) {
          unit.inventory.splice(itemIdx, 1);
        }
        const updatedUnits = battleUnits.map((u) =>
          u.id === unit.id ? { ...u, stats: { ...u.stats, hp: healedHp }, hasActed: true } : u
        );
        setBattleUnits(updatedUnits);
        setSelectedUnit(null);
        setActionMenu(null);
        if (!checkBattleCondition(updatedUnits, currentTurn)) checkTurnEnd(updatedUnits);
      }
      return;
    }
  };

  // 战斗动画结算完毕回调
  const handleFinishCombat = (result: {
    attacker: Unit;
    defender: Unit;
    attackerDied: boolean;
    defenderDied: boolean;
    levelUpGain: LevelUpGain | null;
  }) => {
    setMode('battle');
    setActiveCombat(null);

    let nextUnits = battleUnits.map((u) => {
      if (u.id === result.attacker.id) return result.attacker;
      if (u.id === result.defender.id) return result.defender;
      return u;
    });

    setBattleUnits(nextUnits);
    refreshDangerZone(nextUnits);
    setSelectedUnit(null);
    setActionMenu(null);
    setMovementRange(new Map());
    setAttackRange(new Set());
    if (result.levelUpGain) setLevelUpData({ unit: result.attacker, gain: result.levelUpGain });
    if (checkBattleCondition(nextUnits, currentTurn)) return;
    if (phase === 'player') checkTurnEnd(nextUnits);
    else void runAiSequence(phase, nextUnits, generationRef.current);
  };

  const checkTurnEnd = (units: Unit[]) => {
    if (resolutionRef.current) return;
    if (!units.some((unit) => unit.isAlive && unit.faction === Faction.Player && !unit.hasActed)) {
      startAiPhase('ally', units);
    }
  };

  const startAiPhase = (nextPhase: 'ally' | 'enemy', units: Unit[]) => {
    if (resolutionRef.current) return;
    const generation = generationRef.current;
    setPhase(nextPhase);
    setSelectedUnit(null);
    setActionMenu(null);
    setTargetingEnemies([]);
    setTechnologyAbility(null);
    setMovementRange(new Map());
    setAttackRange(new Set());
    triggerPhaseBanner(nextPhase === 'ally' ? '友军名将行动' : '敌军行动');
    setTimeout(() => {
      if (generation === generationRef.current && !resolutionRef.current) void runAiSequence(nextPhase, units, generation);
    }, 1200);
  };

  // 每次交锋结束后从未行动单位继续，避免动画中断导致敌军或友军回合停滞。
  const runAiSequence = async (activePhase: 'ally' | 'enemy', initialUnits: Unit[], generation: number) => {
    let units = [...initialUnits];
    const faction = activePhase === 'ally' ? Faction.Ally : Faction.Enemy;
    const actors = units.filter((unit) => unit.isAlive && unit.faction === faction && !unit.hasActed);
    for (const actor of actors) {
      if (generation !== generationRef.current || resolutionRef.current) return;
      const latest = units.find((unit) => unit.id === actor.id && unit.isAlive && !unit.hasActed);
      if (!latest) continue;
      const action = computeAiTurn(latest, currentStage.mapWidth, currentStage.mapHeight, currentStage.terrainGrid, units);
      const targetId = action.targetUnit?.id;
      const moved = { ...latest, ...action.destination, hasActed: true };
      units = units.map((unit) => unit.id === moved.id ? moved : unit);
      setBattleUnits(units);
      if (action.actionType === 'attack' && targetId) {
        const target = units.find((unit) => unit.id === targetId)!;
        setActiveCombat({ attacker: moved, defender: target, distance: getDistance(moved.x, moved.y, target.x, target.y) });
        setMode('combat_duel');
        return;
      }
      if (action.actionType === 'heal' && targetId) {
        const staff = moved.inventory[moved.equippedWeaponIndex];
        units = units.map((unit) => unit.id === targetId
          ? { ...unit, stats: { ...unit.stats, hp: Math.min(unit.stats.maxHp, unit.stats.hp + (staff.healAmount ?? 10) + moved.stats.mag) } }
          : unit.id === moved.id ? { ...unit, inventory: unit.inventory.map((item, index) => index === unit.equippedWeaponIndex ? { ...item, uses: Math.max(0, item.uses - 1) } : item) } : unit);
        setBattleUnits(units);
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (generation !== generationRef.current || resolutionRef.current) return;
    if (checkBattleCondition(units, currentTurn)) return;
    if (activePhase === 'ally') startAiPhase('enemy', units);
    else endEnemyPhase(units);
  };

  const endEnemyPhase = (units: Unit[]) => {
    const nextTurn = currentTurn + 1;
    const refreshed = units.map((unit) => ({ ...unit, hasActed: false }));
    setBattleUnits(refreshed);
    setCurrentTurn(nextTurn);
    setPhase('player');
    refreshDangerZone(refreshed);
    if (!checkBattleCondition(refreshed, nextTurn)) triggerPhaseBanner(`玄霄军行动 · 第${nextTurn}回合`);
  };

  const handleManualEndTurn = () => {
    if (phase !== 'player' || mode !== 'battle') return;
    audio.playMenuConfirm();
    startAiPhase('ally', battleUnits);
  };
  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'battle') return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setCursorPos((prev) => ({ ...prev, y: Math.max(0, prev.y - 1) }));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setCursorPos((prev) => ({ ...prev, y: Math.min(currentStage.mapHeight - 1, prev.y + 1) }));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setCursorPos((prev) => ({ ...prev, x: Math.max(0, prev.x - 1) }));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setCursorPos((prev) => ({ ...prev, x: Math.min(currentStage.mapWidth - 1, prev.x + 1) }));
      } else if (e.key === 'z' || e.key === 'Z') {
        // A 键 / 确定
        e.preventDefault();
        handleTileClick(cursorPos.x, cursorPos.y);
      } else if (e.key === 'x' || e.key === 'X') {
        // B 键 / 取消
        e.preventDefault();
        if (actionMenu) {
          handleActionSelect('cancel');
        } else {
          setSelectedUnit(null);
          setMovementRange(new Map());
          setAttackRange(new Set());
          setTargetingEnemies([]);
        }
      } else if (e.key === ' ') {
        // 空格键：切换全图敌军危险区
        e.preventDefault();
        setShowDangerZone((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cursorPos, mode, actionMenu, currentStage, phase, battleUnits, selectedUnit, movementRange, targetingEnemies, technologyAbility, technologyEnergy, visitedVillages, originalUnitPos]);

  return (
    <div id="game-root" className="relative w-screen h-screen overflow-hidden bg-stone-950 text-stone-100 flex flex-col font-sans scanlines">
      {/* 1. 游戏标题开场画面 (Title Screen) */}
      {mode === 'title' && (
        <div id="title-screen" className="relative flex-1 flex flex-col items-center justify-center p-4 md:p-6 bg-radial from-amber-950/70 via-stone-950 to-black select-none overflow-y-auto gba-scroll">
          <div className="text-center max-w-3xl animate-fade-in my-auto py-4">
            {/* 桃园结义史诗像素主视觉 Banner */}
            <div className="relative mx-auto mb-4 w-full max-w-xl rounded-lg overflow-hidden border-2 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.25)] bg-stone-950">
              <img
                src={ART_ASSETS.titleBanner}
                alt="三国志·烈火之誓 桃园结义"
                className="w-full h-44 sm:h-52 md:h-60 object-cover pixelated"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-amber-300/90 drop-shadow">
                <span>玄霄 · 未来科技入三国</span>
                <span>演义主线 · 25场战役任务</span>
              </div>
            </div>

            <div className="text-xs md:text-sm font-bold tracking-widest text-amber-500 uppercase mb-1">
              未来穿越 · 科技战棋 · 名将协同
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-amber-400 pixel-font tracking-wider drop-shadow-2xl mb-3">
              三国志 · 烈火之誓
            </h1>
            <p className="text-stone-300 text-xs md:text-sm leading-relaxed mb-5 max-w-xl mx-auto">
              你是从未来穿越而来的玄霄，初入乱世，孤身无兵。
              操作科技装备，与自主行动的三国名将并肩作战；积累战功、晋升军职、招揽部曲，助刘备逐鹿三国。
              主线遵循《三国演义》，英雄的抉择与结局依旧。
            </p>

            {/* 名将头像展示廊 (三国群英像素立绘预览 - 移动端顺滑横滑) */}
            <div className="flex items-center justify-start sm:justify-center gap-2 mb-5 p-2 rounded-lg bg-[#140e0a]/90 border border-amber-500/40 max-w-xl mx-auto overflow-x-auto whitespace-nowrap scrollbar-none shadow-inner">
              {[
                { id: 'liubei', name: '刘备' },
                { id: 'guanyu', name: '关羽' },
                { id: 'zhangfei', name: '张飞' },
                { id: 'zhaoyun', name: '赵云' },
                { id: 'zhugeliang', name: '诸葛亮' },
                { id: 'lubu', name: '吕布' },
                { id: 'diaochan', name: '貂蝉' },
                { id: 'caocao', name: '曹操' },
                { id: 'dongzhuo', name: '董卓' },
                { id: 'protagonist', name: '玄霄' },
              ].map((hero) => (
                <div key={hero.id} className="flex flex-col items-center flex-shrink-0 group px-1" title={hero.name}>
                  <img
                    src={getPortraitDataUrl(hero.id, 'normal')}
                    alt={hero.name}
                    className="w-9 h-9 sm:w-11 sm:h-11 object-cover pixelated rounded border border-amber-500/60 bg-stone-950 transition-transform group-hover:scale-110 shadow"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <span className="text-[10px] text-amber-200 mt-1 font-bold">{hero.name}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto relative z-20">
              <button
                id="start-game-btn"
                onClick={() => {
                  try {
                    audio.playMenuConfirm();
                    audio.startBgm('heroic');
                  } catch (err) {
                    console.warn(err);
                  }
                  generationRef.current++;
                  setCurrentStageIndex(0);
                  setParty(getInitialPartyUnits());
                  setMerit(0);
                  setCompletedStages([]);
                  setGold(1200);
                  setBattleUnits([]);
                  setMode('prep');
                }}
                className="w-full sm:w-auto px-6 py-3 gba-btn font-bold text-base text-amber-100 tracking-widest cursor-pointer shadow-xl active:scale-95 min-h-[44px]"
              >
                玄霄入世 · 开始
              </button>
              <button
                id="load-game-btn"
                onClick={() => {
                  try {
                    audio.playMenuConfirm();
                    audio.startBgm('heroic');
                  } catch (err) {
                    console.warn(err);
                  }
                  setSaveLoadMode('load');
                }}
                className="w-full sm:w-auto px-6 py-3 gba-window font-bold text-base text-amber-300 hover:text-amber-100 border border-amber-500/50 cursor-pointer active:scale-95 min-h-[44px]"
              >
                往昔卷宗 (读档)
              </button>
              <button
                id="open-design-doc-btn"
                onClick={() => {
                  try {
                    audio.playMenuConfirm();
                  } catch (err) {
                    console.warn(err);
                  }
                  setShowDesignDoc(true);
                }}
                className="w-full sm:w-auto px-6 py-3 gba-window font-bold text-base text-stone-300 hover:text-amber-200 border border-stone-700 cursor-pointer active:scale-95 min-h-[44px]"
              >
                策划白皮书
              </button>
            </div>

            <div className="mt-5 text-xs text-stone-400 flex items-center justify-center space-x-4">
              <span>25场任务 · 初始无下属 · 战功晋升</span>
              <span>•</span>
              <span>三国纯正像素美术与复古和弦引擎</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. 战前整备界面 (Prep Screen) */}
      {mode === 'prep' && (
        <PrepScreen
          key={currentStage.id}
          stage={currentStage}
          party={party}
          gold={gold}
          merit={merit}
          onSave={() => setSaveLoadMode('save')}
          onRecruit={(typeId) => {
            const result = recruitTroop(party, merit, gold, typeId, currentStage.chapterNumber);
            if (result) { setParty(result.party); setGold(result.gold); }
          }}
          onUpdateParty={setParty}
          onUpdateGold={setGold}
          onStartBattle={(selectedUnits) => {
            initStage(currentStage, selectedUnits);
          }}
        />
      )}

      {/* 3. 战场主画面 (Battlefield Screen) */}
      {(mode === 'battle' || mode === 'dialogue') && (
        <div id="battlefield-container" className="relative flex-1 flex flex-col justify-between overflow-hidden">
          {/* 顶部战况状态栏 (适配移动端紧凑与自适应分栏) */}
          <header className="gba-window px-2 sm:px-4 py-1.5 sm:py-2 flex flex-wrap items-center justify-between border-b border-amber-600/50 text-xs z-20 gap-1.5">
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              <span className="font-bold text-amber-300 font-mono text-[11px] sm:text-xs">
                {currentStage.title}
              </span>
              <span className="bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-200 font-bold text-[10px] sm:text-xs font-mono">
                R{currentTurn}
              </span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${
                  phase === 'player' ? 'bg-blue-900/90 text-blue-200 border border-blue-400'
                    : phase === 'ally' ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-400'
                    : 'bg-red-900/90 text-red-200 border border-red-400'
                }`}
              >
                {phase === 'player' ? '玄霄军行动' : phase === 'ally' ? '友军行动' : '敌军行动'}
              </span>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
              {phase === 'player' && (
                <button
                  id="end-player-turn-btn"
                  onClick={handleManualEndTurn}
                  className="px-2.5 py-1 min-h-[34px] bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 border border-amber-400 text-amber-100 font-bold rounded cursor-pointer text-[11px] active:scale-95 shadow"
                >
                  结回合
                </button>
              )}
              <button
                onClick={() => setShowDangerZone((prev) => !prev)}
                className={`px-2 py-1 min-h-[34px] rounded font-bold cursor-pointer border text-[11px] active:scale-95 ${
                  showDangerZone
                    ? 'bg-red-800 border-red-400 text-stone-100'
                    : 'bg-stone-900 border-stone-700 text-stone-300'
                }`}
                title="显示敌军威胁红格"
              >
                {showDangerZone ? '判敌:开' : '判敌'}
              </button>
              <button
                onClick={() => setShowControls((prev) => !prev)}
                className={`px-2 py-1 min-h-[34px] rounded font-bold cursor-pointer border text-[11px] active:scale-95 ${
                  showControls
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-200'
                    : 'bg-stone-900 border-stone-700 text-stone-400'
                }`}
                title="展开/隐藏虚拟手柄"
              >
                手柄
              </button>
              <button
                onClick={() => setSaveLoadMode('save')}
                className="px-2 py-1 min-h-[34px] bg-stone-900 hover:bg-stone-800 text-stone-200 rounded border border-stone-700 cursor-pointer text-[11px] active:scale-95"
              >
                存档
              </button>
              <button
                onClick={() => setShowDebug(true)}
                className="px-1.5 py-1 min-h-[34px] bg-purple-950/80 hover:bg-purple-900 text-purple-300 rounded border border-purple-700 cursor-pointer text-[11px] font-bold active:scale-95"
              >
                秘籍
              </button>
              <button
                onClick={() => setShowDesignDoc(true)}
                className="px-1.5 py-1 min-h-[34px] bg-stone-900 hover:bg-stone-800 text-stone-300 rounded border border-stone-700 cursor-pointer text-[11px] active:scale-95"
              >
                卷宗
              </button>
              <button
                onClick={() => audio.toggleMute()}
                className="px-1.5 py-1 min-h-[34px] bg-stone-900 hover:bg-stone-800 text-stone-300 rounded border border-stone-700 cursor-pointer text-[11px] active:scale-95"
              >
                音效
              </button>
            </div>
          </header>

          <div className="px-3 py-2 bg-stone-950 text-xs border-b border-stone-700 flex flex-wrap items-center gap-2">
            <span className="text-amber-200">{currentStage.subtitle} · {currentStage.objective}</span>
            <span className="text-cyan-200">终端能量 {technologyEnergy}/{TECHNOLOGY_ENERGY}</span>
            {(['first_aid', 'pulse'] as const).map((ability) => (
              <button key={ability} disabled={phase !== 'player' || mode !== 'battle' || technologyEnergy < 2 || !battleUnits.some((unit) => unit.characterId === 'protagonist' && unit.isAlive && !unit.hasActed)}
                onClick={() => setTechnologyAbility(technologyAbility === ability ? null : ability)}
                className={`px-2 py-1 border rounded cursor-pointer disabled:opacity-40 ${technologyAbility === ability ? 'border-cyan-300 bg-cyan-900' : 'border-stone-600'}`}>
                {ability === 'first_aid' ? '纳米急救 +15' : '脉冲压制 -8'} · 2能量
              </button>
            ))}
            {technologyAbility && <span className="text-cyan-300">点击玄霄三格内的{technologyAbility === 'first_aid' ? '受伤己方或友军' : '敌军'}；消耗玄霄行动。再次点按钮取消。</span>}
          </div>

          {/* 阶段大横幅提示 */}
          {phaseBanner && (
            <div className="absolute inset-x-0 top-1/3 z-40 flex items-center justify-center pointer-events-none">
              <div className="bg-black/90 border-y-4 border-amber-500 py-3 px-12 text-2xl md:text-3xl font-black pixel-font text-amber-300 shadow-2xl tracking-widest animate-bounce">
                {phaseBanner}
              </div>
            </div>
          )}

          {/* 棋盘主渲染区 */}
          <div className="flex-1 relative flex items-center justify-center">
            <GameCanvas
              stage={currentStage}
              units={battleUnits}
              selectedUnit={selectedUnit}
              cursorPos={cursorPos}
              movementRange={movementRange}
              attackRange={attackRange}
              dangerZone={dangerZone}
              showDangerZone={showDangerZone}
              onTileClick={handleTileClick}
              onCursorChange={(x, y) => setCursorPos({ x, y })}
            />

            {/* 行动指令弹出菜单 (GBA 经典右侧弹出菜单) */}
            {actionMenu && (
              <div
                className="absolute z-30 gba-window p-2 rounded shadow-2xl border-2 border-amber-400 min-w-[120px]"
                style={{
                  left: `${Math.min(window.innerWidth - 135, Math.max(10, cursorPos.x * 32 + 36))}px`,
                  top: `${Math.min(window.innerHeight - 230, Math.max(50, cursorPos.y * 32 - 20))}px`,
                }}
              >
                <div className="text-[10px] text-amber-400 font-bold border-b border-amber-500/30 pb-1 mb-1 text-center">
                  行动军令
                </div>
                <div className="space-y-1 text-xs">
                  {actionMenu.options.includes('attack') && (
                    <button
                      onClick={() => handleActionSelect('attack')}
                      className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded bg-red-950/80 hover:bg-red-800 text-red-200 font-bold cursor-pointer active:scale-95 flex items-center"
                    >
                      ⚔ 攻击
                    </button>
                  )}
                  {actionMenu.options.includes('visit') && (
                    <button
                      onClick={() => handleActionSelect('visit')}
                      className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-200 font-bold cursor-pointer active:scale-95 flex items-center"
                    >
                      🏡 访问
                    </button>
                  )}
                  {actionMenu.options.includes('seize') && (
                    <button
                      onClick={() => handleActionSelect('seize')}
                      className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded bg-amber-900 hover:bg-amber-700 text-amber-200 font-bold cursor-pointer active:scale-95 flex items-center"
                    >
                      👑 制压
                    </button>
                  )}
                  {actionMenu.options.includes('item') && (
                    <button
                      onClick={() => handleActionSelect('item')}
                      className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded bg-blue-950/80 hover:bg-blue-800 text-blue-200 font-bold cursor-pointer active:scale-95 flex items-center"
                    >
                      🧪 道具
                    </button>
                  )}
                  {actionMenu.options.includes('wait') && (
                    <button
                      onClick={() => handleActionSelect('wait')}
                      className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded hover:bg-stone-800 text-stone-200 cursor-pointer active:scale-95 flex items-center"
                    >
                      🛡 待机
                    </button>
                  )}
                  <button
                    onClick={() => handleActionSelect('cancel')}
                    className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded text-stone-400 hover:bg-stone-800 cursor-pointer active:scale-95 flex items-center"
                  >
                    ✕ 取消
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 虚拟按键条 */}
          {showControls && (
            <GbaControls
              onDirection={(dx, dy) => {
                setCursorPos((prev) => ({
                  x: Math.max(0, Math.min(currentStage.mapWidth - 1, prev.x + dx)),
                  y: Math.max(0, Math.min(currentStage.mapHeight - 1, prev.y + dy)),
                }));
              }}
              onA={() => handleTileClick(cursorPos.x, cursorPos.y)}
              onB={() => {
                if (actionMenu) {
                  handleActionSelect('cancel');
                } else {
                  setSelectedUnit(null);
                  setMovementRange(new Map());
                  setAttackRange(new Set());
                  setTargetingEnemies([]);
                }
              }}
              onL={() => {
                const playerUnits = battleUnits.filter((u) => u.isAlive && u.faction === Faction.Player && !u.hasActed);
                if (playerUnits.length > 0) {
                  setCursorPos({ x: playerUnits[0].x, y: playerUnits[0].y });
                }
              }}
              onR={() => {
                const enemies = battleUnits.filter((u) => u.isAlive && u.faction === Faction.Enemy);
                if (enemies.length > 0) {
                  setCursorPos({ x: enemies[0].x, y: enemies[0].y });
                }
              }}
              onStart={handleManualEndTurn}
              onSelect={() => setShowDangerZone((prev) => !prev)}
            />
          )}
        </div>
      )}

      {/* 4. 剧情对话弹窗 (Dialogue Box) */}
      {mode === 'dialogue' && activeDialogue && (
        <DialogueBox
          dialogue={activeDialogue}
          onComplete={() => {
            setActiveDialogue(null);
            if (onDialogueFinishCallback) {
              onDialogueFinishCallback();
              setOnDialogueFinishCallback(null);
            }
          }}
        />
      )}

      {/* 5. GBA 1v1 格斗特写战斗视窗 (Combat Duel Arena) */}
      {mode === 'combat_duel' && activeCombat && (
        <CombatArena
          key={`${currentTurn}_${activeCombat.attacker.id}_${activeCombat.defender.id}`}
          attacker={activeCombat.attacker}
          defender={activeCombat.defender}
          distance={activeCombat.distance}
          attackerTerrain={currentStage.terrainGrid[activeCombat.attacker.y]?.[activeCombat.attacker.x]}
          defenderTerrain={currentStage.terrainGrid[activeCombat.defender.y]?.[activeCombat.defender.x]}
          onFinishCombat={handleFinishCombat}
        />
      )}

      {/* 6. 升级弹窗 (Level Up Modal) */}
      {levelUpData && (
        <LevelUpModal
          unit={levelUpData.unit}
          gain={levelUpData.gain}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {/* 任务结算以局部目标为准，撤退任务不能写成历史战役大捷。 */}
      {mode === 'stage_clear' && (
        <div id="stage-clear-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none">
          <div className="gba-window w-full max-w-lg p-6 rounded-md border-4 border-amber-400 text-center shadow-2xl animate-scale-up">
            <h2 className="text-3xl font-black text-amber-300 pixel-font tracking-widest mb-2">
              ★ 任 务 达 成 ★
            </h2>
            <div className="text-sm font-bold text-amber-200/90 mb-4">
              {currentStage.title} · {currentStage.subtitle}
            </div>
            <div className="p-4 bg-stone-900 rounded border border-amber-500/30 text-xs space-y-2 mb-6 font-mono">
              <div className="flex justify-between">
                <span className="text-stone-300">战斗回合:</span>
                <span className="text-amber-300 font-bold">{currentTurn} 回合</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-300">任务结果:</span>
                <span className="text-amber-300 font-bold">局部任务完成</span>
              </div>
              <div className="text-cyan-200">战功 +{currentStage.meritReward} · 当前{getMilitaryRank(merit).name} · 可统领{getMilitaryRank(merit).capacity}支部队</div>
              <p className="text-stone-300 leading-relaxed">{currentStage.historicalNote}</p>
              <div className="flex justify-between">
                <span className="text-stone-300">赏金入库:</span>
                <span className="text-green-400 font-bold">+1500 金</span>
              </div>
            </div>

            <button
              id="next-stage-btn"
              onClick={proceedToNextStage}
              className="w-full py-3 gba-btn font-bold text-amber-100 text-sm tracking-widest cursor-pointer"
            >
              整军备战 · 下一战役 ▶
            </button>
          </div>
        </div>
      )}

      {/* 8. 战败画面 (Game Over Screen) */}
      {mode === 'game_over' && (
        <div id="game-over-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none">
          <div className="gba-window w-full max-w-md p-6 rounded-md border-4 border-red-600 text-center shadow-2xl">
            <h2 className="text-3xl font-black text-red-500 pixel-font tracking-widest mb-2">
              全 军 溃 败
            </h2>
            <p className="text-xs text-stone-300 mb-6">
              主将饮恨沙场，汉室风云未定……胜败乃兵家常事，大侠请重新来过！
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  initStage(currentStage);
                }}
                className="w-full py-2.5 bg-red-900 hover:bg-red-800 text-stone-100 font-bold rounded cursor-pointer text-sm"
              >
                重整旗鼓 (重玩本关)
              </button>
              <button
                onClick={() => setSaveLoadMode('load')}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded cursor-pointer text-sm"
              >
                读取往昔存档
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 演义终章与三分归晋的后世尾声。 */}
      {mode === 'victory_ending' && (
        <div id="victory-ending-screen" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950 p-6 select-none overflow-y-auto">
          <div className="max-w-2xl text-center space-y-6 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-black text-amber-400 pixel-font tracking-widest">
              烈 火 留 誓
            </h2>
            <p className="text-sm md:text-base text-amber-200/90 leading-relaxed">
              玄霄的征程止于五丈秋风，后世的史卷仍继续展开。
              <br />
              诸葛亮病逝，姜维继志；蜀汉终亡，魏为晋代，东吴亦降，三分归晋。
              <br />
              你未能替英雄改写归宿，却在乱世里护住了一些人，守住了与玄德同行的誓言。
            </p>
            <div className="p-4 bg-stone-900/80 rounded-md border border-amber-500/40 text-xs text-stone-300 space-y-2">
              <div className="text-amber-300 font-bold">完成任务 {completedStages.length}/{ALL_STAGES.length} · 战功 {merit} · {getMilitaryRank(merit).name}</div>
              <div>感谢体验《三国志·烈火之誓》玄霄征程。</div>
            </div>
            <button
              onClick={() => setMode('title')}
              className="px-8 py-3 gba-btn font-bold text-amber-100 text-sm tracking-widest cursor-pointer shadow-2xl"
            >
              返回游戏主界面
            </button>
          </div>
        </div>
      )}

      {/* 存档/读档弹窗 */}
      {saveLoadMode && (
        <SaveLoadModal
          mode={saveLoadMode}
          currentStage={currentStage}
          currentTurn={currentTurn}
          currentGold={mode === 'prep' ? gold : stageStartGoldRef.current}
          currentParty={mode === 'prep' ? party : stageStartPartyRef.current}
          merit={merit}
          completedStages={completedStages}
          casualMode={casualMode}
          onClose={() => setSaveLoadMode(null)}
          onLoadData={(data: SaveSlotData) => {
            const idx = ALL_STAGES.findIndex((s) => s.id === data.stageId);
            if (idx >= 0) setCurrentStageIndex(idx);
            setParty(data.party);
            setGold(data.gold);
            setMerit(data.merit);
            setCompletedStages(data.completedStages);
            setCasualMode(data.casualMode);
            generationRef.current++;
            resolutionRef.current = true;
            setActiveCombat(null);
            setActiveDialogue(null);
            setMode('prep');
          }}
        />
      )}

      {/* 开发者秘籍调试台 */}
      {showDebug && (
        <DebugPanel
          currentStage={currentStage}
          party={party}
          gold={gold}
          casualMode={casualMode}
          onClose={() => setShowDebug(false)}
          onJumpStage={(stg) => {
            const idx = ALL_STAGES.findIndex((s) => s.id === stg.id);
            if (idx >= 0) setCurrentStageIndex(idx);
            initStage(stg);
          }}
          onWinStage={() => handleStageVictoryFinish()}
          onUpdateParty={setParty}
          onUpdateGold={setGold}
          onToggleCasualMode={() => setCasualMode((prev) => !prev)}
        />
      )}

      {/* 策划设计案文档 */}
      {showDesignDoc && <DesignDocModal onClose={() => setShowDesignDoc(false)} />}
    </div>
  );
}
