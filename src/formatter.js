/**
 * Output Formatter — console + HTML report
 */

import chalk from 'chalk';

const CONFIDENCE_COLOR = { high: chalk.green, medium: chalk.yellow, low: chalk.red };
const CONFIDENCE_ICON  = { high: '●', medium: '◑', low: '○' };

export class OutputFormatter {

  // ─── Console output ─────────────────────────────────────────────────────────

  formatEvaluation(result, options = {}) {
    if (options.json) return JSON.stringify(result, null, 2);
    if (!result.success) return chalk.red(`Error: ${result.error}`);

    const out = [];
    const { metrics, overall, phases, transcript } = result;

    out.push(chalk.bold.cyan('\n=== AI Workflow Evaluation ===\n'));

    // Overall score + confidence
    const sc = this.scoreColor(overall.score);
    const cc = CONFIDENCE_COLOR[overall.confidence] || chalk.white;
    out.push(chalk.bold('Overall Score:  ') + sc(`${overall.score}/100 (${overall.grade})`) +
      '  ' + cc(`${CONFIDENCE_ICON[overall.confidence]} ${overall.confidence} confidence`));
    out.push('');

    // Transcript info
    out.push(chalk.bold('Transcript:'));
    out.push(`  Format: ${transcript.format}  |  Messages: ${transcript.messageCount}  |  User turns: ${transcript.userMessages}  |  AI turns: ${transcript.assistantMessages}`);
    out.push('');

    // Metric table
    out.push(chalk.bold('Metrics:'));
    const metricRows = [
      ['Clarity',         metrics.clarity],
      ['Iteration',       metrics.iteration],
      ['Tool Usage',      metrics.toolUsage],
      ['Problem Solving', metrics.problemSolving],
      ['Code Quality',    metrics.codeQuality],
      ['Efficiency',      metrics.efficiency],
    ];
    for (const [name, m] of metricRows) {
      out.push(this.metricRow(name, m));
    }
    out.push('');

    // Phase timeline
    if (phases && phases.timeline.length > 0) {
      out.push(chalk.bold('Session Phases:'));
      out.push('  ' + this.phaseBar(phases));
      out.push('  ' + phases.timeline.map(p =>
        this.phaseColor(p.phase)(p.phase)
      ).join(' → '));
      out.push('');
    }

    // Strengths / improvements
    if (result.strengths.length) {
      out.push(chalk.bold.green('Strengths:'));
      result.strengths.forEach(s => out.push(chalk.green(`  ✓ ${s}`)));
      out.push('');
    }
    if (result.improvements.length) {
      out.push(chalk.bold.yellow('Improvements:'));
      result.improvements.forEach(i => out.push(chalk.yellow(`  → ${i}`)));
      out.push('');
    }

    // Insights
    if (result.insights.length) {
      out.push(chalk.bold('Insights:'));
      result.insights.forEach(ins => {
        const color = ins.type === 'strength' ? chalk.green : chalk.yellow;
        const icon  = ins.type === 'strength' ? '✓' : '→';
        out.push(color(`  ${icon} [${ins.category}] ${ins.message}`));
      });
      out.push('');
    }

    // Detailed metrics
    if (options.detailed) {
      out.push(chalk.bold('Detailed Metrics:'));
      for (const [name, m] of metricRows) {
        out.push(chalk.bold(`\n  ${name} (${m.score}/100, ${m.confidence} confidence):`));
        for (const [k, v] of Object.entries(m.details || {})) {
          out.push(`    ${k}: ${v}`);
        }
        if (m.pattern) out.push(`    pattern: ${m.pattern}`);
        if (m.approach) out.push(`    approach: ${m.approach}`);
      }
      out.push('');
    }

    // Reflection
    if (result.reflection) {
      out.push(chalk.bold('Reflection:'));
      result.reflection.split('\n').forEach(line => {
        out.push('  ' + line.replace(/\*\*(.*?)\*\*/g, (_, t) => chalk.bold(t)));
      });
      out.push('');
    }

    return out.join('\n');
  }

  metricRow(name, metric) {
    const sc = this.scoreColor(metric.score);
    const cc = CONFIDENCE_COLOR[metric.confidence] || chalk.white;
    const bar = this.bar(metric.score);
    const conf = cc(`${CONFIDENCE_ICON[metric.confidence]}`);
    return `  ${name.padEnd(18)} ${sc(String(metric.score).padStart(3))}/100  ${bar}  ${conf}`;
  }

  bar(score, width = 20) {
    const filled = Math.round((score / 100) * width);
    return this.scoreColor(score)('█'.repeat(filled)) + chalk.gray('░'.repeat(width - filled));
  }

  scoreColor(score) {
    if (score >= 80) return chalk.green.bold;
    if (score >= 60) return chalk.yellow;
    return chalk.red;
  }

  phaseColor(phase) {
    return { planning: chalk.blue, implementation: chalk.green, debugging: chalk.red, review: chalk.cyan }[phase] || chalk.white;
  }

  phaseBar(phases) {
    const icons = { planning: '📋', implementation: '⚙️ ', debugging: '🐛', review: '✅' };
    return phases.timeline.map(p => (icons[p.phase] || '?') + ' ' + p.phase).join('  ›  ');
  }

  // ─── Summary (batch) ────────────────────────────────────────────────────────

  formatSummary(results, filenames = []) {
    const out = [];
    out.push(chalk.bold.cyan('\n=== Workflow Evaluation Summary ===\n'));
    out.push(`Transcripts Analyzed: ${results.length}\n`);

    const valid = results.filter(r => r.success);
    if (valid.length === 0) { out.push(chalk.red('No valid results.')); return out.join('\n'); }

    const avg = Math.round(valid.reduce((s, r) => s + r.overall.score, 0) / valid.length);
    out.push(chalk.bold('Aggregate:'));
    out.push(`  Average Score: ${this.scoreColor(avg)(avg)}/100`);
    out.push('');

    out.push(chalk.bold('Individual Results:'));
    results.forEach((r, i) => {
      const label = filenames[i] ? filenames[i].split('/').pop() : `Transcript ${i + 1}`;
      if (r.success) {
        const sc = this.scoreColor(r.overall.score);
        const phase = r.phases?.dominant || '—';
        const conf = (CONFIDENCE_COLOR[r.overall.confidence] || chalk.white)(CONFIDENCE_ICON[r.overall.confidence] || '?');
        out.push(`  ${i + 1}. ${label}`);
        out.push(`     Score: ${sc(r.overall.score)} ${conf}  |  Messages: ${r.transcript.messageCount}  |  Dominant phase: ${phase}`);
      } else {
        out.push(chalk.red(`  ${i + 1}. ${label} — Error: ${r.error}`));
      }
    });
    out.push('');

    // Cross-session comparison
    if (valid.length > 1) {
      out.push(chalk.bold('Cross-Session Comparison:'));
      const metricKeys = ['clarity', 'iteration', 'toolUsage', 'problemSolving', 'codeQuality', 'efficiency'];
      const metricNames = { clarity: 'Clarity', iteration: 'Iteration', toolUsage: 'Tool Usage', problemSolving: 'Problem Solving', codeQuality: 'Code Quality', efficiency: 'Efficiency' };
      for (const key of metricKeys) {
        const scores = valid.map(r => r.metrics[key]?.score || 0);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const bars = scores.map(s => this.scoreColor(s)(String(s).padStart(3))).join('  ');
        out.push(`  ${metricNames[key].padEnd(18)} avg ${this.scoreColor(avg)(String(avg).padStart(3))}  [${bars}]`);
      }
      out.push('');
    }

    // Common patterns
    const allStrengths = valid.flatMap(r => r.strengths);
    const topStrengths = this.topN(allStrengths, 3);
    if (topStrengths.length) {
      out.push(chalk.bold.green('Common Strengths:'));
      topStrengths.forEach(([s, n]) => out.push(chalk.green(`  ✓ ${s} (${n}/${valid.length})`)));
      out.push('');
    }

    const allImprove = valid.flatMap(r => r.improvements);
    const topImprove = this.topN(allImprove, 3);
    if (topImprove.length) {
      out.push(chalk.bold.yellow('Common Improvements:'));
      topImprove.forEach(([s, n]) => out.push(chalk.yellow(`  → ${s} (${n}/${valid.length})`)));
      out.push('');
    }

    return out.join('\n');
  }

  topN(arr, n) {
    const counts = arr.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n);
  }

  // ─── HTML report ─────────────────────────────────────────────────────────────

  generateHTML(results, filenames = []) {
    const valid = results.filter(r => r.success);
    const avg = valid.length
      ? Math.round(valid.reduce((s, r) => s + r.overall.score, 0) / valid.length)
      : 0;

    const gradeColor = s => s >= 80 ? '#22c55e' : s >= 60 ? '#eab308' : '#ef4444';
    const confBadge = c => ({ high: '#22c55e', medium: '#eab308', low: '#ef4444' }[c] || '#94a3b8');
    const phaseColors = { planning: '#3b82f6', implementation: '#22c55e', debugging: '#ef4444', review: '#06b6d4' };

    const metricKeys = [
      ['clarity', 'Clarity'],
      ['iteration', 'Iteration'],
      ['toolUsage', 'Tool Usage'],
      ['problemSolving', 'Problem Solving'],
      ['codeQuality', 'Code Quality'],
      ['efficiency', 'Efficiency'],
    ];

    // Build per-session cards
    const sessionCards = results.map((r, i) => {
      const label = (filenames[i] || `Transcript ${i + 1}`).split('/').pop().replace('.txt', '');
      if (!r.success) return `<div class="card error"><h3>${label}</h3><p>Error: ${r.error}</p></div>`;

      const metricsRows = metricKeys.map(([k, name]) => {
        const m = r.metrics[k];
        const pct = m.score + '%';
        const col = gradeColor(m.score);
        const conf = m.confidence;
        return `
          <div class="metric-row">
            <span class="metric-name">${name}</span>
            <div class="bar-wrap"><div class="bar" style="width:${pct};background:${col}"></div></div>
            <span class="metric-score" style="color:${col}">${m.score}</span>
            <span class="conf-badge" style="background:${confBadge(conf)}" title="confidence">${conf[0].toUpperCase()}</span>
          </div>`;
      }).join('');

      const phaseTimeline = (r.phases?.timeline || []).map(p => `
        <span class="phase-chip" style="background:${phaseColors[p.phase] || '#94a3b8'}">${p.phase}</span>
      `).join('<span class="phase-arrow">›</span>');

      const insightItems = r.insights.map(ins => `
        <li class="insight ${ins.type}">
          <span class="insight-icon">${ins.type === 'strength' ? '✓' : '→'}</span>
          <span><strong>[${ins.category}]</strong> ${ins.message}</span>
        </li>`).join('');

      const reflectionHTML = (r.reflection || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

      return `
      <div class="card">
        <div class="card-header">
          <div>
            <h3>${label}</h3>
            <span class="tag">${r.transcript.format}</span>
            <span class="tag">${r.transcript.messageCount} messages</span>
          </div>
          <div class="score-badge" style="background:${gradeColor(r.overall.score)}">
            ${r.overall.score}<span class="grade-letter">${r.overall.grade}</span>
          </div>
        </div>

        <div class="section-label">Metrics</div>
        <div class="metrics">${metricsRows}</div>

        ${r.phases?.timeline.length ? `
        <div class="section-label">Session Phases</div>
        <div class="phases">${phaseTimeline}</div>` : ''}

        ${r.insights.length ? `
        <div class="section-label">Insights</div>
        <ul class="insights">${insightItems}</ul>` : ''}

        ${r.reflection ? `
        <details class="reflection-block">
          <summary>What makes this workflow good or not?</summary>
          <div class="reflection-body">${reflectionHTML}</div>
        </details>` : ''}
      </div>`;
    }).join('\n');

    // Cross-session comparison chart data
    const comparisonRows = valid.length > 1 ? metricKeys.map(([k, name]) => {
      const scores = results.map((r, i) => {
        const s = r.success ? (r.metrics[k]?.score || 0) : 0;
        const label = (filenames[i] || `T${i + 1}`).split('/').pop().replace('.txt', '').slice(0, 20);
        return `<div class="cmp-cell">
          <div class="cmp-bar" style="height:${s}%;background:${gradeColor(s)}"></div>
          <div class="cmp-val">${s}</div>
          <div class="cmp-label">${label}</div>
        </div>`;
      }).join('');
      return `<div class="cmp-group"><div class="cmp-metric-name">${name}</div><div class="cmp-bars">${scores}</div></div>`;
    }).join('') : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Workflow Evaluation Report</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
  h1 { font-size: 1.8rem; font-weight: 700; color: #f8fafc; }
  h2 { font-size: 1.2rem; font-weight: 600; color: #cbd5e1; margin: 2rem 0 1rem; }
  h3 { font-size: 1rem; font-weight: 600; color: #f1f5f9; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #1e293b; }
  .subtitle { color: #94a3b8; font-size: 0.875rem; margin-top: 0.25rem; }
  .avg-score { font-size: 3rem; font-weight: 800; color: ${gradeColor(avg)}; line-height: 1; }
  .avg-label { color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(540px, 1fr)); gap: 1.5rem; }
  .card { background: #1e293b; border-radius: 12px; padding: 1.5rem; border: 1px solid #334155; }
  .card.error { border-color: #ef4444; }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
  .score-badge { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; color: white; flex-shrink: 0; flex-direction: column; line-height: 1; }
  .grade-letter { font-size: 0.7rem; font-weight: 600; opacity: 0.9; }
  .tag { display: inline-block; background: #334155; color: #94a3b8; font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; margin: 4px 4px 0 0; }
  .section-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 1rem 0 0.5rem; font-weight: 600; }
  .metrics { display: flex; flex-direction: column; gap: 0.4rem; }
  .metric-row { display: grid; grid-template-columns: 130px 1fr 36px 24px; align-items: center; gap: 0.5rem; }
  .metric-name { font-size: 0.8rem; color: #94a3b8; }
  .bar-wrap { background: #0f172a; border-radius: 4px; height: 8px; overflow: hidden; }
  .bar { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .metric-score { font-size: 0.8rem; font-weight: 700; text-align: right; }
  .conf-badge { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 700; color: white; }
  .phases { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
  .phase-chip { background: #3b82f6; color: white; font-size: 0.7rem; padding: 3px 10px; border-radius: 999px; font-weight: 600; }
  .phase-arrow { color: #475569; font-size: 0.9rem; }
  .insights { list-style: none; display: flex; flex-direction: column; gap: 0.4rem; }
  .insight { display: flex; gap: 0.5rem; font-size: 0.82rem; padding: 0.4rem 0.6rem; border-radius: 6px; }
  .insight.strength { background: #14532d22; color: #86efac; }
  .insight.improvement { background: #71350022; color: #fcd34d; }
  .insight-icon { flex-shrink: 0; font-weight: 700; }
  .reflection-block { margin-top: 1rem; border: 1px solid #334155; border-radius: 8px; overflow: hidden; }
  .reflection-block summary { padding: 0.75rem 1rem; cursor: pointer; font-size: 0.82rem; color: #94a3b8; background: #0f172a; user-select: none; }
  .reflection-block summary:hover { color: #e2e8f0; }
  .reflection-body { padding: 1rem; font-size: 0.82rem; color: #cbd5e1; line-height: 1.7; border-top: 1px solid #1e293b; }
  .comparison { background: #1e293b; border-radius: 12px; padding: 1.5rem; border: 1px solid #334155; margin-bottom: 1.5rem; overflow-x: auto; }
  .cmp-group { margin-bottom: 1.5rem; }
  .cmp-metric-name { font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem; font-weight: 600; }
  .cmp-bars { display: flex; align-items: flex-end; gap: 0.75rem; height: 80px; }
  .cmp-cell { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 60px; }
  .cmp-bar { width: 40px; border-radius: 4px 4px 0 0; min-height: 4px; }
  .cmp-val { font-size: 0.75rem; font-weight: 700; }
  .cmp-label { font-size: 0.65rem; color: #64748b; text-align: center; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  footer { margin-top: 3rem; text-align: center; color: #475569; font-size: 0.75rem; }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>AI Workflow Evaluation</h1>
    <div class="subtitle">Generated ${new Date().toLocaleString()} · ${results.length} session${results.length !== 1 ? 's' : ''} analyzed</div>
  </div>
  <div style="text-align:right">
    <div class="avg-score">${avg}</div>
    <div class="avg-label">avg score</div>
  </div>
</div>

${valid.length > 1 ? `
<h2>Cross-Session Comparison</h2>
<div class="comparison">
  ${comparisonRows}
</div>` : ''}

<h2>Session Reports</h2>
<div class="cards">
${sessionCards}
</div>

<footer>AI Workflow Evaluator · Built for Slait</footer>
</body>
</html>`;
  }
}
