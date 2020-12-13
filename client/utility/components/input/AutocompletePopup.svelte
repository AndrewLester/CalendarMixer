<script lang="ts" context="module">
export interface SearchablePart {
    id: number;
    searchablePart?: string;
}

export interface Match {
    match: {
        start: string;
        match: string;
        end: string;
    };
}

export type MatchingSearchablePart = SearchablePart & Partial<Match>;
</script>

<script lang="ts">
import { onMount } from 'svelte';
import { createPopperActions } from 'svelte-popperjs';
import { bottom } from '@popperjs/core';
import { fly, scale } from 'svelte/transition';
import { cubicInOut } from 'svelte/easing';

export let search = '';
export let options: SearchablePart[] = [];

let matchingOptions: MatchingSearchablePart[] = [];
const [popperRef, popperContent] = createPopperActions();

let element: HTMLElement;

// Creating Matching Option Text
$: {
    if (search.length === 0) {
        matchingOptions = options;
    } else {
        updateMatches();
    }
}

function updateMatches() {
    matchingOptions = [];
    for (let option of options) {
        if (option.searchablePart === undefined) continue;

        const name = option.searchablePart;
        const words = name.split(' ');
        for (let word of words) {
            let identifiedString = name.substring(name.indexOf(word));
            if (
                identifiedString.toLowerCase().startsWith(search.toLowerCase())
            ) {
                const index = name.indexOf(identifiedString);
                matchingOptions = [
                    ...matchingOptions,
                    {
                        ...option,
                        match: {
                            start: name.substring(0, index),
                            match: name.substring(index, index + search.length),
                            end: name.substring(index + search.length),
                        },
                    },
                ];
                break;
            }
        }
    }
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
            },
        },
        {
            name: 'autoSizing',
            enabled: true,
            fn: popperSizeModifier,
        },
        { name: 'preventOverflow' },
    ],
};
</script>

<div
    class="identifier-complete"
    bind:this={element}
    use:popperContent={popperOptions}>
    {#if matchingOptions.length > 0}
        {#each matchingOptions as option (option.id)}
            <slot name="item" item={option} />
        {/each}
    {:else}
        <slot name="no-matches" />
    {/if}
</div>

<style>
.identifier-complete {
    position: absolute;
    background-color: white;
    box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.302),
        0 2px 6px 2px rgba(60, 64, 67, 0.149);
    border-radius: 5px;
    padding: 7px 0px;
    overflow-y: auto;
    max-height: 200px;
    width: 100%;
    flex-wrap: wrap;
    z-index: 200;
}

:global(.identifier-complete) > :global(*) {
    flex: 1 0 100%;
    text-overflow: ellipsis;
    height: 30px;
    padding: 10px 0px;
    text-align: center;
    font-size: 12px;
    line-height: 20px;
    display: flex;
}
</style>
