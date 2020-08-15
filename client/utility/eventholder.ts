import type { EventInfo } from '../api/types';
import moment from 'moment';
import { QueryNetworkStore, ErrorHandler, KeyMap } from './networkstore';
import { timeToMoment } from '../api/schoology';
import { get } from 'svelte/store';

const momentKeyFormat = 'YYYY-MM';

export class EventHolderStore extends QueryNetworkStore<EventInfo, { start: string; end: string }> {
    constructor(
        private capacity: number,
        endpoint: string,
        fetchErrorHandler: ErrorHandler = () => { }
    ) {
        super(endpoint, undefined, EventHolderStore.objectDiscriminator, 'id', fetchErrorHandler);
    }

    private static objectDiscriminator(eventInfo: EventInfo): string[] {
        const dates = [] as string[];
        const startMoment = timeToMoment(eventInfo.start);
        const startMonth = startMoment.month();
        const endMoment = eventInfo.has_end ? timeToMoment(eventInfo.end as string) : undefined;
        const endMonth = endMoment ? Math.max(startMonth + 1, endMoment.month() + 1) : startMonth + 1;
        const yearDiff = endMoment ? endMoment.year() - startMoment.year() : 0;

        for (let i = startMonth; i < endMonth + (12 * yearDiff); i++) {
            const formatted = moment(startMoment).month(i).format(momentKeyFormat);
            dates.push(formatted);
        }
        return dates;
    }

    view(month: moment.Moment) {
        const halfCapacity = Math.floor(this.capacity / 2);
        const requiredKeys = new Set<string>();

        const storeValue = get(this.store);
        const queries = [] as Promise<string>[];

        if (!storeValue.has(month.format(momentKeyFormat))) {
            console.log('DOWNLOAD REQUIRED');
            this._loaded = false;
        }

        for (let i = 0; i < this.capacity; i++) {
            const monthMoment = moment(month).add(i - halfCapacity, 'months');
            const monthKey = monthMoment.format(momentKeyFormat);
            requiredKeys.add(monthKey);

            // Setup missing month keys and query data for them
            if (!storeValue.has(monthKey)) {
                // Add any missing month keys not found in 
                // the initial query to the "/events" endpoint
                this.store.update((map) => {
                    if (!map.has(monthKey)) {
                        map.set(monthKey, new Map<string, EventInfo>() as KeyMap<EventInfo>);
                        this.storeValue = map;
                    }
                    return map;
                });
    
                // TODO: Query several months data together
                queries.push(this.query({
                    start: moment(monthMoment)
                        .startOf('month')
                        .format('YYYY-MM-DD'),
                    end: moment(monthMoment)
                        .startOf('month')
                        .add(1, 'month')
                        .format('YYYY-MM-DD'),
                }));
            }
        }

        // Remove unused keys that are still in the store
        for (let key of storeValue.keys()) {
            if (!requiredKeys.has(key as string)) {
                this.store.update((map) => {
                    map.delete(key);
                    return map;
                })
            }
        }

        Promise.all(queries).then((queries) => {
            console.log('setting loaded here');
            console.log(get(this.store));
            this._loaded = true;
            this.store.update((map) => {
                console.log(map);
                return map;
            });
        })
    }
}
