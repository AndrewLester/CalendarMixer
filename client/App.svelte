<script lang="ts" context="module">
declare const colors: string[];
declare const csrf_token: string;
declare const ical_link: string;
</script>

<script lang="ts">
import Modal from './utility/components/Modal.svelte';
import NotificationDisplay from './notifications/NotificationDisplay.svelte';
import HTMLEntityDecoder from './utility/html_entity_decoder/HTMLEntityDecoder.svelte';
import Calendar from './calendar/Calendar.svelte';
import FilterEditor from './filtering/FilterEditor.svelte';
import CopyButton from './utility/components/CopyButton.svelte';
import SVGButton from './utility/components/SVGButton.svelte';
import { onMount, setContext, tick } from 'svelte';
import moment from 'moment';
import type { Networking } from './api/network';
import * as networking from './api/network';
import { events, filters, identifiers, alerts } from './stores';

let api: Networking | undefined;
// The tick call here waits for this component to mount, allowing the api variable to be set before
// Sub-Components can use it from the context. Another option is wrapping the Calendar and FilterEditor
// with an if (api) statement
const getAPI = async () => {
    if (api) return api;

    await tick();
    return api;
};

setContext(networking.key, getAPI);
setContext('stores', {
    events,
    filters,
    identifiers,
    alerts,
});

let definedColors: string[];
let csrfToken: string;
let icalLink: string;

// Updated by the monthChange event on the Calendar component
let month = moment().startOf('month');

let calendar: Calendar;
let calendarViewer: HTMLElement | undefined;
let condensed = true;

let monthButtonWidth: number | undefined;
$: monthButtonTextFormat =
    monthButtonWidth && monthButtonWidth < 100 ? 'MMM' : 'MMMM';
$: currentMonthFormat =
    monthButtonWidth && monthButtonWidth < 100 ? 'MMM YYYY' : 'MMMM YYYY';

onMount(() => {
    definedColors = colors;
    csrfToken = csrf_token;
    icalLink = ical_link;

    api = networking.mountNetworking(csrfToken);
    events.setAPI(api);

    filters.setAPI(api);
    filters.reset();

    identifiers.setAPI(api);
    identifiers.reset();

    alerts.setAPI(api);
    alerts.reset();
});
</script>

<HTMLEntityDecoder />
<NotificationDisplay options={{ timeout: 2500, width: '200px' }} />
<Modal
    styleContent={{ padding: 0 }}
    styleWindow={{ 'margin-top': 'calc(2rem + 50px)', 'will-change': 'transform' }}>
    <main>
        <div id="calendar-viewer" bind:this={calendarViewer}>
            <div id="button-bar">
                <span>
                    <SVGButton
                        svgLink={'/static/img/today-black-18dp.svg'}
                        symbolId={'icon'}
                        on:click={() => calendar.goToToday()} />
                </span>
                <p id="current-month">{month.format(currentMonthFormat)}</p>
                <button
                    on:click={() => calendar.navigateMonths(-1)}
                    class="large-button"
                    bind:clientWidth={monthButtonWidth}>
                    ← {moment(month).subtract(1, 'months').format(monthButtonTextFormat)}
                </button>
                <button
                    on:click={() => calendar.navigateMonths(1)}
                    class="large-button">
                    {moment(month)
                        .add(1, 'months')
                        .format(monthButtonTextFormat)} →
                </button>
                <label class="calendar-option" for="condensed-checkbox">
                    Condensed:
                </label>
                <input
                    class="calendar-option"
                    type="checkbox"
                    bind:checked={condensed} />
                {#if icalLink}
                    <CopyButton
                        copy={icalLink}
                        className="calendar-option small-button">
                        EXPORT CALENDAR
                    </CopyButton>
                {/if}
            </div>
            <Calendar
                condensed={true}
                bind:this={calendar}
                on:monthChange={(event) => (month = event.detail)} />
        </div>
        <FilterEditor />
    </main>
</Modal>

<style>
:root {
    --header-height: 50px;
}
:global(body) {
    margin: 0px;
}
main {
    display: flex;
    flex-wrap: wrap;
    height: calc(100vh - var(--header-height));
    width: 100%;
    margin: 0px 8px;
    overflow: hidden;
}
#current-month {
    margin-left: 1px;
    display: inline-block;
    width: 140px;
}
#current-month.matching {
    font-weight: bold;
    color: #29b6f6;
}
#button-bar > :global(*:first-child) {
    margin-left: 10px;
}
#button-bar {
    width: 100%;
    margin-bottom: 1px;
}
#button-bar button {
    width: 15%;
    min-width: 75px;
}
#button-bar input[type='checkbox'] {
    vertical-align: middle;
}
#calendar-viewer {
    flex: 0 0 auto;
    width: 75%;
    /* Account for padding */
    height: calc(100% - 8px);
    padding-top: 8px;
    overflow: hidden;
}
#button-bar :global(.small-button) {
    float: right;
}
:global(body) {
    overflow: hidden;
}
:global(*) {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
:global(*:focus) {
    outline: none;
}
:global(p) {
    margin: 0px;
}
:global(button.large-button),
:global(input[type='submit']) {
    -webkit-tap-highlight-color: transparent;
    border-radius: 5px;
    font-size: 15px;
    color: white;
    transition: all 0.2s ease;
    border: 1px solid white;
    background-color: #29b6f6;
    max-width: 200px;
    width: 75%;
    height: 40px;
}

:global(button.large-button:hover),
:global(input[type='submit']:hover) {
    cursor: pointer;
    background-color: white;
    color: #29b6f6;
    border: 1px solid #29b6f6;
    box-shadow: 0px 0px 1px 1px rgba(0, 0, 0, 0.2);
}

:global(button.large-button:active),
:global(input[type='submit']:active) {
    box-shadow: inset 1px 1px 1px rgba(0, 0, 0, 0.2);
    border-color: rgba(0, 0, 0, 0.8);
}
:global(.small-button) {
    color: #29b6f6;
    -webkit-tap-highlight-color: transparent;
    background: none;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 15px;
    height: 40px;
    transition: all 0.15s ease;
}
:global(.small-button:hover) {
    background-color: rgba(41, 182, 246, 0.1);
}
:global(.small-button:active) {
    box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.1);
    background-color: rgba(54, 188, 250, 0.33);
}
:global(.window) > :global(.content) {
    position: initial;
}
:global(.toasts) {
    top: unset !important;
    bottom: 0;
}
@media only screen and (max-width: 850px) {
    :global(.calendar-option) {
        display: none;
    }
}
@media only screen and (max-width: 1015px) {
    main {
        height: auto;
        overflow-y: scroll;
    }
    #calendar-viewer {
        height: auto;
        max-height: 100vh;
        flex: 1 0 auto;
    }
}
@media only screen and (max-width: 400px) {
    #current-month {
        width: 90px;
    }
}
</style>
