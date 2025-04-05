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
    
    if (username === 'admin' && password === '1234') {
        const overlay = document.getElementById('loginOverlay');
        overlay.style.animation = 'fadeOut 0.5s ease forwards';
        
        // Desbloquear scroll
        document.body.classList.remove('login-active');
        
        setTimeout(() => {
            overlay.remove();
        }, 500);
    } else {
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
