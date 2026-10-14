(() => {
  const form = document.getElementById('annual-form');
  if (!form) return;
  const energy = document.getElementById('annual-energy'), rate = document.getElementById('annual-rate'), days = document.getElementById('annual-days'), error = document.getElementById('annual-error');
  const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
  const number = input => input.value.trim() === '' ? NaN : Number(input.value);
  function update() {
    const k = number(energy), r = number(rate), d = number(days);
    const validEnergy = Number.isFinite(k) && k >= 0 && k <= 1000000;
    const validRate = Number.isFinite(r) && r >= 0 && r <= 1000000;
    const validDays = Number.isInteger(d) && d >= 1 && d <= 366;
    [[energy,validEnergy],[rate,validRate],[days,validDays]].forEach(([input,valid])=>input.setAttribute('aria-invalid',String(!valid)));
    const valid = validEnergy && validRate && validDays;
    error.hidden = valid;
    error.textContent = !validEnergy ? 'Enter annual energy from 0 to 1,000,000 kWh.' : !validRate ? 'Enter a rate from 0 to 1,000,000 USD per kWh.' : !validDays ? 'Enter a period from 1 to 366 whole days.' : '';
    document.getElementById('annual-daily').textContent = valid ? new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(k/365) + ' kWh' : '—';
    document.getElementById('annual-period-label').textContent = valid ? `Cost for ${d} day${d===1?'':'s'}` : 'Period cost';
    document.getElementById('annual-period').textContent = valid ? money(k/365*d*r) : '—';
    document.getElementById('annual-cost').textContent = valid ? money(k*r) : '—';
  }
  form.addEventListener('submit',e=>e.preventDefault());
  form.addEventListener('input',update);
  update();
})();
