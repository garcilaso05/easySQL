// Global utilities for easySQL
// This file provides safe access to ejecutarSQL and other utilities

// Helper function to ensure ejecutarSQL is available
function waitForEjecutarSQL() {
    return new Promise((resolve) => {
        if (window.ejecutarSQL) {
            resolve();
        } else {
            window.addEventListener('ejecutarSQLReady', resolve, { once: true });
        }
    });
}

// Enhanced function to safely use ejecutarSQL
async function safeEjecutarSQL(sql, params = []) {
    await waitForEjecutarSQL();
    
    if (typeof window.ejecutarSQL === 'function') {
        return await window.ejecutarSQL(sql, params);
    } else if (typeof ejecutarSQL === 'function') {
        return await ejecutarSQL(sql, params);
    } else if (typeof alasql === 'function') {
        return new Promise((resolve, reject) => {
            try {
                const result = alasql(sql, params);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    } else {
        throw new Error('No hay función de ejecución SQL disponible');
    }
}

// Make functions globally available
window.waitForEjecutarSQL = waitForEjecutarSQL;
window.safeEjecutarSQL = safeEjecutarSQL;

// Legacy alias for backwards compatibility
window.ejecutarSQL_safe = safeEjecutarSQL;