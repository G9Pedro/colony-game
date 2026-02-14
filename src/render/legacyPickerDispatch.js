import {
  buildLegacyEntityPickerInvocation,
  buildLegacyGroundPickerInvocation,
} from './legacyScreenPickerInvocation.js';
import { pickLegacyEntityAtClient, pickLegacyGroundAtClient } from './legacyScreenPickers.js';

export function dispatchLegacyGroundPick(renderer, clientX, clientY, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildLegacyGroundPickerInvocation;
  const pickAtClient = deps.pickAtClient ?? pickLegacyGroundAtClient;
  return pickAtClient(buildInvocation(renderer, clientX, clientY));
}

export function dispatchLegacyEntityPick(renderer, clientX, clientY, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildLegacyEntityPickerInvocation;
  const pickAtClient = deps.pickAtClient ?? pickLegacyEntityAtClient;
  return pickAtClient(buildInvocation(renderer, clientX, clientY));
}

