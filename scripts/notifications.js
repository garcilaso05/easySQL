let activeNotifications = [];
const NOTIFICATION_HEIGHT = 80; // Altura aproximada de cada notificación
const NOTIFICATION_MARGIN = 10; // Margen entre notificaciones

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    
    const icon = getNotificationIcon(type);
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Añadir a la lista de notificaciones activas
    activeNotifications.push(notification);
    
    // Reposicionar todas las notificaciones
    repositionNotifications();
    
    // Animación de entrada
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            // Remover de la lista de activas
            activeNotifications = activeNotifications.filter(n => n !== notification);
            notification.remove();
            // Reposicionar las restantes
            repositionNotifications();
        }, 300);
    }, 3000);
}

function repositionNotifications() {
    let currentTop = 60; // Posición inicial desde el top
    
    activeNotifications.forEach((notification, index) => {
        notification.style.transition = 'top 0.3s ease';
        notification.style.top = `${currentTop}px`;
        currentTop += NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN;
    });
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return '✓';
        case 'error': return '✕';
        case 'warning': return '⚠';
        default: return 'ℹ';
    }
}

// Reemplazar el alert nativo
window.originalAlert = window.alert;
window.alert = function(message) {
    const type = message.toLowerCase().includes('error') ? 'error' : 
                message.toLowerCase().includes('exitosa') ? 'success' :
                message.toLowerCase().includes('advert') ? 'warning' : 'info';
    showNotification(message, type);
};

function showCriticalWarning(message, onConfirm, onCancel) {
    const warningOverlay = document.createElement('div');
    warningOverlay.className = 'critical-warning-overlay';
    
    warningOverlay.innerHTML = `
        <div class="critical-warning-content">
            <div class="warning-header">
                <span class="warning-icon">⚠️</span>
                <h2>¡ADVERTENCIA CRÍTICA!</h2>
            </div>
            <div class="warning-message">${message}</div>
            <div class="warning-buttons">
                <button class="btn-cancel">Cancelar</button>
                <button class="btn-continue">Continuar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(warningOverlay);
    
    // Añadir event listeners
    warningOverlay.querySelector('.btn-cancel').addEventListener('click', () => {
        warningOverlay.remove();
        if (onCancel) onCancel();
    });
    
    warningOverlay.querySelector('.btn-continue').addEventListener('click', () => {
        warningOverlay.remove();
        if (onConfirm) onConfirm();
    });
}

// Reemplazar los confirms críticos
window.originalConfirm = window.confirm;
window.confirm = function(message) {
    if (message.includes('⚠️ ADVERTENCIA CRÍTICA ⚠️') || 
        message.includes('⚠️ ADVERTENCIA IMPORTANTE ⚠️')) {
        return new Promise((resolve) => {
            showCriticalWarning(message, 
                () => resolve(true),
                () => resolve(false)
            );
        });
    }
    return window.originalConfirm(message);
};

function showInputDialog(title, placeholder, defaultValue, onConfirm) {
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'input-dialog-overlay';
    
    dialogOverlay.innerHTML = `
        <div class="input-dialog-content">
            <div class="input-dialog-header">
                <h3>${title}</h3>
            </div>
            <div class="input-dialog-body">
                <input type="text" 
                       placeholder="${placeholder}" 
                       value="${defaultValue}"
                       class="input-dialog-field">
                <div class="input-dialog-extension">.sql</div>
            </div>
            <div class="input-dialog-footer">
                <button class="btn-cancel">Cancelar</button>
                <button class="btn-confirm">Guardar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialogOverlay);
    
    const input = dialogOverlay.querySelector('.input-dialog-field');
    input.focus();
    input.select();
    
    return new Promise((resolve) => {
        const handleConfirm = () => {
            const value = input.value.trim();
            if (value) {
                dialogOverlay.remove();
                resolve(value);
            } else {
                input.classList.add('error');
                setTimeout(() => input.classList.remove('error'), 500);
            }
        };

        dialogOverlay.querySelector('.btn-confirm').addEventListener('click', handleConfirm);
        dialogOverlay.querySelector('.btn-cancel').addEventListener('click', () => {
            dialogOverlay.remove();
            resolve(null);
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleConfirm();
        });
    });
}
