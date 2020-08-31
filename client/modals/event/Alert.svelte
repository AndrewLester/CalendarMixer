<script lang="ts">
import TimePicker from '../../utility/components/input/TimePicker.svelte';
import SVGButton from '../../utility/components/SVGButton.svelte';
import { getContext } from 'svelte';
import * as networking from '../../api/network';
import moment from 'moment';
import type { NetworkStores } from '../../stores';
import type { Alert } from '../../api/types';
import { AlertType } from '../../api/types';
import type { Networking } from '../../api/network';

export let id: number;
export let event_id: string;
export let timedelta: string;
export let type: AlertType;
export let exported: boolean;

let pickerParent;
let popperVisible = false;

const getAPI: () => Promise<Networking> = getContext(networking.key);
const { alerts }: NetworkStores = getContext('stores');
const alertsLoaded = alerts.loaded;

$: relativetime = moment.duration(timedelta);
$: alertTimeString =
    relativetime.asMilliseconds() === 0
        ? 'At time of event'
        : `${durationToString(relativetime)} before`;

async function save() {
    if (!$alertsLoaded) return;

    const alertData = {
        id,
        type,
        event_id,
        timedelta: relativetime.toISOString(),
    };

    await alerts.update(alertData, 'id');
}

async function deleteAlert() {
    if (!$alertsLoaded) return;

    await alerts.deleteByKey('id', id);
}

function closePopper() {
    popperVisible = false;
    save();
}

function togglePopper() {
    if (popperVisible) {
        closePopper();
    } else {
        popperVisible = true;
    }
}

function durationToString(duration) {
    let unit;

    if (duration.asDays() % 1 === 0) {
        unit = 'day';
    } else if (duration.asHours() % 1 === 0) {
        unit = 'hour';
    } else {
        unit = 'minute';
    }

    let value = duration.as(unit);
    return `${value} ${unit}${value === 1 ? '' : 's'}`;
}
</script>

<span class="left">
    <SVGButton
        svgLink={exported ? '/static/img/alert.svg' : '/static/img/alerts-off.svg'}
        symbolId={'icon'}
        disabled={true} />
    <span>
        <em>{type === AlertType.Display ? 'Notification' : 'Email'}</em>
    </span>
</span>

<span class="center" bind:this={pickerParent}>
    <span>Time:</span>
    <span on:mousedown|stopPropagation class="change-time-button">
        <SVGButton
            svgLink={'/static/img/time-select.svg'}
            symbolId={'icon'}
            on:click={togglePopper}
            text={alertTimeString}
            disabled={!exported} />
    </span>
    {#if pickerParent && popperVisible}
        <TimePicker
            parentElement={pickerParent}
            bind:duration={relativetime}
            on:close={closePopper} />
    {/if}
</span>

<span class="right">
    <SVGButton
        svgLink={'/static/img/failed.svg'}
        symbolId={'icon'}
        on:click={deleteAlert} />
</span>

<style>
.center {
    position: relative;
    line-height: 24px;
    height: 24px;
}
.left,
.center,
.right {
    display: flex;
    align-items: center;
    flex: 0 1 33%;
    min-width: min-content;
}

.left {
    justify-content: start;
    margin-right: 5px;
}
.right {
    justify-content: flex-end;
    margin-left: 5px;
}
.center {
    justify-content: start;
    flex: 1 0 auto;
}
.center > .change-time-button {
    margin-left: 5px;
}
</style>
