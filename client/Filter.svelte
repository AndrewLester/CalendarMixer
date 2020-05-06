<script context="module">
export class FilterData {
    constructor(filterId, positive, comparisonDataRetriever, filteredItems) {
        this.id = filterId;
        this.positive = positive;
        this.comparisonDataRetriever = comparisonDataRetriever;
        this.filteredItems = filteredItems;
    }
}

export class CourseFilterData extends FilterData {
    constructor(filterId, positive, courseIds) {
        super(filterId, positive, (eventInfo) => eventInfo[eventInfo['realm'] + '_id'], courseIds);
    }
}

const elements = new Set();

export async function saveAll() {
    let promises = [];

    for (let element of elements) {
        promises.push(element.save())
    }

    return Promise.allSettled(promises);
}
</script>

<script>
import InputChooser from './utility/InputChooser.svelte';
import { onMount, getContext } from 'svelte';

export let id;
export let positive;
export let course_ids;

const { identifiers: courseIdentifiers, filters } = getContext('stores');

onMount(() => {
    elements.add(self);
});

export function save() {
    const formData = new FormData();
    formData.append('filter_id', JSON.stringify({ data: id + '' }));
    formData.append('positive', JSON.stringify({ data: positive + '' }));
    formData.append('course_id', JSON.stringify({ data: course_ids }));

    return filters.set(formData, null, {id, positive, course_ids});
}

</script>

<fieldset class="course-filter-layout">
    <legend>Filter Id: {id}</legend>
    <label for="positive-filter-button">Positive: </label>
    <input class="positive-filter-button filter-type" type="checkbox" bind:checked={positive}>
    <div class="course-input">
        <InputChooser options={$courseIdentifiers} />
    </div>
    <input type="submit" on:click={save} class="form-submit" value="Save Filter">
</fieldset>

<style>
.course-filter-layout {
    width: 100%;
    flex-direction: column;
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
    align-items: center;
    display: flex;
}

.course-input {
    margin-top: 10px;
    margin-bottom: 10px;
    border-bottom: 2px solid gray;
    flex-wrap: wrap;
    transition: border-bottom 0.3s;
    font-size: 12px;
    line-height: 12px;
    width: 90%;
    display: flex;
}

.course-chooser {
    flex: 1 1 145px;
    border: none;
    position: relative;
    font-size: 12px;
    height: 20px;
    width: 145px;
    min-width: 75px;
}

:global(.autocomplete-popup-item-wrapper) > :global(div) {
    flex: 0 0 auto;
    background: url('https://app.schoology.com/sites/all/themes/schoology_theme/images/icons_sprite_realm.png?5d0d37111b9f09da') no-repeat right;
    height: 20px;
    align-self: center;
    width: 30px;
    margin: 0px;
}

:global(.autocomplete-popup-item-wrapper)[data-realm='section'] > :global(div) {
    background-position-y: -29px;
}
:global(.autocomplete-popup-item-wrapper)[data-realm='group'] > :global(div) {
    background-position-y: -59px;
}
:global(.autocomplete-popup-item-wrapper)[data-realm='user'] > :global(div) {
    background-position-y: -179px;
}
:global(.autocomplete-popup-item-wrapper)[data-realm='school'] > :global(div) {
    background-position-y: -209px;
}
:global(.autocomplete-popup-item-wrapper)[data-realm='district'] > :global(div) {
    background-position-y: -209px;
    background-repeat: repeat-x;
    background-position-x: 17px;
    margin-right: 3px;
}

:global(.autocomplete-popup-item-wrapper) > :global(p) {
    align-self: center;
    margin-right: auto;
}
</style>
