<script lang="ts" context="module">
export type InputChoice = {
    id: number;
    [key: string]: any;
} & SearchablePart;
</script>

<script lang="ts">
import type { SearchablePart } from './AutocompletePopup.svelte';
import AutocompletePopup from './AutocompletePopup.svelte';
import Input from './Input.svelte';

export let options: InputChoice[] = [];
export let selected: InputChoice[] = [];

$: availableOptions = options.filter(
    (option) => !selected.map((choice) => choice.id).includes(option.id)
);
let input;
let inputElement;
let inputValue = '';
let focused = false;

async function addSelected(option: InputChoice) {
    selected = [...selected, option];
    inputValue = '';
    input.focus();
}
</script>

<div class="input-area">
    <!-- <input class="input-chooser" tabindex="0" type="text" on:focus={() => focused = true}
      on:blur={() => focused = false} bind:this={input} bind:value={inputValue}> -->
    <Input
        label="Course name"
        bind:value={inputValue}
        on:blur={() => (focused = false)}
        on:focus={() => (focused = true)}
        bind:this={input}
        bind:root={inputElement}
        width={200} />
    {#if focused}
        <AutocompletePopup
            options={availableOptions}
            search={inputValue}
            let:item>
            <div
                slot="item"
                class="course-identifier-wrapper"
                data-realm={item.realm}
                on:mousedown={() => addSelected(item)}>
                <div />
                {#if inputValue.length === 0 || item.match === undefined}
                    <p>{item.name}</p>
                {:else}
                    <p>
                        {item.match.start}<strong>{item.match.match}</strong>{item.match.end}
                    </p>
                {/if}
            </div>
            <div slot="no-matches">
                <p style="align-self: center; margin: 0px auto;">No Matches</p>
            </div>
        </AutocompletePopup>
    {/if}
</div>

<style>
.input-area {
    flex: 1 1 auto;
    position: relative;
    min-width: 150px;
}

.course-identifier-wrapper:hover,
.course-identifier-wrapper.selected {
    cursor: pointer;
    background-color: rgba(128, 128, 128, 0.2);
}
</style>
