//?Elementos del DOM
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const columns = document.querySelectorAll('.column');
const navItems = document.querySelectorAll('.nav-item');

//?Toast y contadores 

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
    // Actualizar stats automáticamente si estamos en esa vista
    if (!document.getElementById('statsView').classList.contains('hidden')) {
        updateStatsByMonth();
    }
}

//?Navegación entre vistas

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

    // Si entramos a estadísticas, poblar y actualizar
    if (viewId === 'statsView') {
        populateMonthFilter();
        updateStatsByMonth();
    }
}

navItems.forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
});

//?Edición Inline 
function enableInlineEdit(card) {
    const textNode = Array.from(card.childNodes).find(
        n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== ''
    );
    if (!textNode) return;

    const originalText = textNode.textContent.trim();
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'inline-edit-input';

    card.replaceChild(input, textNode);
    input.focus();
    input.select();

    const saveEdit = () => {
        // CORREGIDO: trim() con paréntesis
        const newText = input.value.trim(); 
        if (newText && newText !== originalText) {
            textNode.textContent = newText;
            card.replaceChild(textNode, input);
            saveTasks();
            showToast('✅ Tarea actualizada', 'success');
        } else {
            textNode.textContent = originalText;
            card.replaceChild(textNode, input);
        }
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') {
            textNode.textContent = originalText;
            card.replaceChild(textNode, input);
        }
    });
}

//?Tarea con prioridad y fecha

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
    card.dataset.createdAt = new Date().toISOString();

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
    
    // Habilitar edición inline
    card.addEventListener('dblclick', () => enableInlineEdit(card));

    document.querySelector('#pending .task-list').appendChild(card);
    
    saveTasks();
    updateColumnCounts();
    showToast('✅ Tarea creada', 'success');
    closeModal();
}

//?Funciones del modal
function openModal() {
    taskModal.classList.remove('hidden');
    taskInput.value = '';
    prioritySelect.value = 'medium';
    taskInput.focus();
}

function closeModal() {
    taskModal.classList.add('hidden');
}

//?Drag & Drop Nativo
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

//?Persistencia Local Storage

function saveTasks() {
    const tasks = [];
    ['pending', 'progress', 'done'].forEach(id => {
        const col = document.getElementById(id);
        if (!col) return;
        col.querySelectorAll('.task-card').forEach(card => {
            const badge = card.querySelector('.priority-badge');
            const priority = badge ? badge.className.split(' ')[1].replace('p-', '') : 'medium';
            
            // Buscar nodo de texto correctamente
            const textNode = Array.from(card.childNodes).find(
                n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== ''
            );
            const text = textNode ? textNode.textContent.trim() : '';
            const createdAt = card.dataset.createdAt || new Date().toISOString();
            
            if (text) tasks.push({ text, priority, columnId: id, createdAt });
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
            card.dataset.createdAt = t.createdAt;

            const badge = document.createElement('span');
            badge.className = `priority-badge p-${t.priority || 'medium'}`;
            badge.textContent = t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Media' : 'Baja';

            const textNode = document.createTextNode(t.text);

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.innerHTML = '&times;';
            delBtn.onclick = () => { 
                card.remove(); 
                saveTasks(); 
                updateColumnCounts(); 
            };

            card.appendChild(badge);
            card.appendChild(textNode);
            card.appendChild(delBtn);
            
            // Habilitar edición inline al cargar
            card.addEventListener('dblclick', () => enableInlineEdit(card));
            
            list.appendChild(card);
        });
        updateColumnCounts();
    } catch (e) { console.error('Error cargando:', e); }
}

//?Estadisticas por mes

function populateMonthFilter() {
    const saved = localStorage.getItem('kanban-tasks');
    if (!saved) return;
    
    const tasks = JSON.parse(saved);
    const months = [...new Set(tasks.map(t => t.createdAt.substring(0, 7)))].sort().reverse();
    
    const select = document.getElementById('monthFilter');
    select.innerHTML = '<option value="all">Todos los meses</option>';
    
    months.forEach(m => {
        const [year, month] = m.split('-');
        const date = new Date(year, month - 1);
        const label = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        const option = document.createElement('option');
        option.value = m;
        option.textContent = label.charAt(0).toUpperCase() + label.slice(1);
        select.appendChild(option);
    });
}

function updateStatsByMonth() {
    
    const selectedMonth = document.getElementById('monthFilter').value; 
    const saved = localStorage.getItem('kanban-tasks');
    if (!saved) return;
    
    let tasks = JSON.parse(saved);
    
    if (selectedMonth !== 'all') {
        tasks = tasks.filter(t => t.createdAt.startsWith(selectedMonth));
    }
    

    const total = tasks.length;
    const pending = tasks.filter(t => t.columnId === 'pending').length;
    const progress = tasks.filter(t => t.columnId === 'progress').length;
    const done = tasks.filter(t => t.columnId === 'done').length;
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statProgress').textContent = progress;
    document.getElementById('statDone').textContent = done;
}


document.getElementById('monthFilter').addEventListener('change', updateStatsByMonth);

//?Even Listener e inicialización
addTaskBtn.addEventListener('click', openModal);
cancelBtn.addEventListener('click', closeModal);
saveBtn.addEventListener('click', createTask);

taskInput.addEventListener('keypress', e => { 
    if (e.key === 'Enter') createTask(); 
});

taskModal.addEventListener('click', e => { 
    if (e.target === taskModal) closeModal(); 
});

document.getElementById('clearAllBtn').addEventListener('click', () => {
    if (confirm('¿Borrar TODAS las tareas? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('kanban-tasks');
        document.querySelectorAll('.task-list').forEach(l => l.innerHTML = '');
        updateColumnCounts();
        showToast('️ Todo eliminado', 'error');
        switchView('boardView');
    }
});

// Inicializar al cargar
updateColumnCounts();
loadTasks();