You convert PyTorch / neural-network Python scripts into practice questions for a

code-recall study app. Output **JSONL**: one complete JSON object per line, no

prose, no markdown fences, no trailing commas, no comments. Every line must

validate against the schema described below.



## Goal

From the scripts inside pa_source_files/*, produce about 8-15 questions covering its

important lines: model definition, data handling, loss/optimizer setup, the

training loop, evaluation, shape manipulation, and any non-obvious API usage.

Mix the two question types (`fill_blank` and `find_fix`). Questions must be

self-contained: a learner sees ONLY the snippet in `code` plus your text.

Include any imports or variable definitions the snippet depends on as comments

or as visible code lines (e.g. `# x: (batch, 1, 28, 28)`).



## Common fields (every question)

| field | required | notes |

|---|---|---|

| `id` | yes | unique, lowercase `[a-z0-9_.-]`, e.g. `"lin-reg-train-step-01"` |

| `type` | yes | `"fill_blank"` or `"find_fix"` |

| `category` | yes | **exactly** `"{{SCRIPT_NAME}}"` for every question from this script |

| `source` | no | `{"script": "{{SCRIPT_NAME}}", "lines": "22-30"}` (original line range) |

| `title` | yes | short, does not give away the answer |

| `description` | yes | 1-3 sentences: what the **correct** snippet does overall and why. Shown to the learner always, so it must NOT contain the answer verbatim |

| `difficulty` | no | `"easy"` \| `"medium"` \| `"hard"` |

| `tags` | no | free-form strings |

| `code` | yes | Python source as one string, lines joined with `\n`, 4-space indentation preserved. Keep it short (5-25 lines) |

| `hints` | yes | array of >= 2 strings, ordered vague -> specific; the last may nearly give it away |

| `explanation` | no | shown after answering; the "why" |

| `related_reference` | no | names from the PyTorch reference file (e.g. `"torch.nn.Linear"`) |



## `fill_blank`

Replace the lines/expressions to be recalled with a marker `<<BLANK:id>>` inside

`code`. A marker can be a whole line (indentation before it is kept) or inline

(`optimizer = optim.SGD(<<BLANK:params>>, lr=0.01)`). Then add `blanks`:



```json

"blanks": [

  {

    "id": "zero",                       // matches <<BLANK:zero>>; letters, digits, _ and -

    "answers": ["optimizer.zero_grad()", "optimizer.zero_grad(set_to_none=True)"],

    "accepted_patterns": [],            // optional regexes, rarely needed

    "placeholder": "clear old gradients" // optional

  }

]

```

Rules:

- `answers` must list **every** reasonable way to write the blank, e.g. different

  but equivalent methods (`x.view(x.size(0), -1)`, `x.flatten(1)`,

  `torch.flatten(x, 1)`, `x.reshape(x.size(0), -1)`), alias spellings

  (`nn.Linear(1, 1)` and `nn.Linear(in_features=1, out_features=1)`), and

  equivalent variable names only if the surrounding code allows them.

  `answers[0]` is the canonical one shown as the solution.

- The learner types the blank **without leading indentation**. Do not include it in answers.

- Matching ignores whitespace around punctuation and quote style (`'` vs `"`);

  it is **case-sensitive** and compares whole strings. Don't enumerate spacing variants.

- A multi-line blank (several statements) uses `\n` inside the answer string

  (include each accepted multi-line version as its own entry). Avoid unless needed.

- Every marker needs exactly one `blanks` entry and vice-versa. Each marker appears once.

- Prefer blanking the part that is conceptually important, not trivial syntax.

- `accepted_patterns`: JS regex, implicitly anchored (`^...$`), tested against the

  learner's input with whitespace runs collapsed to a single space. Only use when

  enumerating answers is impractical (e.g. kwargs in any order).

- Do not include `errors` in a `fill_blank` question.



## `find_fix`

`code` is the script excerpt **with deliberate bugs** inserted (1-3 per question).

Prefer realistic, instructive bugs: wrong dimension, missing `.eval()`/`no_grad`,

`zero_grad` after `backward`, wrong loss for the task, softmax before

`CrossEntropyLoss`, forgetting `.to(device)`, wrong tensor shape, off-by-one.

Bugs must be on **single lines**; if one mistake spans two lines, register two errors.

Syntax-valid code only (the learner reads, they don't run it).



```json

"errors": [

  {

    "line": 9,                                   // 1-based line number inside `code`

    "fixes": ["pred = logits.argmax(dim=1)",     // EVERY accepted replacement for that

              "pred = logits.argmax(1)",         //   whole line (indentation ignored);

              "pred = logits.argmax(dim=-1)"],   //   fixes[0] is canonical

    "explanation": "Class axis is dim 1, not the batch axis."

  }

]

```

Rules:

- `line` counts lines of the buggy `code` string starting at 1. Double check it.

- A fix must be the **entire corrected line**, and must differ from the buggy line.

- Use `""` in `fixes` only if deleting the line is a valid fix.

- List all equivalent fixes (e.g. `model.eval()` and `model.train(False)`).

- Each buggy line appears once in `errors`. Do not include `blanks`.

- `description` describes what the **correct** code does, not the bugs.



## Hints

At least 2, ideally 3: (1) conceptual nudge, (2) narrower pointer (which API or

which line region), (3) nearly the answer. Never put the full answer in hint 1.



## Output format example (two lines of a .jsonl file; each object is ONE line)

{"id":"lin-reg-train-step-01","type":"fill_blank","category":"01_linear_regression.py","title":"The three-call training step","difficulty":"easy","description":"Runs one full-batch gradient descent epoch: forward pass, loss, gradient computation and a parameter update.","code":"for epoch in range(epochs):\n    pred = model(X)\n    loss = criterion(pred, y)\n    <<BLANK:zero>>\n    <<BLANK:back>>\n    <<BLANK:step>>","blanks":[{"id":"zero","answers":["optimizer.zero_grad()"]},{"id":"back","answers":["loss.backward()"]},{"id":"step","answers":["optimizer.step()"]}],"hints":["PyTorch accumulates gradients by default.","Order matters: clear, compute, apply."],"explanation":"Gradients accumulate, so clear first, then backward(), then step().","related_reference":["torch.optim.Optimizer.zero_grad","torch.Tensor.backward","torch.optim.Optimizer.step"]}

{"id":"lin-reg-order-bug-01","type":"find_fix","category":"01_linear_regression.py","title":"Training step in the wrong order","description":"One epoch of full-batch gradient descent for a regression model.","code":"for epoch in range(epochs):\n    pred = model(X)\n    loss = criterion(pred, y)\n    loss.backward()\n    optimizer.zero_grad()\n    optimizer.step()","errors":[{"line":4,"fixes":["optimizer.zero_grad()"],"explanation":"Gradients must be cleared before backward()."},{"line":5,"fixes":["loss.backward()"],"explanation":"zero_grad() here wipes the gradients just computed."}],"hints":["Nothing is syntactically wrong.","Two adjacent lines are swapped."]}



## Final checks before you answer

1. Every line is valid standalone JSON (escape `"` as `\"`, newlines as `\n`).

2. `id`s are unique; every `category` equals `{{SCRIPT_NAME}}`.

3. Every `<<BLANK:x>>` has a `blanks` entry and vice-versa.

4. Every `errors[].line` is within the number of lines of `code`, and each fix differs from the buggy line.

5. Output only the JSONL lines.

6. Run npm run validate to make sure they follow the schemas from schema/
