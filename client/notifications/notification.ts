export const themes = {
    danger: "#bb2124",
    success: "#22bb33",
    warning: "#f0ad4e",
    info: "#5bc0de",
    default: "#aaaaaa",
};

export interface Notification {
    type: Theme,
    message: string,
    timeout: number
}
