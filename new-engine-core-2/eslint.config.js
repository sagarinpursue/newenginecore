import pluginJs from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import pluginSecurity from 'eslint-plugin-security';
import globals from 'globals';

export default [
    {
        ignores: ['node_modules/', '.idea/', '*/lambda-dist/', 'dist/'],
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            import: importPlugin,
        },
        rules: {
            // TODO: Need to fix errors for local module before enabling this rule
            // ...importPlugin.configs.recommended.rules,

            // 'import/no-extraneous-dependencies': [
            //     'error',
            //     {
            //         packageDir: ['.', 'lambda-functions/_common-layer/nodejs/'],
            //     },
            // ],

            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                    pathGroups: [
                        {
                            pattern: '@aws-sdk/**',
                            group: 'external',
                            position: 'after',
                        },
                        {
                            pattern: '@middy/**',
                            group: 'external',
                            position: 'after',
                        },
                        {
                            pattern: 'ajv**',
                            group: 'external',
                            position: 'after',
                        },
                        {
                            pattern: '@shared-modules/**',
                            group: 'internal',
                            position: 'after',
                        },
                    ],
                    pathGroupsExcludedImportTypes: ['builtin'],
                },
            ],
        },
    },
    pluginJs.configs.recommended,
    {
        files: ['lambda-functions/**/*.js'],
        ignores: [
            'lambda-functions/**/local-run-events/**',
            'lambda-functions/**/deployment-config.js',
            'lambda-functions/deploy.js',
            'lambda-functions/deploy-all.js',
            'lambda-functions/index.js',
            'lambda-functions/local-run.js',
        ],
        plugins: {
            security: pluginSecurity,
        },
        rules: {
            ...pluginSecurity.configs.recommended.rules,
            'security/detect-non-literal-fs-filename': 'off',
        },
    },
    {
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            ...prettierConfig.rules,
            'prettier/prettier': 'error',
        },
    },
];
