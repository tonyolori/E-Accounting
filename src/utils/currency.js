const DEFAULT_BASE = process.env.BASE_CURRENCY || 'USD';

function isISOCurrency(code) {
  return typeof code === 'string' && /^[A-Z]{3}$/.test(code);
}

function normalizeCurrency(code) {
  return (code || '').toString().trim().toUpperCase();
}

function getRatesConfig() {
  try {
    if (process.env.FX_RATES_JSON) {
      const parsed = JSON.parse(process.env.FX_RATES_JSON);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (_) {}
  return { USD: 1, NGN: 1500 };
}

function getRatesAt() {
  return process.env.FX_RATES_AT || new Date().toISOString();
}

function getConversionRate(from, to) {
  const rates = getRatesConfig();
  const f = normalizeCurrency(from);
  const t = normalizeCurrency(to);
  if (!isISOCurrency(f) || !isISOCurrency(t)) return null;
  if (f === t) return 1;
  const rFrom = rates[f];
  const rTo = rates[t];
  if (!rFrom || !rTo) return null;
  const amountPerUSDFrom = 1 / rFrom; // if rates are units per 1 USD
  const usdPerUnitFrom = amountPerUSDFrom; // alias for clarity
  const unitsPerUSDTarget = rTo;
  return usdPerUnitFrom * unitsPerUSDTarget;
}

function convertAmount(amount, from, to) {
  if (from === to) return Number(amount);
  const rate = getConversionRate(from, to);
  if (!rate) return null;
  const val = Number(amount) * rate;
  return Number.isFinite(val) ? val : null;
}

module.exports = {
  DEFAULT_BASE,
  isISOCurrency,
  normalizeCurrency,
  getConversionRate,
  convertAmount,
  getRatesAt,
  getRatesConfig
};
