# /execute — Implementation Command

Use this in a FRESH session to implement a spec. Keep context clean — no planning baggage.

## Setup

Before implementing, confirm:
1. Read `CLAUDE.md` for conventions
2. Read the spec file at `specs/[feature-name].md`
3. DO NOT read previous conversation history — start clean

## Implementation Rules

- Follow the spec exactly. If something is unclear, ask before guessing.
- Complete steps in order — don't skip ahead.
- Check off each step in the spec as you complete it.
- After each major step, briefly summarize what was built (1–2 lines).
- If you hit a blocker, say so immediately — don't spend more than 5 minutes stuck.

## Code Quality Checklist
Before marking any file complete:
- [ ] Function has a one-line comment
- [ ] No hardcoded values (use constants or .env)
- [ ] Error handling in place
- [ ] Tested manually (even just once)

## When Done
Run `/commit` to log what was built.
