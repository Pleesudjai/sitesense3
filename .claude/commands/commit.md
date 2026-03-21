# /commit — SiteSense Commit and Document

Run after completing any feature, fix, or significant change.

## Part 1: Log the decision

Append to `docs/decisions.md`:

```markdown
## [timestamp] — [Feature/Fix Name]
**What was built:** [1-2 sentences]
**Why this approach:** [key technical or product decision]
**Files changed:** [list]
**Next:** [what this unblocks]
```

## Part 2: Git commit

```bash
git add src/ netlify/ CLAUDE.md docs/ specs/
git commit -m "[type]: [short description]

- [Key change 1]
- [Key change 2]"
```

**SiteSense commit types:**
| Type | Use for |
|------|---------|
| `feat` | New feature (new GIS layer, new UI component, new engineering calculation) |
| `fix` | Bug fix (API error, broken render, wrong calculation) |
| `prompt` | Claude prompt change in `ai/translate.py` |
| `deploy` | netlify.toml, render.yaml, env var setup |
| `refactor` | Code cleanup, no behavior change |
| `docs` | CLAUDE.md, decisions.md, handoff.md update |

**Examples:**
- `feat: add USDA soil caliche detection and PT slab flag`
- `fix: handle FEMA API timeout with fallback flood zone X`
- `prompt: improve Claude 6-section report for non-technical users`
- `deploy: set Netlify function timeout to 26s`

## Part 3: Update AI layer (if applicable)

If this session revealed a better way to work:
- New coding pattern → add to `.claude/rules/backend.md` or `frontend.md`
- New prompt strategy → update `.claude/rules/ai-layer.md`
- New architecture decision → update `CLAUDE.md`
