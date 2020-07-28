<script lang="ts">
export let text: string;
export let maxLen = 36;

const originalMaxLen = maxLen;

let showingMore = false;

$: shownText = text.substring(0, Math.min(maxLen, text.length));

function toggleShowMore() {
    if (showingMore) {
        maxLen = originalMaxLen;
        showingMore = false;
    } else {
        maxLen = text.length;
        showingMore = true;
    }
}
</script>

{shownText}
{#if text.length > maxLen || showingMore}
    {(showingMore ? '' : '...')}
    <span on:click={toggleShowMore} class="show-more-button">Show {showingMore ? 'less' : 'more'}</span>
{/if}

<style>
.show-more-button {
    color: blue;
    text-decoration: underline;
    cursor: pointer;
}
</style>