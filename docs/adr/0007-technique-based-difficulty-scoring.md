# Technique-based difficulty scoring with 4 tiers and offline batch generation

Puzzle difficulty is determined by a technique-based solver that simulates human reasoning, not by clue count. The solver assigns each puzzle a Difficulty Tier (Easy, Medium, Hard, Expert) based on the hardest technique required, and a Puzzle Score based on the weighted sum of all technique applications. Puzzles are generated offline in a batch job that classifies each puzzle as it is produced.

## Why not clue count

Clue count is a poor proxy for human-perceived difficulty. A 23-clue puzzle can be solvable with naked singles alone while a 30-clue puzzle may require X-wings. Two puzzles with the same clue count can have vastly different solve times for a human. The technique-based approach measures what a human actually has to do to solve the puzzle, which correlates directly with solve time — the outcome variable that determines Race results.

## Why weighted sum over max technique

The Puzzle Score uses a weighted sum of all technique applications, not just the hardest one. A puzzle requiring 15 X-wing applications will take significantly longer than one requiring a single X-wing, even though both are classified as Expert. The weighted sum captures total solving effort and therefore predicts solve time better than a single peak-difficulty value. Tier assignment still derives from the max technique so that tier boundaries remain crisp and explainable.

## Why 4 tiers

The technique hierarchy has four natural human-perceived clusters: naked singles only (Easy); hidden singles and pointing pairs (Medium); naked and hidden pairs and triples (Hard); X-wing and above (Expert). The jump between Hard and Expert is the sharpest perceived cliff for human solvers. Fewer than 4 tiers would merge clusters with meaningfully different solve-time distributions; more than 4 would thin the matchmaking pool per tier without a corresponding gain in matchmaking precision.

## Why offline batch generation

Targeting a specific tier during on-demand puzzle generation would require discarding many attempts — Expert puzzles are rare by chance, making on-demand generation impractically slow. The batch job generates puzzles with a clue-count hint that biases toward the target tier, classifies each result, and fills tier pools until they reach the configured target size. This decouples generation latency from request latency entirely.

## Considered Options

- **Clue count only**: Rejected because it correlates poorly with human solve time and produces puzzles that players perceive as wrongly rated.
- **Empirical difficulty from player data**: Rejected because the player base does not yet exist at launch; no historical solve-time data is available to derive ratings from.
- **Max technique for score**: Rejected in favour of weighted sum because two puzzles with the same hardest technique can have very different total solving efforts and therefore different expected solve times.
- **On-demand generation to tier**: Rejected because Expert-tier puzzles would require hundreds of discarded attempts, making generation impractically slow at request time.
- **3 tiers**: Rejected because the existing 3-tier boundary between Medium and Hard collapsed two technique clusters (pointing pairs vs. naked pairs) that players perceive as meaningfully different.
