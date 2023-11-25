# create-release-plan-setup

> This project is a fork of the excellent work in [create-rwjblue-release-it-setup](https://github.com/rwjblue/create-rwjblue-release-it-setup)

Simple npm init bin package to add the perfect release-plan setup

This will do the following:

* add `release-plan` dependency,
* add required `.github/workflows` files
* add a `CHANGELOG.md`
* add a `RELEASE.md`
* update your repository's labels with sensible defaults

## Usage

### Prerequisites

1. Obtain a [GitHub personal access token][generate-token].
2. Make sure the token is available as the `GITHUB_AUTH` environment variable.
  For instance:
  ```bash
  export GITHUB_AUTH=abc123def456
  ```

[generate-token]: https://github.com/settings/tokens/new?scopes=repo&description=GITHUB_AUTH+env+variable

### Freshly Configuring a Repo

When you want to set up a repo with `release-plan`, you can run:

```
npm init release-plan-setup
```

### Updating an Already Configured Repo

If you'd like to update an existing repo to use the latest and greatest setup, you can run:

```
npm init release-plan-setup --update
```

### Only Sync Labels

If you'd like to run only the label sync, you can do that with:

```
npm init release-plan-setup --labels-only
```

## License

This project is licensed under the [MIT License](LICENSE.md).
