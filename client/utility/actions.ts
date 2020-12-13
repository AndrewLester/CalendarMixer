export function clickOutside(node: Node, handler: (event: MouseEvent) => void) {
    const clickHandler = (event: MouseEvent) => {
        if (!node.contains(event.target as Node)) {
            handler(event);
        }
    };
    window.addEventListener('click', clickHandler);

    return {
        destroy() {
            window.removeEventListener('click', clickHandler);
        }
    }
}
