/* global require, __dirname */
import fs from 'fs';
import path, { resolve } from 'path';
import Project from 'fixturify-project';
import { execa } from 'execa';
import ejs from 'ejs';

import { expect, describe, beforeEach, afterEach, it } from 'vitest';

const BIN_PATH = resolve('./bin/release-plan-setup.js');
const ROOT = process.cwd();
const EDITOR = 'EDITOR' in process.env ? process.env.EDITOR : null;
const PATH = process.env.PATH;

function exec(args) {
  return execa(process.execPath, ['--unhandled-rejections=strict', BIN_PATH, ...args]);
}

expect.extend({
  toMatchDevDependency(actual, name) {
    let pkg = require('../package');
    let expected = pkg.devDependencies[name];

    return {
      message: () => `expected ${name} to be specified as \`${expected}\` but was ${actual}`,
      pass: expected === actual,
    };
  },
});

describe('main binary', function () {
  let project;

  beforeEach(function () {
    project = new Project('some-thing-cool', '0.1.0');
    project.writeSync();
    process.chdir(path.join(project.root, project.name));

    // ensure an EDITOR is present
    process.env.EDITOR = '/bin/whatever';
  });

  afterEach(function () {
    process.chdir(ROOT);

    // reset process.env.EDITOR to initial state
    if (EDITOR === null) {
      delete process.env.EDITOR;
    } else {
      process.env.EDITOR = EDITOR;
    }

    process.env.PATH = PATH;
  });

  it('adds CHANGELOG.md file', async function () {
    expect(fs.existsSync('CHANGELOG.md')).toBeFalsy();

    await exec(['--no-install', '--no-label-updates']);

    expect(fs.existsSync('CHANGELOG.md')).toBeTruthy();
  });

  it('does not modify if an existing prefix exists in CHANGELOG.md', async function () {
    project.files['CHANGELOG.md'] = `# ChangeLog\n\n## v1.2.0\n* Foo bar`;
    project.writeSync();

    await exec(['--no-install', '--no-label-updates']);

    expect(fs.readFileSync('CHANGELOG.md', { encoding: 'utf8' })).toBe(
      '# ChangeLog\n\n## v1.2.0\n* Foo bar'
    );
  });

  describe('package.json', function () {
    it('adds repository info when discoverable from `.git/config`', async function () {
      project.files['.git'] = {
        config: `
[core]
  repositoryformatversion = 0
  filemode = true
  bare = false
  logallrefupdates = true
  ignorecase = true
  precomposeunicode = true

[remote "origin"]
  url = git@github.com:mansona/create-release-plan-setup.git
  fetch = +refs/heads/*:refs/remotes/origin/*`,
      };

      project.writeSync();

      await exec(['--no-install', '--no-label-updates']);

      let pkg = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' }));

      expect(pkg).toMatchInlineSnapshot(
        {
          dependencies: {},
          devDependencies: {
            'release-plan': expect.toMatchDevDependency('release-plan'),
          },
          keywords: [],
          name: 'some-thing-cool',
          repository: {
            type: 'git',
            url: 'git@github.com:mansona/create-release-plan-setup.git',
          },
          version: '0.1.0',
        },
        `
        {
          "dependencies": {},
          "devDependencies": {
            "release-plan": toMatchDevDependency<release-plan>,
          },
          "keywords": [],
          "name": "some-thing-cool",
          "repository": {
            "type": "git",
            "url": "git@github.com:mansona/create-release-plan-setup.git",
          },
          "version": "0.1.0",
        }
      `
      );
    });

    it('does not update devDependencies if release-plan range is greater', async function () {
      project.addDevDependency('release-plan', '^999.999.999');
      project.writeSync();

      await exec(['--no-install', '--no-label-updates']);

      let pkg = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' }));

      expect(pkg).toMatchInlineSnapshot(
        {
          devDependencies: {},
        },
        `
        {
          "dependencies": {},
          "devDependencies": {
            "release-plan": "^999.999.999",
          },
          "keywords": [],
          "name": "some-thing-cool",
          "version": "0.1.0",
        }
      `
      );
    });

    // skip this test when running locally, it is pretty slow and unlikely to _actually_ matter
    (process.env.CI ? it : it.skip)(
      'installs dependencies',
      async function () {
        await exec(['--no-label-updates']);

        expect(fs.existsSync('node_modules/release-plan')).toBeTruthy();
      },
      60000
    );
  });

  describe('workflow files', function () {
    function expectedPublishWorkflowContents(kind = 'npm', defaultBranch = 'main') {
      let publishTemplate = fs.readFileSync(
        path.join(__dirname, '..', 'publish-template.yml.ejs'),
        {
          encoding: 'utf8',
        }
      );

      return ejs.render(publishTemplate, { pnpm: kind === 'pnpm', defaultBranch });
    }

    function expectedPlanReleaseWorkflowContents(kind = 'npm') {
      let publishTemplate = fs.readFileSync(
        path.join(__dirname, '..', 'plan-release-template.yml.ejs'),
        {
          encoding: 'utf8',
        }
      );

      return ejs.render(publishTemplate, { pnpm: kind === 'pnpm' });
    }

    it('adds both the workflow files for Release Plan PR and the actual release when no pnpm-lock.yaml exists', async function () {
      expect(fs.existsSync('.github/workflows/publish.yml')).toBeFalsy();
      expect(fs.existsSync('.github/workflows/plan-release.yml')).toBeFalsy();

      await exec(['--no-install', '--no-label-updates']);

      expect(fs.readFileSync('.github/workflows/publish.yml', { encoding: 'utf8' })).toBe(
        expectedPublishWorkflowContents()
      );
      expect(fs.readFileSync('.github/workflows/plan-release.yml', { encoding: 'utf8' })).toBe(
        expectedPlanReleaseWorkflowContents()
      );
    });

    it('adds both the workflow files for Release Plan PR and the actual release when pnpm-lock.yaml exists', async function () {
      fs.writeFileSync('pnpm-lock.yaml', '', { encoding: 'utf-8' });
      expect(fs.existsSync('.github/workflows/publish.yml')).toBeFalsy();
      expect(fs.existsSync('.github/workflows/plan-release.yml')).toBeFalsy();

      await exec(['--no-install', '--no-label-updates']);

      expect(fs.readFileSync('.github/workflows/publish.yml', { encoding: 'utf8' })).toBe(
        expectedPublishWorkflowContents('pnpm')
      );
      expect(fs.readFileSync('.github/workflows/plan-release.yml', { encoding: 'utf8' })).toBe(
        expectedPlanReleaseWorkflowContents('pnpm')
      );
    });
  });

  describe('RELEASE.md', function () {
    beforeEach(() => {
      project.files['.git'] = {
        config: `
[remote "origin"]
  url = git@github.com:mansona/create-release-plan-setup.git
  fetch = +refs/heads/*:refs/remotes/origin/*`,
      };

      project.writeSync();
    });

    function expectedReleaseContents() {
      let releaseContents = fs.readFileSync(path.join(__dirname, '..', 'release-template.md'), {
        encoding: 'utf8',
      });

      const planReleaseReplacementValue = `https://github.com/mansona/create-release-plan-setup/pulls?q=is%3Apr+is%3Aopen+%22Prepare+Release%22+in%3Atitle`;

      return releaseContents.replace('{{PLAN_RELEASE_PR}}', planReleaseReplacementValue);
    }

    it('adds RELEASE.md to repo when no yarn.lock exists', async function () {
      expect(fs.existsSync('RELEASE.md')).toBeFalsy();

      await exec(['--no-install', '--no-label-updates']);

      expect(fs.readFileSync('RELEASE.md', { encoding: 'utf8' })).toBe(expectedReleaseContents());
    });

    describe('--update', function () {
      beforeEach(async function () {
        await exec(['--no-install', '--no-label-updates']);
      });

      it('updates RELEASE.md', async function () {
        fs.writeFileSync('RELEASE.md', 'lololol', 'utf8');

        await exec(['--no-install', '--no-label-updates', '--update']);

        expect(fs.readFileSync('RELEASE.md', { encoding: 'utf8' })).toBe(expectedReleaseContents());
      });

      it('adds a basic header in changelog if prefix does not exist in CHANGELOG.md', async function () {
        project.files['CHANGELOG.md'] = `## v1.2.0\n* Foo bar`;
        project.writeSync();

        await exec(['--no-install', '--no-label-updates', '--update']);

        expect(fs.readFileSync('CHANGELOG.md', { encoding: 'utf8' })).toBe(
          '# Changelog\n\n## v1.2.0\n* Foo bar'
        );
      });
    });
  });
});
