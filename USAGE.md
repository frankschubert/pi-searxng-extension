# Using the SearXNG Extension

## The `web_search` Tool

The LLM can call this tool automatically during conversations:

```
User: What's new in TypeScript this month?

Agent: I'll search for recent TypeScript news.
[web_search "TypeScript 2026 release notes"]
```

### Tool Parameters

| Parameter | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| `query` | string | Yes | — | Search query |
| `max_results` | number | No | 5 | 1–20 results to return |

### Example

```
I need to find the latest documentation for Rust memory safety.
```

The agent calls:
```
web_search {
  "query": "Rust memory safety documentation 2025",
  "max_results": 10
}
```

## User Commands

### `/search <query>`

Manually search and send results to the agent:

```
/search What is the current status of Python 3.13?
```

Results are formatted and sent to the LLM as a message:

```
Search results for "What is the current status of Python 3.13?":

1. Python 3.13 Release Notes
   https://docs.python.org/3.13/whatsnew/3.13.html
   Python 3.13 was released on October 7, 2024. This release includes...

2. Python 3.13 Documentation
   https://docs.python.org/3.13/
   The official Python documentation for version 3.13...
```

### `/searxng`

Show the current SearXNG configuration:

```
/searxng
```

Output:
```
SearXNG: http://localhost:8888  (env var SEARXNG_URL)
```

Or if not configured:
```
SearXNG not configured. Set SEARXNG_URL environment variable.
```

## Result Format

Each search result includes:

- **Title** — Page title
- **URL** — Direct link to the page
- **Snippet** — First 180 characters of content (if available)
- **Engine** — Which search engine provided the result (e.g., "Google", "Bing", "DuckDuckGo")

### Example Result

```
1. Comprehensive Guide to TypeScript Generics
   https://www.example.com/typescript-generics
   TypeScript generics allow you to write flexible and reusable code...
   (via Google)
```

## Tips

1. **Be specific with queries** — Narrow, focused searches return better results. Instead of "Python", try "Python 3.13 asyncio documentation".

2. **Use `/search` for real-time info** — The agent can call `web_search` automatically, but you can also manually search and present results.

3. **Limit results** — For broad topics, limit to 5–10 results. For narrow queries, you can request up to 20.

4. **Check multiple engines** — SearXNG aggregates results from 70+ search engines. If a result looks suspicious, the engine name helps you evaluate credibility.

5. **Combine with LLM context** — The agent reads snippets and can fetch full pages if needed. Provide context about what you're looking for.

## Limitations

- **Snippets are truncated** — Full content requires fetching the page (future feature)
- **JavaScript-heavy sites** — SearXNG may not render JavaScript; static content works best
- **Rate limiting** — Aggressive automated searching may trigger rate limits on some engines
- **No personalization** — Results are not personalized to your location or preferences

## Advanced: Combining with Other Extensions

If you have other Pi extensions for web reading (e.g., `web-read`), you can chain them:

```
User: Find and summarize the latest Node.js security advisory.

Agent:
1. [web_search "Node.js security advisory 2025"]
2. [web_read "https://nodejs.org/en/blog/vulnerability/..."]
3. Summarizes the advisory for you
```
