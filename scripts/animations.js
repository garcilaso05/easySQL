// Controles de animación globales
window.animationControls = {
    titleEnabled: true,
    particlesEnabled: true,
    circlesEnabled: true
};

document.addEventListener('DOMContentLoaded', () => {
    // Actualizar fecha y hora
    function updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        document.getElementById('datetime').textContent = 
            now.toLocaleDateString('es-ES', options);
    }

    // Actualizar inmediatamente y cada segundo
    updateDateTime();
    setInterval(updateDateTime, 1000);

    const shapes = document.querySelectorAll('.shape');
    const bgShapes = document.querySelector('.bg-shapes');
    
    // Crear más formas dinámicamente
    for(let i = 0; i < 8; i++) {
        const shape = document.createElement('div');
        shape.className = 'shape';
        bgShapes.appendChild(shape);
    }
    
    // Configurar todas las formas
    document.querySelectorAll('.shape').forEach((shape, index) => {
        const size = Math.random() * 100 + 40;
        shape.style.width = `${size}px`;
        shape.style.height = `${size}px`;
        animateShape(shape);
    });

    // Crear div para los círculos de fondo
    const backgroundCircles = document.createElement('div');
    backgroundCircles.className = 'background-circles';
    document.body.appendChild(backgroundCircles);
    
    // Generar círculos más frecuentemente
    setInterval(() => {
        if (window.animationControls.circlesEnabled && Math.random() > 0.5) { // 50% de probabilidad
            createBackgroundCircle();
        }
    }, 800); // Cada 800ms

    // Modificar el evento mousemove para respetar los controles
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        if (window.animationControls.titleEnabled) {
            const title = document.getElementById('titulin');
            const shapes = document.querySelectorAll('.shape');
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            const offsetX = (mouseX - centerX) * 0.03;
            const offsetY = (mouseY - centerY) * 0.03;
            
            title.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            
            shapes.forEach((shape, index) => {
                const factor = (index + 1) * 0.04;
                shape.style.transform = `translate(${offsetX * factor}px, ${offsetY * factor}px)`;
            });
        }

        // Crear partículas solo si están habilitadas
        if (window.animationControls && window.animationControls.particlesEnabled && Math.random() > 0.8) {
            createParticle(mouseX, mouseY);
        }
    });
});

function animateShape(shape) {
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight;
    const endX = Math.random() * window.innerWidth;
    const endY = Math.random() * window.innerHeight;
    
    shape.animate([
        {
            transform: `translate(${startX}px, ${startY}px) scale(1)`,
            opacity: 0
        },
        {
            transform: `translate(${endX}px, ${endY}px) scale(1.5)`,
            opacity: 0.05,
            offset: 0.5
        },
        {
            transform: `translate(${startX}px, ${startY}px) scale(1)`,
            opacity: 0
        }
    ], {
        duration: Math.random() * 5000 + 3000,
        iterations: Infinity,
        easing: 'ease-in-out'
    });
}

function createParticle(x, y) {
    // Verificación adicional de seguridad
    if (!window.animationControls || !window.animationControls.particlesEnabled) return;

    const container = document.querySelector('.title-container');
    if (!container) return;

    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    container.appendChild(particle);
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 3 + 2;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity;
    
    const animation = particle.animate([
        { transform: 'translate(0, 0)', opacity: 1 },
        { transform: `translate(${dx * 70}px, ${dy * 70}px)`, opacity: 0 }
    ], {
        duration: 1500,
        easing: 'ease-out'
    });

    animation.onfinish = () => particle.remove();
}

let isPageVisible = true;
let animationInterval;
const maxCircles = 20;

function createBackgroundCircle() {
    if (!window.animationControls.circlesEnabled) return;
    if (!isPageVisible) return;
    
    const circles = document.querySelectorAll('.bg-circle');
    if (circles.length >= maxCircles) {
        const oldestCircle = circles[0];
        oldestCircle.remove();
    }

    const circle = document.createElement('div');
    circle.className = 'bg-circle';
    
    // Asegurarse de que se aplica el tipo de forma actual
    const shapeType = window.animationControls.shapeType || 'circle';
    if (shapeType !== 'circle') {
        circle.classList.add(shapeType);
    }
    
    const size = Math.random() * 200 + 100;
    circle.style.width = `${size}px`;
    circle.style.height = `${size}px`;
    
    // Añadir rotación aleatoria para más variedad
    if (shapeType === 'triangle' || shapeType === 'square') {
        const rotation = Math.random() * 360;
        circle.style.transform = `rotate(${rotation}deg)`;
    }
    
    circle.style.left = `${Math.random() * 100}%`;
    circle.style.top = `${Math.random() * 100}%`;
    
    document.querySelector('.background-circles').appendChild(circle);
    
    setTimeout(() => {
        circle.remove();
    }, 5000);
}

// Hacer la función createBackgroundCircle accesible globalmente
window.createBackgroundCircle = createBackgroundCircle;

document.addEventListener('visibilitychange', function() {
    isPageVisible = !document.hidden;
    if (!isPageVisible) {
        document.querySelector('.background-circles').innerHTML = '';
        clearInterval(animationInterval);
    } else {
        animationInterval = setInterval(createBackgroundCircle, 1000);
    }
});

// Initialize animation when page loads
document.addEventListener('DOMContentLoaded', function() {
    animationInterval = setInterval(createBackgroundCircle, 1000);
});

// Limpiar partículas periódicamente
setInterval(() => {
    const particles = document.querySelectorAll('.particle');
    particles.forEach(particle => {
        if(!particle.getAnimations().length) {
            particle.remove();
        }
    });
}, 2000);
