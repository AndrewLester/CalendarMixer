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
import moment from './libraries/moment.min.js';

export let id;
export let event_id;
export let timedelta;
export let type;
export let exported;

const getAPI = getContext(key);
const { alerts } = getContext('stores');

$: relativetime = moment.duration(timedelta);

async function save() {
    const alertData = {
        id,
        type,
        event_id: event_id.toString(),
        timedelta: timedelta.toISOString()
    };

    $alerts[parseInt(event_id)] = [alertData, ...$alerts[parseInt(event_id)].fiter((alert) => alert.id !== id)];

    alerts.set(alertData, $alerts)
}

async function deleteAlert() {
    const api = await getAPI();

    api.delete(`/calendar/alerts/${id}`).then(() => alerts._reset());
}

</script>

<SVGButton svgLink={'/static/img/alert.svg'} symbolId={'icon'} clickable={false} />
<span>Id: {id} Alert Time: {relativetime.humanize()} before event</span>

<SVGButton svgLink={'/static/img/failed.svg'} symbolId={'icon'}
    on:click={deleteAlert} />

<style>
</style>