# Ranked Sudoku — Domain Glossary

## Ghost Run
A recorded completion of a puzzle by a player, used as an asynchronous opponent. A Ghost Run stores the player's full interaction sequence (every cell entry, erasure, and timestamp) to support both Effective Time calculation and future move-by-move replay visualization. Only Eligible Ghost Runs enter the matchmaking pool: a Ghost Run is eligible if it originated from a Daily Game (Seed Run) or from a Race the creator won (Winning Run). Ghost Runs from lost Races are not eligible and are discarded.

## Seed Run
A Ghost Run produced by completing a Daily Game. Seed Runs are always eligible for matchmaking regardless of the player's Effective Time, since there is no opponent to win or lose against in a Daily Game.

## Race
The act of a player attempting to beat a Ghost Run on the same puzzle. The win condition is Effective Time: a player wins if their Effective Time is less than the Ghost Run's Effective Time. The outcome of a Race determines the player's ELO change. The Ghost Run's creator is not a participant in the Race and their ELO is not affected by its outcome.

## Effective Time
The score used to determine the winner of a Race. Computed as raw completion time plus 10 seconds per Mistake. Both the racer and the Ghost Run have an Effective Time; the lower value wins. A player who reaches 3 Mistakes loses the Race immediately, regardless of remaining time or the Ghost Run's Effective Time.

## Mistake
An incorrect digit entered into a cell, detected immediately on entry. Each Mistake adds 10 seconds to the player's Effective Time. Reaching 3 Mistakes ends the Race as a loss for that player. The Ghost Run's Mistakes are baked into its recorded Effective Time and do not trigger disqualification during a Race.

## ELO
A numerical rank representing a player's skill level. ELO changes only when a player completes a Race — never as a result of someone else racing the player's own Ghost Runs. The Ghost Run creator's ELO at a specific point in time is used solely as a calibration input to determine the magnitude of the racer's ELO change.

## Daily Game
A puzzle published on a fixed schedule (daily) at one or more difficulty levels. Completing a Daily Game produces a Seed Run that enters the matchmaking pool. Daily Games are the primary source of new Ghost Runs.

## Matchmaking
The process of selecting a Ghost Run for a player to race. A player is matched to the eligible Ghost Run on the same puzzle difficulty whose creator's ELO (at time of Ghost Run creation) is closest to the player's current ELO. If no Ghost Run exists within a tight ELO window, the window widens until a match is found.

## Player
A registered user who participates in Races and has an ELO rating.
