## Summary

- Describe the problem and the solution in 2-5 bullets.
- Command usage/details for checklist items: see `CONTRIBUTING.md`.
- First tuning PR? Start with **New Contributor Quick Start** in `CONTRIBUTING.md`.

## Validation

- [ ] `npm test`
- [ ] `npm run verify` (required for non-trivial gameplay/simulation changes)

## Tuning Changes (only if `src/content/scenarios.js` or tuning baselines changed)

- [ ] `npm run simulate:tuning:prepr`
- [ ] Reviewed `reports/scenario-tuning-dashboard.md`
- [ ] Reviewed `reports/scenario-tuning-trend.md`
- [ ] Reviewed `reports/scenario-tuning-baseline-suggestions.md`
- [ ] Updated committed tuning baselines intentionally (if suggestions were accepted)

## Risk / Rollout Notes

- Any migration, save-compatibility, or balancing risk?
- Any follow-up tasks needed after merge?
