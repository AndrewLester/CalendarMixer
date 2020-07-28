import { NetworkStore } from "./utility/networkstore";
import { EventInfo, Filter, Alert, CourseIdentifier } from "./api/types";
import * as notifier from './notifications/notifier';


const errorHandler = (error: Error) => {
    notifier.danger('Network request failed', 2500);
    console.error(error);
}


const events = new NetworkStore<EventInfo[]>(
    '/calendar/events',
    undefined,
    false,
    errorHandler
);
const filters = new NetworkStore<Filter[]>(
    '/calendar/filter',
    undefined,
    true,
    errorHandler
);
const alerts = new NetworkStore<Alert[]>(
    '/calendar/alerts',
    undefined,
    true,
    errorHandler
);
const identifiers = new NetworkStore<CourseIdentifier[]>(
    '/calendar/identifiers',
    undefined,
    false,
    errorHandler
);


type NetworkStores = {
    events: NetworkStore<EventInfo[]>,
    filters: NetworkStore<Filter[]>,
    identifiers: NetworkStore<CourseIdentifier[]>,
    alerts: NetworkStore<Alert[]>
}


export { NetworkStores, events, filters, alerts, identifiers };
