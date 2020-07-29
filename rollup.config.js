import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import autoPreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
// import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-css-only';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'client/main.ts',
	output: {
		sourcemap: !production,
		format: 'iife',
		name: 'app',
		file: 'app/bundle/js/calendar_bundle.js'
	},
	plugins: [
		replace({ 
			// If you would like DEV messages, specify 'development'
			// Otherwise use 'production'
			'process.env.NODE_ENV': JSON.stringify('production') ? production : JSON.stringify('development')
		}),

		css({ output: 'app/bundle/css/external.css' }),

		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file - better for performance
			css: css => {
				css.write('app/bundle/css/calendar_bundle.css');
			},
			preprocess: autoPreprocess()
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte', 'svelte/transition', 'svelte/internal']
		}),
		commonjs(),

		typescript({ sourceMap: !production }),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};

function serve() {
	let started = false;

	return {
		writeBundle() {
			if (!started) {
				started = true;
			}
		}
	};
}
