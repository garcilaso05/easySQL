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
function downloadSQL() {
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
        if (!table.isEnum) {
            sqlContent += `-- TABLE: ${tableName}\n`;
            const columns = table.columns.map(col => {
                let colDef = `${col.name} ${col.type}`;
                if (col.pk) colDef += ' PRIMARY KEY';
                if (schema.tables[col.type]?.isEnum) {
                    const enumValues = schema.tables[col.type].values.map(v => `'${v}'`).join(', ');
                    colDef += ` CHECK(${col.name} IS NULL OR ${col.name} IN (${enumValues}))`;
                } else if (col.check && typeof col.check === 'object') {
                    const enumValues = col.check.values.map(v => `'${v}'`).join(', ');
                    colDef += ` CHECK(${col.name} IS NULL OR ${col.name} IN (${enumValues}))`;
                }
                return colDef;
            }).join(',\n  ');
            sqlContent += `CREATE TABLE ${tableName} (\n  ${columns}\n);\n\n`;
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
    a.download = 'schema.sql';
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

            // Separar el contenido en bloques
            const blocks = content.split('\n\n').filter(block => block.trim());
            
            // Primer paso: procesar los ENUMs y crear los tipos
            blocks.forEach(block => {
                if (block.includes('CREATE TYPE') && block.includes('AS ENUM')) {
                    processEnum(block);
                    // También ejecutar la creación del enum en alasql
                    try {
                        alasql(block);
                    } catch (e) {
                        console.warn('Error al crear enum en alasql:', e);
                    }
                }
            });

            // Segundo paso: procesar y crear las tablas
            blocks.forEach(block => {
                if (block.includes('CREATE TABLE')) {
                    processTable(block);
                    // También ejecutar la creación de la tabla en alasql
                    try {
                        alasql(block);
                    } catch (e) {
                        console.warn('Error al crear tabla en alasql:', e);
                    }
                }
            });

            // Procesar las relaciones
            blocks.forEach(block => {
                if (block.includes('-- RELATIONSHIPS')) {
                    const lines = block.split('\n');
                    lines.forEach(line => {
                        if (line.startsWith('-- ') && !line.startsWith('-- RELATIONSHIPS')) {
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
                    });
                }
            });

            updateClassMap();
            populateTableDropdown();
            populateEnumDropdown();
            
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
        }
    }
}

function processTable(sql) {
    const match = sql.match(/CREATE TABLE (\w+)\s*\(([\s\S]+)\)/i);
    if (match) {
        const tableName = match[1];
        // Limpiar la definición de la tabla y remover cualquier paréntesis extra
        let columnsPart = match[2].replace(/\)\s*$/g, '').trim();
        
        // Separar las columnas correctamente, teniendo en cuenta los CHECK
        const columnDefinitions = [];
        let currentColumn = '';
        let inCheck = false;
        let parenCount = 0;

        for (let char of columnsPart) {
            if (char === '(' && !inCheck) {
                inCheck = true;
                parenCount++;
            } else if (char === '(') {
                parenCount++;
            } else if (char === ')') {
                parenCount--;
                if (parenCount === 0) inCheck = false;
            }

            if (char === ',' && !inCheck && parenCount === 0) {
                if (currentColumn.trim()) columnDefinitions.push(currentColumn.trim());
                currentColumn = '';
            } else {
                currentColumn += char;
            }
        }
        if (currentColumn.trim()) columnDefinitions.push(currentColumn.trim());

        const columns = columnDefinitions.map(def => {
            const parts = def.split(/\s+/);
            const name = parts[0];
            const type = parts[1];
            const pk = def.toLowerCase().includes('primary key');
            
            // Verificar si el tipo es un ENUM conocido
            const isEnum = schema.tables[type]?.isEnum;
            if (isEnum) {
                return {
                    name,
                    type,
                    pk,
                    check: {
                        type: type,
                        values: schema.tables[type].values
                    }
                };
            }
            
            return {
                name,
                type,
                pk
            };
        });

        if (columns.length > 0) {
            schema.tables[tableName] = {
                columns: columns,
                data: []
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

function saveRelationship() {
    const name = document.getElementById('relationshipName').value.trim();
    const table1 = document.getElementById('relationshipTable1').value;
    const table2 = document.getElementById('relationshipTable2').value;
    const type = document.getElementById('relationshipType').value;
    const direction = document.getElementById('relationshipDirection').value;

    if (!name || !table1 || !table2 || !type || !direction) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    relationships.push({ name, table1, table2, type, direction });
    updateClassMap();
    closeRelationshipModal();
    alert(`Relación "${name}" creada exitosamente.`);
}

populateEnumDropdown();
cargarTablaOAVD();
