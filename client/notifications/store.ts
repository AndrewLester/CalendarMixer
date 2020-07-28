import { writable } from 'svelte/store';
import { Notification } from './notification';

export const notification = writable<Notification | null>(null);
