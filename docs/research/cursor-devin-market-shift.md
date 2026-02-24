# The Great Reshuffling — Cursor, Devin & the Claude Code Effect

> Intel brief on the AI coding tools power shift. Who's thriving, who's scrambling, and what it means for builders shipping autonomous creative pipelines. Relevance score: 75.

---

## The Landscape as of Feb 24, 2026

| Player | Status | Valuation | ARR | Signal |
|--------|--------|-----------|-----|--------|
| **Claude Code** | 🟢 Surging | Part of Anthropic ($61.5B) | $2.5B (Feb 2026) | $0→$1B in 6 months. Now 4% of all GitHub public commits |
| **Cursor** | 🟢 Fortified | $29.3B | $1B+ | 360K+ paying users, acquired Graphite, raised $2.3B Series D |
| **OpenAI Codex** | 🟡 Catching up | Part of OpenAI | Undisclosed | macOS app launched Feb 2, new App Server architecture unifying all surfaces |
| **Devin / Cognition** | 🟠 Volatile | ~$10.2B | $73M (Jun 2025) + Windsurf's $82M | Acquired Windsurf, then laid off 30, offering buyouts to 200 remaining |
| **GitHub Copilot** | 🟢 Incumbent | Part of Microsoft | $2B+ (est.) | Still #1 by seat count, but losing mindshare to agentic tools |

---

## 1. Claude Code — The ChatGPT Moment for Coding

Claude Code didn't just enter the market — it redefined the category. Launched May 2025, it hit **$1B annualized revenue in 6 months** (faster than ChatGPT's 11 months). By February 2026, that number doubled to **$2.5B**.

### Why it's winning
- **Agent-first philosophy** — Not an IDE plugin. A terminal-native autonomous agent that plans, executes, and iterates across entire codebases
- **Enterprise trust** — 42% of large-company coding AI usage runs on Claude (vs 21% OpenAI). 500+ companies spending $1M+/year
- **Model quality moat** — Claude 4 Opus leads on complex multi-file reasoning. The coding agent is only as good as the model underneath, and Anthropic's model quality is pulling ahead
- **Ecosystem play** — Anthropic acquired Bun (the JS runtime) to tighten the developer toolchain

### The number that matters
> **4% of all GitHub public commits are now authored by Claude Code.** Projections: 20%+ by year-end 2026.

That's not a tool. That's a workforce shift.

---

## 2. Cursor — The $29B Survivor

Cursor isn't dying. It's adapting. After raising **$2.3B at a $29.3B valuation** (Series D, November 2025), Anysphere has more runway than most nations. 360K+ paying users, $1B+ ARR, and a clear strategy: **own the IDE layer**.

### Strategic moves
- **Graphite acquisition** — Bought the code review platform to own the full commit-to-merge loop
- **Agent mode pivot** — Shifted from autocomplete to agentic coding. Cursor now supports "ambitious changes across entire codebases" in agent mode
- **Model-agnostic** — Cursor runs Claude, GPT-4, Gemini — whoever's best. This hedges against model lock-in

### The vulnerability
Cursor's bet is that developers want AI **inside their editor**. Claude Code's bet is that developers want AI **to be the editor**. If models get smart enough to handle full autonomous sessions (Claude 5 territory), Cursor's IDE wrapper becomes a convenience layer, not a necessity.

The counter-argument: most developers don't want a terminal agent. They want smart autocomplete and inline chat while they're still driving. Cursor serves that population, and it's massive.

---

## 3. Devin / Cognition — The Rollercoaster

Cognition is the most volatile player in the space. The company that introduced "the first AI software engineer" in March 2024 has had a chaotic 12 months.

### The timeline of chaos
1. **March 2024** — Devin launches to massive hype
2. **Independent testing** — Answer.AI found a **15% success rate** on real tasks (3/20 succeeded)
3. **Revenue growth** — $1M → $73M ARR in 9 months (Sep 2024 → Jun 2025). Money was flowing despite the technical gaps
4. **Valuation rocket** — $4B → $10.2B by September 2025
5. **Windsurf drama** — OpenAI's $3B acquisition of Windsurf collapsed. Google hired away the CEO in a $2.4B deal. Cognition scooped up the remains
6. **The Windsurf acquisition** — Cognition now owns 350+ enterprise customers, 100K+ daily users, and $82M ARR from Windsurf. Enterprise ARR up 30% in 7 weeks post-acquisition
7. **February 2026 layoffs** — 30 employees cut, buyouts offered to 200 remaining

### Cognition's own self-assessment
From their 2025 performance review: Devin is **"senior-level at codebase understanding but junior at execution"** and **"has infinite capacity but struggles at soft skills."** That's an honest read — and it explains the gap between impressive demos and disappointing real-world results.

### The Windsurf gambit
The Windsurf acquisition is Cognition's lifeline. Devin alone was a cloud-based agent with a trust problem. Windsurf gives them an **IDE** — a local, familiar interface where developers can use Devin's autonomy selectively. The play: embed Devin inside Windsurf so it's autonomous-when-you-want-it, assisted-when-you-don't.

Whether 230 employees (post-layoffs) can integrate two products while competing against $29B Cursor and $2.5B-ARR Claude Code — that's the question.

---

## 4. OpenAI Codex — The Late Entry

OpenAI launched the Codex macOS app on February 2, 2026. It's a multi-agent coding environment — manage parallel agents, get code reviews from a separate agent before commits, and run long-duration tasks.

### What's interesting
- **App Server architecture** — A bidirectional protocol powering CLI, VS Code, macOS app, JetBrains, and Xcode through one API. This is the most platform-diverse approach
- **Multi-agent collaboration** — Experimental but shipping: one agent writes, another reviews, a third plans
- **Rust CLI** — Open source, fast, model-agnostic

### What's missing
OpenAI doesn't publish coding-specific revenue. Codex doesn't yet match Claude Code's market velocity or Cursor's user base. The o3/o4-mini models are solid but haven't captured the developer mindshare that Claude 3.5/4 Sonnet did.

---

## 5. What This Means for This Project

This portfolio runs on an **autonomous AI pipeline** — Passion Agent orchestrates Claude Code sessions to ship features, write docs, run security audits, and maintain 28 repos. The competitive dynamics above directly affect our stack.

| Shift | Impact | Action |
|-------|--------|--------|
| Claude Code at $2.5B ARR | Anthropic is investing massively in the coding agent. Expect faster iteration, better tool use, longer sessions | Stay on Claude Code. The model quality moat is real |
| Cursor's agent mode | If Cursor ships competitive agentic features, it could become a hybrid option for manual + agent work | Monitor but don't switch — terminal-first agents suit autonomous pipelines better |
| Devin's Windsurf integration | If Cognition stabilizes, Devin-in-Windsurf could be a credible agent-in-IDE option | Wait 6 months. The layoffs + integration risk make this a watch-not-adopt signal |
| Codex multi-agent | OpenAI's write-review-plan agent trio is the right architecture direction | Interesting for validation layers, but Claude's model quality still leads |
| 4% GitHub commits by Claude Code | This project is part of that 4%. As it grows to 20%, tooling and conventions around AI-authored code will formalize | Already ahead of the curve with video playback guardrail tests and protected config rules |

---

## The Bottom Line

The AI coding market isn't consolidating — it's **stratifying**:

- **Model layer**: Anthropic leads (Claude), OpenAI follows, Google flanks
- **IDE layer**: Cursor dominates ($29B), Windsurf/Cognition scrambles to integrate
- **Agent layer**: Claude Code leads ($2.5B ARR), Codex enters, Devin rebuilds trust
- **Autocomplete layer**: GitHub Copilot still has the most seats but is losing developer enthusiasm

For autonomous creative pipelines like this one, the agent layer is what matters. And right now, Claude Code is running away with it.

---

*Sources: Bloomberg, TechCrunch, VentureBeat, Cognition blog, OpenAI blog, Anthropic blog, SaaStr, CNBC, Business of Apps, Crunchbase. Feb 24, 2026.*
