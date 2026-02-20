# Prompt Caching: How AI Agents Slash Costs and Latency

> Research brief on Anthropic's prompt caching technology and its relevance to AI-assisted development workflows like the ones powering this project.

---

## What Is Prompt Caching?

Prompt caching is a Claude API optimization that lets repeated prompt prefixes be stored and reused across requests. Instead of reprocessing the same system instructions, tool definitions, and conversation history on every API call, the model stores a **KV cache representation** (key-value attention states) and a cryptographic hash of the cached content. Subsequent requests with identical prefixes skip recomputation entirely.

**Impact**: Up to **90% cost reduction** and **85% latency reduction** on long prompts.

---

## Why It Matters for Agentic Coding

This project is built and maintained by autonomous AI agents (Claude Code / Passion Agent). Every agent interaction is an API call that includes:

- **System prompts** (~4,000+ tokens of CLAUDE.md rules, security protocols, creative context)
- **Tool definitions** (file operations, git, search, browser automation, MCP servers)
- **Conversation history** (growing with each turn in a multi-step task)

Without caching, each turn reprocesses the entire context from scratch. With prompt caching:

| Scenario | Without Cache | With Cache | Savings |
|----------|--------------|------------|---------|
| 100K token context, new question | Process 100K tokens | Read from cache + process new tokens | ~90% cost, ~79% TTFT |
| 10K token context, follow-up | Process 10K tokens | Cache read + delta | ~86% cost, ~31% TTFT |
| Multi-tool agent loop (10 turns) | 10x full reprocessing | 1 write + 9 reads | ~80% cost |

**TTFT** = Time to First Token (perceived latency).

---

## How It Works (Technical)

### Cache Hierarchy

Prompts are cached in order: `tools` -> `system` -> `messages`. Changes at any level invalidate that level and everything after it.

```
Request flow:
┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌───────────┐
│  Tools   │──▶│  System  │──▶│  Messages     │──▶│ New Input │
│ (cached) │   │ (cached) │   │ (incremental) │   │ (uncached)│
└──────────┘   └──────────┘   └──────────────┘   └───────────┘
    read            read         read + write          input
```

### Two Caching Modes

1. **Automatic** — Add `cache_control: {type: "ephemeral"}` at the request level. The system places the breakpoint at the last cacheable block and moves it forward as conversations grow.

2. **Explicit** — Place `cache_control` on up to 4 individual content blocks for fine-grained control over what gets cached independently.

### Pricing (per million tokens, Claude Sonnet tier)

| Token Type | Price | vs Base |
|-----------|-------|---------|
| Base input | $3.00 | — |
| 5-min cache write | $3.75 | 1.25x |
| 1-hour cache write | $6.00 | 2x |
| Cache read (hit) | $0.30 | **0.1x** |
| Output | $15.00 | — |

Cache reads are **10x cheaper** than uncached input. For agentic workflows where the same context is reused across 5-20 tool calls, the savings compound rapidly.

### Cache Lifetime

- **Default**: 5 minutes (refreshed on each use at no extra cost)
- **Extended**: 1 hour (2x write cost, same read cost)
- **Isolation**: Per-workspace (as of February 2026)

---

## Relevance to This Project

### Build Pipeline
The `fetch-youtube-data.js` script already eliminates runtime YouTube API costs by enriching video data at build time. Prompt caching applies the same philosophy to **AI development costs** — front-load the context once, reuse it cheaply across every subsequent agent interaction.

### Agent Operations
When Passion Agent works on this repo, a typical session involves:
1. Loading CLAUDE.md rules (~4K tokens)
2. Reading project structure and recent commits
3. Multiple tool calls (file reads, edits, git operations)
4. Each turn re-sends the full conversation

Prompt caching means steps 1-2 are paid at full price once, then read at 10% cost for every subsequent turn. A 15-turn agent session with 50K tokens of context saves approximately **$2.00 per session** at the Sonnet tier.

### Security Considerations
- Cached content is stored as KV representations and cryptographic hashes — **not raw text**
- Caches are workspace-isolated (no cross-organization leakage)
- Cache hits require **100% identical** prompt prefixes (no partial matches)
- Compatible with zero-data-retention (ZDR) commitments

---

## Key Takeaways

1. **Prompt caching is automatic in Claude Code** — system prompts, tool definitions, and conversation history are cached transparently
2. **90% cost reduction** on repeated contexts makes long agent sessions economically viable
3. **85% latency reduction** means faster tool call loops and quicker iteration cycles
4. **No code changes needed** in this project — the optimization happens at the API layer between Claude Code and the Anthropic API
5. **Build-time data enrichment + prompt caching** = zero runtime API costs on both the YouTube and AI sides of the stack

---

## Sources

- [Prompt Caching — Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Prompt Caching Announcement — Anthropic](https://claude.com/blog/prompt-caching)
- [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

---

*Researched 2026-02-20 for the TdotsSolutionsz Music Video Portfolio project.*
