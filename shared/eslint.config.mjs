// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'eslint.config.mjs', '__tests__/**/*.js', '__tests__/**/*.d.ts', '**/*.d.ts', '**/*.js']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: new URL('.', import.meta.url).pathname
      },
      globals: {
        ...globals.node,
        ...globals.jest
      }
    }
  }
);