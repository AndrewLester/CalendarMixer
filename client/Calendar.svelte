<script>
import CalendarRow from './CalendarRow.svelte';

export let today;

const fetchFilters = Promise.resolve([{"course_ids":[{"id":"7448295","name":"My Events","realm":"user"}],"id":1,"positive":true}]);
const fetchEvents = fetch('/calendar/events').then((res) => res.json());

let filters;
let events;

let row1Events;
let row2Events;
let row3Events;
let row4Events;
let row5Events;
let rowEvents;

$: if (events) {
    let eventsSection = Math.floor(events.length / 5);
    row1Events = events.slice(0, eventsSection);
    row2Events = events.slice(eventsSection, eventsSection * 2);
    row3Events = events.slice(eventsSection * 2, eventsSection * 3);
    row4Events = events.slice(eventsSection * 3, eventsSection * 4);
    row5Events = events.slice(eventsSection * 4, eventsSection * 5);
    rowEvents = [row1Events, row2Events, row3Events, row4Events];
}

(async () => {
    filters = await fetchFilters;
    events = await fetchEvents;
})();


</script>

<div id="calendar-view">
    <div id="button-bar">
        <!-- Slot is for the button bar, which the app controls -->
        <slot></slot>
    </div>
    <div id="calendar">
        <div id="header" class="calendar-row">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
        </div>
        {#if rowEvents}
            {#each rowEvents as rowEventsi}
                <CalendarRow events={rowEventsi}/>
            {/each}
            {#if row5Events}
                <CalendarRow events={row5Events}/>
            {/if}
        {:else}
            {#each Array.from({ length: 5 }) as _, i}
                <CalendarRow skeleton={true}/>
            {/each}
        {/if}
    </div>
</div>


<style>
#calendar-view {
    width: 75%;
}
:global(.calendar-row) {
    grid-column: 1 / 8;
    border: 1px solid gray;
}
</style>