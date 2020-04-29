<script>
    import Modal from './Modal.svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let eventModal;

    function showModal() {
        dispatch('showModal', {modal: eventModal});    
    }
</script>
<Modal bind:this={eventModal}>
    <p>Hello</p>
</Modal>
<button on:click={showModal}>Show</button>
