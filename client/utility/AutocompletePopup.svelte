<script>

export let options = [];

</script>

<div class="autocomplete-popup-item-wrapper">
    {#each options as option (option)}
        <slot item={option}></slot>
    {/each}
</div>

<style>
.autocomplete-popup-item-wrapper {
    position: absolute;
    display: flex;
    justify-content: space-between;
}
</style>