import findRepoURL from './findRepoUrl.js';
import { expect, describe, it } from 'vitest';

describe('unit', function () {
  describe('findRepoURL', function () {
    it.each`
      source                                     | expected
      ${'https://github.com/rwjblue/foo'}        | ${'rwjblue/foo'}
      ${'https://github.com/rwjblue/foo.git'}    | ${'rwjblue/foo'}
      ${'https://github.com/rwjblue/foo.js.git'} | ${'rwjblue/foo.js'}
      ${'git@github.com:rwjblue/foo.git'}        | ${'rwjblue/foo'}
      ${'git@github.com:rwjblue/foo.js.git'}     | ${'rwjblue/foo.js'}
      ${'git@github.com:rwjblue/foo.js.git'}     | ${'rwjblue/foo.js'}
      ${'rwjblue/foo'}                           | ${'rwjblue/foo'}
      ${'rwjblue/foo.js'}                        | ${'rwjblue/foo.js'}
      ${''}                                      | ${undefined}
    `('$source -> $expected', ({ source, expected }) => {
      expect(findRepoURL({ repository: source })).toBe(expected);
      expect(findRepoURL({ repository: { url: source } })).toBe(expected);
    });
  });
});
