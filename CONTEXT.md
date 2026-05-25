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
A numerical rank representing a player's skill level. ELO changes only when a player completes a Race — never as a result of someone else racing the player's own Ghost Runs. Calculation uses the standard ELO formula: `change = K × (outcome − expected_score)`, where expected score is derived from the difference between the racer's ELO and the Ghost Run's Stamped ELO. K=32 for a player's first 16 Races; K=16 thereafter. Starting ELO is determined by the player's self-reported Skill Level at onboarding.

## Skill Level
A self-reported knowledge level chosen by a player during onboarding: No Experience, Beginner, Intermediate, or Experienced. Determines the player's Starting ELO. Not updated automatically as the player's ELO changes.

## Daily Game
A standard 9×9 puzzle published daily at three difficulty tiers (Easy, Medium, Hard). Players choose which tier to play. Completing a Daily Game produces a Seed Run for that tier's matchmaking pool and posts the player's Effective Time to the Daily Leaderboard. Daily Games do not affect ELO.

## Difficulty Tier
One of three levels — Easy, Medium, Hard — that classify both puzzles and Ghost Runs. Matchmaking only pairs players with Ghost Runs of the same Difficulty Tier.

## Daily Leaderboard
A ranked list of Effective Times for all players who completed a given day's Daily Game. Resets each day with the new puzzle. Has no effect on ELO or Matchmaking.

## Matchmaking
The process of selecting a Ghost Run for a player to race. A player is matched to the eligible Ghost Run on the same puzzle difficulty whose stamped ELO is closest to the player's current ELO. If no Ghost Run exists within a tight ELO window, the window widens until a match is found.

## Stamped ELO
The ELO value permanently recorded on a Ghost Run at the moment the run is created. For a Winning Run, this is the creator's ELO after the Race that produced the Ghost Run (i.e., their post-win rating). For a Seed Run, this is the creator's ELO at the time they completed the Daily Game. The Stamped ELO never changes and is the value used for both Matchmaking and ELO calculation after a Race.

## Player
A registered user who participates in Races and has an ELO rating.
