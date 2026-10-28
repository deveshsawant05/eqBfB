import { useState, useCallback } from 'react';
import { fetchAccuracy } from '../api/client';
import type { AccuracyMetrics } from '../types';

interface UseAccuracyDataResult {
  metrics: AccuracyMetrics | null;
  loading: boolean;
  error: string | null;
  load: () => void;
}

export function useAccuracyData(): UseAccuracyDataResult {
  const [metrics, setMetrics] = useState<AccuracyMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (metrics || loading) return;
    setLoading(true);
    setError(null);
    fetchAccuracy()
      .then(setMetrics)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [metrics, loading]);

  return { metrics, loading, error, load };
}
