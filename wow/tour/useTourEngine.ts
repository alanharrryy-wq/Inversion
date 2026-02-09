import { useEffect, useMemo, useState } from 'react';
import { findTourScript } from './registry';
import { onTourEvent } from './events';
import { CompletionRule, TourApi, TourEvent, TourState } from './types';

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

function initialState(): TourState {
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

export function useTourEngine(params: {
  enabled: boolean;
  currentSlide: number;
  scriptId?: string;
}) {
  const { enabled, currentSlide, scriptId } = params;
  const [state, setState] = useState<TourState>(initialState);

  const activeStep = useMemo(() => state.steps[state.stepIndex] ?? null, [state.stepIndex, state.steps]);

  const completeIfNeeded = (nextState: TourState, forcedSlide = currentSlide): TourState => {
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

  const api: TourApi = useMemo(() => ({
    start: (requestedScriptId?: string) => {
      if (!enabled) return;
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
      setState(completeIfNeeded(nextState));
    },
    next: () => {
      setState((prev) => {
        if (prev.status !== 'running') return prev;
        const current = prev.steps[prev.stepIndex];
        const isComplete = current ? isRuleComplete(current.completion, prev.eventLog, currentSlide) : false;
        if (!isComplete && !current?.allowNextBeforeComplete) return prev;
        if (prev.stepIndex >= prev.steps.length - 1) return { ...prev, status: 'completed' };
        return { ...prev, stepIndex: prev.stepIndex + 1 };
      });
    },
    back: () => {
      setState((prev) => {
        if (prev.status !== 'running') return prev;
        return { ...prev, stepIndex: Math.max(0, prev.stepIndex - 1) };
      });
    },
    skip: () => {
      setState((prev) => ({ ...prev, status: 'completed' }));
    },
    stop: () => {
      setState(initialState());
    },
    emit: (eventName: string, payload?: Record<string, unknown>) => {
      setState((prev) => {
        if (prev.status !== 'running') return prev;
        const next: TourState = {
          ...prev,
          eventLog: [...prev.eventLog, { name: eventName, payload, ts: Date.now() }],
        };
        return completeIfNeeded(next);
      });
    },
  }), [enabled, scriptId, currentSlide]);

  useEffect(() => {
    if (!enabled) {
      setState(initialState());
      return;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || state.status !== 'running') return;
    setState((prev) => completeIfNeeded(prev, currentSlide));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, enabled, state.status]);

  useEffect(() => {
    if (!enabled) return;
    return onTourEvent((name, payload) => {
      api.emit(name, payload);
    });
  }, [api, enabled]);

  const stepComplete = useMemo(() => {
    if (!activeStep || state.status !== 'running') return false;
    return isRuleComplete(activeStep.completion, state.eventLog, currentSlide);
  }, [activeStep, state.status, state.eventLog, currentSlide]);

  return { state, activeStep, stepComplete, api };
}
