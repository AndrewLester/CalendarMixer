import App from './App.svelte';

const app = new App({
	target: document.getElementById('calendar-mixer'),
	props: {
		name: 'world'
	}
});

export default app;
