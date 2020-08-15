import { ReadableNetworkStore, ListNetworkStore, QueryNetworkStore } from './utility/networkstore';
import type { EventInfo, Filter, Alert, CourseIdentifier } from './api/types';
import * as notifier from './notifications/notifier';
import { derived } from 'svelte/store';
import moment from 'moment';
import { momentToTime, timeToMoment } from './api/schoology';
import { EventHolderStore } from './utility/eventholder';

const errorHandler = (error: Error, retryTime?: number) => {
    const retryingInfo = retryTime !== undefined ? ', retrying...' : '';
    notifier.danger('Network request failed' + retryingInfo, retryTime ?? 2500);
    console.error(error);
};

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

const momentKeyFormat = 'YYYY-MM';
const events = new EventHolderStore(
    5,
    '/calendar/events',
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
    events: typeof events;
    filters: typeof filters;
    identifiers: typeof identifiers;
    alerts: typeof alerts;
};

export { events, filters, alerts, identifiers, alertsByEvent, momentKeyFormat };
