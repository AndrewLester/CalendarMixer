import { writable as writableStore, Writable, Readable, derived } from 'svelte/store';
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

export class NetworkStore<T> implements Readable<T> {
    subscribe: (run: Subscriber<T>, invalidate?: Invalidator<T>) => Unsubscriber;
    append?: (element: ElementType<T>) => Promise<void>;
    replace?: (element: ElementType<T>, key: keyof ElementType<T>) => Promise<void>;
    delete?: (element: ElementType<T>, idKey: keyof ElementType<T>) => Promise<void>;

    readonly store: Writable<T>;
    private storeValue: T;
    private fetchErrorHandler: ErrorHandler;
    private api?: Networking;
    private _loaded: boolean = false;
    readonly _loadedStore: Readable<boolean>;

    constructor(
        private endpoint: string,
        defaultValue: T,
        private writable = false,
        fetchErrorHandler: ErrorHandler = () => { }
    ) {
        this.store = writableStore(defaultValue);
        this.storeValue = defaultValue;
        this.subscribe = this.store.subscribe;

        this.fetchErrorHandler = fetchErrorHandler;
        this._loadedStore = derived([this], () => this._loaded);

        if (this.writable && defaultValue instanceof Array) {
            this.append = async (element: ElementType<T>) => {
                await this.update(current => {
                    const currentArray = current as unknown as ElementType<T>[];
                    return ([element, ...currentArray]) as unknown as T;
                });
            }
            this.replace = async (element: ElementType<T>, discriminator: keyof ElementType<T>) => {
                await this.update(current => {
                    const currentArray = current as unknown as ElementType<T>[];
                    return ([element, ...currentArray.filter((elem) => {
                        return elem[discriminator] !== element[discriminator];
                    })]) as unknown as T;
                });
            }
            this.delete = async (element: ElementType<T>, idKey: keyof ElementType<T>) => {
                if (!this.api) return;
                
                
                this.api.delete(this.endpoint + `/${element[idKey]}`);
            }
        }
    }

    async setAPI(api: Networking, overwrite: boolean = false) {
        if (overwrite && this.api !== undefined) return;

        this.api = api;

        await this.reset();
    }

    get loaded(): Readable<boolean> {
        return this._loadedStore;
    }

    async set(value: T) {
        if (!this.writable) return;

        this.storeValue = value;
        this.store.set(value);
        await this.api?.post(this.endpoint, value);
    }

    async update(updater: Updater<T>) {
        if (!this.writable) return;

        await this.set(updater(this.storeValue));
    }

    async reset(retryTime?: number) {
        try {
            const value = await this.api?.get(this.endpoint);
            this._loaded = true;
            this.store.set(value);
        } catch (e) {
            const retryTimeDef = retryTime ?? 2500;

            this.fetchErrorHandler(e, retryTimeDef);
            await sleep(retryTimeDef).then(() => this.reset(retryTimeDef * 2));
        }
    }
}
