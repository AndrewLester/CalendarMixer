<script context="module">
export const AlertType = {
   DISPLAY: 0,
   EMAIL: 1
};
Object.freeze(AlertType);
</script>


<script>
import SVGButton from './utility/SVGButton.svelte';
import { getContext } from 'svelte';
import { key } from './utility/network.js';

export let id;
export let event_id;
export let timedelta;
export let type;

const { getAPI } = getContext(key);

async function save() {
    const api = await getAPI();

    api.post(`/calendar/alerts`, {
        id,
        type,
        event_id: event_id.toString(),
        timedelta: timedelta.toISOString()
    });
}

function deleteAlert() {
    api.delete(`/calendar/alerts/${id}`);
}

</script>

<SVGButton svgLink={'/static/img/alert.svg'} symbolId={'icon'} clickable={false} />
<span>Id: {id} Alert Time: {timedelta.humanize()} before event</span>

<SVGButton svgLink={'/static/img/failed.svg'} symbolId={'icon'}
                on:click={deleteAlert} />

<style>
</style>