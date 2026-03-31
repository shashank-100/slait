#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import { TranscriptParser } from './parser.js';
import { WorkflowEvaluator } from './evaluator.js';
import { OutputFormatter } from './formatter.js';

const program = new Command();

program
  .name('ai-eval')
  .description('Evaluate AI-assisted coding workflow quality from transcripts')
  .version('1.0.0');

program
  .argument('[files...]', 'Transcript files to evaluate')
  .option('-d, --detailed', 'Show detailed metrics')
  .option('-j, --json', 'Output as JSON')
  .option('--html', 'Generate an HTML report (writes report.html by default)')
  .option('-f, --format <format>', 'Force transcript format (auto|json|claude|cursor|chatgpt|generic)', 'auto')
  .option('-o, --output <file>', 'Write output to file')
  .action((files, options) => {
    if (files.length === 0) {
      console.error('Error: provide at least one transcript file.');
      console.log('Usage: ai-eval <file1> [file2] [options]');
      process.exit(1);
    }

    const parser    = new TranscriptParser();
    const evaluator = new WorkflowEvaluator();
    const formatter = new OutputFormatter();

    const results = files.map(file => {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const parsed  = parser.parse(content, options.format);
        return evaluator.evaluate(parsed);
      } catch (err) {
        return { success: false, error: `${file}: ${err.message}`, transcript: null, metrics: null, overall: null, phases: null, insights: [], strengths: [], improvements: [], reflection: '' };
      }
    });

    let output;

    if (options.html) {
      output = formatter.generateHTML(results, files);
      const outPath = options.output || 'report.html';
      fs.writeFileSync(outPath, output);
      console.log(chalk.green(`HTML report written to ${outPath}`));
      return;
    }

    if (files.length === 1) {
      output = formatter.formatEvaluation(results[0], { detailed: options.detailed, json: options.json });
    } else {
      if (options.json) {
        output = JSON.stringify(results, null, 2);
      } else {
        output = formatter.formatSummary(results, files);
        if (options.detailed) {
          results.forEach((r, i) => {
            output += `\n${chalk.bold(`─── ${files[i].split('/').pop()} ───`)}\n`;
            output += formatter.formatEvaluation(r, { detailed: true });
          });
        }
      }
    }

    if (options.output) {
      fs.writeFileSync(options.output, output);
      console.log(`Results written to ${options.output}`);
    } else {
      console.log(output);
    }
  });

program.parse();
