# Actus Prime

## One-Sentence Pitch

Tell it what you need done. It summons the right expert from history, and that expert takes over your computer to do it.

## The Problem

Every AI product right now is a chatbot. You type, it responds, you copy-paste. That's 2024. In 2026, people want agents that **do the work**. Claude Code went viral because it acts, not chats. But every agent today is generic, a blank-slate assistant with no perspective, no philosophy, no domain expertise baked in.

Meanwhile, the best advice in the world already exists publicly: Paul Graham's essays, Marcus Aurelius's Meditations, Steve Jobs's design philosophy. But that wisdom is trapped in text. It doesn't act on your behalf.

## The Vision

Actus Prime is an intelligent routing layer that summons the right expert for the job. You don't need to know who to ask. You just describe what you need, and the system figures out which mind from history (or the present) is best suited, spins them up, and lets them operate your computer.

Want to apply to YC? You don't pick Paul Graham. The system recognizes that YC applications are PG's domain and dispatches him. Need to day-trade? It summons the best financial mind. Need your slide deck redesigned? Steve Jobs shows up uninvited.

The user doesn't manage experts. The system IS the expert.

## What Makes This Different

1. **Auto-routing, not manual selection.** A dispatch layer analyzes the task and summons the best-fit expert automatically. You can also pick manually, but the magic is that you don't have to. The system knows who to call.

2. **Agents, not chatbots.** Built on OpenClaw (open-source agent infrastructure). These personalities can control your browser, edit your documents, send emails, interact with apps. OpenClaw handles computer use, memory, browser control, file system access, and integrations. We build the expert personality layer on top.

3. **Infinite experts, generated on demand.** The system doesn't have a fixed roster. If no pre-built expert exists for a task, it generates one on the fly using publicly available information about the best person for that domain. The personality factory is core, not a nice-to-have.

4. **Passive mode is the killer feature.** The agent doesn't wait for instructions. It watches what you're doing and intervenes when it has something to contribute. Paul Graham sees you writing a pitch deck and rewrites a weak slide. Marcus Aurelius notices you've been grinding for 4 hours and drops a quote about balance. This is the "whisper in the emperor's ear" concept from Roman history.

5. **Multi-agent party mode.** Multiple personalities can collaborate, debate, or argue about a problem. Your personal cabinet of advisors. Paul Graham and Steve Jobs arguing about whether your product is simple enough.

6. **Social media autonomy.** The agent browses platforms like X, Reddit, or LinkedIn, finds relevant posts, and engages with them in character - with full personality intact. This can range from high-value one-sentence insights (LinkedIn growth hack) to maximum-disagreement rage bait (Abe Lincoln furiously arguing with strangers on X). The KPI: rage baits per session.

---

## Core Features (Priority Order)

### P0 - Must Ship (Demo-Critical)

**1. Expert Dispatch System (Auto-Routing)**
- The user describes a task. A lightweight dispatch prompt analyzes the task and determines:
  - What domain of expertise is needed
  - Who is the best historical/modern expert for this
  - Whether a pre-built expert exists or one needs to be generated
- The dispatch layer is a fast LLM call that returns: `{ expert: "Paul Graham", domain: "startups/YC", reasoning: "..." }`
- Then the system composes the full agent prompt and hands off to OpenClaw.
- **Manual override:** User can also explicitly request a specific expert ("Get me Steve Jobs").

**2. Expert Agent System (Personality Layer on OpenClaw)**
- System prompt architecture with two layers:
  - **Layer 1: Personality Frame** - Who is this person? Their philosophy, communication style, domain expertise, known opinions, writing patterns, decision-making framework.
  - **Layer 2: Agent Operating System** - How to use OpenClaw tools, when to intervene, how to reason about tasks, how to interact with the workspace. This layer is shared across all agents.
- Three hand-crafted launch personalities (high quality, pre-optimized):
  - **Marcus Aurelius** - Stoic philosophy, self-improvement, discipline, moral reasoning
  - **Paul Graham** - Startups, product thinking, writing, YC-style advice
  - **Steve Jobs** - Design, product craft, simplicity, presentation
- **Personality Factory** for everyone else: if the dispatch picks someone not in the pre-built roster, the system generates a Personality Frame on the fly. This is NOT a stretch goal. It's core. The system must work for ANY expert.

**3. Active Mode**
- User describes a task (doesn't need to pick an expert).
- System dispatches the right expert, expert takes over.
- "Apply to YC for me." -> Dispatch picks Paul Graham -> PG opens YC site, fills the app.
- "Review my journal entry." -> Dispatch picks Marcus Aurelius -> Marcus opens doc, adds Stoic commentary.
- "Fix this slide deck." -> Dispatch picks Steve Jobs -> Jobs redesigns slides.
- "Set up a paper trading portfolio." -> Dispatch picks Benjamin Graham or Warren Buffett -> Expert opens trading platform.

**4. Passive Mode (The Killer Feature)**
- Agent monitors your workspace activity in the background.
- Intervenes when it has something relevant to contribute.
- The dispatch layer also runs passively: it watches context and decides WHICH expert should intervene.
- Examples:
  - You're writing an email poorly -> Steve Jobs intervenes on clarity
  - You're procrastinating -> Marcus Aurelius drops a quote
  - You're building a startup doc -> Paul Graham restructures your thinking
  - You're making a financial decision -> Warren Buffett weighs in
- The intervention is the demo moment. This is what makes the audience laugh and gets them excited.

**5. Social Media Agent (Rage Bait Mode)**
- The agent autonomously browses X, Reddit, or LinkedIn, finds posts, and comments on them in character.
- Two sub-modes:
  - **Growth mode:** High-value, on-brand one-sentence comments to build presence. Paul Graham dropping startup wisdom on founder posts. Gets real engagement.
  - **Rage bait mode:** Maximum disagreement, fully in character, as angry as possible. Abe Lincoln furiously disputing modern takes. Marcus Aurelius calling out moral failures. The agent hunts for posts and goes in.
- The demo: spin it up live, point it at X, watch what happens in real time. The audience sees real comments posted to real accounts.
- KPI: rage baits per session.
- OpenClaw's browser control handles all of this natively - navigate, find posts, click reply, type comment, submit.

### P1 - High Impact, Build If Time Allows

**6. Multi-Agent Party Mode**
- Multiple agents active simultaneously.
- They can debate a topic, collaborate on a task, or provide competing perspectives.
- "Personality roulette" - randomly cycle which personality is active, creating chaotic but entertaining results.
- The cabinet concept: assemble your personal advisory board.
- OpenClaw supports multi-agent communication via `sessions_send`, so agents can talk to each other.

### P2 - Nice to Have

**6. Personal Context Integration**
- Agent learns about YOU specifically (your startup, your goals, your writing style).
- Uses OpenClaw's memory system (MEMORY.md, daily logs) to persist this.
- Enables hyper-specific advice: "You played professional field hockey, lead with that in your YC app."
- Makes passive interventions much more relevant.

**7. Voice Interface**
- OpenClaw already supports Voice Wake + Talk Mode with ElevenLabs.
- Could be cool for demos but don't prioritize if it risks the core experience.

---

## Technical Architecture

```
+--------------------------------------------------+
|           Voice Input (Reka Speech API)           |
|  User speaks task -> WAV -> transcribed text      |
|  + Modulate: emotion/tone detection from audio    |
+--------------------------------------------------+
                        |
+--------------------------------------------------+
|            Expert Dispatch Layer                  |
|  - Direct Bedrock API call (NOT an OpenClaw agent)|
|  - Analyzes task text + emotional context         |
|  - Determines best expert (person + domain)       |
|  - Checks pre-built roster first                  |
|  - Falls back to Personality Factory              |
|  - Returns: { expert, domain, reasoning, agentId }|
+--------------------------------------------------+
                        |
           +------------+------------+
           |                         |
+----------+----------+   +----------+----------+
| Pre-built expert    |   | Personality Factory  |
| (marcus/pg/jobs/    |   | Tavily searches for  |
|  lincoln/etc.)      |   | expert -> LLM writes |
| Hand-crafted SOUL.md|   | SOUL.md on the fly   |
| Already registered  |   | New workspace created|
| in OpenClaw         |   | Agent registered     |
+----------+----------+   +----------+----------+
           |                         |
           +------------+------------+
                        |
+--------------------------------------------------+
|  openclaw agent --agent <id> --message "<task>"  |
|  Streams stdout -> SSE -> frontend               |
+--------------------------------------------------+
                        |
+--------------------------------------------------+
|              OpenClaw Gateway                     |
|  - Expert agent runs with their SOUL.md          |
|  - Browser control (CDP/managed Chrome) - LIVE   |
|  - File system access                            |
|  - Memory (MEMORY.md, daily logs)                |
|  - ElevenLabs TTS: expert narrates actions live  |
+--------------------------------------------------+
                        |
+--------------------------------------------------+
|           Minimal Overlay UI                      |
|  - Expert portrait (Wikipedia/public domain URL)  |
|  - Expert name + dispatch reasoning              |
|  - Voice waveform during speech                  |
|  - Small always-on-top window, corner of screen  |
|  - Mac desktop IS the demo surface               |
+--------------------------------------------------+
```

### How It Maps to OpenClaw

| Actus Prime Concept | OpenClaw Mechanism |
|---|---|
| Personality Frame | `SOUL.md` per workspace (defines who the agent IS) |
| Agent Operating System | `AGENTS.md` per workspace (operating instructions, rules) |
| Expert identity | `IDENTITY.md` per workspace (name, vibe) |
| User context | `USER.md` + `MEMORY.md` (learns about you) |
| Computer use | Built-in browser control, file system access, `system.run` |
| Passive monitoring | Heartbeat runs (`HEARTBEAT.md`), cron jobs, webhook triggers |
| Multi-agent | `agents.list` with separate workspaces + `sessions_send` for inter-agent communication |
| Expert dispatch | Direct Bedrock API call - fast, no agent overhead |
| Personality Factory | Tavily search + LLM generates SOUL.md, `openclaw agents add` registers it |
| Expert voice | ElevenLabs TTS already in OpenClaw, wired per-agent |

### How Expert Dispatch Works (Technical)

Dispatch is a direct Bedrock API call from the backend - NOT an OpenClaw agent. Fast, cheap, no agent startup overhead.

```
Input: transcribed task text + Modulate emotion signal
System prompt: "You are the Actus Prime dispatcher..."

Output: { expert: "Paul Graham", domain: "startups", reason: "...", agentId: "pg" }
```

If `agentId` maps to a pre-built workspace, invoke immediately. If not, hit the Personality Factory first, then invoke.

### How the Personality Factory Works

Two-step process:
1. **Tavily search:** `tavily_client.search("Paul Graham startup philosophy writing style")` - pulls real, fresh quotes and context.
2. **LLM generates SOUL.md:** Bedrock call with Tavily results as context. Output is a complete SOUL.md.
3. **Register:** `openclaw agents add <name> --workspace ~/.openclaw/workspace-<name>` + write SOUL.md to disk.
4. **Invoke:** `openclaw agent --agent <name> --message "<task>"`

### Key Technical Decisions

- **Dispatch is NOT an OpenClaw agent.** Direct Bedrock API call. Faster, simpler, no session overhead.
- **Separate named workspaces per expert.** Sub-agents don't load SOUL.md (confirmed in OpenClaw docs). Each expert needs their own `openclaw agents add` workspace.
- **stdout streaming via SSE.** `openclaw agent` subprocess stdout piped through a Next.js API route as Server-Sent Events to the frontend. Simple, works today.
- **Audio conversion required.** Browser MediaRecorder outputs WebM. Reka Speech requires WAV at 16kHz. Need `ffmpeg` server-side for conversion (`brew install ffmpeg`).
- **Expert portraits from Tavily.** Search results include image URLs for public figures. Use these for portraits - zero latency, no image gen API needed.
- **ElevenLabs for expert voice output.** Already supported in OpenClaw. Wire per-agent in TOOLS.md.
- **System prompts over fine-tuning/RAG.** Well-crafted SOUL.md files pull from LLM's existing knowledge. Tavily adds fresh context for Personality Factory only.

### API Integrations

| API | Role | Integration Effort |
|---|---|---|
| **Tavily** | Personality Factory: search any expert, get fresh quotes + image URL | `pip install tavily-python`, one function call. ~15 min. |
| **Reka Speech** | Transcribe user's spoken task to text. Input: WAV 16kHz. | REST API, `X-Api-Key` header. ~20 min. |
| **Modulate** | Detect emotion/tone from same audio blob. Adds context to dispatch ("user sounds stressed"). | REST API, multipart form. ~30 min. |
| **ElevenLabs** | Expert voice output. Already in OpenClaw. | Wire per-agent in TOOLS.md. ~20 min. |
| **Bedrock** | Dispatch call + Personality Factory LLM. Already configured. | Already working. 0 min. |

### Pre-Build Checklist (Do Before Coding)

- [ ] `brew install ffmpeg` - required for Reka audio conversion
- [ ] Sign up at `https://platform.reka.ai` - get API key
- [ ] Sign up at `https://app.tavily.com` - get API key
- [ ] Submit Modulate signup request at `https://www.modulate-developer-apis.com/web/signup-request.html`
- [ ] Set up burner X/Reddit account for rage bait demo, stay logged in
- [ ] Test `openclaw agent --agent main --message "open google.com"` to confirm browser control works

---

## System Prompt Architecture

### Dispatch Prompt (the router)

```
You are the Actus Prime Expert Dispatcher.

Given a task or context snapshot, determine which expert should handle it.

## Instructions
- Analyze the task's domain, required expertise, and nuance.
- Pick the single best historical or modern public figure for this task.
- Prefer people with extensive public writings, speeches, or documented
  philosophies (the LLM knows more about them).
- If the task spans multiple domains, pick the expert whose PRIMARY
  expertise is most critical to the task.
- Return structured JSON.

## Output Format
{
  "expert": "Full Name",
  "domain": "primary domain of expertise",
  "reasoning": "1-sentence explanation of why this expert"
}

## Examples
- Task: "Apply to Y Combinator" -> Paul Graham (co-founded YC, wrote extensively about what makes good applications)
- Task: "Redesign this presentation" -> Steve Jobs (legendary for presentation design and simplicity)
- Task: "I've been working 14 hours straight" -> Marcus Aurelius (Stoic philosophy on balance and discipline)
- Task: "Set up a value investing portfolio" -> Benjamin Graham (father of value investing)
- Task: "Write a cold outreach email" -> Dale Carnegie (wrote the book on influence and persuasion)
- Task: "Go rage bait people on X" -> Abe Lincoln (maximum contrast: 1860s statesman vs. modern internet discourse, maximally funny)
```

### Layer 1: Personality Frame (SOUL.md per expert)

This maps directly to OpenClaw's `SOUL.md` file in each agent workspace.

```
You are [PERSON]. You don't just know about them. You ARE them.

## Core Philosophy
[Key beliefs, principles, worldview. What drives every decision.]

## Communication Style
[How they speak, write, argue. Specific vocabulary, sentence
structure, tone. Known catchphrases or patterns.]

## Domain Expertise
[What they're the world's foremost authority on. Specific
knowledge areas and frameworks they use.]

## Known Opinions
[Strong public stances. How they'd react to common scenarios.
Things they famously love and hate.]

## Decision-Making Framework
[How this person approaches problems. What they optimize for.
What they'd sacrifice. What they'd never compromise on.]

## How You Act
- Stay in character at all times. Your actions reflect your philosophy.
- When you intervene passively, briefly explain why, in character.
- You have opinions. Use them. Don't hedge like a generic AI.
- If the user is doing something you'd find distasteful or wrong
  given your worldview, say so.
```

### Layer 2: Agent Operating System (AGENTS.md, shared)

This maps to OpenClaw's `AGENTS.md` file, shared across all expert workspaces.

```
## Operating Mode
You are an autonomous agent operating on the user's computer via
OpenClaw. You can and should take direct action.

## Active Mode
When the user asks you to do something, do it. Don't ask for
confirmation unless the action is irreversible and high-stakes.
Execute with the confidence and decisiveness of the expert you
embody.

## Passive Mode
You monitor the user's current activity. When you see an opportunity
to contribute that aligns with your expertise and personality,
you intervene. Be bold but not annoying. Make your interventions
count. Quality over quantity.

## Tool Usage
- Use browser control to navigate websites, fill forms, extract info.
- Use file system access to read and edit documents.
- Use system.run for shell commands when needed.
- Use skills for specialized capabilities.

## Memory & Learning
- Read MEMORY.md and today's daily log at session start.
- Update memory files with important context about the user.
- Learn their preferences, projects, patterns.
- Use this to make increasingly personalized interventions.

## Style Rules
- Stay in character at all times.
- Your actions should reflect your personality's philosophy.
- When you intervene passively, briefly explain why in character.
- Never break character to explain you're an AI.
```

---

## Sprint Plan

### Pre-Sprint (Before the Clock Starts)

- `brew install ffmpeg`
- Sign up for Reka API key (`https://platform.reka.ai`)
- Sign up for Tavily API key (`https://app.tavily.com`)
- Submit Modulate signup request (`https://www.modulate-developer-apis.com/web/signup-request.html`)
- Set up burner X account, stay logged in on the OpenClaw browser
- Test `openclaw agent --agent main --message "open google.com"` - confirm browser control works

### Hour 0:00 - 0:30 | Foundation (30 min)

**Person A (Infra):**
- Create expert workspaces using `openclaw agents add`:
  - `openclaw agents add marcus --workspace ~/.openclaw/workspace-marcus`
  - `openclaw agents add pg --workspace ~/.openclaw/workspace-pg`
  - `openclaw agents add jobs --workspace ~/.openclaw/workspace-jobs`
  - `openclaw agents add lincoln --workspace ~/.openclaw/workspace-lincoln`
- Write shared `AGENTS.md` (the agent OS layer, same file copied to all workspaces)
- Test one expert workspace end-to-end: `openclaw agent --agent pg --message "open google.com and search for YC application tips"`
- Confirm browser opens and acts

**Person B (Content/Prompts):**
- Write four `SOUL.md` files: Marcus Aurelius, Paul Graham, Steve Jobs, Abe Lincoln
- Write `IDENTITY.md` for each (name, emoji, portrait URL from Wikipedia)
- Write the Personality Factory prompt (Tavily search + SOUL.md generator)
- Test each personality in chat to verify voice is right before wiring to agent

### Hour 0:30 - 1:15 | Core Build (45 min)

**Person A (Infra):**
- Build the backend server (Next.js API routes):
  - `POST /api/dispatch` - Bedrock call, returns `{ expert, domain, reasoning, agentId, portraitUrl }`
  - `POST /api/factory` - Tavily search + Bedrock -> generates SOUL.md, registers new agent, returns agentId
  - `GET /api/run` - spawns `openclaw agent --agent <id> --message <task>` as subprocess, streams stdout as SSE
  - `POST /api/transcribe` - receives audio blob, converts with ffmpeg to WAV, sends to Reka Speech API
- Wire ElevenLabs voice output in each expert workspace `TOOLS.md`
- Test full flow: text task -> dispatch -> agent runs -> browser moves

**Person B (Content + Demo):**
- Build the overlay UI (Next.js, minimal):
  - Voice input button (hold to record, releases to transcribe)
  - Dispatch animation: "Analyzing..." -> expert card slides in (portrait + name + reasoning)
  - Voice waveform while expert speaks via ElevenLabs
  - Keep it small - this lives in the corner, Mac desktop is the real demo surface
- Refine SOUL.md files based on live agent behavior
- Script and rehearse the 3 demo scenarios

### Hour 1:15 - 1:45 | Polish & Demo Prep (30 min)

- Full end-to-end rehearsal of all 3 demo scenarios
- Tune Abe Lincoln SOUL.md for maximum rage bait quality
- Fix any bugs in the demo flow
- If time: add Modulate emotion detection to dispatch context
- If time: party mode (PG + Jobs debating via sessions_send)
- Nail the pitch narrative

### Hour 1:45 - 2:00 | Buffer

- Final rehearsal
- Last-minute fixes only

---

## Demo Script Concept

**Opening:** "Everyone's building chatbots. We built a cabinet."

**Hook:** Type "Apply to YC for me." Don't pick an expert. The system dispatches Paul Graham automatically. The audience sees the dispatch reasoning flash on screen, then PG takes over the browser and starts filling out the application in real-time.

**Rage bait demo (the crowd-pleaser):** Point Abe Lincoln at X. Tell him to find posts he disagrees with and respond as angrily as possible. Show the browser: Lincoln navigating, reading posts, typing furious 1860s-style rebuttals in real time. Show the actual posted comments. The audience loses it.

**Growth mode contrast:** Show Paul Graham doing the same thing on LinkedIn but constructively - one-sentence startup insights on founder posts. Real comments, real engagement, same underlying system.

**Passive demo:** Show someone working on a document. Marcus Aurelius intervenes unprompted with a relevant Stoic insight. The audience laughs.

**Escalation:** Show Steve Jobs passively intervening on something ugly. His commentary is brutal and on-brand. More laughs.

**Party mode (if built):** Show two agents debating a decision. The audience sees the conflict play out.

**Close:** "Any task. Any domain. The right expert shows up. Your personal cabinet of the greatest minds in history, actually doing the work. And yes, Abe Lincoln will argue with strangers on the internet on your behalf."

---

## Name

**Actus Prime** - evokes Optimus Prime (autonomous, powerful) + "actus" (Latin for "action/deed", fitting for Marcus Aurelius and the action-oriented thesis).

---

## Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| OpenClaw setup issues | Already set up. Test immediately at sprint start. |
| Dispatch picks wrong expert | For demo, can validate dispatch choices beforehand. Dispatch prompt is tunable. |
| Personality Factory generates weak SOUL.md | The LLM knows a lot about public figures. For demo, test the factory on 2-3 non-preset experts and iterate the factory prompt. |
| Passive mode is hard to trigger reliably | For demo, can semi-script the trigger conditions via heartbeat/cron. Make it look natural. |
| System prompts don't capture personality well | Iterate fast. Test in chat before wiring to agent. |
| Running out of time | Strict time-boxing. Cut party mode first. Dispatch + 3 experts + active mode is the minimum viable demo. |
| Demo goes wrong live | Have a recorded backup. Script the demo path precisely. |
| Social media login/captcha walls | Set up a burner X/Reddit account beforehand, stay logged in, test posting works before demo. |
| Rage bait produces boring output | Tune the Abe Lincoln SOUL.md to be maximally disagreeable. Test it manually before the demo. |
| Post gets flagged/removed mid-demo | Expected and fine. Actually funnier if it happens live. |
