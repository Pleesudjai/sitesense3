# /prime — Session Initialization Command

Run this at the START of every new Claude Code session to get up to speed.

## Steps

1. **Read the global rules:**
   Read `CLAUDE.md` — understand the project, stack, and conventions.

2. **Check recent decisions:**
   Read `docs/decisions.md` — see what has been decided and why.

3. **Check handoff (if exists):**
   If `docs/handoff.md` exists, read it — it contains the last session's summary.

4. **Scan source code:**
   Run a quick scan of `src/` to understand current file structure:
   ```
   List all files in src/ recursively
   ```

5. **Check git log (if git initialized):**
   ```
   git log --oneline -10
   ```
   This gives you the last 10 commits as a memory of what was built.

6. **Report back:**
   Tell me in 3–5 bullet points:
   - What project we're building
   - What has been completed
   - What is in progress
   - What still needs to be done
   - Any open questions or blockers

Now you are fully oriented. Ask me what we should work on next.
