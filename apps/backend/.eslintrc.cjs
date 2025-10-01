module.exports = {
  root: true,
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  },
  env: {
    node: true,
    es2022: true
  },
  extends: [
    'standard-with-typescript'
  ],
  rules: {
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/no-floating-promises': 'off'
  }
};
