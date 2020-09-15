<script context="module" lang="ts">

let makeReady: (decode: (text: string) => Promise<string>) => void;
let ready: Promise<any>;

function reset() {
    ready = new Promise((resolve) => makeReady = resolve);
}

reset();

export async function decode(text: string): Promise<string> {
    let componentDecode = await ready;
    return await componentDecode(text);
}
</script>

<script lang="ts">
console.log('Component start');
import { onDestroy, onMount } from "svelte";

let textarea: HTMLTextAreaElement;

onMount(() => makeReady(decode));

async function decode(text: string): Promise<string> {
    if (!text.includes('&')) {
        return text;
    }

    await ready;

    textarea.innerHTML = text;
    console.log(textarea.innerHTML, textarea.value);
    return textarea.value;
}

onDestroy(reset);
</script>

<textarea class="decoder-area" bind:this={textarea}></textarea>

<style>
.decoder-area {
    display: none;
}
</style>
