# create-release-plan-setup

> This project is a fork of the excellent work in [create-rwjblue-release-it-setup](https://github.com/rwjblue/create-rwjblue-release-it-setup)

This is a simple npm init package to add the perfect release-plan setup. Running this init package will **automatically** do the following:

* add `release-plan` dependency
* add the required `.github/workflows` files
* add a `CHANGELOG.md`
* add a `RELEASE.md`
* update your repository's labels with sensible defaults

## Usage

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
- scroll to the Workflow permissions section at the botom of the page
- make sure that your GITHUB_TOKEN has `Read and write permissions` and that the `Allow GitHub Actions to create and approve pull requests` is checked
- Hit save

### Create a NPM_TOKEN

Once you're ready to do your first release with this release-plan setup your GitHub Actions will need to have a npm token to actually do the release. We recommend that you generate a single Granular Access Token that is able to release your package (or all the packages in a your monorepo).

If you are creating a new package, you will need to manually publish once first in order to generate a Granular Access Token. Be sure you are okay with the version in `package.json` as the first version then run `npm publish`. 

To create an access token you can follow [this guide on the npm docs](https://docs.npmjs.com/creating-and-viewing-access-tokens#creating-granular-access-tokens-on-the-website). Once you have your access token you can add it to your repo following these steps:

- open the settings for your repo
- click `Secrets and variables` > `Actions` in the left menu
- in the `Repository secrets` section click the `New repository secret` button
- name your token `NPM_TOKEN` as this is what the release action expects
- paste the token you generated into the `Secret` field and hit save

Now you should be free to merge your PR and release your package with release-plan 🎉

## License

This project is licensed under the [MIT License](LICENSE.md).
