<script lang="ts">
import { tick } from 'svelte';
import { createPopperActions } from 'svelte-popperjs';
import { clickOutside } from '../actions';

export let reference: HTMLElement;
export let popperOptions: object = {};
export let persistScroll: boolean = false;
export let transition: (node: Node, options: object) => any;
export let transitionProps: object = {};

let popperContentElem: HTMLElement;
let scrollPosition = { scrollTop: 0, scrollLeft: 0 };
let opened = false;

const [popperRef, popperContent] = createPopperActions();
popperRef(reference);

function updateScroll() {
    if (!popperContentElem.firstElementChild) return;

    popperContentElem.firstElementChild.scrollTop = scrollPosition.scrollTop;
    popperContentElem.firstElementChild.scrollLeft = scrollPosition.scrollLeft;
}

function saveScroll() {
    if (!popperContentElem.firstElementChild) return;

    scrollPosition = {
        scrollTop: popperContentElem.firstElementChild.scrollTop,
        scrollLeft: popperContentElem.firstElementChild.scrollLeft,
    };
}

export async function open() {
    opened = true;
    await tick();
    if (persistScroll) {
        updateScroll();
    }
}

export async function close() {
    if (persistScroll) {
        saveScroll();
    }
    opened = false;
}

export function toggle() {
    if (opened) {
        close();
    } else {
        open();
    }
}
</script>

{#if opened}
    <div
        class="popper"
        use:popperContent={popperOptions}
        use:clickOutside={close}>
        <div
            class="popper-content"
            transition:transition={transitionProps}
            bind:this={popperContentElem}>
            <slot />
        </div>
    </div>
{/if}

<style>
.popper {
    position: absolute;
    z-index: 200;
    width: auto;
    height: auto;
}
.popper-content {
    box-sizing: border-box;
    box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.302),
        0 2px 6px 2px rgba(60, 64, 67, 0.149);
    height: auto;
    width: auto;
}
</style>
