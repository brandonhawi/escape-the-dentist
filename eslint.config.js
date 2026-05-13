import tseslint from 'typescript-eslint';

export default [
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Game characters MUST be created via the Player/Enemy subclasses in
      // src/entities/Character.ts, which encode the correct physics body
      // shape. Creating a `Phaser.Physics.Arcade.Sprite` directly bypasses
      // that invariant and historically caused wall vibration. The
      // Character subclasses are the only authorized callers.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name='sprite'][callee.object.property.name='add'][callee.object.object.property.name='physics']",
          message:
            'Do not call this.physics.add.sprite() directly. Create characters via Player/Enemy in src/entities/Character.ts.',
        },
      ],
      // Loosen a few defaults that bite us on Phaser-style code:
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Allow the base call inside the entities module itself — that's
    // exactly where we expect it.
    files: ['src/entities/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'public/'],
  },
];
