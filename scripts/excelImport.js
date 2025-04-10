function setupExcelGrid() {
    const tableName = document.getElementById('excelTableSelect').value;
    if (!tableName) return;

    const table = schema.tables[tableName];
    const grid = document.getElementById('excelGrid');
    
    // Crear tabla HTML
    let html = '<table><thead><tr>';
    table.columns.forEach(col => {
        html += `<th>${col.name} (${col.type})</th>`;
    });
    html += '</tr></thead><tbody>';

    // Crear 100 filas iniciales
    for (let i = 0; i < 100; i++) {
        html += '<tr>';
        table.columns.forEach(col => {
            html += `<td><input type="text" data-type="${col.type}" data-column="${col.name}"></td>`;
        });
        html += '</tr>';
    };
    html += '</tbody></table>';
    grid.innerHTML = html;

    // Añadir event listeners
    setupCellValidation();
}

function setupCellValidation() {
    const inputs = document.querySelectorAll('#excelGrid input');
    inputs.forEach(input => {
        input.addEventListener('paste', handlePaste);
        input.addEventListener('input', () => validateCell(input));
        input.addEventListener('focus', () => showSuggestions(input));
    });
}

function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const rows = text.split('\n');
    
    const startCell = e.target;
    const startRow = startCell.closest('tr');
    const startCol = Array.from(startRow.cells).findIndex(cell => cell.contains(startCell));
    
    rows.forEach((rowData, i) => {
        const currentRow = startRow.parentElement.children[startRow.rowIndex + i];
        if (!currentRow) addNewRow();
        
        const cells = rowData.split('\t');
        cells.forEach((cellData, j) => {
            const cell = currentRow.cells[startCol + j];
            if (cell) {
                const input = cell.querySelector('input');
                input.value = cellData.trim();
                validateCell(input);
            }
        });
    });
}

function validateCell(input) {
    const value = input.value.trim();
    const type = input.dataset.type;
    
    input.parentElement.classList.remove('valid', 'warning', 'error');
    
    if (!value) return;

    try {
        if (schema.tables[type]?.isEnum) {
            // Validación de enumerados
            const enumValues = schema.tables[type].values;
            if (enumValues.includes(value)) {
                input.parentElement.classList.add('valid');
            } else {
                const similar = findSimilarValues(value, enumValues);
                if (similar.length > 0) {
                    input.parentElement.classList.add('warning');
                } else {
                    input.parentElement.classList.add('error');
                }
            }
        } else {
            // Validación de tipos básicos
            switch (type) {
                case 'INT':
                    if (/^-?\d+$/.test(value)) {
                        input.parentElement.classList.add('valid');
                    } else if (/^-?\d*\.?\d+$/.test(value)) {
                        input.parentElement.classList.add('warning');
                    } else {
                        input.parentElement.classList.add('error');
                    }
                    break;
                case 'FLOAT':
                    if (/^-?\d*\.?\d+$/.test(value)) {
                        input.parentElement.classList.add('valid');
                    } else {
                        input.parentElement.classList.add('error');
                    }
                    break;
                case 'DATE':
                    if (isValidDate(value)) {
                        input.parentElement.classList.add('valid');
                    } else {
                        input.parentElement.classList.add('error');
                    }
                    break;
                case 'BOOLEAN':
                    if (/^(true|false|1|0)$/i.test(value)) {
                        input.parentElement.classList.add('valid');
                    } else {
                        input.parentElement.classList.add('error');
                    }
                    break;
                default:
                    input.parentElement.classList.add('valid');
            }
        }
    } catch (e) {
        input.parentElement.classList.add('error');
    }
}

function showSuggestions(input) {
    if (!input.parentElement.classList.contains('warning')) return;
    
    const type = input.dataset.type;
    const value = input.value.trim();
    
    if (schema.tables[type]?.isEnum) {
        const similar = findSimilarValues(value, schema.tables[type].values);
        if (similar.length > 0) {
            showTooltip(input, similar);
        }
    }
}

function showTooltip(input, suggestions) {
    const tooltip = document.createElement('div');
    tooltip.className = 'suggestion-tooltip';
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = suggestion;
        item.onclick = () => {
            input.value = suggestion;
            validateCell(input);
            tooltip.remove();
        };
        tooltip.appendChild(item);
    });
    
    const rect = input.getBoundingClientRect();
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + 5}px`;
    document.body.appendChild(tooltip);
    
    input.addEventListener('blur', () => {
        setTimeout(() => tooltip.remove(), 200);
    });
}

function findSimilarValues(value, validValues) {
    return validValues.filter(valid => {
        const similarity = calculateSimilarity(value.toLowerCase(), valid.toLowerCase());
        return similarity > 0.6;
    });
}

function calculateSimilarity(a, b) {
    if (a.length === 0) return 0;
    if (b.length === 0) return 0;
    
    const matrix = Array(a.length + 1).fill(null)
        .map(() => Array(b.length + 1).fill(0));
        
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    
    return 1 - (matrix[a.length][b.length] / Math.max(a.length, b.length));
}

function isValidDate(value) {
    const date = new Date(value.replace(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/, '$3-$2-$1'));
    return date instanceof Date && !isNaN(date);
}

function addNewRow() {
    const tbody = document.querySelector('#excelGrid tbody');
    const row = document.createElement('tr');
    const columns = schema.tables[document.getElementById('excelTableSelect').value].columns;
    
    columns.forEach(col => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.dataset.type = col.type;
        input.dataset.column = col.name;
        td.appendChild(input);
        row.appendChild(td);
    });
    
    tbody.appendChild(row);
    setupCellValidation();
}

function validateAndImportData() {
    const tableName = document.getElementById('excelTableSelect').value;
    if (!tableName) return;

    const table = schema.tables[tableName];
    const rows = document.querySelectorAll('#excelGrid tbody tr');
    let successCount = 0;
    let errorCount = 0;

    rows.forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        const hasData = Array.from(inputs).some(input => input.value.trim());
        if (!hasData) return;

        const values = {};
        let isValid = true;

        inputs.forEach(input => {
            if (!input.parentElement.classList.contains('valid')) {
                isValid = false;
            }
            values[input.dataset.column] = input.value.trim() || null;
        });

        if (isValid) {
            try {
                const columns = Object.keys(values);
                const vals = columns.map(col => {
                    const value = values[col];
                    if (value === null) return 'NULL';
                    return typeof value === 'string' ? `'${value}'` : value;
                });
                
                const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${vals.join(', ')})`;
                alasql(query);
                successCount++;
                row.style.backgroundColor = '#e8f5e9';
            } catch (e) {
                errorCount++;
                row.style.backgroundColor = '#ffebee';
                console.error(`Error en fila ${index + 1}:`, e);
            }
        } else {
            errorCount++;
            row.style.backgroundColor = '#ffebee';
        }
    });

    alert(`Importación completada:\n- Éxitos: ${successCount}\n- Errores: ${errorCount}`);
    if (successCount > 0) {
        showTab('datos');
        showAllData();
    }
}

function clearGrid() {
    if (confirm('¿Estás seguro de que deseas limpiar todos los datos?')) {
        setupExcelGrid();
    }
}

// Modificar la función de inicialización
document.addEventListener('DOMContentLoaded', () => {
    updateTableSelect();
});

// Añadir nueva función para actualizar el select
function updateTableSelect() {
    const select = document.getElementById('excelTableSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecciona una tabla</option>';
    
    // Filtrar solo las tablas reales (no enums)
    const tables = Object.entries(schema.tables)
        .filter(([_, table]) => !table.isEnum);
    
    if (tables.length === 0) {
        select.innerHTML = '<option value="">No hay tablas disponibles</option>';
        select.disabled = true;
        return;
    }
    
    tables.forEach(([tableName, _]) => {
        const option = document.createElement('option');
        option.value = tableName;
        option.textContent = tableName;
        select.appendChild(option);
    });
    
    select.disabled = false;
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('excelTableSelect');
    select.innerHTML = '<option value="">Selecciona una tabla</option>';
    
    for (const tableName in schema.tables) {
        if (!schema.tables[tableName].isEnum) {
            const option = document.createElement('option');
            option.value = tableName;
            option.textContent = tableName;
            select.appendChild(option);
        }
    }
});
