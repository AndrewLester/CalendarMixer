<script lang="ts">
import { getContext } from 'svelte';
import type { NetworkStores } from '../stores';
import type { CourseColor, CourseIdentifier } from '../api/types';
import { colorsByCourseId } from '../stores';

const { identifiers, colors }: NetworkStores = getContext('stores');

function updateColor(e: Event, course: CourseIdentifier) {
    const color = $colorsByCourseId.get(course.id.toString());
    const colorValue = (e.target as HTMLInputElement).value;

    if (color) {
        color.color = colorValue;
        colors.update(color, 'id');
    } else {
        colors.create({
            id: -1,
            course,
            color: colorValue,
        });
    }
}
</script>

<div class="course-list">
    {#each $identifiers as course}
        <div class="course-item">
            <div class="realm-image" data-realm={course.realm} />
            <p>{course.name}:</p>
            <div class="color-input" class:random-color={!$colorsByCourseId.get(course.id.toString())}
                style="--background-color: {$colorsByCourseId.get(course.id.toString())?.color}">
                <input
                    class="color-input-hidden"
                    type="color"
                    value={$colorsByCourseId.get(course.id.toString())?.color}
                    on:change={(e) => updateColor(e, course)} />
            </div>
        </div>
    {:else}
        <div class="empty-message">You're not in any courses.</div>
    {/each}
</div>

<style>
.course-list {
    display: flex;
    box-sizing: border-box;
    background-color: white;
    flex-direction: column;
    flex-wrap: nowrap;
    height: 300px;
    width: auto;
    padding: 7px 15px;
    border-radius: 5px;
    max-height: calc(100vh - var(--header-height));
    overflow-y: auto;
    max-width: 100vw;
}
.course-item {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    padding: 3px 0px;
    max-width: 300px;
    border-bottom: 1px solid gray;
    width: 100%;
    height: 40px;
}
.course-item:last-child {
    border-bottom: none;
}
.empty-message {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 200px;
}
.color-input {
    position: relative;
    margin-left: auto;
    width: 20px;
    height: 20px;
    padding: 0px;
    border-radius: 50%;
    background-color: var(--background-color);
}
.color-input.random-color {
    background-color: none !important;
    background: linear-gradient(310deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 45%, rgba(255,0,0,1) 50%, rgba(255,255,255,1) 55%, rgba(255,255,255,1) 100%);
}
.color-input-hidden {
    position: absolute;
    opacity: 0;
    z-index: 99999;
    width: 100%;
    height: 100%;
    cursor: pointer;
}
.realm-image {
    flex: 0 0 auto;
    background: url('https://app.schoology.com/sites/all/themes/schoology_theme/images/icons_sprite_realm.png?5d0d37111b9f09da')
        no-repeat right;
    height: 20px;
    align-self: center;
    width: 30px;
    margin: 0px;
    margin-right: 5px;
}
.realm-image[data-realm='section'] {
    background-position-y: -29px;
}
.realm-image[data-realm='group'] {
    background-position-y: -59px;
}
.realm-image[data-realm='user'] {
    background-position-y: -179px;
}
.realm-image[data-realm='school'] {
    background-position-y: -209px;
}
.realm-image[data-realm='district'] {
    background-position-y: -209px;
    background-repeat: repeat-x;
    background-position-x: 17px;
}
</style>
