import { POLICY_DATA } from './policy-data.js';

export function findBasePolicy(state) {
  // state: {bundle, internet, tv, onestop, genie3}
  const { bundle, internet, tv, onestop, genie3 } = state;
  return POLICY_DATA.rows.find(r =>
    r.bundle === bundle &&
    r.internet === internet &&
    (r.tv ?? null) === (tv ?? null) &&
    r.onestop === onestop &&
    r.genie3 === genie3
  ) || null;
}

export function calcTotalPolicy(state) {
  const base = findBasePolicy(state);
  if (!base || typeof base.policy !== 'number') return { total: null, base: null, addWireless: 0 };

  let addWireless = 0;
  if (state.bundle.startsWith('U')) {
    addWireless = POLICY_DATA.wireless[state.wireless] ?? 0;
  }
  const total = base.policy + addWireless;
  return { total, base, addWireless };
}

export function formatWonMan(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '-';
  const n = Math.round(v * 10) / 10;
  return `${n.toLocaleString()}만원`;
}
