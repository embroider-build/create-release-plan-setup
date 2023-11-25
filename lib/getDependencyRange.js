import semver from 'semver';

export default function getDependencyRange(theirs, ours) {
  if (theirs) {
    let ourRange = new semver.Range(ours);
    let ourMinimumVersion = ourRange.set[0][0].semver.version;

    let theirMinimumVersion;
    try {
      let theirRange = new semver.Range(theirs);
      theirMinimumVersion = theirRange.set[0][0].semver.version;
    } catch (error) {
      // handle github:foo/a#bar
      if (error.message.startsWith('Invalid comparator')) {
        // if it is invalid, but not missing, theirs should be preserved
        return theirs;
      } else {
        throw error;
      }
    }

    // pre-existing version is newer, do nothing
    if (semver.gt(theirMinimumVersion, ourMinimumVersion)) {
      return theirs;
    }
  }

  return ours;
}