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

    view(month: moment.Moment): Promise<void[]> {
        if (!this.api) return Promise.resolve([]);

        const halfCapacity = Math.floor(this.capacity / 2);
        const requiredKeys = new Set<string>();

        const storeValue = get(this.store);
        let viewedMonthQueries: Promise<void>[] = [];

        for (let i = 0; i < this.capacity; i++) {
            const monthMoment = moment(month).add(i - halfCapacity, 'months');
            const monthKey = monthMoment.format(momentKeyFormat);
            requiredKeys.add(monthKey);

            // Setup missing month keys and query data for them
            if (!storeValue.has(monthKey)) {
                // TODO: Query several months data together
                const query = this.query({
                    start: moment(monthMoment)
                        .startOf('month')
                        .format('YYYY-MM-DD'),
                    end: moment(monthMoment)
                        .startOf('month')
                        .add(1, 'month')
                        .format('YYYY-MM-DD'),
                }).then(() => {
                    // Add any missing month keys not found in 
                    // the initial query to the "/events" endpoint
                    this.store.update((map) => {
                        if (!map.has(monthKey)) {
                            map.set(monthKey, new Map<string, EventInfo>() as KeyMap<EventInfo>);
                            this.storeValue = map;
                        }
                        return map;
                    });
                });

                // Add all month queries that are within 1 month of the viewed month to the promise
                // These queries will be awaited when displaying months in the calendar
                if (
                    monthKey === month.format(momentKeyFormat) ||
                    monthKey === moment(month).add(1, 'month').format(momentKeyFormat) ||
                    monthKey === moment(month).subtract(1, 'month').format(momentKeyFormat)
                ) {
                    viewedMonthQueries.push(query);
                };
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

        return Promise.all(viewedMonthQueries);
    }
}
