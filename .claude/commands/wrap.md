Close out this session. Update the repo docs so they never lag the code:
1. Bump the version. Add a CHANGELOG.md entry describing what shipped (most-recent-first).
2. Update docs/CURRENT-STATE.md: deployed version, what shipped, what's outstanding, current working sequence.
3. Append any decisions to docs/DECISION-LOG.md in the existing format (PROD-/UX-/ARCH-/STRAT-/OPS-/LEGAL- prefix, status, date). Never delete an entry; supersede it.
4. Update the "Deployed version" line at the top of CLAUDE.md.
5. Write full replacement files, not fragments. Stage the doc changes in the SAME commit as the code.
Then show me git diff --cached for approval. Don't push until I say so.
