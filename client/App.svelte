<script>
import Calendar from './Calendar.svelte';
import FilterEditor from './FilterEditor.svelte';
import { onMount, setContext, tick } from 'svelte';
import moment from './libraries/moment.min.js';
import { mountNetworking, key } from './utility/network.js';
import { NetworkStore } from './utility/stores.js';

let definedColors;
let csrfToken;
let now = moment();

let today = moment(now).startOf('day');

$: matching = now.month() === today.month() && now.year() === today.year();

let events;
let filters;
let identifiers;
let api;
// The tick call here waits for this component to mount, allowing the api variable to be set before
// Sub-Components can use it from the context. Another option is wrapping the Calendar and FilterEditor
// with an if (api) statement
const getAPI = () => tick().then(() => api);
events = new NetworkStore('/calendar/events');
filters = new NetworkStore('/calendar/filter', undefined, true);
identifiers = new NetworkStore('/calendar/identifiers');

setContext(key, getAPI);
setContext('stores', {
    events,
    filters,
    identifiers
})

let monthButtonWidth;

$: monthButtonTextFormat = monthButtonWidth && monthButtonWidth < 100 ? 'MMM' : 'MMMM';

onMount(() => {
    definedColors = colors;
    csrfToken = csrf_token;

    api = mountNetworking(csrfToken);
    events.setAPI(api);
    filters.setAPI(api);
    identifiers.setAPI(api);
});

function navigateMonths(shift) {
    today.add(shift, 'months');
    today = today;
}

</script>

<main>
    <Calendar {today}>
        <p id="current-month" class:matching>{today.format('MMMM YYYY')}</p>
        <button on:click={() => navigateMonths(-1)} class="large-button" bind:clientWidth={monthButtonWidth}>← {moment(today).subtract(1, 'months').format(monthButtonTextFormat)}</button>
        <button on:click={() => navigateMonths(1)} class="large-button">{moment(today).add(1, 'months').format(monthButtonTextFormat)} →</button>
    </Calendar>
    <FilterEditor/>
</main>

<style>
main {
    display: flex;
    height: 100%;
    width: 100%;
}
#current-month {
    display: inline-block;
    width: 120px;
}
#current-month.matching {
    font-weight: bold;
    color: #29b6f6;
}
:global(*) {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
:global(*:focus) {
    outline: none;
}
:global(p) {
    margin: 0px;
}
:global(.spinner) {
    animation: rotate 2s linear infinite;
    z-index: 2;
    position: relative;
    display: none;
    width: 24px;
    height: 24px;
}
:global(.spinner) > .path {
    stroke: rgba(0, 183, 255, 0.979);
    /*stroke-linecap: round;*/
    animation: dash 1.5s ease-in-out infinite;
}
:global(button.large-button), :global(input[type="submit"]) {
    border-radius: 5px;
    font-size: 15px;
    color: white;
    transition: all 0.2s ease;
    border: 1px solid white;
    background-color: #29b6f6;
    width: 75%;
    height: 40px;
}

:global(button.large-button:hover), :global(input[type="submit"]:hover) {
    cursor: pointer;
    background-color: white;
    color: #29b6f6;
    border: 1px solid #29b6f6;
    box-shadow: 0px 0px 1px 1px rgba(0, 0, 0, 0.2);
}

:global(button.large-button:active), :global(input[type="submit"]:active) {
    box-shadow: inset 1px 1px 1px rgba(0, 0, 0, 0.2);
    border-color: rgba(0, 0, 0, 0.8);
}
@keyframes -global-rotate {
    100% {
      transform: rotate(360deg);
    }
}
@keyframes -global-dash {
    0% {
      stroke-dasharray: 1, 75;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 45, 75;
      stroke-dashoffset: -18;
    }
    100% {
      stroke-dasharray: 45, 75;
      stroke-dashoffset: -62;
    }
}
</style>
