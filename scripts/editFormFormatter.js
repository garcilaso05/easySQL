class EditFormFormatter {
    constructor() {
        this.init();
    }

    init() {
        this.setupFormatting();
        this.observeEditForm();
    }

    setupFormatting() {
        const editForms = document.querySelectorAll('.edit-form');
        editForms.forEach(form => this.formatEditForm(form));
    }

    formatEditForm(form) {
        const labels = form.querySelectorAll('.input-field label');
        labels.forEach(label => {
            // Obtener el texto original
            const originalText = label.textContent;
            
            // Crear el texto formateado reemplazando _ por espacios
            const formattedText = originalText.replace(/_/g, ' ');
            
            // Actualizar el texto visible manteniendo el original como atributo
            label.textContent = formattedText;
            label.setAttribute('data-original', originalText);
        });
    }

    observeEditForm() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Es un elemento
                        if (node.classList.contains('edit-form')) {
                            this.formatEditForm(node);
                        }
                        // Buscar también dentro del nodo añadido
                        const forms = node.querySelectorAll('.edit-form');
                        forms.forEach(form => this.formatEditForm(form));
                    }
                });
            });
        });

        // Observar el documento completo para detectar cuándo se añade el formulario
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.editFormFormatter = new EditFormFormatter();
});
