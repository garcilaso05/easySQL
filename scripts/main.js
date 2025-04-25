// Esquema para almacenar las tablas
const schema = {
    tables: {} // { nombreTabla: { columns: [], data: [] } }
};

const relationships = []; // { name: string, table1: string, table2: string, type: string, direction: string }

let nodes;
let edges;
let network;


window.addEventListener("load", () => {
    const container = document.getElementById('network');
    nodes = new vis.DataSet([]);
    edges = new vis.DataSet([]);
    const data = { nodes: nodes, edges: edges };
    const options = { 
        nodes: { shape: 'box', font: { size: 12 }, widthConstraint: { maximum: 200 } },
        edges: { arrows: 'to' }
    };
    network = new vis.Network(container, data, options);
    updatePredefinedEnums();
});

window.addEventListener("resize", () => {
    if (network) {
        network.redraw(); // Adjust table map size dynamically
    }
});

function cargarTablaOAVD() {
    alasql(`
      DROP TABLE IF EXISTS OAVD;
      CREATE TABLE OAVD (ID INT, Ciudad STRING);
      INSERT INTO OAVD VALUES 
        (1, 'Barcelona'),
        (2, 'Madrid'),
        (3, 'Valencia'),
        (4, 'Sevilla'),
        (5, 'Zaragoza'),
        (6, 'Málaga'),
        (7, 'Granada'),
        (8, 'Valladolid'),
        (9, 'Oviedo'),
        (10, 'Pamplona'),
        (11, 'Bilbao'),
        (12, 'San Sebastián'),
        (13, 'Vitoria-Gasteiz'),
        (14, 'Lleida'),
        (15, 'Tarragona'),
        (16, 'Murcia'),
        (17, 'Cartagena'),
        (18, 'Santa Cruz de Tenerife'),
        (19, 'Las Palmas'),
        (20, 'Ibiza'),
        (21, 'Mallorca'),
        (22, 'Menorca'),
        (23, 'Ceuta'),
        (24, 'Melilla');
    `);
  }
  
// Actualizar el mapa de clases
// Parte gráfica y visual de las tablas en SQL (no es necesario entenderlo)
function updateClassMap() {
    if (!nodes || !edges) return; // Asegura que estén inicializados
    nodes.clear(); // Borramos todos los nodos (tablas)
    edges.clear(); // Borramos todas las aristas (conexiones)
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
        let arrow;
        switch(rel.direction) {
            case 'bidirectional':
                arrow = ''; // Sin flechas para bidireccional
                break;
            case 'forward':
                arrow = 'to';
                break;
            case 'backward':
                arrow = 'from';
                break;
        }
        edges.add({
            from: rel.table1,
            to: rel.table2,
            label: `${rel.name} (${rel.type})`,
            arrows: arrow
        });
    });
    populateTableDropdown();
    populateEnumDropdown();
    updateTableSelect(); // Añadir esta línea
}

// Ejecutar consultas SQL manuales
function executeSQL() {
    const query = document.getElementById('sql-input').value.trim();
    const resultDiv = document.getElementById('result');
    try {
        const insertMatch = query.match(/INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
        if (insertMatch) {
            const tableName = insertMatch[1];
            const columns = insertMatch[2].split(',').map(col => col.trim());
            const values = insertMatch[3].split(',').map(val => val.trim().replace(/['"]/g, ''));

            if (schema.tables[tableName]) {
                const table = schema.tables[tableName];
                for (let i = 0; i < columns.length; i++) {
                    const column = table.columns.find(col => col.name === columns[i]);
                    if (column && schema.tables[column.type]?.isEnum) {
                        const enumValues = schema.tables[column.type].values;
                        if (!enumValues.includes(values[i])) {
                            throw new Error(`El valor "${values[i]}" no es válido para el enum "${column.type}". Valores válidos: ${enumValues.join(', ')}`);
                        }
                    }
                }
            }
        }

        const res = alasql(query);
        resultDiv.innerText = JSON.stringify(res, null, 2);
        updateClassMap();
    } catch (e) {
        resultDiv.innerText = 'Error: ' + e.message;
    }
}

// Descargar el SQL generado
// Generar archivo .sql con el esquema de la base de datos
async function downloadSQL() {
    // Verificar si hay tablas
    if (Object.keys(schema.tables).length === 0) {
        showNotification('No hay tablas para exportar. Cree al menos una tabla antes de descargar.', 'error');
        return;
    }

    // Pedir nombre del archivo usando el nuevo diálogo
    const fileName = await showInputDialog(
        'Guardar esquema SQL',
        'Nombre del archivo',
        'schema'
    );
    if (!fileName) return;

    let sqlContent = '';
    
    // Primero los ENUMs
    for (const tableName in schema.tables) {
        const table = schema.tables[tableName];
        if (table.isEnum) {
            sqlContent += `-- ENUM: ${tableName}\n`;
            sqlContent += `CREATE TYPE ${tableName} AS ENUM (${table.values.map(v => `'${v}'`).join(', ')});\n\n`;
        }
    }

    // Luego las tablas
    for (const tableName in schema.tables) {
        const table = schema.tables[tableName];
        if (!table.isEnum && !table.isRelationship) {
            sqlContent += `-- TABLE: ${tableName}\n`;
            const columns = table.columns.map(col => {
                let colDef = `${col.name} ${col.type}`;
                
                // Añadir PRIMARY KEY si corresponde (siempre incluye NOT NULL implícitamente)
                if (col.pk) {
                    colDef += ' PRIMARY KEY';
                }
                // Añadir NOT NULL explícito si no es PK pero es obligatorio
                else if (col.notNull) {
                    colDef += ' NOT NULL';
                }
                
                // Manejar ENUMs
                if (schema.tables[col.type]?.isEnum) {
                    const enumValues = schema.tables[col.type].values.map(v => `'${v}'`).join(', ');
                    // Si es NOT NULL o PK, no incluir la opción IS NULL y añadir NOT NULL explícitamente
                    if (col.notNull || col.pk) {
                        colDef += ` CHECK(${col.name} IN (${enumValues})) NOT NULL`;
                    } else if (schema.tables[col.type]?.isEnum) {
                        colDef += ` CHECK(${col.name} IS NULL OR ${col.name} IN (${enumValues}))`;
                    }
                }
                
                return colDef;
            }).join(',\n  ');
            sqlContent += `CREATE TABLE ${tableName} (\n  ${columns}\n);\n\n`;
        } else if (table.isRelationship) {
            sqlContent += `-- RELATIONSHIP TABLE: ${tableName}\n`;
            sqlContent += `CREATE TABLE ${tableName} (\n`;
            const columns = table.columns.map(col => {
                let def = `  ${col.name} ${col.type}`;
                return def;
            }).join(',\n');
            sqlContent += `${columns},\n`;
            sqlContent += `  PRIMARY KEY (${table.columns.map(c => c.name).join(', ')}),\n`;
            sqlContent += `  FOREIGN KEY (${table.columns[0].name}) REFERENCES ${table.references.table1.name}(${table.references.table1.field}) ON DELETE CASCADE,\n`;
            sqlContent += `  FOREIGN KEY (${table.columns[1].name}) REFERENCES ${table.references.table2.name}(${table.references.table2.field}) ON DELETE CASCADE\n`;
            sqlContent += `);\n\n`;
        }
    }

    // Finalmente las relaciones
    if (relationships.length > 0) {
        sqlContent += '-- RELATIONSHIPS\n';
        relationships.forEach(rel => {
            sqlContent += `-- ${rel.name}: ${rel.table1} ${rel.type} ${rel.table2} (${rel.direction})\n`;
        });
    }

    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.trim()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
}

async function downloadInsertions() {
    // Verificar si hay datos para exportar
    let hasData = false;
    for (const tableName in schema.tables) {
        if (!schema.tables[tableName].isEnum) {
            try {
                const data = alasql(`SELECT * FROM ${tableName}`);
                if (data.length > 0) {
                    hasData = true;
                    break;
                }
            } catch (error) {
                console.error(`Error al verificar datos en tabla ${tableName}:`, error);
            }
        }
    }

    if (!hasData) {
        showNotification('No hay datos insertados para exportar. Inserte datos en al menos una tabla antes de descargar.', 'error');
        return;
    }

    // Pedir nombre del archivo usando el nuevo diálogo
    const fileName = await showInputDialog(
        'Guardar archivo de inserciones',
        'Nombre del archivo',
        'inserciones'
    );
    if (!fileName) return;

    let insertionsSQL = '';
    // Aquí se puede agregar lógica para generar las inserciones SQL

    const blob = new Blob([insertionsSQL], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.trim()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
}

function loadSQL(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            
            // Limpiar estado actual
            schema.tables = {};
            relationships.length = 0;
            
            // Limpiar todas las tablas existentes en alasql
            const tables = alasql('SHOW TABLES');
            tables.forEach(table => {
                try {
                    alasql(`DROP TABLE IF EXISTS ${table.tableName}`);
                } catch (e) {
                    console.warn(`Error al borrar tabla ${table.tableName}:`, e);
                }
            });

            // Separar el contenido en bloques y mantener comentarios
            const blocks = content.split('\n\n').map(block => block.trim()).filter(block => block);
            
            // Primer paso: procesar los ENUMs
            blocks.forEach(block => {
                if (block.includes('CREATE TYPE') && block.includes('AS ENUM')) {
                    processEnum(block);
                    try { alasql(block); } catch (e) { console.warn('Error al crear enum:', e); }
                }
            });

            // Segundo paso: procesar todas las tablas (normales y relaciones)
            let previousComment = '';
            blocks.forEach(block => {
                const lines = block.split('\n');
                // Capturar el comentario si existe
                if (lines[0].trim().startsWith('--')) {
                    previousComment = lines[0].trim();
                }
                
                if (block.includes('CREATE TABLE')) {
                    const isRelationship = previousComment.includes('-- RELATIONSHIP TABLE:');
                    processTable(block, isRelationship);
                    try { alasql(block); } catch (e) { console.warn('Error al crear tabla:', e); }
                }
            });

            // Procesar las relaciones visuales
            blocks.forEach(block => {
                if (block.includes('-- RELATIONSHIPS')) {
                    const lines = block.split('\n');
                    lines.forEach(line => {
                        if (line.startsWith('-- ') && !line.startsWith('-- RELATIONSHIPS')) {
                            processRelationship(line);
                        }
                    });
                }
            });

            updateClassMap();
            populateTableDropdown();
            populateEnumDropdown();
            updateRelationshipDropdown(); // Asegurar que se actualice el desplegable de relaciones
            
            alert('SQL cargado exitosamente');
            event.target.value = '';
            
        } catch (error) {
            alert('Error al cargar el archivo: ' + error.message);
            console.error(error);
        }
    };
    reader.readAsText(file);
}

function processEnum(sql) {
    const match = sql.match(/CREATE TYPE (\w+) AS ENUM \((.*)\)/i);
    if (match) {
        const enumName = match[1];
        // Procesar valores manteniendo las comitas y separando correctamente
        const valuesString = match[2];
        const values = valuesString.split(',')
            .map(v => v.trim().replace(/^'|'$/g, ''))
            .filter(v => v);

        if (values.length > 0) {
            schema.tables[enumName] = {
                isEnum: true,
                values: values
            };
            checkForPredefinedEnumMatch(enumName);
        }
    }
}

function processTable(sql, isRelationship = false) {
    const match = sql.match(/CREATE TABLE (\w+)\s*\(([\s\S]*?)\)/i);
    if (match) {
        const tableName = match[1];
        const columnsString = match[2];
        let currentColumn = '';
        const columnDefinitions = [];
        const foreignKeys = [];

        // Procesar cada línea
        columnsString.split('\n').forEach(line => {
            line = line.trim();
            if (!line) return;

            if (line.endsWith(',')) {
                line = line.slice(0, -1);
            }

            // Capturar FOREIGN KEYs
            if (line.toUpperCase().startsWith('FOREIGN KEY')) {
                foreignKeys.push(line);
                columnDefinitions.push(line);
            } else if (line.toUpperCase().startsWith('PRIMARY KEY')) {
                columnDefinitions.push(line);
            } else if (currentColumn) {
                currentColumn += ' ' + line;
                if (!line.endsWith(',')) {
                    columnDefinitions.push(currentColumn.trim());
                    currentColumn = '';
                }
            } else {
                currentColumn = line;
                if (!line.endsWith(',')) {
                    columnDefinitions.push(currentColumn.trim());
                    currentColumn = '';
                }
            }
        });
        if (currentColumn.trim()) columnDefinitions.push(currentColumn.trim());

        const columns = columnDefinitions.map(def => {
            const parts = def.split(/\s+/);
            const name = parts[0];
            const type = parts[1];
            const pk = def.toLowerCase().includes('primary key');
            const notNull = !pk && def.toLowerCase().includes('not null');
            return {
                name,
                type,
                pk,
                notNull: pk || notNull
            };
        }).filter(col => col.name && col.type); // Filtrar constraints

        // Procesar foreign keys para detectar referencias
        const references = {};
        foreignKeys.forEach(fk => {
            const fkMatch = fk.match(/FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s*([^(]+)\(([^)]+)\)/i);
            if (fkMatch) {
                const localColumn = fkMatch[1].trim();
                const refTable = fkMatch[2].trim();
                const refColumn = fkMatch[3].trim();
                references[localColumn] = { table: refTable, column: refColumn };
            }
        });

        // Detectar si es una tabla de relación
        const hasMultipleFKs = foreignKeys.length >= 2;
        
        schema.tables[tableName] = {
            columns: columns,
            isRelationship: isRelationship || hasMultipleFKs,
            data: []
        };

        // Si es una relación, añadir información de referencias
        if ((isRelationship || hasMultipleFKs) && Object.keys(references).length >= 2) {
            const refs = Object.entries(references);
            schema.tables[tableName].references = {
                table1: { name: refs[0][1].table, field: refs[0][1].column },
                table2: { name: refs[1][1].table, field: refs[1][1].column }
            };
        }
    }
}

function processRelationship(line) {
    const match = line.match(/-- (.*): (.*) (.*) (.*) \((.*)\)/);
    if (match) {
        relationships.push({
            name: match[1],
            table1: match[2],
            type: match[3],
            table2: match[4],
            direction: match[5]
        });
    }
}

function populateTableDropdown() {
    const tableDropdown = document.getElementById('tableDropdown');
    tableDropdown.innerHTML = '';
    for (const tableName in schema.tables) {
        const table = schema.tables[tableName];
        if (!table.isEnum) { // Exclude enums
            const option = document.createElement('option');
            option.value = tableName;
            option.text = tableName;
            tableDropdown.appendChild(option);
        }
    }
}

function populateEnumDropdown() {
    const enumDropdown = document.getElementById('enumDropdown');
    enumDropdown.innerHTML = '';
    for (const tableName in schema.tables) {
        const table = schema.tables[tableName];
        if (table.isEnum) { // Include only enums
            const option = document.createElement('option');
            option.value = tableName;
            option.text = tableName;
            enumDropdown.appendChild(option);
        }
    }
}

function openRelationshipModal() {
    const tableDropdown1 = document.getElementById('relationshipTable1');
    const tableDropdown2 = document.getElementById('relationshipTable2');
    tableDropdown1.innerHTML = '';
    tableDropdown2.innerHTML = '';

    for (const tableName in schema.tables) {
        const option1 = document.createElement('option');
        const option2 = document.createElement('option');
        option1.value = tableName;
        option1.text = tableName;
        option2.value = tableName;
        option2.text = tableName;
        tableDropdown1.appendChild(option1);
        tableDropdown2.appendChild(option2);
    }

    document.getElementById('relationshipModal').style.display = 'block';
}

function closeRelationshipModal() {
    document.getElementById('relationshipModal').style.display = 'none';
}

function updateRelationshipDropdown() {
    const dropdown = document.getElementById('relationshipDropdown');
    dropdown.innerHTML = '<option value="">Selecciona una relación</option>';
    
    for (const tableName in schema.tables) {
        if (schema.tables[tableName].isRelationship) {
            const option = document.createElement('option');
            option.value = tableName;
            option.textContent = tableName;
            dropdown.appendChild(option);
        }
    }
}

function updateRelationshipFields() {
    const table1 = document.getElementById('relationshipTable1').value;
    const table2 = document.getElementById('relationshipTable2').value;
    const field1 = document.getElementById('relationshipField1');
    const field2 = document.getElementById('relationshipField2');
    
    field1.innerHTML = '<option value="">Selecciona campo</option>';
    field2.innerHTML = '<option value="">Selecciona campo</option>';
    
    if (table1) {
        const pkColumn1 = schema.tables[table1].columns.find(col => col.pk);
        if (pkColumn1) {
            field1.innerHTML = `<option value="${pkColumn1.name}">${pkColumn1.name}</option>`;
        }
        field1.disabled = !table1;
    }
    
    if (table2) {
        const pkColumn2 = schema.tables[table2].columns.find(col => col.pk);
        if (pkColumn2) {
            field2.innerHTML = `<option value="${pkColumn2.name}">${pkColumn2.name}</option>`;
        }
        field2.disabled = !table2;
    }
}

function saveRelationship() {
    const name = document.getElementById('relationshipName').value.trim().toLowerCase();
    const table1 = document.getElementById('relationshipTable1').value;
    const table2 = document.getElementById('relationshipTable2').value;
    const field1 = document.getElementById('relationshipField1').value;
    const field2 = document.getElementById('relationshipField2').value;

    if (!name || !table1 || !table2 || !field1 || !field2) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    if (schema.tables[name]) {
        alert('Ya existe una tabla o relación con ese nombre.');
        return;
    }

    // Usar sintaxis básica sin foreign keys explícitas (AlaSQL las manejará implícitamente)
    const createTableSQL = `CREATE TABLE ${name} (
        ${table1.toLowerCase()}_${field1.toLowerCase()} ${schema.tables[table1].columns.find(col => col.pk).type},
        ${table2.toLowerCase()}_${field2.toLowerCase()} ${schema.tables[table2].columns.find(col => col.pk).type},
        PRIMARY KEY (${table1.toLowerCase()}_${field1.toLowerCase()}, ${table2.toLowerCase()}_${field2.toLowerCase()})
    )`;

    try {
        console.log('SQL a ejecutar:', createTableSQL);
        alasql(createTableSQL);

        schema.tables[name] = {
            isRelationship: true,
            columns: [
                {
                    name: `${table1.toLowerCase()}_${field1.toLowerCase()}`,
                    type: schema.tables[table1].columns.find(col => col.pk).type,
                    pk: true
                },
                {
                    name: `${table2.toLowerCase()}_${field2.toLowerCase()}`,
                    type: schema.tables[table2].columns.find(col => col.pk).type,
                    pk: true
                }
            ],
            references: {
                table1: { name: table1, field: field1 },
                table2: { name: table2, field: field2 }
            }
        };

        updateClassMap();
        updateRelationshipDropdown();
        closeRelationshipModal();
        showNotification(`Relación "${name}" creada exitosamente.`, 'success');
    } catch (error) {
        showNotification(`Error al crear la relación: ${error.message}`, 'error');
        console.error('Error en SQL:', error);
    }
}

function deleteRelationship() {
    const relationshipName = document.getElementById('relationshipDropdown').value;
    if (!relationshipName) {
        showNotification('Por favor, selecciona una relación para borrar.', 'warning');
        return;
    }

    if (!schema.tables[relationshipName]?.isRelationship) {
        showNotification('La tabla seleccionada no es una relación.', 'error');
        return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar la relación "${relationshipName}"?`)) {
        alasql(`DROP TABLE ${relationshipName}`);
        delete schema.tables[relationshipName];
        updateClassMap();
        updateRelationshipDropdown();
        showNotification(`Relación "${relationshipName}" eliminada exitosamente.`, 'success');
    }
}

function updatePredefinedEnums() {
    const container = document.getElementById('predefinedEnumsList');
    const enums = getAvailablePredefinedEnums();
    
    container.innerHTML = enums.map(enumItem => `
        <div class="predefined-enum-item">
            <div class="predefined-enum-info">
                <div class="predefined-enum-name">${enumItem.name}</div>
                <div class="predefined-enum-description">${enumItem.description}</div>
            </div>
            <div class="predefined-enum-action">
                <button onclick="togglePredefinedEnum('${enumItem.name}')" 
                        class="${enumItem.isImported ? 'remove' : 'add'}">
                    ${enumItem.isImported ? '🗑 Quitar' : '➕ Importar'}
                </button>
            </div>
        </div>
    `).join('');
}

async function togglePredefinedEnum(enumName) {
    try {
        if (schema.tables[enumName]) {
            // Intentar eliminar
            await removePredefinedEnum(enumName);
            showNotification(`Enum "${enumName}" eliminado correctamente`, 'success');
        } else {
            // Intentar importar
            importPredefinedEnum(enumName);
            showNotification(`Enum "${enumName}" importado correctamente`, 'success');
        }
        updatePredefinedEnums();
        updateClassMap();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

populateEnumDropdown();
cargarTablaOAVD();
