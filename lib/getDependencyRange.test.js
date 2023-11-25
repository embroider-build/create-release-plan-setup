import getDependencyRange from './getDependencyRange.js';

import { expect, describe, it } from 'vitest';

describe('unit', function () {
  describe('getDependencyRange', function () {
    it.each`
      theirs              | ours        | expected
      ${'1.0.0'}          | ${'^2.0.0'} | ${'^2.0.0'}
      ${'^3.0.0'}         | ${'^2.0.0'} | ${'^3.0.0'}
      ${'github:foo/bar'} | ${'^2.0.0'} | ${'github:foo/bar'}
      ${'foo/bar'}        | ${'^2.0.0'} | ${'foo/bar'}
    `('returns $expected given $theirs -> $ours', ({ ours, theirs, expected }) => {
      expect(getDependencyRange(theirs, ours)).toBe(expected);
    });
  });
});
