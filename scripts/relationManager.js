let currentRelation = null;
let existingRelations = new Set();

function initRelationManager() {
    populateRelationSelect();
    // Remover listener anterior si existe
    const select = document.getElementById('relationSelect');
    select.removeEventListener('change', loadRelationData);
    // Añadir nuevo listener
    select.addEventListener('change', () => {
        const relationName = select.value;
        if (relationName) {
            loadRelationData();
        } else {
            // Limpiar las tablas si no hay relación seleccionada
            document.getElementById('table1Data').innerHTML = '';
            document.getElementById('table2Data').innerHTML = '';
            document.querySelector('.table1-container h3').textContent = 'Tabla 1';
            document.querySelector('.table2-container h3').textContent = 'Tabla 2';
        }
    });
}

function populateRelationSelect() {
    const select = document.getElementById('relationSelect');
    select.innerHTML = '<option value="">Selecciona una relación</option>';
    
    for (const tableName in schema.tables) {
        if (schema.tables[tableName].isRelationship) {
            const option = document.createElement('option');
            option.value = tableName;
            option.textContent = tableName;
            select.appendChild(option);
        }
    }
}

function loadRelationData() {
    const relationName = document.getElementById('relationSelect').value;
    if (!relationName) return;

    currentRelation = schema.tables[relationName];
    existingRelations.clear();

    const table1Name = currentRelation.references.table1.name;
    const table2Name = currentRelation.references.table2.name;

    // Update titles with table names
    document.querySelector('.table1-container h3').textContent = table1Name;
    document.querySelector('.table2-container h3').textContent = table2Name;

    try {
        // Primero asegurarse de que las tablas existen
        if (!alasql.tables[table1Name] || !alasql.tables[table2Name]) {
            console.warn('Tables not ready yet');
            return;
        }

        // Cargar las relaciones existentes
        const field1 = `${table1Name.toLowerCase()}_${currentRelation.references.table1.field.toLowerCase()}`;
        const field2 = `${table2Name.toLowerCase()}_${currentRelation.references.table2.field.toLowerCase()}`;
        
        try {
            const relations = alasql(`SELECT ${field1} as id1, ${field2} as id2 FROM ${relationName}`);
            relations.forEach(rel => {
                existingRelations.add(`${rel.id1}-${rel.id2}`);
            });
        } catch (e) {
            console.warn('No existing relations found:', e);
        }

        // Consultar datos de la tabla 1
        const table1Data = alasql(`SELECT * FROM ${table1Name}`);
        const table1Container = document.getElementById('table1Data');
        
        if (table1Data.length === 0) {
            table1Container.innerHTML = `<p>No hay datos en la tabla ${table1Name}</p>`;
            return;
        }

        // Crear tabla 1
        let table1HTML = '<table class="data-table"><thead><tr>';
        // Añadir headers
        Object.keys(table1Data[0]).forEach(key => {
            table1HTML += `<th>${key}</th>`;
        });
        table1HTML += '<th>Seleccionar</th></tr></thead><tbody>';

        // Añadir filas
        table1Data.forEach(row => {
            table1HTML += '<tr>';
            Object.values(row).forEach(value => {
                table1HTML += `<td>${value}</td>`;
            });
            table1HTML += `<td><input type="radio" name="table1" value="${row[currentRelation.references.table1.field]}"></td>`;
            table1HTML += '</tr>';
        });
        table1HTML += '</tbody></table>';
        table1Container.innerHTML = table1HTML;

        // Consultar datos de la tabla 2
        const table2Data = alasql(`SELECT * FROM ${table2Name}`);
        const table2Container = document.getElementById('table2Data');

        if (table2Data.length === 0) {
            table2Container.innerHTML = `<p>No hay datos en la tabla ${table2Name}</p>`;
            return;
        }

        // Crear tabla 2
        let table2HTML = '<table class="data-table"><thead><tr>';
        // Añadir headers
        Object.keys(table2Data[0]).forEach(key => {
            table2HTML += `<th>${key}</th>`;
        });
        table2HTML += '<th>Seleccionar</th></tr></thead><tbody>';

        // Añadir filas
        table2Data.forEach(row => {
            const isRelated = existingRelations.has(`${table1Data[0][currentRelation.references.table1.field]}-${row[currentRelation.references.table2.field]}`);
            table2HTML += '<tr>';
            Object.values(row).forEach(value => {
                table2HTML += `<td>${value}</td>`;
            });
            table2HTML += `<td><input type="checkbox" name="table2" value="${row[currentRelation.references.table2.field]}" ${isRelated ? 'checked' : ''}></td>`;
            table2HTML += '</tr>';
        });
        table2HTML += '</tbody></table>';
        table2Container.innerHTML = table2HTML;

        // Añadir listeners y seleccionar primer radio
        document.querySelectorAll('input[name="table1"]').forEach(radio => {
            radio.addEventListener('change', updateTable2Checkboxes);
        });

        // Seleccionar el primer radio por defecto
        const firstRadio = document.querySelector('input[name="table1"]');
        if (firstRadio) {
            firstRadio.checked = true;
            updateTable2Checkboxes();
        }

    } catch (e) {
        console.error('Error loading table data:', e);
        showNotification('Error al cargar los datos de las tablas: ' + e.message, 'error');
    }
}

function updateTable2Checkboxes() {
    const selectedId1 = document.querySelector('input[name="table1"]:checked').value;
    document.querySelectorAll('input[name="table2"]').forEach(checkbox => {
        const id2 = checkbox.value;
        checkbox.checked = existingRelations.has(`${selectedId1}-${id2}`);
    });
}

function saveRelationInstances() {
    const relationName = document.getElementById('relationSelect').value;
    if (!relationName || !currentRelation) return;

    const selectedId1 = document.querySelector('input[name="table1"]:checked')?.value;
    if (!selectedId1) {
        alert('Selecciona un elemento de la primera tabla');
        return;
    }

    const selectedIds2 = Array.from(document.querySelectorAll('input[name="table2"]:checked')).map(cb => cb.value);
    
    try {
        // Delete existing relations for the selected id1
        alasql(`DELETE FROM ${relationName} WHERE ${currentRelation.references.table1.name.toLowerCase()}_${currentRelation.references.table1.field.toLowerCase()} = ?`, [selectedId1]);

        // Insert new relations
        selectedIds2.forEach(id2 => {
            const sql = `INSERT INTO ${relationName} (
                ${currentRelation.references.table1.name.toLowerCase()}_${currentRelation.references.table1.field.toLowerCase()},
                ${currentRelation.references.table2.name.toLowerCase()}_${currentRelation.references.table2.field.toLowerCase()}
            ) VALUES (?, ?)`;
            alasql(sql, [selectedId1, id2]);
            existingRelations.add(`${selectedId1}-${id2}`);
        });

        showNotification('Relaciones guardadas correctamente', 'success');
    } catch (e) {
        showNotification('Error al guardar las relaciones: ' + e.message, 'error');
    }
}

// Añadir esta función para asegurarse de que las relaciones se cargan después de las inserciones
function loadRelationsAfterInsertions() {
    refreshRelationManager();
}

// Update on tab show and after any data changes
function refreshRelationManager() {
    if (document.getElementById('relationManager').classList.contains('active')) {
        const relationSelect = document.getElementById('relationSelect');
        if (relationSelect.value) {
            loadRelationData();
        } else {
            populateRelationSelect();
        }
    }
}

// Initialize listeners
document.querySelector('button[onclick="showTab(\'relationManager\')"]')
    .addEventListener('click', () => {
        initRelationManager();
        refreshRelationManager();
    });

// Add refresh trigger to relevant events
document.addEventListener('dataChanged', () => {
    // Esperar a que alasql termine de procesar las operaciones
    setTimeout(() => {
        if (document.getElementById('relationManager').classList.contains('active')) {
            const relationSelect = document.getElementById('relationSelect');
            populateRelationSelect(); // Actualizar la lista de relaciones
            if (relationSelect.value) {
                loadRelationData();
            }
        }
    }, 200); // Un poco más de tiempo para asegurar que todo está listo
});
