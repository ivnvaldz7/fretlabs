# Skill Registry — fretlabs

Generated: 2026-06-25

## Compact Rules

### branch-pr
PR creation workflow. Trigger: creating a PR, opening a PR, preparing changes for review.
- Must follow issue-first enforcement: check for referenced issue before PR
- Create branch, commit, push, then open PR via `gh pr create`
- Use conventional commits, never add AI attribution

### go-testing
Go testing patterns for Gentleman.Dots. Trigger: writing Go tests, using teatest, adding coverage.
- Unit tests with standard `testing` package
- Bubbletea TUI tests with `teatest`
- Table-driven tests preferred
- Use `t.Helper()` for test helpers

### issue-creation
Issue creation workflow. Trigger: creating a GitHub issue, reporting a bug, requesting a feature.
- Create issues via `gh issue create`
- Include repro steps, expected vs actual behavior
- Use issue templates if available

### judgment-day
Parallel adversarial review protocol. Trigger: user says "judgment day", "review adversarial", "dual review", "doble review", "juzgar".
- Launch two independent blind judge sub-agents simultaneously
- Synthesize findings, apply fixes
- Re-judge until both pass or escalate after 2 iterations

### skill-creator
Creates new AI skills. Trigger: user asks to create a skill, add agent instructions, document patterns.
- Valid skill must have `name` and `description` in frontmatter
- SKILL.md file format with frontmatter, purpose, instructions sections
- Place in appropriate skills directory

## User Skills

| Skill | Trigger | Location |
|-------|---------|----------|
| branch-pr | Creating a pull request, opening a PR, or preparing changes for review | ~/.config/opencode/skills/branch-pr/SKILL.md |
| go-testing | Writing Go tests, using teatest, or adding test coverage | ~/.config/opencode/skills/go-testing/SKILL.md |
| issue-creation | Creating a GitHub issue, reporting a bug, or requesting a feature | ~/.config/opencode/skills/issue-creation/SKILL.md |
| judgment-day | "judgment day", "review adversarial", "dual review", "doble review", "juzgar" | ~/.config/opencode/skills/judgment-day/SKILL.md |
| skill-creator | Creating a new skill, adding agent instructions, documenting patterns | ~/.config/opencode/skills/skill-creator/SKILL.md |

## Project Conventions

- **claude.md** (CLAUDE.md): Project root — contains code conventions, architecture patterns, module contracts, testing commands, and domain notes for lutherie.
