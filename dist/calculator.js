(function (root) {
  'use strict';
  const currencies = ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'INR', 'CNY'];
  const presets = {
    heater: { name: 'Space heater', watts: 1500, hours: 4, quantity: 1 },
    ac: { name: 'Air conditioner', watts: 1200, hours: 4, quantity: 1 },
    pc: { name: 'Desktop computer', watts: 300, hours: 6, quantity: 1 },
    dryer: { name: 'Clothes dryer', watts: 3000, hours: 0.75, quantity: 1 },
    light: { name: 'LED light bulb', watts: 10, hours: 5, quantity: 1 }
  };
  const defaults = () => ({ rate: 0.16, currency: 'USD', days: 30, appliances: [{ ...presets.heater }] });
  function validate(state) {
    if (!state || typeof state !== 'object') return 'Invalid calculator settings.';
    if (!Number.isFinite(state.rate) || state.rate < 0 || state.rate > 1000000) return 'Enter an electricity rate from 0 to 1,000,000.';
    if (!currencies.includes(state.currency)) return 'Choose a supported currency.';
    if (!Number.isInteger(state.days) || state.days < 1 || state.days > 366) return 'Enter a billing period from 1 to 366 whole days.';
    if (!Array.isArray(state.appliances) || state.appliances.length < 1 || state.appliances.length > 20) return 'Add between 1 and 20 appliances.';
    for (let i = 0; i < state.appliances.length; i++) {
      const a = state.appliances[i], prefix = `Appliance ${i + 1}: `;
      if (!a || typeof a.name !== 'string' || !a.name.trim() || a.name.length > 60) return prefix + 'enter a name of up to 60 characters.';
      if (!Number.isFinite(a.watts) || a.watts < 0 || a.watts > 1000000) return prefix + 'enter watts from 0 to 1,000,000.';
      if (!Number.isFinite(a.hours) || a.hours < 0 || a.hours > 24) return prefix + 'enter daily hours from 0 to 24.';
      if (!Number.isInteger(a.quantity) || a.quantity < 1 || a.quantity > 1000) return prefix + 'enter a quantity from 1 to 1,000.';
    }
    return null;
  }
  function estimate(state) {
    const error = validate(state);
    if (error) throw new RangeError(error);
    const appliances = state.appliances.map(a => {
      const dailyKwh = a.watts / 1000 * a.hours * a.quantity;
      return { ...a, dailyKwh, periodKwh: dailyKwh * state.days, periodCost: dailyKwh * state.days * state.rate };
    });
    const dailyKwh = appliances.reduce((sum, a) => sum + a.dailyKwh, 0);
    const dailyCost = dailyKwh * state.rate;
    const savings = appliances.reduce((sum, a) => sum + a.watts / 1000 * Math.min(a.hours, 1) * a.quantity, 0) * state.rate * state.days;
    return { appliances, dailyKwh, dailyCost, periodKwh: dailyKwh * state.days, periodCost: dailyCost * state.days, yearlyCost: dailyCost * 365, savings };
  }
  function csv(state) {
    const result = estimate(state);
    const quote = value => { let text = String(value); if (/^[=+\-@\t\r\n]/.test(text.trimStart())) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; };
    const rows = [['Appliance', 'Watts', 'Hours per day', 'Quantity', 'Days', 'Rate per kWh', 'Currency', 'Period kWh', 'Period cost'], ...result.appliances.map(a => [a.name, a.watts, a.hours, a.quantity, state.days, state.rate, state.currency, a.periodKwh.toFixed(4), a.periodCost.toFixed(4)]), ['TOTAL', '', '', '', state.days, state.rate, state.currency, result.periodKwh.toFixed(4), result.periodCost.toFixed(4)]];
    return rows.map(row => row.map(quote).join(',')).join('\r\n') + '\r\n';
  }
  const api = { currencies, presets, defaults, validate, estimate, csv };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WattWise = api;
})(typeof window !== 'undefined' ? window : globalThis);
