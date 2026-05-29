import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { UserDbRegistry } from "@/domain/user-db-registry";
import type { UserDbRegistryRepository } from "@/repositories/user-db-registry.repository";
import { userDbRegistry } from "@/db/schema/control";
import type * as controlSchema from "@/db/schema/control";

export class DrizzleUserDbRegistryRepository implements UserDbRegistryRepository {
  constructor(private readonly db: LibSQLDatabase<typeof controlSchema>) {}

  async create(dbUrl: string, encryptedToken: string): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.insert(userDbRegistry).values({ id, dbUrl, encryptedToken });
    return id;
  }

  async findById(id: string): Promise<UserDbRegistry | null> {
    const row = await this.db.query.userDbRegistry.findFirst({
      where: eq(userDbRegistry.id, id),
    });
    return row ?? null;
  }

  async listAll(): Promise<UserDbRegistry[]> {
    return this.db.query.userDbRegistry.findMany();
  }
}
