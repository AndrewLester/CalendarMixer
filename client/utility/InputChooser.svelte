<script>
import AutocompletePopup from './AutocompletePopup.svelte';
import { onMount } from 'svelte';

export let options = [];
export let selected = [];

$: availableOptions = options.filter(option => !selected.map(c => c.id).includes(option.id));

let input;
let inputValue = '';
let focused = false;

async function addSelected(option) {
    selected = [...selected, option];
    inputValue = '';
    input.focus();
}

</script>

<div class="input-area">
    <input class="input-chooser" tabindex="0" type="text" on:focus={() => focused = true}
      on:blur={() => focused = false} bind:this={input} bind:value={inputValue}>
    {#if focused }
        <AutocompletePopup element={input} options={availableOptions} search={inputValue} let:item let:match>
            <div slot="item" class="course-identifier-wrapper"
              data-realm="{item.realm}" on:mousedown={() => addSelected(item)}>
                <div></div>
                {#if inputValue.length === 0 }
                    <p>{item.name}</p>
                {:else}
                    <p>{match.start}<strong>{match.match}</strong>{match.end}</p>
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

.input-chooser {
    width: 100%;
    border: 1px solid gray;
    border-bottom: 2px solid gray;
    transition: border-bottom 0.3s;
}

.input-chooser:focus {
    border-bottom-color: #29b6f6;
}

.course-identifier-wrapper:hover, .course-identifier-wrapper.selected {
    cursor: pointer;
    background-color: rgba(128, 128, 128, 0.2);
}
</style>