<script>
import Calendar from './Calendar.svelte';
import FilterEditor from './FilterEditor.svelte';
import { onMount } from 'svelte';
import moment from '../app/static/js/moment.min.js';

let definedColors;
let csrfToken;
let now = moment();

let today = now.startOf('day');

onMount(() => {
	definedColors = colors;
	csrfToken = csrf_token;
});
</script>

<main>
    <Calendar {today}>
		<p>{today.format('MMMM YYYY')}
		<button class="large-button">← {moment(today).subtract(1, 'months').format('MMMM')}</button>
		<button class="large-button">{moment(today).add(1, 'months').format('MMMM')} →</button>
	</Calendar>
	<FilterEditor/>
</main>

<style>
main {
	display: flex;
	height: 100%;
	width: 100%;
}
</style>
