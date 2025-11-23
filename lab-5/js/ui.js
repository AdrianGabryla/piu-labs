export default function UI(store) {
    const board = document.getElementById('board');
    const addSquare = document.getElementById('addSquare');
    const addCircle = document.getElementById('addCircle');
    const recolorSquares = document.getElementById('recolorSquares');
    const recolorCircles = document.getElementById('recolorCircles');
    const cntSquares = document.getElementById('cntSquares');
    const cntCircles = document.getElementById('cntCircles');

    function makeEl(shape) {
        const el = document.createElement('div');
        el.className =
            'shape ' + (shape.type === 'square' ? 'square' : 'circle');
        el.dataset.id = shape.id;
        el.style.backgroundColor = shape.color;
        return el;
    }

    function appendShape(shape) {
        const el = makeEl(shape);
        board.appendChild(el);
    }
    function removeById(id) {
        const el = board.querySelector(`[data-id="${id}"]`);
        if (el) el.remove();
    }
    function recolorIds(ids) {
        ids.forEach((id) => {
            const el = board.querySelector(`[data-id="${id}"]`);
            const s = store.getState().shapes.find((x) => x.id === id);
            if (el && s) el.style.backgroundColor = s.color;
        });
    }
    function renderAll(state) {
        board.innerHTML = '';
        state.shapes.forEach((s) => appendShape(s));
    }

    function updateCounts() {
        const c = store.counts();
        cntSquares.textContent = c.square;
        cntCircles.textContent = c.circle;
    }

    addSquare.addEventListener('click', () => store.add('square'));
    addCircle.addEventListener('click', () => store.add('circle'));
    recolorSquares.addEventListener('click', () => store.recolor('square'));
    recolorCircles.addEventListener('click', () => store.recolor('circle'));

    board.addEventListener('click', (e) => {
        const el = e.target.closest('.shape');
        if (!el) return;
        const id = el.dataset.id;
        store.remove(id);
    });

    const unsub = store.subscribe((action, payload, state) => {
        if (action === 'init') {
            renderAll(state);
            updateCounts();
            return;
        }
        if (action === 'add') {
            appendShape(payload);
            updateCounts();
            return;
        }
        if (action === 'remove') {
            removeById(payload);
            updateCounts();
            return;
        }
        if (action === 'bulk') {
            recolorIds(payload.ids);
            updateCounts();
            return;
        }
        if (action === 'update') {
            const el = board.querySelector(`[data-id="${payload.id}"]`);
            if (el && payload.field === 'title') el.title = payload.value;
        }
        updateCounts();
    });

    return { renderAll, appendShape, removeById, unsub, updateCounts };
}
