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
        cell.addEventListener('keydown', handleKeyNavigation);
        
        // Validación numérica en tiempo real
        if (cell.dataset.type === 'INT' || cell.dataset.type === 'FLOAT') {
            setupNumericCellValidation(cell);
        }
        
        // Mostrar sugerencias al hacer focus o clic
        cell.addEventListener('focus', () => {
            if (schema.tables[cell.dataset.type]?.isEnum) {
                showSuggestions(cell);
            }
        });
        cell.addEventListener('click', () => {
            if (schema.tables[cell.dataset.type]?.isEnum) {
                showSuggestions(cell);
            }
        });
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

function setupNumericCellValidation(cell) {
    const isInteger = cell.dataset.type === 'INT';
    
    cell.addEventListener('keypress', function(e) {
        const char = String.fromCharCode(e.which);
        
        // Permitir teclas de control
        if (e.which < 32) return;
        
        // Permitir números
        if (/[0-9]/.test(char)) return;
        
        // Para enteros: solo permitir guión al principio
        if (isInteger) {
            if (char === '-' && this.textContent.length === 0) return;
            e.preventDefault();
            return;
        }
        
        // Para flotantes: permitir punto/coma decimal y guión
        if (!isInteger) {
            if ((char === '.' || char === ',') && !this.textContent.includes('.') && !this.textContent.includes(',')) return;
            if (char === '-' && this.textContent.length === 0) return;
        }
        
        // Bloquear todo lo demás
        e.preventDefault();
    });
    
    cell.addEventListener('input', function(e) {
        let value = this.textContent;
        
        if (isInteger) {
            // Para enteros: solo números y guión al principio
            value = value.replace(/[^0-9-]/g, '');
            if (value.includes('-')) {
                const parts = value.split('-');
                if (parts[0] === '') {
                    value = '-' + parts.slice(1).join('');
                } else {
                    value = value.replace(/-/g, '');
                }
            }
        } else {
            // Para flotantes: números, punto/coma y guión
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
        }
        
        if (this.textContent !== value) {
            this.textContent = value;
            
            // Mantener el cursor al final
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(this);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
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

function isValidDate(dateStr) {
    // Validar formato (dd-mm-yyyy o dd/mm/yyyy)
    if (!/(^\d{1,2}[-/]\d{1,2}[-/]\d{1,4}$)/.test(dateStr)) {
        return { isValid: false };
    }

    // Obtener día, mes y año
    const parts = dateStr.split(/[-/]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Validar rangos
    if (year < 0 || year > 2999) return { isValid: false };
    if (month < 1 || month > 12) return { isValid: false };
    if (day < 1 || day > 31) return { isValid: false };

    // Meses con 30 días
    const months30 = [4, 6, 9, 11];
    if (months30.includes(month) && day > 30) return { isValid: false };

    // Febrero y años bisiestos
    if (month === 2) {
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const maxDays = isLeapYear ? 29 : 28;
        if (day > maxDays) return { isValid: false };
    }

    return { isValid: true };
}

function validateCell(cell) {
    const value = cell.textContent.trim();
    const type = cell.dataset.type;
    const columnName = cell.dataset.column;
    const column = schema.tables[document.getElementById('excelTableSelect').value].columns
        .find(col => col.name === columnName);
    
    cell.classList.remove('valid', 'warning', 'error', 'null-value');
    
    // Limpiar tooltips anteriores
    const existingTooltip = cell.querySelector('.validation-error');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    if (value === '-') {
        if (column.pk || column.notNull) {
            cell.classList.add('error');
            cell.classList.add('null-value');
            showValidationError(cell, column.pk ? 
                'La clave primaria no puede estar vacía' : 
                'Este campo es obligatorio y no puede estar vacío');
        } else {
            cell.classList.add('valid');
            cell.classList.add('null-value');
        }
        return;
    }

    if (!value) {
        if (column.pk) {
            cell.classList.add('error');
            showValidationError(cell, 'La clave primaria debe tener un valor único');
            return;
        } else if (column.notNull) {
            cell.classList.add('warning');
            showValidationError(cell, 'Este campo es obligatorio');
            return;
        } else {
            cell.classList.add('valid');
            return;
        }
    }

    try {
        // Usar nuestra función de validación mejorada
        if (schema.tables[type]?.isEnum) {
            const enumValues = schema.tables[type].values;
            const exactMatch = findExactEnumValue(value, enumValues);
            
            if (exactMatch) {
                cell.classList.add('valid');
                if (value !== exactMatch) {
                    cell.textContent = exactMatch;
                }
            } else {
                cell.classList.add('error');
                const similar = findSimilarValues(value, enumValues);
                if (similar.length > 0) {
                    showValidationError(cell, `Valor no válido. ¿Quiso decir: ${similar.join(', ')}?`);
                } else {
                    showValidationError(cell, `Debe ser uno de: ${enumValues.join(', ')}`);
                }
            }
        } else {
            // Usar la función de validación mejorada
            try {
                validateAndFormatValue(value, type, columnName, column.pk);
                cell.classList.add('valid');
            } catch (validationError) {
                cell.classList.add('error');
                showValidationError(cell, validationError.message.replace(`El campo "${columnName}" `, ''));
            }
        }
    } catch (e) {
        cell.classList.add('error');
        showValidationError(cell, 'Valor no válido');
    }
}

function showValidationError(cell, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: absolute;
        background: #ff4444;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        max-width: 200px;
        word-wrap: break-word;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        pointer-events: none;
    `;
    
    cell.style.position = 'relative';
    cell.appendChild(errorDiv);
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 3000);
}

function updateCellValidation(cell, isValid, type = 'error') {
    cell.classList.remove('valid', 'invalid', 'warning');
    
    if (type === 'warning') {
        cell.classList.add('warning');
    } else {
        cell.classList.add(isValid ? 'valid' : 'invalid');
    }
}

function showAvailableValues(cell, values) {
    const dropdown = document.createElement('select');
    dropdown.className = 'available-values-dropdown';
    // ...resto del código existente
}

function showSuggestion(cell, suggestion) {
    const tooltip = document.createElement('div');
    tooltip.className = 'suggestion-tooltip';
    // ...resto del código existente
}

function showSuggestions(cell) {
    const type = cell.dataset.type;
    
    if (schema.tables[type]?.isEnum) {
        // Asegurar que el tooltip se muestra después de un pequeño retraso
        // para evitar conflictos con otros eventos
        setTimeout(() => {
            showTooltip(cell, schema.tables[type].values, true);
        }, 50);
    }
}

function showTooltip(cell, suggestions, isEnumList = false) {
    // Eliminar tooltips existentes
    const existingTooltip = document.querySelector('.suggestion-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'suggestion-tooltip';
    
    // Agregar título
    const title = document.createElement('div');
    title.className = 'suggestion-title';
    title.textContent = 'Valores disponibles:';
    tooltip.appendChild(title);
    
    // Crear contenedor de sugerencias
    const suggestionList = document.createElement('div');
    suggestionList.className = 'suggestion-list';
    
    let filteredSuggestions = [...suggestions];
    const currentValue = cell.textContent.trim().toLowerCase();
    
    if (currentValue) {
        filteredSuggestions = suggestions.filter(suggestion => 
            suggestion.toLowerCase().includes(currentValue)
        );
    }

    if (filteredSuggestions.length === 0) {
        filteredSuggestions = suggestions;
    }

    filteredSuggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        
        if (currentValue) {
            const matchIndex = suggestion.toLowerCase().indexOf(currentValue);
            if (matchIndex !== -1) {
                const before = suggestion.substring(0, matchIndex);
                const match = suggestion.substring(matchIndex, matchIndex + currentValue.length);
                const after = suggestion.substring(matchIndex + currentValue.length);
                item.innerHTML = `${before}<span class="highlight">${match}</span>${after}`;
            } else {
                item.textContent = suggestion;
            }
        } else {
            item.textContent = suggestion;
        }
        
        item.onclick = (e) => {
            e.stopPropagation(); // Evitar que el click se propague
            cell.textContent = suggestion;
            validateCell(cell);
            tooltip.remove();
        };
        suggestionList.appendChild(item);
    });

    tooltip.appendChild(suggestionList);
    
    // Posicionar el tooltip
    const rect = cell.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    
    tooltip.style.position = 'absolute';
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + scrollY}px`;
    tooltip.style.minWidth = `${rect.width}px`;
    tooltip.style.zIndex = '1000';
    
    document.body.appendChild(tooltip);

    // Cerrar el tooltip cuando se hace clic fuera
    document.addEventListener('click', (e) => {
        if (!tooltip.contains(e.target) && e.target !== cell) {
            tooltip.remove();
        }
    });

    // Manejar navegación con teclado
    cell.addEventListener('keydown', (e) => {
        const items = tooltip.querySelectorAll('.suggestion-item');
        const currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < items.length - 1) {
                    items[currentIndex]?.classList.remove('selected');
                    items[currentIndex + 1]?.classList.add('selected');
                    items[currentIndex + 1]?.scrollIntoView({ block: 'nearest' });
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    items[currentIndex]?.classList.remove('selected');
                    items[currentIndex - 1]?.classList.add('selected');
                    items[currentIndex - 1]?.scrollIntoView({ block: 'nearest' });
                }
                break;
            case 'Enter':
                e.preventDefault();
                const selectedItem = tooltip.querySelector('.suggestion-item.selected');
                if (selectedItem) {
                    cell.textContent = selectedItem.textContent;
                    validateCell(cell);
                    tooltip.remove();
                }
                break;
            case 'Escape':
                tooltip.remove();
                break;
        }
    });

    // Cerrar al perder el foco, con un pequeño retraso para permitir clicks
    const timeoutId = setTimeout(() => {
        const closeHandler = (e) => {
            if (!tooltip.contains(e.target) && e.target !== cell) {
                tooltip.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
    }, 100);

    tooltip.dataset.timeout = timeoutId;
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
        showNotification('Error: La tabla no tiene clave primaria definida', 'error');
        return;
    }

    // Obtener todos los registros existentes por PK para comparar
    const existingRecords = new Map();
    try {
        const currentData = ejecutarSQL(`SELECT * FROM ${tableName}`);
        currentData.forEach(record => {
            existingRecords.set(record[pkColumn.name], record);
        });
    } catch (error) {
        console.error('Error al obtener datos existentes:', error);
    }

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
        const errors = [];
        let isValid = true;

        // Recolectar valores y validar
        cells.forEach(cell => {
            const column = table.columns.find(col => col.name === cell.dataset.column);
            const value = cell.textContent.trim();
            const columnName = cell.dataset.column;

            try {
                if (value === '-' || !value) {
                    if (column.pk) {
                        errors.push(`La clave primaria "${columnName}" no puede estar vacía`);
                        isValid = false;
                        return;
                    }
                    if (column.notNull) {
                        errors.push(`El campo obligatorio "${columnName}" no puede estar vacío`);
                        isValid = false;
                        return;
                    }
                    values[columnName] = null;
                    return;
                }

                // Validar usando nuestra función mejorada
                if (schema.tables[column.type]?.isEnum) {
                    const exactMatch = findExactEnumValue(value, schema.tables[column.type].values);
                    if (exactMatch) {
                        values[columnName] = exactMatch;
                    } else {
                        errors.push(`"${value}" no es válido para ${columnName}. Valores permitidos: ${schema.tables[column.type].values.join(', ')}`);
                        isValid = false;
                    }
                } else {
                    try {
                        const validatedValue = validateAndFormatValue(value, column.type, columnName, column.pk);
                        values[columnName] = validatedValue;
                    } catch (validationError) {
                        errors.push(validationError.message);
                        isValid = false;
                    }
                }
            } catch (error) {
                errors.push(`Error en ${columnName}: ${error.message}`);
                isValid = false;
            }
        });

        if (isValid) {
            try {
                const pkValue = values[pkColumn.name];
                const existingRecord = existingRecords.get(pkValue);

                if (existingRecord) {
                    // Verificar si realmente hay cambios
                    const changes = [];
                    let hasChanges = false;

                    for (const [col, val] of Object.entries(values)) {
                        if (col === pkColumn.name) continue;
                        
                        let currentVal = val;
                        let existingVal = existingRecord[col];
                        
                        if (currentVal === '') currentVal = null;
                        if (existingVal === '') existingVal = null;
                        
                        if (typeof existingVal === 'number') {
                            currentVal = currentVal === null ? null : Number(currentVal);
                        }

                        if (currentVal !== existingVal) {
                            hasChanges = true;
                            changes.push([col, val]);
                        }
                    }

                    if (!hasChanges) {
                        row.style.backgroundColor = '#f5f5f5';
                        ignoredCount++;
                        return;
                    }

                    const updateCols = changes.map(([col, val]) => 
                        `${col} = ${val === null ? 'NULL' : typeof val === 'string' ? `'${val}'` : val}`
                    );

                    if (updateCols.length > 0) {
                        const updateQuery = `UPDATE ${tableName} SET ${updateCols.join(', ')} WHERE ${pkColumn.name} = ${typeof pkValue === 'string' ? `'${pkValue}'` : pkValue}`;
                        ejecutarSQL(updateQuery);
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
                    ejecutarSQL(query);
                    row.style.backgroundColor = '#e8f5e9';
                    successCount++;
                }
            } catch (sqlError) {
                console.error('Error SQL:', sqlError);
                row.style.backgroundColor = '#ffebee';
                
                // Mostrar error específico en la fila
                let friendlyError = 'Error al procesar';
                if (sqlError.message.includes('PRIMARY KEY') || sqlError.message.includes('duplicate')) {
                    friendlyError = 'Clave primaria duplicada';
                } else if (sqlError.message.includes('CHECK')) {
                    friendlyError = 'Valor no válido para las restricciones';
                }
                
                row.title = friendlyError;
                errorCount++;
            }
        } else {
            row.style.backgroundColor = '#ffebee';
            row.title = errors.join('; ');
            errorCount++;
        }
    });

    // Mostrar resumen de resultados
    const totalProcessed = successCount + updatedCount + errorCount + ignoredCount;
    if (totalProcessed > 0) {
        let message = `Procesamiento completado:\n`;
        if (successCount > 0) message += `• Nuevos registros: ${successCount}\n`;
        if (updatedCount > 0) message += `• Registros actualizados: ${updatedCount}\n`;
        if (ignoredCount > 0) message += `• Sin cambios: ${ignoredCount}\n`;
        if (errorCount > 0) message += `• Errores: ${errorCount}\n`;
        
        const notificationType = errorCount === 0 ? 'success' : (successCount > 0 || updatedCount > 0 ? 'warning' : 'error');
        showNotification(message, notificationType);
    } else {
        showNotification('No se encontraron datos para procesar', 'warning');
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
        const data = ejecutarSQL(`SELECT * FROM ${tableName}`);
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
