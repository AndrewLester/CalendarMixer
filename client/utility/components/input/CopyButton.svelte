<script lang="ts">
import { onMount, tick } from 'svelte';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away-subtle.css';

export let copy: string;
export let className = '';

let copyButton: HTMLElement;
let copyInput: HTMLElement;
let copying = false;

onMount(() => {
    tippy(copyButton, {
        content: 'Copy filtered calendar feed',
        arrow: true,
        duration: [100, 100],
        animation: 'shift-away-subtle'
    });
})

async function copyText(text: string) {
    const copyTextArea = copyInput as HTMLTextAreaElement;

    copying = true;
    await tick();
    copyTextArea.value = text;
    copyTextArea.focus();
    copyTextArea.select();
    document.execCommand('copy');
    copyTextArea.value = '';
    copying = false;
}

</script>

<button class="{className}" on:click={() => copyText(copy)} bind:this={copyButton}>
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