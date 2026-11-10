// pattern-libraries · src/value.mjs — WHAT IT IS WORTH TO A BUYER, from sourced figures and the library's own measured
// coverage, never from typed numbers. Pure and total. Every default is a sourced figure, and the buyer can replace it.
//
//   SOURCES   the figures and where they come from (the CUAD paper; claude.com/pricing via kar-spendwall's record)
//   review(inputs, measured)  the expert reading time the library's answers stand in for, per month, and its cost
//   modelCost(prices, model, chars, outTokens)  what sending one contract to a frontier model costs (input + output)
//
// The honest frame: an answer still gets checked by a person (it arrives with its sentence and its pattern), so this is
// the time spent FINDING the item, not deciding on it; and only the share of questions the library answers counts.
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const num = (x, lo, hi) => (typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi ? x : null);

export const SOURCES = Object.freeze({
  rate: Object.freeze({ value: 500, text: 'billing rates for lawyers at large law firms are typically around $500–$900 per hour in the US (the lower end used)', from: 'Hendrycks et al., CUAD (NeurIPS 2021), section 1' }),
  minutesPerPage: Object.freeze({ value: 5, text: 'each page requiring 5–10 minutes of expert review (the lower end used)', from: 'Hendrycks et al., CUAD (NeurIPS 2021), section 3' }),
  pages: Object.freeze({ value: 9283, contracts: 510, text: '9,283 pages across 510 contracts', from: 'Hendrycks et al., CUAD (NeurIPS 2021)' }),
  categories: Object.freeze({ value: 41, text: 'the 41 label categories experts mark in a contract review', from: 'Hendrycks et al., CUAD (NeurIPS 2021)' }),
});

/** review(inputs, measured) → { ok, hours, cost, perContractMinutes, share, why } per month.
 *  inputs = { contracts, pages, minutesPerPage, rate, questions }; measured = { coverage, precision } from the meter */
export function review(inputs, measured) {
  const i = isObj(inputs) ? inputs : {}, m = isObj(measured) ? measured : {};
  const contracts = num(i.contracts, 0, 1e7), pages = num(i.pages, 0, 1e4), mpp = num(i.minutesPerPage, 0, 600), rate = num(i.rate, 0, 1e5);
  const questions = Number.isInteger(i.questions) ? num(i.questions, 0, SOURCES.categories.value) : null;
  const coverage = num(m.coverage, 0, 1), precision = m.precision === null ? 0 : num(m.precision, 0, 1);
  if ([contracts, pages, mpp, rate, questions].includes(null)) return { ok: false, why: 'every input must be a number in range: contracts, pages, minutes per page, the hourly rate, and the questions covered (whole, at most ' + SOURCES.categories.value + ')' };
  if (coverage === null || precision === null) return { ok: false, why: 'the library\'s measured coverage and precision are needed (read from the meter)' };
  // only the answers that are right stand in for finding; a wrong answer costs its check and saves nothing
  const share = (questions / SOURCES.categories.value) * coverage * precision;
  const perContractMinutes = pages * mpp * share;
  const hours = (contracts * perContractMinutes) / 60;
  return { ok: true, share: Math.round(share * 1e6) / 1e6, perContractMinutes: Math.round(perContractMinutes * 100) / 100, hours: Math.round(hours * 100) / 100, cost: Math.round(hours * rate * 100) / 100, why: '' };
}

/** modelCost(prices, model, chars, outTokens) → dollars to send one document of that many characters to the model once,
 *  at about four characters a token (input) plus the output tokens; null if the model has no printed price */
export function modelCost(prices, model, chars, outTokens) {
  const p = isObj(prices) && isObj(prices.models) ? prices.models[model] : null;
  const c = num(chars, 0, 1e9), o = num(outTokens, 0, 1e7);
  if (!isObj(p) || num(p.in, 0, 1e4) === null || num(p.out, 0, 1e4) === null || c === null || o === null) return null;
  return Math.round(((c / 4) * p.in + o * p.out) / 1e6 * 10000) / 10000;
}

export default { SOURCES, review, modelCost };
