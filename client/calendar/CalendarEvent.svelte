<script lang="ts" context="module">
    import type { EventInfo } from '../api/types';
    import type moment from 'moment';
    import type { NetworkStores } from '../stores';
    import type { ModalFunctions } from '../modals/types';
    import type { CalendarEventData } from './calendar-structure';
</script>

<script lang="ts">
    import EventModalContent from '../modals/event/EventModalContent.svelte';
    import { onMount, getContext } from 'svelte';
    import tippy from 'tippy.js';
    import { cubicOut } from 'svelte/easing';
    import { scale } from 'svelte/transition'
    import { alertsByEvent } from '../stores';
    import 'tippy.js/dist/tippy.css';
    import 'tippy.js/animations/shift-away-subtle.css';

    export let eventInfo: EventInfo;
    export let start: moment.Moment;
    export let end: moment.Moment;
    export let calRowNum: number;
    export let initialPlacement: boolean;
    export let eventNum: number;
    export let startCol: number;
    export let endCol: number | undefined;
    export let startRow: number | undefined;
    export let endRow: number | undefined =
        startRow === undefined ? startRow : startRow + 1;
    export let condensed: boolean = true;
    export let filtered: boolean = false;

    const { open }: ModalFunctions = getContext('simple-modal');
    const { alerts }: NetworkStores = getContext('stores');
    const alertsLoaded = alerts.loaded;

    let big = false;

    // Since "endRow" is bound to a variable, it can be changed from a parent component without affecting
    // The value of _endRow, since _endRow is not a reactive expression and is only evaluated once
    let _endRow = endRow;

    $: if (
        !condensed &&
        startRow &&
        _endRow !== undefined &&
        _endRow - (big ? 2 : 1) <= startRow
    ) {
        _endRow = startRow + 1 + (big ? 1 : 0);
        endRow = _endRow;
    }

    if (condensed) {
        startRow = undefined;
        endRow = undefined;
    }

    const colors = [
        'rgba(236, 252, 17, 0.5)',
        'rgba(17, 182, 252, 0.5)',
        'rgba(248, 17, 252, 0.5)',
        'rgba(244, 26, 26, 0.5)',
        'rgba(46, 224, 11, 0.5)',
        'rgba(237, 138, 33, 0.5)',
        'rgba(76, 255, 174, 0.5)',
        'rgba(41, 38, 255, 0.5)',
        'rgba(179, 58, 255, 0.5)',
    ];

    let color = colors[~~(Math.random() * colors.length)];
    // Animation delay calculation factors in column and eventNum
    let animationDelay = 20 + 15 * startCol + 5 * eventNum + 100 * calRowNum;

    let eventElement;

    onMount(() => {
        if (eventElement) {
            if (
                !condensed &&
                isOverflown(eventElement) &&
                endCol &&
                _endRow &&
                endCol - startCol < 2
            ) {
                _endRow += 1;
                endRow = _endRow;
                big = true;
            }

            tippy(eventElement, {
                content: eventInfo['title'],
                arrow: true,
                duration: [100, 100],
                animation: 'shift-away-subtle',
                touch: ['hold', 450],
                trigger: 'mouseenter',
            });
        }
    });

    function isOverflown(element) {
        return (
            element.scrollHeight > element.clientHeight ||
            element.scrollWidth > element.clientWidth
        );
    }

    function displayEventInfo() {
        const data: CalendarEventData = {
            eventInfo,
            filtered,
            start,
            end,
            initialPlacement: true,
        };
        open(
            EventModalContent,
            { ...data },
            { 
                closeButton: false, 
                transitionBgProps: { duration: 150 },
                transitionWindow: scale,
                transitionWindowProps: { duration: 150, easing: cubicOut, start: 0.95, opacity: 0.7 }
            }
        );
    }
</script>

{#if initialPlacement}
    <div
        class="calendar-event"
        class:filtered
        bind:this={eventElement}
        on:click={displayEventInfo}
        style="--bg-color: {color}; --animation-delay: {animationDelay}ms;
        grid-column: {startCol} / {endCol}; grid-row: {startRow || 'unset'} / {_endRow || 'unset'};"
        class:multi-line={big}>
        {#if $alertsLoaded && $alertsByEvent.has(eventInfo.id.toString())}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 25 25"
                style="display: inline; width: 15px; height: 15px;
                vertical-align: middle;">
                <use
                    xlink:href="/static/img/alert.svg#icon"
                    width="25"
                    height="25" />
            </svg>
        {/if}
        {eventInfo['title']}
    </div>
{/if}

<style>
    .calendar-event {
        border-radius: 3px;
        font-size: 13px;
        font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande',
            'Lucida Sans', Arial, sans-serif;
    }

    .calendar-event {
        opacity: 1;
        cursor: pointer;
        transform: none;
        overflow: hidden;
        text-overflow: ellipsis;
        user-select: none;
        white-space: nowrap;
        padding: 0px 10px;
        line-height: 20px; /* fallback */
        max-height: 45px; /* fallback */
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
        white-space: normal;
        display: -webkit-box;
        -webkit-line-clamp: 2; /* number of lines to show */
        -webkit-box-orient: vertical;
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
