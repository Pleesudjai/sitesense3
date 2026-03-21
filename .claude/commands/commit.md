# /commit — Commit and Document Command

Run after completing any feature or significant chunk of work.
Two-part process: code commit + AI layer update.

## Part 1: Document the Work

Append to `docs/decisions.md`:

```markdown
## [timestamp] — [Feature Name]
**What was built:** [1-2 sentences]
**Why we built it this way:** [key decision and reason]
**Files changed:** [list of files]
**Next:** [what this enables or what comes next]
```

## Part 2: Git Commit (if git is initialized)

```bash
git add -A
git commit -m "[type]: [short description]

[Longer explanation if needed]

- [Key change 1]
- [Key change 2]"
```

Commit types: `feat`, `fix`, `refactor`, `docs`, `style`, `data`

Examples:
- `feat: add pavement heat-tradeoff scoring engine`
- `fix: handle missing soil data gracefully`
- `docs: update handoff with current session progress`

## Part 3: Update AI Layer (if applicable)

If this session revealed something about how to work better with Claude, update:
- `.claude/rules/` — if a domain rule should be added
- `CLAUDE.md` — if a global convention changed

This keeps the AI layer improving with the project.
