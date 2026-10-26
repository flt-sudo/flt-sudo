import { build } from "./bootstrap.js";
import { baseUrl, loadConfig } from "./config.js";
import { createLogger } from "./logger.js";

const cfg = loadConfig();
const log = createLogger(cfg.LOG_LEVEL);
const built = await build(cfg, log);

const server = built.app.listen(cfg.PORT, cfg.HOST, () => {
  log.info(
    { url: baseUrl(cfg), listen: `${cfg.HOST}:${cfg.PORT}`, music: built.provider.name, llm: `${built.llm.name}/${built.llm.model}` },
    "YouTube Music Companion running",
  );
  if (cfg.HOST !== "127.0.0.1" && cfg.HOST !== "localhost" && !cfg.PUBLIC_BASE_URL?.startsWith("https://")) {
    log.warn("Listening on a non-loopback interface without HTTPS. Put it behind an HTTPS reverse proxy or tunnel.");
  }
});

const shutdown = async () => {
  server.close();
  await built.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
