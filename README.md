# LoonRules

Routing rule lists for Loon, with a small configuration extension for FlClash.

## Files

| Path | Contents |
| --- | --- |
| `rules/AI.list` | AI services and related tools |
| `rules/Crypto.list` | Crypto and Web3 services |
| `rules/US_Media_Finance.list` | Financial and international news sources |
| `rules/US_Tools.list` | Region-specific utility and documentation domains |
| `rules/Global_Resources.list` | General CDN and external resource domains |
| `flclash/LoonRules.js` | FlClash configuration extension |

## Rule format

Each `.list` file contains plain-text rules, one per line. For example:

```text
DOMAIN-SUFFIX,example.com
```

Lines starting with `#` are comments. The lists contain matching rules only; proxy policies are assigned in the client. Use each file's raw URL as a subscription endpoint. Renamed files require the subscription URL to be updated.

## FlClash

`flclash/LoonRules.js` is an extension for a compatible Mihomo subscription, not a standalone proxy configuration. It converts the main node selector into a latency-based `url-test` group using its underlying nodes, then adds remote rule providers for the AI, Crypto/Web3 and Finance lists. Other subscription rules and groups are retained. The US_Tools and Global_Resources lists are optional and are not loaded by this extension.

The rule providers refresh independently. If the extension script itself changes, a client that stores an imported copy may need the script re-imported.

## Maintenance

1. Update the most specific existing list for the domain or service.
2. Check official domains, duplicate entries and overlap with other lists before adding a rule. Avoid broad matches on shared infrastructure unless necessary.
3. Keep rule syntax, file names and subscription paths unchanged unless a migration is intentional.
4. When editing the FlClash script, test nested groups, selector name variations, repeated application and preservation of existing rules.

Commit changes to `main`; raw file URLs then continue to serve the same paths.
