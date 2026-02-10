
export type ChatFixture = {
  id: string;
  label: string;
  prompt: string;
  response: string;
};

const LONG_RISK_RESPONSE = [
  'Executive summary:',
  '- Exposure is concentrated in uninstrumented shift transitions.',
  '- Audit latency is dominated by manual evidence handoff.',
  '- Incident RCA quality is inconsistent across plants.',
  '',
  'Why this matters:',
  'A board-level risk program only works when operational events are captured as they happen, with immutable references and reproducible context.',
  'Without deterministic capture, the organization relies on narratives written after the event, which increases legal and operational uncertainty.',
  '',
  'Next actions (30/60/90):',
  '30 days: baseline current time-to-evidence and define top-3 risk moments per site.',
  '60 days: instrument critical events and enforce source attribution in every record.',
  '90 days: establish executive dashboard with line-of-sight from risk signal to auditable evidence packet.',
  '',
  'Detailed notes:',
  '1) Shift transition is the highest-loss interval because ownership changes while alarms and state changes continue.',
  '2) Operator notes are useful but cannot be the primary proof source.',
  '3) High-value mitigation is not more reporting; it is better capture discipline.',
  '4) Metrics should prioritize evidence availability, not presentation quality.',
  '5) In legal or regulatory pressure, the first question is chain of custody.',
  '6) If chain of custody is weak, every downstream KPI is suspect.',
  '7) Controls should default to deterministic behavior under degraded network conditions.',
  '8) Recovery workflows must preserve evidence IDs and timeline ordering.',
  '9) Investor confidence increases when operational truth is observable, not narrated.',
  '10) Program governance should include monthly exception reviews with concrete countermeasures.',
].join('\n');

const LONG_EDGE_CASE_RESPONSE = [
  'Why: Prioritize failure containment over feature velocity.',
  'Next: Define exact ownership boundaries for plant, HQ, and vendor teams.',
  '• Evidence packet completeness target: >= 98%.',
  '• Mean time to trace root cause target: <= 20 minutes.',
  '• False-positive review cadence: weekly.',
  '',
  'This fixture intentionally mixes labels, bullets, and long prose to validate section parsing in investor mode.',
  'It also includes punctuation variants and short standalone lines.',
  '',
  'Action detail:',
  'Set a deterministic playbook where event capture starts before human annotation.',
  'Standardize naming across plants so AI summaries are comparable and cannot drift by vocabulary alone.',
  'Treat source references as first-class objects, not optional metadata.',
  'Require every board-facing statement to map to at least one machine-captured proof object.',
].join('\n');

const LONG_BULLET_STORM = [
  '• Site A: compressor trips increased 17% quarter-over-quarter.',
  '• Site B: shutdowns decreased 22% after introducing deterministic alert triage.',
  '• Site C: mean maintenance response improved from 47m to 19m.',
  '• Site D: no audit-grade event packet for 3 critical incidents.',
  '• Site E: highest risk is inconsistent timestamp standards across vendors.',
  '• Site F: near-miss reports exist but are not linked to sensor traces.',
  '• Site G: executive dashboard healthy, but source-level confidence poor.',
  '• Site H: teams rely on screenshots rather than event exports.',
  '• Site I: legal hold readiness not tested this quarter.',
  '• Site J: top process bottleneck is manual consolidation of evidence.',
  '',
  'Recommended response format:',
  'Why: Explain risk in one sentence.',
  'Now: Name one immediate stabilizer.',
  'Next: Name one measurable action in 30 days.',
].join('\n');

export const AI_CHAT_FIXTURES: ChatFixture[] = [
  {
    id: 'investor-long-risk',
    label: 'Long Risk Brief',
    prompt: 'Give me an investor-grade risk and evidence plan for 90 days.',
    response: LONG_RISK_RESPONSE,
  },
  {
    id: 'mixed-label-bullets',
    label: 'Mixed Labels + Bullets',
    prompt: 'Summarize why this matters and what to do next.',
    response: LONG_EDGE_CASE_RESPONSE,
  },
  {
    id: 'bullet-storm',
    label: 'Bullet Storm',
    prompt: 'Convert these bullets into one-line answer, why, and next.',
    response: LONG_BULLET_STORM,
  },
];

