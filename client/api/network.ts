export type Networking = {
    get(url: string): Promise<any>;
    post(url: string, data: any, headers?: HeadersInit): Promise<any>;
    put(url: string, data: any, headers?: HeadersInit): Promise<any>;
    delete(url: string): Promise<any>;
};

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const defaultHeaders: HeadersInit = {
    Accept: 'application/json',
};

export function mountNetworking(csrfToken: string): Networking {
    async function request(
        url: string,
        method: HTTPMethod,
        headers: HeadersInit = defaultHeaders,
        data?: any
    ) {
        const res = await fetch(url, {
            method: method,
            mode: method !== 'GET' ? 'cors' : undefined,
            headers: { ...defaultHeaders, ...headers },
            body: data,
        });
        if (!res.ok) {
            throw new Error(`Request failed with error: ${res.statusText}`);
        }
        return res.json();
    }

    return {
        get: async (url) => {
            return await request(url, 'GET');
        },
        post: async (url, data, headers = defaultHeaders) => {
            return await request(
                url,
                'POST',
                {
                    ...headers,
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                JSON.stringify(data)
            );
        },
        put: async (url, data, headers = defaultHeaders) => {
            return await request(
                url,
                'PUT',
                {
                    ...headers,
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                JSON.stringify(data)
            );
        },
        delete: async (url) => {
            return await request(url, 'DELETE', { 'X-CSRFToken': csrfToken });
        },
    };
}

export const key: object = {};
