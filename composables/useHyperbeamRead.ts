/**
 * The single place that knows how to read a native contract view over HTTP.
 *
 * Replaces six copies of a URL built for a read surface that no longer exists:
 *
 *   now/~lua@5.3a&module=<dynamicViews>/<view>/serialize~json@1.0?operator=…   -> 500
 *   as/<view>?address=…                                                        -> 200 application/json
 *
 * Four things in the old form are dead:
 *   - `now/` does not resolve a Lua view and 404s; `as/` is what CALLS one.
 *   - `&module=<dynamicViews>` loaded views from a separate module. Contract state now lives in
 *     globals, which makes a detached views module structurally impossible.
 *   - `serialize~json@1.0` is redundant: views already return JSON.
 *   - the view names changed (`get_relay_info_for_address` -> `operator`, etc).
 *
 * Addresses are passed through as-is: the contracts canonicalize to EIP-55 and echo the canonical
 * form back. The old ALLCAPS idiom WAS load-bearing against legacynet, which stored addresses
 * upper-cased — see utils/eip55.ts. It is wrong against the native contracts.
 */
/**
 * The read itself, with no Nuxt context. Classes constructed at module scope (RelayRewards,
 * OperatorRegistry) cannot call a composable, so the transport lives here and the composable
 * below is a thin convenience wrapper for setup().
 */
export const readContractView = async <T = any>(
  baseUrl: string,
  processId: string,
  view: string,
  params: Record<string, string> = {}
): Promise<T> => {
  const qs = new URLSearchParams(params).toString();
  const url = `${baseUrl}/${processId}~process@1.0/as/${view}${qs ? `?${qs}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `hyperbeam read '${view}' failed: ${response.status} ${response.statusText}`
    );
  }
  return (await response.json()) as T;
};

export const useHyperbeamRead = () => {
  const config = useRuntimeConfig();

  const readView = async <T = any>(
    processId: string,
    view: string,
    params: Record<string, string> = {}
  ): Promise<T> =>
    readContractView<T>(config.public.hyperbeamUrl, processId, view, params);

  /**
   * Read a view's set-valued field as a list of keys.
   *
   * A populated set arrives as a map of key -> true, but an EMPTY one arrives as `[]`, because
   * the Lua encoder cannot tell an empty object from an empty array. This is the convention for
   * every absent-value answer across all three contracts, so both forms must read as "no keys"
   * rather than being special-cased at each call site.
   */
  const setKeys = (value: unknown): string[] =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.keys(value as Record<string, unknown>)
      : [];

  return { readView, setKeys };
};
