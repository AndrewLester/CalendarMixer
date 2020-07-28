<script lang="ts" context="module">
    export type FlyAnimationDirection = -1 | 1 | 0;
</script>

<script lang="ts">
import CalendarRow from './CalendarRow.svelte';
import { derived } from 'svelte/store';
import { getContext, onMount, tick, afterUpdate } from 'svelte';
import { cubicInOut } from 'svelte/easing';
import { sleep } from '../utility/async.js';
import { buildCalendarStructure, placeEvent, applyFilters, CalendarEventData } from './calendar-structure.js';
import { fade, fly } from 'svelte/transition';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away-subtle.css';
import { Moment } from 'moment';
import { Filter, EventInfo } from '../api/types';
import { timeToMoment } from '../api/schoology';
import { NetworkStores } from '../stores';
import { NetworkStore } from '../utility/networkstore';

export let today: Moment;
export let flyDirection: FlyAnimationDirection;
export let condensed: boolean;
export let showToday = false;

const SCROLL_DELAY = 350;  // Milliseconds
const { filters, events }: NetworkStores = getContext('stores');

let calendarView;
let avg = 0;
let calendar;
let downloaded = false;
let calendarReady = false;
let donePlacing = false;
let readyToShow = false;
let firstLoad = true;
let readyToPlace = false;
let scrollDelay = 0;
$: flyParameters = { x: flyDirection * 300, duration: 200, easing: cubicInOut }

filters.subscribe(($value) => {
    if (downloaded && calendarReady && $value !== undefined) {
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

derived([filters, events], ([$f, $e]) => $f !== undefined && $e !== undefined).subscribe((both) => downloaded = !!both);

$: if (today) {
    calendarReady = false;
    readyToShow = false;
    calendar = buildCalendarStructure(today);
    readyToPlace = true;
}

$: if (downloaded && readyToPlace) {
    placeEvents();
    donePlacing = true;
    readyToPlace = false;
}

// Either it's the first time loading the page, or the fly animation is done
$: if ((readyToShow || firstLoad) && donePlacing) {
    calendarReady = true;
    firstLoad = false;
    donePlacing = false;
    // Reset scroll position after animating to a new month
    calendarView.scrollTop = 0;
}

afterUpdate(async () => {
    if (showToday) {
        if (calendarReady && document.getElementsByClassName('today').length === 1) {
            scrollToToday(scrollDelay).then(() => {
                showToday = false;
                scrollDelay = 0;
            });
        } else {
            scrollDelay = SCROLL_DELAY;
        }
    }

    if (calendarReady && localStorage.getItem('firstEverLoad') !== 'false') {
        tippy(document.getElementsByClassName('calendar-event')[0], {
            content: 'Click to show info',
            arrow: true,
            allowHTML: true,
            placement: 'bottom',
            animation: 'shift-away-subtle',
            delay: [250, 100],
            theme: 'info',
            trigger: 'manual',
            showOnCreate: true
        });
        localStorage.setItem('firstEverLoad', 'false');
    }
});

function placeEvents() {
    const eventInfo = $events;
    const filterData = $filters;
    if (eventInfo === undefined || filterData === undefined) {
        return;
    }

    for (let event of eventInfo) {
        placeEvent({ 
            eventInfo: event, 
            start: timeToMoment(event.start),
            end: timeToMoment(event['']),
            initialPlacement: true,
            filtered: event.filtered ?? false 
        }, calendar, filterData);
    }
}

async function scrollToToday(delay) {
    await sleep(delay);
    document.getElementsByClassName('today')[0].scrollIntoView({ behavior: 'smooth' });
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
                    <CalendarRow {...row} {today} {condensed} {calendar} calRowNum={i} />
                {/each}
            {:else}
                {#each calendar.rows as { unused, ...row }, i (row)}
                    <CalendarRow {...row} {today} calRowNum={i} skeleton={true} />
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style>
#calendar-view {
    /* 41px for the button bar */
    position: relative;
    height: calc(100% - 41px);
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
:global(.tippy-box[data-theme~='info']) {
    background-color: #29b6f6;
    color: white;
}
:global(.tippy-box[data-theme~='info'][data-placement^='top'] > .tippy-arrow::before,
    .tippy-box[data-theme~='info'][data-placement^='bottom'] > .tippy-arrow::before) {
    color: #29b6f6;
}
</style>