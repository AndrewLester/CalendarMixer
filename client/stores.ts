import { ReadableNetworkStore, ListNetworkStore } from './utility/networkstore';
import type { EventInfo, Filter, Alert, CourseIdentifier } from './api/types';
import * as notifier from './notifications/notifier';
import { derived } from 'svelte/store';

const errorHandler = (error: Error, retryTime?: number) => {
    const retryingInfo = retryTime !== undefined ? ', retrying...' : '';
    notifier.danger('Network request failed' + retryingInfo, retryTime ?? 2500);
    console.error(error);
};

const events = new ReadableNetworkStore<EventInfo[]>(
    '/calendar/events',
    [],
    errorHandler
);
const filters = new ListNetworkStore<Filter[]>(
    '/calendar/filter',
    [],
    errorHandler
);
const alerts = new ListNetworkStore<Alert[]>(
    '/calendar/alerts',
    [],
    errorHandler
);
const identifiers = new ReadableNetworkStore<CourseIdentifier[]>(
    '/calendar/identifiers',
    [],
    errorHandler
);

const alertsByEvent = derived([alerts], ([ values ]) => {
    const alertsMap = new Map<string, Alert[]>();

    for (const alert of values) {
        const alertsForEvent = alertsMap.get(alert.event_id) ?? [];
        alertsForEvent.push(alert);
        alertsMap.set(alert.event_id, alertsForEvent);
    }

    return alertsMap;
});

export type NetworkStores = {
    events: ReadableNetworkStore<EventInfo[]>;
    filters: ListNetworkStore<Filter[]>;
    identifiers: ReadableNetworkStore<CourseIdentifier[]>;
    alerts: ListNetworkStore<Alert[]>;
};

export { events, filters, alerts, identifiers, alertsByEvent };
