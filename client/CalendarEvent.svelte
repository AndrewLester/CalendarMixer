<script>
    import EventModalContent from './EventModalContent.svelte';
    import { CalendarEventData } from './calendar-structure.js';
    import { onMount, getContext } from 'svelte';

    export let eventInfo;
    export let start;
    export let end;
    export let calRowNum;
    export let initialPlacement;
    export let eventNum;
    export let startRow;
    export let condensed = true;
    export let startCol = undefined;
    export let endCol = undefined;
    export let filtered = false;
    export let endRow = startRow + 1;

    const { open } = getContext('simple-modal');
    const { alerts } = getContext('stores');

    let big = false;

    // Since "endRow" is bound to a variable, it can be changed from a parent component without affecting
    // The value of _endRow, since _endRow is not a reactive expression and is only evaluated once
    let _endRow = endRow;

    $: if (!condensed && startRow && (_endRow - (big ? 2 : 1) <= startRow)) {
        _endRow = (startRow + 1) + (big ? 1 : 0);
        endRow = _endRow;
    }

    if (condensed) {
        startRow = undefined;
        endRow = undefined;
    }

    const colors = [
        'rgba(236, 252, 17, 0.5)', 'rgba(17, 182, 252, 0.5)', 'rgba(248, 17, 252, 0.5)', 
        'rgba(244, 26, 26, 0.5)', 'rgba(46, 224, 11, 0.5)', 'rgba(237, 138, 33, 0.5)', 
        'rgba(76, 255, 174, 0.5)', 'rgba(41, 38, 255, 0.5)', 'rgba(179, 58, 255, 0.5)'
    ];

    let color = colors[~~(Math.random() * colors.length)];
    // Animation delay calculation factors in column and eventNum
    let animationDelay = 20 + (15 * startCol) + (5 * eventNum) + (100 * calRowNum);

    let eventElement;

    onMount(() => {
        if (eventElement) {
            if (!condensed && isOverflown(eventElement) && (endCol - startCol < 2)) {
                _endRow += 1;
                endRow = _endRow;
                big = true;
            }
        }
    });

    function isOverflown(element) {
        return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
    }

    function displayEventInfo() {
        const data = new CalendarEventData(eventInfo, true, filtered, start, end);
        open(EventModalContent, { ...data }, { closeButton: false, transitionBgProps: { duration: 200 } });
    }
</script>

{#if initialPlacement}
    <div class="calendar-event" class:filtered bind:this={eventElement} on:click={displayEventInfo}
      style="--bg-color: {color}; --animation-delay: {animationDelay}ms; grid-column: {startCol} / {endCol};
      grid-row: {startRow || 'unset'} / {_endRow || 'unset'};" class:multi-line={_endRow - startRow > 1}
      data-tippy-content="{decodeURI(eventInfo['title'])}">
        {#if $alerts && $alerts[eventInfo['id']]}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" tabindex="0"
                style="display: inline; width: 15px; height: 15px; vertical-align: middle;">
                <use xlink:href="/static/img/alert.svg#icon" width="25" height="25"/>
            </svg>
        {/if}
        {@html eventInfo.title}
    </div>
{/if}

<style>
.calendar-event {
    border-radius: 3px;
    font-size: 13px;
    font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}

.calendar-event {
    opacity: 1;
    cursor: pointer;
    transform: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0px 10px;
    line-height: 20px;        /* fallback */
    max-height: 45px;       /* fallback */
    will-change: transform, opacity;
    transition: color 200ms ease, background-color 200ms ease;
    animation: slide-in 200ms ease 1 both;
    animation-delay: var(--animation-delay);
}
.calendar-event {
    background-color: var(--bg-color);
}
.calendar-event.filtered {
    color: gray;
    background-color: rgba(128, 128, 128, 0.2);
}

.calendar-event.multi-line {
    line-height: 21px;
}

@keyframes slide-in {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0px);
    }
}
</style>
