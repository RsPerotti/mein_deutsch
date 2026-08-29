/**
 * SRS.JS — spaced repetition scheduler (binary SM-2)
 *
 * PRD_Wiederholung.md §5.2. Pure scheduling logic plus a localStorage-backed
 * store. No DOM, no knowledge of exercises, modules or renderers — it deals in
 * opaque item IDs and nothing else. That is deliberate: it is the half of the
 * feature that _factory/validate-srs.py re-implements independently, and it can
 * only be checked mechanically if it has no app dependencies.
 *
 * localStorage key: app_srs
 *
 * Per-item state uses one-character keys to keep the store small. With ~6,150
 * exercises the readable-key version measured ~2.3x larger for no benefit —
 * nothing outside this file ever reads the raw shape.
 *
 *   e  ease factor      1.3 .. 2.5      (starts 2.5)
 *   i  interval, days   0 = due today   (starts 0)
 *   r  consecutive successful reps      (starts 0, resets to 0 on a miss)
 *   d  due date         'YYYY-MM-DD' local
 *   l  last seen        'YYYY-MM-DD' local
 *   x  lapse count
 */

const SRS = {

  KEY:           'app_srs',
  BACKFILL_FLAG: 'app_srs_backfilled',

  // --- Tunables (PRD §5.2). Mirrored in _factory/validate-srs.py. ---
  EASE_START: 2.5,
  EASE_MAX:   2.5,
  EASE_MIN:   1.3,
  EASE_UP:    0.1,
  EASE_DOWN:  0.2,
  STEP_1:     1,   // interval after the first correct answer
  STEP_2:     6,   // interval after the second consecutive correct answer

  // Ceiling on the interval. Without it the interval compounds by the ease
  // factor without limit: 38 consecutive correct answers puts the due date past
  // year 100,000, where the Date constructor returns Invalid Date and the item
  // is written with d = 'NaN-NaN-NaN' — never due again, silently gone from the
  // pool. Caught by _factory/validate-srs.py before this ever shipped.
  // A year is the practical ceiling anyway: an item you have recalled correctly
  // seven times running does not need a longer gap than that.
  INTERVAL_MAX: 365,

  BACKFILL_SPREAD_DAYS: 14,

  // --- Dates -------------------------------------------------------------
  // Local dates, not UTC. A session at 23:30 Berlin time must count as today,
  // and toISOString() would roll it into tomorrow.

  today() { return this.toDayString(new Date()); },

  toDayString(dt) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  addDays(dayStr, n) {
    const [y, m, d] = dayStr.split('-').map(Number);
    // Noon, not midnight: a DST transition can shift midnight into the previous
    // day and silently make an interval one day short.
    const dt = new Date(y, m - 1, d, 12, 0, 0);
    dt.setDate(dt.getDate() + n);
    return this.toDayString(dt);
  },

  // --- Store -------------------------------------------------------------

  _all() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw !== null ? JSON.parse(raw) : {};
    } catch { return {}; }
  },

  _write(all) {
    // Same failure posture as Progress._set: a full quota must never throw in
    // the middle of a session and lose the answer the user just gave.
    try { localStorage.setItem(this.KEY, JSON.stringify(all)); }
    catch (e) { console.warn('SRS: localStorage write failed', e); }
  },

  _fresh() {
    return { e: this.EASE_START, i: 0, r: 0, d: this.today(), l: null, x: 0 };
  },

  get(itemId) { return this._all()[itemId] || null; },

  // --- Scheduling --------------------------------------------------------

  /**
   * The whole algorithm. Pure: takes a state and a boolean, returns a new
   * state. Does not touch storage, so the validator can drive it directly.
   */
  next(state, isRight, todayStr) {
    const today = todayStr || this.today();
    const s = state ? { ...state } : this._fresh();

    if (isRight) {
      s.r = (s.r || 0) + 1;
      if      (s.r === 1) s.i = this.STEP_1;
      else if (s.r === 2) s.i = this.STEP_2;
      else                s.i = Math.round(s.i * s.e);
      // Guard against a rounding collapse: ease is floored at 1.3, so
      // round(i * e) can never shrink i, but a corrupted store could.
      if (s.i < 1) s.i = 1;
      if (s.i > this.INTERVAL_MAX) s.i = this.INTERVAL_MAX;
      s.e = Math.min(this.EASE_MAX, +(s.e + this.EASE_UP).toFixed(4));
    } else {
      s.r = 0;
      s.i = 0;
      s.e = Math.max(this.EASE_MIN, +(s.e - this.EASE_DOWN).toFixed(4));
      s.x = (s.x || 0) + 1;
    }

    s.d = this.addDays(today, s.i);
    s.l = today;
    return s;
  },

  /** Record one answer. Called beside Progress.recordResult in exercises.js. */
  grade(itemId, isRight) {
    if (!itemId) return null;
    const all = this._all();
    const updated = this.next(all[itemId] || null, isRight);
    all[itemId] = updated;
    this._write(all);
    return updated;
  },

  // --- Queries -----------------------------------------------------------

  /** IDs due on or before today, most overdue first. No cap (PRD §5.7). */
  getDue(todayStr) {
    const today = todayStr || this.today();
    const all = this._all();
    return Object.keys(all)
      .filter(id => all[id].d <= today)
      .sort((a, b) => (all[a].d < all[b].d ? -1 : all[a].d > all[b].d ? 1 : 0));
  },

  countDue(todayStr) { return this.getDue(todayStr).length; },

  /** Items that exist in the store but are not yet due. */
  countScheduled() { return Object.keys(this._all()).length; },

  // --- Backfill (PRD §5.6) ------------------------------------------------

  /**
   * Seed the store from app_exercise_history, which has correct/incorrect
   * counts but no dates. Runs once, guarded by BACKFILL_FLAG, mirroring the
   * _QUIZ_MIGRATION_FLAG pattern in grammar.js.
   *
   * Due dates are spread deterministically across BACKFILL_SPREAD_DAYS by
   * hashing the item ID (PRD Q2). Seeding everything as due today would make
   * the first Wiederholung session thousands of items long, and with no
   * session cap that is the whole backlog in one screen.
   */
  backfill(force) {
    if (!force && localStorage.getItem(this.BACKFILL_FLAG) === '1') return 0;

    let history = {};
    try {
      const raw = localStorage.getItem('app_exercise_history');
      history = raw !== null ? JSON.parse(raw) : {};
    } catch { history = {}; }

    const all    = this._all();
    const today  = this.today();
    let seeded   = 0;

    for (const itemId of Object.keys(history)) {
      if (all[itemId]) continue;              // never clobber real scheduling state
      const h = history[itemId] || {};
      const correct   = h.correct   || 0;
      const incorrect = h.incorrect || 0;
      if (correct === 0 && incorrect === 0) continue;

      const offset = this._spread(itemId);
      const state  = this._fresh();

      if (incorrect > 0) {
        state.r = 0;
        state.i = 0;
        state.e = Math.max(this.EASE_MIN,
                           +(this.EASE_START - this.EASE_DOWN * incorrect).toFixed(4));
        state.x = incorrect;
      } else {
        state.r = 1;
        state.i = this.STEP_1;
      }

      state.d = this.addDays(today, offset);
      state.l = null;                          // genuinely unknown
      all[itemId] = state;
      seeded++;
    }

    this._write(all);
    localStorage.setItem(this.BACKFILL_FLAG, '1');
    return seeded;
  },

  /** Stable 0..SPREAD-1 bucket for an ID. FNV-1a, chosen for being short. */
  _spread(itemId) {
    let h = 0x811c9dc5;
    for (let i = 0; i < itemId.length; i++) {
      h ^= itemId.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h % this.BACKFILL_SPREAD_DAYS;
  },

  // --- Maintenance -------------------------------------------------------

  /** Drop scheduling state for IDs no longer present in the app's content. */
  prune(knownIds) {
    const known = knownIds instanceof Set ? knownIds : new Set(knownIds);
    const all = this._all();
    let removed = 0;
    for (const id of Object.keys(all)) {
      if (!known.has(id)) { delete all[id]; removed++; }
    }
    if (removed) this._write(all);
    return removed;
  },

  reset() {
    try {
      localStorage.removeItem(this.KEY);
      localStorage.removeItem(this.BACKFILL_FLAG);
    } catch (e) { console.warn('SRS: reset failed', e); }
  }
};

// Node (validator harness) and browser alike.
if (typeof module !== 'undefined' && module.exports) module.exports = SRS;
