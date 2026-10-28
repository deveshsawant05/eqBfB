import axios from 'axios';
import type { ForecastPoint, ActualPoint, AccuracyMetrics } from '../types';

// In development, Vite proxies /api → backend (see vite.config.ts)
// In production Docker, VITE_API_URL is set at build time
const BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : '';   // empty = same origin (works with Vite proxy in dev)

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90_000,   // accuracy endpoint can be slow on cold start
  headers: { 'Accept': 'application/json' },
});

// Add response interceptor for better error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail ?? err.message;
    return Promise.reject(new Error(detail));
  }
);

export const fetchForecasts = (date: string): Promise<ForecastPoint[]> =>
  api.get<ForecastPoint[]>('/api/forecasts', { params: { date } }).then((r) => r.data);

export const fetchActuals = (date: string): Promise<ActualPoint[]> =>
  api.get<ActualPoint[]>('/api/actuals', { params: { date } }).then((r) => r.data);

export const fetchAccuracy = (): Promise<AccuracyMetrics> =>
  api.get<AccuracyMetrics>('/api/accuracy').then((r) => r.data);
