(() => {
  'use strict';
  const api = window.WattWise, $ = id => document.getElementById(id), storageKey = 'wattwise-settings-v1';
  let state = api.defaults(), valid = true, lastResult;
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: state.currency }).format(value);
  const num = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value);
  const readNumber = input => input.value.trim() === '' ? NaN : Number(input.value);
  const message = text => { $('action-message').textContent = text; };
  function decode(value) { return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)))); }
  function encode(value) { return btoa(Array.from(new TextEncoder().encode(JSON.stringify(value)), n => String.fromCharCode(n)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) { const parsed = JSON.parse(saved); if (!api.validate(parsed)) { state = parsed; $('remember').checked = true; } }
  } catch (_) { message('Saved settings are unavailable in this browser. You can still use the calculator.'); }
  const shared = new URLSearchParams(location.search).get('estimate');
  if (shared) {
    try { if (shared.length > 16000) throw new Error(); const parsed = decode(shared); if (api.validate(parsed)) throw new Error(); state = parsed; message('Shared estimate loaded. Check the electricity rate for your location.'); }
    catch (_) { message('This share link is invalid. The calculator is showing your default or saved settings.'); }
  }
  function createField(label, prop, value, index, min, max, step, unit) {
    const field = document.createElement('div'); field.className = 'field';
    const id = `appliance-${index}-${prop}`, title = document.createElement('label'); title.htmlFor = id; title.textContent = label;
    const group = document.createElement('div'); group.className = 'input-unit';
    const input = document.createElement('input'); Object.assign(input, { id, type: 'number', min: String(min), max: String(max), step: String(step), value: String(value), required: true }); input.inputMode = step === 1 ? 'numeric' : 'decimal'; input.dataset.prop = prop; input.dataset.index = index;
    group.append(input); if (unit) { const suffix = document.createElement('span'); suffix.textContent = unit; group.append(suffix); }
    field.append(title, group); return field;
  }
  function renderInputs() {
    $('rate').value = state.rate; $('currency').value = state.currency; $('days').value = state.days;
    $('appliances').replaceChildren();
    state.appliances.forEach((a, index) => {
      const card = document.createElement('div'); card.className = 'appliance';
      const top = document.createElement('div'); top.className = 'appliance-top';
      const name = document.createElement('input'); Object.assign(name, { type: 'text', value: a.name, maxLength: 60, required: true, className: 'appliance-name' }); name.setAttribute('aria-label', `Appliance ${index + 1} name`); name.dataset.index = index; name.dataset.prop = 'name';
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove appliance ${index + 1}: ${a.name}`); remove.disabled = state.appliances.length === 1;
      remove.addEventListener('click', () => { state.appliances.splice(index, 1); renderInputs(); update(); const next = $('appliances').querySelectorAll('.appliance-name')[Math.min(index, state.appliances.length - 1)]; next.focus(); });
      top.append(name, remove);
      const fields = document.createElement('div'); fields.className = 'appliance-fields';
      fields.append(createField('Power', 'watts', a.watts, index, 0, 1000000, 'any', 'W'), createField('Daily use', 'hours', a.hours, index, 0, 24, 'any', 'hrs'), createField('Quantity', 'quantity', a.quantity, index, 1, 1000, 1));
      card.append(top, fields); $('appliances').append(card);
    });
    $('appliance-count').textContent = `${state.appliances.length} appliance${state.appliances.length === 1 ? '' : 's'}`;
    $('add-appliance').disabled = state.appliances.length >= 20;
  }
  function persist() {
    try { if ($('remember').checked && valid) localStorage.setItem(storageKey, JSON.stringify(state)); else if (!$('remember').checked) localStorage.removeItem(storageKey); }
    catch (_) { message('Your browser cannot save settings. Calculations still work.'); }
  }
  function update() {
    const error = api.validate(state); valid = !error;
    $('input-error').hidden = valid; $('input-error').textContent = error || '';
    document.querySelectorAll('#energy-form input').forEach(input => {
      if (input.type !== 'checkbox') input.setAttribute('aria-invalid', String(!input.validity.valid));
    });
    $('share').disabled = !valid; $('export').disabled = !valid;
    $('rate-symbol').textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: state.currency }).formatToParts(0).find(p => p.type === 'currency').value;
    if (!valid) {
      ['period-cost','period-energy','daily-cost','yearly-cost'].forEach(id => $(id).textContent = '—');
      $('period-label').textContent = 'Complete the inputs to calculate'; $('breakdown').replaceChildren(); $('savings-text').textContent = 'Your savings estimate will appear when the inputs are valid.'; return;
    }
    lastResult = api.estimate(state);
    $('period-label').textContent = `Estimated cost · ${state.days} day${state.days === 1 ? '' : 's'}`;
    $('period-cost').textContent = money(lastResult.periodCost); $('period-energy').textContent = num(lastResult.periodKwh); $('daily-cost').textContent = money(lastResult.dailyCost); $('yearly-cost').textContent = money(lastResult.yearlyCost);
    $('breakdown').replaceChildren();
    [...lastResult.appliances].sort((a,b) => b.periodCost - a.periodCost).forEach(a => {
      const item = document.createElement('li'), label = document.createElement('div'); label.className = 'bar-label';
      const name = document.createElement('span'); name.textContent = a.name; const cost = document.createElement('b'); cost.textContent = money(a.periodCost); label.append(name,cost);
      const track = document.createElement('div'); track.className = 'bar-track'; const bar = document.createElement('span'); bar.className = 'bar-fill'; bar.style.width = `${lastResult.periodKwh ? a.periodKwh / lastResult.periodKwh * 100 : 0}%`; track.append(bar); item.append(label,track); $('breakdown').append(item);
    });
    $('savings-text').textContent = `Using each appliance up to one hour less per day could save ${money(lastResult.savings)} over ${state.days} day${state.days === 1 ? '' : 's'}. Assumes the same power and rate.`;
    persist();
  }
  function readAll() {
    state.rate = readNumber($('rate')); state.days = readNumber($('days')); state.currency = $('currency').value;
    $('appliances').querySelectorAll('[data-prop]').forEach(input => { state.appliances[Number(input.dataset.index)][input.dataset.prop] = input.dataset.prop === 'name' ? input.value : readNumber(input); });
  }
  function add(preset) {
    readAll(); if (!valid || api.validate(state)) { update(); $('input-error').scrollIntoView({ block: 'nearest' }); return; }
    if (state.appliances.length >= 20) { message('You can compare up to 20 appliances.'); return; }
    state.appliances.push({ ...preset }); renderInputs(); update(); const fields = $('appliances').querySelectorAll('.appliance-name'); fields[fields.length - 1].focus();
  }
  $('energy-form').addEventListener('submit', event => event.preventDefault());
  $('energy-form').addEventListener('input', event => { if (event.target.id !== 'remember') { readAll(); update(); } });
  $('remember').addEventListener('change', persist);
  $('add-appliance').addEventListener('click', () => add({ name: 'New appliance', watts: 100, hours: 1, quantity: 1 }));
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => add(api.presets[button.dataset.preset])));
  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => { state = { ...api.defaults(), appliances: [{ ...api.presets[button.dataset.example] }] }; renderInputs(); update(); message('Example loaded at $0.16/kWh for 30 days. Enter your own rate to personalize it.'); $('calculator').scrollIntoView({ block: 'start' }); }));
  $('reset').addEventListener('click', () => { state = api.defaults(); renderInputs(); update(); message('Reset to the example settings.'); if (location.search) history.replaceState(null, '', location.pathname + location.hash); });
  $('export').addEventListener('click', () => {
    if (!valid) return; const blob = new Blob(['\ufeff', api.csv(state)], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'wattwise-electricity-estimate.csv'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); message('CSV downloaded. Costs exclude fixed charges and taxes.');
  });
  $('share').addEventListener('click', async () => {
    if (!valid) return; const url = new URL(location.pathname, location.origin); url.searchParams.set('estimate', encode(state)); url.hash = 'calculator';
    try { await navigator.clipboard.writeText(url.href); message('Share link copied. The link includes your calculator inputs.'); }
    catch (_) { window.prompt('Copy this share link (it includes your calculator inputs):', url.href); message('Copy the link from the dialog to share your estimate.'); }
  });
  renderInputs(); update();
})();
