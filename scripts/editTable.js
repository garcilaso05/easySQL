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
            const message = 
                'Esta tabla contiene datos insertados. La modificación puede causar:\n\n' +
                '1. Si marca una columna como NOT NULL:\n' +
                '   - Se eliminarán TODAS las inserciones que tengan NULL en esa columna\n' +
                '   - Esta acción NO se puede deshacer\n\n' +
                '2. Si añade nuevas columnas:\n' +
                '   - Se añadirán como NULL en las inserciones existentes\n' +
                '   - Si luego las marca como NOT NULL, se borrarán TODAS las inserciones\n\n' +
                '3. Se recomienda:\n' +
                '   - Tener la pestaña de datos abierta con las inserciones cargadas\n' +
                '   - Revisar los valores NULL antes de marcar columnas como NOT NULL\n' +
                '   - Asignar valores a las nuevas columnas antes de marcarlas NOT NULL';

            showWarningDialog(
                'Advertencia: Tabla con Datos',
                message,
                () => {
                    // Continuar con la apertura del modal de edición
                    openEditTableModalContent(tableName);
                }
            );
            return;
        }
    } catch (error) {
        console.error('Error al verificar datos de la tabla:', error);
    }

    // Si no hay advertencias, abrir directamente
    openEditTableModalContent(tableName);
}

function openEditTableModalContent(tableName) {
    const table = schema.tables[tableName];
    const container = document.getElementById('editColumnsContainer');
    container.innerHTML = ''; // Reiniciar el contenedor

    table.columns.forEach(col => {
        const newInput = document.createElement('div');
        newInput.className = 'column-input';
        const notNullId = `notNull_${col.name}_${Date.now()}`; // ID único para el checkbox
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
            <label><input type="checkbox" class="col-notnull" id="${notNullId}"
                ${col.notNull ? 'checked' : ''} 
                ${col.pk ? 'disabled' : ''}> NOT NULL</label>
            <button onclick="removeColumnInput(this)" class="remove-column" ${col.pk ? 'disabled' : ''}>Eliminar</button>
            <div class="column-order-buttons">
                <button onclick="moveColumn(this, 'up')" class="move-col-btn up-btn">▲</button>
                <button onclick="moveColumn(this, 'down')" class="move-col-btn down-btn">▼</button>
            </div>
        `;
        container.appendChild(newInput);

        // Añadir el event listener después de que el elemento exista en el DOM
        const notNullCheckbox = document.getElementById(notNullId);
        notNullCheckbox.addEventListener('change', () => handleNotNullChange(notNullCheckbox, tableName, col.name));
    });

    // Hacer el contenedor de columnas desplazable
    container.style.maxHeight = '300px';
    container.style.overflowY = 'auto';

    document.getElementById('editTableModal').style.display = 'block';
    updateColumnOrderButtons(container);
}

function handleNotNullChange(checkbox, tableName, columnName) {
    // Esta función se llamará antes de permitir el cambio
    try {
        const query = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${columnName} IS NULL`;
        const result = alasql(query);
        const nullCount = result[0].count;

        if (nullCount > 0) {
            // Desmarcar el checkbox inmediatamente
            checkbox.checked = !checkbox.checked;
            
            const continuar = confirm(
                `Se han encontrado ${nullCount} registros con valor NULL en la columna "${columnName}".\n\n` +
                `Si marca esta columna como NOT NULL:\n` +
                `1. Se eliminarán TODOS los registros que contengan NULL en esta columna\n` +
                `2. Esta acción NO SE PUEDE DESHACER\n\n` +
                `Se recomienda:\n` +
                `1. Cancelar esta operación (pulse Cancelar)\n` +
                `2. Ir a la pestaña de datos\n` +
                `3. Asignar valores válidos a los registros con NULL\n` +
                `4. Volver a intentar esta operación\n\n` +
                `¿Está COMPLETAMENTE SEGURO de que desea continuar y ELIMINAR los registros con NULL?`
            );

            if (continuar) {
                checkbox.checked = true; // Solo marcar si el usuario confirma
            }
        }
    } catch (e) {
        console.log('No hay datos en la tabla o es una tabla nueva');
    }
}

function closeEditTableModal() {
    document.getElementById('editTableModal').style.display = 'none';
}

function saveTableChanges() {
    const tableName = document.getElementById('tableDropdown').value;
    const columns = [];
    const columnInputs = document.querySelectorAll('#editColumnsContainer .column-input');
    let error = false;

    // Verificar que hay exactamente una PK
    const pkCount = Array.from(columnInputs).filter(input => 
        input.querySelector('.col-pk').checked
    ).length;

    if (pkCount !== 1) {
        alert('La tabla debe tener exactamente una clave primaria.');
        return;
    }

    // Store old structure before changes
    const oldStructure = [...schema.tables[tableName].columns];

    columnInputs.forEach(input => {
        const name = input.querySelector('.col-name').value.trim();
        const type = input.querySelector('.col-type').value;
        const pk = input.querySelector('.col-pk').checked;
        const notNull = input.querySelector('.col-notnull').checked;

        if (name) {
            try {
                let colDef = `${name} ${type}`;
                if (pk) {
                    colDef += ' PRIMARY KEY';
                } else if (notNull) {
                    colDef += ' NOT NULL';
                }
                columns.push({
                    name: name,
                    type: type,
                    pk: pk,
                    notNull: notNull,
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

    try {
        // Use the new migration system
        const migrator = new TableDataMigrator();
        const newStructure = columns.map(({name, type, pk, notNull}) => ({
            name, type, pk, notNull
        }));

        // Execute migration
        const migrationResult = migrator.executeMigration(tableName, oldStructure, newStructure);

        // Update schema
        schema.tables[tableName] = {
            columns: newStructure,
            data: []
        };

        // Clear old insert history since we've migrated the data
        if (schema.insertHistory && schema.insertHistory[tableName]) {
            delete schema.insertHistory[tableName];
        }

        // Notify of successful migration
        let message = `Tabla "${tableName}" actualizada exitosamente.`;
        if (migrationResult.recordsMigrated > 0) {
            message += `\n${migrationResult.recordsMigrated} registros migrados automáticamente.`;
            if (migrationResult.changes.length > 0) {
                message += `\nCambios aplicados: ${migrationResult.changes.map(c => c.type).join(', ')}`;
            }
        }

        // Notify the change and update interface
        const event = new CustomEvent('tableStructureChanged', {
            detail: { 
                tableName: tableName,
                migrationResult: migrationResult
            }
        });
        document.dispatchEvent(event);

        updateClassMap();
        closeEditTableModal();
        
        // Show success notification instead of alert
        if (window.showNotification) {
            showNotification(message, 'success');
        } else {
            alert(message);
        }
        
    } catch (e) {
        const errorMessage = `Error al actualizar la tabla: ${e.message}`;
        if (window.showNotification) {
            showNotification(errorMessage, 'error');
        } else {
            alert(errorMessage);
        }
        console.error(e);
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
        <label><input type="checkbox" class="col-pk" disabled> Clave Primaria</label>
        <label><input type="checkbox" class="col-notnull"> NOT NULL</label>
        <button onclick="removeColumnInput(this)">Eliminar</button>
        <div class="column-order-buttons">
            <button onclick="moveColumn(this, 'up')" class="move-col-btn up-btn">▲</button>
            <button onclick="moveColumn(this, 'down')" class="move-col-btn down-btn">▼</button>
        </div>
    `;
    container.appendChild(newInput);

    // Enfocar el nuevo input
    const newNameInput = newInput.querySelector('.col-name');
    newNameInput.focus();

    // Scroll hasta el final
    container.scrollTop = container.scrollHeight;
    updateColumnOrderButtons(container);
}

// Actualización de la función removeColumnInput para ambos casos
function removeColumnInput(button) {
    const columnDiv = button.closest('.column-input');
    const isPK = columnDiv.querySelector('.col-pk').checked;
    
    if (isPK && document.getElementById('editTableModal').style.display === 'block') {
        alert('No se puede eliminar una columna que es clave primaria');
        return;
    }
    
    const container = columnDiv.parentElement;
    container.removeChild(columnDiv);
    updateColumnOrderButtons(container);
}