<script lang="ts" context="module">
export type FlyAnimationDirection = -1 | 1 | 0;
</script>

<script lang="ts">
import CalendarRow from './CalendarRow.svelte';
import { derived } from 'svelte/store';
import { getContext, afterUpdate, onMount } from 'svelte';
import { cubicIn, cubicOut } from 'svelte/easing';
import { sleep } from '../utility/async.js';
import {
    buildCalendarStructure,
    placeEvent,
    applyFilters,
} from './calendar-structure.js';
import type { CalendarData } from './calendar-structure';
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

export let today: moment.Moment;
export let flyDirection: FlyAnimationDirection;
export let condensed: boolean;
export let showToday: boolean = false;

const SCROLL_DELAY = 350; // Milliseconds
const { filters, events }: NetworkStores = getContext('stores');
const filtersLoaded = filters.loaded;
let eventsLoaded = false;
let currentMonthLoaded = false;

$: {
    eventsLoaded = false;
    events
        .view(moment(today).startOf('month'))
        .then(() => (eventsLoaded = true));
}
$: {
    const previousMonth = moment(today)
        .subtract(1, 'month')
        .format(momentKeyFormat);
    const currentMonth = moment(today).format(momentKeyFormat);
    const nextMonth = moment(today).add(1, 'month').format(momentKeyFormat);

    currentMonthLoaded =
        $events.has(previousMonth) &&
        $events.has(currentMonth) &&
        $events.has(nextMonth);
}

let calendarView: HTMLElement | undefined;
let calendar: CalendarData | undefined;
let calendarReady = false;
let donePlacing = false;
let flyComplete = true;
let scrollDelay = 0;
let calendarDivWidth = 0;
let calendarElement: HTMLElement | undefined;
$: flyOutParameters = {
    x: flyDirection * (calendarDivWidth / 4),
    duration: 100,
    easing: cubicIn,
    opacity: 0,
};

$: flyInParameters = {
    x: -flyDirection * (calendarDivWidth / 4),
    duration: 100,
    easing: cubicOut,
    opacity: 0.5,
};

// Listen for changes to filter from FilterEditor
filters.subscribe(filterEvents);

$: if (today) {
    calendarReady = false;
    calendar = buildCalendarStructure(today);
    donePlacing = false;
}

$: if (
    $filtersLoaded &&
    eventsLoaded &&
    currentMonthLoaded &&
    calendar &&
    !donePlacing
) {
    placeEvents(calendar, today);
    donePlacing = true;
}

$: if (flyComplete) {
    calendarReady = true;
    // Reset scroll position after animating to a new month
    if (calendarView) {
        calendarView.scrollTop = 0;
    }
}

onMount(() => calendarDivWidth = calendarElement!.clientWidth);

afterUpdate(() => {
    if (showToday && $filtersLoaded && eventsLoaded && currentMonthLoaded) {
        if (
            calendarReady &&
            document.getElementsByClassName('today').length === 1
        ) {
            scrollToToday(scrollDelay).then(() => {
                showToday = false;
                scrollDelay = 0;
            });
        } else {
            scrollDelay = SCROLL_DELAY;
        }
    }

    if (calendarReady && localStorage.getItem('firstEverLoad') !== 'false') {
        showInfoTippy(
            document.getElementsByClassName('calendar-event')[0],
            'Click to show info'
        );
        localStorage.setItem('firstEverLoad', 'false');
    }
});

function placeEvents(calendarData: CalendarData, now: moment.Moment) {
    const eventList = [] as EventInfo[];
    const usedEventIds = new Set<number>();
    const currentMonth = moment(now).startOf('month');
    // Get events in months before and after the current one to account for other-month days
    for (let i = currentMonth.month() - 1; i < currentMonth.month() + 2; i++) {
        const eventsListKey = moment(currentMonth)
            .month(i)
            .format(momentKeyFormat);
        for (let event of (
            $events.get(eventsListKey) ?? new Map<string, EventInfo>()
        ).values()) {
            if (!usedEventIds.has(event.id)) {
                eventList.push(event);
                usedEventIds.add(event.id);
            }
        }
    }

    for (let eventInfo of eventList) {
        placeEvent(
            {
                eventInfo: eventInfo,
                start: timeToMoment(eventInfo.start),
                end: eventInfo.has_end
                    ? timeToMoment(eventInfo.end as string)
                    : timeToMoment(eventInfo.start),
                initialPlacement: true,
                filtered: eventInfo.filtered ?? false,
            },
            calendarData,
            $filters
        );
    }
}

function filterEvents(filters: Filter[]) {
    if (calendar === undefined) return;

    for (let [i, row] of calendar.rows.entries()) {
        for (let [j, day] of row.days.entries()) {
            for (let [k, event] of day.events.entries()) {
                event.filtered = applyFilters(event.eventInfo, filters);
                calendar.rows[i].days[j].events[k] = event;
            }
        }
    }
}

async function scrollToToday(delay: number) {
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
    {#if calendarReady}
        <div
            id="calendar"
            bind:this={calendarElement}
            in:fly={flyInParameters}
            out:fly={flyOutParameters}
            on:outrostart={() => (flyComplete = false)}
            on:outroend={() => (flyComplete = true)}>
            <div id="header" class="calendar-row">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
            </div>
            {#each calendar.rows.filter((row) => !row.unused) as row, i (row)}
                <CalendarRow
                    {...row}
                    {today}
                    {condensed}
                    {calendar}
                    calRowNum={i}
                    skeleton={!$filtersLoaded || !eventsLoaded || !currentMonthLoaded} />
            {/each}
        </div>
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
#calendar {
    will-change: transform;
}
:global(.calendar-row) {
    grid-column: 1 / 8;
    border: 1px solid gray;
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
