/**
 * Transcript Parser
 * Handles parsing of AI coding session transcripts from various tools
 */

export class TranscriptParser {
  /**
   * Parse a transcript from various AI coding tools
   * @param {string} content - Raw transcript content
   * @param {string} format - Format type (auto, claude, cursor, chatgpt, generic)
   */
  parse(content, format = 'auto') {
    if (format === 'auto') {
      format = this.detectFormat(content);
    }

    const parser = this.getParser(format);
    return parser(content);
  }

  /**
   * Detect transcript format based on content patterns
   */
  detectFormat(content) {
    // Try to parse as JSON first
    try {
      const json = JSON.parse(content);
      if (json.messages || json.conversation) return 'json';
      if (json.events) return 'claude-json';
    } catch (e) {
      // Not JSON, continue with text-based detection
    }

    // Detect based on content patterns
    if (content.includes('Claude Code') || content.includes('assistant:') && content.includes('user:')) {
      return 'claude';
    }
    if (content.includes('Cursor') || content.includes('// Cursor')) {
      return 'cursor';
    }
    if (content.includes('ChatGPT') || content.includes('You said:')) {
      return 'chatgpt';
    }

    return 'generic';
  }

  /**
   * Get appropriate parser function
   */
  getParser(format) {
    const parsers = {
      'json': this.parseJSON.bind(this),
      'claude-json': this.parseClaudeJSON.bind(this),
      'claude': this.parseClaudeText.bind(this),
      'cursor': this.parseCursorText.bind(this),
      'chatgpt': this.parseChatGPTText.bind(this),
      'generic': this.parseGenericText.bind(this)
    };

    return parsers[format] || parsers.generic;
  }

  /**
   * Parse structured JSON format
   */
  parseJSON(content) {
    const data = JSON.parse(content);
    const messages = data.messages || data.conversation || [];

    return {
      format: 'json',
      messages: messages.map(msg => ({
        role: msg.role || msg.sender || 'unknown',
        content: msg.content || msg.text || '',
        timestamp: msg.timestamp || null,
        metadata: msg.metadata || {}
      })),
      metadata: {
        sessionId: data.sessionId || data.id || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null
      }
    };
  }

  /**
   * Parse Claude Code JSON format
   */
  parseClaudeJSON(content) {
    const data = JSON.parse(content);
    const events = data.events || [];

    const messages = events
      .filter(e => e.type === 'message' || e.type === 'tool_use' || e.type === 'tool_result')
      .map(event => ({
        role: event.role || (event.type === 'tool_use' ? 'assistant' : 'user'),
        content: event.content || event.text || '',
        timestamp: event.timestamp || null,
        metadata: {
          type: event.type,
          tool: event.tool || null,
          ...event.metadata
        }
      }));

    return {
      format: 'claude-json',
      messages,
      metadata: data.metadata || {}
    };
  }

  /**
   * Parse Claude Code text format
   */
  parseClaudeText(content) {
    const messages = [];
    const lines = content.split('\n');
    let currentMessage = null;

    for (const line of lines) {
      // Match role patterns like "user:", "assistant:", "Human:", "Assistant:"
      const roleMatch = line.match(/^(user|assistant|human|claude):\s*(.*)/i);

      if (roleMatch) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        currentMessage = {
          role: roleMatch[1].toLowerCase() === 'human' ? 'user' :
                roleMatch[1].toLowerCase() === 'claude' ? 'assistant' :
                roleMatch[1].toLowerCase(),
          content: roleMatch[2],
          timestamp: null,
          metadata: {}
        };
      } else if (currentMessage && line.trim()) {
        currentMessage.content += '\n' + line;
      }
    }

    if (currentMessage) {
      messages.push(currentMessage);
    }

    return {
      format: 'claude-text',
      messages,
      metadata: {}
    };
  }

  /**
   * Parse Cursor text format
   */
  parseCursorText(content) {
    // Similar to Claude but with Cursor-specific markers
    const messages = [];
    const lines = content.split('\n');
    let currentMessage = null;

    for (const line of lines) {
      const roleMatch = line.match(/^(You|Cursor|AI):\s*(.*)/i);

      if (roleMatch) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        const role = roleMatch[1].toLowerCase();
        currentMessage = {
          role: role === 'you' ? 'user' : 'assistant',
          content: roleMatch[2],
          timestamp: null,
          metadata: { source: role }
        };
      } else if (currentMessage && line.trim()) {
        currentMessage.content += '\n' + line;
      }
    }

    if (currentMessage) {
      messages.push(currentMessage);
    }

    return {
      format: 'cursor',
      messages,
      metadata: {}
    };
  }

  /**
   * Parse ChatGPT text format
   */
  parseChatGPTText(content) {
    const messages = [];
    const lines = content.split('\n');
    let currentMessage = null;

    for (const line of lines) {
      const userMatch = line.match(/^You said:\s*(.*)/i);
      const assistantMatch = line.match(/^ChatGPT said:\s*(.*)/i);

      if (userMatch) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        currentMessage = {
          role: 'user',
          content: userMatch[1],
          timestamp: null,
          metadata: {}
        };
      } else if (assistantMatch) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        currentMessage = {
          role: 'assistant',
          content: assistantMatch[1],
          timestamp: null,
          metadata: {}
        };
      } else if (currentMessage && line.trim()) {
        currentMessage.content += '\n' + line;
      }
    }

    if (currentMessage) {
      messages.push(currentMessage);
    }

    return {
      format: 'chatgpt',
      messages,
      metadata: {}
    };
  }

  /**
   * Parse generic text format (fallback)
   */
  parseGenericText(content) {
    // Try to split by common patterns
    const messages = [];
    const blocks = content.split(/\n\n+/);

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].trim();
      if (!block) continue;

      messages.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: block,
        timestamp: null,
        metadata: {}
      });
    }

    return {
      format: 'generic',
      messages,
      metadata: {}
    };
  }
}
