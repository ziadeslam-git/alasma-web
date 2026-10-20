import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import checkFile from 'eslint-plugin-check-file';

// Dependency rule (Architecture page, section 2): app -> modules -> shared.
// shared imports nothing from modules or app; a module imports shared only, or another module through its
// public API (that module's index.ts); app may import anything.
const moduleNames = [
  'auth',
  'catalog',
  'search',
  'cart',
  'checkout',
  'orders',
  'account',
  'engagement',
  'publishing',
  'content',
  'admin',
];

const moduleZones = moduleNames.map((name) => ({
  target: `./src/modules/${name}`,
  from: './src/modules',
  except: [
    `./${name}`,
    ...moduleNames.filter((other) => other !== name).map((other) => `./${other}/index.ts`),
  ],
  message: `modules/${name} may use another module only through its index.ts (public API), or move the shared piece to shared/.`,
}));

const dependencyZones = [
  {
    target: './src/shared',
    from: ['./src/modules', './src/app'],
    message: 'shared must not depend on modules or app (app -> modules -> shared).',
  },
  {
    target: './src/modules',
    from: './src/app',
    message: 'modules must not depend on app (app -> modules -> shared).',
  },
  ...moduleZones,
];

const arabicText = '[\\u0600-\\u06FF]';
const hexColour = '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$';

const sourceRules = [
  {
    selector: `Literal[value=/${arabicText}/]`,
    message: 'No Arabic text in code: put it in src/i18n/messages and read it from there.',
  },
  {
    selector: `JSXText[value=/${arabicText}/]`,
    message: 'No Arabic text in components: put it in src/i18n/messages and read it from there.',
  },
  {
    selector: `TemplateElement[value.raw=/${arabicText}/]`,
    message: 'No Arabic text in code: put it in src/i18n/messages and read it from there.',
  },
  {
    selector: `Literal[value=/${hexColour}/]`,
    message: 'No hex colours in code: use the design tokens (var(--...)).',
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['design/**', '.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts']),
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'check-file': checkFile },
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      'import/no-restricted-paths': ['error', { zones: dependencyZones }],
      'check-file/filename-naming-convention': [
        'error',
        { 'src/**/*.{ts,tsx}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'has', 'should', 'can', 'will', 'did'],
        },
        { selector: 'typeLike', format: ['PascalCase'] },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Tokens and session data never go in web storage.' },
        { name: 'sessionStorage', message: 'Tokens and session data never go in web storage.' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'localStorage',
          message: 'Never use web storage for tokens.',
        },
        {
          object: 'window',
          property: 'sessionStorage',
          message: 'Never use web storage for tokens.',
        },
      ],
      'react/no-danger': 'error',
      'no-restricted-syntax': ['error', ...sourceRules],
    },
  },
  {
    // Arabic text lives in the message files and may appear in tests.
    files: ['src/i18n/**', 'src/**/*.test.{ts,tsx}', 'src/mocks/**'],
    rules: {
      'no-restricted-syntax': ['error', sourceRules[3]],
    },
  },
]);

export default eslintConfig;
