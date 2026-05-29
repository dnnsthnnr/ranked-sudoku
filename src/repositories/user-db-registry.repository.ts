import type { UserDbRegistry } from "@/domain/user-db-registry";

export interface UserDbRegistryRepository {
  create(dbUrl: string, encryptedToken: string): Promise<string>;
  findById(id: string): Promise<UserDbRegistry | null>;
  listAll(): Promise<UserDbRegistry[]>;
}
