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

    // Reaplicar layouts personalizados si existen
    if (window.customInsertLayouts) {
        for (const tableName in window.customInsertLayouts) {
            if (window.customInsertLayouts.hasOwnProperty(tableName)) {
                processEsqlContent(window.customInsertLayouts[tableName]);
            }
        }
    }
    
    // Configurar validación numérica después de crear los campos
    setupNumericValidation();
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
    // Add red asterisk for NOT NULL fields and primary keys
    const isRequired = column.notNull || column.pk;
    const asterisk = isRequired ? '<span style="color: red;">*</span>' : '';
    const label = `<label>${column.name}: ${asterisk}</label>`;
    let input = '';

    if (schema.tables[column.type]?.isEnum) {
        // Campo ENUM
        const options = schema.tables[column.type].values
            .map(value => `<option value="${value}">${value}</option>`)
            .join('');
        input = `<select name="${column.name}" ${column.pk ? 'required' : ''}>
                    <option value="">Seleccione...</option>
                    ${options}
                </select>`;
    } else {
        // Otros tipos de campo
        switch (column.type) {
            case 'DATE':
                input = `<input type="date" name="${column.name}" ${column.pk ? 'required' : ''}>`;
                break;
            case 'INT':
                input = `<input type="text" name="${column.name}" ${column.pk ? 'required' : ''} 
                        class="numeric-input integer-input" 
                        inputmode="numeric" 
                        placeholder="Número entero (ej: 123)">`;
                break;
            case 'FLOAT':
                input = `<input type="text" name="${column.name}" ${column.pk ? 'required' : ''} 
                        class="numeric-input float-input" 
                        inputmode="decimal" 
                        placeholder="Número decimal (ej: 12.34)">`;
                break;
            case 'BOOLEAN':
                input = `<input type="checkbox" name="${column.name}" ${column.pk ? 'required' : ''}>`;
                break;
            default:
                input = `<input type="text" name="${column.name}" ${column.pk ? 'required' : ''}>`;
        }
    }

    return `<div class="input-field">${label}${input}</div>`;
}

function toggleInsertForm(tableName) {
    const form = document.getElementById(`insert-form-${tableName}`);
    const isVisible = form.style.display === 'block';

    if (!isVisible) {
        // Al mostrar el formulario, comprobar si hay un layout personalizado y aplicarlo
        if (window.customInsertLayouts && window.customInsertLayouts[tableName]) {
            // Primero, regeneramos el contenido original del formulario
            const fields = schema.tables[tableName].columns.map(col => createInputField(col));
            const insertFieldsContainer = form.querySelector('.insert-fields');
            insertFieldsContainer.innerHTML = fields.join('');
            
            // Luego, aplicamos la personalización
            processEsqlContent(window.customInsertLayouts[tableName]);
        }
        
        // Configurar validación numérica para los nuevos campos
        setupNumericValidation();
    }

    form.style.display = isVisible ? 'none' : 'block';
}

function setupNumericValidation() {
    // Validación para campos de enteros
    document.querySelectorAll('.integer-input').forEach(input => {
        input.addEventListener('input', function(e) {
            // Permitir solo números, guión inicial para negativos
            let value = e.target.value;
            
            // Remover caracteres no válidos
            value = value.replace(/[^0-9-]/g, '');
            
            // Asegurar que el guión solo esté al principio
            if (value.includes('-')) {
                const parts = value.split('-');
                if (parts[0] === '') {
                    // El guión está al principio, está bien
                    value = '-' + parts.slice(1).join('');
                } else {
                    // Remover todos los guiones
                    value = value.replace(/-/g, '');
                }
            }
            
            e.target.value = value;
        });
        
        input.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            const currentValue = e.target.value;
            
            // Permitir teclas de control (backspace, delete, tab, etc.)
            if (e.which < 32) return;
            
            // Permitir números
            if (/[0-9]/.test(char)) return;
            
            // Permitir guión solo al principio y si no hay ya uno
            if (char === '-' && currentValue.length === 0 && !currentValue.includes('-')) return;
            
            // Bloquear todo lo demás
            e.preventDefault();
        });
    });

    // Validación para campos de flotantes
    document.querySelectorAll('.float-input').forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value;
            
            // Remover caracteres no válidos (permitir números, punto, coma y guión)
            value = value.replace(/[^0-9.,-]/g, '');
            
            // Convertir comas a puntos
            value = value.replace(/,/g, '.');
            
            // Asegurar que solo hay un punto decimal
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            // Manejar el guión para negativos
            if (value.includes('-')) {
                const minusParts = value.split('-');
                if (minusParts[0] === '') {
                    // El guión está al principio, está bien
                    value = '-' + minusParts.slice(1).join('');
                } else {
                    // Remover todos los guiones
                    value = value.replace(/-/g, '');
                }
            }
            
            e.target.value = value;
        });
        
        input.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            const currentValue = e.target.value;
            
            // Permitir teclas de control
            if (e.which < 32) return;
            
            // Permitir números
            if (/[0-9]/.test(char)) return;
            
            // Permitir punto decimal si no hay ya uno
            if ((char === '.' || char === ',') && !currentValue.includes('.')) return;
            
            // Permitir guión solo al principio
            if (char === '-' && currentValue.length === 0) return;
            
            // Bloquear todo lo demás
            e.preventDefault();
        });
    });
}

function validateAndFormatValue(value, type, columnName, isPrimaryKey = false) {
    // Si el valor está vacío
    if (value === '' || value === null || value === undefined) {
        if (isPrimaryKey) {
            throw new Error(`La clave primaria "${columnName}" no puede estar vacía. Debe proporcionar un valor único.`);
        }
        return null;
    }

    try {
        switch (type) {
            case 'INT':
                // Verificar que sea un número entero válido
                if (isNaN(value) || !Number.isInteger(Number(value))) {
                    throw new Error(`El campo "${columnName}" debe ser un número entero (ej: 1, 2, 3). El valor "${value}" no es válido.`);
                }
                const intValue = parseInt(value);
                if (intValue.toString() !== value.toString()) {
                    throw new Error(`El campo "${columnName}" debe ser un número entero sin decimales. "${value}" contiene decimales.`);
                }
                return intValue;

            case 'FLOAT':
                if (isNaN(value)) {
                    throw new Error(`El campo "${columnName}" debe ser un número (ej: 1.5, 2.0, 3). El valor "${value}" no es válido.`);
                }
                return parseFloat(value);

            case 'BOOLEAN':
                // Los valores booleanos se manejan por checkbox, pero por si acaso
                if (typeof value === 'boolean') {
                    return value;
                }
                throw new Error(`El campo "${columnName}" debe ser verdadero o falso.`);

            case 'DATE':
                if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    throw new Error(`El campo "${columnName}" debe tener formato de fecha AAAA-MM-DD (ej: 2024-01-15). El formato "${value}" no es válido.`);
                }
                
                // Validar que sea una fecha real
                const date = new Date(value + 'T00:00:00');
                if (isNaN(date.getTime()) || date.toISOString().split('T')[0] !== value) {
                    throw new Error(`El campo "${columnName}" contiene una fecha que no existe: "${value}". Verifique el día y mes.`);
                }
                return value;

            case 'STRING':
                return value.toString();

            default:
                // Es un ENUM, validar que el valor esté en la lista
                if (schema.tables[type]?.isEnum) {
                    const validValues = schema.tables[type].values;
                    if (!validValues.includes(value)) {
                        throw new Error(`El campo "${columnName}" debe ser uno de estos valores: ${validValues.join(', ')}. El valor "${value}" no está permitido.`);
                    }
                    return value;
                }
                return value.toString();
        }
    } catch (error) {
        throw error; // Re-lanzar el error con el mensaje personalizado
    }
}

function insertData(tableName, continueInserting) {
    try {
        const form = document.getElementById(`insert-form-${tableName}`);
        const fields = form.querySelectorAll('input, select');
        const values = {};
        const columns = schema.tables[tableName].columns;
        
        // Encontrar la columna PK
        const pkColumn = columns.find(col => col.pk);
        
        // Validar y recoger valores
        fields.forEach(field => {
            const column = columns.find(col => col.name === field.name);
            if (!column) return;

            let value;
            if (column.type === 'BOOLEAN') {
                value = field.checked;
                values[field.name] = value;
                return;
            } else {
                value = field.value.trim();
            }
            
            try {
                // Validar usando la función mejorada
                const validatedValue = validateAndFormatValue(value, column.type, column.name, column.pk);
                
                // Validación especial para PK duplicada
                if (column.pk && validatedValue !== null) {
                    const existingRecords = alasql(`SELECT * FROM ${tableName} WHERE ${column.name} = ?`, [validatedValue]);
                    if (existingRecords.length > 0) {
                        throw new Error(`Ya existe un registro con la clave primaria "${validatedValue}" en el campo "${column.name}". Las claves primarias deben ser únicas.`);
                    }
                }
                
                // Validación para campos NOT NULL
                if (column.notNull && !column.pk && validatedValue === null) {
                    throw new Error(`El campo "${column.name}" es obligatorio y no puede estar vacío.`);
                }
                
                values[field.name] = validatedValue;
                
            } catch (validationError) {
                throw validationError; // Re-lanzar con el mensaje específico
            }
        });

        // Construir y ejecutar la consulta SQL
        const columnNames = Object.keys(values);
        const columnValues = Object.values(values).map(v => 
            v === null ? 'NULL' : typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v
        );
        const query = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${columnValues.join(', ')})`;

        try {
            alasql(query);
        } catch (sqlError) {
            // Si hay un error de SQL inesperado, traducirlo
            let friendlyMessage = `Error al insertar los datos: ${sqlError.message}`;
            
            if (sqlError.message.includes('CHECK')) {
                friendlyMessage = `Error de validación: Uno de los valores no cumple con las restricciones de la tabla.`;
            } else if (sqlError.message.includes('PRIMARY KEY')) {
                friendlyMessage = `Error: La clave primaria debe ser única. Ya existe un registro con ese valor.`;
            } else if (sqlError.message.includes('NOT NULL')) {
                friendlyMessage = `Error: Hay campos obligatorios que no pueden estar vacíos.`;
            }
            
            throw new Error(friendlyMessage);
        }
        
        if (continueInserting) {
            // Limpiar todos los campos del formulario
            fields.forEach(field => {
                if (field.type === 'checkbox') {
                    field.checked = false;
                } else {
                    field.value = '';
                }
                // Para los select, seleccionar la primera opción (vacía)
                if (field.tagName === 'SELECT') {
                    field.selectedIndex = 0;
                }
            });
            // Mantener el foco en el campo PK para la siguiente inserción
            const pkField = form.querySelector(`[name="${pkColumn.name}"]`);
            if (pkField) {
                pkField.focus();
            }
            
            showNotification('Datos insertados correctamente. Puede continuar insertando.', 'success');
        } else {
            // Cerrar el formulario
            form.style.display = 'none';
            // Limpiar los campos antes de cerrar
            fields.forEach(field => {
                if (field.type === 'checkbox') {
                    field.checked = false;
                } else {
                    field.value = '';
                }
                if (field.tagName === 'SELECT') {
                    field.selectedIndex = 0;
                }
            });
            
            showNotification('Datos insertados correctamente.', 'success');
        }

    } catch (error) {
        // Mostrar error específico y amigable
        showNotification(error.message, 'error');
        console.error('Error en inserción:', error);
    }
}

function submitInsertForm(tableName) {
    const form = document.getElementById(`insert-form-${tableName}`);
    const inputs = form.querySelectorAll('input, select');
    const values = {};

    try {
        inputs.forEach(input => {
            if (input.name) {
                const column = schema.tables[tableName].columns.find(col => col.name === input.name);
                if (column) {
                    let value;
                    if (column.type === 'BOOLEAN') {
                        value = input.checked;
                    } else {
                        value = input.value.trim();
                    }
                    
                    try {
                        const validatedValue = validateAndFormatValue(value, column.type, column.name, column.pk);
                        
                        // Validación para campos NOT NULL
                        if (column.notNull && !column.pk && validatedValue === null) {
                            throw new Error(`El campo "${column.name}" es obligatorio y no puede estar vacío.`);
                        }
                        
                        values[input.name] = validatedValue;
                    } catch (validationError) {
                        throw validationError;
                    }
                }
            }
        });

        const columns = Object.keys(values).join(', ');
        const valuePlaceholders = Object.values(values).map(() => '?').join(', ');
        const query = `INSERT INTO ${tableName} (${columns}) VALUES (${valuePlaceholders})`;
        
        try {
            alasql(query, Object.values(values));
        } catch (sqlError) {
            // Traducir errores de SQL a mensajes amigables
            let friendlyMessage = `Error al insertar los datos: ${sqlError.message}`;
            
            if (sqlError.message.includes('PRIMARY KEY') || sqlError.message.includes('duplicate')) {
                friendlyMessage = `Error: Ya existe un registro con la misma clave primaria. Los valores de clave primaria deben ser únicos.`;
            } else if (sqlError.message.includes('CHECK')) {
                friendlyMessage = `Error de validación: Uno o más valores no cumplen con las restricciones de la tabla.`;
            } else if (sqlError.message.includes('NOT NULL')) {
                friendlyMessage = `Error: Hay campos obligatorios que no pueden estar vacíos.`;
            }
            
            throw new Error(friendlyMessage);
        }
        
        showNotification(`Registro insertado en ${tableName} correctamente.`, 'success');
        form.reset();
        
    } catch (error) {
        showNotification(error.message, 'error');
        console.error('Error en submitInsertForm:', error);
    }
}
