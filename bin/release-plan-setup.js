#!/usr/bin/env node

import fs from 'fs';
import util from 'util';
import execa from 'execa';
import sortPackageJson from 'sort-package-json';
import gitconfiglocal from 'gitconfiglocal';
import which from 'which';
import parseMarkdown from 'mdast-util-from-markdown';
import findRepoURL from '../lib/findRepoUrl.js'
import getDependencyRange from '../lib/getDependencyRange.js';
import ejs from 'ejs';
import { mkdir } from 'fs/promises';

const RELEASE_PLAN_VERSION = (() => {
  const anotherFile = new URL('../package.json', import.meta.url);
  const data = fs.readFileSync(anotherFile, 'utf-8');
  const pkg = JSON.parse(data);

  return pkg.devDependencies['release-plan'];
})();

const gitconfig = util.promisify(gitconfiglocal);

const skipInstall = process.argv.includes('--no-install');
const skipLabels = process.argv.includes('--no-label-updates');
const labelsOnly = process.argv.includes('--labels-only');
const update = process.argv.includes('--update');

const DETECT_TRAILING_WHITESPACE = /\s+$/;

function hasEditor() {
  let EDITOR = process.env.EDITOR;

  if (!EDITOR) {
    EDITOR = which.sync('editor', { nothrow: true });
  }

  return !!EDITOR;
}

async function updatePackageJSON() {
  let contents = fs.readFileSync('package.json', { encoding: 'utf8' });
  let trailingWhitespace = DETECT_TRAILING_WHITESPACE.exec(contents);
  let pkg = JSON.parse(contents);
  let hasWorkspaces = !!pkg.workspaces;

  if (labelsOnly) {
    return pkg;
  }

  if (!findRepoURL(pkg)) {
    try {
      let config = await gitconfig(process.cwd());
      let originRemoteUrl = config.remote && config.remote.origin && config.remote.origin.url;

      if (originRemoteUrl) {
        pkg.repository = {
          type: 'git',
          url: originRemoteUrl,
        };
      }
    } catch (error) {
      if (!error.message.includes('no gitconfig to be found')) {
        throw error;
      }
    }
  }

  pkg.devDependencies['release-plan'] = getDependencyRange(
    pkg.devDependencies['release-plan'],
    RELEASE_PLAN_VERSION
  );

  pkg.devDependencies = pkg.devDependencies || {};

  let sortedPkg = sortPackageJson(pkg);
  let updatedContents = JSON.stringify(sortedPkg, null, 2);

  if (trailingWhitespace) {
    updatedContents += trailingWhitespace[0];
  }

  fs.writeFileSync('package.json', updatedContents, { encoding: 'utf8' });

  return sortedPkg;
}

async function updateLabels(pkg) {
  if (skipLabels) {
    return;
  }

  const githubLabelSync = require('github-label-sync');

  let accessToken = process.env.GITHUB_AUTH;
  let labels = require('../labels');
  let repo = findRepoURL(pkg);

  // no repository setup, bail
  if (!repo) {
    return;
  }

  await githubLabelSync({
    accessToken,
    repo,
    labels,
    allowAddedLabels: true,
  });
}

function isYarn() {
  return fs.existsSync('yarn.lock');
}

function isPnpm() {
  return fs.existsSync('pnpm-lock.yaml');
}

async function installDependencies() {
  if (labelsOnly || skipInstall) {
    return;
  }

  if (isYarn()) {
    await execa('yarn');
  } else if (isPnpm()) {
    await execa('pnpm', ['install']);
  } else {
    await execa('npm', ['install']);
  }
}


try {
  if (!fs.existsSync('package.json')) {
    /* eslint-disable-next-line no-console */
    console.error(
      "create-release-plan-setup should be run from within an existing npm package's root directory"
    );
    process.exit(1);
  }

  let hasChangelog = fs.existsSync('CHANGELOG.md');

  console.log({hasChangelog});

  if (!hasChangelog && !labelsOnly) {
    fs.writeFileSync('CHANGELOG.md', '# Changelog\n', { encoding: 'utf8' });
  }

  if (hasChangelog && update) {
    let changelogContent = fs.readFileSync('CHANGELOG.md', { encoding: 'utf8' });
    let ast = parseMarkdown(changelogContent);

    let hasH1 = ast.children.find((it) => it.type === 'heading' && it.depth === 1);

    if (!hasH1) {
      fs.writeFileSync('CHANGELOG.md', `# Changelog\n\n${changelogContent}`, {
        encoding: 'utf8',
      });
    }
  }

  let pkg = await updatePackageJSON();

  if ((!fs.existsSync('.github/workflows/publish.yml') || update) && !labelsOnly) {
    let publishContents = fs.readFileSync(new URL('../publish-template.yml.ejs', import.meta.url), 'utf8');
    let planReleaseContents = fs.readFileSync(new URL('../plan-release-template.yml.ejs', import.meta.url), 'utf8');

    await mkdir('.github/workflows', {recursive: true});

    fs.writeFileSync('.github/workflows/publish.yml', ejs.render(publishContents, { pnpm: isPnpm() }), { encoding: 'utf8'})
    fs.writeFileSync('.github/workflows/plan-release.yml', ejs.render(planReleaseContents, { pnpm: isPnpm() }), { encoding: 'utf8'})
  }

  if ((!fs.existsSync('RELEASE.md') || update) && !labelsOnly) {
    const anotherFile = new URL('../release-template.md', import.meta.url);
    let releaseContents = fs.readFileSync(anotherFile, 'utf8');

    const repoUrl = findRepoURL(pkg);

    let planReleaseReplacementValue = `https://github.com/${repoUrl}/pulls?q=is%3Apr+is%3Aopen+%22Plan+Release%22+in%3Atitle`;
    

    fs.writeFileSync(
      'RELEASE.md',
      releaseContents
        .replace('{{PLAN_RELEASE_PR}}', planReleaseReplacementValue),
      { encoding: 'utf8' }
    );
  }  

  await installDependencies();

  // TODO: figure out a decent way to test this part
  await updateLabels(pkg);
} catch (e) {
  /* eslint-disable-next-line no-console */
  console.error(e);

  throw e;
}