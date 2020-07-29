import type { Theme } from "./themes";


export interface Notification {
    type: Theme,
    message: string,
    timeout: number
}
