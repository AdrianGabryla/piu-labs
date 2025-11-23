export function randomHsl() {
    return `hsl(${Math.floor(Math.random() * 360)} 70% 75%)`;
}
export function id() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
