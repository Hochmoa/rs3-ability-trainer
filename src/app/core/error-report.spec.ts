import { describe, expect, it } from 'vitest';
import { describeError, fingerprintOf } from './error-report.service';

describe('error report', () => {
  it('describes errors, wrapped rejections and plain objects', () => {
    const e = new TypeError('x is not a function');
    expect(describeError(e).message).toBe('TypeError: x is not a function');
    expect(describeError(e).stack).toContain('x is not a function');
    expect(describeError({ rejection: new Error('boom') }).message).toBe('boom');
    expect(describeError({ message: 'row-level security', code: '42501' }).message).toBe('row-level security');
    expect(describeError('plain string').message).toBe('plain string');
    expect(describeError(undefined).message).toBe('undefined');
  });

  it('fingerprints ignore numbers, urls, bundle hashes and line numbers but not the message or the top frames', () => {
    const a = fingerprintOf('Cannot read properties of undefined (reading "id") 12', 'Error: x\n    at foo (https://rs3trainer.hochware.com/main-ABC123.js:10:20)\n    at bar (main-ABC123.js:11:2)');
    const b = fingerprintOf('Cannot read properties of undefined (reading "id") 99', 'Error: x\n    at foo (https://rs3trainer.hochware.com/main-ZZZ999.js:55:1)\n    at bar (main-ZZZ999.js:77:9)');
    const c = fingerprintOf('Cannot read properties of undefined (reading "name")', 'Error: x\n    at foo (main-ABC123.js:10:20)');
    const d = fingerprintOf('Cannot read properties of undefined (reading "id")', 'Error: x\n    at other (main-ABC123.js:10:20)');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toBe(d);
    expect(a).toMatch(/^[0-9a-f]{8}$/);
  });
});
