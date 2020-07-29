import { writable as writableStore, Writable, Readable } from 'svelte/store';
import type { Networking } from '../api/network';


declare type Subscriber<T> = (value: T) => void;
/** Unsubscribes from value updates. */
declare type Unsubscriber = () => void;
/** Callback to update a value. */
declare type Updater<T> = (value: T) => T;
/** Cleanup logic callback. */
declare type Invalidator<T> = (value?: T) => void;

type ErrorHandler = (error: Error) => void;

export class NetworkStore<T> implements Readable<T> {
    subscribe: (run: Subscriber<T>, invalidate?: Invalidator<T>) => Unsubscriber;
    set?: (value: T) => void;
    update?: (value: T, storeValue: T | null) => void;

    readonly store: Writable<T>;
    private fetchErrorHandler: ErrorHandler;
    private api?: Networking;
    private _loaded: boolean = false;

    constructor(
        private endpoint: string,
        defaultValue: T,
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
                try {
                    await this.api?.post(this.endpoint, value);
                } catch (e) {
                    this.fetchErrorHandler(e);
                    return;
                }

                if (storeValue !== null) {
                    this.store.set(storeValue);
                }
            };
        }

        this.reset();
    }

    get loaded(): boolean {
        return this._loaded;
    }

    async reset() {
        if (!this.api) return;

        try {
            const value = await this.api.get(this.endpoint);
            this._loaded = true;
            this.store.set(value);
        } catch (e) {
            this.fetchErrorHandler(e);
        }
    }
}
