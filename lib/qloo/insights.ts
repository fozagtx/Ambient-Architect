"use server";

const cache = new Map<string, { data: InsightResponse; expires: number }>();

function cacheKey(...parts: string[]) {
  return parts.join(":");
}

export interface InsightResponse {
  related: Array<{ id: string; name: string; type: string }>;
}

export async function cachedQlooInsights(
  entityIds: string[],
  targetType: string,
  limit: number
): Promise<InsightResponse | null> {
  const key = cacheKey("insights", ...entityIds.slice(0, 3), String(limit));
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  const params = new URLSearchParams();
  params.set("filter.type", targetType);
  params.set("limit", String(limit));

  entityIds.forEach((id) => params.append("signal.interests.entities", id));

  const res = await fetch(
    `${process.env.QLOO_BASE_URL ?? "https://hackathon.api.qloo.com"}/v2/insights?${params}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.QLOO_API_KEY ?? ""}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    console.warn("Qloo insights failed", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const result: InsightResponse = {
    related: Array.isArray(data?.results)
      ? data.results.map((item: unknown) => {
          const obj = item as Record<string, unknown>;
          return {
            id: String(obj.id ?? obj.entity_id ?? ""),
            name: String(obj.name ?? ""),
            type: String(obj.type ?? "unknown"),
          };
        })
      : [],
  };

  cache.set(key, { data: result, expires: now + 1000 * 60 * 15 });
  return result;
}
