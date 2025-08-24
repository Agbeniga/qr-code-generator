module.exports = {
    extends: [
      'next/core-web-vitals',
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'react', 'react-hooks'],
    rules: {
      // Disable unused variables/imports warnings
      '@typescript-eslint/no-unused-vars': 'off',
      
      // Allow 'any' type
      '@typescript-eslint/no-explicit-any': 'off',
      
      // Disable prefer-const warnings
      'prefer-const': 'off',
      
      // Disable React Hooks exhaustive deps warnings
      'react-hooks/exhaustive-deps': 'off',
      
      // Allow regular img tags instead of Next.js Image
      '@next/next/no-img-element': 'off',
      
      // Disable missing key warnings in JSX
      'react/jsx-key': 'off',
      
      // Allow unescaped entities in JSX like apostrophes
      'react/no-unescaped-entities': 'off',
      
      // Allow empty interface declarations
      '@typescript-eslint/no-empty-object-type': 'off',
      
      // Allow @ts-ignore comments
      '@typescript-eslint/ban-ts-comment': 'off',
      
      // Allow unsafe function types
      '@typescript-eslint/no-unsafe-function-type': 'off',
      
      // Allow passing children as props
      'react/no-children-prop': 'off'
    }
  };