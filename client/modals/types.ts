import type { SvelteComponent } from 'svelte';


export type ModalFunctions = {
    open(component: typeof SvelteComponent, props: any, modalProps: any),
    close()
}