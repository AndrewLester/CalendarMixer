import {
    writable as writableStore,
    Writable,
    Readable,
    derived,
} from 'svelte/store';
import type { Networking } from '../api/network';
import { sleep } from './async';

declare type Subscriber<T> = (value: T) => void;
/** Unsubscribes from value updates. */
declare type Unsubscriber = () => void;
/** Callback to update a value. */
declare type Updater<T> = (value: T) => T;
/** Cleanup logic callback. */
declare type Invalidator<T> = (value?: T) => void;

type ElementType<T> = T extends Array<infer U> ? U : never;
type ErrorHandler = (error: Error, retryTime?: number) => void;

export class ReadableNetworkStore<T> implements Readable<T> {
    subscribe: (
        run: Subscriber<T>,
        invalidate?: Invalidator<T>
    ) => Unsubscriber;

    readonly store: Writable<T>;
    protected storeValue: T;
    protected fetchErrorHandler: ErrorHandler;

    // Store which holds the loading state for this store
    readonly _loadedStore: Readable<boolean>;
    private _loaded: boolean = false;

    protected api?: Networking;

    constructor(
        protected endpoint: string,
        defaultValue: T,
        fetchErrorHandler: ErrorHandler = () => { }
    ) {
        this.store = writableStore(defaultValue);
        this.storeValue = defaultValue;
        this.subscribe = this.store.subscribe;

        this.fetchErrorHandler = fetchErrorHandler;
        this._loadedStore = derived([this], () => this._loaded);
    }

    get loaded(): Readable<boolean> {
        return this._loadedStore;
    }

    async setAPI(api: Networking, overwrite: boolean = false) {
        if (!overwrite && this.api !== undefined) return;

        this.api = api;

        await this.reset();
    }

    async reset(retryTime?: number) {
        if (!this.api) {
            throw new Error(
                'Networking must be loaded before a call to reset()'
            );
        }

        try {
            const value = await this.api.get(this.endpoint);
            this._loaded = true;
            this.store.set(value);
        } catch (e) {
            const retryTimeDef = retryTime ?? 2500;

            this.fetchErrorHandler(e, retryTimeDef);
            await sleep(retryTimeDef).then(() => this.reset(retryTimeDef * 2));
        }
    }
}

export class WritableNetworkStore<T> extends ReadableNetworkStore<T>
    implements Writable<T> {
    constructor(
        endpoint: string,
        defaultValue: T,
        fetchErrorHandler: ErrorHandler = () => { }
    ) {
        super(endpoint, defaultValue, fetchErrorHandler);
    }

    async set(value: T) {
        if (!this.api) throw new Error('Networking not loaded');

        this.storeValue = value;
        this.store.set(value);
        await this.api.post(this.endpoint, value);
    }

    async update(updater: Updater<T>) {
        await this.set(updater(this.storeValue));
    }
}

export class ListNetworkStore<T extends Array<ElementType<T>>> extends ReadableNetworkStore<T> {
    constructor(
        endpoint: string,
        defaultValue: T,
        fetchErrorHandler: ErrorHandler = () => { }
    ) {
        super(endpoint, defaultValue, fetchErrorHandler);
    }

    async create(element: ElementType<T>) {
        if (!this.api) throw new Error('Networking not loaded');

        try {
            const created: ElementType<T> = await this.api.post(this.endpoint, element);
            this.store.update((current) => [created, ...current] as any);
        } catch (e) {
            this.fetchErrorHandler(e);
        }
    }

    async update(element: ElementType<T>, discriminator: keyof ElementType<T>) {
        if (!this.api) throw new Error('Networking not loaded');


        this.store.update((current) => {
            const updated = [
                element,
                ...current.filter((elem) => {
                    return elem[discriminator] !== element[discriminator];
                })
            ]

            return updated as any;
        })

        try {
            await this.api.put(this.endpoint + `/${element[discriminator]}`, element);
        } catch (e) {
            this.fetchErrorHandler(e);
        }
    }

    async delete(element: ElementType<T>, idKey: keyof ElementType<T>) {
        if (!this.api) throw new Error('Networking not loaded');

        this.store.update((current) => {
            return current.filter((elem) => elem[idKey] !== element[idKey]) as any;
        });

        try {
            await this.api.delete(this.endpoint + `/${element[idKey]}`);
        } catch (e) {
            this.fetchErrorHandler(e);
        }
    }

    async deleteByKey(key: keyof ElementType<T>, value: ElementType<T>[typeof key]) {
        if (!this.api) throw new Error('Networking not loaded');

        this.store.update((current) => {
            return current.filter((elem) => elem[key] !== value) as any;
        });
        
        try {
            await this.api.delete(this.endpoint + `/${value}`);
        } catch (e) {
            this.fetchErrorHandler(e);
        }
    }
}
