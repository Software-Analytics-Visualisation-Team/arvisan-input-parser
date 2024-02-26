module.exports = {
    'env': {
        'es2021': true,
        'node': true
    },
    'extends': [
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/recommended'
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 'latest',
        'sourceType': 'module',
        'project': './tsconfig.json',
    },
    'plugins': [
        '@typescript-eslint'
    ],
    'rules': {
        'no-console': 'off',
    }
};
