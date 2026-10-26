import type { Logger } from "pino";
import type { Config } from "../../config.js";
import { MockProvider } from "./mock.js";
import { RemoteYTMusicProvider } from "./remote.js";
import type { MusicProvider } from "./types.js";
import { YTMusicProvider } from "./ytmusic.js";

export * from "./types.js";
export { MockProvider } from "./mock.js";
export { YTMusicProvider } from "./ytmusic.js";

export function createMusicProvider(cfg: Config, log?: Logger): MusicProvider {
  if (cfg.MUSIC_PROVIDER === "mock") return new MockProvider();
  if (cfg.YTM_ADAPTER_URL) {
    return new RemoteYTMusicProvider({ url: cfg.YTM_ADAPTER_URL, secret: cfg.YTM_ADAPTER_SECRET!, minIntervalMs: cfg.YTM_MIN_INTERVAL_MS, log });
  }
  return new YTMusicProvider({
    pythonBin: cfg.PYTHON_BIN,
    adapterPath: cfg.YTM_ADAPTER_PATH,
    minIntervalMs: cfg.YTM_MIN_INTERVAL_MS,
    log,
  });
}
