<script lang="ts">
    import CalendarEvent from './CalendarEvent.svelte';
    import moment from 'moment';
    import type { CalendarDayData, CalendarData } from './calendar-structure';

    export let today: moment.Moment;
    export let calRowNum;
    export let dayNumbers: number[] = [];
    export let days: CalendarDayData[] = [];
    export let calendar: CalendarData | undefined = undefined;
    export let skeleton: boolean = false;
    export let condensed: boolean = false;

    let now = moment();
</script>

<div class="calendar-row">
    <div class="header">
        {#each dayNumbers as num, i}
            <div class:other-month={days[i].otherMonth}>
                {#if !days[i].otherMonth && now.year() === today.year() && now.month() == today.month() && num == now.date()}
                    <span class="today">{num}</span>
                {:else}{num}{/if}
            </div>
        {/each}
    </div>
    <div class="event-row" class:skeleton>
        {#if skeleton}
            <div class="skeleton-bar" style="grid-column: 2 / 6" />
            <div class="skeleton-bar" style="grid-column: 1 / 3" />
            <div class="skeleton-bar" style="grid-column: 5 / 7" />
            <div class="skeleton-bar" style="grid-column: 2 / 5" />
            <div class="skeleton-bar" style="grid-column: 7 / 8" />
        {:else}
            <!-- CHANGE DAY each KEY to an integer -->
            {#each days as day, dayIndex (dayIndex)}
                {#each day.events as event, i (event.eventInfo.id)}
                    {#if condensed}
                        {#if event.initialPlacement}
                            <CalendarEvent
                                {...event}
                                eventNum={i}
                                {calRowNum} />
                        {/if}
                    {:else if i === 0}
                        <CalendarEvent
                            {...event}
                            eventNum={i}
                            {calRowNum}
                            startRow={event.startRow || 1}
                            bind:endRow={calendar.rows[calRowNum].days[dayIndex].events[i].endRow}
                            condensed={false} />
                    {:else}
                        <CalendarEvent
                            {...event}
                            eventNum={i}
                            {calRowNum}
                            bind:startRow={calendar.rows[calRowNum].days[dayIndex].events[i - 1].endRow}
                            bind:endRow={calendar.rows[calRowNum].days[dayIndex].events[i].endRow}
                            condensed={false} />
                    {/if}
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
        grid-template-rows: repeat(3, 20px);
    }

    .header > div {
        cursor: pointer;
        font-family: 'Times New Roman', Times, serif;
    }

    .header {
        grid-row-gap: 5px;
        border-color: gray;
        position: sticky;
        will-change: transform;
        z-index: 5;
        background-color: white;
        top: 21px;
        grid-template-rows: 25px;
        line-height: 24px;
    }

    .other-month {
        color: gray;
    }

    :not(.other-month) > .today {
        display: inline-block;
        color: white;
        border-radius: 50%;
        background-color: #29b6f6;
        scroll-margin-top: 24px;
        height: 24px;
        width: 25px;
    }
</style>
