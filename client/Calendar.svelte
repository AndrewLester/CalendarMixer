<script>
import CalendarRow from './CalendarRow.svelte';
import { derived } from 'svelte/store';
import { getContext, onMount, tick } from 'svelte';
import { key } from './utility/network.js';
import { sleep } from './utility/async.js';
import { buildCalendarStructure, placeEvent, applyFilters, CalendarEventData } from './calendar-structure.js';
import { fade, fly } from 'svelte/transition';

export let today;
export let flyDirection;
export let condensed;

const { filters, events } = getContext('stores');

let calendarView;

let downloaded = false;
let calendarReady = false;
let readyToPlace = true;
let firstLoad = true;
$: flyParameters = { x: flyDirection * 300, duration: 250 }

filters.subscribe(($value) => {
    if (downloaded && calendarReady) {
        for (let row of calendar.rows) {
            for (let day of row.days) {
                for (let event of day.events) {
                    if (applyFilters(event, $value)) {
                        event.filtered = true;
                    }
                }
            }
        }
        calendar = calendar;
    }
})

derived([filters, events], ([$filters, $events]) => {
    if ($filters && $events) {
        return true;
    }
    return false;
}).subscribe((value) => downloaded = value);

$: {
    // Whenever today changes, set calendar ready to false
    today;
    calendarReady = false;
}
$: calendar = buildCalendarStructure(today);

$: if (downloaded && readyToPlace) {
    // Reset scroll position after animating to a new month
    calendarView.scrollTop = 0;
    placeEvents().then(() => {
        calendarReady = true;
        firstLoad = false;
        readyToPlace = false;
    });
}

async function placeEvents() {
    for (let event of $events) {
        let filtered = false;

        if (applyFilters(event, $filters)) {
            filtered = true;
        }

        placeEvent(new CalendarEventData(event, true, filtered), calendar);
    }
}

</script>

<div id="calendar-view" bind:this={calendarView}>
    {#if calendarReady || firstLoad }
        <div id="calendar" out:fly="{flyParameters}" in:fade={{ duration: 50 }}
          on:outroend={() => readyToPlace = true}>
            <div id="header" class="calendar-row">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
                <div>Thu</div> <div>Fri</div><div>Sat</div>
            </div>
            {#if downloaded }
                {#each calendar.rows.filter(row => !row.unused) as row, i (row)}
                    <CalendarRow {...row} {today} calRowNum={i} />
                {/each}
            {:else}
                {#each calendar.rows as row, i (row)}
                    <CalendarRow {...row} {today} calRowNum={i} skeleton={true} />
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style>
#calendar-view {
    /* 40px for the button bar */
    position: relative;
    height: calc(100% - 40px);
    overflow-y: scroll;
    overflow-x: hidden;
}
#header {
    display: grid;
    font-weight: bold;
    position: sticky;
    top: 0;
    /* This index puts it above the day header */
    z-index: 6;
    background-color: white;
    text-align: center;
    grid-auto-flow: column;
    grid-template-columns: repeat(7, 1fr);
}
:global(.calendar-row) {
    grid-column: 1 / 8;
    border: 1px solid gray;
}
</style>