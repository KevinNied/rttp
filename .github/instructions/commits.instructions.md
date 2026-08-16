---
description: Commit message conventions for every change in the RTTP repository
applyTo: "**"
---

# Commit messages

Use Conventional Commit-style titles for every commit:

```text
<type>: <concise description>
```

Commit titles must:

- be written in English;
- use one of the allowed types below;
- describe the primary effect of the commit;
- be concise and use the imperative mood;
- not end with a period.

## Allowed types

- `feat`: introduce a new user-facing feature.
- `fix`: correct a bug or regression.
- `docs`: change documentation only.
- `style`: change formatting without affecting behavior.
- `refactor`: restructure production code without changing its behavior.
- `test`: add or refactor tests without changing production behavior.
- `chore`: update build tasks, tooling, configuration, or package management
  without changing product behavior.

## Examples

```text
feat: add athlete sports agenda
fix: isolate progress between workout sessions
docs: document sports agenda roadmap
refactor: improve athlete experience in web desktop
chore: update Next.js build configuration
```

When a change could match multiple types, choose the type that represents its
main purpose. Split unrelated changes into separate commits when practical.
