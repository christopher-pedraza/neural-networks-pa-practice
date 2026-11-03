# Programming Assignments Practice

Static React + TypeScript app for practising PyTorch code from your own scripts.
No backend — questions and the PyTorch reference are JSON files fetched at runtime.

- **Fill in the blanks** — type the missing line(s)/expressions.
- **Identify & correct** — flag the buggy lines and type the fix.
- Both accept *multiple valid answers*, show a description of what the snippet does,
  have progressive hints, and can be filtered by category (script).
- A searchable **PyTorch reference** opens as a side panel without leaving the question.
- Infinite practice mode (shuffled, reshuffles when exhausted).

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # component + grading tests
npm run validate   # check public/data/** against schema/
npm run build      # validate + typecheck + bundle to dist/
```
Requires Node >= 22.18 (the validator imports the app's TS normaliser directly).

## Adding questions

1. Give the AI the prompt in [`docs/AI_PROMPT.md`](docs/AI_PROMPT.md) plus a Python script.
2. Save its output as `public/data/questions/<name>.jsonl` (a `.json` array also works).
3. List the file in [`public/data/manifest.json`](public/data/manifest.json) → `questionFiles`.
4. Put the reference in `public/data/pytorch_reference.json`.
5. `npm run validate` — it reports the file/line and the problem for bad AI output.

Schemas: [`schema/question.schema.json`](schema/question.schema.json),
[`schema/reference.schema.json`](schema/reference.schema.json).
The files in `public/data` are samples; replace them with your own.

## Answer matching

Whitespace around punctuation and quote style are ignored (`x=a+b` ≡ `x = a + b`,
`'a'` ≡ `"a"`); keywords still need their spaces and matching is case-sensitive.
Anything else must be listed in `answers` / `fixes` (or covered by `accepted_patterns`).

## Deploy (GitHub Pages)

Repo → Settings → Pages → Source: **GitHub Actions**. Pushing to `main` runs
`.github/workflows/deploy.yml`. The build uses relative URLs (`base: './'`), so it
works under `https://<user>.github.io/<repo>/` without configuration.

## Layout

```
public/data/            manifest.json, questions/*.jsonl, pytorch_reference.json
schema/                 JSON Schemas for the data files
docs/AI_PROMPT.md       prompt template for generating data
scripts/validate-data.mjs
src/lib/                data.ts (fetch/parse), normalize.ts + grade.ts (answer checking)
src/hooks/usePractice.ts  shuffled infinite queue
src/components/         QuestionView, FillBlank, FindFix, Hints, CategoryFilter, ReferencePanel
```
