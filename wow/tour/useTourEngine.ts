import { useEffect, useMemo, useState } from 'react';
import { WOW_GUIDE_ENGINE } from '../../config/wow';
import {
  DEFAULT_GUIDE_SCRIPT_ID,
  GuideOverlayModel,
  GuideRuntimeAction,
  GuideRuntimeContext,
  GuideRuntimeState,
  GuideScript,
  onGuideEvidence,
  reduceGuideRuntimeState,
  resolveGuideScript,
  selectOverlayModel,
  selectStepResolution,
  initialGuideRuntimeState,
  toTourState,
} from './guide';
import { bindStepDomEvents, onTourEvent, hasTourTarget } from './events';
import { findTourScript } from './registry';
import { CompletionRule, TourApi, TourEvent, TourState } from './types';

type GuideSession = {
  script: GuideScript;
  runtime: GuideRuntimeState;
};

function matchesWhere(payload: Record<string, unknown> | undefined, where: Record<string, unknown>): boolean {
  if (!payload) return false;
  return Object.entries(where).every(([key, value]) => payload[key] === value);
}

function countEvent(events: TourEvent[], name: string, where?: Record<string, unknown>): number {
  return events.filter((event) => {
    if (event.name !== name) return false;
    if (!where) return true;
    return matchesWhere(event.payload, where);
  }).length;
}

function isRuleComplete(rule: CompletionRule, events: TourEvent[], currentSlide: number): boolean {
  if (rule.type === 'manual') return false;
  if (rule.type === 'slide') return currentSlide === rule.slide;
  if (rule.type === 'event') return countEvent(events, rule.name, rule.where) >= (rule.count ?? 1);
  if (rule.type === 'all') return rule.rules.every((child) => isRuleComplete(child, events, currentSlide));
  if (rule.type === 'any') return rule.rules.some((child) => isRuleComplete(child, events, currentSlide));
  return false;
}

function initialLegacyState(): TourState {
  return {
    status: 'idle',
    scriptId: null,
    scriptTitle: '',
    stepIndex: 0,
    steps: [],
    completedStepIds: [],
    eventLog: [],
  };
}

function deriveCompletionEventName(rule: CompletionRule): string | null {
  if (rule.type === 'event') return rule.name;
  if (rule.type === 'all' || rule.type === 'any') {
    for (const child of rule.rules) {
      const eventName = deriveCompletionEventName(child);
      if (eventName) return eventName;
    }
  }
  return null;
}

function createGuideSession(scriptId: string | undefined, currentSlide: number): GuideSession {
  const script = resolveGuideScript(scriptId ?? DEFAULT_GUIDE_SCRIPT_ID);
  const runtime = {
    ...initialGuideRuntimeState(script.id),
    currentSlide,
    scriptId: script.id,
  };
  return { script, runtime };
}

function createGuideContext(): GuideRuntimeContext {
  return {
    targetExists: (selector?: string) => hasTourTarget(selector),
    now: () => Date.now(),
  };
}

function dispatchGuideAction(args: {
  previous: GuideSession;
  action: GuideRuntimeAction;
  preferredScriptId?: string;
  currentSlide: number;
}): GuideSession {
  const { previous, action, preferredScriptId, currentSlide } = args;

  let scriptId = previous.runtime.scriptId ?? previous.script.id;
  if (action.type === 'START' || action.type === 'RESTART') {
    scriptId = action.scriptId;
  } else if (preferredScriptId) {
    scriptId = preferredScriptId;
  }

  const script = resolveGuideScript(scriptId || DEFAULT_GUIDE_SCRIPT_ID);
  const runtimeSeed: GuideRuntimeState = {
    ...previous.runtime,
    currentSlide,
  };

  const nextRuntime = reduceGuideRuntimeState(script, runtimeSeed, action, createGuideContext());
  const nextScript = resolveGuideScript(nextRuntime.scriptId ?? script.id);
  return {
    script: nextScript,
    runtime: nextRuntime,
  };
}

export function useTourEngine(params: {
  enabled: boolean;
  currentSlide: number;
  scriptId?: string;
}) {
  const { enabled, currentSlide, scriptId } = params;

  const [legacyState, setLegacyState] = useState<TourState>(initialLegacyState);
  const [guideSession, setGuideSession] = useState<GuideSession>(() => createGuideSession(scriptId, currentSlide));

  const guideResolution = useMemo(() => {
    if (!WOW_GUIDE_ENGINE) return null;
    return selectStepResolution(guideSession.script, guideSession.runtime, createGuideContext());
  }, [guideSession.runtime, guideSession.script]);

  const guideOverlayModel: GuideOverlayModel | null = useMemo(() => {
    if (!WOW_GUIDE_ENGINE) return null;
    return selectOverlayModel(guideSession.script, guideSession.runtime, createGuideContext());
  }, [guideSession.runtime, guideSession.script]);

  const state = useMemo(() => {
    if (!WOW_GUIDE_ENGINE) return legacyState;
    return toTourState(guideSession.script, guideSession.runtime);
  }, [legacyState, guideSession]);

  const activeStep = useMemo(() => state.steps[state.stepIndex] ?? null, [state.stepIndex, state.steps]);

  const completeLegacyIfNeeded = (nextState: TourState, forcedSlide = currentSlide): TourState => {
    const step = nextState.steps[nextState.stepIndex];
    if (!step || nextState.status !== 'running') return nextState;

    const complete = isRuleComplete(step.completion, nextState.eventLog, forcedSlide);
    if (!complete) return nextState;

    const completedIds = nextState.completedStepIds.includes(step.id)
      ? nextState.completedStepIds
      : [...nextState.completedStepIds, step.id];

    const lastStep = nextState.stepIndex >= nextState.steps.length - 1;
    if (lastStep) {
      return { ...nextState, completedStepIds: completedIds, status: 'completed' };
    }

    return {
      ...nextState,
      completedStepIds: completedIds,
      stepIndex: nextState.stepIndex + 1,
    };
  };

  const api: TourApi = useMemo(
    () => ({
      start: (requestedScriptId?: string) => {
        if (!enabled) return;

        if (WOW_GUIDE_ENGINE) {
          setGuideSession((prev) =>
            dispatchGuideAction({
              previous: prev,
              action: {
                type: 'START',
                scriptId: requestedScriptId ?? scriptId ?? DEFAULT_GUIDE_SCRIPT_ID,
                ts: Date.now(),
              },
              preferredScriptId: requestedScriptId ?? scriptId,
              currentSlide,
            })
          );
          return;
        }

        const script = findTourScript(requestedScriptId ?? scriptId);
        const nextState: TourState = {
          status: 'running',
          scriptId: script.id,
          scriptTitle: script.title,
          stepIndex: 0,
          steps: script.steps,
          completedStepIds: [],
          eventLog: [{ name: 'tour:started', payload: { scriptId: script.id }, ts: Date.now() }],
        };
        setLegacyState(completeLegacyIfNeeded(nextState));
      },
      next: () => {
        if (WOW_GUIDE_ENGINE) {
          setGuideSession((prev) => {
            const step = prev.script.steps[prev.runtime.stepIndex];
            return dispatchGuideAction({
              previous: prev,
              action: {
                type: 'NEXT',
                ts: Date.now(),
                allowIncomplete: Boolean(step?.allowNextBeforeComplete || step?.fallbackAllowNext),
              },
              preferredScriptId: scriptId,
              currentSlide,
            });
          });
          return;
        }

        setLegacyState((prev) => {
          if (prev.status !== 'running') return prev;
          const current = prev.steps[prev.stepIndex];
          const isComplete = current ? isRuleComplete(current.completion, prev.eventLog, currentSlide) : false;
          if (!isComplete && !current?.allowNextBeforeComplete && !current?.fallbackAllowNext) return prev;
          if (prev.stepIndex >= prev.steps.length - 1) return { ...prev, status: 'completed' };
          return { ...prev, stepIndex: prev.stepIndex + 1 };
        });
      },
      back: () => {
        if (WOW_GUIDE_ENGINE) {
          setGuideSession((prev) =>
            dispatchGuideAction({
              previous: prev,
              action: { type: 'BACK', ts: Date.now() },
              preferredScriptId: scriptId,
              currentSlide,
            })
          );
          return;
        }

        setLegacyState((prev) => {
          if (prev.status !== 'running') return prev;
          return { ...prev, stepIndex: Math.max(0, prev.stepIndex - 1) };
        });
      },
      skip: () => {
        if (WOW_GUIDE_ENGINE) {
          setGuideSession((prev) =>
            dispatchGuideAction({
              previous: prev,
              action: { type: 'SKIP', ts: Date.now() },
              preferredScriptId: scriptId,
              currentSlide,
            })
          );
          return;
        }
        setLegacyState((prev) => ({ ...prev, status: 'completed' }));
      },
      stop: () => {
        if (WOW_GUIDE_ENGINE) {
          setGuideSession((prev) =>
            dispatchGuideAction({
              previous: prev,
              action: { type: 'STOP', ts: Date.now() },
              preferredScriptId: scriptId,
              currentSlide,
            })
          );
          return;
        }

        setLegacyState(initialLegacyState());
      },
      emit: (eventName: string, payload?: Record<string, unknown>) => {
        if (WOW_GUIDE_ENGINE) {
          setGuideSession((prev) =>
            dispatchGuideAction({
              previous: prev,
              action: {
                type: 'EVIDENCE_CAPTURED',
                event: { name: eventName, payload, ts: Date.now() },
              },
              preferredScriptId: scriptId,
              currentSlide,
            })
          );
          return;
        }

        setLegacyState((prev) => {
          if (prev.status !== 'running') return prev;
          const next: TourState = {
            ...prev,
            eventLog: [...prev.eventLog, { name: eventName, payload, ts: Date.now() }],
          };
          return completeLegacyIfNeeded(next);
        });
      },
    }),
    [enabled, scriptId, currentSlide]
  );

  useEffect(() => {
    if (!enabled) {
      setLegacyState(initialLegacyState());
      setGuideSession(createGuideSession(scriptId, currentSlide));
    }
  }, [enabled, scriptId, currentSlide]);

  useEffect(() => {
    if (!enabled || !WOW_GUIDE_ENGINE) return;
    setGuideSession((prev) => {
      if (prev.runtime.status === 'running') return prev;
      const script = resolveGuideScript(scriptId ?? prev.script.id);
      return {
        script,
        runtime: {
          ...prev.runtime,
          scriptId: script.id,
          currentSlide,
        },
      };
    });
  }, [enabled, scriptId, currentSlide]);

  useEffect(() => {
    if (!enabled) return;
    if (WOW_GUIDE_ENGINE) {
      setGuideSession((prev) =>
        dispatchGuideAction({
          previous: prev,
          action: { type: 'SLIDE_CHANGED', slide: currentSlide, ts: Date.now() },
          preferredScriptId: scriptId,
          currentSlide,
        })
      );
      return;
    }
    if (legacyState.status !== 'running') return;
    setLegacyState((prev) => completeLegacyIfNeeded(prev, currentSlide));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, enabled, legacyState.status, scriptId]);

  useEffect(() => {
    if (!enabled) return;
    return onTourEvent((name, payload) => {
      api.emit(name, payload);
    });
  }, [api, enabled]);

  useEffect(() => {
    if (!enabled) return;
    return onGuideEvidence((event) => {
      api.emit(event.name, event.payload);
    });
  }, [api, enabled]);

  useEffect(() => {
    if (!enabled || WOW_GUIDE_ENGINE || state.status !== 'running' || !activeStep?.targetSelector) return;
    const completionEventName = deriveCompletionEventName(activeStep.completion);
    if (!completionEventName) return;

    return bindStepDomEvents({
      active: true,
      targetSelector: activeStep.targetSelector,
      completionEventName,
      emit: api.emit,
    });
  }, [activeStep, api, enabled, state.status]);

  const stepComplete = useMemo(() => {
    if (WOW_GUIDE_ENGINE) {
      return Boolean(guideResolution?.complete);
    }
    if (!activeStep || state.status !== 'running') return false;
    return isRuleComplete(activeStep.completion, state.eventLog, currentSlide);
  }, [activeStep, state.status, state.eventLog, currentSlide, guideResolution]);

  return {
    state,
    activeStep,
    stepComplete,
    api,
    guideOverlayModel,
    guideBlockedReasons: guideResolution?.blockedReasons ?? [],
    guideMissingEvidence: guideResolution?.missingEvidence ?? [],
    guideSatisfiedEvidence: guideResolution?.satisfiedEvidence ?? [],
  };
}
