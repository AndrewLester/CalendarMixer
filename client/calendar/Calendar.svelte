<script lang="ts" context="module">
export type FlyAnimationDirection = -1 | 1 | 0;
</script>

<script lang="ts">
import CalendarRow from './CalendarRow.svelte';
import { getContext, afterUpdate, onMount, tick } from 'svelte';
import { cubicIn, cubicOut } from 'svelte/easing';
import { sleep } from '../utility/async.js';
import {
    buildCalendarStructure,
    placeEvent,
    applyFilters
} from './calendar-structure.js';
import type { CalendarData, CalendarRowData } from './calendar-structure';
import { fade, fly } from 'svelte/transition';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away-subtle.css';
import * as networking from '../api/network';
import { timeToMoment, momentToTime } from '../api/schoology';
import type { NetworkStores } from '../stores';
import { momentKeyFormat } from '../stores';
import moment from 'moment';
import type { Networking } from '../api/network';
import type { Filter, EventInfo } from '../api/types';

export let month: moment.Moment;
// export let condensed: boolean;

// const getTodayMonthKey = (offset?: number) => moment(month).add(offset ?? 0).format(momentKeyFormat);
const getAPI: () => Promise<Networking> = getContext(networking.key);
const { filters, events }: NetworkStores = getContext('stores');
const filtersLoaded = filters.loaded;
let dataDownloaded = false;

let flyDirection: FlyAnimationDirection = 0;
let calendarView: HTMLElement | undefined;
let rows: CalendarRowData[] | undefined;
let calendarDivWidth = 0;
let calendarElement: HTMLElement | undefined;
$: flyOutParameters = {
    x: flyDirection * (calendarDivWidth / 2),
    duration: 150,
    easing: cubicIn,
    opacity: 0,
};

$: flyInParameters = {...flyOutParameters, x: -flyOutParameters.x, easing: cubicOut};
// $: matching = moment().month() === month.month() && moment().year() === month.year();

// Listen for changes to filter from FilterEditor
// filters.subscribe(filterEvents);

let calendar;
// $: calendar = buildCalendarStructure(moment(month));
// $: rows = calendar?.rows;

$: getAPI().then(() => {
    // dataDownloaded = false;
    // return events.view(month);
}).then(() => dataDownloaded = true);

let eventsCreated = false;
$: {
    // eventsCreated = false;
    // const prevMonth = getTodayMonthKey(-1);
    // const currentMonth = getTodayMonthKey();
    // const nextMonth = getTodayMonthKey(1);

    // eventsCreated = $events.has(prevMonth) && $events.has(currentMonth) && $events.has(nextMonth);
}

$: loaded = (eventsCreated || dataDownloaded) && $filtersLoaded;
$: if (loaded) placeEvents();


// onMount(() => (calendarDivWidth = calendarElement!.clientWidth));

afterUpdate(() => {
    if (
        loaded &&
        localStorage.getItem('firstEverLoad') !== 'false'
    ) {
        showInfoTippy(
            document.getElementsByClassName('calendar-event')[0],
            'Click to show info'
        );
        localStorage.setItem('firstEverLoad', 'false');
    }
});

async function placeEvents() {
    // const eventList = [] as EventInfo[];
    // const usedEventIds = new Set<number>();
    // const currentMonth = month;
    // // Get events in months before and after the current one to account for other-month days
    // for (let i = currentMonth.month() - 1; i < currentMonth.month() + 2; i++) {
    //     const eventsListKey = moment(currentMonth).month(i).format(momentKeyFormat);
    //     for (let event of (
    //         $events.get(eventsListKey) ?? new Map<string, EventInfo>()
    //     ).values()) {
    //         if (!usedEventIds.has(event.id)) {
    //             eventList.push(event);
    //             usedEventIds.add(event.id);
    //         }
    //     }
    // }

    // for (let eventInfo of eventList) {
    //     placeEvent(
    //         {
    //             eventInfo: eventInfo,
    //             start: timeToMoment(eventInfo.start),
    //             end: eventInfo.has_end
    //                 ? timeToMoment(eventInfo.end as string)
    //                 : timeToMoment(eventInfo.start),
    //             initialPlacement: true,
    //             filtered: eventInfo.filtered ?? false,
    //         },
    //         calendar,
    //         $filters
    //     );
    // }
}

function filterEvents(filters: Filter[]) {
    // if (rows === undefined) return;

    // for (let [i, row] of rows.entries()) {
    //     for (let [j, day] of row.days.entries()) {
    //         for (let [k, event] of day.events.entries()) {
    //             event.filtered = applyFilters(event.eventInfo, filters);
    //             rows[i].days[j].events[k] = event;
    //         }
    //     }
    // }
}

export function navigateMonths(shift: number) {
    // if (shift === 0) return;

    // flyDirection = -Math.sign(shift) as FlyAnimationDirection;
    // month.add(shift, 'months');
    // console.log('Navigating')
    // month = month;
}

export async function goToToday() {
    let scrollDelay = 0;

    // if (!matching) {
    //     scrollDelay = 350;
    //     navigateMonths(moment().month() - month.month());
    //     await tick();
    // }
    
    await scrollToToday(scrollDelay);
}

async function scrollToToday(delay: number) {
    if (document.getElementsByClassName('today').length !== 1) return;

    await sleep(delay);
    document
        .getElementsByClassName('today')[0]
        .scrollIntoView({ behavior: 'smooth' });
}

function showInfoTippy(element: Element | undefined, message: string) {
    if (element !== undefined) {
        tippy(element, {
            content: message,
            arrow: true,
            allowHTML: true,
            placement: 'bottom',
            animation: 'shift-away-subtle',
            delay: [250, 100],
            theme: 'info',
            trigger: 'manual',
            showOnCreate: true,
        });
    }
}
</script>

<div id="calendar-view" bind:this={calendarView}>
{#if calendar}
    {#key calendar}
        <div
            id="calendar"
            bind:this={calendarElement}
            in:fly={flyInParameters}
            out:fly={flyOutParameters}>
            <div id="header" class="calendar-row">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
            </div>
            {#if rows}
                <!-- {#each rows.filter((row) => !row.unused) as row, i (row)}
                    <CalendarRow
                        {...row}
                        {month}
                        {condensed}
                        {rows}
                        calRowNum={i}
                        skeleton={!dataDownloaded} />
                {/each} -->
            {/if}
        </div>
    {/key}
{/if}
</div>

<style>
#calendar-view {
    /* 41px for the button bar */
    position: relative;
    height: calc(100% - 41px);
    will-change: scroll-position, transform;
    /* Create new stacking context */
    z-index: 1;
    overflow-y: auto;
    overflow-x: hidden;
    border: 1px solid gray;
    box-sizing: border-box;
    border-radius: 5px;
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
    height: 20px;
    border-bottom: 1px solid gray;
    grid-auto-flow: column;
    grid-template-columns: repeat(7, 1fr);
}
#header > div {
    line-height: 20px;
}
#calendar {
    will-change: transform;
}
.calendar-row {
    grid-column: 1 / 8;
}
:global(.tippy-box[data-theme~='info']) {
    background-color: #29b6f6;
    color: white;
}
:global(.tippy-box[data-theme~='info'][data-placement^='top']
        > .tippy-arrow::before, .tippy-box[data-theme~='info'][data-placement^='bottom']
        > .tippy-arrow::before) {
    color: #29b6f6;
}
</style>
