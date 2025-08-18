(function() {
    const bar = document.querySelector('.top-bar');
    const nav = document.querySelector('.tab-nav');
    if (!bar || !nav) return;

    let rafId = null;

    function compute() {
        rafId && cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            // Reset para medición limpia
            bar.style.height = 'auto';
            bar.style.paddingTop = '8px';
            bar.style.paddingBottom = '10px';

            const children = [...bar.children].filter(el => getComputedStyle(el).display !== 'none');
            if (!children.length) return;

            // Calcular top/bottom ocupados
            let minTop = Infinity;
            let maxBottom = -Infinity;
            children.forEach(el => {
                const top = el.offsetTop;
                const bottom = top + el.offsetHeight;
                if (top < minTop) minTop = top;
                if (bottom > maxBottom) maxBottom = bottom;
            });

            const contentHeight = maxBottom - minTop;
            const extra = 4; // respiración extra
            const total = contentHeight + 8 + 10 + extra;

            // Asignar altura final (auto ya funciona, pero fijar evita “saltos” durante wrap rápido)
            bar.style.height = total + 'px';
        });
    }

    // Observadores
    const resizeObserver = new ResizeObserver(compute);
    resizeObserver.observe(bar);
    resizeObserver.observe(nav);

    const mutationObserver = new MutationObserver(compute);
    mutationObserver.observe(nav, { childList: true, attributes: true, subtree: true });

    window.addEventListener('resize', compute);
    window.addEventListener('load', compute);

    // Recalcular tras pequeña demora (fonts / layout async)
    setTimeout(compute, 150);
})();
