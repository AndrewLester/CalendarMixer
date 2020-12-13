import { ReadableNetworkStore, ListNetworkStore } from './utility/networkstore';
import type { Filter, Alert, CourseIdentifier, CourseColor } from './api/types';
import * as notifier from './notifications/notifier';
import { derived } from 'svelte/store';
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
const colors = new ListNetworkStore<CourseColor[]>(
    '/calendar/colors',
    [],
    errorHandler
)
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

const colorsByCourseId = derived([colors], ([ values ]) => {
    const colorsMap = new Map<string, CourseColor>();

    for (const color of values) {
        colorsMap.set(color.course.id.toString(), color);
    }

    return colorsMap;
});

export type NetworkStores = {
    events: typeof events;
    filters: typeof filters;
    identifiers: typeof identifiers;
    alerts: typeof alerts;
    colors: typeof colors;
};

export { events, filters, alerts, identifiers, colors, alertsByEvent, colorsByCourseId, momentKeyFormat };
