<script>
import SkeletonLayout from './utility/SkeletonLayout.svelte';
import SVGButton from './utility/SVGButton.svelte';
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

    const responses = await saveAllFilters();

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
        <span id="saving-text">Saving</span>
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
        <SkeletonLayout>
            <fieldset class="course-filter-layout">
                <legend>Filter Id: 1</legend>
                <label for="positive-filter-button">Positive Filter</label>
                <input id="positive-filter-button" class="filter-type" type="checkbox">
                <div class="course-input">
                    <input class="course-chooser" type="text" placeholder="Add Course">
                </div>
                <input type="submit" class="form-submit" value="Save Filter">
            </fieldset>
        </SkeletonLayout>
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
.course-filter-layout {
    width: 100%;
    flex-direction: column;
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
    align-items: center;
    display: flex;
}
.spinner {
    vertical-align: middle;
}
</style>