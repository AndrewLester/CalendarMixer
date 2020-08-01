import { writable } from 'svelte/store';
import type { Notification } from './notification';

export const notification = writable<Notification | null>(null);
