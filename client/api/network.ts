export type Networking = {
    get(url: string): Promise<any>,
    post(url: string, data: any, headers?: HeadersInit): Promise<void>,
    delete(url: string): Promise<any>
}


export function mountNetworking(csrfToken: string): Networking {
    return {
        get: async (url) => {
            const res = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!res.ok) {
                throw new Error(`Request failed with error: ${res.statusText}`);
            }
            return res.json();
        },
        post: async (url, data, headers = { 'Content-Type': 'application/json' }) => {
            const res = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    ...headers,
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                throw new Error(`Request failed with error: ${res.statusText}`);
            }
        },
        delete: async (url) => {
            const res = await fetch(url, {
                method: 'DELETE',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRFToken': csrfToken
                }
            });
            if (!res.ok) {
                throw new Error(`Request failed with error: ${res.statusText}`);
            }
            return res.json();
        }
    }
};

export const key: object = {};
