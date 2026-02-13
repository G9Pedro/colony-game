import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { EventBus } from './eventBus.js';
import { cloneState, createColonist, createInitialState } from './state.js';
import { getPopulationCapacity, isBuildingUnlocked } from './selectors.js';
import { queueConstruction } from '../systems/constructionSystem.js';
import { runColonistSystem } from '../systems/colonistSystem.js';
import { runConstructionSystem } from '../systems/constructionSystem.js';
import { runEconomySystem } from '../systems/economySystem.js';
import { runResearchSystem, startResearch } from '../systems/researchSystem.js';
import { runObjectiveSystem } from '../systems/objectiveSystem.js';
import { runOutcomeSystem } from '../systems/outcomeSystem.js';
import { nextRandom } from './random.js';
import { getScenarioDefinition } from '../content/scenarios.js';
import { validateRuntimeState } from './stateInvariant.js';
import { migrateSaveState } from '../persistence/migrations.js';

const HIRE_COST_FOOD = 20;

export class GameEngine {
  constructor(initialStateOrOptions = {}) {
    this.initialOptions = this.isStateLike(initialStateOrOptions)
      ? { scenarioId: initialStateOrOptions.scenarioId ?? 'frontier' }
      : { scenarioId: 'frontier', ...initialStateOrOptions };
    this.state = this.isStateLike(initialStateOrOptions)
      ? initialStateOrOptions
      : createInitialState(initialStateOrOptions);
    this.eventBus = new EventBus();
    this.fixedStep = 0.2;
    this.accumulator = 0;
  }

  isStateLike(value) {
    return Boolean(value?.resources && value?.colonists && value?.buildings && value?.research);
  }

  on(eventName, handler) {
    return this.eventBus.on(eventName, handler);
  }

  emit(eventName, payload) {
    this.eventBus.emit(eventName, payload);
  }

  setSpeed(multiplier) {
    this.state.speed = Math.max(1, Math.min(multiplier, 4));
    this.emit('speed-change', { multiplier: this.state.speed });
  }

  togglePause() {
    this.state.paused = !this.state.paused;
    this.emit('pause-change', { paused: this.state.paused });
  }

  setSelectedCategory(category) {
    this.state.selectedCategory = category;
  }

  setSelectedBuildingType(buildingType) {
    this.state.selectedBuildingType = buildingType;
  }

  setScenario(scenarioId) {
    const scenario = getScenarioDefinition(scenarioId);
    this.initialOptions = {
      ...this.initialOptions,
      scenarioId: scenario.id,
    };
    this.reset();
    this.emit('scenario-change', {
      kind: 'warn',
      message: `Scenario switched to ${scenario.name}.`,
    });
  }

  update(deltaSeconds) {
    if (this.state.status !== 'playing' || this.state.paused) {
      return;
    }

    this.accumulator += deltaSeconds * this.state.speed;
    while (this.accumulator >= this.fixedStep) {
      this.step(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }
  }

  step(deltaSeconds) {
    this.state.tick += 1;
    this.state.timeSeconds += deltaSeconds;

    const context = {
      state: this.state,
      deltaSeconds,
      emit: (eventName, payload) => this.emit(eventName, payload),
    };

    runColonistSystem(context);
    runConstructionSystem(context);
    runEconomySystem(context);
    runResearchSystem(context);
    runObjectiveSystem(context);
    runOutcomeSystem(context);

    if (this.state.status === 'playing') {
      const invariants = validateRuntimeState(this.state);
      if (invariants.length > 0) {
        this.state.paused = true;
        this.emit('state-invalid', {
          kind: 'error',
          message: `State invariant violation: ${invariants[0]}`,
          details: invariants,
        });
      }
    }
  }

  queueBuilding(buildingId, x, z) {
    if (this.state.status !== 'playing') {
      return { ok: false, message: 'The game has ended. Reset to continue.' };
    }

    const buildingDefinition = BUILDING_DEFINITIONS[buildingId];
    if (!buildingDefinition) {
      return { ok: false, message: 'Unknown building type.' };
    }

    if (!isBuildingUnlocked(this.state, buildingDefinition)) {
      return { ok: false, message: `Requires ${buildingDefinition.requiredTech}.` };
    }

    const result = queueConstruction(this.state, buildingId, x, z);
    if (result.ok) {
      this.emit('construction-queued', {
        kind: 'success',
        message: `${buildingDefinition.name} added to construction queue.`,
      });
    }
    return result;
  }

  hireColonist() {
    if (this.state.status !== 'playing') {
      return { ok: false, message: 'Cannot hire after game end.' };
    }

    if (this.state.resources.food < HIRE_COST_FOOD) {
      return { ok: false, message: `Need ${HIRE_COST_FOOD} food to hire.` };
    }

    const alivePopulation = this.state.colonists.filter((colonist) => colonist.alive).length;
    const cap = getPopulationCapacity(this.state);
    if (alivePopulation >= cap) {
      return { ok: false, message: 'Insufficient housing capacity.' };
    }

    this.state.resources.food -= HIRE_COST_FOOD;
    const colonistId = this.state.nextEntityId++;
    const colonist = createColonist(colonistId, () => nextRandom(this.state));
    this.state.colonists.push(colonist);
    this.emit('colonist-hired', {
      kind: 'success',
      message: `${colonist.name} joined the colony.`,
    });
    return { ok: true, colonist };
  }

  beginResearch(techId) {
    if (this.state.status !== 'playing') {
      return { ok: false, message: 'Cannot research after game end.' };
    }

    const result = startResearch(this.state, techId);
    if (!result.ok) {
      return result;
    }

    this.emit('research-started', {
      kind: 'success',
      message: `Started research: ${result.tech.name}.`,
    });
    return result;
  }

  reset() {
    this.state = createInitialState(this.initialOptions);
    this.accumulator = 0;
    this.emit('game-reset', {
      kind: 'warn',
      message: 'Started a new colony.',
    });
  }

  loadState(nextState) {
    const migrated = migrateSaveState(nextState);
    const invariants = validateRuntimeState(migrated);
    if (invariants.length > 0) {
      this.emit('state-invalid', {
        kind: 'error',
        message: `Loaded save failed runtime invariants: ${invariants[0]}`,
        details: invariants,
      });
      return { ok: false, message: invariants[0] };
    }

    this.state = migrated;
    this.initialOptions = {
      ...this.initialOptions,
      scenarioId: migrated.scenarioId,
      seed: migrated.rngSeed,
    };
    this.accumulator = 0;
    this.emit('state-loaded', {
      kind: 'success',
      message: 'Save loaded successfully.',
    });
    return { ok: true };
  }

  snapshot() {
    return cloneState(this.state);
  }
}
