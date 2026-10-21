import type { ProviderName } from "@/lib/types";
import { MockProvider } from "./mock";
import type { SearchProvider } from "./types";
import { XProvider } from "./x";

export function createProvider(name: ProviderName): SearchProvider {
  if (name === "x") {
    return new XProvider({ bearerToken: process.env.X_BEARER_TOKEN, baseUrl: process.env.X_API_BASE_URL });
  }
  return new MockProvider();
}

export type { SearchProvider } from "./types";
