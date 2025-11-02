(function () {
    const STORAGE_KEY = 'kanban-data-v1';
    const sortState = {};

    function createId() {
        return (
            Date.now().toString(36) +
            '-' +
            Math.random().toString(36).slice(2, 8)
        );
    }

    function randomColor() {
        return `hsl(${Math.floor(Math.random() * 360)} 70% 85%)`;
    }

    function saveData(board) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
    }

    function findCard(board, id) {
        for (const colKey of Object.keys(board)) {
            const idx = board[colKey].findIndex((c) => c.id === id);
            if (idx !== -1) return { colKey, idx, card: board[colKey][idx] };
        }
        return null;
    }

    function loadData(columnKeys) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                let keysMatch = true;
                for (const key of columnKeys) {
                    if (data[key] === undefined) {
                        keysMatch = false;
                        break;
                    }
                }
                if (keysMatch) return data;
            }
        } catch (e) {
            console.error('Failed to load data', e);
        }

        const defaultBoard = {};
        for (const key of columnKeys) {
            defaultBoard[key] = [];
        }
        return defaultBoard;
    }

    function renderBoard(board, COLUMNS) {
        const root = document.getElementById('kanban-root');
        if (!root) return console.warn('No root element');

        root.querySelectorAll('.column').forEach((column, colIndex) => {
            const colKey = column.dataset.key;
            if (!colKey) return;

            const countBadge = column.querySelector('.count-badge');
            if (countBadge) {
                countBadge.textContent = board[colKey].length;
            }

            const cardsWrap = column.querySelector('.cards');
            if (!cardsWrap) return;
            cardsWrap.innerHTML = '';

            let columnCards = [...board[colKey]];
            const s = sortState[colKey];
            if (s === 'asc')
                columnCards.sort((a, b) =>
                    (a.title || '').localeCompare(b.title || '')
                );
            if (s === 'desc')
                columnCards.sort((a, b) =>
                    (b.title || '').localeCompare(a.title || '')
                );

            columnCards.forEach((card) => {
                const c = document.createElement('div');
                c.className = 'card';
                c.dataset.id = card.id;
                c.style.backgroundColor = card.color || randomColor();

                const top = document.createElement('div');
                top.className = 'card-top';
                const titleDiv = document.createElement('div');
                titleDiv.className = 'card-title';
                titleDiv.contentEditable = 'true';
                titleDiv.spellcheck = false;
                titleDiv.textContent = card.title || '';

                titleDiv.addEventListener('blur', () => {
                    const val = titleDiv.textContent.trim();
                    const found = findCard(board, card.id);
                    if (found && found.card.title !== val) {
                        found.card.title = val;
                        saveData(board);
                        if (sortState[found.colKey]) {
                            renderBoard(board, COLUMNS);
                        }
                    }
                });

                const controls = document.createElement('div');
                controls.className = 'card-controls';

                if (colIndex > 0) {
                    const mL = document.createElement('button');
                    mL.textContent = '←';
                    mL.title = 'Przenieś w lewo';
                    mL.dataset.action = 'move';
                    mL.dataset.id = card.id;
                    mL.dataset.dir = 'left';
                    controls.appendChild(mL);
                }
                if (colIndex < COLUMNS.length - 1) {
                    const mR = document.createElement('button');
                    mR.textContent = '→';
                    mR.title = 'Przenieś w prawo';
                    mR.dataset.action = 'move';
                    mR.dataset.id = card.id;
                    mR.dataset.dir = 'right';
                    controls.appendChild(mR);
                }

                const colorBtn = document.createElement('button');
                colorBtn.textContent = '🎨';
                colorBtn.title = 'Koloruj kartę';
                colorBtn.dataset.action = 'color-card';
                colorBtn.dataset.id = card.id;
                controls.appendChild(colorBtn);

                const del = document.createElement('button');
                del.textContent = '✕';
                del.title = 'Usuń';
                del.dataset.action = 'delete';
                del.dataset.id = card.id;
                controls.appendChild(del);

                top.appendChild(titleDiv);
                top.appendChild(controls);
                c.appendChild(top);
                cardsWrap.appendChild(c);
            });
        });
    }

    function addCard(board, colKey, COLUMNS) {
        const newCard = {
            id: createId(),
            title: 'Nowa karta',
            color: randomColor(),
        };
        board[colKey].push(newCard);
        saveData(board);
        renderBoard(board, COLUMNS);
        setTimeout(() => {
            const el = document.querySelector(
                `.card[data-id="${newCard.id}"] .card-title`
            );
            if (el) {
                el.focus();
                document.getSelection().collapse(el, 1);
            }
        }, 60);
    }

    function deleteCard(board, id, COLUMNS) {
        const found = findCard(board, id);
        if (!found) return;
        board[found.colKey].splice(found.idx, 1);
        saveData(board);
        renderBoard(board, COLUMNS);
    }

    function moveCard(board, id, fromKey, dir, COLUMNS) {
        const found = findCard(board, id);
        if (!found) return;
        const fromIndex = COLUMNS.findIndex((c) => c.key === found.colKey);
        const targetIndex = dir === 'left' ? fromIndex - 1 : fromIndex + 1;
        if (targetIndex < 0 || targetIndex >= COLUMNS.length) return;

        const targetKey = COLUMNS[targetIndex].key;
        board[found.colKey].splice(found.idx, 1);
        board[targetKey].push(found.card);

        saveData(board);
        renderBoard(board, COLUMNS);
    }

    function colorCard(board, id, COLUMNS) {
        const found = findCard(board, id);
        if (!found) return;
        found.card.color = randomColor();
        saveData(board);
        renderBoard(board, COLUMNS);
    }

    function colorizeColumn(board, colKey, COLUMNS) {
        board[colKey].forEach((c) => (c.color = randomColor()));
        saveData(board);
        renderBoard(board, COLUMNS);
    }

    function toggleSort(board, colKey, COLUMNS) {
        sortState[colKey] = sortState[colKey] === 'asc' ? 'desc' : 'asc';
        renderBoard(board, COLUMNS);
    }

    function init() {
        const COLUMNS = [];
        const columnKeys = [];
        const columnElements = document.querySelectorAll(
            '#kanban-root .column'
        );

        if (columnElements.length === 0) {
            console.error(
                'Nie znaleziono żadnych kolumn w HTML. Aplikacja nie może wystartować.'
            );
            return;
        }

        columnElements.forEach((colEl) => {
            const key = colEl.dataset.key;
            const title = colEl.querySelector('.col-title').textContent;
            if (key) {
                COLUMNS.push({ key, title });
                columnKeys.push(key);
            } else {
                console.warn('Znaleziono kolumnę bez `data-key`.', colEl);
            }
        });

        const board = loadData(columnKeys);

        columnElements.forEach((column) => {
            column.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const action = btn.dataset.action;
                const colKey = column.dataset.key;

                if (action === 'add') {
                    addCard(board, colKey, COLUMNS);
                } else if (action === 'color-column') {
                    colorizeColumn(board, colKey, COLUMNS);
                } else if (action === 'sort') {
                    toggleSort(board, colKey, COLUMNS);
                } else if (action === 'move') {
                    const id = btn.dataset.id;
                    moveCard(board, id, colKey, btn.dataset.dir, COLUMNS);
                } else if (action === 'delete') {
                    const id = btn.dataset.id;
                    deleteCard(board, id, COLUMNS);
                } else if (action === 'color-card') {
                    const id = btn.dataset.id;
                    colorCard(board, id, COLUMNS);
                }
            });
        });

        renderBoard(board, COLUMNS);

        window.__kanban = {
            load: () => loadData(columnKeys),
            save: () => saveData(board),
        };
    }

    init();
})();
