function deleteTable() {
    const tableName = document.getElementById('deleteTableDropdown').value;
    if (tableName && confirm(`¿Estás seguro de que deseas borrar la tabla "${tableName}"?`)) {
        delete schema.tables[tableName];
        ejecutarSQL(`DROP TABLE ${tableName}`);
        updateClassMap();
        alert(`Tabla "${tableName}" borrada exitosamente.`);
    }
}