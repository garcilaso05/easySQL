function openEditEnumModal() {
    const enumName = document.getElementById('enumDropdown').value;
    if (!enumName) {
        alert('Por favor, selecciona un enum para editar.');
        return;
    }

    // Verificar si el enum está siendo usado en alguna tabla
    let enumUsage = [];
    for (const tableName in schema.tables) {
        if (!schema.tables[tableName].isEnum) {
            const table = schema.tables[tableName];
            table.columns.forEach(column => {
                if (column.type === enumName) {
                    enumUsage.push(tableName);
                }
            });
        }
    }

    if (enumUsage.length > 0) {
        const confirmation = confirm(
            '⚠️ ADVERTENCIA ⚠️\n\n' +
            `Este enum está siendo utilizado en las siguientes tablas:\n${enumUsage.join(', ')}\n\n` +
            'La modificación de valores puede causar:\n' +
            '- Inconsistencias en los datos existentes\n' +
            '- Errores en las restricciones CHECK\n' +
            '- Problemas con las inserciones existentes\n\n' +
            '¿Estás seguro de que deseas continuar con la edición?'
        );
        if (!confirmation) return;
    }

    const enumData = schema.tables[enumName];
    if (!enumData || !enumData.isEnum) {
        alert('El elemento seleccionado no es un enum válido.');
        return;
    }

    const container = document.getElementById('editEnumValuesContainer');
    container.innerHTML = ''; // Reiniciar el contenedor

    enumData.values.forEach(value => {
        const valueInput = document.createElement('div');
        valueInput.className = 'enum-value-input';
        valueInput.innerHTML = `
            <input type="text" value="${value}" class="enum-value">
            <button onclick="removeEnumValueInput(this)">Eliminar</button>
        `;
        container.appendChild(valueInput);
    });

    // Hacer el contenedor desplazable
    container.style.maxHeight = '300px';
    container.style.overflowY = 'auto';

    document.getElementById('editEnumName').value = enumName;
    document.getElementById('editEnumModal').style.display = 'block';
}

function addEnumValueInput() {
    const container = document.getElementById('editEnumValuesContainer');
    const valueInput = document.createElement('div');
    valueInput.className = 'enum-value-input';
    valueInput.innerHTML = `
        <input type="text" placeholder="Nuevo valor del Enum" class="enum-value">
        <button onclick="removeEnumValueInput(this)">Eliminar</button>
    `;
    container.appendChild(valueInput);
}

function removeEnumValueInput(button) {
    const container = document.getElementById('editEnumValuesContainer');
    container.removeChild(button.parentElement);
}

function saveEnumChanges() {
    const enumName = document.getElementById('editEnumName').value.trim();
    const values = [];
    const valueInputs = document.querySelectorAll('#editEnumValuesContainer .enum-value-input .enum-value');
    valueInputs.forEach(input => {
        const value = input.value.trim();
        if (value) values.push(value);
    });

    if (values.length === 0) {
        alert('Por favor, añade al menos un valor.');
        return;
    }

    schema.tables[enumName].values = values; // Update the enum values in the schema
    populateEnumDropdown(); // Añadido para actualizar el dropdown
    updateClassMap(); // Update the visualization
    closeEditEnumModal();
    alert(`Enum "${enumName}" actualizado exitosamente.`);
}

function closeEditEnumModal() {
    document.getElementById('editEnumModal').style.display = 'none';
}

function openDeleteEnumModal(enumName) {
    if (!enumName) {
        alert('Por favor, selecciona un enum para borrar.');
        return;
    }

    // Verificar si el enum está siendo usado en alguna tabla
    let enumUsage = [];
    for (const tableName in schema.tables) {
        if (!schema.tables[tableName].isEnum) {
            const table = schema.tables[tableName];
            table.columns.forEach(column => {
                if (column.type === enumName) {
                    enumUsage.push(tableName);
                }
            });
        }
    }

    if (enumUsage.length > 0) {
        alert(`No se puede eliminar el enum "${enumName}" porque está siendo utilizado en las siguientes tablas:\n\n${enumUsage.join('\n')}`);
        return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar completamente el enum "${enumName}"?`)) {
        delete schema.tables[enumName];
        updateClassMap();
        populateEnumDropdown();
        alert(`Enum "${enumName}" eliminado correctamente.`);
    }
}
