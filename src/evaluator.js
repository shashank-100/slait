/**
 * Workflow Evaluator
 * Analyzes AI-assisted coding workflows and provides quality metrics,
 * confidence scores, and phase detection.
 */

export class WorkflowEvaluator {
  evaluate(transcript) {
    const { messages } = transcript;

    if (!messages || messages.length === 0) {
      return this.emptyResult('No messages found in transcript');
    }

    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    const metrics = {
      clarity:        this.evaluateClarity(userMessages),
      iteration:      this.evaluateIteration(userMessages),
      toolUsage:      this.evaluateToolUsage(assistantMessages),
      problemSolving: this.evaluateProblemSolving(messages),
      codeQuality:    this.evaluateCodeQuality(messages),
      efficiency:     this.evaluateEfficiency(messages, userMessages, assistantMessages)
    };

    const phases   = this.detectPhases(messages);
    const overall  = this.calculateOverall(metrics);
    const insights = this.generateInsights(metrics, messages);

    return {
      success: true,
      transcript: {
        messageCount:       messages.length,
        userMessages:       userMessages.length,
        assistantMessages:  assistantMessages.length,
        format:             transcript.format
      },
      metrics,
      phases,
      overall,
      insights,
      strengths:    this.identifyStrengths(metrics),
      improvements: this.identifyImprovements(metrics),
      reflection:   this.generateReflection(metrics, phases)
    };
  }

  // ─── Confidence helper ──────────────────────────────────────────────────────
  // Returns high/medium/low confidence based on number of data points available.
  confidence(dataPoints) {
    if (dataPoints >= 10) return 'high';
    if (dataPoints >= 4)  return 'medium';
    return 'low';
  }

  // ─── Clarity ────────────────────────────────────────────────────────────────
  evaluateClarity(userMessages) {
    const n = userMessages.length;
    let hasContext = 0, isSpecific = 0, hasExamples = 0, isWellStructured = 0;

    for (const msg of userMessages) {
      const c = msg.content.toLowerCase();
      const words = c.split(/\s+/).length;
      if (c.match(/because|since|so that|in order to|to fix|to add|to improve/)) hasContext++;
      if (c.match(/function|class|file|component|api|endpoint|\.[jt]s|\.py|error|bug/)) isSpecific++;
      if (c.match(/for example|like|such as|e\.g\.|should|need|want|```/)) hasExamples++;
      if (words >= 10 && words <= 200) isWellStructured++;
    }

    const score = n > 0 ? Math.min(100, Math.round(
      (hasContext / n) * 25 +
      (isSpecific / n) * 30 +
      (hasExamples / n) * 25 +
      (isWellStructured / n) * 20
    )) : 0;

    return {
      score,
      confidence: this.confidence(n),
      factors: { hasContext, isSpecific, hasExamples, isWellStructured },
      details: {
        avgContextProvided: n > 0 ? (hasContext / n * 100).toFixed(1) + '%' : '0%',
        avgSpecificity:     n > 0 ? (isSpecific / n * 100).toFixed(1) + '%' : '0%',
        sampleSize:         n
      }
    };
  }

  // ─── Iteration ──────────────────────────────────────────────────────────────
  evaluateIteration(userMessages) {
    const n = userMessages.length;
    let refinements = 0, backtracks = 0, builds = 0;

    for (let i = 1; i < userMessages.length; i++) {
      const c = userMessages[i].content.toLowerCase();
      if (c.match(/also|additionally|furthermore|improve|enhance|refine|adjust/)) refinements++;
      if (c.match(/actually|wait|no[,\s]|instead|revert|undo|go back|mistake|wrong/)) backtracks++;
      if (c.match(/now|next|after that|then|following|can you also|on top of/)) builds++;
    }

    const iterRatio     = n > 1 ? (refinements + builds) / (n - 1) : 0;
    const backtrackRatio = n > 0 ? backtracks / n : 0;

    let score = 50;
    if (iterRatio > 0.3 && iterRatio < 0.8) score += 30;
    if (backtrackRatio < 0.2) score += 20;

    const pattern = iterRatio > 0.5 ? 'iterative'
      : backtrackRatio > 0.3       ? 'exploratory'
      : 'direct';

    return {
      score: Math.min(100, score),
      confidence: this.confidence(n),
      refinements, backtracks, builds, pattern,
      details: { iterRatio: iterRatio.toFixed(2), backtrackRatio: backtrackRatio.toFixed(2) }
    };
  }

  // ─── Tool usage ─────────────────────────────────────────────────────────────
  evaluateToolUsage(assistantMessages) {
    const n = assistantMessages.length;
    const counts = { read: 0, write: 0, edit: 0, search: 0, execute: 0, test: 0 };

    for (const msg of assistantMessages) {
      const c = msg.content.toLowerCase();
      if (c.match(/read|reading|\[read:/)) counts.read++;
      if (c.match(/write|writing|create|\[write:/)) counts.write++;
      if (c.match(/edit|modify|update|\[edit:/)) counts.edit++;
      if (c.match(/search|find|grep|\[grep:|\[glob:/)) counts.search++;
      if (c.match(/run|execute|bash|\[running:/)) counts.execute++;
      if (c.match(/test|testing|spec|jest|pytest|\[test/)) counts.test++;
    }

    const diversity = Object.values(counts).filter(v => v > 0).length;
    let score = (diversity / 6) * 60;
    if (counts.read > 0 && counts.edit > 0) score += 20;
    if (counts.test > 0) score += 20;

    return {
      score: Math.min(100, Math.round(score)),
      confidence: this.confidence(n),
      counts,
      diversity,
      pattern: this.toolPattern(counts),
      details: { totalToolCalls: Object.values(counts).reduce((a, b) => a + b, 0) }
    };
  }

  toolPattern(c) {
    if (c.test > 2) return 'test-driven';
    if (c.search > c.edit) return 'exploratory';
    if (c.read > 0 && c.edit > 0) return 'methodical';
    return 'action-focused';
  }

  // ─── Problem solving ────────────────────────────────────────────────────────
  evaluateProblemSolving(messages) {
    const n = messages.length;
    let investigation = 0, systematic = 0, premature = 0;

    for (const msg of messages) {
      const c = msg.content.toLowerCase();
      if (c.match(/let me check|first|investigate|understand|examine|analyze|explore/)) investigation++;
      if (c.match(/step \d|plan|approach|first.*then|second|third/)) systematic++;
      if (msg.role === 'assistant' && c.match(/should work|probably|might work|assume|guess/)) premature++;
    }

    let score = 50;
    if (investigation > n * 0.2) score += 25;
    if (systematic    > n * 0.15) score += 25;
    score -= Math.min(20, premature * 5);

    const approach = investigation > 3 ? 'thorough'
      : systematic > 2                 ? 'structured'
      : 'direct';

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence: this.confidence(n),
      investigation, systematic, premature, approach
    };
  }

  // ─── Code quality signals ───────────────────────────────────────────────────
  evaluateCodeQuality(messages) {
    const n = messages.length;
    const signals = { errorHandling: 0, testing: 0, documentation: 0, refactoring: 0, edgeCases: 0, security: 0 };

    for (const msg of messages) {
      const c = msg.content.toLowerCase();
      if (c.match(/error|exception|try|catch|handle|validation/)) signals.errorHandling++;
      if (c.match(/test|spec|jest|pytest|assert/)) signals.testing++;
      if (c.match(/comment|document|readme|docstring/)) signals.documentation++;
      if (c.match(/refactor|clean up|optimize|simplify/)) signals.refactoring++;
      if (c.match(/edge case|corner case|null|undefined|empty|boundary/)) signals.edgeCases++;
      if (c.match(/security|sanitize|escape|injection|xss|csrf/)) signals.security++;
    }

    const awareness = Object.values(signals).filter(v => v > 0).length;
    let score = (awareness / 6) * 70;
    if (signals.testing > 0) score += 15;
    if (signals.errorHandling > 0) score += 15;

    return {
      score: Math.min(100, Math.round(score)),
      confidence: this.confidence(n),
      signals,
      awareness,
      focus: this.qualityFocus(signals)
    };
  }

  qualityFocus(signals) {
    const max = Math.max(...Object.values(signals));
    if (max === 0) return 'none';
    return Object.entries(signals).find(([, v]) => v === max)?.[0] || 'balanced';
  }

  // ─── Efficiency ─────────────────────────────────────────────────────────────
  evaluateEfficiency(messages, userMessages, assistantMessages) {
    const total = messages.length;
    const avgUserLen = userMessages.length > 0
      ? userMessages.reduce((s, m) => s + m.content.length, 0) / userMessages.length
      : 0;
    const balance = userMessages.length > 0
      ? assistantMessages.length / userMessages.length
      : 0;

    let score = 70;
    if (total > 50) score -= 20;
    else if (total > 30) score -= 10;
    if (avgUserLen > 100 && avgUserLen < 1000) score += 15;
    if (balance > 0.8 && balance < 3) score += 15;

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence: this.confidence(total),
      totalMessages: total,
      userMessages:  userMessages.length,
      assistantMessages: assistantMessages.length,
      avgUserMsgLength: Math.round(avgUserLen),
      conversationBalance: balance.toFixed(2)
    };
  }

  // ─── Phase detection ────────────────────────────────────────────────────────
  detectPhases(messages) {
    const phaseSignals = {
      planning: /plan|design|architecture|approach|strategy|structure|outline|how should|what.*best way|before we|first let's/i,
      implementation: /implement|create|build|write|add|make|here'?s? the|i'?ve? (added|created|written|built)/i,
      debugging: /error|bug|fix|broken|failing|wrong|issue|problem|not working|debug|check why|investigate/i,
      review: /looks good|test|verify|done|complete|finished|lgtm|check|confirm|validate/i
    };

    // Slide a window across messages and score each phase
    const windowSize = Math.max(4, Math.floor(messages.length / 5));
    const timeline = [];

    for (let i = 0; i < messages.length; i += Math.max(1, Math.floor(windowSize / 2))) {
      const window = messages.slice(i, i + windowSize);
      const text = window.map(m => m.content).join(' ');
      const scores = {};
      for (const [phase, regex] of Object.entries(phaseSignals)) {
        const matches = text.match(new RegExp(regex.source, 'gi')) || [];
        scores[phase] = matches.length;
      }
      const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
      if (dominant && dominant[1] > 0) {
        timeline.push({
          messageRange: [i, Math.min(i + windowSize, messages.length) - 1],
          phase: dominant[0],
          scores
        });
      }
    }

    // Deduplicate consecutive same phases
    const collapsed = [];
    for (const entry of timeline) {
      if (collapsed.length === 0 || collapsed[collapsed.length - 1].phase !== entry.phase) {
        collapsed.push(entry);
      } else {
        collapsed[collapsed.length - 1].messageRange[1] = entry.messageRange[1];
      }
    }

    // Summary: which phases were present and how dominant
    const phaseCounts = {};
    for (const { phase } of collapsed) {
      phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
    }

    return {
      timeline: collapsed,
      summary: phaseCounts,
      dominant: Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'implementation',
      hasPlanning: !!phaseCounts.planning,
      hasDebugging: !!phaseCounts.debugging,
      phaseCount: collapsed.length
    };
  }

  // ─── Overall score ──────────────────────────────────────────────────────────
  calculateOverall(metrics) {
    const weights = { clarity: 0.25, iteration: 0.15, toolUsage: 0.15, problemSolving: 0.20, codeQuality: 0.15, efficiency: 0.10 };
    const score = Math.round(
      Object.entries(weights).reduce((sum, [k, w]) => sum + (metrics[k]?.score || 0) * w, 0)
    );
    // Overall confidence is the lowest confidence of any metric
    const confidenceLevels = { high: 3, medium: 2, low: 1 };
    const minConf = Math.min(...Object.values(metrics).map(m => confidenceLevels[m.confidence] || 1));
    const overallConfidence = Object.keys(confidenceLevels).find(k => confidenceLevels[k] === minConf) || 'low';

    return { score, grade: this.grade(score), weights, confidence: overallConfidence };
  }

  grade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // ─── Insights ───────────────────────────────────────────────────────────────
  generateInsights(metrics, messages) {
    const insights = [];

    if (metrics.clarity.score < 60)
      insights.push({ category: 'clarity', type: 'improvement', message: 'Requests lack context. Include error messages, file paths, and the "why" behind each ask.' });
    else if (metrics.clarity.score >= 80)
      insights.push({ category: 'clarity', type: 'strength', message: 'Clear, well-contextualized requests throughout the session.' });

    if (metrics.iteration.backtracks > 3)
      insights.push({ category: 'iteration', type: 'improvement', message: 'High backtracking suggests unclear initial requirements. Spend more time upfront defining the goal.' });
    if (metrics.iteration.pattern === 'iterative')
      insights.push({ category: 'iteration', type: 'strength', message: 'Good iterative development — building incrementally on previous work.' });

    if (metrics.toolUsage.score < 50)
      insights.push({ category: 'toolUsage', type: 'improvement', message: 'Limited tool diversity. Try using search/grep to explore before editing.' });
    if (metrics.toolUsage.pattern === 'test-driven')
      insights.push({ category: 'toolUsage', type: 'strength', message: 'Test-driven approach — running tests regularly.' });

    if (metrics.problemSolving.investigation < 2)
      insights.push({ category: 'problemSolving', type: 'improvement', message: 'Jump to implementation too fast. Read the relevant code first to understand context.' });
    if (metrics.problemSolving.approach === 'thorough')
      insights.push({ category: 'problemSolving', type: 'strength', message: 'Thorough investigation before acting.' });

    if (metrics.codeQuality.signals.testing === 0)
      insights.push({ category: 'codeQuality', type: 'improvement', message: 'No tests mentioned. Ask the AI to write or run tests for new code.' });
    if (metrics.codeQuality.awareness >= 4)
      insights.push({ category: 'codeQuality', type: 'strength', message: 'Strong quality awareness across multiple dimensions.' });

    if (metrics.efficiency.totalMessages > 40)
      insights.push({ category: 'efficiency', type: 'improvement', message: 'Long session. Break into smaller, focused tasks with clear stopping points.' });

    return insights;
  }

  identifyStrengths(metrics) {
    const s = [];
    if (metrics.clarity.score >= 75)          s.push('Clear and specific communication');
    if (metrics.iteration.pattern === 'iterative') s.push('Effective iterative development');
    if (metrics.toolUsage.diversity >= 4)     s.push('Good tool utilization');
    if (metrics.problemSolving.approach === 'thorough') s.push('Thorough problem investigation');
    if (metrics.codeQuality.awareness >= 4)   s.push('Strong quality awareness');
    if (metrics.efficiency.score >= 75)       s.push('Efficient, focused workflow');
    return s.length > 0 ? s : ['Functional workflow with room for improvement'];
  }

  identifyImprovements(metrics) {
    const i = [];
    if (metrics.clarity.score < 60)           i.push('Provide more context in requests');
    if (metrics.iteration.backtracks > 3)     i.push('Reduce backtracking by clarifying goals upfront');
    if (metrics.toolUsage.diversity < 3)      i.push('Explore more AI capabilities (search, test, read)');
    if (metrics.problemSolving.investigation < 2) i.push('Investigate codebase before making changes');
    if (metrics.codeQuality.signals.testing === 0) i.push('Incorporate testing into your workflow');
    if (metrics.efficiency.totalMessages > 40) i.push('Break work into smaller focused sessions');
    return i.length > 0 ? i : ['Maintain current workflow practices'];
  }

  // ─── Reflection ─────────────────────────────────────────────────────────────
  // A human-readable summary grounded in this specific session's signals.
  generateReflection(metrics, phases) {
    const lines = [];

    // Opening framing
    lines.push(`What makes an AI-assisted workflow "good" isn't whether the AI writes clever code — it's whether the engineer stays in control of the problem. The best sessions share a few observable properties.`);
    lines.push('');

    // 1. Clarity drives everything
    lines.push(`**Clear intent before each turn.** When engineers describe what they need and why, the AI produces better output on the first try. Vague prompts ("fix the bug") require multiple clarifying rounds that compound error. This session scored ${metrics.clarity.score}/100 on clarity — ${metrics.clarity.score < 60 ? 'suggesting requests could be more specific, with error messages, file paths, and goals included upfront.' : 'showing well-contextualized requests.'}`);
    lines.push('');

    // 2. Investigation over assumption
    lines.push(`**Read before you write.** Jumping straight to implementation without understanding the codebase leads to solutions that miss constraints. Strong workflows include explicit exploration — reading files, grepping for patterns, understanding existing structure. This session showed ${metrics.problemSolving.investigation} investigation steps with a "${metrics.problemSolving.approach}" approach.`);
    lines.push('');

    // 3. Phases and structure
    const phaseList = Object.keys(phases.summary).join(' → ');
    lines.push(`**Sessions have natural phases.** Planning, implementation, debugging, and review each require different prompting strategies. Recognizing which phase you're in helps you use AI appropriately — broad questions in planning, precise edits in implementation, hypothesis-driven prompts in debugging. This session moved through: ${phaseList || 'implementation'}.`);
    lines.push('');

    // 4. Iteration quality
    lines.push(`**Iteration should build, not thrash.** Good iteration adds scope or refines output. Bad iteration backtracks because the goal was unclear. This session had ${metrics.iteration.refinements} refinements and ${metrics.iteration.backtracks} backtracks — a "${metrics.iteration.pattern}" pattern.`);
    lines.push('');

    // 5. Quality ownership
    lines.push(`**The engineer owns quality, not the AI.** Tests, error handling, and edge cases don't happen automatically — the engineer has to ask. Sessions that discuss testing and error handling produce more reliable code. This session showed ${metrics.codeQuality.awareness}/6 quality dimensions in the conversation.`);
    lines.push('');

    lines.push(`In short: a good AI workflow is one where the engineer uses AI as a fast executor of well-formed intentions — not as a crutch for unclear thinking.`);

    return lines.join('\n');
  }

  emptyResult(reason) {
    return {
      success: false,
      error: reason,
      transcript: null,
      metrics: null,
      phases: null,
      overall: null,
      insights: [],
      strengths: [],
      improvements: [],
      reflection: ''
    };
  }
}
