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

    // Escuchar cambios estructurales para refrescar el select
    document.addEventListener('tableStructureChanged', () => {
        refreshTableFilter();
        updateSearchFields();
        showAllData();
    });
}

// Nuevo: repoblar el select de tablas preservando selección válida
function refreshTableFilter(forcedSelected = null) {
    const select = document.getElementById('table-filter');
    if (!select || !window.schema || !schema.tables) return;
    const prev = forcedSelected !== null ? forcedSelected : select.value;
    const tableNames = Object.keys(schema.tables).filter(t => !schema.tables[t].isEnum);
    const options = ['<option value="">Todas las tablas</option>'];
    tableNames.forEach(t => {
        options.push(`<option value="${t}" ${t === prev ? 'selected' : ''}>${t}</option>`);
    });
    select.innerHTML = options.join('');
    // Si la tabla seleccionada ya no existe, limpiar campos
    if (prev && !schema.tables[prev]) {
        select.value = '';
        updateSearchFields();
    }
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
                            <input type="checkbox" data-column="${col.name}" class="tri-state-checkbox">
                        `;
                        const checkbox = field.querySelector('input');
                        checkbox.indeterminate = true; // Estado inicial: cualquiera
                        checkbox.addEventListener('click', function() {
                            // Ciclo: indeterminado -> marcado -> desmarcado -> indeterminado
                            if (this.indeterminate) {
                                this.checked = true;
                                this.indeterminate = false;
                            } else if (this.checked) {
                                this.checked = false;
                                this.indeterminate = false;
                            } else {
                                this.checked = false;
                                this.indeterminate = true;
                            }
                        });
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
            if (input.type === 'checkbox') {
                if (!input.indeterminate) { // Solo filtrar si no está en estado indeterminado
                    searchCriteria[input.dataset.column] = input.checked;
                }
            } else if (value) {
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

const PAGE_SIZE = 50;
let currentPageByTable = {};

function createTableDataSection(tableName, container, data = null) {
    try {
        const result = data || alasql(`SELECT * FROM ${tableName}`);
        if (result.length === 0) return;

        // Paginación
        if (!currentPageByTable[tableName]) currentPageByTable[tableName] = 1;
        const currentPage = currentPageByTable[tableName];
        const totalRows = result.length;
        const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageData = result.slice(start, end);

        const section = document.createElement('div');
        section.className = 'data-section';

        const pkColumn = schema.tables[tableName].columns.find(col => col.pk);
        if (!pkColumn) return;

        section.innerHTML = `<div class="data-table-title">${tableName}</div>`;

        const grid = document.createElement('div');
        grid.className = 'data-grid';

        pageData.forEach(row => {
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

        // Controles de paginación
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = 'Anterior';
            prevBtn.onclick = () => {
                currentPageByTable[tableName]--;
                container.innerHTML = '';
                createTableDataSection(tableName, container, result);
            };
            pagination.appendChild(prevBtn);
        }
        pagination.appendChild(document.createTextNode(` Página ${currentPage} de ${totalPages} `));
        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.textContent = 'Siguiente';
            nextBtn.onclick = () => {
                currentPageByTable[tableName]++;
                container.innerHTML = '';
                createTableDataSection(tableName, container, result);
            };
            pagination.appendChild(nextBtn);
        }
        section.appendChild(pagination);

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
            
            // Convert pkValue to the correct type
            let pkVal = pkValue;
            if (pkColumn.type === 'INT' || pkColumn.type === 'FLOAT') {
                pkVal = Number(pkValue);
            }
            
            alasql(`DELETE FROM ${tableName} WHERE ${pkColumn.name} = ?`, [pkVal]);
            showAllData(); // Refresh the view
            showNotification('Registro eliminado correctamente', 'success');
        } catch (error) {
            showNotification('Error al eliminar el registro: ' + error.message, 'error');
            console.error('Delete error:', error);
        }
    }
}

function editRecord(tableName, pkValue, event) {
    event.stopPropagation();
    const pkColumn = schema.tables[tableName].columns.find(col => col.pk);
    let pkVal = pkValue;
    if (pkColumn.type === 'INT' || pkColumn.type === 'FLOAT') {
        pkVal = Number(pkValue);
    }
    const record = alasql(`SELECT * FROM ${tableName} WHERE ${pkColumn.name} = ?`, [pkVal])[0];

    if (!record) {
        alert('No se encontró el registro para editar.');
        return;
    }

    let html = `<div class="edit-form">`;

    // Si hay layout personalizado, úsalo
    if (window.customInsertLayouts && window.customInsertLayouts[tableName]) {
        const tempDiv = document.createElement('div');
        tempDiv.className = 'insert-fields';

        // Genera todos los campos estándar
        schema.tables[tableName].columns.forEach(col => {
            let inputHtml = '';
            if (col.pk) {
                inputHtml = `<input type="text" value="${record[col.name]}" disabled title="Las claves primarias no se pueden editar">`;
            } else if (schema.tables[col.type]?.isEnum) {
                const options = schema.tables[col.type].values
                    .map(value => `<option value="${value}" ${record[col.name] === value ? 'selected' : ''}>${value}</option>`)
                    .join('');
                inputHtml = `<select name="${col.name}"><option value="">Seleccione...</option>${options}</select>`;
            } else {
                const value = record[col.name] !== null ? record[col.name] : '';
                switch (col.type) {
                    case 'DATE':
                        inputHtml = `<input type="date" name="${col.name}" value="${value}">`; break;
                    case 'INT':
                        inputHtml = `<input type="text" name="${col.name}" value="${value}" class="numeric-input integer-input" inputmode="numeric">`; break;
                    case 'FLOAT':
                        inputHtml = `<input type="text" name="${col.name}" value="${value}" class="numeric-input float-input" inputmode="decimal">`; break;
                    case 'BOOLEAN':
                        inputHtml = `<input type="checkbox" name="${col.name}" ${record[col.name] ? 'checked' : ''}>`; break;
                    default:
                        inputHtml = `<input type="text" name="${col.name}" value="${value}">`;
                }
            }
            tempDiv.innerHTML += `<div class="input-field"><label>${col.name}:</label>${inputHtml}</div>`;
        });

        // Aplica el layout personalizado
        try {
            const content = window.customInsertLayouts[tableName];
            const lines = content.split('\n').map(line => line.trim()).filter(line => line);
            const existingFields = new Map();
            tempDiv.querySelectorAll('.input-field').forEach(fieldDiv => {
                const input = fieldDiv.querySelector('input, select, textarea');
                if (input && (input.name || input.getAttribute('name'))) {
                    const fieldName = input.name || input.getAttribute('name');
                    existingFields.set(fieldName, fieldDiv.outerHTML);
                }
            });

            let customHtml = '';
            for (let i = 1; i < lines.length - 1; i++) {
                const line = lines[i];
                if (line.startsWith('+++')) {
                    customHtml += `<div class="insertion-secondary-header"><label>${line.substring(3).trim()}</label></div>`;
                } else if (line.startsWith('++')) {
                    customHtml += `<div class="insertion-header"><label>${line.substring(2).trim()}</label></div>`;
                } else if (line.startsWith('+')) {
                    customHtml += `<div class="insertion-subtitle"><label>${line.substring(1).trim()}</label></div>`;
                } else if (line.startsWith('-')) {
                    const fieldName = line.substring(1).trim();
                    if (existingFields.has(fieldName)) {
                        customHtml += existingFields.get(fieldName);
                        existingFields.delete(fieldName); // Para no repetir campos
                    }
                }
            }
            html += customHtml;

            // Añade los campos que no se incluyeron en el layout personalizado
            existingFields.forEach(fieldHtml => {
                html += fieldHtml;
            });
        } catch (error) {
            console.error('Error applying custom layout to edit form:', error);
            html += tempDiv.innerHTML;
        }
    } else {
        // Layout estándar: muestra todos los campos
        schema.tables[tableName].columns.forEach(col => {
            let inputHtml = '';
            if (col.pk) {
                inputHtml = `<input type="text" value="${record[col.name]}" disabled title="Las claves primarias no se pueden editar">`;
            } else if (schema.tables[col.type]?.isEnum) {
                const options = schema.tables[col.type].values
                    .map(value => `<option value="${value}" ${record[col.name] === value ? 'selected' : ''}>${value}</option>`)
                    .join('');
                inputHtml = `<select name="${col.name}"><option value="">Seleccione...</option>${options}</select>`;
            } else {
                const value = record[col.name] !== null ? record[col.name] : '';
                switch (col.type) {
                    case 'DATE':
                        inputHtml = `<input type="date" name="${col.name}" value="${value}">`; break;
                    case 'INT':
                        inputHtml = `<input type="text" name="${col.name}" value="${value}" class="numeric-input integer-input" inputmode="numeric">`; break;
                    case 'FLOAT':
                        inputHtml = `<input type="text" name="${col.name}" value="${value}" class="numeric-input float-input" inputmode="decimal">`; break;
                    case 'BOOLEAN':
                        inputHtml = `<input type="checkbox" name="${col.name}" ${record[col.name] ? 'checked' : ''}>`; break;
                    default:
                        inputHtml = `<input type="text" name="${col.name}" value="${value}">`;
                }
            }
            html += `<div class="input-field"><label>${col.name}:</label>${inputHtml}</div>`;
        });
    }

    html += `</div>`;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content edit-modal-content">
            <span class="close" onclick="this.closest('.modal').remove()">×</span>
            <h2>Editar Registro</h2>
            <div class="edit-form-scrollable-content">
                ${html}
            </div>
            <div class="modal-buttons">
                <button onclick="saveEditedRecord('${tableName}', '${pkValue}', this.closest('.modal'))">Guardar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Configurar validación numérica para los campos del modal
    setupNumericValidationForModal(modal);
}

function setupNumericValidationForModal(modal) {
    // Validación para campos de enteros en el modal
    modal.querySelectorAll('.integer-input').forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value;
            value = value.replace(/[^0-9-]/g, '');
            
            if (value.includes('-')) {
                const parts = value.split('-');
                if (parts[0] === '') {
                    value = '-' + parts.slice(1).join('');
                } else {
                    value = value.replace(/-/g, '');
                }
            }
            
            e.target.value = value;
        });
        
        input.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            const currentValue = e.target.value;
            
            if (e.which < 32) return;
            if (/[0-9]/.test(char)) return;
            if (char === '-' && currentValue.length === 0 && !currentValue.includes('-')) return;
            
            e.preventDefault();
        });
    });

    // Validación para campos de flotantes en el modal
    modal.querySelectorAll('.float-input').forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value;
            value = value.replace(/[^0-9.,-]/g, '');
            value = value.replace(/,/g, '.');
            
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            if (value.includes('-')) {
                const minusParts = value.split('-');
                if (minusParts[0] === '') {
                    value = '-' + minusParts.slice(1).join('');
                } else {
                    value = value.replace(/-/g, '');
                }
            }
            
            e.target.value = value;
        });
        
        input.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            const currentValue = e.target.value;
            
            if (e.which < 32) return;
            if (/[0-9]/.test(char)) return;
            if ((char === '.' || char === ',') && !currentValue.includes('.')) return;
            if (char === '-' && currentValue.length === 0) return;
            
            e.preventDefault();
        });
    });
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
                    if (col.type === 'BOOLEAN') {
                        updates.push(`${col.name} = ?`);
                        values.push(input.checked);
                        return; // Continuar con el siguiente campo
                    }

                    let value = input.value.trim();
                    // Si el valor está vacío, asignar NULL
                    if (value === '') {
                        updates.push(`${col.name} = NULL`);
                    } else {
                        // Convertir el valor al tipo de dato correcto
                        switch (col.type) {
                            case 'INT':
                                value = parseInt(value, 10);
                                break;
                            case 'FLOAT':
                                value = parseFloat(value);
                                break;
                            // Para STRING, DATE y Enums, el valor de texto es adecuado
                        }
                        updates.push(`${col.name} = ?`);
                        values.push(value);
                    }
                }
            }
        });

        let pkVal = pkValue;
        // Convertir el valor de la clave primaria a su tipo correcto
        if (pkColumn.type === 'INT' || pkColumn.type === 'FLOAT') {
            pkVal = Number(pkValue);
        }

        values.push(pkVal); // Valor para WHERE
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
    let hasData = false;
    let insertionsSQL = '';

    // Verificar si hay datos para exportar y generarlos
    for (const tableName in schema.tables) {
        if (!schema.tables[tableName].isEnum) {
            try {
                const data = alasql(`SELECT * FROM ${tableName}`);
                if (data.length > 0) {
                    hasData = true;
                    insertionsSQL += `-- Inserciones para tabla ${tableName}\n`;
                    
                    const columns = Object.keys(data[0]);
                    insertionsSQL += `INSERT INTO ${tableName} (${columns.join(', ')})\nVALUES\n`;

                    const valuesList = data.map(row => {
                        const values = columns.map(col => {
                            const val = row[col];
                            if (val === null || val === undefined || val === '') {
                                return 'NULL';
                            }
                            return typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;
                        });
                        return `    (${values.join(', ')})`;
                    });

                    insertionsSQL += valuesList.join(',\n') + ';\n\n';
                }
            } catch (error) {
                console.error(`Error al procesar tabla ${tableName}:`, error);
            }
        }
    }

    // Verificar si hay datos para descargar
    if (!hasData) {
        alert('No hay datos insertados para exportar. Inserte datos en al menos una tabla antes de descargar.');
        return;
    }

    // Pedir nombre del archivo
    const defaultName = 'inserciones';
    const fileName = prompt('Nombre para el archivo de inserciones:', defaultName);
    if (!fileName) return; // Si el usuario cancela

    // Crear y descargar el archivo
    const blob = new Blob([insertionsSQL], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.trim()}.sql`;
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
                    if (query.trim().toUpperCase().startsWith('INSERT')) {
                        const valuesMatch = query.match(/VALUES\s*\((.*)\)/i);
                        if (valuesMatch) {
                            const values = valuesMatch[1].split(',').map(val => {
                                val = val.trim();
                                return val.toUpperCase() === 'NULL' ? 'NULL' : val;
                            }).join(', ');
                            
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
            
            if (successCount > 0 || errorCount > 0) {
                // Determinar el tipo de notificación basado en los resultados
                let notificationType;
                if (errorCount === 0) {
                    notificationType = 'success';
                } else if (successCount > 0) {
                    notificationType = 'warning';
                } else {
                    notificationType = 'error';
                }

                const message = `Inserciones completadas:\n` +
                              `- Exitosas: ${successCount}\n` +
                              `- Errores: ${errorCount}`;
                
                showNotification(message, notificationType);
            } else {
                showNotification('No se encontraron inserciones para procesar', 'warning');
            }

        } catch (error) {
            showNotification('Error al procesar el archivo: ' + error.message, 'error');
            console.error('Error completo:', error);
        }
        event.target.value = ''; // Limpiar el input
    };

    reader.readAsText(file);
}
