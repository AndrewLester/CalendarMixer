<script lang="ts">
import moment from 'moment';
import { createEventDispatcher, onMount } from 'svelte';
import { createPopperActions } from 'svelte-popperjs';
import { bottom } from '@popperjs/core';

export let duration: moment.Duration;

let element: HTMLElement;

const [ popperRef, popperContent ] = createPopperActions();
const dispatch = createEventDispatcher();

$: UNITS = ['minute', 'hour', 'day'].map(
    (v) => v + (selectedValue === 1 ? '' : 's')
);

let selectedUnit: moment.unitOfTime.Base = 'minutes';
if (duration.asDays() % 1 === 0) {
    selectedUnit = 'day';
} else if (duration.asHours() % 1 === 0) {
    selectedUnit = 'hour';
} else {
    selectedUnit = 'minute';
}

let selectedValue = duration.as(selectedUnit);

$: if (selectedValue !== undefined && selectedValue !== null && selectedUnit) {
    if (parseInt(selectedValue.toString()) !== NaN) {
        duration = moment.duration(
            Math.max(0, Math.min(500, parseInt(selectedValue.toString()))),
            selectedUnit
        );
    }
}

function close() {
    dispatch('close', {});
}

onMount(() => {
    if (element.parentElement) {
        popperRef(element.parentElement);
    }
});

function popperSizeModifier(data: any): any {
    data.styles.width = data.offsets.reference.width;
    data.offsets.popper.left = data.offsets.reference.left;
    return data;
}

const popperOptions = {
    placement: bottom,
    modifiers: [
        {
            name: 'flip',
            options: {
                fallbackPlacements: ['top'],
            }
        },
        {
            name: 'autoSizing',
            enabled: true,
            fn: popperSizeModifier
        },
        { name: 'preventOverflow' }
    ]
};
</script>

<svelte:window on:mousedown={close} />

<div class="duration-popup" bind:this={element} use:popperContent={popperOptions}>
    <div class="wrapper" on:mousedown|stopPropagation>
        <fieldset>
            <input
                type="number"
                bind:value={selectedValue}
                placeholder=" "
                min="0"
                max="500" />
            <legend><span data-text="Time" /></legend>
        </fieldset>

        <select bind:value={selectedUnit}>
            {#each UNITS as unit}
                <option
                    value={unit}
                    selected={selectedUnit.startsWith(unit.substring(0, 2))}>
                    {unit}
                </option>
            {/each}
        </select>
    </div>
</div>

<style>
.duration-popup {
    position: absolute;
    background-color: white;
    box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.302),
        0 2px 6px 2px rgba(60, 64, 67, 0.149);
    border-radius: 5px;
    overflow-y: hidden;
    max-height: 200px;
    width: 100%;
    z-index: 9999999;
}

.wrapper {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    height: 100%;
    padding: 7px 0px;
}

fieldset,
span,
legend {
    position: relative;
}

fieldset {
    --input-width: 60px;
    border: 2px solid gray;
    margin-right: 10px;
    position: relative;
    border-radius: 3px;
    width: var(--input-width);
    transition: border-color 200ms ease-out;
}

fieldset:focus-within {
    border-color: #29b6f6;
}

legend {
    --input-font-size: 16px;
    height: var(--input-font-size);
    line-height: var(--input-font-size);
}

span::before {
    transition: transform 150ms, font-size 150ms, color 150ms;
    transform: translate(0px);
    position: absolute;
    top: 0;
    font-size: 15px;
    left: 0;
    right: 0;
    bottom: 0;
    color: #29b6f6;
    pointer-events: none;
    content: attr(data-text);
    opacity: 1;
}

input {
    width: var(--input-width);
    opacity: 1;
    border: none;
    transition: opacity 200ms ease-out 200ms;
    font-size: var(--input-font-size);
}

span::after {
    content: attr(data-text);
    position: relative;
    display: inline-block;
    font-size: 15px;
    opacity: 0;
}

input:placeholder-shown:not(:focus) + legend span::after {
    content: '';
}

input:placeholder-shown:not(:focus) + legend span::before {
    transform: translateY(26px);
    font-size: var(--input-font-size);
    color: gray;
    padding-left: 2px;
}

input:not(:focus):not(:placeholder-shown) + legend span::before {
    color: gray;
}

input:placeholder-shown:not(:focus) + legend {
    padding: 0px;
}
</style>
