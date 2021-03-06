<script lang="ts">
import SkeletonLayout from '../utility/components/SkeletonLayout.svelte';
import SVGButton from '../utility/components/SVGButton.svelte';
import Spinner from '../utility/components/Spinner.svelte';
import Filter, { saveAll as saveAllFilters } from './Filter.svelte';
import { fade } from 'svelte/transition';
import { getContext } from 'svelte';
import { sleep } from '../utility/async.js';
import type { NetworkStores } from '../stores';

const SAVE_SVG_URL = '/static/img/save-button.svg';
const FAILED_SVG_URL = '/static/img/failed.svg';

let svgLink = SAVE_SVG_URL;
let saving = false;
let resetSVGTask: number | undefined;

const { filters }: NetworkStores = getContext('stores');
const filtersLoaded = filters.loaded;

async function saveFilters() {
    if (saving) {
        return;
    }

    if (resetSVGTask !== undefined) {
        clearTimeout(resetSVGTask);
    }
    saving = true;
    svgLink = SAVE_SVG_URL;

    // Second element is just the sleep
    const [responses] = await Promise.all([saveAllFilters(), sleep(1500)]);

    if (responses.some((res) => res.status === 'rejected')) {
        svgLink = FAILED_SVG_URL;
        resetSVGTask = setTimeout(() => {
            svgLink = SAVE_SVG_URL;
        }, 2500);
    }
    saving = false;
}
</script>

<div id="filter-editor">
    <h1>Edit Filters</h1>

    <div id="save-bar">
        <span id="saving-text">Save All</span>
        {#if !saving}
            <SVGButton {svgLink} symbolId={'icon'} on:click={saveFilters} />
        {:else}
            <Spinner />
        {/if}
    </div>

    {#if $filtersLoaded}
        <!-- Transition delay to wait for Skeleton Layout filter fade in -->
        <div id="filters-list" transition:fade={{ delay: 0 }}>
            {#each $filters as filter (filter.id)}
                <Filter {...filter} />
            {/each}
        </div>
    {:else}
        <div id="filters-list">
            <SkeletonLayout>
                <Filter
                    id={0}
                    positive={false}
                    course_ids={[]}
                    skeleton={true} />
            </SkeletonLayout>
        </div>
    {/if}
</div>

<style>
h1 {
    margin-top: 20px;
    font-size: 20px;
}
#filter-editor {
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    min-width: 250px;
    flex: 0 1 25%;
    align-items: center;
    position: relative;
    height: calc(100vh - var(--header-height));
}
#filters-list {
    display: flex;
    width: 100%;
    flex-direction: column;
    justify-content: start;
    align-items: center;
}
/* For the skeleton layout */
#filters-list :global(.wrapper) {
    display: contents;
}
@media only screen and (max-width: 1015px) {
    #filter-editor {
        height: auto;
        flex: 1 1 auto;
    }
}
</style>
