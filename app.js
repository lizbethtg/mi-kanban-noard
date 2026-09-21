//?DOM
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const taskInput = document.getElementById('taskInput');
const columns = document.querySelectorAll('.column');

//?Toast
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

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

//?Contador de columnas
function updateColumnCounts() {
    columns.forEach(col => {
        const count = col.querySelector('.task-list').children.length;
        col.setAttribute('data-count', count);
    });
}

//?Funciones Modal

function openModal() {
    taskModal.classList.remove('hidden');
    taskInput.value = '';
    taskInput.focus();
}

function closeModal() {
    taskModal.classList.add('hidden');
}
//?Crear Tarea
function createTask() {
    const text = taskInput.value.trim();
    
    if (text === '') {
        showToast('⚠️ Escribe una tarea primero', 'error');
        return;
    }

    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.textContent = text;

    // Botón eliminar
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.onclick = () => {
        card.remove();
        saveTasks();      // GUARDAR AL ELIMINAR
        updateColumnCounts();
        showToast('🗑️ Tarea eliminada', 'error');
    };

    card.appendChild(deleteBtn);
    
    // Agregar a columna Pendiente
    const pendingList = document.querySelector('#pending .task-list');
    pendingList.appendChild(card);
    
    saveTasks();          // GUARDAR AL CREAR
    updateColumnCounts();
    showToast('✅ Tarea creada', 'success');
    closeModal();
}

//?Drag & drop
let draggedCard = null;

document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('task-card')) {
        draggedCard = e.target;
        e.target.style.opacity = '0.4';
    }
});

document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('task-card')) {
        e.target.style.opacity = '1';
        draggedCard = null;
        columns.forEach(col => col.style.backgroundColor = '');
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    const col = e.target.closest('.column');
    if (col) col.style.backgroundColor = '#e9d5ff';
});

document.addEventListener('dragleave', (e) => {
    const col = e.target.closest('.column');
    if (col) col.style.backgroundColor = '';
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    const col = e.target.closest('.column');
    if (col && draggedCard) {
        const list = col.querySelector('.task-list');
        list.appendChild(draggedCard);
        saveTasks();      // GUARDAR AL MOVER
        updateColumnCounts();
        showToast('✨ Tarea movida', 'success');
    }
});

//?LocalStorage
function saveTasks() {
    const allTasks = [];
    
    ['pending', 'progress', 'done'].forEach(colId => {
        const column = document.getElementById(colId);
        if (!column) return;
        
        const cards = column.querySelectorAll('.task-card');
        cards.forEach(card => {
            
            const text = card.firstChild ? card.firstChild.textContent.trim() : '';
            if (text) {
                allTasks.push({ 
                    text: text, 
                    columnId: colId 
                });
            }
        });
    });
    
    localStorage.setItem('kanban-tasks', JSON.stringify(allTasks));
    console.log('💾 Guardado:', allTasks.length, 'tareas');
}

function loadTasks() {
    const savedData = localStorage.getItem('kanban-tasks');
    if (!savedData) return;
    
    try {
        const tasks = JSON.parse(savedData);
        
        tasks.forEach(task => {
            const column = document.getElementById(task.columnId);
            if (!column) return;
            
            const list = column.querySelector('.task-list');
            
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            card.textContent = task.text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = function() {
                card.remove();
                saveTasks();
                updateColumnCounts();
            };
            
            card.appendChild(deleteBtn);
            list.appendChild(card);
        });
        
        updateColumnCounts();
        console.log('📂 Cargadas:', tasks.length, 'tareas');
    } catch (e) {
        console.error('Error cargando tareas:', e);
    }
}

//?Even listener

addTaskBtn.addEventListener('click', openModal);
cancelBtn.addEventListener('click', closeModal);
saveBtn.addEventListener('click', createTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createTask();
});

taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeModal();
});

//?Inicialización
updateColumnCounts();
loadTasks(); 