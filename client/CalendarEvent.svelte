<script>
    import { onMount } from 'svelte';
    import tippy from 'tippy.js';
    import 'tippy.js/dist/tippy.css';
    import 'tippy.js/animations/shift-away-subtle.css';

    export let eventInfo;
    export let start;
    export let end;
    export let calRowNum;
    export let startCol = undefined;
    export let endCol = unescape;
    export let initialPlacement;
    export let eventNum;
    export let startRow = undefined;
    export let endRow = startRow + 1;
    export let filtered = false;

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
            tippy(eventElement, {
                content: eventInfo.title,
                arrow: true,
                duration: [100, 100],
                animation: 'shift-away-subtle'
            });
        }
    });
</script>

{#if initialPlacement }
    <div class="calendar-event" class:filtered bind:this={eventElement} style="--bg-color: {color};
     --animation-delay: {animationDelay}ms; grid-column: {startCol} / {endCol}">
        {eventInfo.title}
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
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
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