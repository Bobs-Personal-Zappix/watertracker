/**
 * Voice Tracker tile — vanilla JS behavior.
 *
 * Usage:
 *   initVoiceTracker('.voice-tracker-tile');
 *
 * On activation (click, Enter, or Space) the tile sets its own state to
 * "listening" and dispatches a bubbling CustomEvent so the host page can
 * start real speech capture:
 *
 *   document.addEventListener('voicetracker:activate', (e) => {
 *     const tile = e.target; // the .voice-tracker-tile element
 *     // ...start your speech recognition here...
 *   });
 *
 * Drive the tile's visual state from your own speech-handling code with
 * setVoiceTrackerState. Auto-reverting from "done" back to "idle" after a
 * delay is the host page's responsibility, not this component's.
 *
 * Console test (paste into devtools on a page with the tile inserted):
 *   const tile = document.querySelector('.voice-tracker-tile');
 *   setVoiceTrackerState(tile, 'listening');
 *   setVoiceTrackerState(tile, 'done', { text: 'Logged: 12oz water, 24g protein' });
 *   setVoiceTrackerState(tile, 'idle');
 */

const VT_DEFAULT_SUBTEXT = 'Describe what you had, Tracker AI will suggest and enter the stats for you.';
const VT_LISTENING_SUBTEXT = 'Listening…';
const VT_DONE_SUBTEXT = 'Got it — logged.';

const vtOriginalSubtext = new WeakMap();

function vtGetSubtextEl(tileEl) {
  return tileEl.querySelector('.vt-subtext');
}

/**
 * Set the tile's visual state.
 * @param {HTMLElement} tileEl - the .voice-tracker-tile element
 * @param {'idle'|'listening'|'done'} state
 * @param {{ text?: string }} [options] - optional subtext override for this state
 */
function setVoiceTrackerState(tileEl, state, options) {
  if (!tileEl) return;
  const subtextEl = vtGetSubtextEl(tileEl);

  if (subtextEl && !vtOriginalSubtext.has(tileEl)) {
    vtOriginalSubtext.set(tileEl, subtextEl.textContent);
  }

  tileEl.setAttribute('data-state', state);

  if (!subtextEl) return;

  if (options && typeof options.text === 'string') {
    subtextEl.textContent = options.text;
    return;
  }

  if (state === 'listening') {
    subtextEl.textContent = VT_LISTENING_SUBTEXT;
  } else if (state === 'done') {
    subtextEl.textContent = VT_DONE_SUBTEXT;
  } else {
    subtextEl.textContent = vtOriginalSubtext.get(tileEl) || VT_DEFAULT_SUBTEXT;
  }
}

/**
 * Find the tile, wire up click/keyboard activation, and set it to idle.
 * @param {string} rootSelector - CSS selector for the .voice-tracker-tile element
 * @returns {HTMLElement|null} the tile element, or null if not found
 */
function initVoiceTracker(rootSelector) {
  const tileEl = document.querySelector(rootSelector);
  if (!tileEl) return null;

  const subtextEl = vtGetSubtextEl(tileEl);
  if (subtextEl) vtOriginalSubtext.set(tileEl, subtextEl.textContent);

  setVoiceTrackerState(tileEl, 'idle');

  const activate = () => {
    setVoiceTrackerState(tileEl, 'listening');
    tileEl.dispatchEvent(new CustomEvent('voicetracker:activate', { bubbles: true }));
  };

  tileEl.addEventListener('click', activate);
  tileEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      activate();
    }
  });

  return tileEl;
}
