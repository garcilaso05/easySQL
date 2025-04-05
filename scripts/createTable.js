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
        <label><input type="checkbox" class="col-pk"> Clave Primaria</label>
        <button onclick="removeColumnInput(this)">Eliminar</button>
    `;
    container.appendChild(newInput);

    // Hacer el contenedor de columnas desplazable
    container.style.maxHeight = '300px';
    container.style.overflowY = 'auto';
}

function removeColumnInput(button) {
    const container = document.getElementById('columnsContainer');
    container.removeChild(button.parentElement);
}

function createTableFromForm() {
    const tableName = document.getElementById('tableName').value.trim();
    if (!tableName) {
        alert('Por favor, ingresa un nombre para la tabla.');
        return;
    }

    const columns = [];
    const columnInputs = document.querySelectorAll('.column-input');
    columnInputs.forEach(input => {
        const name = input.querySelector('.col-name').value.trim();
        const type = input.querySelector('.col-type').value;
        const pk = input.querySelector('.col-pk').checked;

        if (name) {
            let colDef = `${name} ${type}`;
            if (schema.tables[type]?.isEnum) {
                const enumValues = schema.tables[type].values.map(val => `'${val}'`).join(', ');
                colDef += ` CHECK(${name} IN (${enumValues}))`;
            }
            if (pk) colDef += ' PRIMARY KEY';
            columns.push({
                name,
                type,
                pk
            });
        }
    });

    if (columns.length === 0) {
        alert('Por favor, añade al menos un elemento.');
        return;
    }

    const query = `CREATE TABLE ${tableName} (${columns.map(col => {
        let colDef = `${col.name} ${col.type}`;
        if (schema.tables[col.type]?.isEnum) {
            const enumValues = schema.tables[col.type].values.map(val => `'${val}'`).join(', ');
            colDef += ` CHECK(${col.name} IN (${enumValues}))`;
        }
        if (col.pk) colDef += ' PRIMARY KEY';
        return colDef;
    }).join(', ')})`;

    try {
        alasql(query);
        schema.tables[tableName] = {
            columns,
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