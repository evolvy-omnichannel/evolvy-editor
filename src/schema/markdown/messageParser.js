import MarkdownIt from 'markdown-it';
import { MarkdownParser } from 'prosemirror-markdown';
import {
  baseSchemaToMdMapping,
  baseNodesMdToPmMapping,
  baseMarksMdToPmMapping,
  filterMdToPmSchemaMapping,
} from './parser';

export const messageSchemaToMdMapping = {
  nodes: { ...baseSchemaToMdMapping.nodes },
  marks: { ...baseSchemaToMdMapping.marks },
};

export const messageMdToPmMapping = {
  ...baseNodesMdToPmMapping,
  ...baseMarksMdToPmMapping,
  mention: {
    node: 'mention',
    getAttrs: ({ mention }) => {
      const { userId, userFullName } = mention;
      return { userId, userFullName };
    },
  },
};

const md = MarkdownIt('commonmark', {
  html: false,
  linkify: false,
});

md.enable([
  // Process html entity - &#123;, &#xAF;, &quot;, ...
  'entity',
  // Process escaped chars and hardbreaks
  'escape',
]);

export class MessageMarkdownTransformer {
  constructor(schema, tokenizer = md) {
    // Enable markdown plugins based on schema
    ['nodes', 'marks'].forEach(key => {
      for (const idx in messageSchemaToMdMapping[key]) {
        if (schema[key][idx]) {
          tokenizer.enable(messageSchemaToMdMapping[key][idx]);
        }
      }
    });

    this.markdownParser = new MarkdownParser(
      schema,
      tokenizer,
      filterMdToPmSchemaMapping(schema, messageMdToPmMapping)
    );
  }
  encode(_node) {
    throw new Error('This is not implemented yet');
  }

  parse(content) {
    content = content.replace(/(\S*[^\s\*]*)(\*([^\s\*][^\*]*[^\s\*]|[^\s\*])\*)/g, (text) => {
      const boldRegex = /\*{1}(.*?)\*{1}/g;
      const newText = text.replace(boldRegex, '**$1**');
      return newText;
    });

    content = content.replace(/(\S*[^\s\_]*)(\_([^\s\_][^\_]*[^\s\_]|[^\s\_])\_)/g, (text) => {
      const italicRegex = /_{1}(.*?)_{1}/g;
      const newText = text.replace(italicRegex, '*$1*');
      return newText;
    });

    return this.markdownParser.parse(content);
  }
}
