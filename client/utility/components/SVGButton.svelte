<script lang="ts">
import { animationEnd } from '../async';

export let svgLink: string;
export let symbolId: string;
export let width = 24;
export let height = 24;
export let disabled: boolean = false;
export let classes = '';
export let text = '';

let active = false;
let button: HTMLElement;

function press(e: Event) {
    if (disabled) {
        e.preventDefault();
        return;
    }

    active = true;
}

async function release() {
    if (active) {
        await animationEnd(button, 'background-expand', 100);
        active = false;
    }
}
</script>

<svelte:window on:mouseup={release} on:touchend|passive={release} />

<!-- Forward click events upwards -->
<button
    class="icon-button"
    on:click
    bind:this={button}
    on:mousedown={press}
    on:touchstart|passive={press}
    class:active
    class:disabled
    style="--width: {width}px; --height: {height}px">
    <div />
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 {width} {height}"
        class={classes}>
        <use xlink:href="{svgLink}#{symbolId}" />
    </svg>
</button>
{#if text.length > 0}
    <span
        class="button-text"
        class:disabled
        on:mousedown={press}
        on:touchstart|passive={press}
        on:click>{text}</span>
{/if}

<style>
.icon-button * {
    pointer-events: none;
}

button > svg {
    position: relative;
    z-index: 2;
}

.icon-button {
    outline: none;
    position: relative;
    border: none;
    cursor: default;
    background-color: transparent;
    -webkit-tap-highlight-color: transparent;
    height: var(--height);
    vertical-align: middle;
    width: var(--width);
    box-sizing: content-box;
    padding: 0px;
}

.icon-button:not(.disabled) {
    cursor: pointer;
}

.icon-button div {
    position: absolute;
    height: calc(100% * 1.5);
    width: calc(100% * 1.5);
    background-color: rgba(109, 111, 115, 0.5);
    border-radius: 50%;
    top: -25%;
    z-index: 1;
    left: -25%;
    opacity: 0;
    transform: scale(0);
    animation: background-fade 0.15s ease-in-out backwards;
}

.icon-button.active > div {
    animation: background-expand 0.15s ease-in-out forwards;
}

.button-text {
    cursor: default;
    margin-left: 1px;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}

.button-text:not(.disabled) {
    cursor: pointer;
}

@keyframes background-expand {
    from {
        opacity: 1;
        transform: scale(0);
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}
@keyframes background-fade {
    0% {
        opacity: 1;
        transform: scale(1);
    }
    99% {
        transform: scale(1);
    }
    100% {
        opacity: 0;
    }
}
</style>
