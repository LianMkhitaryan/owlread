// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Unsafe HTML and hidden network calls, banned everywhere (architecture 10.1).
const unsafeSyntax = [
  {
    selector: 'AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]',
    message: 'Page content is untrusted: build DOM nodes instead of setting HTML (architecture 10.1).',
  },
  {
    selector: 'CallExpression[callee.property.name=/^(insertAdjacentHTML|createContextualFragment|setHTMLUnsafe|parseFromString)$/]',
    message: 'Page content is untrusted: build DOM nodes instead of parsing HTML (architecture 10.1).',
  },
  {
    selector: 'CallExpression[callee.object.name="document"][callee.property.name=/^(write|writeln)$/]',
    message: 'document.write is not allowed (architecture 10.1).',
  },
  {
    selector: 'CallExpression[callee.property.name="sendBeacon"]',
    message: 'No network requests of our own (architecture rule 2).',
  },
];

// Network APIs, banned outside the colour engine path (architecture rule 2 and 6.3).
const networkMessage = 'No network requests of our own (architecture rule 2). Only extension/lib/colour may fetch stylesheets.';
const networkGlobals = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts'].map((name) => ({
  name,
  message: networkMessage,
}));
const networkProperties = ['window', 'self', 'globalThis'].map((object) => ({
  object,
  property: 'fetch',
  message: networkMessage,
}));

// Browser and extension APIs, banned in the engine (architecture 3).
const browserGlobals = [
  'window',
  'document',
  'navigator',
  'location',
  'chrome',
  'browser',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'self',
].map((name) => ({
  name,
  message: 'The engine is pure TypeScript with no browser APIs (architecture 3).',
}));

export default defineConfig(
  { ignores: ['**/node_modules/', '**/.output/', '**/.wxt/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-restricted-syntax': ['error', ...unsafeSyntax],
      'no-restricted-globals': ['error', ...networkGlobals],
      'no-restricted-properties': ['error', ...networkProperties],
    },
  },
  {
    files: ['packages/engine/**'],
    rules: {
      'no-restricted-globals': ['error', ...networkGlobals, ...browserGlobals],
    },
  },
  {
    files: ['extension/lib/colour/**'],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-properties': 'off',
    },
  },
);
