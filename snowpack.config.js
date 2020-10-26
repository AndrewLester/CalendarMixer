const production = !process.env.ROLLUP_WATCH;

module.exports = {
    mount: {
        client: '/'
    },
    buildOptions: {
        sourceMaps: !production,
        out: 'app/bundle/build'
    },
    plugins: ['@snowpack/plugin-svelte', '@snowpack/plugin-typescript']
}
