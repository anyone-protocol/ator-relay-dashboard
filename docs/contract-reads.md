# Contract reads

How the dashboard reads the operator registry, relay rewards and staking rewards processes.

## Read path

Every read is a plain HTTP GET of a contract view:

```
<hyperbeamUrl>/<process id>~process@1.0/as/<view>?<params>
```

[`composables/useHyperbeamRead.ts`](../composables/useHyperbeamRead.ts) is the one place that
builds this URL.

| Export | Use |
| --- | --- |
| `readContractView(baseUrl, processId, view, params)` | For code that runs outside a Nuxt context, such as a class built at module scope |
| `useHyperbeamRead().readView(processId, view, params)` | For components and composables |
| `useHyperbeamRead().setKeys(value)` | Reads a set-valued field as a list of keys |

Views return JSON. A non-2xx response throws.

## Response conventions

| Convention | Detail |
| --- | --- |
| Sets | A populated set is a map of key to `true`. An empty set arrives as `[]`. Read sets with `setKeys` |
| Absent values | A view leaves out a key that has no value. `as/rewards` returns only `{ address }` for an address that was never rewarded |
| Addresses | The contracts store and return EIP-55 addresses, and accept any case as input |

## Addresses

Use [`utils/eip55.ts`](../utils/eip55.ts) for every address that is compared, used as a map key,
or looked up in contract data.

| Helper | Result |
| --- | --- |
| `eip55(address)` | The canonical form. Returns the input unchanged when it cannot be checksummed |
| `sameAddress(a, b)` | True when both are the same account, in any case |

An upper-cased or lower-cased key does not match contract data.

## Views

| Process | View | Parameters | Returns |
| --- | --- | --- | --- |
| Operator registry | `operator` | `address` | One operator's registry entry. The `hardware` field holds the verified hardware fingerprints |
| Relay rewards | `rewards` | `address` | `{ address, reward }` |
| Relay rewards | `claimed` | `address` | `{ address, claimed }` |
| Relay rewards | `last_round` | none | The last round without per-relay details |
| Relay rewards | `last_round_details` | `address` | The last round's details for one operator's relays |
| Staking rewards | `rewards` | `address` | `{ Rewarded, Claimed }`, per operator |
| Staking rewards | `last_snapshot` | none | The last round, with `Details` |
| Staking rewards | `dump` | none | The whole state. Prefer `rewards`, `claimed` or `shares` for one hodler |

`last_snapshot` takes no parameters, so it does not depend on the connected address and can be
read without a wallet.

## Staking snapshot

The staking page derives per-operator stake and running status from `last_snapshot`.

- `Details` is keyed `[hodler][operator]`.
- The stake of an operator is the sum over all hodlers that staked to it.
- `Running` belongs to the operator, so every hodler staking to one operator carries the same
  value.
- `Score.Running` is already a ratio. "Your Relays Online" scales it to a percentage.

`Network` holds the relay counts per operator. It is optional, because a round settled by an
older contract version has none.

- When present, `Network` takes precedence over the ratio.
- `Network` also covers operators that have no stake. Those never appear in `Details`.

## Writes

The dashboard signs two operator registry messages with the connected wallet, through
`@anyone-protocol/ao-client`.

- The client requires an explicit node URL.
- Tag names are lowercase. The node presents them to the contract title-cased, for example
  `fingerprint-certificate` as `Fingerprint-Certificate`.

## Claiming rewards

The dashboard sends no AO claim. A user claims with an EVM transaction to the Hodler contract,
and the facilitator controller performs the AO write. The `Claim-Rewards` role on both reward
contracts belongs to the facilitator.

## Explorer links

The footer links to the Lunar explorer, which is hash-routed at `/#/explorer/`. It resolves
process history through Arweave and needs no access to the node.
