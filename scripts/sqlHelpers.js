async function cargarTablaOAVD() {
    // ...existing code...
    // Replace: ejecutarSQL(query)
    // With: await window.safeEjecutarSQL(query)
    try {
        await window.safeEjecutarSQL(query);
        // ...rest of function...
    } catch (error) {
        console.error('Error ejecutando SQL:', error);
    }
}

// ...existing functions...