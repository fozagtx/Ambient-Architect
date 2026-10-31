import { QlooEntity } from "@/lib/types";

export interface SearchParams {
  query: string;
  type?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  type: string;
}

export class QlooClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl =
      baseUrl ?? process.env.QLOO_BASE_URL ?? "https://hackathon.api.qloo.com";
    this.apiKey = apiKey ?? process.env.QLOO_API_KEY ?? "";
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
  }

  async search({ query, type }: SearchParams): Promise<SearchResult | null> {
    const params = new URLSearchParams({ q: query });
    if (type) params.set("type", type);

    const res = await fetch(`${this.baseUrl}/search?${params}`, {
      headers: this.headers(),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("Qloo search failed", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const first = data?.[0];
    if (!first) return null;
    return {
      id: first.id ?? first.entity_id ?? "",
      name: first.name ?? query,
      type: first.type ?? "unknown",
    };
  }

  async resolveEntity(query: string, type?: string): Promise<QlooEntity | null> {
    const result = await this.search({ query, type });
    if (!result) return null;
    return {
      id: result.id,
      name: result.name,
      type: result.type,
    };
  }
}

export const qlooClient = new QlooClient();
