import { writable as writableStore, Writable, Readable } from 'svelte/store';
import { Networking } from '../api/network';


declare type Subscriber<T> = (value: T) => void;
/** Unsubscribes from value updates. */
declare type Unsubscriber = () => void;
/** Callback to update a value. */
declare type Updater<T> = (value: T) => T;
/** Cleanup logic callback. */
declare type Invalidator<T> = (value?: T) => void;

type ErrorHandler = (error: Error) => void;

export class NetworkStore<T> implements Readable<T | undefined> {
    subscribe: (run: Subscriber<T | undefined>, invalidate?: Invalidator<T | undefined>) => Unsubscriber;
    set?: (value: T | undefined) => void;
    update?: (value: T | undefined, storeValue: T | undefined | null) => void;

    readonly store: Writable<T | undefined>;
    private fetchErrorHandler: ErrorHandler;
    private api?: Networking;

    constructor(
        private endpoint: string,
        defaultValue: T | undefined = undefined,
        private writable = false,
        fetchErrorHandler: ErrorHandler = () => {}
    ) {
        this.store = writableStore(defaultValue);
        this.subscribe = this.store.subscribe;

        this.fetchErrorHandler = fetchErrorHandler;
    }

    setAPI(api: Networking) {
        this.api = api;

        if (this.writable) {
            this.set = this.store.set;

            this.update = async (value, storeValue = value) => {
                await this.api?.post(this.endpoint, value).then(() => {
                    if (storeValue !== null) {
                        this.store.set(storeValue);
                    }
                });
            };
        }

        this.reset();
    }

    async reset() {
        if (!this.api) return;

        try {
            const value = await this.api.get(this.endpoint);
            this.store.set(value);
        } catch (e) {
            this.fetchErrorHandler(e);
        }
    }
}
