import { RESEARCH_DEFINITIONS } from '../content/research.js';

export function canStartResearch(state, techId) {
  const tech = RESEARCH_DEFINITIONS[techId];
  if (!tech) {
    return { ok: false, reason: 'Unknown technology.' };
  }
  if (state.research.current) {
    return { ok: false, reason: 'Research already in progress.' };
  }
  if (state.research.completed.includes(techId)) {
    return { ok: false, reason: 'Technology already researched.' };
  }

  const unmet = tech.prerequisites.filter((prereq) => !state.research.completed.includes(prereq));
  if (unmet.length > 0) {
    return { ok: false, reason: `Missing prerequisite: ${unmet[0]}` };
  }

  if (state.resources.knowledge < tech.cost) {
    return { ok: false, reason: 'Not enough knowledge.' };
  }

  return { ok: true };
}

export function startResearch(state, techId) {
  const check = canStartResearch(state, techId);
  if (!check.ok) {
    return { ok: false, message: check.reason };
  }

  const tech = RESEARCH_DEFINITIONS[techId];
  state.resources.knowledge -= tech.cost;
  state.research.current = techId;
  state.research.progress = 0;
  return { ok: true, tech };
}

export function runResearchSystem(context) {
  const { state, deltaSeconds, emit } = context;
  if (!state.research.current) {
    return;
  }

  const tech = RESEARCH_DEFINITIONS[state.research.current];
  const scholars = state.colonists.filter(
    (colonist) => colonist.alive && colonist.job === 'scholar' && colonist.task === 'Working',
  ).length;
  const researchRate = 0.5 + scholars * 0.45;

  state.research.progress += deltaSeconds * researchRate;
  if (state.research.progress < tech.time) {
    return;
  }

  state.research.completed.push(tech.id);
  state.metrics.researchCompleted += 1;
  state.research.current = null;
  state.research.progress = 0;
  emit('research-complete', {
    kind: 'success',
    message: `${tech.name} researched successfully.`,
  });
}
