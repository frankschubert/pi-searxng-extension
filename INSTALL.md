# Installing pi-searxng-extension

## Quick Start

### 1. Install the extension

```bash
pi install git:github.com/frankschubert/pi-searxng-extension
```

### 2. Configure SearXNG URL

Set the `SEARXNG_URL` environment variable:

```bash
export SEARXNG_URL="http://localhost:8888"
```

Or add it to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
echo 'export SEARXNG_URL="http://localhost:8888"' >> ~/.bashrc
```

### 3. Verify configuration

Inside a Pi session, run:

```
/searxng
```

You should see:
```
SearXNG: http://localhost:8888  (env var SEARXNG_URL)
```

## Setup: Running SearXNG Locally

If you don't have a SearXNG instance running, you can start one with Docker:

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

## Using Remote SearXNG

If you have a remote SearXNG instance (e.g., `https://searxng.example.com`):

```bash
export SEARXNG_URL="https://searxng.example.com"
```

## Using with Authorization

If your SearXNG instance requires an Authorization header:

```bash
export SEARXNG_URL="https://searxng.example.com"
export SEARXNG_AUTHORIZATION="Bearer your-token-here"
```

## Troubleshooting

### "SearXNG URL not configured"

Make sure `SEARXNG_URL` is set:

```bash
echo $SEARXNG_URL
```

If empty, set it:

```bash
export SEARXNG_URL="http://localhost:8888"
```

### "SearXNG returned HTTP 404"

Verify SearXNG is running:

```bash
curl http://localhost:8888/search?q=test&format=json
```

If this fails, restart the container:

```bash
docker restart searxng
```

### Network issues

If using a remote SearXNG and Pi can't reach it, check:

1. Firewall rules
2. Network connectivity: `curl https://searxng.example.com/search?q=test&format=json`
3. TLS certificate validity (if using HTTPS)
