const production = process.env.FLASK_ENV !== 'development';

module.exports = {
    mount: {
        client: '/'
    },
    buildOptions: {
        sourceMaps: !production,
        out: 'app/bundle/build'
    },
    plugins: ['@snowpack/plugin-svelte', '@snowpack/plugin-typescript', '@snowpack/plugin-dotenv']
}
