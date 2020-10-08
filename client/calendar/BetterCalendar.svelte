<script lang="ts">
import {fade} from 'svelte/transition'
import type moment from 'moment'

export let month: object;
let changes: object[] = [];
</script>

{#key month}
    {#if (changes = [...changes, month], true)}
        <div></div>
    {/if}
    <p in:fade={{duration: 5000}}>{changes}</p>
{/key}