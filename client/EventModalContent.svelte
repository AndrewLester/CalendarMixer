<script>
import SVGButton from './utility/SVGButton.svelte';
import MoreText from './utility/MoreText.svelte';
import Alert, { AlertType } from './Alert.svelte';
import moment from './libraries/moment.min.js';
import { getContext } from 'svelte';
import { derived } from 'svelte/store';

export let eventInfo;
export let start;
export let end;
export let filtered;

$: alertSvgLink = filtered ? '/static/img/alerts-off.svg' : '/static/img/add-alert.svg';

const { close } = getContext('simple-modal');
const { alerts: allAlerts } = getContext('stores');

const alerts = derived(allAlerts, ($alerts) => {
    return $alerts.filter(alert => alert.event_id == eventInfo['id']);
});


function addAlert() {
    const newAlert = {
        id: -1,
        event_id: eventInfo['id'].toString(),
        timedelta: moment.duration(15, 'minutes').toISOString(),
        type: AlertType.DISPLAY
    };

    // Don't update the store value yet, but post the newAlert over the network
    // Then call reset to update the store value by GETting the new Alert
    allAlerts.set(newAlert, [...$allAlerts])
    allAlerts._reset();
}

</script>

<div class="body">
    <div class="header">
        <span class="schoology-icon" data-event-type="{eventInfo.type}"></span>
        <h1 class="event-name" title="{eventInfo.title}">{@html eventInfo.title}</h1>
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
                <span class="value">{start.format('MMMM Do YYYY, h:mm a')} - {end.format('MMMM Do YYYY, h:mm a')}</span>
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
        <div>
            <SVGButton svgLink={alertSvgLink} symbolId={"icon"} clickable={!filtered} 
                text={filtered ? 'This event isn\'t exported' : 'Add an alert'}
                on:click={addAlert} />
        </div>
        <fieldset disabled={filtered}>
            {#each $alerts as alert (alert.id)}
                <Alert {...alert} />
            {/each}
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
    position: relative;
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
    z-index: 2;
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
</style>
