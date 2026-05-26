# Async ghost-run competition instead of real-time multiplayer

Players race against recorded completions (Ghost Runs) of other players rather than competing in real-time sessions. We chose this because it eliminates matchmaking wait times, works naturally across time zones, and keeps the infrastructure simple — no persistent game server or connection synchronisation is required. Real-time multiplayer would demand low-latency infrastructure and simultaneous availability of two players at the same skill level, making cold-start and low-activity periods unplayable.

## Considered Options

- **Real-time 1v1**: both players receive the same puzzle simultaneously and race live. Rejected due to infrastructure complexity and the need for both players to be online at the same moment.
- **Asynchronous challenge (post a score, others beat it)**: similar to Ghost Runs but with no visual opponent presence during play. Rejected in favour of Ghost Runs because the future plan is to animate the opponent's moves, which requires the full interaction sequence.
