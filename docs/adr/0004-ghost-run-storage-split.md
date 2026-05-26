# Ghost Run storage split: metadata in Turso, replay payload in R2

A Ghost Run's matchmaking metadata (Stamped ELO, Effective Time, puzzle ID, Difficulty Tier, creator ID) is stored as a row in Turso. The replay payload — the full interaction sequence of cell entries, erasures, and timestamps — is stored as an object in Cloudflare R2, keyed by Ghost Run ID.

Keeping the replay payload in SQLite would bloat the database over time (every Race produces a new blob) and Turso charges per stored byte. The replay payload is only needed once — when a player starts a Race — making it a poor fit for a row-oriented query database. R2 is the right tool: cheap bulk storage, no egress fees, and direct client download without routing through the application server. Matchmaking queries hit only Turso and never touch R2.
