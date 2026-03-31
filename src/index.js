/**
 * AI Workflow Evaluator - Programmatic API
 * Export classes for programmatic usage
 */

export { TranscriptParser } from './parser.js';
export { WorkflowEvaluator } from './evaluator.js';
export { OutputFormatter } from './formatter.js';

/**
 * Convenience function for quick evaluation
 * @param {string} transcriptContent - Raw transcript content
 * @param {Object} options - Configuration options
 * @returns {Object} Evaluation result
 */
export function evaluateTranscript(transcriptContent, options = {}) {
  const parser = new TranscriptParser();
  const evaluator = new WorkflowEvaluator();

  const format = options.format || 'auto';
  const parsed = parser.parse(transcriptContent, format);
  const result = evaluator.evaluate(parsed);

  return result;
}

/**
 * Evaluate multiple transcripts
 * @param {Array<string>} transcripts - Array of transcript contents
 * @param {Object} options - Configuration options
 * @returns {Array<Object>} Array of evaluation results
 */
export function evaluateMultiple(transcripts, options = {}) {
  return transcripts.map(transcript => evaluateTranscript(transcript, options));
}
