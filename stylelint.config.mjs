/** @type {import('stylelint').Config} */
const stylelintConfig = {
  extends: ['stylelint-config-standard', 'stylelint-config-css-modules'],
  plugins: ['stylelint-use-logical'],
  ignoreFiles: ['design/**', 'node_modules/**', '.next/**', 'out/**', 'build/**', 'coverage/**'],
  rules: {
    // Colours come from the design tokens only (var(--...)); a hex value is allowed only in the tokens file below.
    'color-no-hex': true,
    // RTL first: logical properties (margin-inline-start) instead of left/right.
    'csstools/use-logical': 'always',
    // CSS Modules class names are camelCase.
    'selector-class-pattern': null,
  },
  overrides: [
    {
      files: ['src/styles/tokens.css'],
      rules: {
        'color-no-hex': null,
      },
    },
  ],
};

export default stylelintConfig;
