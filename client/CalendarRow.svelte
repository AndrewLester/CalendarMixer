<script>
import CalendarEvent from './CalendarEvent.svelte';
import SkeletonLayout from './utility/SkeletonLayout.svelte';

export let dayNums = [];
export let days = [];
export let skeleton = false;
</script>

<div class="calendar-row">
    <div class="header">
        {#if skeleton}
            {#each Array.from({ length: 7}) as _, i}
                <div></div>
            {/each}
        {:else}
            {#each dayNums as num, i}
                <div class:other-month={days[i].otherMonth}>{num}</div>
            {/each}
        {/if}
    </div>
    <div class="event-row" class:skeleton>
        {#if skeleton}
            <div class="skeleton-bar" style="grid-column: 2 / 6"></div>
            <div class="skeleton-bar" style="grid-column: 1 / 3"></div> 
            <div class="skeleton-bar" style="grid-column: 5 / 7"></div> 
            <div class="skeleton-bar" style="grid-column: 2 / 5"></div> 
            <div class="skeleton-bar" style="grid-column: 7 / 8"></div> 
        {:else}
            {#each days as day (day)}
                {#each day.events as event, i}
                    <CalendarEvent {...event} eventNum={i} />
                {/each}
            {/each}
        {/if}
    </div>
</div>

<style>
.calendar-row > * {
    display: grid;
    text-align: center;
    grid-auto-flow: column;
    grid-template-columns: repeat(7, 1fr);
}

.calendar-row > .header > div:not(:last-child) {
    border-right: 1px solid gray;
}

.calendar-row > .header > div {
    border-bottom: 1px solid gray;
    vertical-align: middle;
}

.event-row {
    grid-auto-rows: 20px;
    grid-auto-flow: row dense;
    transition: transform 0.3s, opacity 0.3s;
    grid-gap: 5px;
    margin-bottom: 5px;
    margin-top: 5px;
    min-height: 60px;
}

.event-row.skeleton {
    grid-template-rows: repeat(3, 15px);
}

.header > div {
    cursor: pointer;
}

.header {
    grid-row-gap: 5px;
    border-color: gray;
    position: sticky;
    z-index: 5;
    background-color: white;
    top: 21px;
    grid-template-rows: 25px;
    line-height: 24px;
}

.header > div.today-wrapper {
    display: flex;
    justify-content: center;   
}

.other-month {
    color: gray;
}
</style>
