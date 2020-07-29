<script lang="ts" context="module">
    export interface SearchablePart {
        id: number | string,
        searchablePart?: string
    }

    export interface Match {
        match: {
            start: string;
            match: string;
            end: string;
        };
    }

    export type MatchingSearchablePart = SearchablePart & Partial<Match>;
</script>

<script lang="ts">
    import { Popper } from 'svelte-popper';

    export let element: HTMLElement;
    export let search = '';
    export let options: SearchablePart[] = [];

    let matchingOptions: MatchingSearchablePart[] = [];

    // Creating Matching Option Text
    $: {
        if (search.length === 0) {
            matchingOptions = options;
        } else {
            updateMatches();
        }
    }

    function updateMatches() {
        matchingOptions = [];
        for (let option of options) {
            if (option.searchablePart === undefined) continue;

            const name = option.searchablePart;
            const words = name.split(' ');
            for (let word of words) {
                let identifiedString = name.substring(name.indexOf(word));
                if (
                    identifiedString
                        .toLowerCase()
                        .startsWith(search.toLowerCase())
                ) {
                    const index = name.indexOf(identifiedString);
                    matchingOptions = [
                        ...matchingOptions,
                        {
                            ...option,
                            match: {
                                start: name.substring(0, index),
                                match: name.substring(index, index + search.length),
                                end: name.substring(index + search.length)
                            }
                        },
                    ];
                    break;
                }
            }
        }
    }

    function popperSizeModifier(data) {
        data.styles.width = data.offsets.reference.width;
        data.offsets.popper.left = data.offsets.reference.left;
        return data;
    }

    declare const popperTemplate: HTMLElement;
    const modifiers = {
        onCreate: () => (popperTemplate.style.display = 'flex'),
        modifiers: {
            flip: { enabled: false },
            autoSizing: {
                enabled: true,
                fn: popperSizeModifier,
                order: 840,
            },
        },
    };
</script>

<Popper targetRef={element} className={'identifier-complete'} {modifiers}>
    {#if matchingOptions.length > 0}
        {#each matchingOptions as option (option.id)}
            <slot
                name="item"
                item={option}/>
        {/each}
    {:else}
        <slot name="no-matches" />
    {/if}
</Popper>

<style>
    :global(.identifier-complete) {
        background-color: white;
        box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.302),
            0 2px 6px 2px rgba(60, 64, 67, 0.149);
        border-radius: 5px;
        padding: 7px 0px;
        overflow-y: auto;
        max-height: 200px;
        width: 100%;
        flex-wrap: wrap;
        z-index: 200;
    }

    :global(.identifier-complete) > :global(*) {
        flex: 1 0 100%;
        text-overflow: ellipsis;
        height: 30px;
        padding: 10px 0px;
        text-align: center;
        font-size: 12px;
        line-height: 20px;
        display: flex;
    }
</style>
