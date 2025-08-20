(function() {
    const logoText = document.querySelector('.logo-text');
    if (!logoText) return;

    let isAnimating = false;
    let animationTimeouts = [];

    // Limpiar timeouts existentes
    function clearAnimationTimeouts() {
        animationTimeouts.forEach(timeout => clearTimeout(timeout));
        animationTimeouts = [];
    }

    // Crear el logo como imagen
    const logoImg = document.createElement('img');
    logoImg.src = 'styles/eSQLlogo.png';
    logoImg.alt = 'easySQL Logo';
    logoImg.style.cssText = `
        position: absolute;
        top: 50%;
        left: -50px;
        transform: translateY(-50%);
        height: 1.6rem;
        width: auto;
        opacity: 0;
        transition: all 0.4s ease;
        pointer-events: none;
        z-index: 10;
    `;

    // Crear contenedor para el texto
    const textContainer = document.createElement('div');
    textContainer.textContent = logoText.textContent;
    textContainer.style.cssText = `
        position: relative;
        display: inline-block;
        background: inherit;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    `;

    // Crear máscara que "borra" el texto
    const textMask = document.createElement('div');
    textMask.style.cssText = `
        position: absolute;
        top: 0;
        left: -100%;
        width: 0%;
        height: 100%;
        background: rgba(0, 102, 255, 0.05);
        z-index: 2;
        transition: all 0.6s ease;
        backdrop-filter: blur(0px);
    `;

    // Crear un overlay que haga transparente el texto
    const textOverlay = document.createElement('div');
    textOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: -100%;
        width: 0%;
        height: 100%;
        background: rgba(0, 102, 255, 0.05);
        mix-blend-mode: multiply;
        z-index: 3;
        transition: all 0.6s ease;
    `;

    // Preparar estructura
    logoText.style.position = 'relative';
    logoText.style.overflow = 'visible';
    logoText.innerHTML = '';
    logoText.appendChild(textContainer);
    logoText.appendChild(logoImg);
    textContainer.appendChild(textMask);
    textContainer.appendChild(textOverlay);

    // Aplicar clip-path al textContainer para crear el efecto de borrado
    textContainer.style.clipPath = 'inset(0 0 0 0)'; // Estado inicial: texto completamente visible
    textContainer.style.transition = 'clip-path 0.4s ease'; // Misma duración que el logo

    function animateToLogo() {
        if (isAnimating) return;
        isAnimating = true;
        clearAnimationTimeouts();

        // 1. Aparecer logo desde la izquierda y empezar a moverse
        logoImg.style.opacity = '1';
        logoImg.style.left = '0px';
        
        // 2. El logo recorre el texto de izquierda a derecha (sincronizado con la máscara)
        const textWidth = textContainer.offsetWidth;
        const logoWidth = logoImg.offsetWidth || 25; // fallback
        
        animationTimeouts.push(setTimeout(() => {
            logoImg.style.left = `${textWidth - logoWidth}px`;
            // Sincronizar la máscara con el logo - mismo timing
            textContainer.style.clipPath = 'inset(0 0 0 100%)';
        }, 50)); // Reducido de 100ms a 50ms para mejor sincronización
        
        // 3. Una vez recorrido todo, centrar y agrandar mucho más (después de 500ms)
        animationTimeouts.push(setTimeout(() => {
            logoImg.style.left = '50%';
            logoImg.style.transform = 'translateY(-50%) translateX(-50%) scale(2.1)'; // Mucho más grande
            logoImg.style.filter = 'drop-shadow(0 0 15px rgba(0, 204, 255, 0.8)) drop-shadow(0 0 30px rgba(0, 204, 255, 0.4)) brightness(1.2) contrast(1.3)';
        }, 500)); // Ajustado timing
    }

    function animateToText() {
        if (!isAnimating) return;
        isAnimating = false;
        clearAnimationTimeouts();

        // 1. Reducir tamaño del logo y quitar efectos
        logoImg.style.transform = 'translateY(-50%) translateX(-50%) scale(1)';
        logoImg.style.filter = 'none';
        
        // 2. Mover logo hacia la derecha (después de 100ms)
        animationTimeouts.push(setTimeout(() => {
            const textWidth = textContainer.offsetWidth;
            const logoWidth = logoImg.offsetWidth || 25;
            logoImg.style.left = `${textWidth - logoWidth}px`;
            logoImg.style.transform = 'translateY(-50%)';
        }, 100)); // Reducido para mejor fluidez
        
        // 3. El logo recorre de derecha a izquierda restaurando el texto (después de 200ms)
        animationTimeouts.push(setTimeout(() => {
            logoImg.style.left = '0px';
            // Restaurar el texto con clip-path - mismo timing que el logo
            textContainer.style.clipPath = 'inset(0 100% 0 0)';
        }, 200)); // Ajustado timing
        
        // 4. Hacer fade out del logo (después de 450ms)
        animationTimeouts.push(setTimeout(() => {
            logoImg.style.opacity = '0';
            logoImg.style.left = '-50px';
            // Restaurar completamente el texto
            textContainer.style.clipPath = 'inset(0 0 0 0)';
        }, 450)); // Ajustado timing
    }

    // Event listeners
    logoText.addEventListener('mouseenter', animateToLogo);
    logoText.addEventListener('mouseleave', animateToText);

    // Prevenir interferencias
    logoImg.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

})();
