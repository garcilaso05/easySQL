function showWarningDialog(title, message, onConfirm) {
    return new Promise((resolve) => {
        // Crear el overlay
        const overlay = document.createElement('div');
        overlay.className = 'warning-dialog-overlay';
        
        overlay.innerHTML = `
            <div class="warning-dialog-content">
                <div class="warning-dialog-header">
                    <div class="warning-icon">⚠️</div>
                    <h3>${title}</h3>
                </div>
                <div class="warning-dialog-body">
                    <p>${message.replace(/\n/g, '<br>')}</p>
                </div>
                <div class="warning-dialog-footer">
                    <button class="warning-btn warning-btn-accept">Entendido - Continuar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Manejar el click en el botón
        overlay.querySelector('.warning-btn-accept').addEventListener('click', () => {
            overlay.remove();
            if (onConfirm) onConfirm();
            resolve(true);
        });
        
        // Permitir cerrar con ESC
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handleKeydown);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    });
}

// Añadir estilos CSS
const warningDialogStyles = `
.warning-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(3px);
    z-index: 4000;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: fadeIn 0.3s ease-out;
}

.warning-dialog-content {
    background: white;
    border-radius: 12px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    border: 2px solid #ff9800;
    animation: slideIn 0.3s ease-out;
}

.warning-dialog-header {
    background: linear-gradient(135deg, #ff9800, #f57c00);
    color: white;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.warning-icon {
    font-size: 2rem;
    animation: pulse 2s infinite;
}

.warning-dialog-header h3 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 600;
}

.warning-dialog-body {
    padding: 2rem;
    line-height: 1.6;
    color: #333;
    overflow-y: auto;
    max-height: 300px;
}

.warning-dialog-body p {
    margin: 0;
    font-size: 1rem;
}

.warning-dialog-footer {
    padding: 1rem 2rem 2rem;
    display: flex;
    justify-content: center;
}

.warning-btn {
    padding: 0.8rem 2rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.warning-btn-accept {
    background: #ff9800;
    color: white;
}

.warning-btn-accept:hover {
    background: #f57c00;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideIn {
    from { 
        opacity: 0;
        transform: translateY(-50px) scale(0.9);
    }
    to { 
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}
`;

// Inyectar estilos
if (!document.getElementById('warning-dialog-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'warning-dialog-styles';
    styleSheet.textContent = warningDialogStyles;
    document.head.appendChild(styleSheet);
}
