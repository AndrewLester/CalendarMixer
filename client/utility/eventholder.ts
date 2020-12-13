import type { EventInfo } from '../api/types';
import moment from 'moment';
import { QueryNetworkStore, ErrorHandler, KeyMap, StoreType } from './networkstore';
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
        const endMoment = eventInfo.has_end ? timeToMoment(eventInfo.end as string) : startMoment;

        const duration = Math.max(Math.ceil(endMoment.diff(startMoment, 'months', true)), 1);

        for (let i = 0; i < duration; i++) {
            dates.push(moment(startMoment).add(i, 'months').format(momentKeyFormat));
        }
        return dates;
    }

    async view(month: moment.Moment) {
        if (!this.api) throw new Error('API not yet loaded');
        const store = this.store;

        const halfCapacity = Math.floor(this.capacity / 2);
        const requiredKeys = new Set<string>();

        const storeValue = get(this.store) as StoreType<typeof store>;

        const queries = [] as Promise<string>[];

        for (let i = 0; i < this.capacity; i++) {
            const monthMoment = moment(month).add(i - halfCapacity, 'months');
            const monthKey = monthMoment.format(momentKeyFormat);
            requiredKeys.add(monthKey);

            // Setup missing month keys and query data for them, ALWAYS request if the month
            // is at either end of the range
            if (!storeValue.has(monthKey) || i === 0 || i === this.capacity - 1) {
                // TODO: Query several months data together
                const query = this.query({
                    start: moment(monthMoment)
                        .subtract(1, 'month')
                        .endOf('month')
                        .format('YYYY-MM-DD'),
                    end: moment(monthMoment)
                        .add(1, 'month')
                        .startOf('month')
                        .format('YYYY-MM-DD'),
                });
                queries.push(query.then(() => monthKey));
            }
        }
        
        
        // Add any missing month keys not found in the initial query to the "/events" endpoint
        // Only add them after waiting for all other requests, as adding them early could
        // make it appear as they have loaded with empty data when they haven't
        const keys = await Promise.all(queries);
        store.update((map) => {
            const missingKeys = [] as string[];

            for (let key of keys) {
                if (!map.has(key)) {
                    missingKeys.push(key);
                    map.set(key, new Map<string, EventInfo>() as KeyMap<EventInfo>);
                    this.storeValue = map;
                }
            }
            
             for (let key of storeValue.keys()) {
                if (!requiredKeys.has(key as string)) {
                    map.delete(key);
                }
            }
            return map;
        });
    }
}
