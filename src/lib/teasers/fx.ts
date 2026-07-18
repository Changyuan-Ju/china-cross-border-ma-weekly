type UsdRate = { rate: number; date: Date };

const rateCache = new Map<string, UsdRate | null>();

export async function getUsdRate(currency: string | null, receivedAt: Date): Promise<UsdRate | null> {
  const code = currency?.trim().toUpperCase();
  if (!code) return null;
  const requestedDate = receivedAt.toISOString().slice(0, 10);
  if (code === "USD") return { rate: 1, date: new Date(`${requestedDate}T00:00:00.000Z`) };

  const cacheKey = `${code}:${requestedDate}`;
  if (rateCache.has(cacheKey)) return rateCache.get(cacheKey) ?? null;

  try {
    const response = await fetch(`https://api.frankfurter.dev/v1/${requestedDate}?base=${encodeURIComponent(code)}&symbols=USD`, {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store"
    });
    if (!response.ok) {
      rateCache.set(cacheKey, null);
      return null;
    }
    const body = await response.json() as { date?: unknown; rates?: { USD?: unknown } };
    const rate = body.rates?.USD;
    const date = typeof body.date === "string" ? new Date(`${body.date}T00:00:00.000Z`) : null;
    const result = typeof rate === "number" && Number.isFinite(rate) && date && !Number.isNaN(date.getTime()) ? { rate, date } : null;
    rateCache.set(cacheKey, result);
    return result;
  } catch {
    rateCache.set(cacheKey, null);
    return null;
  }
}
