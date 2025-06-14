import antfu from '@antfu/eslint-config'

export default [
  ...(await antfu()),
  {
    rules: {
      'vue/no-deprecated-slot-attribute': 'off',
      'curly': 'off',
      'no-console': 'off',
      'antfu/top-level-function': 'off',
      'style/eol-last': 'off',
      // ✅ Enforce correct self-closing behavior in Vue templates
      'vue/html-self-closing': ['error', {
        html: {
          void: 'always', // <img />, <br />, <input />, etc.
          normal: 'never', // <div></div>, <span></span>, etc.
          component: 'always', // <MyComponent />
        },
        svg: 'always',
        math: 'always',
      }],
    },
  },
]
