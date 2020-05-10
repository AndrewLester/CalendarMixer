<script>
import SkeletonLayout from './utility/SkeletonLayout.svelte';
import SVGButton from './utility/SVGButton.svelte';
import InputChooser from './utility/InputChooser.svelte';
import Filter, { saveAll as saveAllFilters } from './Filter.svelte';
import { fade } from 'svelte/transition';
import { getContext } from 'svelte';
import { sleep } from './utility/async.js';

const SAVE_SVG_URL = '/static/img/save-button.svg';
const FAILED_SVG_URL = '/static/img/failed.svg';

let svgLink = SAVE_SVG_URL;
let saving = false;
let resetSVGTask;

const { identifiers: courseIdentifiers, filters } = getContext('stores');

async function saveFilters() {
    if (saving) {
        return;
    }

    if (resetSVGTask) {
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
            <svg class="spinner" viewBox="0 0 24 24" style="display: inline;">
                <circle class="path" cx="12" cy="12" r="10" fill="none" stroke-width="3" />
            </svg>
        {/if}
    </div>
    
    {#if $filters }
        <div id="filters-list" transition:fade="{{ delay: 200 }}">
            {#each $filters as filter (filter.id)}
                <Filter {...filter} />
            {/each}
        </div>
    {:else}
        <div id="filters-list">
            <SkeletonLayout>
                <Filter id={0} positive={false} course_ids={[]} skeleton={true} />
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
    min-width: 200px;
    flex: 1 0 25%;
    align-items: center;
    position: relative;
    height: calc(100vh - 53px);
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
.spinner {
    vertical-align: middle;
}
</style>