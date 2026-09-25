# Meridian Distribution

YSZ Meridian ships as two surfaces:

## Web

The browser build is produced by:

```bash
npm run web:build
```

GitHub Pages deployment is handled by `.github/workflows/pages.yml`.

If Pages is not enabled yet, the workflow builds successfully and skips deployment without failing the repository checks.

## Desktop

The Electron desktop app can be packaged locally with:

```bash
npm run desktop:build
```

The GitHub Actions workflow **Build YSZ Meridian Desktop** packages:

- macOS Intel (`x64`)
- macOS Apple Silicon (`arm64`)

Each run uploads downloadable workflow artifacts.

The workflow can optionally publish those artifacts into a GitHub prerelease by enabling `publish_release` when manually running it.

## Signing

CI packages are intentionally unsigned until Apple Developer ID signing credentials are configured.

Unsigned macOS builds may trigger Gatekeeper warnings.

The distribution workflow must not claim code signing or notarization unless both are explicitly configured and verified.
