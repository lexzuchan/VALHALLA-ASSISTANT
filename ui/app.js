'use strict';
const $ = (id) => document.getElementById(id),
  api = window.valhalla;
let settings = {},
  project = { title: 'Untitled engineering workspace', notes: '', messages: [] },
  attachments = [],
  busy = false,
  currentPage = 'home',
  calcResult,
  simResult,
  simIndex = 0,
  animation = null,
  recording = null,
  recordingStarting = false,
  recordTimer = null,
  savingTimer,
  toastTimer;
const fmt = (value) =>
  Math.abs(value) !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 1e7)
    ? value.toExponential(4)
    : Number(value.toPrecision(7)).toLocaleString('en-US', { maximumFractionDigits: 6 });
const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
const invoke = (name, value) => api.invoke(name, value);
function toast(message) {
  $('toast').textContent = message;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('toast').hidden = true), 6500);
}
const pages = {
  home: ['SYSTEM OVERVIEW', 'Command center'],
  chat: ['COLLABORATIVE INTELLIGENCE', 'AI workspace'],
  tools: ['EQUATIONS / UNITS / ASSUMPTIONS', 'Engineering tools'],
  simulation: ['EXPLORE CAUSE AND EFFECT', 'Simulation lab'],
  notes: ['CAPTURE THE REASONING', 'Project notebook'],
  settings: ['YOUR CONNECTION / YOUR CONTROL', 'Settings & connection'],
};
$('project-notes').placeholder =
  'Goal:\n\nKnown values and units:\n\nConstraints:\n\nAssumptions to test:\n\nNext experiment:';
function go(page) {
  if (!pages[page]) return;
  currentPage = page;
  document
    .querySelectorAll('main.page')
    .forEach((node) => (node.hidden = node.id !== page + '-page'));
  document
    .querySelectorAll('.nav-item[data-page]')
    .forEach((node) => node.classList.toggle('active', node.dataset.page === page));
  $('page-kicker').textContent = pages[page][0];
  $('page-title').textContent = pages[page][1];
  if (page === 'simulation') requestAnimationFrame(drawSimulation);
  if (page === 'home') requestAnimationFrame(drawReference);
  if (page === 'chat') {
    $('messages').scrollTop = $('messages').scrollHeight;
    $('prompt').focus();
  }
}
function promptChat(text) {
  go('chat');
  $('prompt').value = text;
  $('prompt').focus();
}
document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.page) go(button.dataset.page);
  if (button.dataset.prompt) promptChat(button.dataset.prompt);
  if (button.dataset.window)
    invoke('window', button.dataset.window).catch((error) => toast(error.message));
});
function renderConnection() {
  const ready = !!settings.localStatus?.ready;
  $('connection-label').textContent = ready ? 'Local AI ready' : 'Local AI setup';
  $('connection-detail').textContent = ready
    ? settings.model + ' / ON THIS LAPTOP'
    : 'No API key needed';
  $('connection-dot').classList.toggle('configured', ready);
  $('home-ai').textContent = ready ? 'LOCAL READY' : 'LOCAL SETUP';
  $('chat-model').textContent = (settings.model || 'valhalla-local') + ' / LOCAL ONLY';
  $('model').value = settings.model || 'valhalla-local';
  $('speak').checked = !!settings.speak;
  $('speak-toggle').classList.toggle('active', !!settings.speak);
  $('speak-toggle').setAttribute('aria-pressed', String(!!settings.speak));
  $('footer-status').textContent = 'LOCAL ONLY / NO PAID API';
  $('microphone').disabled = true;
  $('microphone').title = 'Voice dictation is unavailable in this local edition';
  $('local-status').textContent = ready
    ? 'Downloaded local model found. Ready for chat.'
    : settings.localStatus?.error || 'Click Check local AI after running setup.';
}
function syncProject() {
  project.title = $('project-title').value.trim() || 'Untitled engineering workspace';
  project.notes = $('project-notes').value;
  $('workspace-title').textContent = project.title;
}
async function saveProject() {
  syncProject();
  try {
    await invoke('saveProject', project);
    $('save-status').textContent = 'Saved locally at ' + new Date().toLocaleTimeString();
  } catch (error) {
    $('save-status').textContent = error.message;
    toast(error.message);
  }
}
function scheduleSave() {
  syncProject();
  $('save-status').textContent = 'Unsaved changes…';
  clearTimeout(savingTimer);
  savingTimer = setTimeout(saveProject, 700);
}
$('project-title').addEventListener('input', scheduleSave);
$('project-notes').addEventListener('input', scheduleSave);
$('save-notes').onclick = saveProject;
$('export-project').onclick = async () => {
  syncProject();
  try {
    const result = await invoke('exportProject', project);
    if (result.saved) toast('Project exported.');
  } catch (error) {
    toast(error.message);
  }
};
function renderMessages() {
  const container = $('messages');
  container.replaceChildren();
  if (!project.messages.length) {
    const empty = el('div', undefined, 'chat-empty');
    empty.append(
      icon('logo'),
      el('h3', 'What are we building?'),
      el(
        'p',
        'Describe a problem or attach a short text reference. Run local setup first; no API key is needed.',
      ),
    );
    container.append(empty);
  }
  for (const message of project.messages) {
    const item = el('article', undefined, 'message ' + message.role);
    item.append(
      el(
        'div',
        message.role === 'user' ? 'YOU / ENGINEERING LEAD' : 'V.A.L.H.A.L.L.A / ASSISTANT',
        'message-label',
      ),
      el('div', message.text, 'message-text'),
    );
    container.append(item);
  }
  container.scrollTop = container.scrollHeight;
}
function appendToolResults(results) {
  const message = $('messages').lastElementChild;
  if (!message) return;
  for (const result of results) {
    const card = el('div', undefined, 'tool-result');
    card.append(
      el('strong', 'LOCAL TOOL RESULT / ' + result.title.toUpperCase()),
      el('div', result.formula),
      el('div', result.values.map((v) => v.name + ': ' + fmt(v.value) + ' ' + v.unit).join(' · ')),
      el('div', 'Assumptions: ' + result.assumptions),
    );
    if (result.warning) card.append(el('div', result.warning, 'warning'));
    message.append(card);
  }
  $('messages').scrollTop = $('messages').scrollHeight;
}
function setBusy(value) {
  busy = value;
  $('send').hidden = value;
  $('cancel').hidden = !value;
  for (const id of ['attach', 'new-chat']) $(id).disabled = value;
  $('microphone').disabled = true;
  $('prompt').disabled = value;
}
async function sendMessage() {
  const text = $('prompt').value.trim();
  if (!text || busy) return;
  if (recording || recordingStarting) {
    toast('Stop the voice recording before sending a message.');
    return;
  }
  if (project.messages.length > 194) {
    toast('Export your project and start a new conversation before continuing.');
    return;
  }
  if (attachments.length && !$('file-consent').checked) {
    toast('Check “Include attached text in local chat” to include these references.');
    return;
  }
  syncProject();
  project.messages.push({ role: 'user', text, created: Date.now() });
  renderMessages();
  $('prompt').value = '';
  setBusy(true);
  $('ai-status').textContent = 'Connecting to the model on this laptop…';
  const ids = attachments.map((f) => f.id);
  try {
    const result = await invoke('chat', {
      messages: project.messages.slice(-24),
      attachmentIds: ids,
      filesConsent: $('file-consent').checked,
      includeNotes: $('include-notes').checked,
      notes: project.notes,
    });
    project.messages.push({ role: 'assistant', text: result.text, created: Date.now() });
    settings.localStatus = { ready: true };
    renderConnection();
    renderMessages();
    appendToolResults(result.calculations || []);
    for (const id of ids) await invoke('removeFile', id);
    attachments = [];
    renderAttachments();
    if (settings.speak && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(result.text.slice(0, 9000));
      utterance.rate = 1;
      const voices = speechSynthesis.getVoices();
      const english = voices.find((v) => v.lang.startsWith('en'));
      if (english) utterance.voice = english;
      speechSynthesis.speak(utterance);
    }
  } catch (error) {
    toast(error.message);
    $('ai-status').textContent = error.message;
  } finally {
    setBusy(false);
    await saveProject();
    $('prompt').focus();
  }
}
$('send').onclick = sendMessage;
$('prompt').onkeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};
$('cancel').onclick = () => invoke('cancel').catch((error) => toast(error.message));
$('new-chat').onclick = async () => {
  if (
    busy ||
    !confirm(
      'Start a new conversation? Export first if you want to keep a separate copy. Project notes are kept.',
    )
  )
    return;
  project.messages = [];
  renderMessages();
  await saveProject();
};
api.onStatus((message) => {
  $('ai-status').textContent = message;
});
function renderAttachments() {
  const container = $('attachments');
  container.replaceChildren();
  for (const file of attachments) {
    const item = el('div', undefined, 'attachment');
    const remove = el('button');
    remove.type = 'button';
    remove.title = 'Remove ' + file.name;
    remove.setAttribute('aria-label', remove.title);
    remove.append(icon('close'));
    remove.onclick = async () => {
      try {
        await invoke('removeFile', file.id);
        attachments = attachments.filter((f) => f.id !== file.id);
        renderAttachments();
      } catch (error) {
        toast(error.message);
      }
    };
    item.append(el('span', file.name + ' · ' + Math.ceil(file.bytes / 1024) + ' KB'), remove);
    container.append(item);
  }
  $('file-consent-label').hidden = !attachments.length;
  if (!attachments.length) $('file-consent').checked = false;
}
$('attach').onclick = async () => {
  try {
    attachments.push(...(await invoke('importFiles')));
    renderAttachments();
  } catch (error) {
    toast(error.message);
  }
};
$('microphone').onclick = () => toast('Voice dictation is not included in the local-only edition.');
$('speak-toggle').onclick = async () => {
  settings.speak = !settings.speak;
  if (!settings.speak) window.speechSynthesis?.cancel();
  try {
    settings = await invoke('settings', {
      model: settings.model,
      speak: settings.speak,
    });
    renderConnection();
    toast(settings.speak ? 'Spoken replies enabled.' : 'Spoken replies disabled.');
  } catch (error) {
    toast(error.message);
  }
};
$('settings-form').onsubmit = async (event) => {
  event.preventDefault();
  try {
    settings = await invoke('settings', { model: $('model').value, speak: $('speak').checked });
    renderConnection();
    $('settings-status').textContent = 'Local settings saved. No API key is used.';
  } catch (error) {
    $('settings-status').textContent = error.message;
  }
};
$('check-local').onclick = async () => {
  const button = $('check-local');
  button.disabled = true;
  $('local-status').textContent = 'Checking Ollama and downloaded weights…';
  try {
    settings = await invoke('settings', { model: $('model').value, speak: $('speak').checked });
    settings.localStatus = await invoke('localStatus');
    renderConnection();
  } catch (error) {
    $('local-status').textContent = error.message;
  } finally {
    button.disabled = false;
  }
};
$('open-setup').onclick = () => invoke('openSetup').catch((error) => toast(error.message));
function buildFields(container, kind, prefix) {
  container.replaceChildren();
  for (const [key, label, unit, value, min, max] of Physics.specs[kind].fields) {
    const field = el('label', undefined, 'field');
    const caption = el('span', label + ' (' + unit + ')'),
      input = el('input');
    input.id = prefix + key;
    input.type = 'number';
    input.step = 'any';
    input.min = min;
    input.max = max;
    input.value = value;
    input.required = true;
    field.append(caption, input);
    container.append(field);
  }
}
function getInputs(kind, prefix) {
  return Object.fromEntries(
    Physics.specs[kind].fields.map(([key]) => [key, Number($(prefix + key).value)]),
  );
}
function renderResults(container, result) {
  container.replaceChildren();
  container.append(el('div', result.formula, 'equation'));
  const values = el('div', undefined, 'result-values');
  for (const value of result.values) {
    const card = el('div', undefined, 'result-value');
    const number = el('strong', fmt(value.value));
    number.append(el('small', value.unit));
    card.append(number, el('small', value.name));
    values.append(card);
  }
  container.append(values);
  const assumptions = el('p', undefined, 'assumptions');
  assumptions.append(el('b', 'MODEL ASSUMPTIONS'), document.createTextNode(result.assumptions));
  container.append(assumptions);
  if (result.warning) container.append(el('p', result.warning, 'warning'));
}
function calculate() {
  try {
    const kind = $('calc-kind').value;
    calcResult = Physics.calculate(kind, getInputs(kind, 'calc-'));
    $('calc-title').textContent = calcResult.title;
    renderResults($('calc-results'), calcResult);
    $('calc-error').textContent = '';
  } catch (error) {
    $('calc-error').textContent = error.message;
  }
}
for (const [kind, spec] of Object.entries(Physics.specs)) {
  const option = el('option', spec.title);
  option.value = kind;
  $('calc-kind').append(option);
}
$('calc-kind').onchange = () => {
  buildFields($('calc-fields'), $('calc-kind').value, 'calc-');
  calculate();
};
$('calc-form').onsubmit = (event) => {
  event.preventDefault();
  calculate();
};
$('calc-to-chat').onclick = () => {
  if (calcResult)
    promptChat(
      'Help me interpret this local calculation. Check its assumptions and explain what I should verify next.\n\n' +
        JSON.stringify({ ...calcResult, points: [] }, null, 2),
    );
};
function conversion() {
  try {
    $('unit-result').textContent =
      fmt(
        Physics.convert(Number($('unit-value').value), $('unit-from').value, $('unit-to').value),
      ) +
      ' ' +
      $('unit-to').value;
  } catch (error) {
    $('unit-result').textContent = error.message;
  }
}
for (const unit of Object.keys(Physics.units)) {
  for (const id of ['unit-from', 'unit-to']) {
    const option = el('option', unit);
    option.value = unit;
    $(id).append(option);
  }
}
$('unit-from').value = 'm';
$('unit-to').value = 'mm';
$('unit-form').onsubmit = (event) => {
  event.preventDefault();
  conversion();
};
function stopAnimation() {
  if (animation !== null) cancelAnimationFrame(animation);
  animation = null;
  $('sim-play').textContent = 'Play motion';
}
function updateSimulation() {
  try {
    stopAnimation();
    simResult = Physics.calculate($('sim-kind').value, getInputs($('sim-kind').value, 'sim-'));
    simIndex = 0;
    $('sim-progress').value = 0;
    $('sim-title').textContent = simResult.title;
    renderResults($('sim-results'), simResult);
    $('sim-error').textContent = '';
    drawSimulation();
  } catch (error) {
    $('sim-error').textContent = error.message;
  }
}
$('sim-kind').onchange = () => {
  buildFields($('sim-fields'), $('sim-kind').value, 'sim-');
  updateSimulation();
};
$('sim-form').onsubmit = (event) => {
  event.preventDefault();
  updateSimulation();
};
function drawChart(canvas, result, index, compact = false) {
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width < 1 || bounds.height < 1) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * ratio);
  canvas.height = Math.round(bounds.height * ratio);
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  const w = bounds.width,
    h = bounds.height,
    pad = compact ? { l: 15, r: 10, t: 10, b: 10 } : { l: 64, r: 22, t: 26, b: 49 },
    points = result.points;
  if (!points.length) return;
  let xmin = Math.min(0, ...points.map((p) => p.x)),
    xmax = Math.max(...points.map((p) => p.x)),
    ymin = Math.min(0, ...points.map((p) => p.y)),
    ymax = Math.max(...points.map((p) => p.y));
  if (xmax === xmin) xmax = xmin + 1;
  if (ymax === ymin) ymax = ymin + 1;
  const margin = (ymax - ymin) * 0.08;
  ymax += margin;
  if (ymin < 0) ymin -= margin;
  const xp = (x) => pad.l + ((x - xmin) / (xmax - xmin)) * (w - pad.l - pad.r),
    yp = (y) => h - pad.b - ((y - ymin) / (ymax - ymin)) * (h - pad.t - pad.b);
  ctx.clearRect(0, 0, w, h);
  ctx.font = '9px Segoe UI';
  ctx.strokeStyle = '#1b3542';
  ctx.fillStyle = '#7d9ba9';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const x = pad.l + (i / 4) * (w - pad.l - pad.r),
      y = pad.t + (i / 4) * (h - pad.t - pad.b);
    ctx.beginPath();
    ctx.moveTo(x, pad.t);
    ctx.lineTo(x, h - pad.b);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    if (!compact) {
      ctx.textAlign = 'center';
      ctx.fillText(fmt(xmin + ((xmax - xmin) * i) / 4), x, h - pad.b + 17);
      ctx.textAlign = 'right';
      ctx.fillText(fmt(ymax - ((ymax - ymin) * i) / 4), pad.l - 9, y + 3);
    }
  }
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(xp(p.x), yp(p.y)) : ctx.moveTo(xp(p.x), yp(p.y))));
  ctx.strokeStyle = '#79e4e0';
  ctx.lineWidth = compact ? 1.5 : 2;
  ctx.stroke();
  if (index !== undefined) {
    const p = points[Math.min(index, points.length - 1)];
    ctx.beginPath();
    ctx.arc(xp(p.x), yp(p.y), 4, 0, Math.PI * 2);
    ctx.fillStyle = '#e2bf8b';
    ctx.fill();
  }
  if (!compact) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8fadb9';
    ctx.fillText(result.xLabel, pad.l + (w - pad.l - pad.r) / 2, h - 8);
    ctx.save();
    ctx.translate(14, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(result.yLabel, 0, 0);
    ctx.restore();
  }
}
function drawSimulation() {
  if (!simResult) return;
  drawChart($('sim-chart'), simResult, simIndex);
  $('sim-time').textContent = 't = ' + fmt(simResult.points[simIndex].t) + ' s';
}
function drawReference() {
  const result = Physics.calculate('projectile', {
    speed: 25,
    angle: 45,
    height: 0,
    gravity: 9.80665,
  });
  drawChart($('reference-chart'), result, undefined, true);
  const values = el('div', undefined, 'reference-values');
  for (const value of result.values.slice(0, 2)) {
    const item = el('div');
    item.append(
      el('strong', fmt(value.value) + ' ' + value.unit),
      el('small', value.name.toUpperCase()),
    );
    values.append(item);
  }
  $('reference-results').replaceChildren(values);
}
$('sim-play').onclick = () => {
  if (animation !== null) {
    stopAnimation();
    return;
  }
  if (!simResult) return;
  const start = performance.now() - (simIndex / 240) * 6000;
  $('sim-play').textContent = 'Pause motion';
  function tick(now) {
    simIndex = Math.min(240, Math.floor(((now - start) / 6000) * 240));
    $('sim-progress').value = simIndex;
    drawSimulation();
    if (simIndex >= 240) {
      stopAnimation();
      simIndex = 0;
    } else animation = requestAnimationFrame(tick);
  }
  animation = requestAnimationFrame(tick);
};
$('sim-reset').onclick = () => {
  stopAnimation();
  simIndex = 0;
  $('sim-progress').value = 0;
  drawSimulation();
};
$('sim-progress').oninput = () => {
  stopAnimation();
  simIndex = Number($('sim-progress').value);
  drawSimulation();
};
$('sim-export').onclick = () => {
  if (!simResult) return;
  const content = [
    '"Time (s)","' + simResult.xLabel + '","' + simResult.yLabel + '"',
    ...simResult.points.map((p) => `${p.t},${p.x},${p.y}`),
  ].join('\n');
  const blob = new Blob([content], { type: 'text/csv' }),
    url = URL.createObjectURL(blob),
    link = el('a');
  link.href = url;
  link.download = 'VALHALLA-' + simResult.kind + '.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
};
const observer = new ResizeObserver(() => {
  if (currentPage === 'simulation') drawSimulation();
  if (currentPage === 'home') drawReference();
});
observer.observe($('reference-chart'));
observer.observe($('sim-chart'));
function clock() {
  $('clock').textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
clock();
setInterval(clock, 10000);
window.addEventListener('beforeunload', () => {
  clearTimeout(recordTimer);
  if (recording) {
    recording.stream.getTracks().forEach((track) => track.stop());
  }
  window.speechSynthesis?.cancel();
});
async function init() {
  buildFields($('calc-fields'), 'projectile', 'calc-');
  calculate();
  buildFields($('sim-fields'), 'projectile', 'sim-');
  updateSimulation();
  conversion();
  try {
    const data = await invoke('bootstrap');
    settings = data.settings;
    project = data.project;
    if (!Array.isArray(project.messages)) project.messages = [];
    $('project-title').value = project.title || 'Untitled engineering workspace';
    $('project-notes').value = project.notes || '';
    syncProject();
    renderConnection();
    renderMessages();
  } catch (error) {
    toast(error.message);
  }
  requestAnimationFrame(drawReference);
}
init();
