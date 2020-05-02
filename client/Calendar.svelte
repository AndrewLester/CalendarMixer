<script>
import CalendarRow from './CalendarRow.svelte';
import { getContext, onMount } from 'svelte';
import { key } from './utility/network.js';
import { sleep } from './utility/async.js';
import { buildCalendarStructure, placeEvent, CalendarEventData } from './calendar-structure.js';

export let today;

const { filters, events } = getContext('stores');

let calendarReady = false;

let calendar = buildCalendarStructure(today);

events.subscribe(value => {
    if (!value) {
        return;
    }

    for (let event of value) {
        placeEvent(new CalendarEventData(event, true, false), calendar);
    }
    calendarReady = true;
})

</script>

<div id="calendar-view">
    <div id="button-bar">
        <!-- Slot is for the button bar, which the app controls -->
        <slot></slot>
    </div>
    <div id="calendar">
        <div id="header" class="calendar-row">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
            <div>Thu</div> <div>Fri</div><div>Sat</div>
        </div>
        {#if calendarReady}
            {#each calendar.rows.filter(row => !row.unused) as row (row)}
                <CalendarRow {...row} />
            {/each}
        {:else}
            {#each Array.from({ length: 5 }) as _, i}
                <CalendarRow skeleton={true} />
            {/each}
        {/if}
    </div>
</div>

<style>
#calendar-view {
    width: 75%;
}
#button-bar {
    width: 100%;
}
#button-bar :global(button) {
    width: 15%;
    min-width: 75px;
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