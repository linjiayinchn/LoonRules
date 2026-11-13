# LoonRules

A compact repository of text-based routing rules and optional client extensions.

## Structure

- `rules/*.list`: one rule per line; client-specific policies are configured separately.
- `flclash/*.js`: optional client-side configuration transforms.

## Maintenance conventions

- Preserve existing public file paths and compatible rule syntax.
- Keep rule changes narrow; check duplicates, overbroad matches and unintended routing effects.
- Review third-party changes before inclusion. Do not silently import entire external lists.
- Keep documentation minimal and generic.
- Do not commit credentials, private URLs, tokens, exported app profiles, device/network identifiers, diagnostics or personal configuration history.
- Validate modified files before committing. Existing subscriptions should remain usable.
