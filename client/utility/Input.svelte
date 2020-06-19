<script>

export let value;
export let placeholder;
export let type = 'text';
export let width = 60;
export let placeholderFontSize = 0.75;

export let root;
let input;

function handleInput(e) {
    // Deal with conversions from string values to integers
    value = type.match(/^(number|range)$/) ? +e.target.value : e.target.value;
}

export function focus() {
    if (input) {
        input.focus();
    }
}

</script>


<fieldset bind:this={root} style="--input-width: {width}px;">
    <input {type} {value} bind:this={input} on:input={handleInput} placeholder=" " on:blur on:focus>
    <legend><span data-text="{placeholder}" style="font-size: {placeholderFontSize}rem;"></span></legend>
</fieldset>


<style>
fieldset, span, legend {
    position: relative;
}

fieldset {
    --input-width: 60px;
    --input-font-size: 16px;
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
    top: 0;
    left: 0;
    width: max-content;
    line-height: 1;
    transition: transform 150ms, font-size 150ms, color 150ms;
    transform: translate(0px);
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
    font-size: var(--input-font-size);
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
    transform: translateY(calc(var(--input-font-size) + 4px));
    font-size: var(--input-font-size);
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