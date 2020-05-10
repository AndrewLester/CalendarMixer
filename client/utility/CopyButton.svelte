<script>
import { onMount, tick } from 'svelte';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away-subtle.css';

export let copy;
export let className = '';

let copyButton;
let copyInput;
let copying = false;

onMount(() => {
    tippy(copyButton, {
        content: 'Copy filtered calendar feed',
        arrow: true,
        duration: [100, 100],
        animation: 'shift-away-subtle'
    });
})

async function copyText(text) {
    copying = true;
    await tick();
    copyInput.value = text;
    copyInput.focus();
    copyInput.select();
    document.execCommand('copy');
    copying = false;
}

</script>

<button class="{className}" on:click={copyText(copy)} bind:this={copyButton}>
    <slot>Button</slot>
</button>
{#if copying}
    <textarea class="copy-input" bind:this={copyInput}></textarea> 
{/if}

<style>
.copy-input {
    width: 0px;
    height: 0px;
}
</style>