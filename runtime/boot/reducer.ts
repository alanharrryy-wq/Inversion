import { isEvidenceSatisfied } from '../evidence';
import { BootState, BootStateReducerAction } from './types';

export function createInitialBootState(): BootState {
  return {
    status: 'IDLE',
    overrideEnabled: false,
    armedAtTs: null,
    pendingAtTs: null,
    operatorAssistedSinceTs: null,
    lastAction: null,
  };
}

function setStatus(state: BootState, status: BootState['status'], lastAction: string): BootState {
  return {
    ...state,
    status,
    lastAction,
  };
}

export function reduceBootState(state: BootState, action: BootStateReducerAction): BootState {
  if (action.type === 'BOOT_RESET') {
    return {
      ...createInitialBootState(),
      lastAction: 'boot:local:reset',
    };
  }

  if (action.type === 'BOOT_ARM_REQUEST') {
    if (state.status === 'ARMED_CONFIRMED') {
      return { ...state, lastAction: 'boot:arm:requested' };
    }

    if (state.status === 'ARMED_PENDING_CONFIRM') {
      return { ...state, lastAction: 'boot:arm:requested' };
    }

    return {
      ...setStatus(state, 'ARMED_PENDING_CONFIRM', 'boot:arm:requested'),
      pendingAtTs: action.ts,
    };
  }

  if (action.type === 'BOOT_ARM_CONFIRM') {
    if (state.status !== 'ARMED_PENDING_CONFIRM' && state.status !== 'OPERATOR_ASSISTED') {
      return { ...state, lastAction: 'boot:arm:confirm:ignored' };
    }

    return {
      ...setStatus(state, 'ARMED_CONFIRMED', 'boot:arm:confirmed'),
      overrideEnabled: false,
      armedAtTs: action.ts,
      pendingAtTs: null,
      operatorAssistedSinceTs: null,
    };
  }

  if (action.type === 'BOOT_OVERRIDE_ENABLE') {
    if (state.status === 'ARMED_CONFIRMED') {
      return {
        ...state,
        overrideEnabled: true,
        lastAction: 'boot:override:enabled',
      };
    }

    return {
      ...setStatus(state, 'OPERATOR_ASSISTED', 'boot:override:enabled'),
      overrideEnabled: true,
      operatorAssistedSinceTs: action.ts,
      pendingAtTs: null,
    };
  }

  if (action.type === 'BOOT_OVERRIDE_DISABLE') {
    if (state.status === 'ARMED_CONFIRMED') {
      return {
        ...state,
        overrideEnabled: false,
        lastAction: 'boot:override:disabled',
      };
    }

    return {
      ...setStatus(state, 'IDLE', 'boot:override:disabled'),
      overrideEnabled: false,
      pendingAtTs: null,
      operatorAssistedSinceTs: null,
    };
  }

  if (action.type === 'BOOT_SYNC_WITH_EVIDENCE') {
    const evidenceArmed = isEvidenceSatisfied(action.evidence, 'evidence:system:armed');
    if (!evidenceArmed && state.status === 'ARMED_CONFIRMED') {
      if (state.overrideEnabled) {
        return {
          ...setStatus(state, 'OPERATOR_ASSISTED', 'boot:evidence:desync'),
          operatorAssistedSinceTs: action.evidence.lastEvent?.ts ?? state.operatorAssistedSinceTs,
        };
      }

      return {
        ...setStatus(state, 'IDLE', 'boot:evidence:desync'),
        armedAtTs: null,
        pendingAtTs: null,
      };
    }

    if (evidenceArmed && state.status !== 'ARMED_CONFIRMED') {
      return {
        ...setStatus(state, 'ARMED_CONFIRMED', 'boot:evidence:sync'),
        armedAtTs: action.evidence.entries['evidence:system:armed'].satisfiedAtTs,
        overrideEnabled: false,
        operatorAssistedSinceTs: null,
        pendingAtTs: null,
      };
    }

    return state;
  }

  return state;
}
