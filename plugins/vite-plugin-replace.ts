import type { Plugin } from 'vite';

interface ViteReplacement {
  from: string | RegExp;
  to: string | ((match: string) => string);
}

export interface VitePluginReplaceConfig {
  replacements: ViteReplacement[];
}

function execSrcReplacements(
  src: string,
  replacements: ViteReplacement[]
): string {
  replacements.forEach((replacement) => {
    if (
      typeof replacement.from !== 'string' &&
      !(replacement.from instanceof RegExp)
    ) {
      throw new Error(
        "[vite-plugin-replace]: The replacement option 'from' is not of type 'string' or 'RegExp'."
      );
    } else if (
      typeof replacement.to !== 'string' &&
      typeof replacement.to !== 'function'
    ) {
      throw new Error(
        "[vite-plugin-replace]: The replacement option 'to' is not of type 'string' or 'Function'"
      );
    }
    src = src.replace(
      replacement.from,
      replacement.to as string | ((match: string) => string)
    );
  });
  return src;
}

export function replaceCodePlugin(config?: VitePluginReplaceConfig): Plugin {
  if (config === undefined) {
    config = {
      replacements: [],
    };
  } else if (typeof config !== 'object' || config === null) {
    throw new Error(
      "[vite-plugin-replace]: The configuration is not of type 'Object'."
    );
  } else if (!Array.isArray(config.replacements)) {
    throw new Error(
      "[vite-plugin-replace]: The configuration option 'replacement' is not of type 'Array'."
    );
  }

  return {
    name: 'transform-file',
    apply: 'build',
    enforce: 'pre',
    transform(src: string, id: string) {
      // Apply to JS/TS files
      if (/\.(js|ts|mjs|cjs)(\?.*)?$/.test(id)) {
        return {
          code: execSrcReplacements(src, config!.replacements),
          map: null,
        };
      }
    },
  };
}
