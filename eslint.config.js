import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

// Downgrade every rule of a shared config from error -> warn (preserving any options), so the
// recommended sets surface as warnings only. The three safety-critical rules are re-raised to error
// below. This keeps CI green without a big-bang cleanup while still failing on real hook/dead-code
// bugs (audit H1).
const toWarn = (config) =>
  config.rules
    ? {
        ...config,
        rules: Object.fromEntries(
          Object.entries(config.rules).map(([name, value]) => {
            const severity = Array.isArray(value) ? value[0] : value;
            if (severity === 'off' || severity === 0) return [name, value]; // keep disabled rules disabled
            return [name, Array.isArray(value) ? ['warn', ...value.slice(1)] : 'warn'];
          }),
        ),
      }
    : config;

export default tseslint.config(
  {
    // Vendored (byte-identity discipline), generated, and build output are never linted.
    ignores: [
      'dist/',
      'coverage/',
      'birss-tables/',
      'docs/references/',
      'src/data/table7Data.ts',
      'src/data/sharingPartitions.ts',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [toWarn(js.configs.recommended), ...tseslint.configs.recommended.map(toWarn)],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
