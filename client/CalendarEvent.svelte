<script>
    let color = 'rgba(255, 255, 255, 0.1)';
    export let filtered = false;
</script>

<div class="calendar-event" class:filtered style="--bg-color: {color}">

</div>

<style>
.calendar-event {
    background-color: var(--bg-color);
}
.calendar-event.filtered {
    color: rgb(49, 49, 49);
    background-color: rgba(150, 150, 150, 0.747);
}
</style>