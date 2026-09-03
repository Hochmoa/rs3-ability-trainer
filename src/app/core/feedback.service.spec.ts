import { describe, expect, it } from 'vitest';
import { buildFeedback, feedbackProblem } from './feedback.service';

describe('feedback', () => {
  const ctx = { userId: null, displayName: null, page: '/rotations', userAgent: 'UA' };

  it('rejects empty or too short messages', () => {
    expect(feedbackProblem({ kind: 'bug', message: '   ', contact: '' })).toBeTruthy();
    expect(feedbackProblem({ kind: 'bug', message: 'hi', contact: '' })).toBeTruthy();
    expect(feedbackProblem({ kind: 'bug', message: 'Surge is missing', contact: '' })).toBeNull();
  });

  it('rejects messages over the limit', () => {
    expect(feedbackProblem({ kind: 'suggestion', message: 'x'.repeat(4001), contact: '' })).toBeTruthy();
  });

  it('trims and nulls empty optionals for anonymous senders', () => {
    const row = buildFeedback({ kind: 'suggestion', message: '  add dark mode  ', contact: '  ' }, ctx);
    expect(row).toEqual({
      kind: 'suggestion',
      message: 'add dark mode',
      contact: null,
      user_id: null,
      display_name: null,
      page: '/rotations',
      user_agent: 'UA',
    });
  });

  it('attaches user id and display name for logged-in senders', () => {
    const row = buildFeedback({ kind: 'bug', message: 'GCD bar stuck', contact: 'me@x.y' }, { ...ctx, userId: 'u1', displayName: 'Frodo' });
    expect(row.user_id).toBe('u1');
    expect(row.display_name).toBe('Frodo');
    expect(row.contact).toBe('me@x.y');
  });

  it('does not leak a display name without a user id', () => {
    const row = buildFeedback({ kind: 'bug', message: 'GCD bar stuck', contact: '' }, { ...ctx, displayName: 'Frodo' });
    expect(row.display_name).toBeNull();
  });
});
