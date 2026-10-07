# Publishing `@hewarge/calendar-core` to npm

This document describes the first public npm release workflow for the scoped package `@hewarge/calendar-core`.

## 1. Create or verify your npm account

Sign in at npmjs.com and make sure the account that owns the `hewarge` scope is the account you will publish from.

Check the CLI session:

```bash
npm login
npm whoami
```

If `npm whoami` prints the expected npm username, the CLI is authenticated.

## 2. Verify the package name

The package name in `package.json` is:

```json
{
  "name": "@hewarge/calendar-core"
}
```

A scoped package belongs to the user or organization scope. If the `hewarge` scope is not owned by your npm account, you must either use an available scope you own or create/use the appropriate npm organization.

## 3. Check the package metadata

At minimum, the package must have a valid `name` and `version`. This package already contains both.

Before publishing, review:

```bash
npm pkg get name version description license files exports
```

## 4. Inspect exactly what npm will publish

Run:

```bash
npm pack --dry-run
```

This is an important security and quality check. Do not publish API keys, `.env` files, passwords, private certificates, local logs, `node_modules`, or unrelated development files.

The package uses the `files` field to restrict the published content to the library source, UI demo, documentation, examples, README, license and changelog.

## 5. Test the package locally

Run the package tests:

```bash
npm test
```

Then test the packed artifact itself. First create the tarball:

```bash
npm pack
```

This produces a `.tgz` file. In a separate temporary test project:

```bash
mkdir hewarge-npm-test
cd hewarge-npm-test
npm init -y
npm install ../path/to/hewarge-calendar-core-1.0.2.tgz
```

Then test an import:

```js
import { HewargeDate } from '@hewarge/calendar-core';

const date = HewargeDate.fromGregorian(2026, 9, 7);
console.log(date.toKurdish());
```

Also test the picker export in a browser project.

## 6. Publish the first public scoped release

For the first public release of a scoped package:

```bash
npm publish --access public
```

npm's current documentation states that a scoped package is restricted by default, so `--access public` is required for an initial direct public publish. Publishing also requires the npm account's configured publishing authentication, such as 2FA or an appropriate granular access token.

## 7. Verify the publication

After npm accepts the publish, verify:

```bash
npm view @hewarge/calendar-core version
npm view @hewarge/calendar-core dist-tags
```

Then install it from a clean project:

```bash
npm install @hewarge/calendar-core
```

Do not rely only on the local source directory. A clean install verifies that the `files`, `exports`, `main`, `module`, `types` and CSS package paths are correct.

## 8. Important npm rule: versions are permanent

Do not publish `1.0.2` as a test and expect to overwrite it later. npm does not allow the same package name and version combination to be republished.

For a correction after `1.0.2` has been published, increment the version, for example:

```bash
npm version patch
```

which would create `1.0.3`, or choose the appropriate semver level manually.

## 9. Recommended first-release checklist

- [ ] `npm whoami` shows the correct publisher
- [ ] Package name/scope is owned by the publisher
- [ ] `npm test` passes
- [ ] `npm pack --dry-run` contains only intended files
- [ ] No secrets or local configuration are included
- [ ] README contains installation and API examples
- [ ] Picker CSS export works from a clean install
- [ ] Core import works from a clean install
- [ ] Demo works in a browser
- [ ] First public release uses `npm publish --access public`
- [ ] A clean project can install `@hewarge/calendar-core`

## 10. Future releases

For a later patch release:

```bash
npm version patch
npm test
npm pack --dry-run
npm publish
```

For a minor release:

```bash
npm version minor
```

For a major release:

```bash
npm version major
```

Use semantic versioning carefully: changing public API behavior in a backward-incompatible way should be treated differently from a bug fix.
