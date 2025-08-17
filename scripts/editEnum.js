async function openEditEnumModal() {
    const enumName = document.getElementById('enumDropdown').value;
    if (!enumName) {
        showNotification('Por favor, selecciona un enum para editar.', 'warning');
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
        const message = 
            `Este enum está siendo utilizado en las siguientes tablas:\n${enumUsage.join(', ')}\n\n` +
            'IMPORTANTE:\n' +
            '• Si ELIMINA un valor del enum, se BORRARÁN AUTOMÁTICAMENTE todos los registros que contengan ese valor\n' +
            '• Si AÑADE valores nuevos, no afectará a los datos existentes\n' +
            '• Los cambios no se pueden deshacer\n\n' +
            'Proceda con precaución al editar este enum.';

        await showWarningDialog(
            'Advertencia: Enum en Uso', 
            message, 
            () => {
                // Continuar con la apertura del modal de edición
                openEditEnumModalContent(enumName);
            }
        );
        return;
    }

    // Si no hay advertencias, abrir directamente
    openEditEnumModalContent(enumName);
}

function openEditEnumModalContent(enumName) {
    const enumData = schema.tables[enumName];
    if (!enumData || !enumData.isEnum) {
        showNotification('El elemento seleccionado no es un enum válido.', 'error');
        return;
    }

    const container = document.getElementById('editEnumValuesContainer');
    if (!container) {
        console.error('Container editEnumValuesContainer not found!');
        return;
    }
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

    const enumNameInput = document.getElementById('editEnumName');
    const modal = document.getElementById('editEnumModal');
    
    if (!enumNameInput) {
        console.error('editEnumName input not found!');
        return;
    }
    if (!modal) {
        console.error('editEnumModal not found!');
        return;
    }

    enumNameInput.value = enumName;
    modal.style.display = 'block';
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
    const newValues = [];
    const valueInputs = document.querySelectorAll('#editEnumValuesContainer .enum-value-input .enum-value');
    valueInputs.forEach(input => {
        const value = input.value.trim();
        if (value) newValues.push(value);
    });

    if (newValues.length === 0) {
        alert('Por favor, añade al menos un valor.');
        return;
    }

    try {
        const currentValues = schema.tables[enumName].values;
        const removedValues = currentValues.filter(value => !newValues.includes(value));
        
        let deletedRecordsInfo = '';
        let totalDeletedRecords = 0;
        const tablesToUpdate = [];

        // Si hay valores eliminados, limpiar los datos que los usan
        if (removedValues.length > 0) {
            for (const tableName in schema.tables) {
                if (!schema.tables[tableName].isEnum) {
                    const table = schema.tables[tableName];
                    const enumColumns = table.columns.filter(col => col.type === enumName);
                    
                    if (enumColumns.length > 0) {
                        tablesToUpdate.push(tableName);
                        for (const removedValue of removedValues) {
                            for (const column of enumColumns) {
                                try {
                                    // Contar registros que se van a eliminar
                                    const countQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${column.name} = ?`;
                                    const countResult = alasql(countQuery, [removedValue]);
                                    const recordCount = countResult[0].count;
                                    
                                    if (recordCount > 0) {
                                        totalDeletedRecords += recordCount;
                                        deletedRecordsInfo += `- Tabla "${tableName}", columna "${column.name}": ${recordCount} registros con valor "${removedValue}"\n`;
                                        
                                        // Eliminar los registros
                                        const deleteQuery = `DELETE FROM ${tableName} WHERE ${column.name} = ?`;
                                        alasql(deleteQuery, [removedValue]);
                                    }
                                } catch (error) {
                                    console.error(`Error al limpiar datos en tabla ${tableName}, columna ${column.name}:`, error);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Identificar todas las tablas que usan este enum (incluso si no se eliminaron valores)
        for (const tableName in schema.tables) {
            if (!schema.tables[tableName].isEnum) {
                const table = schema.tables[tableName];
                const enumColumns = table.columns.filter(col => col.type === enumName);
                if (enumColumns.length > 0 && !tablesToUpdate.includes(tableName)) {
                    tablesToUpdate.push(tableName);
                }
            }
        }

        // Actualizar los valores del enum
        schema.tables[enumName].values = newValues;

        // Reconstruir las tablas que usan este enum con los nuevos CHECK constraints
        for (const tableName of tablesToUpdate) {
            try {
                // Obtener datos existentes
                const existingData = alasql(`SELECT * FROM ${tableName}`);
                
                // Usar el migrador de datos para preservar mejor los datos
                const migrator = new TableDataMigrator();
                const oldStructure = [...schema.tables[tableName].columns];
                
                // Crear nueva estructura con los CHECK constraints actualizados
                const newStructure = schema.tables[tableName].columns.map(col => {
                    const newCol = { ...col };
                    if (col.type === enumName) {
                        // Actualizar el check constraint en la definición
                        newCol.check = {
                            type: enumName,
                            values: newValues
                        };
                    }
                    return newCol;
                });

                // Usar el migrador para ejecutar la migración
                const migrationResult = migrator.executeMigration(tableName, oldStructure, newStructure);
                
                // Actualizar el esquema con la nueva estructura
                schema.tables[tableName].columns = newStructure;
                
                console.log(`Tabla ${tableName} migrada exitosamente. Registros migrados: ${migrationResult.recordsMigrated}`);
                
            } catch (error) {
                console.error(`Error al actualizar tabla ${tableName}:`, error);
                
                // Fallback: método manual con corrección de SQL
                try {
                    const existingData = alasql(`SELECT * FROM ${tableName}`);
                    const table = schema.tables[tableName];
                    
                    const columns = table.columns.map(col => {
                        let colDef = `${col.name} ${col.type}`;
                        
                        if (col.pk) {
                            colDef += ' PRIMARY KEY';
                        } else if (col.notNull) {
                            colDef += ' NOT NULL';
                        }
                        
                        // Aplicar nuevo CHECK constraint para columnas de este enum
                        if (col.type === enumName) {
                            const enumValuesStr = newValues.map(v => `'${v}'`).join(', ');
                            if (col.notNull || col.pk) {
                                colDef += ` CHECK(${col.name} IN (${enumValuesStr}))`;
                            } else {
                                colDef += ` CHECK(${col.name} IS NULL OR ${col.name} IN (${enumValuesStr}))`;
                            }
                        }
                        
                        return colDef;
                    }).join(', ');

                    // Recrear la tabla
                    alasql(`DROP TABLE IF EXISTS ${tableName}`);
                    alasql(`CREATE TABLE ${tableName} (${columns})`);

                    // Reinsertar datos existentes con SQL corregido
                    if (existingData.length > 0) {
                        const columnNames = Object.keys(existingData[0]);
                        
                        for (const record of existingData) {
                            const values = columnNames.map(col => {
                                const val = record[col];
                                if (val === null || val === undefined) {
                                    return 'NULL';
                                } else if (typeof val === 'string') {
                                    return `'${val.replace(/'/g, "''")}'`;
                                } else if (typeof val === 'boolean') {
                                    return val ? 'TRUE' : 'FALSE';
                                } else {
                                    return val;
                                }
                            }).filter(v => v !== undefined); // Filtrar valores undefined
                            
                            // Solo insertar si tenemos el número correcto de valores
                            if (values.length === columnNames.length) {
                                const insertQuery = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${values.join(', ')})`;
                                alasql(insertQuery);
                            }
                        }
                    }
                } catch (fallbackError) {
                    console.error(`Error en fallback para tabla ${tableName}:`, fallbackError);
                    showNotification(`Error crítico al actualizar la tabla ${tableName}: ${fallbackError.message}`, 'error');
                }
            }
        }

        populateEnumDropdown();
        updateClassMap();
        closeEditEnumModal();
        
        // Mostrar mensaje de éxito con información de registros eliminados
        let successMessage = `Enum "${enumName}" actualizado exitosamente.`;
        if (tablesToUpdate.length > 0) {
            successMessage += `\n\nTablas actualizadas: ${tablesToUpdate.join(', ')}`;
        }
        if (totalDeletedRecords > 0) {
            successMessage += `\n\nRegistros eliminados (${totalDeletedRecords} en total):\n${deletedRecordsInfo}`;
            showNotification(successMessage, 'warning');
        } else {
            showNotification(successMessage, 'success');
        }
        
        // Actualizar la vista de datos si está visible
        if (document.getElementById('datos').style.display !== 'none') {
            showAllData();
        }
        
    } catch (error) {
        showNotification('Error al actualizar el enum: ' + error.message, 'error');
        console.error('Error updating enum:', error);
    }
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
