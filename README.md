# AI Workflow Evaluator

A lightweight **CLI tool** that analyzes AI-assisted coding session transcripts and evaluates engineering workflow quality. Built for Slait's take-home assignment.

## What It Does

Takes transcripts from AI coding tools (Claude Code, Cursor, ChatGPT, etc.) and answers:
**"How effectively is this engineer using AI during software development?"**

It evaluates 6 dimensions of workflow quality, detects session phases, produces confidence-scored metrics, and generates an HTML visual report.

## Installation

```bash
git clone https://github.com/shashank-100/slait.git
cd slait
npm install
```

## Usage

```bash
# Single transcript
node src/cli.js transcripts/real-session-1-ocr-debugging.txt

# Multiple transcripts — cross-session comparison
node src/cli.js transcripts/*.txt

# Detailed metric breakdown
node src/cli.js transcripts/*.txt --detailed

# HTML visual report
node src/cli.js transcripts/*.txt --html
# opens report.html

# JSON output
node src/cli.js transcripts/*.txt --json

# Save to file
node src/cli.js transcripts/*.txt --output results.txt

# Force transcript format
node src/cli.js transcript.txt --format claude
```

## Evaluation Metrics

Each metric is scored 0–100 with a **confidence level** (high/medium/low) based on sample size.

| Metric | What it measures |
|---|---|
| **Clarity** | How specific and contextualized user requests are — file paths, error messages, the "why" |
| **Iteration** | Building incrementally vs backtracking; refinement patterns |
| **Tool Usage** | Diversity of AI capabilities used — read, write, edit, search, execute, test |
| **Problem Solving** | Investigation before acting; systematic vs jump-to-implementation |
| **Code Quality** | Awareness of testing, error handling, edge cases, security |
| **Efficiency** | Session focus, message length, conversation balance |

Overall score is a weighted average (clarity 25%, problem solving 20%, others 15/10%).

## Phase Detection

The tool detects which phases appear in the session and in what order:

- `planning` — architecture, approach, strategy discussions
- `implementation` — building, writing, creating
- `debugging` — errors, bugs, fixing, investigating failures
- `review` — testing, verifying, confirming completion

Example: `debugging → implementation → review → debugging`

## Transcript Formats Supported

Auto-detected. Supported formats:

**Claude Code:**
```
user: The OCR is giving wrong results on stamp2 — can you check ocr_engine.py?
assistant: I'll investigate. Let me read the file first.
```

**Cursor:**
```
You: Add a login form
Cursor: I'll create a login form component...
```

**ChatGPT:**
```
You said: Fix the navigation bug
ChatGPT said: I can help fix that...
```

**JSON:**
```json
{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

## Example Output

```
=== AI Workflow Evaluation ===

Overall Score:  64/100 (D)  ● high confidence

Metrics:
  Clarity             27/100  █████░░░░░░░░░░░░░░░  ●
  Iteration          100/100  ████████████████████  ●
  Tool Usage          90/100  ██████████████████░░  ●
  Problem Solving     50/100  ██████████░░░░░░░░░░  ●
  Code Quality        65/100  █████████████░░░░░░░  ●
  Efficiency          90/100  ██████████████████░░  ●

Session Phases:
  🐛 debugging › ⚙️ implementation › ✅ review › 🐛 debugging

Strengths:
  ✓ Good tool utilization
  ✓ Efficient, focused workflow

Improvements:
  → Provide more context in requests
```

## Included Transcripts

Three real Claude Code sessions from my own projects (anonymized):

| File | Project | What happened |
|---|---|---|
| `real-session-1-ocr-debugging.txt` | prostruct | Debugging OCR accuracy on a stamp extractor |
| `real-session-2-supabase-migration.txt` | connection-assistant | Migrating backend from SQLite to Supabase |
| `real-session-3-refactor.txt` | lawn | Refactoring an app into an AI-agent-native platform |

## Project Structure

```
slait/
├── src/
│   ├── cli.js          # CLI entry point
│   ├── parser.js       # Multi-format transcript parsing
│   ├── evaluator.js    # Metric scoring, phase detection, reflection
│   ├── formatter.js    # Console + HTML output
│   └── index.js        # Programmatic API
├── transcripts/        # Real Claude Code sessions
├── APPROACH.md         # Design philosophy and tradeoffs
└── README.md
```

## Approach

The core insight: **workflow quality is observable in conversation patterns** — you don't need to see the code.

- Vague prompts → multiple clarifying rounds → slower progress
- Investigation before acting → fewer wrong turns
- Thoughtful iteration → efficient progress
- Testing awareness → more reliable outcomes

See [APPROACH.md](APPROACH.md) for full design rationale.

## Tech Stack

- Node.js + ES Modules
- Commander.js (CLI)
- Chalk (terminal colors)
- No heavy dependencies

## License

MIT
