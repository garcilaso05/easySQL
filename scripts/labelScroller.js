class LabelScroller {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollers();
        this.observeDOM();
    }

    setupScrollers() {
        const labels = document.querySelectorAll('.input-field label');
        labels.forEach(label => this.checkAndSetupLabel(label));
    }

    checkAndSetupLabel(label) {
        // Evita duplicar spans si ya existe
        if (label.querySelector('.scroll-text')) return;

        // Crear un span para el texto
        const span = document.createElement('span');
        span.className = 'scroll-text';
        
        // Guardar el texto original y crear el texto formateado
        const originalText = label.textContent;
        const formattedText = originalText.replace(/_/g, ' ');
        
        // Establecer el texto formateado como atributo data para CSS
        label.setAttribute('data-display', formattedText);
        span.textContent = formattedText;

        // Limpiar el label y añadir el span
        label.textContent = '';
        label.appendChild(span);
        
        // Medir el ancho del texto y del contenedor
        const textWidth = span.offsetWidth;
        const containerWidth = label.offsetWidth;

        // Siempre añadimos la clase scrollable
        label.classList.add('scrollable');
        
        // Si el texto es más largo que el contenedor, añadimos la clase overflow
        if (textWidth > containerWidth) {
            label.classList.add('overflow');
        }

        this.setupScrollAnimation(label, span);
    }

    setupScrollAnimation(label, span) {
        label.classList.add('scrollable');
        
        // Eventos del mouse
        label.addEventListener('mouseenter', () => {
            span.classList.add('scrolling');
        });

        label.addEventListener('mouseleave', () => {
            span.classList.remove('scrolling');
        });
    }

    observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Es un elemento
                        const labels = node.querySelectorAll('.input-field label');
                        labels.forEach(label => this.checkAndSetupLabel(label));
                    }
                });
            });
        });

        // Observar cambios en el contenedor de inserciones
        const insertionsContainer = document.getElementById('inserciones');
        if (insertionsContainer) {
            observer.observe(insertionsContainer, {
                childList: true,
                subtree: true
            });
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.labelScroller = new LabelScroller();
});

// Función para reinicializar en caso necesario
function reinitializeScrollers() {
    if (window.labelScroller) {
        window.labelScroller.setupScrollers();
    } else {
        window.labelScroller = new LabelScroller();
    }
}
