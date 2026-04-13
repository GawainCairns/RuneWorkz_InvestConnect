Repository purpose

This repository stores personal AI prompts and Copilot skills used for frontend and backend development. Keep content focused on reusable prompts, examples, and small helper scripts.

Where skills live

- Project skills for authoring or testing skill files: `.github/skills/`.
- Authoritative frontend and backend skills used by the codebase: `skills/` (top-level). Keep frontend and backend skill subfolders under `skills/frontend/` and `skills/backend/` respectively.

Skill file format

- Each skill is a kebab-case folder containing a `SKILL.md` file with YAML frontmatter and a Markdown body. See `.github/skills/skill-file-format/SKILL.md` for the canonical template and examples.

Rules and intent

- Use `.github/skills/` only for authoring, testing, and meta-skills that help create other skills and prompts.
- Store runtime or consumable skills (the ones you want to surface to Copilot in normal usage) in the top-level `skills/` folder.
- Keep `SKILL.md` focused (≤ 1024-char description) and include sample data or helper scripts in the same folder when useful.

How to add a skill

1. Create `skills/<scope>/<kebab-name>/` (for example `skills/frontend/object-path/`).
2. Add `SKILL.md` with the required frontmatter: `name`, `description`, and optional `argument-hint` and `user-invocable` fields.
3. Add example data or `template.js` helpers in the same folder.

If you want this repo to include skill-development helpers (templates, validators, conversion scripts), put them under `.github/skills/` and mark them `user-invocable: false` if they should not be surfaced in normal Copilot menus.

Contact

If you change this layout, update this file so Copilot and future contributors follow the intended structure.
