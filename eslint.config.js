import tseslint from 'typescript-eslint';

export default [
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name='sprite'][callee.object.property.name='add'][callee.object.object.property.name='physics']",
          message:
            'Do not call this.physics.add.sprite() directly. Create characters via Player/Enemy in src/entities/Character.ts.',
        },
        {
          selector:
            "CallExpression[callee.property.name='collider'][arguments.0.property.name='enemyGroup'][arguments.1.property.name='enemyGroup']",
          message:
            'Do not add an enemyGroup-vs-enemyGroup collider. It produces wall-collision vibration (the bounces cascade into static walls).',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/entities/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'public/'],
  },
];
