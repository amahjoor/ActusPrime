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

### P1 - High Impact, Build If Time Allows

**5. Multi-Agent Party Mode**
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
|              User Input / Passive Monitor         |
|  "Apply to YC" / detects user writing a pitch    |
+--------------------------------------------------+
                        |
+--------------------------------------------------+
|            Expert Dispatch Layer                  |
|  - Analyzes task/context                         |
|  - Determines best expert (person + domain)      |
|  - Checks pre-built roster first                 |
|  - Falls back to Personality Factory             |
+--------------------------------------------------+
                        |
+--------------------------------------------------+
|        System Prompt Composer                     |
|  Layer 1: Personality Frame (per expert)          |
|    - Pre-built (hand-crafted SOUL.md files)       |
|    - OR generated on-the-fly by factory           |
|  Layer 2: Agent OS (shared AGENTS.md)             |
|  Combined into workspace config at runtime        |
+--------------------------------------------------+
                        |
+--------------------------------------------------+
|              OpenClaw Gateway                     |
|  - Runs the agent with composed personality       |
|  - Browser control (CDP/managed Chrome)           |
|  - File system access                             |
|  - Memory & learning (MEMORY.md, daily logs)      |
|  - Skills (community + custom)                    |
|  - Messaging integrations                         |
|  - Multi-agent via sessions_send                  |
+--------------------------------------------------+
```

### How It Maps to OpenClaw

OpenClaw's architecture is a perfect fit. Here's what we use:

| Actus Prime Concept | OpenClaw Mechanism |
|---|---|
| Personality Frame | `SOUL.md` per workspace (defines who the agent IS) |
| Agent Operating System | `AGENTS.md` per workspace (operating instructions, rules) |
| Expert identity | `IDENTITY.md` per workspace (name, vibe) |
| User context | `USER.md` + `MEMORY.md` (learns about you) |
| Computer use | Built-in browser control, file system access, `system.run` |
| Passive monitoring | Heartbeat runs (`HEARTBEAT.md`), cron jobs, webhook triggers |
| Multi-agent | `agents.list` with separate workspaces + `sessions_send` for inter-agent communication |
| Expert dispatch | A "router" agent that receives the task, picks the expert, then forwards to the right agent workspace |
| Personality Factory | A skill or dispatch function that generates SOUL.md content on the fly |
| Skills/tools | Custom skills in `<workspace>/skills/` folders |

### How Expert Dispatch Works (Technical)

The dispatch is a lightweight LLM call. It doesn't need OpenClaw's full agent machinery:

```
Input: user task description OR passive context snapshot
System prompt: "You are the Actus Prime dispatcher. Given a task,
  determine which historical or modern expert is best suited.
  Consider domain expertise, known philosophies, and public
  writings. Return the expert's name, their domain, and a
  1-sentence reasoning."

Output: { expert: "Paul Graham", domain: "startups", reason: "..." }
```

If the expert is in the pre-built roster (Marcus Aurelius, Paul Graham, Steve Jobs), we use the hand-crafted workspace. If not, we hit the Personality Factory.

### How the Personality Factory Works

Another LLM call that generates a SOUL.md for any public figure:

```
Input: expert name + domain from dispatch
System prompt: "Generate a SOUL.md personality frame for [expert].
  Include: their core philosophy, communication style, domain
  expertise, known opinions, and decision-making framework.
  Use only publicly known information."

Output: Complete SOUL.md content
```

This gets written to a new workspace directory, and an OpenClaw agent is spun up with it. The quality won't match hand-crafted personalities, but it works for anyone. The LLM already knows about most public figures from training data.

### Key Technical Decisions

- **OpenClaw as the base.** Already set up. Handles the hard parts: computer control, browser automation, memory, self-improvement. We build on top, not from scratch.
- **System prompts over fine-tuning/RAG.** For a hackathon, well-crafted system prompts pull from the LLM's existing training data about these public figures. RAG would add maybe 10-15% improvement but cost hours of setup. Not worth it in a 2-hour sprint.
- **Workspace-per-expert pattern.** Each expert gets their own OpenClaw workspace directory with their SOUL.md, AGENTS.md, IDENTITY.md. OpenClaw's multi-agent config routes to the right workspace.
- **Dispatch is separate from execution.** The router is fast and cheap (small prompt, small output). The expert agent is the expensive one that actually does work. This keeps latency low for the "who should handle this?" decision.

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

## 2-Hour Sprint Plan

### Hour 0:00 - 0:30 | Foundation (30 min)

**Person A (Infra/OpenClaw):**
- Verify OpenClaw gateway is running and functional
- Set up multi-agent workspace structure:
  - `~/.openclaw/workspace-dispatch/` (the router agent)
  - `~/.openclaw/workspace-marcus/` (Marcus Aurelius)
  - `~/.openclaw/workspace-pg/` (Paul Graham)
  - `~/.openclaw/workspace-jobs/` (Steve Jobs)
- Configure `openclaw.json` with `agents.list` pointing to each workspace
- Write the shared AGENTS.md (Layer 2: Agent OS)
- Test that a basic agent can perform a browser action through OpenClaw

**Person B (Content/Prompts):**
- Write the Dispatch Prompt (the router logic)
- Write three SOUL.md files (Marcus Aurelius, Paul Graham, Steve Jobs)
- Write the Personality Factory prompt (generates SOUL.md for any person)
- Test each personality in basic chat to verify the voice is right

### Hour 0:30 - 1:15 | Core Features (45 min)

**Person A (Infra):**
- Implement the dispatch flow: user input -> dispatch call -> route to correct agent workspace
- Implement Personality Factory: dispatch returns unknown expert -> generate SOUL.md -> create workspace -> run agent
- Implement Passive Mode: heartbeat/cron-based monitoring that triggers dispatch on context changes
- Test end-to-end: "Apply to YC" -> dispatch picks PG -> PG agent opens browser and starts filling out YC

**Person B (Content + Demo):**
- Refine SOUL.md files based on how agents are behaving
- Design 2-3 demo scenarios that will wow the audience:
  - "Apply to YC" -> system auto-dispatches Paul Graham, he takes over the browser
  - "Review my schedule" -> system dispatches Marcus Aurelius for a Stoic take on time management
  - User is working on a document -> Steve Jobs passively intervenes to fix the design
  - **Scalability demo:** ask for a domain with no pre-built expert, watch the system generate one live
- Start scripting the pitch / demo flow

### Hour 1:15 - 1:45 | Polish & Demo Prep (30 min)

- End-to-end demo rehearsal
- Fix any bugs in the demo flow
- If time: add party mode (two agents debating via sessions_send)
- If time: add voice via OpenClaw's ElevenLabs integration
- Prepare the pitch narrative

### Hour 1:45 - 2:00 | Buffer (15 min)

- Final rehearsal
- Handle any last-minute issues

---

## Demo Script Concept

**Opening:** "Everyone's building chatbots. We built a cabinet."

**Hook:** Type "Apply to YC for me." Don't pick an expert. The system dispatches Paul Graham automatically. The audience sees the dispatch reasoning flash on screen, then PG takes over the browser and starts filling out the application in real-time.

**Auto-routing demo:** Type "Set up a paper trading portfolio." The system summons Benjamin Graham (or Warren Buffett). No one pre-configured this expert. The Personality Factory generated them on the spot. This proves scalability.

**Passive demo:** Show someone working on a document. Marcus Aurelius intervenes unprompted with a relevant Stoic insight. The audience laughs.

**Escalation:** Show Steve Jobs passively intervening on something ugly. His commentary is brutal and on-brand. More laughs.

**Party mode (if built):** Show two agents debating a decision. The audience sees the conflict play out.

**Close:** "Any task. Any domain. The right expert shows up. Your personal cabinet of the greatest minds in history, actually doing the work."

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
| Multi-workspace OpenClaw config is tricky | Fall back to single workspace with dynamic SOUL.md swapping if multi-agent routing is too complex. |
