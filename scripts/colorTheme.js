document.addEventListener('DOMContentLoaded', () => {
    // Verify elements exist
    const colorPickerBtn = document.getElementById('colorPickerBtn');
    const colorPickerPanel = document.getElementById('colorPickerPanel');
    const colorSlider = document.getElementById('colorSlider');
    const darkModeSwitch = document.getElementById('darkModeSwitch');

    if (!colorPickerBtn || !colorPickerPanel || !colorSlider) {
        console.error('Color picker elements not found');
        return;
    }

    // Inicializar modo oscuro según preferencia guardada
    if (darkModeSwitch) {
        const darkModePref = localStorage.getItem('darkMode') === 'true';
        darkModeSwitch.checked = darkModePref;
        document.body.classList.toggle('dark-mode', darkModePref);

        darkModeSwitch.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode', darkModeSwitch.checked);
            localStorage.setItem('darkMode', darkModeSwitch.checked);
            
            // Mantener el valor actual del slider
            const currentValue = colorSlider.value;
            updateBackgroundColor(currentValue);
            
            // Actualizar color de fondo de los gráficos existentes
            const charts = document.querySelectorAll('.highcharts-background');
            charts.forEach(chart => {
                chart.setAttribute('fill', darkModeSwitch.checked ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)');
            });
        });
    }

    // Toggle color picker panel with debug
    colorPickerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Button clicked'); // Debug line
        colorPickerPanel.style.display = colorPickerPanel.style.display === 'block' ? 'none' : 'block';
        
        if (colorPickerPanel.style.display === 'block') {
            updateBackgroundColor(colorSlider.value);
        }
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!colorPickerPanel.contains(e.target) && e.target !== colorPickerBtn) {
            colorPickerPanel.style.display = 'none';
        }
    });

    // Prevent panel from closing when clicking inside
    colorPickerPanel.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Update background color on slider change
    colorSlider.addEventListener('input', (e) => {
        updateBackgroundColor(e.target.value);
        saveColor(e.target.value);
    });

    // Función para guardar el color en localStorage
    function saveColor(value) {
        localStorage.setItem('backgroundColor', value);
    }

    // Función para obtener el color guardado
    function getSavedColor() {
        return localStorage.getItem('backgroundColor') || '100';
    }

    // Función para actualizar el color de fondo
    function updateBackgroundColor(value) {
        let backgroundColor;
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        if (isDarkMode) {
            // Nueva paleta de colores para modo oscuro (azul oscuro a negro)
            const numericValue = parseInt(value);
            if (numericValue <= 33) {
                // De azul oscuro (rgb(26, 35, 60)) a azul más oscuro
                const component = 60 - Math.round((numericValue / 33) * 30);
                backgroundColor = `rgb(26, 35, ${component})`;
            } else if (numericValue <= 66) {
                // De azul más oscuro a gris muy oscuro
                const progress = (numericValue - 33) / 33;
                const r = Math.round(26 - (progress * 15));
                const g = Math.round(35 - (progress * 25));
                const b = Math.round(30 - (progress * 20));
                backgroundColor = `rgb(${r}, ${g}, ${b})`;
            } else {
                // De gris muy oscuro a negro
                const component = Math.round(10 - ((numericValue - 66) / 34) * 10);
                backgroundColor = `rgb(${component}, ${component}, ${component})`;
            }
        } else {
            // Mantener la paleta original para modo claro
            if (value <= 33) {
                const component = Math.round((value / 33) * 255);
                const blue = 255 - Math.round((value / 33) * 127);
                backgroundColor = `rgb(${255 - component}, ${255 - component}, ${blue})`;
            } else if (value <= 66) {
                const progress = (value - 33) / 33;
                const r = Math.round(26 + (progress * 102));
                const g = Math.round(35 + (progress * 93));
                const b = Math.round(126 + (progress * 2));
                backgroundColor = `rgb(${r}, ${g}, ${b})`;
            } else {
                const component = Math.round(((value - 66) / 34) * 128);
                backgroundColor = `rgb(${128 - component}, ${128 - component}, ${128 - component})`;
            }
        }
        
        document.body.style.backgroundColor = backgroundColor;
        saveColor(value);
    }

    // Inicializar con el color guardado
    const savedColor = getSavedColor();
    colorSlider.value = savedColor;
    updateBackgroundColor(savedColor);

    // Animation controls
    const titleAnimation = document.getElementById('titleAnimation');
    const particlesAnimation = document.getElementById('particlesAnimation');
    const circlesAnimation = document.getElementById('circlesAnimation');
    const shapesSection = document.getElementById('shapesSection');
    const shapeInputs = document.querySelectorAll('input[name="bgShape"]');

    // Load saved states and shape type
    titleAnimation.checked = localStorage.getItem('titleAnimation') !== 'false';
    particlesAnimation.checked = localStorage.getItem('particlesAnimation') !== 'false';
    circlesAnimation.checked = localStorage.getItem('circlesAnimation') !== 'false';
    const savedShape = localStorage.getItem('bgShapeType') || 'circle';
    document.querySelector(`input[name="bgShape"][value="${savedShape}"]`).checked = true;

    // Mostrar/ocultar sección de formas según el estado
    shapesSection.style.display = circlesAnimation.checked ? 'block' : 'none';

    // Apply initial states
    updateAnimationStates();

    // Event listeners for switches
    titleAnimation.addEventListener('change', () => {
        localStorage.setItem('titleAnimation', titleAnimation.checked);
        updateAnimationStates();
    });

    particlesAnimation.addEventListener('change', () => {
        localStorage.setItem('particlesAnimation', particlesAnimation.checked);
        updateAnimationStates();
    });

    circlesAnimation.addEventListener('change', () => {
        localStorage.setItem('circlesAnimation', circlesAnimation.checked);
        shapesSection.style.display = circlesAnimation.checked ? 'block' : 'none';
        updateAnimationStates();
    });

    // Event listeners for shape radio buttons
    shapeInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (input.checked) {
                const newShape = input.value;
                localStorage.setItem('bgShapeType', newShape);
                window.animationControls.shapeType = newShape;
                
                // Limpiar y regenerar formas existentes con la nueva forma
                const circles = document.querySelectorAll('.bg-circle');
                circles.forEach(circle => {
                    circle.classList.remove('circle', 'square', 'triangle');
                    if (newShape !== 'circle') {
                        circle.classList.add(newShape);
                    }
                });
                
                // Crear algunas formas iniciales si no hay ninguna
                if (circles.length === 0 && window.animationControls.circlesEnabled) {
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => window.createBackgroundCircle(), i * 200);
                    }
                }
            }
        });
    });

    function updateAnimationStates() {
        // Asegurarnos de que window.animationControls existe
        window.animationControls = window.animationControls || {};
        
        // Actualizar controles globales
        window.animationControls.titleEnabled = titleAnimation.checked;
        window.animationControls.particlesEnabled = particlesAnimation.checked;
        window.animationControls.circlesEnabled = circlesAnimation.checked;

        // Actualizar el tipo de forma actual
        const checkedInput = document.querySelector('input[name="bgShape"]:checked');
        if (checkedInput) {
            window.animationControls.shapeType = checkedInput.value;
        }

        // Título flotante
        const title = document.querySelector('#titulin');
        if (title && !titleAnimation.checked) {
            title.style.transform = 'none';
        }

        // Limpiar partículas existentes si se desactivan
        if (!particlesAnimation.checked) {
            document.querySelectorAll('.particle').forEach(particle => {
                particle.remove();
            });
        }

        // Limpiar círculos existentes si se desactivan
        if (!circlesAnimation.checked) {
            document.querySelectorAll('.bg-circle').forEach(circle => {
                circle.remove();
            });
        }
    }
});
