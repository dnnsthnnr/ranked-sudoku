# Hybrid client-side Race outcome validation

When a Race ends, the client submits both the result (Effective Time, mistake count, completion timestamp) and the full event log to the server. The server validates the submission by spot-checking: it verifies that the reported mistake count matches the number of incorrect entries in the event log, and that the total elapsed time is plausible given the event sequence. It does not fully replay the solve.

Full server-side replay verification would be cheat-proof but adds compute cost and latency at Race end for a problem that doesn't yet exist (pre-launch, small player base). Trusting the client entirely is exploitable with trivial HTTP manipulation. The hybrid approach catches naive cheats — the most common form at this scale — at negligible cost. The event log is stored regardless (it becomes the Ghost Run's replay payload in R2), so full verification can be added later without changing the data model.
