<script lang="ts">
import { notification } from './store';
import { onMount, onDestroy } from 'svelte';
import { themes } from './themes';
import type { Theme } from './themes';
import { flip } from 'svelte/animate';

interface Toast {
    id: number;
    msg: string;
    background: string;
    timeout: number;
    width: string;
}

export let options;
const DEFAULT_OPTIONS = {
    timeout: 3000,
    width: '40vw',
};
$: o = Object.assign({}, DEFAULT_OPTIONS, options || {});
let count = 0;
let toasts: Toast[] = [];
let toastsElement: HTMLElement;
onMount(() => {
    toastsElement.style.setProperty('--width', o.width);
});

function animateOut(
    node: Node,
    { delay = 20, duration = 300 }
): SvelteTransitionConfig {
    return {
        delay,
        duration,
        css: (t) =>
            `opacity: ${t - 0.5}; 
                transform-origin: top right;
                transform: scaleX(${t - 0.5});`,
    };
}

function createToast(msg: string, theme: Theme, timeout: number): void {
    const background = themes[theme];
    toasts = [
        {
            id: count,
            msg,
            background,
            timeout: timeout || o.timeout,
            width: '100%',
        },
        ...toasts,
    ];
    count = count + 1;
}

const unsubscribe = notification.subscribe((value) => {
    if (!value) {
        return;
    }

    createToast(value.message, value.type, value.timeout);
    notification.set(null);
});

onDestroy(unsubscribe);

function removeToast(id: number) {
    toasts = toasts.filter((t) => t.id != id);
}
</script>

<ul class="toasts" bind:this={toastsElement}>
    {#each toasts as toast (toast.id)}
        <li
            class="toast"
            style="background: {toast.background};"
            out:animateOut>
            <div class="content">{toast.msg}</div>
            <div
                class="progress"
                style="animation-duration: {toast.timeout}ms;"
                on:animationend={() => removeToast(toast.id)} />
        </li>
    {/each}
</ul>

<style>
.toasts {
    list-style: none;
    position: fixed;
    top: 0;
    right: 0;
    padding: 0;
    margin: 0;
    z-index: 10;
}

.toasts > .toast {
    position: relative;
    margin: 10px;
    min-width: var(--width);
    animation: animate-in 350ms forwards;
    color: white;
}

.toast > .content {
    padding: 10px;
    display: block;
    font-weight: 500;
}

.toast > .progress {
    position: absolute;
    bottom: 0;
    background-color: rgb(0, 0, 0, 0.3);
    height: 6px;
    width: 100%;
    animation-name: shrink;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
}

@keyframes animate-in {
    0% {
        opacity: 0;
        transform: scale(1.15) translateY(20px);
    }
    100% {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@keyframes shrink {
    0% {
        width: var(--width);
    }
    100% {
        width: 0;
    }
}
</style>
