import Store from './store.js';
import UI from './ui.js';

const store = new Store();
const ui = UI(store);

store.notify('init', null);
