// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/api',
              message:
                'Legacy src/api/ removed. Use @/modules/{domain}/ instead.',
            },
            {
              name: '@/_repositories',
              message:
                'Legacy src/_repositories/ removed. Use module repositories or exported query/command services.',
            },
            {
              name: '@/common',
              message: 'Renamed to @/libs/. Use @/libs/ for shared infrastructure.',
            },
          ],
          patterns: [
            {
              group: ['@/api/*', '@/api/**'],
              message:
                'Legacy src/api/ removed. Use @/modules/{domain}/ instead.',
            },
            {
              group: ['@/_repositories/*', '@/_repositories/**'],
              message:
                'Legacy src/_repositories/ removed. Use module repositories or exported query/command services.',
            },
            {
              group: ['@/common/*', '@/common/**'],
              message: 'Renamed to @/libs/. Use @/libs/ for shared infrastructure.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: [
      'src/_db/**',
      '**/repositories/**',
    ],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: '@/_db/drizzle/schema',
              message:
                'Schema is module-owned. Import only from repositories in the owning module. See docs/architecture.md.',
            },
          ],
          patterns: [
            {
              group: ['@/_db/drizzle/schema/*'],
              message:
                'Schema is module-owned. Import only from repositories in the owning module. See docs/architecture.md.',
            },
          ],
        },
      ],
    },
  },
);