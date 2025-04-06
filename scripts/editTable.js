function openEditTableModal() {
    const tableName = document.getElementById('tableDropdown').value;
    if (!tableName) {
        alert('Por favor, selecciona una tabla para editar.');
        return;
    }

    // Verificar si hay datos en la tabla
    try {
        const tableData = alasql(`SELECT * FROM ${tableName}`);
        if (tableData.length > 0) {
            const confirmation = confirm(
                '⚠️ ADVERTENCIA ⚠️\n\n' +
                'Esta tabla contiene datos insertados. La modificación o eliminación de elementos puede causar:\n\n' +
                '- Pérdida de datos existentes\n' +
                '- Inconsistencias en las relaciones\n' +
                '- Errores en las consultas existentes\n\n' +
                '¿Estás seguro de que deseas continuar con la edición?'
            );
            if (!confirmation) return;
        }
    } catch (error) {
        console.error('Error al verificar datos de la tabla:', error);
    }

    const table = schema.tables[tableName];
    const container = document.getElementById('editColumnsContainer');
    container.innerHTML = ''; // Reiniciar el contenedor

    table.columns.forEach(col => {
        const newInput = document.createElement('div');
        newInput.className = 'column-input';
        newInput.innerHTML = `
            <input type="text" value="${col.name}" class="col-name">
            <select class="col-type">
                <option value="INT" ${col.type === 'INT' ? 'selected' : ''}>INT</option>
                <option value="STRING" ${col.type === 'STRING' ? 'selected' : ''}>STRING</option>
                <option value="FLOAT" ${col.type === 'FLOAT' ? 'selected' : ''}>FLOAT</option>
                <option value="BOOLEAN" ${col.type === 'BOOLEAN' ? 'selected' : ''}>BOOLEAN</option>
                <option value="DATE" ${col.type === 'DATE' ? 'selected' : ''}>DATE</option>
                ${Object.keys(schema.tables)
                    .filter(enumName => schema.tables[enumName].isEnum)
                    .map(enumName => `<option value="${enumName}" ${col.type === enumName ? 'selected' : ''}>${enumName}</option>`)
                    .join('')}
            </select>
            <label><input type="checkbox" class="col-pk" ${col.pk ? 'checked' : ''} disabled> Clave Primaria</label>
            <label><input type="checkbox" class="col-notnull" ${col.notNull ? 'checked' : ''} ${col.pk ? 'disabled' : ''}> NOT NULL</label>
            <button onclick="removeColumnInput(this)" class="remove-column" ${col.pk ? 'disabled' : ''}>Eliminar</button>
        `;
        container.appendChild(newInput);
    });

    // Hacer el contenedor de columnas desplazable
    container.style.maxHeight = '300px';
    container.style.overflowY = 'auto';

    document.getElementById('editTableModal').style.display = 'block';
}

function closeEditTableModal() {
    document.getElementById('editTableModal').style.display = 'none';
}

function saveTableChanges() {
    const tableName = document.getElementById('tableDropdown').value;
    const columns = [];
    const columnInputs = document.querySelectorAll('#editColumnsContainer .column-input');
    let error = false;

    columnInputs.forEach(input => {
        const name = input.querySelector('.col-name').value.trim();
        const type = input.querySelector('.col-type').value;
        const pk = input.querySelector('.col-pk').checked;

        if (name) {
            try {
                let colDef = `${name} ${type}`;
                if (schema.tables[type]?.isEnum) {
                    const enumValues = schema.tables[type].values;
                    if (!enumValues || enumValues.length === 0) {
                        throw new Error(`El enum ${type} no tiene valores definidos`);
                    }
                    const enumValuesStr = enumValues.map(val => `'${val}'`).join(', ');
                    colDef += ` CHECK(${name} IS NULL OR ${name} IN (${enumValuesStr}))`;
                }
                if (pk) {
                    if (colDef.includes('IS NULL')) {
                        throw new Error('Una clave primaria no puede ser NULL');
                    }
                    colDef += ' PRIMARY KEY';
                }
                columns.push({
                    name,
                    type,
                    pk,
                    definition: colDef
                });
            } catch (e) {
                error = true;
                alert(`Error en la columna ${name}: ${e.message}`);
                return;
            }
        }
    });

    if (error || columns.length === 0) {
        if (!error) alert('Por favor, añade al menos un elemento.');
        return;
    }

    const query = `CREATE TABLE ${tableName} (${columns.map(col => col.definition).join(', ')})`;
    try {
        alasql(`DROP TABLE ${tableName}`);
        alasql(query);
        schema.tables[tableName] = {
            columns: columns.map(({name, type, pk}) => ({name, type, pk})),
            data: []
        };
        updateClassMap();
        closeEditTableModal();
        alert(`Tabla "${tableName}" actualizada exitosamente.`);
    } catch (e) {
        alert('Error al actualizar la tabla: ' + e.message);
    }
}

function deleteTableFromModal() {
    const tableName = document.getElementById('tableDropdown').value;
    if (tableName && confirm(`¿Estás seguro de que deseas borrar la tabla "${tableName}"?`)) {
        delete schema.tables[tableName];
        alasql(`DROP TABLE ${tableName}`);
        updateClassMap();
        closeEditTableModal();
        alert(`Tabla "${tableName}" borrada exitosamente.`);
    }
}

function editTable() {
    openEditTableModal();
}

function editTableOrEnum() {
    const tableName = document.getElementById('tableDropdown').value;
    if (!tableName) {
        alert('Por favor, selecciona una tabla o enum para editar.');
        return;
    }

    const table = schema.tables[tableName];
    if (table.isEnum) {
        openEditEnumModal(tableName);
    } else {
        openEditTableModal();
    }
}

function openEditEnumModal(enumName) {
    const enumData = schema.tables[enumName];
    const container = document.getElementById('editEnumValuesContainer');
    container.innerHTML = ''; // Reiniciar el contenedor

    enumData.values.forEach(value => {
        const newInput = document.createElement('div');
        newInput.className = 'enum-value-input';
        newInput.innerHTML = `
            <input type="text" value="${value}" class="enum-value">
            <button onclick="removeEnumValueInput(this)">Eliminar</button>
        `;
        container.appendChild(newInput);
    });

    document.getElementById('editEnumName').value = enumName;
    document.getElementById('editEnumModal').style.display = 'block';
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

    schema.tables[enumName].values = values;
    updateClassMap();
    closeEditEnumModal();
    alert(`Enum "${enumName}" actualizado exitosamente.`);
}

function closeEditEnumModal() {
    document.getElementById('editEnumModal').style.display = 'none';
}

function addColumnInputEdit() {
    const container = document.getElementById('editColumnsContainer');
    const newInput = document.createElement('div');
    newInput.className = 'column-input';
    newInput.innerHTML = `
        <input type="text" placeholder="Nombre de elemento" class="col-name">
        <select class="col-type">
            <option value="INT">INT</option>
            <option value="STRING">STRING</option>
            <option value="FLOAT">FLOAT</option>
            <option value="BOOLEAN">BOOLEAN</option>
            <option value="DATE">DATE</option>
            ${Object.keys(schema.tables)
                .filter(tableName => schema.tables[tableName].isEnum)
                .map(enumName => `<option value="${enumName}">${enumName}</option>`)
                .join('')}
        </select>
        <label><input type="checkbox" class="col-pk" disabled title="No se puede modificar la clave primaria"> Clave Primaria</label>
        <button onclick="removeColumnInput(this)" class="remove-column">Eliminar</button>
    `;
    container.appendChild(newInput);
}

// Actualización de la función removeColumnInput para ambos casos
function removeColumnInput(button) {
    const columnDiv = button.parentElement;
    const isPK = columnDiv.querySelector('.col-pk').checked;
    
    if (isPK && document.getElementById('editTableModal').style.display === 'block') {
        alert('No se puede eliminar una columna que es clave primaria');
        return;
    }
    
    const container = columnDiv.parentElement;
    container.removeChild(columnDiv);
}