import type { EventInfo } from '../api/types';
import moment from 'moment';
import { QueryNetworkStore, ErrorHandler, KeyMap, StoreType } from './networkstore';
import { timeToMoment } from '../api/schoology';
import { get, Writable } from 'svelte/store';

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
        const storeValue = get(this.store) as StoreType<typeof store>;

        const requiredKeys = new Set<string>();
        for (let i = 0; i < this.capacity; i++) {
            const monthMoment = moment(month).add(i - halfCapacity, 'months');
            const monthKey = monthMoment.format(momentKeyFormat);
            requiredKeys.add(monthKey);
        }

        this.removeStaleKeys(
            [...(storeValue.keys() as IterableIterator<string>)]
            .filter((key) => !requiredKeys.has(key))
        );

        const queries = [] as Promise<any>[];
        for (let i = 0; i < this.capacity; i++) {
            const monthMoment = moment(month).add(i - halfCapacity, 'months');
            const monthKey = monthMoment.format(momentKeyFormat);

            // Setup missing month keys and query data for them
            if (!storeValue.has(monthKey)) {
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
                queries.push(query);
            }
        }
        
        
        // Add any missing month keys not found in the initial query to the "/events" endpoint
        // Only add them after waiting for all other requests, as adding them early could
        // make it appear as they have loaded with empty data when they haven't
        await Promise.all(queries);
        this.addMissingKeys(requiredKeys);
    }

    private addMissingKeys(requiredKeys: Set<string>) {
        this.store.update((map) => {
            for (let key of requiredKeys) {
                if (!map.has(key)) {
                    map.set(key, new Map<string, EventInfo>() as KeyMap<EventInfo>);
                    this.storeValue = map;
                }
            }
            return map;
        });
    }

    private removeStaleKeys(staleKeys: string[]) {
        this.store.update((map) => {
            for (let key of staleKeys) {
                map.delete(key);
            }
            return map;
        });
    }
}
