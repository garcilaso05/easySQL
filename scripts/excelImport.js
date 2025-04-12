function setupExcelGrid() {
    const tableName = document.getElementById('excelTableSelect').value;
    if (!tableName) return;

    const grid = document.getElementById('excelGrid');
    const existingTable = grid.querySelector('table');
    const currentColumns = Array.from(grid.querySelectorAll('th')).map(th => {
        return th.textContent.split(' (')[0];
    });

    const newColumns = schema.tables[tableName].columns.map(col => col.name);
    const structureChanged = !currentColumns.length || 
                           !arraysEqual(currentColumns, newColumns);

    // Si la estructura cambió, recrear completamente
    if (structureChanged) {
        const rowCount = parseInt(document.getElementById('rowCount').value) || 100;
        createNewGrid(tableName, rowCount);
    } else {
        // Si no cambió la estructura, ajustar el número de filas manteniendo datos
        adjustRowCount(tableName);
    }
}

// Añadir nueva función para ajustar filas
function adjustRowCount(tableName) {
    const tbody = document.querySelector('#excelGrid tbody');
    const currentRows = tbody.querySelectorAll('tr');
    const desiredRowCount = parseInt(document.getElementById('rowCount').value) || 100;
    const currentRowCount = currentRows.length;

    if (desiredRowCount > currentRowCount) {
        // Añadir filas
        for (let i = currentRowCount; i < desiredRowCount; i++) {
            addNewRow();
        }
    } else if (desiredRowCount < currentRowCount) {
        // Verificar si las últimas filas están vacías antes de eliminarlas
        for (let i = currentRowCount - 1; i >= desiredRowCount; i--) {
            const row = currentRows[i];
            const hasData = Array.from(row.cells).some(cell => cell.textContent.trim());
            if (!hasData) {
                row.remove();
            } else {
                // Si encontramos datos, mantener el rowCount en el número actual de filas
                document.getElementById('rowCount').value = i + 1;
                break;
            }
        }
    }
}

function createNewGrid(tableName, rowCount) {
    const grid = document.getElementById('excelGrid');
    const table = schema.tables[tableName];
    
    let html = '<div class="excel-scroll-container">';
    // Añadir scroll superior
    html += '<div class="excel-scroll-wrapper top-scroll"></div>';
    // Contenedor principal con la tabla
    html += '<div class="excel-scroll-wrapper main-scroll">';
    html += '<table><thead><tr>';
    
    table.columns.forEach(col => {
        const isPK = col.pk ? 'pk-header' : '';
        html += `<th class="${isPK}">${col.name} (${col.type})</th>`;
    });
    
    html += '</tr></thead><tbody>';

    for (let i = 0; i < rowCount; i++) {
        html += '<tr>';
        table.columns.forEach(col => {
            html += `<td contenteditable="true" data-type="${col.type}" data-column="${col.name}"></td>`;
        });
        html += '</tr>';
    }
    html += '</tbody></table>';
    html += '</div></div>';
    grid.innerHTML = html;

    setupCellValidation();

    // Sincronizar scrolls
    const topScroll = grid.querySelector('.top-scroll');
    const mainScroll = grid.querySelector('.main-scroll');

    // Crear div del mismo ancho que la tabla para el scroll superior
    const scrollContent = document.createElement('div');
    scrollContent.style.width = mainScroll.querySelector('table').offsetWidth + 'px';
    scrollContent.style.height = '1px';
    topScroll.appendChild(scrollContent);

    // Sincronizar scrolls
    topScroll.addEventListener('scroll', () => {
        mainScroll.scrollLeft = topScroll.scrollLeft;
    });
    mainScroll.addEventListener('scroll', () => {
        topScroll.scrollLeft = mainScroll.scrollLeft;
    });
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
}

function setupCellValidation() {
    const cells = document.querySelectorAll('#excelGrid td[contenteditable]');
    cells.forEach(cell => {
        cell.addEventListener('paste', handlePaste);
        cell.addEventListener('input', () => validateCell(cell));
        cell.addEventListener('focus', () => showSuggestions(cell));
        cell.addEventListener('keydown', handleKeyNavigation);
    });

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

    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement.tagName === 'TD') {
            const selectedCells = document.querySelectorAll('#excelGrid td.selected');
            
            if (selectedCells.length > 1) {
                e.preventDefault();
                selectedCells.forEach(cell => {
                    cell.textContent = '';
                    validateCell(cell);
                });
            }
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

function handleKeyNavigation(e) {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    
    e.preventDefault();
    const currentCell = e.target;
    const currentRow = currentCell.parentElement;
    const currentIndex = Array.from(currentRow.cells).indexOf(currentCell);
    let nextCell;

    switch(e.key) {
        case 'ArrowRight':
            if (currentIndex < currentRow.cells.length - 1) {
                nextCell = currentRow.cells[currentIndex + 1];
            }
            break;
        case 'ArrowLeft':
            if (currentIndex > 0) {
                nextCell = currentRow.cells[currentIndex - 1];
            }
            break;
        case 'ArrowUp':
            if (currentRow.previousElementSibling) {
                nextCell = currentRow.previousElementSibling.cells[currentIndex];
            }
            break;
        case 'ArrowDown':
            if (currentRow.nextElementSibling) {
                nextCell = currentRow.nextElementSibling.cells[currentIndex];
            }
            break;
    }

    if (nextCell) {
        // Añadir transición suave
        nextCell.style.transition = 'background-color 0.2s ease';
        nextCell.focus();
        // Resaltar brevemente la celda seleccionada
        nextCell.style.backgroundColor = 'rgba(59, 89, 152, 0.1)';
        setTimeout(() => {
            nextCell.style.backgroundColor = '';
        }, 200);
        
        // Asegurar que la celda es visible en el contenedor
        const container = document.querySelector('.excel-scroll-wrapper');
        const cellRect = nextCell.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        if (cellRect.bottom > containerRect.bottom) {
            container.scrollBy({ top: cellRect.bottom - containerRect.bottom, behavior: 'smooth' });
        } else if (cellRect.top < containerRect.top) {
            container.scrollBy({ top: cellRect.top - containerRect.top, behavior: 'smooth' });
        }
        
        if (cellRect.right > containerRect.right) {
            container.scrollBy({ left: cellRect.right - containerRect.right, behavior: 'smooth' });
        } else if (cellRect.left < containerRect.left) {
            container.scrollBy({ left: cellRect.left - containerRect.left, behavior: 'smooth' });
        }
    }
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
    for (let i = range.startRow - 1; i <= range.endRow - 1; i++) {
        if (rows[i]) {
            const cells = rows[i].getElementsByTagName('td');
            for (let j = range.startCol; j <= range.endCol; j++) {
                if (cells[j]) {
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
    
    cell.classList.remove('valid', 'warning', 'error', 'null-value');
    
    if (value === '-') {
        if (column.pk || column.notNull) {
            cell.classList.add('error');
            cell.classList.add('null-value');
        } else {
            cell.classList.add('valid');
            cell.classList.add('null-value');
        }
        return;
    }

    if (!value) {
        if (column.pk) {
            return;
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
            const enumValues = schema.tables[type].values;
            const exactMatch = findExactEnumValue(value, enumValues);
            
            if (exactMatch) {
                cell.classList.add('valid');
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
        showTooltip(cell, schema.tables[type].values, true);
    }
}

function showTooltip(cell, suggestions, isEnumList = false) {
    const existingTooltip = document.querySelector('.suggestion-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'suggestion-tooltip';
    
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
    const pkColumn = table.columns.find(col => col.pk);
    if (!pkColumn) {
        alert('Error: La tabla no tiene clave primaria');
        return;
    }

    // Obtener todos los registros existentes por PK para comparar
    const existingRecords = new Map();
    const currentData = alasql(`SELECT * FROM ${tableName}`);
    currentData.forEach(record => {
        existingRecords.set(record[pkColumn.name], record);
    });

    const rows = document.querySelectorAll('#excelGrid tbody tr');
    let successCount = 0;
    let errorCount = 0;
    let updatedCount = 0;
    let ignoredCount = 0;

    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        const hasData = Array.from(cells).some(cell => cell.textContent.trim());
        if (!hasData) return;

        const values = {};
        let isValid = true;

        // Recolectar valores y validar
        cells.forEach(cell => {
            const column = table.columns.find(col => col.name === cell.dataset.column);
            const value = cell.textContent.trim();

            if (value === '-' || !value) {
                if (column.pk || column.notNull) {
                    isValid = false;
                }
                values[cell.dataset.column] = null;
                return;
            }

            if (schema.tables[column.type]?.isEnum) {
                const exactMatch = findExactEnumValue(value, schema.tables[column.type].values);
                if (exactMatch) {
                    values[cell.dataset.column] = exactMatch;
                } else {
                    isValid = false;
                }
            } else if (!cell.classList.contains('valid')) {
                isValid = false;
            } else {
                if (cell.dataset.type === 'FLOAT' && value) {
                    values[cell.dataset.column] = value.replace(',', '.');
                } else {
                    values[cell.dataset.column] = value;
                }
            }
        });

        if (isValid) {
            try {
                const pkValue = values[pkColumn.name];
                const existingRecord = existingRecords.get(pkValue);

                if (existingRecord) {
                    // Verificar si realmente hay cambios en alguna columna
                    const changes = [];
                    let hasChanges = false;

                    // Comparación estricta de valores
                    for (const [col, val] of Object.entries(values)) {
                        // Ignorar la clave primaria en la comparación
                        if (col === pkColumn.name) continue;
                        
                        // Convertir valores para comparación consistente
                        let currentVal = val;
                        let existingVal = existingRecord[col];
                        
                        // Manejar casos especiales
                        if (currentVal === '') currentVal = null;
                        if (existingVal === '') existingVal = null;
                        
                        // Convertir números si es necesario
                        if (typeof existingVal === 'number') {
                            currentVal = currentVal === null ? null : Number(currentVal);
                        }

                        // Comparar después de normalizar
                        if (currentVal !== existingVal) {
                            hasChanges = true;
                            changes.push([col, val]);
                        }
                    }

                    if (!hasChanges) {
                        // No hay cambios reales, marcar como ignorado
                        row.style.backgroundColor = '#f5f5f5';
                        ignoredCount++;
                        return;
                    }

                    // Solo actualizar las columnas que realmente cambiaron
                    const updateCols = changes.map(([col, val]) => 
                        `${col} = ${val === null ? 'NULL' : typeof val === 'string' ? `'${val}'` : val}`
                    );

                    if (updateCols.length > 0) {
                        const updateQuery = `UPDATE ${tableName} SET ${updateCols.join(', ')} WHERE ${pkColumn.name} = ${typeof pkValue === 'string' ? `'${pkValue}'` : pkValue}`;
                        alasql(updateQuery);
                        row.style.backgroundColor = '#e3f2fd';
                        updatedCount++;
                    }
                } else {
                    // Insertar nuevo registro
                    const columns = Object.keys(values);
                    const vals = columns.map(col => {
                        const value = values[col];
                        return value === null ? 'NULL' : typeof value === 'string' ? `'${value}'` : value;
                    });
                    
                    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${vals.join(', ')})`;
                    alasql(query);
                    row.style.backgroundColor = '#e8f5e9';
                    successCount++;
                }
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

    if (successCount > 0 || updatedCount > 0) {
        const message = `Importación completada:\n` +
              `- Nuevas inserciones: ${successCount}\n` +
              `- Actualizaciones: ${updatedCount}\n` +
              `- Sin cambios: ${ignoredCount}\n` +
              `- Errores: ${errorCount}`;
        
        // Cambiar el tipo de mensaje según si hubo errores o no
        if (errorCount > 0) {
            showNotification(message, 'warning');
        } else {
            showNotification(message, 'success');
        }

        showTab('datos');
        showAllData();
    }
}

function clearGrid() {
    if (confirm('¿Estás seguro de que deseas limpiar todos los datos?')) {
        const tableName = document.getElementById('excelTableSelect').value;
        if (tableName) {
            const rowCount = parseInt(document.getElementById('rowCount').value) || 100;
            createNewGrid(tableName, rowCount);
        }
    }
}

function loadExistingData() {
    const tableName = document.getElementById('excelTableSelect').value;
    if (!tableName) return;

    try {
        // Obtener datos existentes
        const data = alasql(`SELECT * FROM ${tableName}`);
        if (data.length === 0) {
            alert('No hay datos insertados en esta tabla.');
            return;
        }

        // Crear grid con el número exacto de filas de los datos existentes
        createNewGrid(tableName, data.length);

        // Rellenar datos
        const rows = document.querySelectorAll('#excelGrid tbody tr');
        data.forEach((record, rowIndex) => {
            const row = rows[rowIndex];
            if (!row) return;

            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                const columnName = cell.dataset.column;
                const value = record[columnName];
                cell.textContent = value !== null ? value : '';
                validateCell(cell);
            });
        });

        // Actualizar el contador de filas
        document.getElementById('rowCount').value = data.length;

    } catch (error) {
        console.error('Error al cargar datos:', error);
        alert('Error al cargar los datos existentes.');
    }
}

function normalizeString(str) {
    return str.normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
}

function findExactEnumValue(value, enumValues) {
    const normalizedValue = normalizeString(value);
    return enumValues.find(enumVal => 
        normalizeString(enumVal) === normalizedValue
    );
}

document.addEventListener('DOMContentLoaded', () => {
    updateTableSelect();
    
    document.addEventListener('tableStructureChanged', (e) => {
        const currentTable = document.getElementById('excelTableSelect').value;
        const grid = document.getElementById('excelGrid');
        
        if (currentTable === e.detail.tableName || 
            (currentTable && !schema.tables[currentTable])) {
            grid.innerHTML = '';
            updateTableSelect();
            setupExcelGrid();
        }
    });

    // Añadir listener para cambios en rowCount
    const rowCountInput = document.getElementById('rowCount');
    rowCountInput.addEventListener('change', () => {
        const tableName = document.getElementById('excelTableSelect').value;
        if (tableName) {
            adjustRowCount(tableName);
        }
    });
});

function updateTableSelect() {
    const select = document.getElementById('excelTableSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecciona una tabla</option>';
    
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
        background-color: #fff !important;
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
    }

    .suggestion-item {
        padding: 0.3rem 0.5rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .suggestion-item:hover {
        background-color: var(--color-bg-hover);
        color: var(--color-primary);
    }
    .excel-scroll-wrapper.top-scroll {
        height: 20px;
        margin-bottom: 0;
        border-bottom: 1px solid var(--color-border);
        overflow-y: hidden;
    }
    .excel-scroll-wrapper.main-scroll {
        overflow-x: auto;
        max-height: calc(100vh - 350px);
    }
    .excel-scroll-wrapper::-webkit-scrollbar {
        height: 17px;
    }
    .excel-scroll-wrapper::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 8px;
    }
    .excel-scroll-wrapper::-webkit-scrollbar-thumb {
        background: var(--color-primary);
        border-radius: 8px;
    }
    .excel-scroll-wrapper::-webkit-scrollbar-thumb:hover {
        background: var(--color-primary-hover);
    }
    #excelGrid th.pk-header {
        background: var(--color-accent);
        font-weight: bold;
        color: white;
    }
    #excelGrid td.valid {
        background-color: #e8f5e9;
    }
    #excelGrid td.warning {
        background-color: #fff3e0;
    }
    #excelGrid td.error {
        background-color: #ffebee;
    }
    #excelGrid td.null-value {
        background-color: #e3f2fd;
        color: #1976d2;
    }
    #excelGrid td.null-value.error {
        background-color: #ffebee;
        color: #d32f2f;
    }
`;

document.head.appendChild(style);
