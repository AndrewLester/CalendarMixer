<script lang="ts" context="module">
    import { EventInfo, CourseIdentifier } from '../api/types';

    const saves: (() => Promise<void>)[] = [];

    export async function saveAll() {
        const promises = saves.map((save) => save());
        return Promise.allSettled(promises);
    }
</script>

<script lang="ts">
    import InputChooser from '../utility/components/input/InputChooser.svelte';
    import { onMount, getContext } from 'svelte';
    import { flip } from 'svelte/animate';
    import { fade } from 'svelte/transition';
    import { NetworkStores } from '../stores';

    export let id: number;
    // Bound to checkbox
    export let positive: boolean;
    // Updated from parent components and InputChooser child component
    export let course_ids: CourseIdentifier[];

    export let skeleton = false;

    const {
        identifiers: courseIdentifiers,
        filters,
    }: NetworkStores = getContext('stores');

    if (!skeleton) {
        saves.push(save);
    }

    function removeCourse(courseId) {
        course_ids = course_ids.filter((course) => course !== courseId);
    }

    function save(): Promise<void> {
        if (skeleton || $filters === undefined) {
            return;
        }

        const formData: FilterData = { id, positive, course_ids };

        let updatedFilter = $filters.filter((f) => f.id === id)[0];
        updatedFilter.positive = positive;
        updatedFilter.course_ids = course_ids;
        filters.update(formData, [
            ...$filters.filter((f) => f.id !== id),
            updatedFilter,
        ]);
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
        <label>Courses:</label>
        {#each course_ids as courseId (courseId.course_id)}
            <div
                class="recognized-course"
                animate:flip={{ duration: 100 }}
                transition:fade={{ duration: 100 }}>
                <span class="course-name">{courseId.course_name}</span>
                <img
                    on:click={() => removeCourse(courseId)}
                    class="delete-icon"
                    src="/static/img/close.svg"
                    alt="Remove Course" />
            </div>
        {/each}
        <InputChooser
            options={$courseIdentifiers.map()}
            bind:selected={course_ids} />
    </div>
    <input
        type="submit"
        on:click={save}
        class="form-submit"
        value="Save Filter" />
</fieldset>

<style>
    .course-filter-layout {
        width: 80%;
        display: flex;
        flex-direction: column;
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
        align-self: center;
        margin: 0px auto;
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
