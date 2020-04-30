<script>
import SkeletonLayout from './utility/SkeletonLayout.svelte';
import SVGButton from './utility/SVGButton.svelte';
import { fade } from 'svelte/transition';
import { onMount } from 'svelte';

const fetchCourseIdentifiers = fetch('/calendar/filter').then((res) => res.json());

let courseIdentifiers;

onMount(async () => {
    courseIdentifiers = await fetchCourseIdentifiers;
});

function saveFilters() {

}

</script>

<div id="filter-editor">
    <h1>Edit Filters</h1>
    <SVGButton svgLink={'/static/img/save-button.svg'} symbolId={'icon'} on:click={saveFilters}/>
    {#if courseIdentifiers}
        <div transition:fade="{{ delay: 200 }}">{JSON.stringify(courseIdentifiers)}</div>
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
    height: calc(100vh - 87px);
}
.course-filter-layout {
    width: 100%;
    flex-direction: column;
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
    align-items: center;
    display: flex;
}
</style>