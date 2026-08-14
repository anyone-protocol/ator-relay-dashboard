/**
 * No-op stand-in for `@vue/devtools-api`.
 *
 * The dashboard does not use Vue/Nuxt devtools (`devtools: { enabled: false }` in nuxt.config),
 * but pinia and vue-router import `setupDevtoolsPlugin` unconditionally to register their
 * devtools integrations. That single import was enough to break `pnpm dev` outright: Vite served
 * devtools-api v6's raw CommonJS to the browser as an ES module, so
 * `import { setupDevtoolsPlugin }` threw "does not provide an export named".
 *
 * Aliasing the package here removes the dependency from the client entirely rather than pinning a
 * version that happens to ship ESM — nothing we run needs it, so there is no reason to carry it.
 *
 * Both call sites treat registration as fire-and-forget, so doing nothing is safe: they call it
 * for its side effect and ignore the return.
 */
export const setupDevtoolsPlugin = (): void => {};

export default { setupDevtoolsPlugin };
