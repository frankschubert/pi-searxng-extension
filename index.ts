/**
 * SearXNG Extension for Pi Coding Agent
 *
 * Simplified standalone refactor of the original SearXNG extension from:
 * https://github.com/Otard95/pi-extensions/blob/main/extensions/searxng/
 *
 * Original author: @Otard95 (https://github.com/Otard95)
 * This refactor: Frank Schubert
 *
 * Modifications from the original:
 * - Removed npm peer dependencies
 * - Removed external utils imports (@sinclair/typebox, utils/array, utils/secret, utils/settings)
 * - Environment-variable only configuration
 * - Single-file implementation for easy deployment
 * - Simplified error handling (removed Result monad)
 *
 * Original functionality preserved:
 * - web_search tool for LLM
 * - /search and /searxng commands
 * - Same response formatting and UX
 */

import { Type } from "@earendil-works/pi-ai";
import { type ExtensionAPI, keyHint } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SearxResult {
  title: string;
  url: string;
  content?: string;
  engine?: string;
}

interface SearxResponse {
  query: string;
  results: SearxResult[];
  answers?: string[];
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const ENV_URL = "SEARXNG_URL";
const ENV_AUTH = "SEARXNG_AUTHORIZATION";
const ENV_ENGINES = "SEARXNG_ENGINES";
const ENV_CATEGORIES = "SEARXNG_CATEGORIES";
const ENV_LANGUAGE = "SEARXNG_LANGUAGE";
const ENV_SAFESEARCH = "SEARXNG_SAFESEARCH";
const MAX_SNIPPET_LEN = 180;

// ─── Extension ──────────────────────────────────────────────────────────────────

export default function searxngExtension(pi: ExtensionAPI) {
  // ── Helpers ──────────────────────────────────────────────────────────────

  function getBaseUrl(): string | undefined {
    if (process.env[ENV_URL]) return process.env[ENV_URL];
    return undefined;
  }

  async function getAuthorization(): Promise<string | undefined> {
    if (process.env[ENV_AUTH]) return process.env[ENV_AUTH];
    return undefined;
  }

  function configSource(): string {
    if (process.env[ENV_URL]) return `env var ${ENV_URL}`;
    return "not configured";
  }

  async function runSearch(
    query: string,
    maxResults: number,
    signal?: AbortSignal
  ): Promise<SearxResult[]> {
    const base = getBaseUrl();
    if (!base)
      throw new Error(
        `SearXNG URL not configured. Set ${ENV_URL} environment variable or configure in ~/.pi/agent/extensions/searxng/config.json`
      );

    const url = new URL("/search", base);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    if (process.env[ENV_ENGINES]) {
      // SearXNG merges categories' default engines in alongside an explicit
      // engines list, so sending both defeats the engine restriction - omit
      // categories entirely when engines is set.
      url.searchParams.set("engines", process.env[ENV_ENGINES]!);
    } else {
      url.searchParams.set(
        "categories",
        process.env[ENV_CATEGORIES] || "general"
      );
    }
    if (process.env[ENV_LANGUAGE]) {
      url.searchParams.set("language", process.env[ENV_LANGUAGE]!);
    }
    if (process.env[ENV_SAFESEARCH]) {
      url.searchParams.set("safesearch", process.env[ENV_SAFESEARCH]!);
    }

    const headers: Record<string, string> = {};
    const auth = await getAuthorization();
    if (auth) headers["Authorization"] = auth;

    const res = await fetch(url.toString(), { signal, headers });

    if (!res.ok) {
      throw new Error(`SearXNG returned HTTP ${res.status}: ${res.statusText}`);
    }

    const data = (await res.json()) as SearxResponse;
    return (data.results ?? []).slice(0, maxResults);
  }

  function stripTags(str: string): string {
    return str.replace(/<[^>]+>/g, "").trim();
  }

  function formatResults(results: SearxResult[], query: string): string {
    if (results.length === 0) {
      return `No results found for "${query}".`;
    }

    const lines: string[] = [`Search results for "${query}":`, ""];

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      lines.push(`${i + 1}. ${stripTags(r.title)}`);
      lines.push(`   ${r.url}`);
      if (r.content) {
        const snippet = r.content
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, MAX_SNIPPET_LEN);
        lines.push(
          `   ${snippet}${r.content.length > MAX_SNIPPET_LEN ? "…" : ""}`
        );
      }
      if (r.engine) {
        lines.push(`   (via ${r.engine})`);
      }
      lines.push("");
    }

    return lines.join("\n").trimEnd();
  }

  // ── web_search tool (for the LLM) ─────────────────────────────────────────

  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web using a self-hosted SearXNG instance. Returns titles, URLs, and text snippets. Use this for current events, documentation, or any information that may not be in your training data.",
    promptSnippet: "Search the web for up-to-date information via SearXNG",
    parameters: Type.Object({
      query: Type.String({ description: "The search query" }),
      max_results: Type.Optional(
        Type.Number({
          description: "Number of results to return (default: 5, max: 20)",
          minimum: 1,
          maximum: 20,
        })
      ),
    }),
    renderCall(args, theme) {
      const query = (args as any).query ?? "";
      const truncated =
        query.length > 60 ? `${query.slice(0, 57)}...` : query;
      let text = theme.fg("toolTitle", theme.bold("web_search "));
      text += theme.fg("accent", `"${truncated}"`);
      if ((args as any).max_results) {
        text += theme.fg("muted", ` (max: ${(args as any).max_results})`);
      }
      return new Text(text, 0, 0);
    },

    async execute(_toolCallId, params, signal, onUpdate, _ctx) {
      const max = (params as any).max_results ?? 5;
      onUpdate?.({
        content: [
          { type: "text", text: `Searching "${(params as any).query}"…` },
        ],
        details: {},
      });

      try {
        const results = await runSearch(
          (params as any).query,
          max,
          signal ?? undefined
        );
        const text = formatResults(results, (params as any).query);
        return {
          content: [{ type: "text", text }],
          details: {
            query: (params as any).query,
            resultCount: results.length,
            results,
          },
        };
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return {
            content: [{ type: "text", text: "Search cancelled." }],
            isError: false,
            details: {},
          };
        }
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Search failed: ${msg}` }],
          isError: true,
          details: {},
        };
      }
    },
    renderResult(result, options, theme, context) {
      const text =
        (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
      const output =
        result.content
          .filter((c) => c.type === "text")
          .map((c) => ("text" in c ? c.text : ""))
          .join("\n") || "";
      const lines = output.split("\n");
      const maxLines = options.expanded ? lines.length : 10;
      const displayLines = lines.slice(0, maxLines);
      const remaining = lines.length - maxLines;

      let rendered = displayLines
        .map((l) => theme.fg("toolOutput", l))
        .join("\n");

      if (remaining > 0) {
        rendered += `${theme.fg(
          "muted",
          `\n... (${remaining} more lines, `
        )}${keyHint("app.tools.expand", "expand to see all")})`;
      }

      text.setText(`\n${rendered}`);
      return text;
    },
  });

  // ── /search command (for the user) ────────────────────────────────────────

  pi.registerCommand("search", {
    description: "Search the web and pass results to the LLM. Usage: /search <query>",
    handler: async (args, ctx) => {
      const query = args?.trim();
      if (!query) {
        ctx.ui.notify("Usage: /search <query>", "warning");
        return;
      }

      ctx.ui.setStatus("searxng", `🔍 Searching "${query}"…`);

      try {
        const results = await runSearch(query, 5);
        ctx.ui.setStatus("searxng", "");
        pi.sendUserMessage(formatResults(results, query));
      } catch (err) {
        ctx.ui.setStatus("searxng", "");
        const msg = err instanceof Error ? err.message : String(err);
        ctx.ui.notify(`Search failed: ${msg}`, "error");
      }
    },
  });

  // ── /searxng command (configuration) ─────────────────────────────────────

  pi.registerCommand("searxng", {
    description: "Show current SearXNG configuration",
    handler: async (_args, ctx) => {
      const base = getBaseUrl();
      const hasAuth = !!process.env[ENV_AUTH];
      ctx.ui.notify(
        base
          ? `SearXNG: ${base}  (${configSource()})${hasAuth ? " [auth configured]" : ""}`
          : `SearXNG not configured. Set ${ENV_URL} environment variable.`,
        base ? "info" : "warning"
      );
      if (base) {
        const categories = process.env[ENV_CATEGORIES] || "general";
        const engines = process.env[ENV_ENGINES] || "(category default)";
        const language = process.env[ENV_LANGUAGE] || "(server default)";
        const safesearch = process.env[ENV_SAFESEARCH] || "(server default)";
        ctx.ui.notify(
          `categories=${categories}  engines=${engines}  language=${language}  safesearch=${safesearch}`,
          "info"
        );
      }
    },
  });
}
