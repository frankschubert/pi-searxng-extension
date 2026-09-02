# Configuration Guide

## Environment Variables

### Required

**`SEARXNG_URL`** — URL to your SearXNG instance

```bash
export SEARXNG_URL="http://localhost:8888"
```

Examples:
- Local Docker: `http://localhost:8888`
- Remote instance: `https://searxng.example.com`
- Subdomain: `https://search.company.internal`

### Optional

**`SEARXNG_AUTHORIZATION`** — Authorization header for protected instances

```bash
export SEARXNG_AUTHORIZATION="Bearer sk-your-token-here"
```

Formats:
- Bearer token: `Bearer sk-xxx`
- Basic auth: `Basic base64(user:password)`
- Custom: Any header value your instance requires

## Persistent Configuration

### Option 1: Shell Profile (Recommended for most users)

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, `~/.fish/config.fish`, etc.):

```bash
# ~/.bashrc
export SEARXNG_URL="http://localhost:8888"
export SEARXNG_AUTHORIZATION="Bearer sk-xxx"  # if needed
```

Then reload:
```bash
source ~/.bashrc
```

### Option 2: Pi's `~/.pi/agent/extensions/searxng/.env` (Not currently used, but supported)

For future reference, this extension can read from a `.env` file. Create:

```bash
mkdir -p ~/.pi/agent/extensions/searxng
cat > ~/.pi/agent/extensions/searxng/.env << 'EOF'
SEARXNG_URL=http://localhost:8888
SEARXNG_AUTHORIZATION=Bearer sk-xxx
EOF
chmod 600 ~/.pi/agent/extensions/searxng/.env
```

### Option 3: Systemd User Environment (Linux)

Create `~/.config/environment.d/searxng.conf`:

```bash
mkdir -p ~/.config/environment.d
cat > ~/.config/environment.d/searxng.conf << 'EOF'
SEARXNG_URL=http://localhost:8888
SEARXNG_AUTHORIZATION=Bearer sk-xxx
EOF
```

This applies to all systemd user services.

### Option 4: Per-Session Override

For one-off testing, set variables before launching Pi:

```bash
SEARXNG_URL="http://test-instance:8888" pi
```

## Docker Setup

### Basic Local Instance

```bash
docker run -d \
  --name searxng \
  -p 8888:8080 \
  searxng/searxng
```

Then set:
```bash
export SEARXNG_URL="http://localhost:8888"
```

### With Persistent Settings

```bash
mkdir -p ~/.searxng

docker run -d \
  --name searxng \
  -p 8888:8080 \
  -v ~/.searxng:/etc/searxng \
  searxng/searxng
```

### With Rate Limiting (Optional)

Create `~/.searxng/settings.yml`:

```yaml
server:
  port: 8080
  bind_address: "0.0.0.0"

rateLimiter:
  enabled: true
  maxRequests: 100
  window: 3600  # per hour
```

Then mount:
```bash
docker run -d \
  --name searxng \
  -p 8888:8080 \
  -v ~/.searxng/settings.yml:/etc/searxng/settings.yml \
  searxng/searxng
```

## Docker Compose

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  searxng:
    image: searxng/searxng
    ports:
      - "8888:8080"
    environment:
      - SEARXNG_PORT=8080
      - SEARXNG_BIND_ADDRESS=0.0.0.0
    volumes:
      - searxng-cache:/var/cache/searxng
      - searxng-data:/etc/searxng
    restart: unless-stopped

volumes:
  searxng-cache:
  searxng-data:
```

Start:
```bash
docker-compose up -d
export SEARXNG_URL="http://localhost:8888"
```

## Verifying Configuration

### Test from command line

```bash
curl "${SEARXNG_URL}/search?q=test&format=json" | jq '.results[0]'
```

Expected output:
```json
{
  "title": "...",
  "url": "...",
  "content": "...",
  "engine": "..."
}
```

### Test within Pi

```
/searxng
```

Should show:
```
SearXNG: http://localhost:8888  (env var SEARXNG_URL)
```

Then try:
```
/search test query
```

## Security Considerations

1. **Local instances** — No authentication needed; firewall to localhost if on shared systems
2. **Remote instances** — Use HTTPS and authentication headers
3. **Authorization tokens** — Store in environment or systemd secrets, not in Git
4. **Firewall** — Restrict access to your SearXNG instance if it's on the internet

## Troubleshooting

### "SEARXNG_URL not set"

Verify the variable is exported:
```bash
echo $SEARXNG_URL
```

If empty, set it:
```bash
export SEARXNG_URL="http://localhost:8888"
```

### "Connection refused" or "Network unreachable"

1. Check if SearXNG is running:
   ```bash
   docker ps | grep searxng
   ```

2. Verify the URL:
   ```bash
   curl http://localhost:8888
   ```

3. If remote, check network connectivity:
   ```bash
   curl https://searxng.example.com
   ```

### "HTTP 401 Unauthorized"

Authorization header is required. Set:
```bash
export SEARXNG_AUTHORIZATION="Bearer your-token"
```

### "HTTP 429 Too Many Requests"

You're hitting rate limits. Either:
- Wait before searching again
- Set up your own SearXNG instance
- Contact the instance owner for higher limits
