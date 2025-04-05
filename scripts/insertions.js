function setupInsertionsTab() {
    const container = document.getElementById('inserciones');
    container.innerHTML = '<h2>Inserciones de Datos</h2>';

    // Crear una sección para cada tabla
    for (const tableName in schema.tables) {
        if (!schema.tables[tableName].isEnum) {
            const tableSection = createTableSection(tableName);
            container.appendChild(tableSection);
        }
    }
}

function createTableSection(tableName) {
    const section = document.createElement('div');
    section.className = 'table-section';
    
    const header = document.createElement('div');
    header.className = 'table-header';
    header.innerHTML = `
        <h3>${tableName}</h3>
        <button onclick="toggleInsertForm('${tableName}')">Insertar Datos</button>
    `;

    const form = document.createElement('div');
    form.id = `insert-form-${tableName}`;
    form.className = 'insert-form';
    form.style.display = 'none';
    
    const fields = schema.tables[tableName].columns.map(col => createInputField(col));
    form.innerHTML = `
        <div class="insert-fields">
            ${fields.join('')}
        </div>
        <div class="insert-buttons">
            <button onclick="insertData('${tableName}', true)">Insertar y Continuar</button>
            <button onclick="insertData('${tableName}', false)">Insertar y Cerrar</button>
        </div>
    `;

    section.appendChild(header);
    section.appendChild(form);
    return section;
}

function createInputField(column) {
    const label = `<label>${column.name} (${column.type}):</label>`;
    let input = '';

    if (schema.tables[column.type]?.isEnum) {
        // Campo ENUM
        const options = schema.tables[column.type].values
            .map(value => `<option value="${value}">${value}</option>`)
            .join('');
        input = `<select name="${column.name}" required>
                    <option value="">Seleccione...</option>
                    ${options}
                </select>`;
    } else {
        // Otros tipos de campo
        switch (column.type) {
            case 'DATE':
                input = `<input type="date" name="${column.name}" required>`;
                break;
            case 'INT':
                input = `<input type="number" name="${column.name}" step="1" required>`;
                break;
            case 'FLOAT':
                input = `<input type="number" name="${column.name}" step="0.01" required>`;
                break;
            case 'BOOLEAN':
                input = `<select name="${column.name}" required>
                            <option value="">Seleccione...</option>
                            <option value="true">Verdadero</option>
                            <option value="false">Falso</option>
                        </select>`;
                break;
            default:
                input = `<input type="text" name="${column.name}" required>`;
        }
    }

    return `<div class="input-field">${label}${input}</div>`;
}

function toggleInsertForm(tableName) {
    const form = document.getElementById(`insert-form-${tableName}`);
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function insertData(tableName, continueInserting) {
    try {
        const form = document.getElementById(`insert-form-${tableName}`);
        const fields = form.querySelectorAll('input, select');
        const values = {};
        const columns = schema.tables[tableName].columns;

        // Validar y recoger valores
        fields.forEach(field => {
            const column = columns.find(col => col.name === field.name);
            const value = validateAndFormatValue(field.value, column.type);
            values[field.name] = value;
        });

        // Construir y ejecutar la consulta SQL
        const columnNames = Object.keys(values).join(', ');
        const columnValues = Object.values(values).map(v => typeof v === 'string' ? `'${v}'` : v).join(', ');
        const query = `INSERT INTO ${tableName} (${columnNames}) VALUES (${columnValues})`;

        alasql(query);
        
        if (continueInserting) {
            // Limpiar el formulario
            fields.forEach(field => {
                field.value = '';
            });
        } else {
            // Cerrar el formulario
            form.style.display = 'none';
        }

        alert('Datos insertados correctamente');
    } catch (error) {
        alert('Error al insertar datos: ' + error.message);
    }
}

function validateAndFormatValue(value, type) {
    if (value === '') {
        throw new Error('Todos los campos son obligatorios');
    }

    switch (type) {
        case 'INT':
            if (!Number.isInteger(Number(value))) {
                throw new Error('El valor debe ser un número entero');
            }
            return parseInt(value);
        case 'FLOAT':
            if (isNaN(Number(value))) {
                throw new Error('El valor debe ser un número');
            }
            return parseFloat(value);
        case 'BOOLEAN':
            return value === 'true';
        case 'DATE':
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                throw new Error('Formato de fecha inválido');
            }
            return value;
        default:
            return value;
    }
}
