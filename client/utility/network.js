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
        post: (url, data) => {
            return fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(data)
            }).then((res) => {
                if (!res.ok) {
                    throw new Error('Request error');
                }
            });
        }
    }
};

export const key = {};