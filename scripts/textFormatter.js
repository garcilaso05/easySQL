class TextFormatter {
    constructor() {
        this.init();
    }

    init() {
        this.setupTextFormatting();
        this.observeDOM();
    }

    setupTextFormatting() {
        // Formatear todos los elementos que necesitan formateo de texto
        const elements = document.querySelectorAll(
            '.input-field label, .search-field label, .data-label, .data-row .data-value, .edit-form .input-field label'
        );
        elements.forEach(element => this.formatLabel(element));
    }

    formatLabel(element) {
        // Obtener el texto original
        const originalText = element.textContent;
        
        // Crear el texto formateado reemplazando _ por espacios
        const formattedText = originalText.replace(/_/g, ' ');
        
        if (element.classList.contains('scroll-text')) {
            // Si es un elemento scroll-text, actualizar solo el contenido
            element.textContent = formattedText;
        } else {
            // Si es un label normal, crear la estructura necesaria
            element.textContent = '';  // Limpiar el contenido actual
            
            const textSpan = document.createElement('span');
            textSpan.className = 'scroll-text';
            textSpan.textContent = formattedText;
            
            element.appendChild(textSpan);
        }
        
        // Mantener el texto original como atributo de datos
        element.setAttribute('data-original', originalText);
    }

    observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Es un elemento
                        const elements = node.querySelectorAll(
                            '.input-field label, .search-field label, .data-label, .data-row .data-value, .edit-form .input-field label'
                        );
                        elements.forEach(element => this.formatLabel(element));
                    }
                });
            });
        });

        // Observar los contenedores principales
        ['inserciones', 'datos', 'data-container'].forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                observer.observe(container, {
                    childList: true,
                    subtree: true
                });
            }
        });
    }

    // Método para obtener el texto original si es necesario
    static getOriginalText(label) {
        return label.getAttribute('data-original') || label.textContent;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.textFormatter = new TextFormatter();
});
