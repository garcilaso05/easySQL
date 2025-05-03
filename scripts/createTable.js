function openCreateTableModal() {
    const container = document.getElementById('columnsContainer');
    container.innerHTML = ''; // Reiniciar el contenedor
    addColumnInput(); // Añadir un solo campo inicial
    document.getElementById('tableName').value = ''; // Limpiar el nombre
    document.getElementById('createTableModal').style.display = 'block';
}

function closeCreateTableModal() {
    document.getElementById('createTableModal').style.display = 'none';
}

function addColumnInput() {
    const container = document.getElementById('columnsContainer');
    const isFirstColumn = container.children.length === 0;

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
        <label><input type="checkbox" class="col-pk" ${isFirstColumn ? 'checked' : ''} 
            onchange="handlePrimaryKeyChange(this, 'columnsContainer')" 
            ${isFirstColumn ? 'disabled' : ''}> Clave Primaria</label>
        <label><input type="checkbox" class="col-notnull" 
            ${isFirstColumn ? 'disabled' : ''}> NOT NULL</label>
        <button onclick="removeColumnInput(this)" class="remove-column" 
            ${isFirstColumn ? 'disabled' : ''}>Eliminar</button>
    `;
    container.appendChild(newInput);

    // Enfocar el nuevo input
    const newNameInput = newInput.querySelector('.col-name');
    newNameInput.focus();

    // Scroll hasta el final
    container.scrollTop = container.scrollHeight;

    // Añadir listener para PK que deshabilite NOT NULL
    const pkCheckbox = newInput.querySelector('.col-pk');
    const notNullCheckbox = newInput.querySelector('.col-notnull');
    pkCheckbox.addEventListener('change', () => {
        notNullCheckbox.disabled = pkCheckbox.checked;
        if (pkCheckbox.checked) notNullCheckbox.checked = false;
    });

    // Hacer el contenedor de columnas desplazable
    container.style.maxHeight = '300px';
    container.style.overflowY = 'auto';
}

function handlePrimaryKeyChange(checkbox, containerId) {
    if (!checkbox.checked) {
        // No permitir desmarcar la única PK
        checkbox.checked = true;
        return;
    }

    const container = document.getElementById(containerId);
    const allCheckboxes = container.querySelectorAll('.col-pk');
    const allRemoveButtons = container.querySelectorAll('.remove-column');
    const allNotNullCheckboxes = container.querySelectorAll('.col-notnull');
    
    // Desmarcar y habilitar todos los checkboxes y botones de eliminar
    allCheckboxes.forEach((cb, index) => {
        if (cb !== checkbox) {
            cb.checked = false;
            cb.disabled = false;
            allRemoveButtons[index].disabled = false;
            // Habilitar NOT NULL cuando se desmarca PK
            allNotNullCheckboxes[index].disabled = false;
        }
    });

    // Deshabilitar el checkbox y botón de eliminar de la nueva PK
    checkbox.disabled = true;
    checkbox.parentElement.parentElement.querySelector('.remove-column').disabled = true;

    // Deshabilitar y desmarcar NOT NULL para la PK
    const notNullCheckbox = checkbox.parentElement.parentElement.querySelector('.col-notnull');
    notNullCheckbox.checked = false;
    notNullCheckbox.disabled = true;
}

function removeColumnInput(button) {
    const columnDiv = button.parentElement;
    const container = columnDiv.parentElement;
    const isPK = columnDiv.querySelector('.col-pk').checked;
    
    // No permitir eliminar si es el único elemento
    if (container.children.length <= 1) {
        alert('Una tabla debe tener al menos un elemento');
        return;
    }

    container.removeChild(columnDiv);

    // Si eliminamos la PK, asignar la primera columna como PK
    if (isPK) {
        const firstColumn = container.querySelector('.column-input');
        if (firstColumn) {
            const pkCheckbox = firstColumn.querySelector('.col-pk');
            pkCheckbox.checked = true;
            pkCheckbox.disabled = true;
            firstColumn.querySelector('.remove-column').disabled = true;
        }
    }
}

function createTableFromForm() {
    const tableName = document.getElementById('tableName').value.trim();
    if (!tableName) {
        alert('Por favor, ingresa un nombre para la tabla.');
        return;
    }

    const columnInputs = document.querySelectorAll('.column-input');
    if (columnInputs.length === 0) {
        alert('Por favor, añade al menos un elemento a la tabla.');
        return;
    }

    // Verificar que hay exactamente una PK
    const pkCount = Array.from(columnInputs).filter(input => 
        input.querySelector('.col-pk').checked
    ).length;

    if (pkCount !== 1) {
        alert('La tabla debe tener exactamente una clave primaria.');
        return;
    }

    const columns = [];
    let error = false;

    columnInputs.forEach(input => {
        const name = input.querySelector('.col-name').value.trim();
        const type = input.querySelector('.col-type').value;
        const pk = input.querySelector('.col-pk').checked;
        const notNull = input.querySelector('.col-notnull').checked;

        if (name) {
            try {
                let colDef = `${name} ${type}`;
                if (schema.tables[type]?.isEnum) {
                    const enumValues = schema.tables[type].values;
                    if (!enumValues || enumValues.length === 0) {
                        throw new Error(`El enum ${type} no tiene valores definidos`);
                    }
                    const enumValuesStr = enumValues.map(val => `'${val}'`).join(', ');
                    // Si es NOT NULL, no incluir IS NULL OR en el CHECK
                    colDef += notNull ? 
                        ` CHECK(${name} IN (${enumValuesStr}))` :
                        ` CHECK(${name} IS NULL OR ${name} IN (${enumValuesStr}))`;
                } else if (notNull) {
                    colDef += ' NOT NULL';
                }
                if (pk) {
                    colDef += ' PRIMARY KEY';
                }
                columns.push({
                    name,
                    type,
                    pk,
                    notNull: pk || notNull, // Aquí está una parte del problema
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

    const query = `CREATE TABLE ${tableName} (${columns.map(col => col.definition).join(', ')})`;

    try {
        alasql(query);
        schema.tables[tableName] = {
            columns: columns.map(({name, type, pk, notNull}) => ({
                name, 
                type, 
                pk,
                notNull: pk || notNull // Asegurarnos de que se guarda el notNull
            })),
            data: []
        };
        updateClassMap();
        closeCreateTableModal();
    } catch (e) {
        alert('Error al crear la tabla: ' + e.message);
    }
}

function updateClassMap() {
    nodes.clear();
    edges.clear();

    for (const tableName in schema.tables) {
        const table = schema.tables[tableName];
        if (table.isEnum) {
            const values = table.values.join(', ');
            nodes.add({ id: tableName, label: `${tableName}\n${values}` });
        } else {
            const columns = table.columns.map(col => {
                let colStr = `${col.name} ${col.type}`;
                if (col.size) colStr += `(${col.size})`;
                if (col.pk) colStr += ' PK';
                if (col.check) colStr += ` CHECK(${col.check})`;
                return colStr;
            }).join('\n');
            nodes.add({ id: tableName, label: `${tableName}\n${columns}` });
        }
    }

    relationships.forEach(rel => {
        edges.add({
            from: rel.table1,
            to: rel.table2,
            label: `${rel.name} (${rel.type})`
        });
    });

    populateTableDropdown();
}