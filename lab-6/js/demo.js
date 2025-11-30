import Ajax from './ajax.js';

const btnFetch = document.getElementById('btnFetch');
const btnError = document.getElementById('btnError');
const btnReset = document.getElementById('btnReset');
const list = document.getElementById('list');
const loader = document.getElementById('loader');
const message = document.getElementById('message');

const api = new Ajax({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 7000,
});

function showLoader(show) {
    loader.style.display = show ? 'flex' : 'none';
}
function showMessage(textOrError, err) {
    let text = '';
    if (textOrError instanceof Error) {
        text = textOrError.message;
        const extra = [];
        if (textOrError.method) extra.push(textOrError.method);
        if (textOrError.url) extra.push(textOrError.url);
        if (textOrError.body) {
            const b =
                typeof textOrError.body === 'object'
                    ? JSON.stringify(textOrError.body)
                    : textOrError.body;
            extra.push(b.length > 600 ? b.slice(0, 600) + '...' : b);
        }
        if (extra.length) text += ' | ' + extra.join(' | ');
    } else {
        text = textOrError || '';
    }
    message.textContent = text;
    const isErr = err || textOrError instanceof Error;
    message.className = isErr ? 'message error' : 'message';
}
function clear() {
    list.innerHTML = '';
    showMessage('');
}

async function fetchData() {
    showLoader(true);
    showMessage('');
    try {
        const data = await api.get('/posts');
        renderList(data.slice(0, 20));
    } catch (e) {
        showMessage(e, true);
    } finally {
        showLoader(false);
    }
}

async function fetchError() {
    showLoader(true);
    showMessage('');
    try {
        const data = await api.get('/invalid-endpoint');
        renderList(data);
    } catch (e) {
        showMessage(e, true);
    } finally {
        showLoader(false);
    }
}

function renderList(arr) {
    list.innerHTML = '';
    if (!arr || !arr.length) {
        showMessage('Brak danych na liście');
        return;
    }
    arr.forEach((item) => {
        const li = document.createElement('li');
        const h = document.createElement('h3');
        h.textContent = item.title || `#${item.id}`;
        const p = document.createElement('p');
        p.textContent = item.body || '';
        li.appendChild(h);
        li.appendChild(p);
        list.appendChild(li);
    });
}

btnFetch.addEventListener('click', () => fetchData());
btnError.addEventListener('click', () => fetchError());
btnReset.addEventListener('click', () => clear());

showLoader(false);
clear();
