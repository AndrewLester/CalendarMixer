<script>
import SVGButton from './utility/SVGButton.svelte';
import MoreText from './utility/MoreText.svelte';
import Alert, { AlertType } from './Alert.svelte';
import moment from './libraries/moment.min.js';
import { getContext } from 'svelte';
import { derived } from 'svelte/store';
import { flip } from 'svelte/animate';
import { fade, fly } from 'svelte/transition';
import { cubicInOut } from 'svelte/easing';

export let eventInfo;
export let start;
export let end;
export let filtered;

let endTimeFormat;
$: if (eventInfo.has_end && !eventInfo.all_day) {
    if (moment(end).startOf('day').diff(moment(start).startOf('day'), 'days') > 0) {
        endTimeFormat = 'MMMM Do YYYY, h:mm a';
    } else {
        endTimeFormat = 'h:mm a';
    }
}
$: alertSvgLink = filtered ? '/static/img/alerts-off.svg' : '/static/img/add-alert.svg';

const { close } = getContext('simple-modal');
const { alerts } = getContext('stores');

function addAlert() {
    if (filtered) {
        return;
    }

    const newAlert = {
        id: -1,
        event_id: eventInfo['id'].toString(),
        timedelta: moment.duration(15, 'minutes').toISOString(),
        type: AlertType.DISPLAY
    };

    // Don't update the store value yet, but post the newAlert over the network
    // Then call reset to update the store value by GETting the new Alert
    alerts.update(newAlert, null).then(() => alerts._reset());
}

</script>

<div class="body">
    <div class="header">
        <span class="schoology-icon" data-event-type="{eventInfo.type}" style="--picture-offset: {start.date() - 1}"></span>
        <h1 class="event-name" title="{eventInfo.title}">{eventInfo.title}</h1>
        <SVGButton svgLink={'/static/img/failed.svg'} symbolId={'icon'}
                on:click={close} />
    </div>
    <p class="date">
        <span class="key">Time: </span>
        {#if eventInfo.all_day}
            <span class="emphasized value">All Day</span>
        {:else}
            {#if !eventInfo.has_end}
                <span class="value">{start.format('MMMM Do YYYY, h:mm a')}</span>
            {:else}
                <span class="value">{start.format('MMMM Do YYYY, h:mm a')} - {end.format(endTimeFormat)}</span>
            {/if}
        {/if}
    </p>
    <p class="exported-section">
        <span class="key">Exported:</span>
        <span class="value">{filtered ? 'False' : 'True'}</span>
    </p>
    <p>
        <span class="key">Description:</span> 
        <span class="value" class:emphasized={!eventInfo.description}>
            <MoreText text={eventInfo.description || 'No Description'} maxLen={42} />
        </span>
    </p>
    <div class="section alerts" class:filtered>
        <p style="text-align: center;"><span class="key">Alerts</span></p>
        <div style="margin-top: 5px; margin-bottom: 1px;">
            <SVGButton svgLink={alertSvgLink} symbolId={"icon"} clickable={!filtered} 
                text={filtered ? 'This event isn\'t exported' : 'Add an alert'}
                on:click={addAlert} />
        </div>
        <fieldset>
            {#if $alerts[eventInfo['id']] && $alerts[eventInfo['id']].length > 0 }
                {#each $alerts[eventInfo['id']] as alert (alert.id)}
                    <div animate:flip={{ duration: 100 }} out:fade={{ duration: 100 }}
                        in:fly={{ y: 20, duration: 100, easing: cubicInOut }} class="alert-wrapper">
                        <Alert {...alert} exported={!filtered} />
                    </div>
                {/each}
            {:else}
                <p style="text-align: center;" in:fade|self={{ duration: 100, delay: 100 }}><em>No Alerts</em></p>
            {/if}
        </fieldset>
    </div>
</div>

<style>
.emphasized {
    font-style: italic;
}
.key {
    font-weight: 600;
}
span.schoology-icon {
    display: inline-block;
    vertical-align: middle;
    width: 30px;
    height: 30px;
    background-image: url('https://app.schoology.com/sites/all/themes/schoology_theme/images/icons_sprite_large.png?5ebdad6618476497');
}
h1 {
    font-size: 1.2rem;
    margin: 0px;
}
div.section, .body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
.body {
    padding: 1rem;
}
.body > * {
    width: 100%;
    margin-bottom: 5px;
}
span.schoology-icon[data-event-type="assignment"] {
    background-position: 0 -40px;
}
span.schoology-icon[data-event-type="event"] {
    background-position: 0 calc(-40px * var(--picture-offset));
    background-image: url('https://app.schoology.com/sites/all/themes/schoology_theme/images/icons_sprite_calendar_large.png?5ec6b32722ee47a9');
}
h1.event-name {
    margin: 0px auto;
    height: 30px;
    line-height: 30px;
}
.header .schoology-icon {
    margin-left: 15px;
    margin-right: 10px;
}
.header {
    box-shadow: 0px 5px 5px 0px rgba(0, 0, 0, 0.3);
    position: sticky;
    padding: 5px;
    z-index: 5;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    top: 0px;
    margin-bottom: 15px;
    /* Ignore parrent padding */
    width: calc(100% + 2rem);
    background-color: white;
}
.header > :global(*) {
    flex: 0 0 auto;
}
.header :global(.icon-button) {
    margin-right: 15px;
    margin-left: 10px;
}
.header .event-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex: 0 1 auto;
}
div.alerts > fieldset {
    width: 100%;
}
.alert-wrapper {
    display: flex;
    align-items: center;
    line-height: 24px;
}
.alert-wrapper:not(:last-child) {
    margin-bottom: 5px;
}
</style>
