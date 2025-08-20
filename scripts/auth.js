let selectedRole = 'developer';

// Credenciales de ejemplo
const users = {
    developer: {
        dev: '12345'
    },
    admin: {
        admin: '1234'
    }
};

// Configuración de permisos por rol
const rolePermissions = {
    developer: ['esquema', 'inserciones', 'datos', 'consultas', 'mapa', 'graficos', 'excelImport'],
    admin: ['inserciones', 'datos', 'mapa', 'graficos', 'excelImport'], // Removido 'esquema'
    guest: ['mapa', 'graficos']
};

// Inicializar selectores de rol
document.addEventListener('DOMContentLoaded', () => {
    const roleBtns = document.querySelectorAll('.role-btn');
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedRole = btn.dataset.role;
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('loginOverlay')) {
        location.reload();
    }
    // Bloquear scroll
    document.body.classList.add('login-active');
});

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (users[selectedRole] && users[selectedRole][username] === password) {
        applyPermissions(selectedRole); // Aplicar permisos según el rol seleccionado
        const overlay = document.getElementById('loginOverlay');
        overlay.style.animation = 'fadeOut 0.5s ease forwards';
        
        // Si el usuario es admin y está en la pestaña esquema, redirigir a inserciones
        if (selectedRole === 'admin' && getCurrentTab() === 'esquema') {
            showTab('inserciones');
        }
        
        // Desbloquear scroll
        document.body.classList.remove('login-active');
        
        setTimeout(() => {
            overlay.remove();
        }, 500);
    } else {
        alert('Credenciales incorrectas');
        
        // Limpiar campos
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
        // Efecto de shake en el formulario
        const container = document.querySelector('.login-container');
        container.style.animation = 'none';
        setTimeout(() => {
            container.style.animation = 'shake 0.5s ease';
        }, 10);
    }
    
    return false;
}

function accessAsGuest() {
    applyPermissions('guest');
    document.getElementById('loginOverlay').style.display = 'none';
}

function applyPermissions(role) {
    const allTabs = ['esquema', 'inserciones', 'datos', 'consultas', 'mapa', 'graficos', 'excelImport'];
    const allowedTabs = rolePermissions[role];

    allTabs.forEach(tab => {
        const tabButton = document.querySelector(`.tab-button[onclick="showTab('${tab}')"]`);
        if (tabButton) {
            if (allowedTabs.includes(tab)) {
                tabButton.classList.remove('disabled');
            } else {
                tabButton.classList.add('disabled');
                // Si la pestaña actual está deshabilitada, cambiar a una permitida
                if (tab === getCurrentTab() && allowedTabs.length > 0) {
                    showTab(allowedTabs[0]);
                }
            }
        }
    });
}

function getCurrentTab() {
    const activeTab = document.querySelector('.tab-content.active');
    return activeTab ? activeTab.id : null;
}
