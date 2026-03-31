# Quick Start Guide

Get started with the AI Workflow Evaluator in 60 seconds.

## Installation

```bash
npm install
```

## Basic Usage

### Analyze a Single Transcript

```bash
node src/cli.js transcripts/session1-good-workflow.txt
```

**Output:**
- Overall score and grade
- 6 metric scores with visual bars
- Key strengths
- Areas for improvement
- Actionable insights

### Analyze Multiple Transcripts

```bash
node src/cli.js transcripts/*.txt
```

**Output:**
- Aggregate statistics
- Individual scores
- Common patterns across sessions
- Most frequent strengths and improvements

### Get Detailed Metrics

```bash
node src/cli.js transcripts/session1-good-workflow.txt --detailed
```

**Additional output:**
- Detailed metric breakdowns
- Pattern classifications
- Specific counts and percentages
- Tool usage distribution

### Export as JSON

```bash
node src/cli.js transcripts/session1-good-workflow.txt --json > results.json
```

**Use cases:**
- Programmatic analysis
- Integration with other tools
- Data visualization
- Long-term tracking

## Using Your Own Transcripts

1. Save your AI coding session transcript as a text file
2. Place it in any directory
3. Run the evaluator:

```bash
node src/cli.js path/to/your/transcript.txt
```

**Supported formats:**
- Claude Code transcripts
- Cursor conversations
- ChatGPT sessions
- Generic text (auto-detected)
- JSON structured data

## Understanding the Scores

### Overall Score (0-100)
Weighted average across all metrics:
- 90-100 (A): Excellent workflow
- 80-89 (B): Strong workflow
- 70-79 (C): Good workflow
- 60-69 (D): Needs improvement
- 0-59 (F): Significant room for improvement

### Individual Metrics

**Clarity** - How specific and well-contextualized are requests?
- High score: Technical details, context, examples
- Low score: Vague, no context, unclear goals

**Iteration Quality** - How effectively does development progress?
- High score: Incremental building, thoughtful refinement
- Low score: Excessive backtracking, unclear planning

**Tool Usage** - How well are AI capabilities utilized?
- High score: Diverse tools, read before edit, testing
- Low score: Limited capabilities, no exploration

**Problem Solving** - How thorough is the approach?
- High score: Investigation, systematic planning
- Low score: Jumping to solutions, assumptions

**Code Quality** - Awareness of quality dimensions?
- High score: Testing, errors, edge cases, security
- Low score: No quality considerations mentioned

**Efficiency** - How focused and productive is the session?
- High score: Appropriate scope, balanced conversation
- Low score: Excessive length, unfocused

## Tips for Better Scores

**Improve Clarity:**
- Include file paths and function names
- Explain why you need something
- Give concrete examples

**Improve Iteration:**
- Plan before implementing
- Build incrementally
- Reduce backtracking by clarifying upfront

**Improve Tool Usage:**
- Explore AI capabilities (search, read, test)
- Read code before editing
- Include testing in your workflow

**Improve Problem Solving:**
- Investigate before acting
- Ask questions to understand
- Plan your approach

**Improve Code Quality:**
- Mention testing
- Consider error handling
- Think about edge cases

**Improve Efficiency:**
- Have clear goals
- Break work into focused sessions
- Avoid overly long conversations

## Next Steps

- Read [README.md](README.md) for comprehensive documentation
- Check [APPROACH.md](APPROACH.md) for design rationale
- See [SUBMISSION.md](SUBMISSION.md) for project overview

## Questions?

Check the README or examine the sample transcripts to see what good workflows look like.
