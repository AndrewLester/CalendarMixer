<script lang="ts">
import CalendarRow from './CalendarRow.svelte';
import { getContext, afterUpdate, onMount, tick, createEventDispatcher } from 'svelte';
import { cubicIn, cubicOut } from 'svelte/easing';
import { sleep } from '../utility/async.js';
import {
    buildCalendarStructure,
    placeEvent,
    applyFilters
} from './calendar-structure.js';
import type { CalendarData } from './calendar-structure';
import { fly } from 'svelte/transition';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away-subtle.css';
import * as networking from '../api/network';
import { timeToMoment } from '../api/schoology';
import type { NetworkStores } from '../stores';
import { momentKeyFormat } from '../stores';
import moment from 'moment';
import type { Networking } from '../api/network';
import type { EventInfo } from '../api/types';

export let condensed: boolean;

const getAPI: () => Promise<Networking> = getContext(networking.key);
const { filters, events }: NetworkStores = getContext('stores');

let month: moment.Moment = moment().startOf('month');

const dispatch = createEventDispatcher();

type FlyAnimationDirection = -1 | 0 | 1;
let flyDirection: FlyAnimationDirection = 0;
let calendarView: HTMLElement;
let calendarDivWidth = 0;
let calendarElement: HTMLElement | undefined;
$: flyOutParameters = {
    x: flyDirection * (calendarDivWidth / 4),
    duration: 150,
    easing: cubicIn,
    opacity: 0,
};

$: flyInParameters = {
    ...flyOutParameters,
    x: -flyOutParameters.x,
    easing: cubicOut,
    delay: 150
};

$: getAPI().then(() => events.view(month));
$: calendar = buildCalendarStructure(month);
$: rows = calendar.rows;

$: dataDownloaded = $events.has(month.format(momentKeyFormat))
                    && $events.has(moment(month).add(1, 'months').format(momentKeyFormat))
                    && $events.has(moment(month).subtract(1, 'months').format(momentKeyFormat));

const getCalendarView = () => calendarView;
$: (async () => {
    if (dataDownloaded) {
        // By sleeping before placing the events, this function runs in a separate microtask and therefore
        // The transition does not rely on its finishing before executings
        await sleep(1);
        // TODO: Find out why putting calendarView here invalidates "month"
        getCalendarView().scrollTop = 0;
        placeEvents(calendar);
    }
})();

onMount(() => (calendarDivWidth = calendarElement!.clientWidth));

afterUpdate(() => {
    if (
        dataDownloaded &&
        localStorage.getItem('firstEverLoad') !== 'false'
    ) {
        const elem = document.getElementsByClassName('calendar-event')[0];
        if (elem) {
            showInfoTippy(elem, 'Click to show info');
            localStorage.setItem('firstEverLoad', 'false');
        }
    }
});

// Listen for changes to filter store or rows and update the filtered events
$: if (rows) {
    for (let [i, row] of rows.entries()) {
        for (let [j, day] of row.days.entries()) {
            for (let [k, event] of day.events.entries()) {
                event.filtered = applyFilters(event.eventInfo, $filters);
                rows[i].days[j].events[k] = event;
            }
        }
    }
}

function placeEvents(cal: CalendarData) {
    if (cal.filled) return;

    const eventList = [] as EventInfo[];
    const usedEventIds = new Set<number>();
    const currentMonth = month;
    // Get events in months before and after the current one to account for other-month days
    for (let i = currentMonth.month() - 1; i < currentMonth.month() + 2; i++) {
        const eventsListKey = moment(currentMonth).month(i).format(momentKeyFormat);
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
            cal,
            $filters
        );
    }

    cal.filled = true;
    rows = cal.rows;
}

export async function navigateMonths(shift: number | moment.Moment) {
    if (shift === 0) return;

    if (typeof shift === 'object') {
        flyDirection = -Math.sign(shift.diff(month, 'days')) as FlyAnimationDirection;
        month = shift.startOf('month');
    } else {
        flyDirection = -Math.sign(shift) as FlyAnimationDirection;
        month.add(shift, 'months');
        month = month.startOf('month');
    }

    dispatch('monthChange', month);

    await tick();
}

export async function goToToday() {
    // If the calendar is not currently viewing the current month
    if (moment().format(momentKeyFormat) !== month.format(momentKeyFormat)) {
        await navigateMonths(moment().startOf('month'));
        await sleep(flyInParameters.duration + flyInParameters.delay + 100);
    }
    
    scrollToToday();
}

function scrollToToday() {
    if (document.getElementsByClassName('today').length !== 1) return;

    document
        .getElementsByClassName('today')[0]
        .scrollIntoView({ behavior: 'smooth' });
}

function showInfoTippy(element: Element, message: string) {
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
</script>

<div id="calendar-view" bind:this={calendarView}>
{#if calendar}
    {#key calendar}
        <div
            class="calendar"
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
                {#each rows.filter((row) => !row.unused) as row, i (row)}
                    <CalendarRow
                        {...row}
                        {month}
                        {condensed}
                        {rows}
                        calRowNum={i}
                        skeleton={!dataDownloaded}/>
                {/each}
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
/* Hide second calendar while transitioning */
.calendar:nth-child(2) {
    box-sizing: border-box;
    height: 0px !important;
    width: 0px !important;
    overflow: hidden;
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
.calendar {
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
