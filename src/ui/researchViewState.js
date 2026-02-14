export function buildActiveResearchViewModel(researchState, researchDefinitions, percentFn) {
  if (!researchState?.current) {
    return null;
  }

  const tech = researchDefinitions[researchState.current];
  if (!tech) {
    return null;
  }

  const progress = percentFn(researchState.progress, tech.time);
  return {
    id: researchState.current,
    name: tech.name,
    progress,
  };
}

export function buildResearchOptionViewModels({
  state,
  researchDefinitions,
  getAvailableResearch,
}) {
  const options = getAvailableResearch(state, researchDefinitions);
  const completed = new Set(state.research.completed);
  return options
    .filter((item) => state.research.current !== item.id && !completed.has(item.id))
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      cost: item.cost,
      disabled: state.resources.knowledge < item.cost || !!state.research.current,
    }));
}

