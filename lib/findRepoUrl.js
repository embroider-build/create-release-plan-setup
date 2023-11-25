import { fromUrl as getRepoInfoFromURL } from 'hosted-git-info';

export default function findRepoURL(pkg) {
  if (!pkg.repository) {
    // no repo, nothing to do
    return;
  }

  // see https://docs.npmjs.com/configuring-npm/package-json#repository for valid formats
  const url = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository.url;
  const repoInfo = getRepoInfoFromURL(url);
  if (repoInfo === undefined || repoInfo === null || repoInfo.type !== 'github') {
    return;
  }

  return `${repoInfo.user}/${repoInfo.project}`;
}
