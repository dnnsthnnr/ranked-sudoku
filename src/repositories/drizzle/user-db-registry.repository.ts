import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { UserDbRegistry } from "@/domain/user-db-registry";
import type { UserDbRegistryRepository } from "@/repositories/user-db-registry.repository";
import { userDbRegistry } from "@/db/schema/control";
import type * as controlSchema from "@/db/schema/control";

export class DrizzleUserDbRegistryRepository implements UserDbRegistryRepository {
  constructor(private readonly db: LibSQLDatabase<typeof controlSchema>) {}

  async register(playerId: string, dbUrl: string, poolId: string | null = null): Promise<void> {
    await this.db
      .insert(userDbRegistry)
      .values({ playerId, dbUrl, poolId })
      .onConflictDoUpdate({ target: userDbRegistry.playerId, set: { dbUrl, poolId } });
  }

  async findByPlayer(playerId: string): Promise<UserDbRegistry | null> {
    const row = await this.db.query.userDbRegistry.findFirst({
      where: eq(userDbRegistry.playerId, playerId),
    });
    return row ?? null;
  }

  async listByPool(poolId: string): Promise<UserDbRegistry[]> {
    return this.db.query.userDbRegistry.findMany({
      where: eq(userDbRegistry.poolId, poolId),
    });
  }
}
