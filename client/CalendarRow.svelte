<script>
export let events = [];
export let skeleton = false;
</script>

<div class="calendar-row">
    <div class="header">
    </div>
    <div class="event-row">
        {#each events as event}
            <div>
            <p>{event}</p>
            </div>
        {/each}
    </div>
</div>

<style>

</style>
