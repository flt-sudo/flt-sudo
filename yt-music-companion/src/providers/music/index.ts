import type { Logger } from "pino";
import type { Config } from "../../config.js";
import { MockProvider } from "./mock.js";
import type { MusicProvider } from "./types.js";
import { YTMusicProvider } from "./ytmusic.js";

export * from "./types.js";
export { MockProvider } from "./mock.js";
export { YTMusicProvider } from "./ytmusic.js";

export function createMusicProvider(cfg: Config, log?: Logger): MusicProvider {
  if (cfg.MUSIC_PROVIDER === "mock") return new MockProvider();
  return new YTMusicProvider({
    pythonBin: cfg.PYTHON_BIN,
    adapterPath: cfg.YTM_ADAPTER_PATH,
    minIntervalMs: cfg.YTM_MIN_INTERVAL_MS,
    log,
  });
}
