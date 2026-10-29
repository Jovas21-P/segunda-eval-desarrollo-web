'use strict';

const env = require('../config/env');

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

const SIMULATED_CONDITIONS = [
  { code: 'clear', description: 'cielo despejado', icon: '01d', adjustment: 0 },
  { code: 'clouds', description: 'nubes dispersas', icon: '03d', adjustment: 2 },
  { code: 'rain', description: 'lluvia ligera', icon: '10d', adjustment: 10 },
  { code: 'drizzle', description: 'llovizna', icon: '09d', adjustment: 6 },
  { code: 'thunderstorm', description: 'tormenta eléctrica', icon: '11d', adjustment: 12 },
  { code: 'mist', description: 'niebla', icon: '50d', adjustment: 5 },
];

const CONDITION_ADJUSTMENTS = {
  clear: 0,
  clouds: 2,
  drizzle: 6,
  rain: 10,
  thunderstorm: 12,
  snow: 15,
  mist: 5,
  fog: 5,
  haze: 5,
  smoke: 6,
};

function simulateWeather(lat, lon) {
  const seed = Math.abs(Math.round((lat + 90) * 100) + Math.round((lon + 180) * 100));
  const condition = SIMULATED_CONDITIONS[seed % SIMULATED_CONDITIONS.length];
  const temperatureC = Math.round((26 - Math.abs(lat) * 0.22 + (seed % 7)) * 10) / 10;

  return {
    code: condition.code,
    description: condition.description,
    icon: condition.icon,
    temperatureC,
    source: 'simulated',
  };
}

async function fetchOpenWeather({ lat, lon }) {
  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('appid', env.openWeatherApiKey);
  url.searchParams.set('units', 'metric');
  url.searchParams.set('lang', 'es');

  const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) {
    throw new Error(`OpenWeatherMap respondió ${response.status}`);
  }

  const data = await response.json();
  const main = (data.weather?.[0]?.main || 'Clear').toLowerCase();

  return {
    code: main,
    description: data.weather?.[0]?.description || 'sin información',
    icon: data.weather?.[0]?.icon || '01d',
    temperatureC: Math.round((data.main?.temp ?? 20) * 10) / 10,
    source: 'openweathermap',
  };
}

/**
 * Consulta el clima actual. Si no hay API key o la API falla, devuelve una
 * condición simulada para que la experiencia de la demo nunca se rompa.
 */
async function getCurrentWeather({ lat, lon }) {
  const key = `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let weather;
  if (!env.openWeatherApiKey || env.isTest) {
    weather = simulateWeather(Number(lat), Number(lon));
  } else {
    try {
      weather = await fetchOpenWeather({ lat: Number(lat), lon: Number(lon) });
    } catch (error) {
      weather = {
        ...simulateWeather(Number(lat), Number(lon)),
        source: 'simulated-fallback',
      };
    }
  }

  cache.set(key, { value: weather, expiresAt: Date.now() + CACHE_TTL_MS });
  return weather;
}

async function getDeliveryEstimate({ lat, lon }) {
  const weather = await getCurrentWeather({ lat, lon });
  const adjustment = CONDITION_ADJUSTMENTS[weather.code] ?? 3;
  const etaMinutes = Math.max(10, Math.round(env.delivery.baseEtaMinutes + adjustment));

  return {
    etaMinutes,
    weather,
    origin: { lat: Number(lat), lon: Number(lon) },
  };
}

function clearWeatherCache() {
  cache.clear();
}

module.exports = { getCurrentWeather, getDeliveryEstimate, clearWeatherCache, simulateWeather };
