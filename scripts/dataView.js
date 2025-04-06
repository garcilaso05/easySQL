function setupDataTab() {
    const container = document.getElementById('data-container');
    container.innerHTML = '';

    // Agregar buscador
    const searchForm = document.createElement('div');
    searchForm.className = 'search-form';
    searchForm.innerHTML = `
        <div class="search-header">
            <select id="table-filter" onchange="updateSearchFields()">
                <option value="">Todas las tablas</option>
                ${Object.keys(schema.tables)
                    .filter(tableName => !schema.tables[tableName].isEnum)
                    .map(tableName => `<option value="${tableName}">${tableName}</option>`)
                    .join('')}
            </select>
            <div id="search-fields" class="search-fields"></div>
            <button onclick="applySearch()">Buscar</button>
            <button onclick="resetSearch()">Limpiar</button>
        </div>
    `;
    container.appendChild(searchForm);

    // Contenedor para resultados
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'search-results';
    container.appendChild(resultsContainer);

    updateSearchFields();
    showAllData();
}

function updateSearchFields() {
    const selectedTable = document.getElementById('table-filter').value;
    const searchFields = document.getElementById('search-fields');
    searchFields.innerHTML = '';

    if (selectedTable) {
        // Mostrar campos de la tabla seleccionada
        const columns = schema.tables[selectedTable].columns;
        columns.forEach(col => {
            const field = document.createElement('div');
            field.className = 'search-field';
            
            if (schema.tables[col.type]?.isEnum) {
                // Crear selector para ENUM
                field.innerHTML = `
                    <label>${col.name}:</label>
                    <select data-column="${col.name}">
                        <option value="">Cualquier valor</option>
                        ${schema.tables[col.type].values
                            .map(value => `<option value="${value}">${value}</option>`)
                            .join('')}
                    </select>
                `;
            } else {
                // Crear campo de búsqueda según el tipo
                let inputType = 'text';
                let extraAttr = '';
                switch (col.type) {
                    case 'INT':
                    case 'FLOAT':
                        inputType = 'number';
                        extraAttr = col.type === 'FLOAT' ? 'step="0.01"' : '';
                        break;
                    case 'DATE':
                        inputType = 'date';
                        break;
                    case 'BOOLEAN':
                        field.innerHTML = `
                            <label>${col.name}:</label>
                            <select data-column="${col.name}">
                                <option value="">Cualquier valor</option>
                                <option value="true">Verdadero</option>
                                <option value="false">Falso</option>
                            </select>
                        `;
                        return;
                }
                if (!field.innerHTML) {
                    field.innerHTML = `
                        <label>${col.name}:</label>
                        <input type="${inputType}" data-column="${col.name}" ${extraAttr}>
                    `;
                }
            }
            searchFields.appendChild(field);
        });
    }
}

function applySearch() {
    const selectedTable = document.getElementById('table-filter').value;
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    if (selectedTable) {
        // Búsqueda en tabla específica
        const searchCriteria = {};
        document.querySelectorAll('#search-fields input, #search-fields select').forEach(input => {
            const value = input.value.trim();
            if (value) {
                searchCriteria[input.dataset.column] = value;
            }
        });

        try {
            let query = `SELECT * FROM ${selectedTable}`;
            const whereClauses = [];
            
            Object.entries(searchCriteria).forEach(([column, value]) => {
                const columnType = schema.tables[selectedTable].columns.find(col => col.name === column).type;
                if (schema.tables[columnType]?.isEnum || columnType === 'STRING') {
                    whereClauses.push(`${column} = '${value}'`);
                } else if (columnType === 'BOOLEAN') {
                    whereClauses.push(`${column} = ${value}`);
                } else {
                    whereClauses.push(`${column} = ${value}`);
                }
            });

            if (whereClauses.length > 0) {
                query += ` WHERE ${whereClauses.join(' AND ')}`;
            }

            const results = alasql(query);
            createTableDataSection(selectedTable, resultsContainer, results);
        } catch (error) {
            resultsContainer.innerHTML = `<div class="error">Error en la búsqueda: ${error.message}</div>`;
        }
    } else {
        // Mostrar todas las tablas con sus datos
        showAllData();
    }
}

function resetSearch() {
    document.getElementById('table-filter').value = '';
    updateSearchFields();
    showAllData();
}

function showAllData() {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    for (const tableName in schema.tables) {
        if (!schema.tables[tableName].isEnum) {
            createTableDataSection(tableName, resultsContainer);
        }
    }
}

function createTableDataSection(tableName, container, data = null) {
    try {
        const result = data || alasql(`SELECT * FROM ${tableName}`);
        if (result.length === 0) return;

        const section = document.createElement('div');
        section.className = 'data-section';
        
        const pkColumn = schema.tables[tableName].columns.find(col => col.pk);
        if (!pkColumn) return;

        section.innerHTML = `<div class="data-table-title">${tableName}</div>`;
        
        const grid = document.createElement('div');
        grid.className = 'data-grid';

        result.forEach(row => {
            const block = document.createElement('div');
            block.className = 'data-block';
            
            const pkValue = row[pkColumn.name];
            let detailsHtml = '';

            schema.tables[tableName].columns.forEach(col => {
                const value = formatValue(row[col.name], col.type);
                detailsHtml += `
                    <div class="data-row">
                        <div class="data-label">${col.name}:</div>
                        <div>${value}</div>
                    </div>`;
            });

            block.innerHTML = `
                <div class="data-block-header">
                    <div><strong>${pkColumn.name}:</strong> ${pkValue}</div>
                    <div class="data-actions-buttons">
                        <button class="edit-btn" title="Editar" onclick="editRecord('${tableName}', '${pkValue}', event)">✏️</button>
                        <button class="delete-btn" title="Eliminar" onclick="deleteRecord('${tableName}', '${pkValue}', event)">🗑️</button>
                    </div>
                </div>
                <div class="data-details">${detailsHtml}</div>
            `;

            block.querySelector('.data-block-header').addEventListener('click', function(e) {
                if (!e.target.closest('button')) {
                    const details = block.querySelector('.data-details');
                    const wasHidden = details.style.display === 'none' || !details.style.display;
                    
                    grid.querySelectorAll('.data-details').forEach(d => {
                        d.style.display = 'none';
                    });
                    
                    details.style.display = wasHidden ? 'block' : 'none';
                }
            });

            grid.appendChild(block);
        });

        section.appendChild(grid);
        container.appendChild(section);
    } catch (error) {
        console.error(`Error al cargar datos de ${tableName}:`, error);
    }
}

function deleteRecord(tableName, pkValue, event) {
    event.stopPropagation();
    if (confirm(`¿Estás seguro de que deseas eliminar este registro?`)) {
        try {
            const pkColumn = schema.tables[tableName].columns.find(col => col.pk);
            alasql(`DELETE FROM ${tableName} WHERE ${pkColumn.name} = ?`, [pkValue]);
            showAllData(); // Refrescar la vista
        } catch (error) {
            alert('Error al eliminar el registro: ' + error.message);
        }
    }
}

function editRecord(tableName, pkValue, event) {
    event.stopPropagation();
    const pkColumn = schema.tables[tableName].columns.find(col => col.pk);
    const record = alasql(`SELECT * FROM ${tableName} WHERE ${pkColumn.name} = ?`, [pkValue])[0];
    
    let html = `<div class="edit-form">`;
    schema.tables[tableName].columns.forEach(col => {
        if (col.pk) {
            html += `<div class="input-field">
                <label>${col.name}:</label>
                <input type="text" value="${record[col.name]}" disabled 
                    title="Las claves primarias no se pueden editar">
            </div>`;
        } else {
            let input = '';
            if (schema.tables[col.type]?.isEnum) {
                input = `<select name="${col.name}">
                    <option value="">NULL</option>
                    ${schema.tables[col.type].values.map(value => 
                        `<option value="${value}" ${record[col.name] === value ? 'selected' : ''}>${value}</option>`
                    ).join('')}
                </select>`;
            } else {
                const value = record[col.name] !== null ? record[col.name] : '';
                switch (col.type) {
                    case 'BOOLEAN':
                        input = `<select name="${col.name}">
                            <option value="true" ${value ? 'selected' : ''}>Verdadero</option>
                            <option value="false" ${!value ? 'selected' : ''}>Falso</option>
                        </select>`;
                        break;
                    case 'DATE':
                        input = `<input type="date" name="${col.name}" value="${value}">`;
                        break;
                    case 'INT':
                        input = `<input type="number" name="${col.name}" value="${value}" step="1">`;
                        break;
                    case 'FLOAT':
                        input = `<input type="number" name="${col.name}" value="${value}" step="0.01">`;
                        break;
                    default:
                        input = `<input type="text" name="${col.name}" value="${value}">`;
                }
            }
            html += `<div class="input-field"><label>${col.name}:</label>${input}</div>`;
        }
    });
    html += `</div>`;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.closest('.modal').remove()">×</span>
            <h2>Editar Registro</h2>
            ${html}
            <button onclick="saveEditedRecord('${tableName}', '${pkValue}', this.closest('.modal'))">Guardar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function saveEditedRecord(tableName, pkValue, modal) {
    try {
        const pkColumn = schema.tables[tableName].columns.find(col => col.pk);
        const updates = [];
        const values = [];

        schema.tables[tableName].columns.forEach(col => {
            if (!col.pk) {
                const input = modal.querySelector(`[name="${col.name}"]`);
                if (input) {
                    let value = input.value.trim();
                    // Si el valor está vacío, asignar NULL
                    if (value === '') {
                        updates.push(`${col.name} = NULL`);
                    } else {
                        if (col.type === 'BOOLEAN') {
                            value = value === 'true';
                        }
                        updates.push(`${col.name} = ?`);
                        values.push(value);
                    }
                }
            }
        });

        values.push(pkValue); // Valor para WHERE
        const query = `UPDATE ${tableName} SET ${updates.join(', ')} WHERE ${pkColumn.name} = ?`;
        alasql(query, values);
        
        modal.remove();
        showAllData(); // Refrescar la vista
    } catch (error) {
        alert('Error al guardar los cambios: ' + error.message);
    }
}

function formatValue(value, type) {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
        case 'BOOLEAN':
            return value ? 'Verdadero' : 'Falso';
        case 'DATE':
            return new Date(value).toLocaleDateString();
        default:
            return value.toString();
    }
}

function downloadInsertions() {
    let insertionsSQL = '';
    
    // Generar inserciones SQL para cada tabla
    for (const tableName in schema.tables) {
        if (!schema.tables[tableName].isEnum) {
            try {
                const data = alasql(`SELECT * FROM ${tableName}`);
                if (data.length > 0) {
                    insertionsSQL += `-- Inserciones para tabla ${tableName}\n`;
                    data.forEach(row => {
                        // Filtrar columnas que no son null
                        const columns = [];
                        const values = [];
                        
                        Object.entries(row).forEach(([col, val]) => {
                            columns.push(col);
                            if (val === null || val === undefined || val === '') {
                                values.push('NULL');
                            } else {
                                values.push(typeof val === 'string' ? `'${val}'` : val);
                            }
                        });

                        insertionsSQL += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
                    });
                    insertionsSQL += '\n';
                }
            } catch (error) {
                console.error(`Error al procesar tabla ${tableName}:`, error);
            }
        }
    }

    // Crear y descargar el archivo
    const blob = new Blob([insertionsSQL], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inserciones.sql';
    a.click();
    URL.revokeObjectURL(url);
}

function loadInsertions(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            
            // Limpiar comentarios y líneas vacías
            const queries = content
                .split('\n')
                .filter(line => line.trim() && !line.trim().startsWith('--'))
                .map(query => {
                    // Procesar cada query para manejar NULL correctamente
                    if (query.trim().toUpperCase().startsWith('INSERT')) {
                        // Extraer los valores entre paréntesis
                        const valuesMatch = query.match(/VALUES\s*\((.*)\)/i);
                        if (valuesMatch) {
                            const values = valuesMatch[1].split(',').map(val => {
                                val = val.trim();
                                // Manejar explícitamente NULL
                                if (val.toUpperCase() === 'NULL') {
                                    return 'NULL';
                                }
                                return val;
                            }).join(', ');
                            
                            // Reconstruir la query con los valores procesados
                            return query.replace(/VALUES\s*\((.*)\)/i, `VALUES (${values})`);
                        }
                    }
                    return query;
                })
                .join('\n')
                .split(';')
                .map(query => query.trim())
                .filter(query => query);

            // Ejecutar cada inserción
            let successCount = 0;
            let errorCount = 0;

            // Procesar cada query individualmente
            for (const query of queries) {
                try {
                    if (query) {
                        // Ejecutar la query procesada
                        alasql(query + ';');
                        successCount++;
                    }
                } catch (error) {
                    console.error('Error en query:', query, error);
                    errorCount++;
                }
            }

            // Cambiar a la pestaña de datos y actualizar la vista
            showTab('datos');
            showAllData();
            
            // Mostrar resumen
            alert(`Inserciones completadas:\n` +
                  `- Exitosas: ${successCount}\n` +
                  `- Errores: ${errorCount}`);

        } catch (error) {
            alert('Error al procesar el archivo: ' + error.message);
            console.error('Error completo:', error);
        }
        event.target.value = ''; // Limpiar el input
    };

    reader.readAsText(file);
}
