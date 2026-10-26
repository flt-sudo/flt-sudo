import type { DB } from "../db/index.js";
import { nowIso } from "../db/index.js";
import { open, seal } from "./crypto.js";

/**
 * Encrypted credential vault. Plaintext credentials exist only in memory while
 * being handed to an integration; at rest they are AES-256-GCM sealed with the
 * MASTER_KEY, bound to the provider name via AAD.
 */
export class CredentialStore {
  constructor(private db: DB, private key: Buffer) {}

  async put(provider: string, secret: string, meta: Record<string, unknown> = {}): Promise<void> {
    const sealed = seal(this.key, secret, `cred:${provider}`);
    const row = { provider, ...sealed, meta: JSON.stringify(meta), created_at: nowIso() };
    await this.db
      .insertInto("credentials")
      .values(row)
      .onConflict((oc) => oc.column("provider").doUpdateSet(row))
      .execute();
  }

  async get(provider: string): Promise<string | null> {
    const row = await this.db.selectFrom("credentials").selectAll().where("provider", "=", provider).executeTakeFirst();
    if (!row) return null;
    return open(this.key, row, `cred:${provider}`);
  }

  async meta(provider: string): Promise<{ connected: boolean; created_at?: string; meta?: Record<string, unknown> }> {
    const row = await this.db
      .selectFrom("credentials")
      .select(["created_at", "meta"])
      .where("provider", "=", provider)
      .executeTakeFirst();
    if (!row) return { connected: false };
    return { connected: true, created_at: row.created_at, meta: row.meta ? JSON.parse(row.meta) : {} };
  }

  /** Disconnect: removes the sealed secret. Remote-side revocation is documented per provider. */
  async delete(provider: string): Promise<boolean> {
    const res = await this.db.deleteFrom("credentials").where("provider", "=", provider).executeTakeFirst();
    return Number(res.numDeletedRows) > 0;
  }
}
