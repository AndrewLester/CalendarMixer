<script>
import CalendarRow from './CalendarRow.svelte';
import { derived } from 'svelte/store';
import { getContext, onMount, tick } from 'svelte';
import { cubicInOut } from 'svelte/easing';
import { key } from './utility/network.js';
import { sleep } from './utility/async.js';
import { buildCalendarStructure, placeEvent, applyFilters, CalendarEventData } from './calendar-structure.js';
import { fade, fly } from 'svelte/transition';

export let today;
export let flyDirection;
export let condensed;

const { filters, events } = getContext('stores');

let calendarView;

let calendar;
let downloaded = false;
let calendarReady = false;
let donePlacing = false;
let readyToShow = false;
let firstLoad = true;
$: flyParameters = { x: flyDirection * 300, duration: 200, easing: cubicInOut }

filters.subscribe(($value) => {
    if (downloaded && calendarReady) {
        for (let [i, row] of calendar.rows.entries()) {
            for (let [j, day] of row.days.entries()) {
                for (let [k, event] of day.events.entries()) {
                    event.filtered = applyFilters(event.eventInfo, $value);
                    calendar.rows[i].days[j].events[k] = event;
                }
            }
        }
    }
})

derived([filters, events], ([$f, $e]) => $f && $e).subscribe((both) => downloaded = both);

$: {
    calendarReady = false;
    readyToShow = false;
    calendar = buildCalendarStructure(today);
}

$: if (downloaded && !calendarReady) {
    // Reset scroll position after animating to a new month
    placeEvents().then(() => {
        donePlacing = true;
    });
}

// Either it's the first time loading the page, or the fly animation is done
$: if ((readyToShow || firstLoad) && donePlacing) {
    calendarReady = true;
    firstLoad = false;
    donePlacing = false;
    calendarView.scrollTop = 0;
}

async function placeEvents() {
    const savedFilters = $filters;

    for (let event of $events) {
        placeEvent(new CalendarEventData(event, true, event.filtered || false), calendar, savedFilters);
    }
}

</script>

<div id="calendar-view" bind:this={calendarView}>
    {#if calendarReady || firstLoad }
        <div id="calendar" out:fly="{flyParameters}" in:fade={{ duration: 50 }} on:outroend={() => readyToShow = true}>
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