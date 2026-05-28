import type { UserDbRegistry } from "@/domain/user-db-registry";

export interface UserDbRegistryRepository {
  register(playerId: string, dbUrl: string, poolId?: string | null): Promise<void>;
  findByPlayer(playerId: string): Promise<UserDbRegistry | null>;
  listByPool(poolId: string): Promise<UserDbRegistry[]>;
}
