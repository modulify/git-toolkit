import { defineConfig } from 'vite'

import dts from 'vite-plugin-dts'

import {
  join,
  resolve,
} from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  build: {
    lib: {
      name: '@modulify/git-toolkit',
      formats: ['es', 'cjs'],
      entry: {
        'index': resolve(__dirname, './src/index.ts'),
        'git': resolve(__dirname, './src/git.ts'),
        'shell': resolve(__dirname, './src/shell.ts'),
        'stream': resolve(__dirname, './src/stream.ts'),
      },
      fileName: (format, name) => `${name}.${{
        es: 'mjs',
        cjs: 'cjs',
      }[format as 'es' | 'cjs']}`,
    },
    minify: false,
    rollupOptions: {
      external: [
        /node:[a-zA-Z]*/,
      ],
      output: {
        exports: 'named',
        dir: join(__dirname, '/dist'),
      },
    },
  },

  plugins: [
    dts({
      exclude: [
        'scripts/**/*.*',
        'tests/**/*.*',
      ],
      insertTypesEntry: true,
      staticImport: true,
    }),
  ],
})