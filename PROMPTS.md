# Prompt templates

The `prompts/` directory contains [Pi prompt templates](https://github.com/badlogic/pi-mono) that exercise the `web_search` tool. Copy the ones you want into `~/.pi/agent/prompts/` (or point `--prompt-template` at this directory) and invoke them as slash commands, e.g. `/announce-websearch`.

| File | Command | Purpose |
| --- | --- | --- |
| `announce-websearch.md` | `/announce-websearch` | Run once at the start of a session: checks that `web_search` is available, fires one real test query, and reports back to the user. Use this to confirm the extension is wired up before relying on it. |
| `test-search-explicit.md` | `/test-search-explicit` | Explicitly instructs the model to use `web_search`. Baseline case — if this fails, nothing else will work. |
| `test-search-implicit.md` | `/test-search-implicit` | Asks for current information without naming the tool. Tests whether the model recognizes *when* to search on its own. |
| `test-search-negative.md` | `/test-search-negative` | A pure arithmetic question. Tests that the model does **not** reach for `web_search` when it isn't needed. |
| `test-search-multistep.md` | `/test-search-multistep` | Search + synthesize: fetch a result and summarize it in one sentence, rather than dumping raw search output. |
| `test-search-quoting.md` | `/test-search-quoting` | Asks about a person by full name plus an unrelated qualifier (birth year). Tests whether the model quotes the multi-word name — see "Query quoting" below. |

## Query quoting

SearXNG matches unquoted words independently. A query like `Jane Doe age` can surface pages that only contain "Jane" or "age" in isolation, unrelated to the actual person. Wrapping the multi-word name/title in double quotes (`"Jane Doe" age`) forces an exact-phrase match on the name while leaving the rest as normal keywords — verified against a live instance: unquoted `Elon Musk age` pulled in unrelated pages (a Groundhog Day page, an unrelated homepage) purely from loose single-word matches, while `"Elon Musk" age` ranked Musk-specific results higher and dropped that noise.

The extension's `web_search` tool description (in `index.ts`) now instructs the model to quote multi-word proper nouns/titles but *not* the whole query — an earlier, more forceful wording caused the model to wrap the entire sentence in quotes (`"latest stable release of Node.js"`), which risks matching nothing since it demands that exact literal phrase appear on a page. The current wording gives a right/wrong example pair to prevent that overcorrection. If you tighten this further, re-run `/test-search-quoting` and a query with no proper noun (e.g. `test-search-explicit`) to check both under- and over-quoting.

## Tested models

Results below are from actually running each prompt (via `pi -p --mode json`, inspecting the tool-call trace, not just the final text) against a specific model+quant. **Only the model listed has been tested — assume nothing about other models.** The typical failure mode on smaller/weaker models is unreliable tool use: either never calling `web_search` at all, or hallucinating a plausible-looking answer without actually calling it.

### `hf.co/bartowski/Qwen_Qwen3-14B-GGUF:Q6_K_L` (Ollama, thinking mode) — tested 2026-09-02

| Prompt | Result |
| --- | --- |
| `announce-websearch` | **Pass.** Actually called `web_search("current date", max_results=1)`, got a real result, and reported back accurately — did not hallucinate the confirmation. |
| `test-search-explicit` | **Tool-call reliable**, retried with refined queries when the first search's results were irrelevant. Final answer was honest about not finding the Node.js version rather than making one up — but see caveat below. |
| `test-search-implicit` | **Tool-call reliable** without the tool being named in the prompt — correctly identified this needed a search. Same result-quality caveat as above. |
| `test-search-negative` | **Pass.** No tool call for `17 * 24` — answered directly (`408`, correct). |
| `test-search-multistep` | **Tool-call reliable**, retried multiple query phrasings. Reported failure honestly instead of fabricating a weather forecast. |
| `test-search-quoting` | **Pass**, after strengthening the tool description to an explicit "you MUST" rule with a right/wrong example — the original softer wording ("wrap phrases that must stay together in quotes") was ignored entirely (`Marie Curie born 1867`, unquoted). Correctly produced `"Marie Curie" born 1867`, and correctly left single-token queries like `Node.js latest stable release` unquoted rather than over-quoting. |

**Caveat — not a tool-use failure:** for `test-search-implicit` and `test-search-multistep`, SearXNG's default `general` category returned irrelevant snippets (e.g. searching "Hacker News top story" surfaced a fintech company called "Current," not `news.ycombinator.com`; Berlin weather searches returned nothing usable). The model's tool-calling behavior was correct in all five cases — it decided correctly whether to search, called the tool with sensible/refined queries, and never fabricated an answer when results were bad. The gap is in SearXNG engine/category selection for time-sensitive queries, which is a SearXNG config issue, not a `pi` or model issue.

### Other models / quants / modes

Untested. If you run these prompts against a different model, please open a PR adding a results row under a new `### <model>` heading, following the format above — actually inspect the tool-call trace (not just the final text), since some models describe using a tool without calling it.
