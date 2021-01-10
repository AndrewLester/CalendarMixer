<script lang="ts" context="module">
const saves: (() => Promise<void>)[] = [];

export async function saveAll() {
    const promises = saves.map((save) => save());
    return Promise.allSettled(promises);
}
</script>

<script lang="ts">
import type { CourseIdentifier, Filter } from '../api/types';
import InputChooser from '../utility/components/input/InputChooser.svelte';
import type { InputChoice } from '../utility/components/input/InputChooser.svelte';
import { getContext } from 'svelte';
import { flip } from 'svelte/animate';
import { fade } from 'svelte/transition';
import type { NetworkStores } from '../stores';
import { derived } from 'svelte/store';
import * as notifier from '../notifications/notifier';
import type { Readable } from 'svelte/store';

export let id: number;
// Bound to checkbox
export let positive: boolean;
// Updated from parent components and InputChooser child component
export let course_ids: CourseIdentifier[];

export let skeleton: boolean = false;

const { identifiers: courseIdentifiers, filters }: NetworkStores = getContext(
    'stores'
);
const [filtersLoaded, courseIdentifiersLoaded] = [
    filters.loaded,
    courseIdentifiers.loaded,
];

type InputChoicesStores = [Readable<CourseIdentifier[]>, Readable<boolean>];
const inputChoices = derived<InputChoicesStores, InputChoice[]>(
    [courseIdentifiers, courseIdentifiersLoaded],
    ([_identifiers, _filtersLoaded]) => {
        if (_filtersLoaded) {
            return _identifiers.map((course) => {
                return ({
                    searchablePart: course.name,
                    ...course,
                } as unknown) as InputChoice;
            });
        }
        return [] as InputChoice[];
    }
);

if (!skeleton) {
    saves.push(save);
}

function removeCourse(courseToRemove: CourseIdentifier) {
    course_ids = course_ids.filter((course) => course.id !== courseToRemove.id);
}

async function save() {
    if (skeleton || !$filtersLoaded) {
        return;
    }

    const filter: Filter = { id, positive, course_ids };

    await filters.update(filter, 'id');
    notifier.info('Filter saved', 1500);
}
</script>

<fieldset class="course-filter-layout" class:skeleton>
    <legend>Filter Id: {id}</legend>
    <div class="filter-setting">
        <label for="positive-filter-button">Positive:</label>
        <input
            class="positive-filter-button filter-type"
            type="checkbox"
            bind:checked={positive} />
    </div>
    <div class="course-input">
        <label for="hidden-input">Courses:</label>
        <input id="hidden-input" style="display: none;" />

        {#each course_ids as course (course.id)}
            <div
                class="recognized-course"
                animate:flip={{ duration: 100 }}
                transition:fade={{ duration: 100 }}>
                <span class="course-name">{course.name}</span>
                <img
                    on:click={() => removeCourse(course)}
                    class="delete-icon"
                    src="/static/img/close.svg"
                    alt="Remove Course" />
            </div>
        {/each}
        <InputChooser options={$inputChoices} bind:selected={course_ids} />
    </div>
    <input
        type="submit"
        on:click={save}
        class="form-submit small-button"
        value="Save Filter" />
</fieldset>

<style>
.course-filter-layout {
    width: 80%;
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
    align-items: start;
}

.course-input {
    margin: 10px auto;
    flex-wrap: wrap;
    font-size: 12px;
    line-height: 12px;
    width: 90%;
    display: flex;
    margin-top: 5px;
}

.course-input > label {
    line-height: 20px;
    font-size: initial;
    margin-right: 2px;
    max-height: 100%;
}

.form-submit {
    align-self: flex-end;
    margin-right: 30px;
    margin-top: 5px;
}

.recognized-course {
    flex: 0 0 auto;
    background-color: gray;
    line-height: 20px;
    color: white;
    height: 20px;
    border-radius: 15px;
    padding: 0px 5px;
    margin-right: 3px;
    margin-bottom: 1px;
}

.recognized-course > .course-name {
    margin: 0px 5px;
}

.recognized-course > * {
    display: inline-block;
    vertical-align: baseline;
}

.delete-icon {
    height: 15px;
    width: 15px;
    cursor: pointer;
    vertical-align: middle;
}

:global(.course-identifier-wrapper) > :global(div) {
    flex: 0 0 auto;
    background: url('https://app.schoology.com/sites/all/themes/schoology_theme/images/icons_sprite_realm.png?5d0d37111b9f09da')
        no-repeat right;
    height: 20px;
    align-self: center;
    width: 30px;
    margin: 0px;
}

:global(.course-identifier-wrapper)[data-realm='section'] > :global(div) {
    background-position-y: -29px;
}
:global(.course-identifier-wrapper)[data-realm='group'] > :global(div) {
    background-position-y: -59px;
}
:global(.course-identifier-wrapper)[data-realm='user'] > :global(div) {
    background-position-y: -179px;
}
:global(.course-identifier-wrapper)[data-realm='school'] > :global(div) {
    background-position-y: -209px;
}
:global(.course-identifier-wrapper)[data-realm='district'] > :global(div) {
    background-position-y: -209px;
    background-repeat: repeat-x;
    background-position-x: 17px;
    margin-right: 3px;
}

:global(.course-identifier-wrapper) > :global(p) {
    align-self: center;
    margin-right: auto;
}
</style>
