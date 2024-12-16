/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    //复制自atong
    // "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/no-unused-component': 'off',
    'no-console': 'off',
    'no-irregular-whitespace': 'off',
    'prefer-spread': 0,
    'no-plusplus': 0,
    'max-len': 0,
    'no-underscore-dangle': 0,
    'eslint-disable-next-line': 'off',
  },
  env: {
    "node": true,
    "vue/setup-compiler-macros": true
  }
}
