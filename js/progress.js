/**
 * PROGRESS.JS — localStorage abstraction layer
 * All read/write for user progress lives here.
 * Keys match blueprint Section 4 and 11.6.
 */

const Progress = {

  KEYS: {
    UNLOCKED_WORDS:      'app_unlocked_words',
    MODULE_PROGRESS:     'app_module_progress',
    EXERCISE_HISTORY:    'app_exercise_history',
    LAST_SESSION:        'app_last_session',
    WORD_SCORES:         'app_word_practice_scores',
    VERBS_ROOT:          'app_verbs_root_unlocked',
    VERBS_VARIANT:       'app_verbs_variant_unlocked',
    VERBS_ROOT_PROGRESS: 'app_verbs_root_progress',
    VERBS_VAR_PROGRESS:  'app_verbs_variant_progress',
    COOLDOWN:            'app_cooldown_words',
    NEEDS_REVIEW:        'app_needs_review',
    STREAK:              'app_streak',
    STREAK_DATE:         'app_streak_last_date',
    NOUNS_UNLOCKED:      'app_nouns_unlocked'
  },

  // --- Generic helpers ---
  _get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },

  _set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn('localStorage write failed:', key, e); }
  },

  // --- Unlocked words (global word list) ---
  getUnlockedWords() { return this._get(this.KEYS.UNLOCKED_WORDS, []); },

  unlockWord(wordId) {
    const list = this.getUnlockedWords();
    if (!list.includes(wordId)) { list.push(wordId); this._set(this.KEYS.UNLOCKED_WORDS, list); }
  },

  isUnlocked(wordId) { return this.getUnlockedWords().includes(wordId); },

  // --- Module progress ---
  getModuleProgress(moduleId) {
    return (this._get(this.KEYS.MODULE_PROGRESS, {}))[moduleId] || 0;
  },

  setModuleProgress(moduleId, percent) {
    const all = this._get(this.KEYS.MODULE_PROGRESS, {});
    all[moduleId] = percent;
    this._set(this.KEYS.MODULE_PROGRESS, all);
  },

  // --- Exercise history ---
  getExerciseHistory(exId) {
    return (this._get(this.KEYS.EXERCISE_HISTORY, {}))[exId] || { correct: 0, incorrect: 0 };
  },

  recordResult(exId, correct) {
    const all = this._get(this.KEYS.EXERCISE_HISTORY, {});
    if (!all[exId]) all[exId] = { correct: 0, incorrect: 0 };
    correct ? all[exId].correct++ : all[exId].incorrect++;
    this._set(this.KEYS.EXERCISE_HISTORY, all);
  },

  // --- Root verbs ---
  getUnlockedRootVerbs() { return this._get(this.KEYS.VERBS_ROOT, []); },

  unlockRootVerb(verbId) {
    const list = this.getUnlockedRootVerbs();
    if (!list.includes(verbId)) { list.push(verbId); this._set(this.KEYS.VERBS_ROOT, list); }
    this.unlockWord(verbId);
  },

  // --- Variant verbs ---
  getUnlockedVariants() { return this._get(this.KEYS.VERBS_VARIANT, []); },

  unlockVariant(variantId) {
    const list = this.getUnlockedVariants();
    if (!list.includes(variantId)) { list.push(variantId); this._set(this.KEYS.VERBS_VARIANT, list); }
    this.unlockWord(variantId);
  },

  // --- Nouns ---
  getUnlockedNouns() { return this._get(this.KEYS.NOUNS_UNLOCKED, []); },

  unlockNoun(nounId) {
    const list = this.getUnlockedNouns();
    if (!list.includes(nounId)) { list.push(nounId); this._set(this.KEYS.NOUNS_UNLOCKED, list); }
    this.unlockWord(nounId);
  },

  // --- Cooldown (Section 11.3) ---
  getCooldown() { return this._get(this.KEYS.COOLDOWN, []); },
  setCooldown(ids) { this._set(this.KEYS.COOLDOWN, ids); },

  getNeedsReview() { return this._get(this.KEYS.NEEDS_REVIEW, []); },

  addNeedsReview(wordId) {
    const list = this.getNeedsReview();
    if (!list.includes(wordId)) { list.push(wordId); this._set(this.KEYS.NEEDS_REVIEW, list); }
  },

  removeNeedsReview(wordId) {
    this._set(this.KEYS.NEEDS_REVIEW, this.getNeedsReview().filter(id => id !== wordId));
  },

  // --- Streak ---
  getStreak() { return this._get(this.KEYS.STREAK, 0); },

  updateStreak() {
    const today = new Date().toDateString();
    const last  = this._get(this.KEYS.STREAK_DATE, null);
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let streak = this.getStreak();
    if (last === today) return streak;
    streak = (last === yesterday) ? streak + 1 : 1;
    this._set(this.KEYS.STREAK, streak);
    this._set(this.KEYS.STREAK_DATE, today);
    return streak;
  },

  // --- Session ---
  recordSession() { this._set(this.KEYS.LAST_SESSION, new Date().toISOString()); }
};
