/** @type {import('stylelint').Config} */
const stylelintConfig = {
  extends: ['stylelint-config-standard', 'stylelint-config-css-modules'],
  plugins: ['stylelint-use-logical'],
  ignoreFiles: [
    'design/**',
    'node_modules/**',
    '.next/**',
    '.next-e2e/**',
    'out/**',
    'build/**',
    'coverage/**',
  ],
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
      files: ['src/styles/tokens.css', 'src/styles/tokens-site.css'],
      // The tokens file is copied byte for byte from the design system, so only its notation rules are relaxed.
      rules: {
        'color-no-hex': null,
        'alpha-value-notation': null,
        'color-function-alias-notation': null,
        'color-function-notation': null,
        'color-hex-length': null,
        'declaration-block-single-line-max-declarations': null,
        'value-keyword-case': null,
      },
    },
  ],
};

export default stylelintConfig;
