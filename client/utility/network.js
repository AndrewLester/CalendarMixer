export const mountNetworking = csrfToken => {
    return {
        get: url => {
            return fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            }).then((res) => {
                if (!res.ok) {
                    throw new Error('Request error');
                }
                return res.json();
            });
        },
        post: (url, data, headers={'Content-Type': 'application/json'}) => {
            return fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    ...headers,
                    'X-CSRFToken': csrfToken
                },
                body: data
            }).then((res) => {
                if (!res.ok) {
                    throw new Error('Request error');
                }
            });
        }
    }
};

export const key = {};
