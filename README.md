# create-release-plan-setup

> This project is a fork of the excellent work in [create-rwjblue-release-it-setup](https://github.com/rwjblue/create-rwjblue-release-it-setup)

This is a simple npm init package to add the perfect release-plan setup. Running this init package will **automatically** do the following:

* add `release-plan` dependency
* add the required `.github/workflows` files
* add a `CHANGELOG.md`
* add a `RELEASE.md`
* update your repository's labels with sensible defaults

## Usage

### Disallow rebase merging on your repository

Rebase merging produces commits on the main branch that do not include a link to the original PR. When used, `release-plan` will not be able to produce a correct changelog and determine the version bump to perform.

Make sure [rebase merging is disallowed](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-rebasing-for-pull-requests) when using `release-plan`.

### Generate a GitHub personal access token

1. Obtain a [GitHub personal access token](https://github.com/settings/tokens/new?scopes=repo&description=GITHUB_AUTH+env+variable).
2. Make sure the token is available locally as the `GITHUB_AUTH` environment variable. (you can also prepend it to the init script)

  For instance:
  ```bash
  export GITHUB_AUTH=abc123def456
  ```

This is used to add the required Labels to your repo, if you don't want to automatically generate them you can run the next command with `--no-label-updates`

### (Only for new repositories) Create the first tag

`release-plan` requires an initial tag. We suggest:

```bash
git tag v0.0.0
git push origin v0.0.0
```

### Run the init script

```
npm init release-plan-setup@latest
```

Or prepended with your `GITHUB_AUTH` token:

```
GITHUB_AUTH=abc123def456 npm init release-plan-setup@latest
```
This can be run again later to make sure your setup is on the latest and greatest setup.

### Ensure your GitHub Actions token can create PRs

As this workflow automatically creates a PR for you during the release process you need to make sure that your `{{GITHUB_TOKEN}}` available to your actions has enough permissions to create a PR. In most cases this should be turned on by default but if you find that there is an permissions error when one of the `Release Plan Review` action is creating a PR you can:

- open the settings for your repo
- click Actions > General in the left menu
- scroll to the Workflow permissions section at the bottom of the page
- make sure that your GITHUB_TOKEN has `Read and write permissions` and that the `Allow GitHub Actions to create and approve pull requests` is checked
- Hit save

### Set up Trusted Publishing for your package

Once you're ready to do your first release with this release-plan setup your GitHub Actions will
need to be authorized to publish your package to npm. To do this, you will set up
[Trusted Publishing](https://docs.npmjs.com/trusted-publishers#for-github-actions) for your package.
This is sometimes referred to as 'OIDC'.

If you are creating a new package, you will need to manually publish once first
in order to have access to settings to set up Trusted Publishing.
Be sure you are okay with the version in `package.json` as the first version then run `npm publish`.

Now you should be free to merge your PR and release your package with release-plan 🎉

## License

This project is licensed under the [MIT License](LICENSE.md).
