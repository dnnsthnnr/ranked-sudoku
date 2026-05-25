# Ranked Sudoku — Domain Glossary

## Ghost Run
A recorded completion of a puzzle by a player, used as an asynchronous opponent. A Ghost Run captures enough information for another player to race against it (at minimum: completion time; potentially full move sequence for visualization). Ghost Runs are seeded primarily through Daily Games.

## Race
The act of a player attempting to beat a Ghost Run on the same puzzle. The outcome of a Race determines the player's ELO change. The Ghost Run's creator is not a participant in the Race and their ELO is not affected by its outcome.

## ELO
A numerical rank representing a player's skill level. ELO changes only when a player completes a Race — never as a result of someone else racing the player's own Ghost Runs. The Ghost Run creator's ELO at a specific point in time is used solely as a calibration input to determine the magnitude of the racer's ELO change.

## Daily Game
A puzzle published on a fixed schedule (daily) at one or more difficulty levels. Completing a Daily Game produces a Ghost Run that enters the matchmaking pool. Daily Games are the primary source of new Ghost Runs.

## Player
A registered user who participates in Races and has an ELO rating.
