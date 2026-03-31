# AI Workflow Evaluator

A lightweight **CLI tool** for analyzing AI-assisted coding session transcripts and evaluating workflow quality. Built for Slait's take-home assignment.

**Format:** CLI (with optional HTML report output)

## Overview

This tool takes transcripts from AI coding assistants (Claude Code, Cursor, ChatGPT, etc.) and evaluates the quality of the engineering workflow, providing structured insights about:

- Communication clarity
- Iteration patterns
- Tool utilization
- Problem-solving approach
- Code quality awareness
- Overall efficiency

## Key Features

- **Multi-format Support**: Parses transcripts from Claude Code, Cursor, ChatGPT, and generic text formats
- **Meaningful Metrics**: Evaluates 6 key workflow dimensions with detailed scoring
- **Actionable Insights**: Provides specific strengths and improvement recommendations
- **Flexible Output**: Console display with color coding, detailed breakdowns, or JSON export
- **Batch Analysis**: Process multiple transcripts and see aggregate patterns

## Installation

```bash
npm install
```

## Usage

### Basic Usage

Evaluate a single transcript:

```bash
node src/cli.js transcripts/session1.txt
```

### Detailed Analysis

Show detailed metrics breakdown:

```bash
node src/cli.js transcripts/session1.txt --detailed
```

### Multiple Transcripts

Analyze multiple sessions with aggregate statistics:

```bash
node src/cli.js transcripts/*.txt
```

### JSON Output

Export results as JSON for programmatic use:

```bash
node src/cli.js transcripts/session1.txt --json > results.json
```

### Save to File

Write results to a file:

```bash
node src/cli.js transcripts/*.txt --detailed --output report.txt
```

## Evaluation Metrics

### 1. Clarity (0-100)
Measures how clear and specific user requests are.

**Evaluated factors:**
- Context provided (why something is needed)
- Technical specificity (file paths, function names, etc.)
- Concrete examples included
- Message structure and length

**Good practices:**
- Include context: "to fix the authentication bug"
- Be specific: "in src/auth/login.js"
- Give examples: "like when a user submits an empty form"

### 2. Iteration Quality (0-100)
Analyzes the pattern of refinement and development.

**Evaluated factors:**
- Incremental refinements
- Backtracking and course corrections
- Building on previous work

**Patterns identified:**
- **Iterative**: Steady refinement and building
- **Exploratory**: More investigation and testing
- **Direct**: Straightforward implementation

### 3. Tool Usage (0-100)
Assesses utilization of AI assistant capabilities.

**Tool categories tracked:**
- Reading files
- Writing/creating files
- Editing existing code
- Searching codebase
- Executing commands
- Running tests

**Best practices:**
- Read before editing
- Include testing
- Use diverse capabilities

### 4. Problem Solving (0-100)
Evaluates the approach to solving problems.

**Evaluated factors:**
- Investigation steps
- Systematic planning
- Avoiding premature conclusions

**Approaches:**
- **Thorough**: Extensive investigation
- **Structured**: Clear step-by-step planning
- **Direct**: Quick to implementation

### 5. Code Quality (0-100)
Measures awareness of code quality dimensions.

**Signals tracked:**
- Error handling
- Testing
- Documentation
- Edge cases
- Security considerations
- Refactoring

### 6. Efficiency (0-100)
Analyzes overall workflow efficiency.

**Metrics:**
- Total message count
- Message length appropriateness
- Conversation balance
- Session focus

## Transcript Format Support

### Automatic Detection
The tool automatically detects transcript format. Supported formats:

**Claude Code / Claude:**
```
user: Can you help me add authentication?

assistant: I'll help you add authentication. Let me first check your current setup.
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
{
  "messages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

### Force Format
Override automatic detection:

```bash
node src/cli.js transcript.txt --format claude
node src/cli.js transcript.json --format json
```

## Example Output

```
=== AI Workflow Evaluation ===

Overall Score: 71/100 (C)

Transcript Info:
  Format: claude-text
  Total Messages: 25
  User Messages: 8
  Assistant Messages: 17

Metric Breakdown:
  Clarity               33/100 ███████░░░░░░░░░░░░░
  Iteration Quality     80/100 ████████████████░░░░
  Tool Usage            90/100 ██████████████████░░
  Problem Solving       85/100 █████████████████░░░
  Code Quality          88/100 ██████████████████░░
  Efficiency            70/100 ██████████████░░░░░░

Strengths:
  ✓ Effective iterative development
  ✓ Good tool utilization
  ✓ Thorough problem investigation
  ✓ Strong quality awareness

Areas for Improvement:
  → Provide more context and specificity in requests
```

## Sample Transcripts

The `transcripts/` directory contains three sample sessions:

1. **session1-good-workflow.txt** - Example of a high-quality workflow with clear planning, testing, and iteration
2. **session2-needs-improvement.txt** - Example showing common issues: vague requests, excessive backtracking
3. **session3-mixed-quality.txt** - Mixed workflow with some good practices and areas for improvement

## How It Works

### 1. Parsing
The `TranscriptParser` class identifies the format and extracts structured message data.

### 2. Evaluation
The `WorkflowEvaluator` class analyzes messages across six dimensions using pattern matching and heuristics.

### 3. Insights Generation
The system identifies strengths and improvement areas based on metric scores and patterns.

### 4. Formatting
The `OutputFormatter` class presents results with color coding and clear visual hierarchy.

## Approach & Design Philosophy

This tool focuses on **signals over perfection**. The metrics are designed to:

- **Be grounded in real workflow patterns** - Based on common software engineering practices
- **Provide actionable feedback** - Specific, implementable improvements
- **Avoid false precision** - Scores indicate trends, not absolute measurements
- **Support iterative improvement** - Track progress across sessions

### Why These Metrics?

**Clarity**: Clear communication reduces back-and-forth and prevents misunderstandings.

**Iteration Quality**: Good iteration builds incrementally; poor iteration involves excessive backtracking.

**Tool Usage**: Engineers who leverage AI capabilities effectively get more value.

**Problem Solving**: Investigating before acting prevents issues and builds understanding.

**Code Quality**: Awareness of testing, error handling, etc. indicates engineering maturity.

**Efficiency**: Focused sessions with appropriate scope are more productive.

## Limitations

- Text-based heuristics (no semantic understanding)
- Works best with substantial transcripts (10+ messages)
- Cannot evaluate actual code quality (only signals in conversation)
- Pattern matching may miss context-specific nuances

## Future Enhancements

Potential improvements:

- LLM-based semantic analysis
- Code diff analysis
- Time-based metrics
- Trend tracking across sessions
- Team aggregates
- Custom metric weights
- Integration with version control

## Technology Stack

- **Node.js**: Runtime environment
- **Commander.js**: CLI framework
- **Chalk**: Terminal color output
- **ES Modules**: Modern JavaScript

## Project Structure

```
ai-workflow-evaluator/
├── src/
│   ├── cli.js          # Command-line interface
│   ├── parser.js       # Transcript parsing logic
│   ├── evaluator.js    # Workflow evaluation metrics
│   └── formatter.js    # Output formatting
├── transcripts/        # Sample transcripts
│   ├── session1-good-workflow.txt
│   ├── session2-needs-improvement.txt
│   └── session3-mixed-quality.txt
├── package.json
└── README.md
```

## Development

To modify or extend:

1. **Add new metrics**: Edit `src/evaluator.js`, add new evaluation methods
2. **Support new formats**: Add parser methods in `src/parser.js`
3. **Customize output**: Modify `src/formatter.js`
4. **Adjust weights**: Change `calculateOverallScore` in `src/evaluator.js`

## Testing

Run with sample transcripts:

```bash
# Test single file
node src/cli.js transcripts/session1-good-workflow.txt

# Test all samples
node src/cli.js transcripts/*.txt

# Test with detailed output
node src/cli.js transcripts/*.txt --detailed

# Export JSON
node src/cli.js transcripts/*.txt --json
```

## Author

Built for Slait's engineering take-home assignment.

## License

MIT
