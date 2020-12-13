<script lang="ts">
import Popper from '../utility/components/Popper.svelte';
import { scale } from 'svelte/transition';
import { bottom } from '@popperjs/core';

let button: HTMLElement | undefined;
let panel: Popper;

let popperOptions = {
    placement: bottom,
    modifiers: [
        {
            name: 'preventOverflow',
            options: {
                altAxis: true,
            },
        },
    ],
};
</script>

<button bind:this={button} class="small-button" on:click|stopPropagation={panel.toggle}>
    COLORS
</button>

{#if button}
    <Popper
        bind:this={panel}
        reference={button}
        {popperOptions}
        persistScroll={true}
        transition={scale}
        transitionProps={{ duration: 250, start: 0.85 }}>
        <slot />
    </Popper>
{/if}

<style>
</style>
