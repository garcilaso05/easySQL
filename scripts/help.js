document.addEventListener('DOMContentLoaded', () => {
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const navigationLinks = document.querySelectorAll('.help-navigation a');
    const helpSections = document.querySelectorAll('.help-section');
    const helpSearch = document.getElementById('helpSearch');

    // Abrir/cerrar modal
    helpBtn.addEventListener('click', () => {
        helpModal.style.display = 'block';
    });

    window.closeHelpModal = () => {
        helpModal.style.display = 'none';
    };

    // Cerrar al hacer clic fuera
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            closeHelpModal();
        }
    });

    // Navegación
    navigationLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Actualizar enlaces activos
            navigationLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Mostrar sección correspondiente
            const targetId = link.getAttribute('href').slice(1);
            helpSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
        });
    });

    // Búsqueda
    helpSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        helpSections.forEach(section => {
            const content = section.textContent.toLowerCase();
            const match = content.includes(searchTerm);
            
            // Resaltar coincidencias si hay texto de búsqueda
            if (searchTerm) {
                const regex = new RegExp(searchTerm, 'gi');
                section.innerHTML = section.innerHTML.replace(regex, match => 
                    `<mark>${match}</mark>`
                );
            }
        });
    });
});
