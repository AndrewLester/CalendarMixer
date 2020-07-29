import { NetworkStore } from "./utility/networkstore";
import type { EventInfo, Filter, Alert, CourseIdentifier } from "./api/types";
import * as notifier from './notifications/notifier';


const errorHandler = (error: Error) => {
    notifier.danger('Network request failed', 2500);
    console.error(error);
}


const events = new NetworkStore<EventInfo[]>(
    '/calendar/events',
    [],
    false,
    errorHandler
);
const filters = new NetworkStore<Filter[]>(
    '/calendar/filter',
    [],
    true,
    errorHandler
);
const alerts = new NetworkStore<Alert[]>(
    '/calendar/alerts',
    [],
    true,
    errorHandler
);
const identifiers = new NetworkStore<CourseIdentifier[]>(
    '/calendar/identifiers',
    [],
    false,
    errorHandler
);


export type NetworkStores = {
    events: NetworkStore<EventInfo[]>,
    filters: NetworkStore<Filter[]>,
    identifiers: NetworkStore<CourseIdentifier[]>,
    alerts: NetworkStore<Alert[]>
}

export { events, filters, alerts, identifiers };
