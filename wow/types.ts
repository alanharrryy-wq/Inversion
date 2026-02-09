export type EffectLevel = 'off' | 'low' | 'medium' | 'high';

export type WowEffectState = {
  enabled: boolean;
  level: EffectLevel;
  reducedMotion: boolean;
};

export type SweepDirection = 'left' | 'right' | 'up' | 'down';

export type GlowTone = 'cyan' | 'teal' | 'gold' | 'neutral';
