<script lang="ts">
    type InputElementType = 'text' | 'submit' | 'number' | 'range';

    export let value: string | number;
    export let placeholder: string;
    export let type: InputElementType = 'text';
    export let width = 60;
    export let placeholderFontSize = 0.75;

    export let root: HTMLElement;
    let input: HTMLElement;

    function handleInput(e: Event) {
        // Deal with conversions from string values to integers
        const eventTarget = e.target as HTMLInputElement;
        if (type === 'number' || type === 'range') {
            value = parseInt(eventTarget.value);
        } else {
            value = eventTarget.value;
        }
    }

    export function focus() {
        if (input) {
            input.focus();
        }
    }
</script>

<fieldset bind:this={root} style="--input-width: {width}px;">
    <input
        {type}
        {value}
        bind:this={input}
        on:input={handleInput}
        placeholder="
        "
        on:blur
        on:focus />
    <legend>
        <span
            data-text={placeholder}
            style="font-size: {placeholderFontSize}rem;" />
    </legend>
</fieldset>

<style>
    fieldset,
    span,
    legend {
        position: relative;
    }

    fieldset {
        --input-width: 60px;
        --input-size: 16;
        --input-font-size: calc(var(--input-size) * 1px);
        border: 2px solid gray;
        margin-right: 10px;
        position: relative;
        border-radius: 3px;
        width: var(--input-width);
        transition: border-color 200ms ease-out;
    }

    fieldset:focus-within {
        border-color: #29b6f6;
    }

    legend {
        height: var(--input-font-size);
        line-height: var(--input-font-size);
    }

    span::before {
        position: absolute;
        width: max-content;
        bottom: 0;
        line-height: 1;
        font-size: var(--input-font-size);
        transition: transform 150ms, color 150ms;
        transform-origin: left;
        transform: translate(0px) scale(calc(12 / var(--input-size)));
        color: #29b6f6;
        pointer-events: none;
        content: attr(data-text);
        opacity: 1;
    }

    input {
        width: var(--input-width);
        opacity: 1;
        border: none;
        transition: opacity 200ms ease-out 200ms;
    }

    span::after {
        content: attr(data-text);
        position: relative;
        display: inline-block;
        opacity: 0;
    }

    input:placeholder-shown:not(:focus) + legend span::after {
        content: '';
    }

    input:placeholder-shown:not(:focus) + legend span::before {
        /* Calculate ratio from old font size to new font size to put into scale transform */
        transform: translateY(calc(var(--input-font-size) + 3.5px)) scale(1);
        color: gray;
        width: max-content;
        padding-left: 2px;
    }

    input:not(:focus):not(:placeholder-shown) + legend span::before {
        color: gray;
    }

    input:placeholder-shown:not(:focus) + legend {
        padding: 0px;
    }
</style>
