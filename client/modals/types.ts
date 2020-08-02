import type { SvelteComponent } from 'svelte';

export type ModalFunctions = {
    open(component: any, props: any, modalProps: any): void;
    close(): void;
};
