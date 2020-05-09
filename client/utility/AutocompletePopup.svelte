<script>
import { Popper } from "svelte-popper";

export let element;
export let options = [];

function popperSizeModifier(data) {
    data.styles.width = data.offsets.reference.width;
    data.offsets.popper.left = data.offsets.reference.left;
    return data;
}

const modifiers = {
    onCreate: () => popperTemplate.style.display = 'flex',
    modifiers: {
        flip: { enabled: false },
        autoSizing: {
            enabled: true,
            fn: popperSizeModifier,
            order: 840,
        }
    }
}

</script>

<Popper targetRef={element} className={"identifier-complete"}
  {modifiers} >
    {#each options as option (option.id)}
        <slot item={option}></slot>
    {/each}
</Popper>

<style>
:global(.identifier-complete) {
    background-color: white;
    box-shadow: 0 1px 2px 0 rgba(60,64,67,0.302), 0 2px 6px 2px rgba(60,64,67,0.149);
    border-radius: 5px;
    padding: 7px 0px;
    overflow-y: auto;
    max-height: 200px;
    flex-wrap: wrap;
}

:global(.identifier-complete) > :global(*) {
    flex: 1 0 100%;
    text-overflow: ellipsis;
    height: 30px;
    padding: 10px 0px;
    text-align: center;
    font-size: 12px;
    line-height: 20px;
}

:global(.identifier-complete) > :global(*:not(p):hover), :global(.identifier-complete) > :global(*.selected) {
    cursor: pointer;
    background-color: rgba(128, 128, 128, 0.2);
}
</style>