export function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

export function animationEnd(element, animationProperty, timeout) {
    return new Promise(resolve => {
        const callback = (e) => {
            let svelteClassNameBase = element.className.split(' ').filter(className => className.startsWith('svelte'));
            let baseAnimationName = svelteClassNameBase ? svelteClassNameBase[0] : '';

            if (e.animationName === baseAnimationName + '-' + animationProperty) {
                element.removeEventListener('animationend', callback);
                resolve();
            }
        };
        element.addEventListener('animationend', callback);
        
        if (timeout) {
            sleep(timeout).then(resolve);
        }
    });
}