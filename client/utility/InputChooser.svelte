<script>
import AutocompletePopup from './AutocompletePopup.svelte';
import { onMount } from 'svelte';

export let options = [];
export let selected = [];

$: availableOptions = options.filter(option => !selected.map(c => c.id).includes(option.id));

let input;
let focused = false;

onMount(() => {

});

</script>

<div class="input-area">
    <input type="text" on:focus={() => focused = true} on:blur={() => focused = false} bind:this={input}>
    {#if focused }
        <AutocompletePopup element={input} options={availableOptions} let:item>
            <div class="course-identifier-wrapper" data-realm="{item.realm}">
                {#if input.value.length === 0 }
                    <p>{item.name}</p>
                {:else}
                    <p><span style="font-weight: bold;"></span></p>
                {/if}
            </div>
        </AutocompletePopup>
    {/if}
</div>

<style>
.input-area {
    position: relative;
    display: flex;
    width: auto;
    border-bottom: 2px solid gray;
    transition: border-bottom 0.3s;
}

.input-area:focus {
    border-bottom-color: #29b6f6;
}

.course-identifier-wrapper {

}
</style>