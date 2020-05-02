import { writable } from 'svelte/store';

export class NetworkStore {
    constructor(endpoint, defaultValue, writableStore=false) {
        this.endpoint = endpoint;
        this.writable = writableStore;
        
        this._store = writable(defaultValue);

        this.subscribe = this._store.subscribe;
    }

    setAPI(api) {
        this.api = api;

        if (this.writable) {
            this.set = (value) => {
                this.api.post(endpoint, value).then(() => this._store.set(value));
            }
        }

        this._reset()
    }

    _reset() {
        this.api.get(this.endpoint).then((value) => this._store.set(value))
    }
}