

export default mountNetworking = csrfToken => {
    return {
        get: url => {
            return fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
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
            });
        }
    }
};



export const key = {};