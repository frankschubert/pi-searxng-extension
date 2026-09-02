# pi-searxng-extension

**Minimal SearXNG web search extension for Pi coding agent**

Gives your Pi coding agent the ability to search the web using a self-hosted [SearXNG](https://docs.searxng.org/) metasearch engine.

## Features

- ✅ **`web_search` tool** — LLM can call it automatically for web searches
- ✅ **`/search <query>` command** — Manual search from the user
- ✅ **`/searxng` command** — Show current configuration
- ✅ **No npm dependencies** — Clean, standalone extension
- ✅ **Environment-based config** — Simple `SEARXNG_URL` variable
- ✅ **Authorization support** — Optional Bearer token or Basic auth

## Quick Start

### 1. Install

```bash
pi install git:github.com/frankschubert/pi-searxng-extension
```

### 2. Configure

```bash
export SEARXNG_URL="http://localhost:8888"
```

### 3. Test

Inside Pi:
```
/searxng
```

You should see:
```
SearXNG: http://localhost:8888  (env var SEARXNG_URL)
```

### 4. Verify the model actually uses it

Copy a prompt template from [`prompts/`](prompts/) into `~/.pi/agent/prompts/` and run it, e.g. `/announce-websearch`. See [PROMPTS.md](PROMPTS.md) — it checks that `web_search` gets called for real (not just described), and includes test results per model. Tool-calling reliability varies a lot by model, so treat this as a smoke test whenever you switch models.

## Usage

### Let the Agent Search Automatically

```
User: What are the latest TypeScript features?

Agent: I'll search for that information.
[web_search "TypeScript 2025 features"]

Search results for "TypeScript 2025 features":
1. TypeScript 5.5 Announcement
   https://devblogs.microsoft.com/typescript/...
   TypeScript 5.5 introduces...
...
```

### Search Manually

```
/search What's new in React 19?
```

### Check Configuration

```
/searxng
```

## Setup: Running SearXNG

### Docker (Recommended)

```bash
docker run -d \
  --name searxng \
  -p 8888:8080 \
  searxng/searxng

export SEARXNG_URL="http://localhost:8888"
```

### Docker Compose

```bash
cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  searxng:
    image: searxng/searxng
    ports:
      - "8888:8080"
    restart: unless-stopped
EOF

docker-compose up -d
export SEARXNG_URL="http://localhost:8888"
```

### Nix (via nixpkgs)

```bash
nix run nixpkgs#searxng -- --listen 0.0.0.0:8888
export SEARXNG_URL="http://localhost:8888"
```

## Configuration

### Environment Variables

**`SEARXNG_URL`** (required)
- URL to your SearXNG instance
- Examples: `http://localhost:8888`, `https://searxng.example.com`

**`SEARXNG_AUTHORIZATION`** (optional)
- Authorization header if your instance is protected
- Examples: `Bearer sk-xxx`, `Basic dXNlcjpwYXNz`

### Make Configuration Persistent

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export SEARXNG_URL="http://localhost:8888"
```

Then reload:
```bash
source ~/.bashrc
```

See [CONFIGURATION.md](CONFIGURATION.md) for more options.

## Documentation

- **[INSTALL.md](INSTALL.md)** — Installation and setup instructions
- **[USAGE.md](USAGE.md)** — Using the tool and commands
- **[CONFIGURATION.md](CONFIGURATION.md)** — Environment variables and persistent setup
- **[PROMPTS.md](PROMPTS.md)** — Example prompt templates to test tool-call reliability, with per-model results

## How It Works

1. **Extension registers with Pi** — Provides `web_search` tool and `/search`, `/searxng` commands
2. **Reads `SEARXNG_URL` env var** — Connects to your SearXNG instance
3. **LLM calls `web_search`** — When the agent needs current information
4. **Results formatted** — Titles, URLs, and snippets returned to the agent
5. **Agent processes results** — Integrated into the conversation naturally

## Requirements

- Pi coding agent v0.80.8 or later
- A running SearXNG instance (local or remote)
- Network access to SearXNG

## Troubleshooting

### "SearXNG URL not configured"

Set the environment variable:
```bash
export SEARXNG_URL="http://localhost:8888"
pi
```

### "Connection refused"

1. Verify SearXNG is running:
   ```bash
   docker ps | grep searxng
   ```

2. Test the URL:
   ```bash
   curl http://localhost:8888
   ```

3. If needed, restart:
   ```bash
   docker restart searxng
   ```

### "HTTP 429 Too Many Requests"

You've hit rate limits. Set up your own SearXNG instance (see Setup section above).

## Privacy & Security

- **Self-hosted SearXNG** — Your queries stay on your server
- **No tracking** — SearXNG is privacy-respecting by design
- **Open source** — Fully transparent: https://github.com/searxng/searxng
- **Aggregated results** — Results come from 70+ search engines

## Credits & Attribution

**Based on** the excellent SearXNG extension from [`Otard95/pi-extensions`](https://github.com/Otard95/pi-extensions) by [@Otard95](https://github.com/Otard95).

This project is a simplified, standalone refactor that:
- Removes npm peer dependency issues
- Uses only built-in Pi APIs (no utils imports)
- Maintains the same core functionality and UX
- Focuses on minimal, easy-to-understand code

**Original source**: https://github.com/Otard95/pi-extensions/blob/main/extensions/searxng/

**What's different**:
- Single-file implementation (no utils needed)
- Environment-variable only configuration
- No npm install conflicts
- Cleaner for users who just want SearXNG support

Thanks to [@Otard95](https://github.com/Otard95) for the original design and implementation!

## License

MIT — See [LICENSE](LICENSE) for details

## Related Projects

- [SearXNG](https://docs.searxng.org/) — Privacy-respecting metasearch engine
- [Pi Coding Agent](https://github.com/badlogic/pi-mono) — Main Pi project
- [Otard95/pi-extensions](https://github.com/Otard95/pi-extensions) — Original inspiration
