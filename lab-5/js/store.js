import { randomHsl, id } from './helpers.js';

const KEY = 'lab5-shapes-v1';

export default class Store {
    constructor() {
        this.subs = [];
        this.state = { shapes: [] };
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) this.state = JSON.parse(raw);
        } catch (e) {
            this.state = { shapes: [] };
        }
    }
    subscribe(fn) {
        this.subs.push(fn);
        return () => {
            this.subs = this.subs.filter((s) => s !== fn);
        };
    }
    notify(action, payload) {
        try {
            localStorage.setItem(KEY, JSON.stringify(this.state));
        } catch (e) {}
        this.subs.forEach((s) => s(action, payload, this.state));
    }
    getState() {
        return this.state;
    }
    add(type) {
        const shape = { id: id(), type, color: randomHsl() };
        this.state.shapes.push(shape);
        this.notify('add', shape);
        return shape;
    }
    remove(id) {
        const i = this.state.shapes.findIndex((s) => s.id === id);
        if (i > -1) {
            this.state.shapes.splice(i, 1);
            this.notify('remove', id);
        }
    }
    recolor(type) {
        const ids = [];
        this.state.shapes.forEach((s) => {
            if (s.type === type) {
                s.color = randomHsl();
                ids.push(s.id);
            }
        });
        this.notify('bulk', { type, ids });
    }
    updateTitle(id, title) {
        const s = this.state.shapes.find((s) => s.id === id);
        if (!s) return;
        s.title = title;
        this.notify('update', { id, field: 'title', value: title });
    }
    counts() {
        const c = { square: 0, circle: 0 };
        this.state.shapes.forEach((s) =>
            s.type === 'square' ? c.square++ : c.circle++
        );
        return c;
    }
}
