import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;
let credentials = null;
let schema = [];
let lastSchemaUpdate = null;
const SCHEMA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Load schema from Supabase
 */
async function loadSchemaFromSupabase() {
    const supabase = await initSupabase();
    
    try {
        // Get all tables from information_schema
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_type', 'BASE TABLE');
            
        if (tablesError) {
            console.warn('No se pudo obtener la lista de tablas, usando RPC:', tablesError.message);
            // Fallback: try with RPC function
            const { data: rpcTables, error: rpcError } = await supabase.rpc('get_table_list');
            if (rpcError) {
                throw new Error(`Error obteniendo esquema: ${rpcError.message}`);
            }
            return rpcTables || [];
        }
        
        const schemaPromises = tables.map(async (table) => {
            const tableName = table.table_name;
            
            // Get columns information
            const { data: columns, error: columnsError } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable, column_default')
                .eq('table_schema', 'public')
                .eq('table_name', tableName);
                
            if (columnsError) {
                console.warn(`Error obteniendo columnas para ${tableName}:`, columnsError.message);
                return { name: tableName, columns: [] };
            }
            
            const formattedColumns = columns.map(col => ({
                name: col.column_name,
                type: col.data_type,
                nullable: col.is_nullable === 'YES',
                default: col.column_default
            }));
            
            return {
                name: tableName,
                columns: formattedColumns
            };
        });
        
        const schemaData = await Promise.all(schemaPromises);
        schema = schemaData;
        lastSchemaUpdate = Date.now();
        
        // Update global schema variable if it exists
        if (typeof window !== 'undefined' && window.schema) {
            window.schema = schema;
        }
        
        return schema;
        
    } catch (error) {
        console.error('Error cargando esquema desde Supabase:', error);
        throw error;
    }
}

/**
 * Get current schema, updating if necessary
 */
async function getSchema() {
    const mode = typeof window !== 'undefined' ? window.DB_MODE : 'local';
    
    if (mode === 'online') {
        const now = Date.now();
        const needsUpdate = !lastSchemaUpdate || (now - lastSchemaUpdate) > SCHEMA_CACHE_DURATION;
        
        if (needsUpdate || schema.length === 0) {
            try {
                await loadSchemaFromSupabase();
            } catch (error) {
                console.error('Error actualizando esquema:', error);
                // Return cached schema if available
                if (schema.length > 0) {
                    console.warn('Usando esquema en caché debido a error de actualización');
                }
            }
        }
    }
    
    return schema;
}

/**
 * Load credentials from .easysql file or memory
 */
async function loadCredentialsFromFile() {
    // In browser environment, credentials should be loaded via initSupabaseFromObject
    if (typeof window !== 'undefined') {
        if (credentials) {
            return credentials;
        }
        throw new Error('Credenciales no cargadas. Use initSupabaseFromObject() primero.');
    }
    
    // Node.js environment (if needed)
    try {
        const fs = await import('fs');
        const path = await import('path');
        const configPath = path.join(process.cwd(), '.easysql');
        const configData = await fs.promises.readFile(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        throw new Error(`No se pudo cargar el archivo .easysql: ${error.message}`);
    }
}

/**
 * Initialize Supabase client from credentials object
 */
function initSupabaseFromObject(creds) {
    if (!creds.SUPABASE_URL || !creds.SUPABASE_KEY) {
        throw new Error('Faltan credenciales SUPABASE_URL o SUPABASE_KEY en la configuración');
    }
    
    credentials = creds;
    supabaseClient = createClient(creds.SUPABASE_URL, creds.SUPABASE_KEY);
    return supabaseClient;
}

/**
 * Initialize Supabase client automatically
 */
async function initSupabase() {
    if (!supabaseClient) {
        try {
            const creds = await loadCredentialsFromFile();
            initSupabaseFromObject(creds);
        } catch (error) {
            throw new Error(`Error al inicializar Supabase: ${error.message}`);
        }
    }
    return supabaseClient;
}

/**
 * Parse SQL query to extract operation and table
 */
function parseSQL(sql) {
    const cleanSQL = sql.trim().toLowerCase();
    const words = cleanSQL.split(/\s+/);
    
    const operation = words[0];
    let tableName = null;
    
    switch (operation) {
        case 'select':
            const fromIndex = words.indexOf('from');
            if (fromIndex !== -1 && fromIndex + 1 < words.length) {
                tableName = words[fromIndex + 1];
            }
            break;
        case 'insert':
            const intoIndex = words.indexOf('into');
            if (intoIndex !== -1 && intoIndex + 1 < words.length) {
                tableName = words[intoIndex + 1];
            }
            break;
        case 'update':
            if (words.length > 1) {
                tableName = words[1];
            }
            break;
        case 'delete':
            const fromDeleteIndex = words.indexOf('from');
            if (fromDeleteIndex !== -1 && fromDeleteIndex + 1 < words.length) {
                tableName = words[fromDeleteIndex + 1];
            }
            break;
    }
    
    return { operation, tableName, cleanSQL };
}

/**
 * Execute SELECT query with Supabase
 */
async function executeSelect(sql, params, supabase) {
    const { tableName } = parseSQL(sql);
    
    if (!tableName) {
        throw new Error('No se pudo determinar la tabla en la consulta SELECT');
    }
    
    // Check for complex queries that we can't handle
    const complexPatterns = [
        /join/i,
        /union/i,
        /subquery/i,
        /\(/,
        /group\s+by/i,
        /having/i,
        /window/i,
        /with/i
    ];
    
    if (complexPatterns.some(pattern => pattern.test(sql))) {
        throw new Error('Consulta demasiado compleja para el modo online. Se recomienda usar el modo local.');
    }
    
    let query = supabase.from(tableName).select('*');
    
    // Simple WHERE clause handling
    if (sql.includes('where')) {
        console.warn('Filtros WHERE complejos pueden no estar soportados. Considera usar el modo local para consultas avanzadas.');
    }
    
    const { data, error } = await query;
    
    if (error) {
        throw new Error(`Error en Supabase SELECT: ${error.message}`);
    }
    
    return data;
}

/**
 * Execute INSERT query with Supabase
 */
async function executeInsert(sql, params, supabase) {
    const { tableName } = parseSQL(sql);
    
    if (!tableName) {
        throw new Error('No se pudo determinar la tabla en la consulta INSERT');
    }
    
    // For complex inserts, recommend local mode
    if (sql.includes('select') || sql.includes('values') && sql.match(/values\s*\(/gi)?.length > 1) {
        throw new Error('INSERT complejo detectado. Se recomienda usar el modo local.');
    }
    
    // If params are provided, use them as the data to insert
    if (params && params.length > 0) {
        const { data, error } = await supabase.from(tableName).insert(params[0]);
        
        if (error) {
            throw new Error(`Error en Supabase INSERT: ${error.message}`);
        }
        
        return data;
    }
    
    throw new Error('INSERT sin parámetros no soportado en modo online. Use el modo local.');
}

/**
 * Execute UPDATE query with Supabase
 */
async function executeUpdate(sql, params, supabase) {
    const { tableName } = parseSQL(sql);
    
    if (!tableName) {
        throw new Error('No se pudo determinar la tabla en la consulta UPDATE');
    }
    
    // Complex updates should use local mode
    if (sql.includes('join') || sql.includes('subquery')) {
        throw new Error('UPDATE complejo detectado. Se recomienda usar el modo local.');
    }
    
    throw new Error('UPDATE automático no implementado. Se recomienda usar el modo local o implementar lógica específica.');
}

/**
 * Execute DELETE query with Supabase
 */
async function executeDelete(sql, params, supabase) {
    const { tableName } = parseSQL(sql);
    
    if (!tableName) {
        throw new Error('No se pudo determinar la tabla en la consulta DELETE');
    }
    
    // Complex deletes should use local mode
    if (sql.includes('join') || sql.includes('subquery')) {
        throw new Error('DELETE complejo detectado. Se recomienda usar el modo local.');
    }
    
    throw new Error('DELETE automático no implementado. Se recomienda usar el modo local o implementar lógica específica.');
}

/**
 * Execute SQL query with Supabase
 */
async function executeWithSupabase(sql, params) {
    const supabase = await initSupabase();
    const { operation } = parseSQL(sql);
    
    switch (operation) {
        case 'select':
            return await executeSelect(sql, params, supabase);
        case 'insert':
            return await executeInsert(sql, params, supabase);
        case 'update':
            return await executeUpdate(sql, params, supabase);
        case 'delete':
            return await executeDelete(sql, params, supabase);
        default:
            throw new Error(`Operación '${operation}' no soportada en modo online. Se recomienda usar el modo local.`);
    }
}

/**
 * Main function to execute SQL queries
 * Routes between local (alasql) and online (Supabase) modes
 */
async function ejecutarSQL(sql, params = []) {
    const mode = window?.DB_MODE || 'local';
    
    try {
        if (mode === 'local') {
            // Use alasql for local execution
            return new Promise((resolve, reject) => {
                try {
                    // Make sure alasql is available globally
                    if (typeof window.alasql === 'function') {
                        const result = window.alasql(sql, params);
                        resolve(result);
                    } else if (typeof alasql === 'function') {
                        const result = alasql(sql, params);
                        resolve(result);
                    } else {
                        throw new Error('alasql no está disponible');
                    }
                } catch (error) {
                    reject(error);
                }
            });
        } else if (mode === 'online') {
            // Use Supabase for online execution
            return await executeWithSupabase(sql, params);
        } else {
            throw new Error(`Modo de base de datos desconocido: ${mode}. Use 'local' o 'online'.`);
        }
    } catch (error) {
        console.error(`Error ejecutando SQL en modo ${mode}:`, error.message);
        throw error;
    }
}

/**
 * Process loaded .easysql file and configure database mode
 */
function processEasysqlFile(files) {
    let hasSupabaseCredentials = false;
    let supabaseConfig = null;
    
    // Check for .ssql file with Supabase credentials
    for (const [filename, content] of Object.entries(files)) {
        if (filename.endsWith('.ssql')) {
            try {
                supabaseConfig = JSON.parse(content);
                if (supabaseConfig.SUPABASE_URL && supabaseConfig.SUPABASE_KEY) {
                    hasSupabaseCredentials = true;
                    console.log('Credenciales de Supabase encontradas, configurando modo online...');
                    
                    // Initialize Supabase with found credentials
                    if (typeof window !== 'undefined') {
                        window.initSupabaseFromObject(supabaseConfig);
                        window.DB_MODE = 'online';
                        
                        // Update UI if mode switch exists
                        const modeSwitch = document.getElementById('mode-switch');
                        const modeLabel = document.getElementById('mode-label');
                        if (modeSwitch && modeLabel) {
                            modeSwitch.checked = true;
                            modeLabel.textContent = 'Online';
                            modeLabel.style.color = '#2196F3';
                            
                            // Disable SQL load controls
                            const sqlLoadControls = document.querySelectorAll('.sql-load-control');
                            sqlLoadControls.forEach(control => {
                                control.disabled = true;
                            });
                        }
                        
                        // Load schema from Supabase
                        if (window.getSchema) {
                            window.getSchema().then(() => {
                                console.log('Esquema cargado desde Supabase');
                                if (typeof updateTablasSelector === 'function') {
                                    updateTablasSelector();
                                }
                            }).catch(error => {
                                console.error('Error cargando esquema:', error);
                            });
                        }
                    }
                    break;
                }
            } catch (error) {
                console.error('Error parseando archivo .ssql:', error);
            }
        }
    }
    
    // If no Supabase credentials found, ensure local mode
    if (!hasSupabaseCredentials && typeof window !== 'undefined') {
        window.DB_MODE = 'local';
        const modeSwitch = document.getElementById('mode-switch');
        const modeLabel = document.getElementById('mode-label');
        if (modeSwitch && modeLabel) {
            modeSwitch.checked = false;
            modeLabel.textContent = 'Local';
            modeLabel.style.color = '#555';
            
            // Enable SQL load controls
            const sqlLoadControls = document.querySelectorAll('.sql-load-control');
            sqlLoadControls.forEach(control => {
                control.disabled = false;
            });
        }
    }
    
    return { hasSupabaseCredentials, supabaseConfig };
}

// Global exports
if (typeof window !== 'undefined') {
    window.ejecutarSQL = ejecutarSQL;
    window.initSupabaseFromObject = initSupabaseFromObject;
    window.loadCredentialsFromFile = loadCredentialsFromFile;
    window.getSchema = getSchema;
    window.loadSchemaFromSupabase = loadSchemaFromSupabase;
    window.processEasysqlFile = processEasysqlFile;
}

export {
    ejecutarSQL,
    initSupabaseFromObject,
    loadCredentialsFromFile,
    getSchema,
    loadSchemaFromSupabase,
    processEasysqlFile,
    executeSelect,
    executeInsert,
    executeUpdate,
    executeDelete
};