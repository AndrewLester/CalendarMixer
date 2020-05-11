<script>
import { animationEnd } from './async.js';

export let svgLink;
export let symbolId;
export let width = 24;
export let height = 24;
export let clickable = true;
export let classes = '';

let active = false;
let button;

function press() {
    if (!clickable) return;

    active = true;
}

async function release() {
    if (active) {
        await animationEnd(button, 'background-expand', 100);
        active = false;
    }
}

</script>

<svelte:window on:mouseup={release}/>

<!-- Forward click events upwards -->
<button class="icon-button" on:click bind:this={button} on:mousedown={press} class:active
    class:clickable style="--width: {width}px; --height: {height}px">

    <div></div>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" tabindex="0" class="{classes}">
        <use xlink:href="{svgLink}#{symbolId}"/>
    </svg>
</button>

<style>
.icon-button * {
    pointer-events: none;
}

.icon-button {
    outline: none;
    position: relative;
    border: none;
    cursor: default;
    background-color: transparent;
    height: var(--height);
    vertical-align: middle;
    width: var(--width);
    box-sizing: content-box;
    padding: 0px;
}

.icon-button.clickable {
    cursor: pointer;
}

.icon-button div {
    position: absolute;
    height: calc(100% * 1.5);
    width: calc(100% * 1.5);
    background-color: rgba(109, 111, 115, 0.5);
    border-radius: 50%;
    top: -25%;
    z-index: -1;
    left: -25%;
    opacity: 0;
    transform: scale(0);
    animation: background-fade 0.15s ease-in-out backwards;
}

.icon-button.active > div {
    animation: background-expand 0.15s ease-in-out forwards;
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