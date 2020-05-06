<script>
import AutocompletePopup from './AutocompletePopup.svelte';
import { onMount } from 'svelte';

export let options = [];

let input;
let focused = false;

onMount(() => {

});

</script>

<div id="input-area">
    <input id="" on:focus={() => focused = true} bind:this={input}>
    {#if focused }
        <AutocompletePopup {options} let:item>
            <div class="course-identifier-wrapper" data-realm="{item.realm}">
                {#if input.value.length === 0 }
                    <p>{item[Object.keys(item).filter(key => key !== 'realm')[0]]}</p>
                {:else}
                    <p>{name_begin}<span style="font-weight: bold;">{bold}</span>{name_end}</p>
                {/if}
            </div>
        </AutocompletePopup>
    {/if}
</div>

<style>
#input-area {
    position: relative;
    display: flex;
}

.course-identifier-wrapper {
    
}
</style>