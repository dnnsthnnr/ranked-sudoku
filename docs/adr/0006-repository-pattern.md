# Repository pattern (hexagonal architecture) for data access

All data access goes through repository interfaces defined in `src/repositories/`. Application code (Server Components, Server Actions, API routes) imports from these interfaces and never touches Drizzle types or the `src/db/` layer directly. Drizzle implementations live in `src/repositories/drizzle/` and are the only code allowed to import from `src/db/`.

We chose this over raw Drizzle-everywhere because the game loop has several distinct entities (Puzzle, Player, GhostRun, Race, DailyGame) that will be queried in many places. Without a boundary, Drizzle's inferred types, query builders, and table references sprawl into Server Actions and UI code, making the data layer impossible to swap or test in isolation. The repository layer also makes the domain model explicit — domain types in `src/domain/` are pure TypeScript structs with no ORM dependency, so they can be used freely across the codebase.

The practical rule: `src/app/` and `src/lib/` may only import from `src/domain/` and `src/repositories/`. They must never import from `src/db/`.
