/**
 * LISTENING.JS — Lesen & Hören module
 * Screens: article list + article reader.
 * Data source: window.LISTENING_DATA (bundled in listening-data.js).
 */

// ─────────────────────────────────────────
// MODULE STATE
// ─────────────────────────────────────────

let _showReadArticles = true;        // show/hide read toggle state
let _currentArticleId = null;        // article open in reader

// ─────────────────────────────────────────
// ARTICLE LIST SCREEN
// ─────────────────────────────────────────


function renderListeningList() {
  const articles = (window.LISTENING_DATA || {}).articles || [];
  const container = document.getElementById('listening-list-content');
  const toggleBtn = document.getElementById('listening-toggle-read');

  // Update pill button label
  if (toggleBtn) {
    toggleBtn.textContent = _showReadArticles ? 'Hide read' : 'Show read';
  }

  // Filter if needed
  const visible = _showReadArticles
    ? articles
    : articles.filter(a => !Progress.isArticleRead(a.id));

  if (visible.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📖</div>
        <p>${_showReadArticles ? 'Keine Artikel verfügbar.' : 'Alle Artikel bereits gelesen!'}</p>
        ${!_showReadArticles ? `<button class="secondary-btn" style="margin-top:var(--sp-4)"
          onclick="toggleReadArticles()">Gelesen anzeigen</button>` : ''}
      </div>`;
    return;
  }

  container.innerHTML = visible.map(a => {
    const isRead  = Progress.isArticleRead(a.id);
    const dateStr = a.date ? _formatDate(a.date) : '';
    const vocabCount = (a.vocabulary || []).length;

    return `
      <div class="article-list-card ${isRead ? 'article-read' : ''}"
           onclick="openArticle('${a.id}')">
        <div class="article-list-card-body">
          <div class="article-list-title">${_escHtml(a.title)}</div>
          <div class="article-list-meta">
            ${dateStr ? `<span>${dateStr}</span><span class="article-meta-dot">·</span>` : ''}
            <span>${vocabCount} Vokabeln</span>
          </div>
        </div>
        <div class="article-list-right">
          ${isRead
            ? `<span class="article-read-badge" title="Gelesen">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   <polyline points="20 6 9 17 4 12"/>
                 </svg>
               </span>`
            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    style="color:var(--color-text-muted)">
                 <polyline points="9 18 15 12 9 6"/>
               </svg>`}
        </div>
      </div>`;
  }).join('');
}

function toggleReadArticles() {
  _showReadArticles = !_showReadArticles;
  renderListeningList();
}

// ─────────────────────────────────────────
// ARTICLE READER SCREEN
// ─────────────────────────────────────────

function openArticle(articleId) {
  _currentArticleId = articleId;
  navigateTo('screen-listening-reader');
  _renderArticle(articleId);
}

function _renderArticle(articleId) {
  const articles  = (window.LISTENING_DATA || {}).articles || [];
  const article   = articles.find(a => a.id === articleId);
  if (!article) return;

  const isRead = Progress.isArticleRead(articleId);

  // Nav context
  const navCtx = document.getElementById('listening-reader-context');
  if (navCtx) navCtx.textContent = 'Lesen & Hören';

  // Title
  const titleEl = document.getElementById('listening-reader-title');
  if (titleEl) titleEl.textContent = article.title;

  // Date
  const dateEl = document.getElementById('listening-reader-date');
  if (dateEl) dateEl.textContent = article.date ? _formatDate(article.date) : '';

  // Vocab count
  const vocabEl = document.getElementById('listening-reader-vocab-count');
  if (vocabEl) {
    const filtered = (article.vocabulary || []).filter(v => v.word.length >= 4);
    vocabEl.textContent = `${filtered.length} Vokabeln`;
  }

  // Read button
  _updateReadButton(isRead);

  // Audio player
  const audioEl = document.getElementById('listening-audio');
  if (audioEl) {
    const audioSrc = `content/listening/articles/${articleId}/audio.mp3`;
    audioEl.src = audioSrc;
    audioEl.load();

    // On play: trigger a background full-GET so SW can cache the MP3
    audioEl.addEventListener('play', _cacheAudioFile, { once: true });
  }

  // Transcript with vocab highlights
  const transcriptEl = document.getElementById('listening-transcript');
  if (transcriptEl) {
    transcriptEl.innerHTML = _buildHighlightedTranscript(article.transcript, article.vocabulary || []);
  }

  // Vocab bottom sheet overlay close
  const overlay = document.getElementById('listening-vocab-overlay');
  if (overlay) overlay.onclick = closeVocabSheet;
}

function _cacheAudioFile() {
  if (!_currentArticleId) return;
  const url = `content/listening/articles/${_currentArticleId}/audio.mp3`;
  fetch(url, { headers: {} }).catch(() => {});  // SW intercepts and caches
}

// ─────────────────────────────────────────
// TRANSCRIPT HIGHLIGHTING
// ─────────────────────────────────────────

function _buildHighlightedTranscript(transcript, vocabulary) {
  if (!transcript) return '';

  // Filter: skip vocab entries with words under 4 characters
  const vocabFiltered = vocabulary.filter(v => v.word && v.word.trim().length >= 4);

  // Sort by word length descending (match longer phrases first)
  const sorted = vocabFiltered.slice().sort((a, b) => b.word.length - a.word.length);

  // Build lookup map: lowercased word → vocab entry index
  const vocabMap = {};
  sorted.forEach((v, i) => {
    vocabMap[v.word.toLowerCase()] = i;
  });

  // Build single combined regex (sorted by length desc = already done above)
  let highlighted = transcript;
  if (sorted.length > 0) {
    const pattern = new RegExp(
      sorted.map(v => v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
      'gi'
    );
    highlighted = transcript.replace(pattern, match => {
      const idx = vocabMap[match.toLowerCase()];
      if (idx === undefined) return match;
      // Escape match for safe attribute embedding
      const safeMatch = _escAttr(match);
      return `<span class="vocab-highlight" data-vocab-idx="${idx}" onclick="showVocabSheet(${idx},'${safeMatch}')">${match}</span>`;
    });
  }

  // Split on double newline → paragraphs; single newline → <br>
  return highlighted
    .split(/\n\n+/)
    .map(para => `<p class="transcript-para">${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// ─────────────────────────────────────────
// VOCAB BOTTOM SHEET
// ─────────────────────────────────────────

function showVocabSheet(idx, matchedWord) {
  const articles = (window.LISTENING_DATA || {}).articles || [];
  const article  = articles.find(a => a.id === _currentArticleId);
  if (!article) return;

  const vocabFiltered = (article.vocabulary || [])
    .filter(v => v.word && v.word.trim().length >= 4)
    .sort((a, b) => b.word.length - a.word.length);

  const entry = vocabFiltered[idx];
  if (!entry) return;

  document.getElementById('vocab-sheet-word').textContent        = matchedWord || entry.word;
  document.getElementById('vocab-sheet-explanation').textContent = entry.explanation_en || '';

  document.getElementById('listening-vocab-overlay').classList.add('visible');
  document.getElementById('listening-vocab-sheet').classList.add('open');
}

function closeVocabSheet() {
  document.getElementById('listening-vocab-overlay').classList.remove('visible');
  document.getElementById('listening-vocab-sheet').classList.remove('open');
}

// ─────────────────────────────────────────
// READ STATE
// ─────────────────────────────────────────

function toggleArticleRead() {
  if (!_currentArticleId) return;
  const isRead = Progress.isArticleRead(_currentArticleId);
  if (isRead) {
    Progress.unmarkArticleRead(_currentArticleId);
    _updateReadButton(false);
  } else {
    Progress.markArticleRead(_currentArticleId);
    _updateReadButton(true);
  }
}

function _updateReadButton(isRead) {
  const btn = document.getElementById('listening-read-btn');
  if (!btn) return;
  if (isRead) {
    btn.classList.add('read');
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
         style="margin-right:4px;flex-shrink:0">
        <polyline points="20 6 9 17 4 12"/>
      </svg>Read`;
  } else {
    btn.classList.remove('read');
    btn.textContent = 'Read';
  }
}

// ─────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────

function _formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}

function _escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _escAttr(str) {
  // Safe for single-quoted HTML attribute values
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
}
