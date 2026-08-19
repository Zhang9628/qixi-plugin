/**
 * dsh-qixi 构建配置：host 半（ESM lib/index.js，空操作）+
 * client 半（CJS lib/client.js，ModuleLoader 工厂）。
 * 复用官方外部插件约定：浏览器半 = 经典脚本 + window.__ModuleLoader__.load 工厂；
 * 平台模块（react 等）走 externals；其余依赖打入 bundle。
 */

import type { UserConfig } from 'tsdown'

const ID = 'dsh-qixi'

/** 浏览器 externals：shell 共享的冻结模块表（本插件仅依赖 react）。 */
const CLIENT_EXTERNALS: readonly string[] = ['react', 'react/jsx-runtime']

/** host 半：ESM 库构建（纯浏览器插件，host 侧为空操作）。 */
const libConfig: UserConfig = {
  name: ID,
  entry: { index: 'src/index.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  deps: {
    neverBundle: [/^@deepseek-ai\//],
  },
}

/** 浏览器半：CJS 工厂包 + 平台 externals。 */
const clientConfig: UserConfig = {
  name: ID + '/client',
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: [...CLIENT_EXTERNALS],
    alwaysBundle: (id: string) => (CLIENT_EXTERNALS.includes(id) ? false : true),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: 'window.__ModuleLoader__.load({ id: ' + JSON.stringify(ID) + ', factory: (require) => {',
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default [libConfig, clientConfig]
