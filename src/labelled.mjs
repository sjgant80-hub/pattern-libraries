// pattern-libraries · src/labelled.mjs — LIBRARIES 6 TO 9 (SEAL 10): four libraries of expert-labelled text, each read by
// the general router (src/router.mjs): one route per label, the keyword router as the cheap method, an answer only where
// a proven pattern fires, every conflict named. Pure and total.
//   ethics    ETHICS commonsense morality (Hendrycks et al., MIT): is the act in the scenario clearly wrong, or not
//   emotions  GoEmotions (Demszky et al., Apache-2.0): which of 27 emotions (or neutral) a comment expresses; several may be right
//   maths     MATH (Hendrycks et al., MIT): which of seven branches a competition problem belongs to
//   subjects  MMLU (Hendrycks et al., MIT): which of 57 subjects an exam question belongs to
import R from './router.mjs';

// emotions.txt, MATH's seven types and MMLU's 57 subjects as pinned (the loader refuses data that differs)
const EMOTIONS = ['admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring', 'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval', 'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief', 'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization', 'relief', 'remorse', 'sadness', 'surprise', 'neutral'];
const BRANCHES = ['Algebra', 'Counting & Probability', 'Geometry', 'Intermediate Algebra', 'Number Theory', 'Prealgebra', 'Precalculus'];
const SUBJECTS = ['abstract_algebra', 'anatomy', 'astronomy', 'business_ethics', 'clinical_knowledge', 'college_biology', 'college_chemistry', 'college_computer_science', 'college_mathematics', 'college_medicine', 'college_physics', 'computer_security', 'conceptual_physics', 'econometrics', 'electrical_engineering', 'elementary_mathematics', 'formal_logic', 'global_facts', 'high_school_biology', 'high_school_chemistry', 'high_school_computer_science', 'high_school_european_history', 'high_school_geography', 'high_school_government_and_politics', 'high_school_macroeconomics', 'high_school_mathematics', 'high_school_microeconomics', 'high_school_physics', 'high_school_psychology', 'high_school_statistics', 'high_school_us_history', 'high_school_world_history', 'human_aging', 'human_sexuality', 'international_law', 'jurisprudence', 'logical_fallacies', 'machine_learning', 'management', 'marketing', 'medical_genetics', 'miscellaneous', 'moral_disputes', 'moral_scenarios', 'nutrition', 'philosophy', 'prehistory', 'professional_accounting', 'professional_law', 'professional_medicine', 'professional_psychology', 'public_relations', 'security_studies', 'sociology', 'us_foreign_policy', 'virology', 'world_religions'];
export const MMLU_MANIFEST = 'd59a00a733445df0080f4bf01e8f679dc6e1821c24048ea7c6f6e205abaa9328';

const f = (o) => Object.freeze({ ...o, intents: Object.freeze(o.intents), schedule: Object.freeze(o.schedule) });
// sizes: SEAL 10, chosen from each library's seed before the seal; SHA-256 order (seal 4); seal 7's merged tail
export const LIBRARIES = Object.freeze({
  ethics: f({ n: 6, name: 'ethics: is the act clearly wrong', intents: ['wrong', 'not_wrong'], key: 'eth:', tokens: 80, batches: 8, data: 'ETHICS commonsense morality (MIT)', what: 'a short account of something a person did', schedule: { meter: 1000, seed: 4759, batch: 2000, salt: 'ethics:', hash: 'sha256', tail: 'merge' } }),
  emotions: f({ n: 7, name: 'emotions: which emotion a comment expresses', intents: EMOTIONS, key: 'goe:', tokens: 40, batches: 7, data: 'GoEmotions (Apache-2.0)', what: 'one comment someone wrote online', schedule: { meter: 2000, seed: 10263, batch: 6000, salt: 'goemotions:', hash: 'sha256', tail: 'merge' } }),
  maths: f({ n: 8, name: 'maths: which branch a problem belongs to', intents: BRANCHES, key: 'math:', tokens: 80, batches: 5, data: 'MATH (MIT)', what: 'one competition maths problem', schedule: { meter: 1000, seed: 3500, batch: 1600, salt: 'math:', hash: 'sha256', tail: 'merge' } }),
  subjects: f({ n: 9, name: 'subjects: which discipline an exam question belongs to', intents: SUBJECTS, key: 'mmlu:', tokens: 60, batches: 4, data: 'MMLU (MIT)', what: 'one exam question', schedule: { meter: 1000, seed: 2842, batch: 3000, salt: 'mmlu:', hash: 'sha256', tail: 'merge' } }),
});
export const METER_BAR = 0.8;

export const KERNELS = Object.freeze(Object.fromEntries(Object.entries(LIBRARIES).map(([id, L]) => [id, R.routerFor({ intents: L.intents, key: L.key, tokens: L.tokens, job: L.name, data: L.data, what: L.what })])));

export default { LIBRARIES, KERNELS, METER_BAR, MMLU_MANIFEST };
