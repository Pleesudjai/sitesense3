# /handoff — Session Handoff Command

Use when: context is getting long (50+ messages), switching tasks, or ending a session.
This creates a `docs/handoff.md` that the next session reads with `/prime`.

## Steps

1. **Summarize what was accomplished this session:**
   - What features were built?
   - What files were created or modified?
   - What decisions were made (and why)?

2. **Capture current state:**
   - What is working?
   - What is broken or incomplete?
   - What is the next immediate task?

3. **List open questions or blockers:**
   - Anything unresolved that the next session should address

4. **Write to `docs/handoff.md`:**

   ```markdown
   # Session Handoff
   Date: [timestamp]
   Session: [brief description of what this session focused on]

   ## Completed This Session
   - [Item 1]
   - [Item 2]

   ## Current State
   ### Working
   - [Feature/component that works]

   ### In Progress / Incomplete
   - [What's half-done and where it stands]

   ### Broken
   - [Anything broken and what caused it]

   ## Next Steps (Priority Order)
   1. [First thing next session should do]
   2. [Second thing]
   3. [Third thing]

   ## Open Questions
   - [ ] [Question 1]

   ## Key Files Modified This Session
   - `src/[file]` — [what changed]
   ```

5. **Confirm:** Tell the user "Handoff written to docs/handoff.md. Start the next session with /prime."
