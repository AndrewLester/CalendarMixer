<script>
        import Calendar from './Calendar.svelte';
</script>

<main>
        <Calendar/>
</main>

<style>
	main {
                width: 100%;
                height: 100%;
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
