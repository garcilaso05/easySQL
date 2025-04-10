function setupExcelGrid() {
    const tableName = document.getElementById('excelTableSelect').value;
    if (!tableName) return;

    const table = schema.tables[tableName];
    const grid = document.getElementById('excelGrid');
    
    // Obtener el número de filas solicitado (entre 10 y 1000)
    const rowCount = Math.min(Math.max(
        parseInt(document.getElementById('rowCount').value) || 100, 
        10
    ), 1000);
    document.getElementById('rowCount').value = rowCount;

    // Si no hay tabla, crear una nueva
    if (!grid.querySelector('table')) {
        let html = '<table><thead><tr>';
        table.columns.forEach(col => {
            html += `<th>${col.name} (${col.type})</th>`;
        });
        html += '</tr></thead><tbody>';

        // Crear las filas iniciales
        for (let i = 0; i < rowCount; i++) {
            html += '<tr>';
            table.columns.forEach(col => {
                html += `<td contenteditable="true" data-type="${col.type}" data-column="${col.name}"></td>`;
            });
            html += '</tr>';
        }
        html += '</tbody></table>';
        grid.innerHTML = html;
    } else {
        // Ajustar el número de filas manteniendo los datos existentes
        const tbody = grid.querySelector('tbody');
        const currentRows = tbody.children.length;
        
        if (rowCount > currentRows) {
            // Añadir filas nuevas
            for (let i = currentRows; i < rowCount; i++) {
                const row = document.createElement('tr');
                table.columns.forEach(col => {
                    const td = document.createElement('td');
                    td.contentEditable = true;
                    td.dataset.type = col.type;
                    td.dataset.column = col.name;
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            }
        } else if (rowCount < currentRows) {
            // Eliminar filas sobrantes desde el final
            for (let i = currentRows - 1; i >= rowCount; i--) {
                tbody.removeChild(tbody.children[i]);
            }
        }
    }

    // Añadir event listeners
    setupCellValidation();
}

function setupCellValidation() {
    const cells = document.querySelectorAll('#excelGrid td[contenteditable]');
    cells.forEach(cell => {
        cell.addEventListener('paste', handlePaste);
        cell.addEventListener('input', () => validateCell(cell));
        cell.addEventListener('focus', () => showSuggestions(cell));
    });

    // Permitir selección múltiple como en Excel
    const table = document.querySelector('#excelGrid table');
    let isSelecting = false;
    let startCell = null;

    table.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'TD') {
            isSelecting = true;
            startCell = e.target;
            clearSelection();
            e.target.classList.add('selected');
        }
    });

    // Modificar el event listener para teclas Delete y Backspace
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement.tagName === 'TD') {
            const selectedCells = document.querySelectorAll('#excelGrid td.selected');
            
            // Solo prevenir y borrar si hay múltiples celdas seleccionadas
            if (selectedCells.length > 1) {
                e.preventDefault();
                selectedCells.forEach(cell => {
                    cell.textContent = '';
                    validateCell(cell);
                });
            }
            // Si solo hay una celda, dejar que el comportamiento sea normal
        }
    });

    table.addEventListener('mousemove', (e) => {
        if (isSelecting && e.target.tagName === 'TD') {
            clearSelection();
            const range = getCellRange(startCell, e.target);
            selectCellRange(range);
        }
    });

    document.addEventListener('mouseup', () => {
        isSelecting = false;
    });
}

function clearSelection() {
    document.querySelectorAll('#excelGrid td.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
}

function getCellRange(start, end) {
    const startRow = start.parentElement.rowIndex;
    const startCol = start.cellIndex;
    const endRow = end.parentElement.rowIndex;
    const endCol = end.cellIndex;
    
    return {
        startRow: Math.min(startRow, endRow),
        endRow: Math.max(startRow, endRow),
        startCol: Math.min(startCol, endCol),
        endCol: Math.max(startCol, endCol)
    };
}

function selectCellRange(range) {
    const rows = document.querySelectorAll('#excelGrid tbody tr');
    for (let i = range.startRow - 1; i <= range.endRow - 1; i++) { // Restar 1 para corregir el offset
        if (rows[i]) { // Verificar que la fila existe
            const cells = rows[i].getElementsByTagName('td');
            for (let j = range.startCol; j <= range.endCol; j++) {
                if (cells[j]) { // Verificar que la celda existe
                    cells[j].classList.add('selected');
                }
            }
        }
    }
}

function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const rows = text.split(/[\r\n]+/).filter(row => row.trim());
    
    const selectedCells = document.querySelectorAll('#excelGrid td.selected');
    if (selectedCells.length > 0) {
        // Pegar en la selección
        const startCell = selectedCells[0];
        const startRow = startCell.parentElement;
        const startRowIndex = startRow.rowIndex;
        const startColIndex = startCell.cellIndex;
        
        rows.forEach((rowData, i) => {
            const cells = rowData.split('\t');
            const currentRow = document.querySelector(`#excelGrid tbody tr:nth-child(${startRowIndex + i})`);
            if (currentRow) {
                cells.forEach((cellData, j) => {
                    const cell = currentRow.cells[startColIndex + j];
                    if (cell) {
                        cell.textContent = cellData.trim();
                        validateCell(cell);
                    }
                });
            }
        });
    } else {
        // Pegar donde está el cursor
        const target = e.target;
        const startRow = target.parentElement;
        const startColIndex = target.cellIndex;
        
        rows.forEach((rowData, i) => {
            const currentRow = startRow.parentElement.children[startRow.rowIndex + i];
            if (!currentRow) addNewRow();
            
            const cells = rowData.split('\t');
            cells.forEach((cellData, j) => {
                const cell = currentRow.cells[startColIndex + j];
                if (cell) {
                    cell.textContent = cellData.trim();
                    validateCell(cell);
                }
            });
        });
    }
}

function validateCell(cell) {
    const value = cell.textContent.trim();
    const type = cell.dataset.type;
    const column = schema.tables[document.getElementById('excelTableSelect').value].columns
        .find(col => col.name === cell.dataset.column);
    
    cell.classList.remove('valid', 'warning', 'error');
    
    // Manejar valor null explícito (guion)
    if (value === '-') {
        if (column.pk || column.notNull) {
            cell.classList.add('error'); // No se permite NULL
        } else {
            cell.classList.add('valid', 'null-value'); // NULL permitido
        }
        return;
    }

    // Si está vacío
    if (!value) {
        if (column.pk) {
            return; // Las PKs vacías se dejan sin color
        } else if (column.notNull) {
            cell.classList.add('warning');
            return;
        } else {
            cell.classList.add('valid');
            return;
        }
    }

    try {
        if (schema.tables[type]?.isEnum) {
            // Validación de enumerados
            const enumValues = schema.tables[type].values;
            const exactMatch = findExactEnumValue(value, enumValues);
            
            if (exactMatch) {
                cell.classList.add('valid');
                // Corregir automáticamente al valor exacto del enum
                if (value !== exactMatch) {
                    cell.textContent = exactMatch;
                }
            } else {
                const similar = findSimilarValues(value, enumValues);
                if (similar.length > 0) {
                    cell.classList.add('warning');
                } else {
                    cell.classList.add('error');
                }
            }
        } else {
            // Validación de tipos básicos
            switch (type) {
                case 'INT':
                    if (/^-?\d+$/.test(value)) {
                        cell.classList.add('valid');
                    } else if (/^-?\d*\.?\d+$/.test(value)) {
                        cell.classList.add('warning');
                    } else {
                        cell.classList.add('error');
                    }
                    break;
                case 'FLOAT':
                    // Aceptar tanto punto como coma como separador decimal
                    if (/^-?\d*[.,]?\d+$/.test(value)) {
                        cell.classList.add('valid');
                    } else {
                        cell.classList.add('error');
                    }
                    break;
                case 'DATE':
                    if (isValidDate(value)) {
                        cell.classList.add('valid');
                    } else {
                        cell.classList.add('error');
                    }
                    break;
                case 'BOOLEAN':
                    if (/^(true|false|1|0)$/i.test(value)) {
                        cell.classList.add('valid');
                    } else {
                        cell.classList.add('error');
                    }
                    break;
                default:
                    cell.classList.add('valid');
            }
        }
    } catch (e) {
        cell.classList.add('error');
    }
}

function showSuggestions(cell) {
    const type = cell.dataset.type;
    
    if (schema.tables[type]?.isEnum) {
        // Siempre mostrar todos los valores válidos del enum al hacer focus
        showTooltip(cell, schema.tables[type].values, true);
    }
}

function showTooltip(cell, suggestions, isEnumList = false) {
    // Eliminar tooltip existente si hay uno
    const existingTooltip = document.querySelector('.suggestion-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'suggestion-tooltip';
    
    // Añadir un título al tooltip
    const title = document.createElement('div');
    title.className = 'suggestion-title';
    title.textContent = isEnumList ? 'Valores disponibles:' : 'Valores válidos:';
    tooltip.appendChild(title);

    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = suggestion;
        item.onclick = () => {
            cell.textContent = suggestion;
            validateCell(cell);
            tooltip.remove();
        };
        tooltip.appendChild(item);
    });
    
    const rect = cell.getBoundingClientRect();
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + 5}px`;
    document.body.appendChild(tooltip);
    
    // Mantener tooltip visible al hacer hover
    tooltip.addEventListener('mouseenter', () => {
        const existingTimeout = tooltip.dataset.timeout;
        if (existingTimeout) clearTimeout(existingTimeout);
    });
    
    tooltip.addEventListener('mouseleave', () => {
        const timeoutId = setTimeout(() => tooltip.remove(), 200);
        tooltip.dataset.timeout = timeoutId;
    });
    
    cell.addEventListener('blur', () => {
        const timeoutId = setTimeout(() => tooltip.remove(), 200);
        tooltip.dataset.timeout = timeoutId;
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
        td.contentEditable = true;
        td.dataset.type = col.type;
        td.dataset.column = col.name;
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
        const cells = row.querySelectorAll('td');
        const hasData = Array.from(cells).some(cell => cell.textContent.trim());
        if (!hasData) return;

        const values = {};
        let isValid = true;

        cells.forEach(cell => {
            const column = table.columns.find(col => col.name === cell.dataset.column);
            const value = cell.textContent.trim();

            // Validar según las reglas de nulos
            if (value === '-' || !value) {
                if (column.pk || column.notNull) {
                    isValid = false; // No se permiten nulos
                }
                values[cell.dataset.column] = null;
                return;
            }

            if (schema.tables[column.type]?.isEnum) {
                // Manejo especial para enums
                const exactMatch = findExactEnumValue(value, schema.tables[column.type].values);
                if (exactMatch) {
                    values[cell.dataset.column] = exactMatch; // Usar el valor exacto del enum
                } else {
                    isValid = false;
                }
            } else if (!cell.classList.contains('valid')) {
                isValid = false;
            } else {
                // Convertir coma a punto para valores float
                if (cell.dataset.type === 'FLOAT' && value) {
                    values[cell.dataset.column] = value.replace(',', '.');
                } else {
                    values[cell.dataset.column] = value;
                }
            }
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
        const tableName = document.getElementById('excelTableSelect').value;
        if (tableName) {
            setupExcelGrid(); // Esto recreará la tabla limpia
        }
    }
}

// Añadir después de las funciones existentes y antes de los event listeners
function normalizeString(str) {
    return str.normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // Eliminar diacríticos
              .toLowerCase()
              .replace(/[^a-z0-9]/g, ""); // Eliminar caracteres especiales
}

function findExactEnumValue(value, enumValues) {
    const normalizedValue = normalizeString(value);
    return enumValues.find(enumVal => 
        normalizeString(enumVal) === normalizedValue
    );
}

// Modificar la función de inicialización para añadir el listener de cambios en tablas
document.addEventListener('DOMContentLoaded', () => {
    updateTableSelect();
    
    // Añadir listener para cambios en la estructura de tablas
    document.addEventListener('tableStructureChanged', (e) => {
        const currentTable = document.getElementById('excelTableSelect').value;
        if (currentTable === e.detail.tableName) {
            // Si la tabla que se editó es la que está actualmente mostrada
            // Forzar una reconstrucción completa de la tabla
            setupExcelGrid();
        }
    });
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

// Actualizar los estilos CSS
const style = document.createElement('style');
style.textContent = `
    #excelGrid td {
        min-width: 100px;
        height: 24px;
        padding: 4px 8px;
        border: 1px solid #ddd;
        outline: none;
    }
    #excelGrid td.selected {
        background-color: rgba(59, 89, 152, 0.1);
        border: 1px solid var(--color-primary);
    }
    #excelGrid td:focus {
        border: 2px solid var(--color-primary);
        background-color: #fff;
    }
    .suggestion-tooltip {
        position: absolute;
        background: white;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        padding: 0.5rem;
        box-shadow: var(--shadow-md);
        max-width: 250px;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
    }

    .suggestion-title {
        font-weight: bold;
        padding-bottom: 0.5rem;
        margin-bottom: 0.5rem;
        border-bottom: 1px solid var(--color-border);
        color: var(--color-primary);
    }

    .suggestion-item {
        padding: 0.3rem 0.5rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .suggestion-item:hover {
        background-color: var(--color-bg);
        color: var(--color-primary);
    }

    #excelGrid td.null-value {
        background-color: #e3f2fd;
        color: #1976d2;
    }

    #excelGrid td.valid {
        background-color: #e8f5e9;  /* Verde claro */
    }
    
    #excelGrid td.warning {
        background-color: #fff3e0;  /* Naranja claro */
    }
    
    #excelGrid td.error {
        background-color: #ffebee;  /* Rojo claro */
    }
    
    #excelGrid td:focus {
        border: 2px solid var(--color-primary);
        background-color: #fff !important;  /* Importante para sobreescribir otros estados cuando está en foco */
    }
`;
document.head.appendChild(style);

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
