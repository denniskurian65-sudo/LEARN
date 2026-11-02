import { lessons as firstLessons, roadmap } from './lessons.js';
import { laterLessons } from './later-lessons.js';
import { interviewTopics, allCards } from './interview.js';
import { readState, writeState, normalizeOutput } from './state.js';
import { runPython, stopPython } from './runner.js';

export const lessons = [...firstLessons, ...laterLessons];
const state = readState();
if (!lessons.some(l => l.id === state.lesson)) state.lesson = lessons[0].id;
if (!interviewTopics.some(t => t.id === state.topic) && state.topic !== 'practice') state.topic = 'intro';
let busy = false;
let runVersion = 0;
let menuOpen = false;
let deck = [];
let cardIndex = 0;
let deckRevealed = false;
let known = 0;
let deckFinished = false;
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icons = {
  tree: '<path d="m12 3-7 11h5v7h4v-7h5L12 3Z"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16"/>',
  book: '<path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2V4Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  leaf: '<path d="M20 3C8 2 2 7 5 15c5 8 15 2 15-12ZM5 19 16 8"/>',
  shuffle: '<path d="M3 5h3l12 14h3m-4-4 4 4-4 3M3 19h3l4-5m4-4 4-5h3m-4-3 4 3-4 4"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.book}</svg>`;
function save() {
  const ok = writeState(state);
  const note = $('#save-note');
  if (note) note.textContent = ok ? 'Saved on this browser' : 'Browser storage is unavailable. Keep this tab open.';
}
const current = () => lessons.find(l => l.id === state.lesson);
const done = id => state.completed.includes(id);
const pythonCount = () => lessons.filter(l => done(l.id)).length;

function render() {
  const python = state.course === 'python';
  const item = current();
  const topic = interviewTopics.find(t => t.id === state.topic);
  document.title = `${python ? item.title : topic?.title || 'Flashcard practice'} | Fieldnotes`;
  $('#app').innerHTML = `
    <header class="topbar">
      <button class="menu-button icon-button" id="menu-toggle" aria-label="Open lesson menu" aria-expanded="${menuOpen}" aria-controls="sidebar">${icon('menu')}</button>
      <a class="brand" href="#" id="brand"><span class="brand-mark">${icon('tree')}</span>fieldnotes<span class="brand-dot">.</span></a>
      <span class="brand-caption">A LITTLE EVERY DAY</span>
      <div class="profile"><span class="profile-location">${icon('pin')} Kitchener, ON</span><span class="avatar" aria-label="Dennis">D</span></div>
    </header>
    <nav class="course-tabs" aria-label="Courses">
      <button data-course="python" class="course-tab ${python ? 'active' : ''}" aria-current="${python ? 'page' : 'false'}">${icon('code')}<span>Python & GeoPandas</span><span class="tab-tag">15 DAYS</span></button>
      <button data-course="interview" class="course-tab ${!python ? 'active' : ''}" aria-current="${!python ? 'page' : 'false'}">${icon('book')}<span>GIS Interview Prep</span></button>
      <span class="tab-note">Small steps. Useful skills.</span>
    </nav>
    <div class="layout">
      <button class="scrim ${menuOpen ? 'visible' : ''}" aria-label="Close lesson menu" id="scrim"></button>
      <aside class="sidebar ${menuOpen ? 'open' : ''}" id="sidebar" aria-label="Lesson navigation">${sidebar(python)}</aside>
      <main id="main" tabindex="-1">
        <div class="breadcrumb">Your learning desk <span>/</span> ${python ? 'Python & GeoPandas' : 'GIS Interview Prep'} <span>/</span> ${python ? `Day ${item.day}` : state.topic === 'practice' ? 'Practice' : 'Your next conversation'}</div>
        ${python ? pythonPage(item) : state.topic === 'practice' ? practicePage() : interviewPage(topic)}
        <footer class="site-footer"><span>${icon('leaf')} A little progress is still progress.</span><span>Made for Dennis, in Kitchener.</span></footer>
      </main>
    </div><div class="sr-only" id="navigation-announcement" role="status"></div>`;
  bind(); save();
}

function sidebar(python) {
  const count = python ? pythonCount() : interviewTopics.filter(t => done(`i-${t.id}`)).length;
  const total = python ? lessons.length : interviewTopics.length;
  let content = `<div class="sidebar-heading"><span class="eyebrow">YOUR PATH</span><h2>${python ? 'From Python to parks' : 'Ready for the conversation'}</h2><p>${python ? 'One small assignment at a time.' : 'Your training. Your real story.'}</p></div>
    <div class="progress-box"><div><span>Course progress</span><strong>${count}/${total}</strong></div><progress value="${count}" max="${total}" aria-label="Course completion"></progress><small id="save-note">Saved on this browser</small></div>`;
  if (python) {
    content += `<div class="section-label">THE FIELD ASSIGNMENTS <span>01-15</span></div>`;
    content += roadmap.map(([title, description], i) => {
      const day = i + 1;
      const entries = lessons.filter(l => l.day === day);
      const completed = entries.length && entries.every(l => done(l.id));
      if (!entries.length) return `<div class="roadmap-item"><span class="day-number">${String(day).padStart(2, '0')}</span><span><strong>${esc(title)}</strong><small>${esc(description)}</small><em>Coming later</em></span></div>`;
      return `<details class="day-group ${current().day === day ? 'selected' : ''}" ${current().day === day ? 'open' : ''}>
        <summary><span class="day-number ${completed ? 'finished' : ''}">${completed ? icon('check') : String(day).padStart(2, '0')}</span><span><strong>${esc(title)}</strong><small>${entries.filter(l => done(l.id)).length}/4 steps · about 30 min</small></span><span class="chevron">⌄</span></summary>
        <div class="lesson-links">${entries.map(l => `<button data-lesson="${l.id}" class="lesson-link ${current().id === l.id ? 'current' : ''}" ${current().id === l.id ? 'aria-current="step"' : ''}><span class="lesson-dot ${done(l.id) ? 'complete' : ''}">${done(l.id) ? '✓' : ''}</span><span>${l.mission ? 'Mission' : esc(l.title)}</span>${l.mission ? '<span class="mission-small">⚑</span>' : ''}</button>`).join('')}</div>
      </details>${day === 15 ? '<div class="section-label upcoming-label">THE ROAD AHEAD <span>16-21</span></div>' : ''}`;
    }).join('');
  } else {
    content += '<div class="section-label">SHORT LESSONS & PRACTICE</div>';
    content += interviewTopics.map((t, i) => `<button data-topic="${t.id}" class="topic-link ${state.topic === t.id ? 'current' : ''}" ${state.topic === t.id ? 'aria-current="step"' : ''}><span class="day-number ${done(`i-${t.id}`) ? 'finished' : ''}">${done(`i-${t.id}`) ? icon('check') : String(i + 1).padStart(2, '0')}</span><span><strong>${esc(t.title)}</strong><small>${t.cards.length} practice cards</small></span></button>`).join('');
    content += `<button data-topic="practice" class="practice-link ${state.topic === 'practice' ? 'current' : ''}">${icon('shuffle')} Mixed flashcard practice <span>${allCards.length}</span></button>`;
  }
  return content + `<div class="sidebar-note">${icon('tree')}<p>No rush, Dennis.<br>Pick up where you left off.</p></div>`;
}

function pythonPage(l) {
  const dayEntries = lessons.filter(x => x.day === l.day);
  const step = dayEntries.indexOf(l) + 1;
  return `<section class="welcome-banner"><div><span class="eyebrow">YOUR KITCHENER FIELDNOTES</span><h1>${l.day === 1 && step === 1 ? 'Good things grow<br>one step at a time.' : esc(roadmap[l.day - 1][0])}</h1><p>${l.day === 1 && step === 1 ? 'Welcome, Dennis. A little Python, a few trees,<br class="desktop-break"> and something useful by the end of each day.' : `Day ${l.day} on the urban forestry team. Learn a little. Try it. Make it yours.`}</p><div class="banner-tags"><span>${icon('clock')} About 30 min / day</span><span>${icon('check')} Learn by doing</span></div></div><div class="tree-illustration" aria-hidden="true"><div class="grid-ground"></div><div class="tree tree-one"><i></i><b></b></div><div class="tree tree-two"><i></i><b></b></div><div class="tree tree-three"><i></i><b></b></div><span class="map-pin">43.45° N, 80.49° W</span><span class="illustration-label">SMALL STEPS. DEEPER ROOTS.</span></div></section>
    <div class="day-strip"><span class="day-chip">DAY ${String(l.day).padStart(2, '0')}</span><span>${esc(roadmap[l.day - 1][1])}</span><div class="steps" aria-label="Step ${step} of 4">${dayEntries.map((x, i) => `<button data-lesson="${x.id}" class="step ${i + 1 === step ? 'active' : ''} ${done(x.id) ? 'done' : ''}" aria-label="Step ${i + 1}: ${esc(x.title)}">${done(x.id) ? '✓' : i + 1}</button>`).join('')}</div></div>
    <div class="lesson-title"><div><span class="eyebrow">${l.mission ? 'PUT IT TOGETHER' : `STEP ${step} OF 4`}</span><h2>${esc(l.title)}</h2></div><span class="reading-time">${icon('clock')} ${l.minutes} min</span></div>
    <div class="story"><span class="story-icon">${icon(l.mission ? 'tree' : 'pin')}</span><p>${esc(l.story)}</p></div>
    <section class="explanation" aria-label="Lesson explanation">${l.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</section>
    <section class="example-card"><div class="section-card-heading"><h3>${icon('code')} A small example</h3><span>PYTHON</span></div><pre><code>${highlight(l.code)}</code></pre></section>
    <section class="playground" aria-labelledby="try-title"><div class="playground-heading"><div><span class="eyebrow">YOUR TURN AT THE KEYBOARD</span><h3 id="try-title">Try it yourself</h3><p>Change something small. See what happens.</p></div><span class="browser-badge"><i></i> Runs in your browser</span></div>
      <div class="editor-toolbar"><span>practice.py <span class="draft-tag" id="draft-tag">${state.drafts[l.id] !== undefined ? '· your saved code' : '· ready to edit'}</span></span><button class="text-button" id="reset-code">Reset example</button></div>
      <label class="sr-only" for="code-editor">Python code for ${esc(l.title)}</label><textarea id="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off">${esc(typeof state.drafts[l.id] === 'string' ? state.drafts[l.id] : l.code)}</textarea>
      <div class="run-bar"><button class="button primary" id="run-code">${icon('play')} Run code</button><button class="button stop" id="stop-code" hidden>Stop</button><span class="run-status" id="run-status" role="status">Python starts when you run your code.</span><span class="keyboard-tip">Ctrl + Enter to run</span></div>
      <div class="output-heading"><span>OUTPUT</span><span id="output-label">${l.output ? 'Example output · run to see your changes' : 'Your result will appear here'}</span></div><pre id="output" tabindex="0">${esc(l.output || 'Ready when you are.')}</pre><div id="plots" aria-live="polite"></div><pre id="python-error" class="python-error" hidden></pre><p id="python-help" class="python-help" hidden>Read the last line first. Check spelling, quotes, and indentation. You can reset the example and try one small change.</p>
      <p class="runtime-note">Python ${l.day >= 8 ? '+ GeoPandas' : l.day >= 5 ? '+ Pandas' : 'via Pyodide'}. The first run downloads the needed libraries. Later runs are faster. An internet connection is needed.</p>
    </section>
    <section class="exercise-card" aria-labelledby="exercise-title"><span class="exercise-icon">${icon(l.mission ? 'tree' : 'check')}</span><div class="exercise-body"><span class="eyebrow">${l.mission ? 'TODAY\'S MISSION' : 'ONE SMALL CHALLENGE'}</span><h3 id="exercise-title">${l.mission ? 'Make the report your own' : 'Give it a go'}</h3><p>${esc(l.task)}</p><details class="hint"><summary>A small hint</summary><p>${esc(l.hint)}</p></details>
      ${l.mission ? `<button class="button primary" id="check-mission">${icon('check')} Check my mission</button><p class="check-note">Checks your printed result${l.day === 9 ? ', map title, legend, and plotted point count' : ''}. Spacing between table columns can differ.</p>` : quiz(l)}
      <p class="feedback" id="exercise-feedback" role="status">${state.answers[l.id] ? '✓ You checked this step. You can practise it again.' : ''}</p>
      <details class="solution"><summary>See one solution</summary><p>Compare one line at a time. You can write it a different way.</p><pre><code>${highlight(l.answer)}</code></pre><button class="text-button" id="use-solution">Put this solution in the editor</button></details></div></section>
    <div class="remember-note">${icon('leaf')}<p><strong>${l.mission ? 'A useful stopping point.' : 'One idea is enough for now.'}</strong> ${l.mission ? 'You can stop here and come back. Your progress and code stay in this browser.' : 'Try the change yourself before moving on. You can always revisit this step.'}</p></div>
    ${lessonNavigation(l)}
    <div class="data-note">Practice data, real field names. The rows, coordinates, boundaries, and canopy sizes in this course are invented. They are not live City of Kitchener records.</div>`;
}

function highlight(code) {
  // One pass over original text avoids matching inside markup.
  return code.split('\n').map(line => {
    const parts = /^(\s*#.*)$/.test(line) ? `<span class="syntax-comment">${esc(line)}</span>` : line.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(import|from|as|def|return|for|in|if|else|not|try|except|True|False|None)\b|\b(print|len|round)\b|([&<>])/g, (m, str, kw, fn, special) => str ? `<span class="syntax-string">${esc(str)}</span>` : kw ? `<span class="syntax-keyword">${kw}</span>` : fn ? `<span class="syntax-function">${fn}</span>` : esc(special));
    return parts;
  }).join('\n');
}

function quiz(l) {
  const shift = lessons.indexOf(l) % l.options.length;
  const order = l.options.map((text, index) => ({ text, index }));
  const rotated = [...order.slice(shift), ...order.slice(0, shift)];
  return `<form id="quiz-form"><fieldset><legend>${esc(l.question)}</legend>${rotated.map(({ text, index }) => `<label class="quiz-option"><input type="radio" name="answer" value="${index}" required><span>${esc(text)}</span></label>`).join('')}</fieldset><button class="button secondary" type="submit">Check answer ${icon('arrow')}</button></form>`;
}

function lessonNavigation(l) {
  const index = lessons.indexOf(l);
  return `<div class="completion-bar"><label><input type="checkbox" id="complete-lesson" ${done(l.id) ? 'checked' : ''}><span>Mark this ${l.mission ? 'Mission' : 'lesson'} complete</span></label><span id="completion-note">${done(l.id) ? 'Nice work. Saved here.' : 'Go at your own pace.'}</span></div><nav class="lesson-navigation" aria-label="Previous and next lessons"><button class="button secondary" id="previous" ${index === 0 ? 'disabled' : ''}><span class="reverse">${icon('arrow')}</span> Previous</button><span>${index + 1} of ${lessons.length} steps</span><button class="button primary" id="next" ${index === lessons.length - 1 ? 'disabled' : ''}>${l.mission ? 'Next day' : 'Next step'} ${icon('arrow')}</button></nav>${index === lessons.length - 1 ? '<div class="next-chapter"><strong>You\'ve reached the end of the ready lessons.</strong><p>Days 16-21 are on the roadmap. Ask for the next batch when you are ready. We\'ll keep at least five days ready ahead of your current day when extending the course.</p></div>' : ''}`;
}

function interviewPage(topic) {
  const index = interviewTopics.indexOf(topic);
  return `<section class="interview-hero"><span class="eyebrow">GIS INTERVIEW PREP</span><h1>A clear answer.<br>In your own words.</h1><p>Your college training and student work are real experience to discuss.<br>There is no need to invent a job.</p><span class="hero-pill">${allCards.length} questions · answer first, then reveal</span></section><div class="lesson-title"><div><span class="eyebrow">TOPIC ${index + 1} OF ${interviewTopics.length}</span><h2>${esc(topic.title)}</h2><p>${esc(topic.subtitle)}</p></div><span class="reading-time">${icon('clock')} ${topic.minutes} min</span></div><div class="practice-instruction">${icon('book')} Read the question. Answer out loud. Then reveal the model answer and compare.</div><div class="interview-cards">${topic.cards.map((c, i) => `<article class="interview-card"><span class="card-counter">QUESTION ${String(i + 1).padStart(2, '0')}</span><h3>${esc(c.question)}</h3><details class="answer-reveal"><summary>Reveal model answer <span>+</span></summary><div class="model-answer">${esc(c.answer).split(/ (?=(?:Situation|Task|Action|Result):)/).map(p => `<p>${p}</p>`).join('')}<div class="answer-cue"><strong>Remember</strong><p>${esc(c.cue)}</p></div></div></details></article>`).join('')}</div><div class="completion-bar"><label><input type="checkbox" id="complete-topic" ${done(`i-${topic.id}`) ? 'checked' : ''}><span>Mark this topic practised</span></label><span>Saved on this browser</span></div><nav class="lesson-navigation" aria-label="Interview topics"><button class="button secondary" id="previous-topic" ${index === 0 ? 'disabled' : ''}><span class="reverse">${icon('arrow')}</span> Previous</button><button class="button primary" id="next-topic">${index === interviewTopics.length - 1 ? 'Mixed practice' : 'Next topic'} ${icon('arrow')}</button></nav>`;
}

function shuffledCards() {
  const copy = [...allCards];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
function practicePage() {
  if (!deck.length) { deck = shuffledCards(); cardIndex = 0; known = 0; deckRevealed = false; deckFinished = false; }
  if (deckFinished) return `<section class="interview-hero"><span class="eyebrow">SESSION FINISHED</span><h1>You practised ${known} questions.</h1><p>That is a useful session. Come back for another small round when you are ready.</p><button class="button primary" id="another-round">Start another round ${icon('shuffle')}</button></section>`;
  const c = deck[cardIndex];
  return `<section class="interview-hero compact"><span class="eyebrow">MIXED FLASHCARDS</span><h1>A little rehearsal.</h1><p>All topics, shuffled together. Take your time with each answer.</p></section><div class="flashcard-controls"><span>Card ${cardIndex + 1} of ${deck.length} · ${known} marked known</span><button class="text-button" id="shuffle">${icon('shuffle')} New shuffle</button></div><progress class="deck-progress" value="${cardIndex}" max="${deck.length}" aria-label="Flashcard session progress"></progress><article class="flashcard"><span class="topic-pill">${esc(c.topic)}</span><span class="eyebrow">SAY YOUR ANSWER OUT LOUD</span><h2>${esc(c.question)}</h2>${deckRevealed ? `<div class="flashcard-answer"><p>${esc(c.answer)}</p><div class="answer-cue"><strong>Remember</strong><p>${esc(c.cue)}</p></div></div><div class="flashcard-actions"><button class="button secondary" id="again">Practise again</button><button class="button primary" id="known">Got it ${icon('check')}</button></div>` : '<button class="button primary" id="reveal-card">Reveal answer</button>'}</article><p class="session-note">“Practise again” adds this card to the end of this session. Your course progress stays saved separately.</p><div id="session-result" role="status"></div>`;
}

function bind() {
  $('#sidebar').inert = window.matchMedia('(max-width: 860px)').matches && !menuOpen;
  $('#menu-toggle').onclick = () => toggleMenu();
  $('#scrim').onclick = () => toggleMenu(false);
  $('#brand').onclick = e => { e.preventDefault(); navigate('python', lessons[0].id); };
  document.querySelectorAll('[data-course]').forEach(b => b.onclick = () => navigate(b.dataset.course));
  document.querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => navigate('python', b.dataset.lesson));
  document.querySelectorAll('[data-topic]').forEach(b => b.onclick = () => navigate('interview', b.dataset.topic));
  if (state.course === 'python') bindPython(); else bindInterview();
}
function toggleMenu(open = !menuOpen) {
  menuOpen = open;
  $('#sidebar').classList.toggle('open', open); $('#scrim').classList.toggle('visible', open);
  $('#sidebar').inert = window.matchMedia('(max-width: 860px)').matches && !open;
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
  $('#menu-toggle').setAttribute('aria-label', open ? 'Close lesson menu' : 'Open lesson menu');
  document.body.classList.toggle('menu-open', open);
}
function navigate(course, id) {
  if (busy) stopPython();
  runVersion++; busy = false;
  state.course = course;
  if (id) state[course === 'python' ? 'lesson' : 'topic'] = id;
  save(); menuOpen = false; document.body.classList.remove('menu-open');
  render(); window.scrollTo({ top: 0, behavior: 'instant' }); $('#main').focus({ preventScroll: true });
}
function setComplete(id, checked) {
  state.completed = checked ? [...new Set([...state.completed, id])] : state.completed.filter(x => x !== id);
  save();
  $('#sidebar').innerHTML = sidebar(state.course === 'python');
  document.querySelectorAll('#sidebar [data-lesson]').forEach(b => b.onclick = () => navigate('python', b.dataset.lesson));
  document.querySelectorAll('#sidebar [data-topic]').forEach(b => b.onclick = () => navigate('interview', b.dataset.topic));
  if ($('#completion-note')) $('#completion-note').textContent = checked ? 'Nice work. Saved here.' : 'Go at your own pace.';
  document.querySelectorAll('.steps .step').forEach(b => { const finished = done(b.dataset.lesson); b.classList.toggle('done', finished); b.textContent = finished ? '✓' : lessons.filter(l => l.day === current().day).findIndex(l => l.id === b.dataset.lesson) + 1; });
}
function bindPython() {
  const l = current(); const editor = $('#code-editor');
  editor.oninput = () => { state.drafts[l.id] = editor.value; $('#draft-tag').textContent = '· your saved code'; save(); };
  editor.onkeydown = e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (!busy) execute(); }
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); const start = editor.selectionStart; editor.setRangeText('    ', start, editor.selectionEnd, 'end'); editor.dispatchEvent(new Event('input')); }
  };
  $('#reset-code').onclick = () => {
    editor.value = l.code; delete state.drafts[l.id]; save(); $('#draft-tag').textContent = '· example restored';
    $('#output').textContent = l.output || 'Example restored. Run it to see the result.';
    $('#plots').replaceChildren(); $('#python-error').hidden = true; $('#python-help').hidden = true;
  };
  $('#run-code').onclick = () => execute();
  $('#stop-code').onclick = () => stopPython();
  $('#quiz-form')?.addEventListener('submit', e => {
    e.preventDefault(); const selected = new FormData(e.currentTarget).get('answer');
    const right = Number(selected) === l.correct;
    $('#exercise-feedback').textContent = right ? '✓ That\'s right. You can explain this one.' : 'Not quite yet. Read the small explanation above and try another answer.';
    $('#exercise-feedback').classList.toggle('incorrect', !right);
    if (right) { state.answers[l.id] = true; save(); }
  });
  $('#check-mission')?.addEventListener('click', () => execute(true));
  $('#use-solution').onclick = () => { editor.value = l.answer; editor.dispatchEvent(new Event('input')); editor.focus(); $('#try-title').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  $('#complete-lesson').onchange = e => setComplete(l.id, e.target.checked);
  const index = lessons.indexOf(l);
  $('#previous').onclick = () => navigate('python', lessons[index - 1].id);
  $('#next').onclick = () => navigate('python', lessons[index + 1].id);
}

function busyUI(on) {
  busy = on;
  for (const id of ['#run-code', '#reset-code', '#check-mission', '#use-solution']) if ($(id)) $(id).disabled = on;
  if ($('#stop-code')) $('#stop-code').hidden = !on;
  if ($('#code-editor')) $('#code-editor').readOnly = on;
}
async function execute(check = false) {
  if (busy) return;
  const version = ++runVersion;
  const l = current(); const code = $('#code-editor').value;
  state.drafts[l.id] = code; save(); busyUI(true);
  $('#python-error').hidden = true; $('#python-help').hidden = true;
  const status = text => { if (version === runVersion && $('#run-status')) $('#run-status').textContent = text; };
  try {
    const result = await runPython(code, status);
    if (version !== runVersion) return;
    showResult(result);
    if (check && !result.error) {
      status('Checking your result against one working solution...');
      const reference = await runPython(l.answer, status);
      if (version !== runVersion) return;
      if (reference.error) throw new Error('The check could not finish. Your output is kept. Try again.');
      const plotFacts = r => JSON.stringify(r.plots.map(p => p.axes));
      const passed = normalizeOutput(result.output) === normalizeOutput(reference.output) && plotFacts(result) === plotFacts(reference);
      $('#exercise-feedback').textContent = passed ? '✓ Mission complete. Your result matches. Take a breath, then mark this step complete.' : 'Not quite yet. Compare your output with the task. Try the hint, or open one solution below.';
      $('#exercise-feedback').classList.toggle('incorrect', !passed);
      if (passed) { state.answers[l.id] = true; save(); }
    }
    status(result.error ? 'A small fix is needed. See the message below.' : 'Done. Your code ran in this browser.');
  } catch (error) {
    if (version === runVersion) {
      $('#python-error').hidden = false; $('#python-error').textContent = error.message;
      $('#python-help').hidden = false; status('Ready to try again.');
    }
  } finally { if (version === runVersion) busyUI(false); }
}
function showResult(result) {
  $('#output').textContent = result.output || (result.plots.length ? 'Your map is below.' : 'No printed output. Try adding print().');
  $('#output-label').textContent = 'Your Python output'; $('#plots').replaceChildren();
  result.plots.forEach(p => { const img = document.createElement('img'); img.src = `data:image/png;base64,${p.image}`; img.alt = p.axes.map(a => a.title).filter(Boolean).join(', ') || 'Plot from your Python code'; $('#plots').append(img); });
  if (result.error || result.warnings) { $('#python-error').hidden = false; $('#python-error').textContent = result.error || result.warnings; $('#python-help').hidden = !result.error; }
}
function bindInterview() {
  if (state.topic !== 'practice') {
    const topic = interviewTopics.find(t => t.id === state.topic); const index = interviewTopics.indexOf(topic);
    $('#complete-topic').onchange = e => setComplete(`i-${topic.id}`, e.target.checked);
    $('#previous-topic').onclick = () => navigate('interview', interviewTopics[index - 1].id);
    $('#next-topic').onclick = () => navigate('interview', interviewTopics[index + 1]?.id || 'practice');
  } else {
    if (deckFinished) {
      $('#another-round').onclick = () => { deck = []; render(); };
      return;
    }
    $('#reveal-card')?.addEventListener('click', () => { deckRevealed = true; render(); });
    $('#shuffle').onclick = () => { deck = []; render(); };
    $('#again')?.addEventListener('click', () => nextCard(false));
    $('#known')?.addEventListener('click', () => nextCard(true));
  }
}
function nextCard(gotIt) {
  if (gotIt) known++; else deck.push(deck[cardIndex]);
  if (cardIndex + 1 >= deck.length) {
    deckFinished = true; render();
  } else { cardIndex++; deckRevealed = false; render(); }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { toggleMenu(false); $('#menu-toggle').focus(); } });
window.matchMedia('(max-width: 860px)').addEventListener('change', () => {
  toggleMenu(false);
});
render();
