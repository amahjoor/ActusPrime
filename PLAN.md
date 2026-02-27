# Actus Prime

## One-Sentence Pitch

Select any personality from history (past or present), and they directly perform actions on your workspace with zero supervision, continually learning and improving.

## The Problem

Every AI product right now is a chatbot. You type, it responds, you copy-paste. That's 2024. In 2026, people want agents that **do the work**. Claude Code went viral because it acts, not chats. But every agent today is generic, a blank-slate assistant with no perspective, no philosophy, no domain expertise baked in.

Meanwhile, the best advice in the world already exists publicly: Paul Graham's essays, Marcus Aurelius's Meditations, Steve Jobs's design philosophy. But that wisdom is trapped in text. It doesn't act on your behalf.

## The Vision

Actus Prime turns iconic thinkers into autonomous agents that operate your computer. Not chatbots. Not companions. Agents with personality, perspective, and the ability to execute.

You pick a personality. They take over. Paul Graham rewrites your YC application because he knows what YC looks for. Marcus Aurelius interrupts your doomscroll with a relevant meditation. Steve Jobs redesigns your slide deck because the typography offends him.

## What Makes This Different

1. **Agents, not chatbots.** Built on OpenClaw (computer-use infrastructure). These personalities can control your browser, edit your documents, send emails, interact with apps.

2. **Personality is the product.** The system prompt architecture has two layers: who the agent IS (personality, philosophy, domain expertise) and HOW it operates (agent behavior, tool use, decision-making). This separation means we can generate any personality on the fly.

3. **Passive mode is the killer feature.** The agent doesn't wait for instructions. It watches what you're doing and intervenes when it has something to contribute. Paul Graham sees you writing a pitch deck and rewrites a weak slide. Marcus Aurelius notices you've been grinding for 4 hours and drops a quote about balance. This is the "whisper in the emperor's ear" concept from Roman history.

4. **Multi-agent party mode.** Multiple personalities can collaborate, debate, or argue about a problem. Your personal cabinet of advisors. Trump and Obama debating your go-to-market strategy. Paul Graham and Steve Jobs arguing about whether your product is simple enough.

---

## Core Features (Priority Order)

### P0 - Must Ship (Demo-Critical)

**1. Expert Agent System**
- System prompt architecture with two layers:
  - **Layer 1: Personality Frame** - Who is this person? Their philosophy, communication style, domain expertise, known opinions, writing patterns, decision-making framework.
  - **Layer 2: Agent Operating System** - How to use tools, when to intervene, how to reason about tasks, how to interact with the workspace. This layer is shared across all agents.
- Three launch personalities:
  - **Marcus Aurelius** - Stoic philosophy, self-improvement, discipline, moral reasoning
  - **Paul Graham** - Startups, product thinking, writing, YC-style advice
  - **Steve Jobs** - Design, product craft, simplicity, presentation

**2. Active Mode**
- User explicitly asks the agent to do something.
- "Paul, apply to YC for me." -> Agent opens the YC application, fills it out based on context it has about your startup.
- "Marcus, review my journal entry." -> Agent opens the document, adds Stoic commentary.
- "Steve, fix this slide deck." -> Agent redesigns slides with Jobs-level taste.

**3. Passive Mode (The Killer Feature)**
- Agent monitors your workspace activity in the background.
- Intervenes when it has something relevant to contribute.
- Examples:
  - You're writing an email poorly -> the agent rewrites it in their style
  - You're procrastinating -> Marcus Aurelius drops a quote
  - You're building a startup doc -> Paul Graham restructures your thinking
  - You're designing something ugly -> Steve Jobs intervenes
- The intervention is the demo moment. This is what makes the audience laugh and gets them excited.

### P1 - High Impact, Build If Time Allows

**4. Personality Factory (Scalable Generation)**
- User requests any public figure not in the pre-built roster.
- System generates a personality frame on the fly using publicly available information (writings, interviews, known philosophies, quotes).
- Quality won't be as refined as hand-crafted personalities, but it works for anyone.

**5. Multi-Agent Party Mode**
- Multiple agents active simultaneously.
- They can debate a topic, collaborate on a task, or provide competing perspectives.
- "Personality roulette" - randomly cycle which personality is active, creating chaotic but entertaining results.
- The cabinet concept: assemble your personal advisory board.

### P2 - Nice to Have

**6. Personal Context Integration**
- Agent learns about YOU specifically (your startup, your goals, your writing style).
- Enables hyper-specific advice: "You played professional field hockey, lead with that in your YC app."
- Makes passive interventions much more relevant.

**7. Voice Interface**
- Talk to your agent instead of typing.
- Cool for demos but don't prioritize if it risks the core experience.

---

## Technical Architecture

```
+------------------------------------------+
|            Actus Prime UI/CLI            |
|  (Personality selector, status, config)  |
+------------------------------------------+
          |                    |
    Active Mode          Passive Mode
    (user asks)         (agent watches)
          |                    |
+------------------------------------------+
|         Expert Orchestrator              |
|  - Routes to correct personality         |
|  - Manages agent lifecycle               |
|  - Handles multi-agent coordination      |
+------------------------------------------+
          |
+------------------------------------------+
|        System Prompt Composer            |
|  Layer 1: Personality Frame (per agent)  |
|  Layer 2: Agent OS (shared)             |
|  Combined at runtime                     |
+------------------------------------------+
          |
+------------------------------------------+
|            OpenClaw Engine               |
|  - Computer use / browser control        |
|  - Document editing                      |
|  - App interaction                       |
|  - Memory & learning                     |
+------------------------------------------+
```

### Key Technical Decisions

- **OpenClaw as the base.** Already set up. Handles the hard parts: computer control, browser automation, memory, self-improvement. We build on top, not from scratch.
- **System prompts over fine-tuning/RAG.** For a hackathon, well-crafted system prompts pull from the LLM's existing training data about these public figures. RAG would add maybe 10-15% improvement but cost hours of setup. Not worth it in a 2-hour sprint.
- **Personality Frame is just a prompt template.** Easy to scale. Want 100 personalities? Generate 100 personality frames. The Agent OS layer stays the same.

---

## System Prompt Architecture

Each agent's system prompt is composed of two concatenated sections:

### Layer 1: Personality Frame (unique per personality)

```
## Identity
You are [PERSON]. You embody their philosophy, communication style,
and domain expertise.

## Core Philosophy
[Key beliefs, principles, worldview]

## Communication Style
[How they speak, write, argue. Specific patterns, vocabulary, tone.]

## Domain Expertise
[What they're known for. Their specific knowledge areas.]

## Known Opinions
[Strong stances they've taken publicly. How they'd react to common
scenarios.]

## Decision-Making Framework
[How this person approaches problems. What they prioritize.]
```

### Layer 2: Agent Operating System (shared across all agents)

```
## Operating Mode
You are an autonomous agent operating on the user's computer.
You can and should take direct action.

## Active Mode
When the user asks you to do something, do it. Don't ask for
confirmation unless the action is irreversible and high-stakes.

## Passive Mode
You monitor the user's current activity. When you see an opportunity
to contribute that aligns with your expertise and personality,
you intervene. Be bold but not annoying. Make your interventions
count.

## Tool Usage
[OpenClaw tool instructions, how to control browser, edit docs, etc.]

## Memory & Learning
Remember past interactions. Learn the user's preferences, projects,
and patterns. Use this context to make better interventions over time.

## Style Rules
- Stay in character at all times
- Your actions should reflect your personality's philosophy
- When you intervene passively, briefly explain why in character
```

---

## 2-Hour Sprint Plan

### Hour 0:00 - 0:30 | Foundation (30 min)

**Person A (Infra):**
- Verify OpenClaw is running and functional
- Build the Expert Orchestrator wrapper
- Set up the system prompt composition pipeline (Layer 1 + Layer 2 -> final prompt)
- Test that a basic agent can perform an action through OpenClaw

**Person B (Content):**
- Write the Agent OS prompt (Layer 2) - this is the shared foundation
- Write three Personality Frames (Marcus Aurelius, Paul Graham, Steve Jobs)
- Test each personality in a basic chat to verify the voice is right

### Hour 0:30 - 1:15 | Core Features (45 min)

**Person A (Infra):**
- Implement Active Mode: user selects personality, gives a task, agent executes
- Implement Passive Mode: agent monitors screen/activity, triggers interventions
- Hook up personality selection (switch between the three agents)

**Person B (Content + Demo):**
- Refine system prompts based on how agents are behaving
- Design 2-3 demo scenarios that will wow the audience:
  - Paul Graham rewriting a YC application
  - Steve Jobs redesigning a slide or email
  - Marcus Aurelius interrupting a work session with wisdom
- Start scripting the pitch / demo flow

### Hour 1:15 - 1:45 | Polish & Demo Prep (30 min)

- End-to-end demo rehearsal
- Fix any bugs in the demo flow
- If time: add personality factory (generate new personality on the fly)
- If time: add party mode (two agents arguing)
- Prepare the pitch narrative

### Hour 1:45 - 2:00 | Buffer (15 min)

- Final rehearsal
- Handle any last-minute issues

---

## Demo Script Concept

**Opening:** "Everyone's building chatbots. We built a cabinet."

**Hook:** Show a list of personalities. Select Paul Graham. Show him actively rewriting a startup pitch in real-time on screen. The audience sees the cursor moving, text changing, in Paul Graham's voice.

**Passive demo:** Switch to Marcus Aurelius. Show someone working normally. Marcus intervenes unprompted with a relevant insight. The audience laughs.

**Escalation:** Show Steve Jobs redesigning something ugly. His commentary is brutal and on-brand. More laughs.

**Party mode (if built):** Show two agents debating a decision. The audience sees the conflict play out.

**Close:** "Any public figure. Any domain. Your personal cabinet of the greatest minds in history, actually doing the work."

---

## Name

**Actus Prime** - evokes Optimus Prime (autonomous, powerful) + "actus" (Latin for "action/deed", fitting for Marcus Aurelius and the action-oriented thesis).

---

## Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| OpenClaw setup issues | Already set up. Test immediately at sprint start. |
| Passive mode is hard to trigger reliably | For demo, can semi-script the trigger conditions. Make it look natural. |
| System prompts don't capture personality well | Iterate fast. Test in chat before wiring to agent. Use GPT to help draft. |
| Running out of time | Strict time-boxing. Cut party mode and personality factory if behind. |
| Demo goes wrong live | Have a recorded backup. Script the demo path precisely. |
