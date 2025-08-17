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

// Ejecutar consultas SQL manuales (ahora desde la IA)
function executeGeneratedSQL() {
    const query = document.getElementById('generatedSql').value.trim();
    const resultDiv = document.getElementById('sqlResult');
    if (!query) {
        resultDiv.innerText = 'No hay consulta para ejecutar.';
        return;
    }
    try {
        const res = alasql(query);
        
        // Formatear la salida
        if (Array.isArray(res)) {
            const formattedResult = res.map(record => {
                // Convertir cada registro a JSON y quitar las llaves
                return JSON.stringify(record, null, 2)
                    .replace(/^{\n/, '')
                    .replace(/\n}$/, '')
                    .trim();
            }).join('\n\n'); // Separar registros con doble salto de línea
            resultDiv.innerText = formattedResult;
        } else {
            resultDiv.innerText = JSON.stringify(res, null, 2);
        }

        // Si es una inserción, actualización o borrado, puede que queramos actualizar otras vistas
        if (query.toUpperCase().startsWith('INSERT') || query.toUpperCase().startsWith('UPDATE') || query.toUpperCase().startsWith('DELETE')) {
            updateClassMap(); // Actualiza el mapa por si hay cambios estructurales (aunque es raro aquí)
            // Podríamos llamar a showAllData() si la pestaña de datos está visible, etc.
        }
    } catch (e) {
        resultDiv.innerText = 'Error: ' + e.message;
    }
}

// Generar consulta SQL usando IA
async function generateAIQuery() {
    const apiKey = document.getElementById('apiKey').value;
    const naturalQuery = document.getElementById('naturalQuery').value;
    const generatedSqlTextarea = document.getElementById('generatedSql');
    const resultDiv = document.getElementById('sqlResult');

    if (!apiKey) {
        alert('Por favor, introduce tu API Key de Gemini.');
        return;
    }
    if (!naturalQuery) {
        alert('Por favor, escribe una pregunta.');
        return;
    }

    generatedSqlTextarea.value = 'Generando consulta con IA...';
    resultDiv.innerText = '';

    const schemaDescription = getSchemaForAI();
    const prompt = `Genera una consulta simple en SQL para obtener los datos de esta pregunta: ${naturalQuery}. Las tablas SQL son las siguientes: ${schemaDescription}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 200
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || 'Error desconocido de la API.';
            throw new Error(`Error de la API de IA: ${errorMessage}`);
        }

        const data = await response.json();
        // Limpiar la respuesta para obtener solo el SQL
        let sqlQuery = data.candidates[0]?.content?.parts[0]?.text.trim() || '';
        if (sqlQuery.startsWith('```sql')) {
            sqlQuery = sqlQuery.substring(5, sqlQuery.length - 3).trim();
        } else if (sqlQuery.startsWith('```')) {
            sqlQuery = sqlQuery.substring(3, sqlQuery.length - 3).trim();
        }
        
        // Eliminar la 'l' solitaria en la primera línea si existe
        const lines = sqlQuery.split('\n');
        if (lines.length > 0 && lines[0].trim() === 'l') {
            lines.shift(); // Elimina la primera línea
            sqlQuery = lines.join('\n');
        }

        generatedSqlTextarea.value = sqlQuery;

    } catch (error) {
        generatedSqlTextarea.value = '';
        resultDiv.innerText = `Error al generar la consulta: ${error.message}`;
        console.error(error);
    }
}

function getSchemaForAI() {
    let description = '';
    for (const tableName in schema.tables) {
        const table = schema.tables[tableName];
        if (table.isEnum) {
            description += `CREATE TYPE ${tableName} AS ENUM (${table.values.map(v => `'${v}'`).join(', ')});\n\n`;
        } else {
            const columns = table.columns.map(col => {
                let colDef = `${col.name} ${col.type}`;
                if (col.pk) colDef += ' PRIMARY KEY';
                if (col.notNull && !col.pk) colDef += ' NOT NULL';
                return `  ${colDef}`;
            }).join(',\n');
            description += `CREATE TABLE ${tableName} (\n${columns}\n);\n\n`;
        }
    }
    return description;
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
        if (!table.isEnum) {
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
            checkForPredefinedEnumMatch(enumName);
        }
    }
}

function processTable(sql) {
    const match = sql.match(/CREATE TABLE (\w+)\s*\(([\s\S]+)\)/i);
    if (match) {
        const tableName = match[1];
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
            const notNull = !pk && def.toLowerCase().includes('not null');
            const isEnum = schema.tables[type]?.isEnum;

            // Verificar si es un ENUM sin "IS NULL OR" en el CHECK
            const hasNotNullEnum = isEnum && !def.toLowerCase().includes('is null or');
            
            return {
                name,
                type,
                pk,
                notNull: pk || notNull || hasNotNullEnum,
                check: isEnum ? {
                    type: type,
                    values: schema.tables[type].values
                } : undefined
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

function normalizeInput(input) {
    if (input.startsWith(' ')) {
        input = input.trimStart();
    }
    // Normalizar las entradas para quitar acentos y caracteres especiales
    const normalized = input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
        .replace(/[^a-zA-Z0-9]/g, '_') // Reemplazar caracteres no alfanuméricos con _
        .replace(/_+/g, '_') // Reemplazar múltiples _ con uno solo
        .replace(/^_|_$/g, '') // Eliminar _ al inicio y final
        .toUpperCase();
    return normalized;
}

function setupTableNameInputs() {
    const inputs = document.querySelectorAll('.table-name-input, .col-name');
    inputs.forEach(input => {
        input.addEventListener('input', function(e) {
            const normalized = normalizeInput(this.value);
            this.value = normalized;
        });
    });
}

// Llamar a esta función cuando se cargue la página y cuando se añadan nuevos inputs
document.addEventListener('DOMContentLoaded', () => {
    setupTableNameInputs();
});

// Observador para detectar nuevos campos añadidos
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Es un elemento
                const inputs = node.querySelectorAll('.table-name-input, .col-name');
                inputs.forEach(input => {
                    input.addEventListener('input', function(e) {
                        const normalized = normalizeInput(this.value);
                        this.value = normalized;
                    });
                });
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

populateEnumDropdown();
cargarTablaOAVD();

function handleEsqlUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            
            // Guardar el contenido para uso futuro
            if (!window.customInsertLayouts) {
                window.customInsertLayouts = {};
            }
            const tableName = content.split('\n')[0].substring(1).trim();
            if (tableName) {
                window.customInsertLayouts[tableName] = content;
            }

            applyCustomInsertLayout(content);
        };
        reader.readAsText(file);
        event.target.value = ''; // Limpiar el input para permitir recargar el mismo archivo
    }
}

function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    contents.forEach(content => {
        content.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    document.querySelector(`.tab[onclick="showTab('${tabName}')"]`).classList.add('active');

    // Cargar datos específicos si es necesario
    if (tabName === 'datos') {
        showAllData();
    } else if (tabName === 'mapa') {
        initMap();
    } else if (tabName === 'inserciones') {
        // Reaplicar todos los layouts personalizados al volver a la pestaña
        if (window.customInsertLayouts) {
            for (const tableName in window.customInsertLayouts) {
                applyCustomInsertLayout(window.customInsertLayouts[tableName]);
            }
        }
    }
}

function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Aquí deberías agregar la lógica para autenticar al usuario
    // Por ejemplo, enviar una solicitud a tu servidor para verificar las credenciales

    // Simulación de autenticación exitosa
    if (username === 'admin' && password === 'admin') {
        // Ocultar el formulario de inicio de sesión
        document.getElementById('loginForm').style.display = 'none';
        // Mostrar el contenido protegido
        document.getElementById('protectedContent').style.display = 'block';
        // Cargar datos iniciales o realizar acciones necesarias después del login
        cargarDatosIniciales();
    } else {
        alert('Credenciales inválidas. Inténtalo de nuevo.');
    }
}

function cargarDatosIniciales() {
    // Aquí puedes cargar datos iniciales necesarios para el usuario
    // Por ejemplo, cargar tablas, relaciones, etc.
    alasql(`
        CREATE TABLE IF NOT EXISTS usuarios (id INT, nombre STRING, email STRING);
        INSERT INTO usuarios VALUES (1, 'Juan Pérez', 'juan@example.com');
    `);

    // Actualizar el mapa de clases y otras UI
    updateClassMap();
}

// La función loadInitialCustomLayouts se ha movido a eSQL/custom-insert.js
// para centralizar la lógica de personalización y resolver problemas de CORS.
// Se elimina de este archivo.

populateEnumDropdown();
cargarTablaOAVD();

function handleEsqlUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            
            // Guardar el contenido para uso futuro
            if (!window.customInsertLayouts) {
                window.customInsertLayouts = {};
            }
            const tableName = content.split('\n')[0].substring(1).trim();
            if (tableName) {
                window.customInsertLayouts[tableName] = content;
            }

            applyCustomInsertLayout(content);
        };
        reader.readAsText(file);
        event.target.value = ''; // Limpiar el input para permitir recargar el mismo archivo
    }
}

function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    contents.forEach(content => {
        content.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    document.querySelector(`.tab[onclick="showTab('${tabName}')"]`).classList.add('active');

    // Cargar datos específicos si es necesario
    if (tabName === 'datos') {
        showAllData();
    } else if (tabName === 'mapa') {
        initMap();
    } else if (tabName === 'inserciones') {
        // Reaplicar todos los layouts personalizados al volver a la pestaña
        if (window.customInsertLayouts) {
            for (const tableName in window.customInsertLayouts) {
                applyCustomInsertLayout(window.customInsertLayouts[tableName]);
            }
        }
    }
}

function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Aquí deberías agregar la lógica para autenticar al usuario
    // Por ejemplo, enviar una solicitud a tu servidor para verificar las credenciales

    // Simulación de autenticación exitosa
    if (username === 'admin' && password === 'admin') {
        // Ocultar el formulario de inicio de sesión
        document.getElementById('loginForm').style.display = 'none';
        // Mostrar el contenido protegido
        document.getElementById('protectedContent').style.display = 'block';
        // Cargar datos iniciales o realizar acciones necesarias después del login
        cargarDatosIniciales();
    } else {
        alert('Credenciales inválidas. Inténtalo de nuevo.');
    }
}

function cargarDatosIniciales() {
    // Aquí puedes cargar datos iniciales necesarios para el usuario
    // Por ejemplo, cargar tablas, relaciones, etc.
    alasql(`
        CREATE TABLE IF NOT EXISTS usuarios (id INT, nombre STRING, email STRING);
        INSERT INTO usuarios VALUES (1, 'Juan Pérez', 'juan@example.com');
    `);

    // Actualizar el mapa de clases y otras UI
    updateClassMap();
}
