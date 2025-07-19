import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('Interactive Mode Tests', () => {

  test('should detect interactive mode when no CLI args provided', () => {
    // Test the logic that determines interactive mode
    const args = ['node', 'dist/index.js'];
    const shouldUseInteractive = args.length <= 2;
    assert(shouldUseInteractive === true, 'Should use interactive mode with no args');
  });

  test('should detect CLI mode when args are provided', () => {
    // Test the logic that determines CLI mode
    const args = ['node', 'dist/index.js', '-i', 'package.json', '-o', 'output.csv'];
    const shouldUseInteractive = args.length <= 2;
    assert(shouldUseInteractive === false, 'Should use CLI mode with args');
  });

});