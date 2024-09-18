import type { Plugin } from 'vite';

interface ViteReplacement {
  from: string | RegExp;
  to: string | Function;
}

export interface VitePluginReplaceConfig {
  replacements: ViteReplacement[];
}

export declare function replaceCodePlugin(
  config: VitePluginReplaceConfig
): Plugin;
