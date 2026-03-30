---
name: aiui-repo-upkeep
description: >-
  Maintains AIUI project meta-documents: TODO.md, cursor.md, and PLAN.md
  updates when work completes or learnings appear. Use after finishing a
  feature or fix, when the user asks to sync docs, or when discovering new
  follow-up tasks. Ensures TODO items are removed when done and new items are
  added; appends durable learnings to cursor.md.
---

# AIUI Repo Upkeep

## When to apply

- After completing a task that touched multiple files or a whole phase milestone  
- When the user says “update TODO”, “sync docs”, or “record learnings”  
- When new bugs, tech debt, or follow-ups appear during implementation  

## TODO.md rules

1. **Remove** checkbox items that are fully done (or move to **Done** with date if the team prefers history).  
2. **Add** new items for newly discovered work (bugs, missing tests, follow-up refactors that are in scope).  
3. Keep bullets **short and verifiable**; reference phase in `PLAN.md` if unclear.  
4. Do **not** delete the “Done” section structure — use it if you move items there.  

## cursor.md rules

- Append to **Learnings** only for **durable** insights (wrong approaches, chosen patterns, tooling gotchas).  
- Update **stack** or **principles** if team decisions change.  
- One or two sentences per learning is enough.  

## PLAN.md rules

- Edit when **architecture** or **phase scope** changes materially.  
- For small tactical changes, prefer `cursor.md` Learnings or package READMEs.  

## Checklist before ending a session (if work shipped)

- [ ] `TODO.md` reflects completed work and new gaps  
- [ ] If needed, `cursor.md` Learnings updated  
- [ ] No stale “in progress” items left ambiguous without a TODO entry  
