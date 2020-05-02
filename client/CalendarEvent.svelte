<script>
    export let eventInfo;
    export let start;
    export let end;
    export let startCol;
    export let endCol;
    export let initialPlacement;
    export let eventNum;
    export let filtered = false;
    let color = 'rgba(255, 255, 255, 0.1)';
</script>

<div class="calendar-event" class:filtered style="--bg-color: {color}; grid-row: {startCol} / {endCol}">
    {eventInfo.title}
</div>

<style>
.calendar-event {
    border-radius: 3px;
    font-size: 13px;
    font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
    transition: transform 0.3s, opacity 0.3s;
}

.calendar-event.added {
    opacity: 0;
    transform: translateY(20px);
}

.calendar-event {
    opacity: 1;
    cursor: pointer;
    transform: none;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-height: 20px;        /* fallback */
    max-height: 45px;       /* fallback */
}
.calendar-event {
    background-color: var(--bg-color);
}
.calendar-event.filtered {
    color: gray;
    background-color: rgba(128, 128, 128, 0.2);
}
</style>