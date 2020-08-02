<script lang="ts">
    import { fade } from 'svelte/transition';

    export let simple = false;
</script>

{#if simple}
    <slot name="simple" />
{:else}
    <div class="wrapper" transition:fade={{ duration: 200 }}>
        <slot>
            <!-- Default skeleton layout is a single bar -->
            <div />
        </slot>
    </div>
{/if}

<style>
    .wrapper {
        width: auto;
        height: auto;
    }

    .wrapper :global(input[type='text']),
    .wrapper :global(p),
    .wrapper :global(legend),
    .wrapper :global(div:empty),
    .wrapper :global(label),
    .wrapper :global(span),
    :global(.skeleton-bar) {
        /* Color transparent hides text, but allows the text to define the width and height */
        max-height: 20px;
        color: transparent;
        opacity: 1;
        border-radius: 3px;
        overflow: hidden;
        transform: none;
        background-repeat: no-repeat;
        background-image: linear-gradient(
            to right,
            rgba(190, 190, 190, 0.4),
            rgba(206, 206, 206, 0.2),
            rgba(190, 190, 190, 0.4)
        );
        background-size: 200% 100%;
        animation: loading 1s infinite ease;
    }

    .wrapper :global(::placeholder) {
        color: transparent;
    }

    @keyframes -global-loading {
        50% {
            background-position: 100% 0px;
        }
        100% {
            background-position: 0px 0px;
        }
    }
</style>
