(function() {
    const bar = document.querySelector('.top-bar');
    const nav = document.querySelector('.tab-nav');
    if (!bar || !nav) return;

    const MIN_ITEM_WIDTH = 110;   // ancho mínimo aceptable en modo fila
    const COMPACT_THRESHOLD = 140; // debajo de esto aplicamos .compact (opcional)

    function computeAvailable() {
        const barStyle = getComputedStyle(bar);
        const navStyle = getComputedStyle(nav);
        const horizontalPadding = parseFloat(barStyle.paddingLeft) + parseFloat(barStyle.paddingRight);
        const gap = parseFloat(navStyle.columnGap || navStyle.gap || 0);
        const logo = bar.querySelector('.logo-text');
        const logoWidth = logo ? (logo.offsetWidth + 24) : 0;
        const available = bar.clientWidth - horizontalPadding - logoWidth;
        const items = [...nav.children].filter(el => el.offsetParent !== null);
        const count = items.length || 1;
        // Restar espacio ocupado por gaps
        const totalGaps = gap * (count - 1);
        const perItem = (available - totalGaps) / count;
        return { perItem, count };
    }

    function applyLayout() {
        bar.classList.remove('stacked', 'compact');

        const { perItem } = computeAvailable();

        if (perItem < MIN_ITEM_WIDTH) {
            // Modo 2 (stacked)
            bar.classList.add('stacked');
            return;
        }

        // Modo fila (uniforme). Añadir compacto si está cerca del límite.
        if (perItem < COMPACT_THRESHOLD) {
            bar.classList.add('compact');
        }
    }

    let raf;
    function schedule() {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(applyLayout);
    }

    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    document.addEventListener('DOMContentLoaded', schedule);
    window.addEventListener('load', schedule);

    const mo = new MutationObserver(schedule);
    mo.observe(nav, { childList: true, attributes: true, subtree: true });

    setTimeout(schedule, 300);
})();
