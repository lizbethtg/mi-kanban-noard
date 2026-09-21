//?DOMS//
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const columns = document.querySelectorAll('.column');
const navItems = document.querySelectorAll('.nav-item');

//?Toast & contadores

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateColumnCounts() {
    columns.forEach(col => {
        const count = col.querySelector('.task-list').children.length;
        col.setAttribute('data-count', count);
    });
    updateStats(); // Actualizar stats automáticamente
}

//?Navegaci+on entre vistas

function switchView(viewId) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));

    // Mostrar vista seleccionada
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');

    // Activar nav item correspondiente
    const activeNav = Array.from(navItems).find(n => n.dataset.view === viewId);
    if (activeNav) activeNav.classList.add('active');

    // Mostrar/Ocultar header según la vista
    const header = document.getElementById('mainHeader');
    header.style.display = viewId === 'boardView' ? 'flex' : 'none';

    if (viewId === 'statsView') updateStats();
}

navItems.forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
});

//?Tarea con prioridad

function createTask() {
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;

    if (!text) {
        showToast('⚠️ Escribe una tarea primero', 'error');
        return;
    }

    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;

    // Badge de prioridad
    const badge = document.createElement('span');
    badge.className = `priority-badge p-${priority}`;
    badge.textContent = priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja';
    
    // Texto de tarea
    const textNode = document.createTextNode(text);

    // Botón eliminar
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.onclick = () => {
        card.remove();
        saveTasks();
        updateColumnCounts();
        showToast('🗑️ Tarea eliminada', 'error');
    };

    card.appendChild(badge);
    card.appendChild(textNode);
    card.appendChild(deleteBtn);

    document.querySelector('#pending .task-list').appendChild(card);
    
    saveTasks();
    updateColumnCounts();
    showToast('✅ Tarea creada', 'success');
    closeModal();
}

//?Modal Functions
function openModal() {
    taskModal.classList.remove('hidden');
    taskInput.value = '';
    prioritySelect.value = 'medium';
    taskInput.focus();
}

function closeModal() {
    taskModal.classList.add('hidden');
}

//?Drag & Drop

let draggedCard = null;

document.addEventListener('dragstart', e => {
    if (e.target.classList.contains('task-card')) {
        draggedCard = e.target;
        e.target.style.opacity = '0.4';
    }
});

document.addEventListener('dragend', e => {
    if (e.target.classList.contains('task-card')) {
        e.target.style.opacity = '1';
        draggedCard = null;
        columns.forEach(c => c.style.backgroundColor = '');
    }
});

document.addEventListener('dragover', e => {
    e.preventDefault();
    const col = e.target.closest('.column');
    if (col) col.style.backgroundColor = '#e9d5ff';
});

document.addEventListener('dragleave', e => {
    const col = e.target.closest('.column');
    if (col) col.style.backgroundColor = '';
});

document.addEventListener('drop', e => {
    e.preventDefault();
    const col = e.target.closest('.column');
    if (col && draggedCard) {
        col.querySelector('.task-list').appendChild(draggedCard);
        saveTasks();
        updateColumnCounts();
        showToast('✨ Tarea movida', 'success');
    }
});

//?Local Storage
function saveTasks() {
    const tasks = [];
    ['pending', 'progress', 'done'].forEach(id => {
        const col = document.getElementById(id);
        if (!col) return;
        col.querySelectorAll('.task-card').forEach(card => {
            const badge = card.querySelector('.priority-badge');
            const priority = badge ? badge.className.split(' ')[1].replace('p-', '') : 'medium';
            // El texto está en el segundo nodo (después del badge)
            const text = card.childNodes[1]?.textContent.trim() || '';
            if (text) tasks.push({ text, priority, columnId: id });
        });
    });
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem('kanban-tasks');
    if (!saved) return;

    try {
        JSON.parse(saved).forEach(t => {
            const col = document.getElementById(t.columnId);
            if (!col) return;
            const list = col.querySelector('.task-list');

            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;

            const badge = document.createElement('span');
            badge.className = `priority-badge p-${t.priority || 'medium'}`;
            badge.textContent = t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Media' : 'Baja';

            const textNode = document.createTextNode(t.text);

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.innerHTML = '&times;';
            delBtn.onclick = () => { card.remove(); saveTasks(); updateColumnCounts(); };

            card.appendChild(badge);
            card.appendChild(textNode);
            card.appendChild(delBtn);
            list.appendChild(card);
        });
        updateColumnCounts();
    } catch (e) { console.error('Error cargando:', e); }
}

//?Estadísticas
function updateStats() {
    const total = document.querySelectorAll('.task-card').length;
    const pending = document.querySelector('#pending .task-list')?.children.length || 0;
    const progress = document.querySelector('#progress .task-list')?.children.length || 0;
    const done = document.querySelector('#done .task-list')?.children.length || 0;

    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    set('statTotal', total);
    set('statPending', pending);
    set('statProgress', progress);
    set('statDone', done);
}

//?Even listener 
addTaskBtn.addEventListener('click', openModal);
cancelBtn.addEventListener('click', closeModal);
saveBtn.addEventListener('click', createTask);
taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') createTask(); });
taskModal.addEventListener('click', e => { if (e.target === taskModal) closeModal(); });

document.getElementById('clearAllBtn').addEventListener('click', () => {
    if (confirm('¿Borrar TODAS las tareas? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('kanban-tasks');
        document.querySelectorAll('.task-list').forEach(l => l.innerHTML = '');
        updateColumnCounts();
        showToast('🗑️ Todo eliminado', 'error');
        switchView('boardView');
    }
});

// Inicializar
updateColumnCounts();
loadTasks();