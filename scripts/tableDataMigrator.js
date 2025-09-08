class TableDataMigrator {
    constructor() {
        this.migrationStrategies = {
            'column_deleted': this.handleColumnDeletion.bind(this),
            'column_added': this.handleColumnAddition.bind(this),
            'column_reordered': this.handleColumnReordering.bind(this),
            'column_type_changed': this.handleColumnTypeChange.bind(this),
            'column_renamed': this.handleColumnRename.bind(this)
        };
    }

    /**
     * Main migration method that analyzes changes and applies appropriate migrations
     */
    migrateTableData(tableName, oldStructure, newStructure) {
        try {
            // Get existing data
            const existingData = this.getExistingData(tableName);
            if (!existingData || existingData.length === 0) {
                console.log(`No data to migrate for table ${tableName}`);
                return { success: true, migratedData: [] };
            }

            // Analyze structural changes
            const changes = this.analyzeStructuralChanges(oldStructure, newStructure);
            console.log(`Detected changes for ${tableName}:`, changes);

            // Apply migrations step by step
            let migratedData = existingData;
            for (const change of changes) {
                migratedData = this.applyMigration(migratedData, change, oldStructure, newStructure);
            }

            return {
                success: true,
                migratedData: migratedData,
                changes: changes
            };

        } catch (error) {
            console.error(`Migration failed for table ${tableName}:`, error);
            return {
                success: false,
                error: error.message,
                migratedData: []
            };
        }
    }

    /**
     * Get existing data from the table
     */
    getExistingData(tableName) {
        try {
            return ejecutarSQL(`SELECT * FROM ${tableName}`);
        } catch (error) {
            console.warn(`Could not retrieve data from ${tableName}:`, error);
            return [];
        }
    }

    /**
     * Analyze what changed between old and new structures
     */
    analyzeStructuralChanges(oldStructure, newStructure) {
        const changes = [];
        const oldColumns = oldStructure.map(col => col.name);
        const newColumns = newStructure.map(col => col.name);

        // Detect deletions
        const deletedColumns = oldColumns.filter(col => !newColumns.includes(col));
        deletedColumns.forEach(col => {
            changes.push({
                type: 'column_deleted',
                columnName: col
            });
        });

        // Detect additions
        const addedColumns = newColumns.filter(col => !oldColumns.includes(col));
        addedColumns.forEach(col => {
            const newColumn = newStructure.find(c => c.name === col);
            changes.push({
                type: 'column_added',
                columnName: col,
                columnType: newColumn.type,
                defaultValue: this.getDefaultValueForType(newColumn.type)
            });
        });

        // Detect reordering (only for columns that exist in both)
        const commonColumns = oldColumns.filter(col => newColumns.includes(col));
        if (commonColumns.length > 0 && this.hasOrderChanged(oldStructure, newStructure, commonColumns)) {
            changes.push({
                type: 'column_reordered',
                newOrder: newColumns
            });
        }

        // Detect type changes
        commonColumns.forEach(colName => {
            const oldCol = oldStructure.find(c => c.name === colName);
            const newCol = newStructure.find(c => c.name === colName);
            if (oldCol.type !== newCol.type) {
                changes.push({
                    type: 'column_type_changed',
                    columnName: colName,
                    oldType: oldCol.type,
                    newType: newCol.type
                });
            }
        });

        return changes;
    }

    /**
     * Check if column order has changed
     */
    hasOrderChanged(oldStructure, newStructure, commonColumns) {
        for (let i = 0; i < commonColumns.length; i++) {
            const colName = commonColumns[i];
            const oldIndex = oldStructure.findIndex(c => c.name === colName);
            const newIndex = newStructure.findIndex(c => c.name === colName);
            if (oldIndex !== newIndex) {
                return true;
            }
        }
        return false;
    }

    /**
     * Apply a specific migration to the data
     */
    applyMigration(data, change, oldStructure, newStructure) {
        const strategy = this.migrationStrategies[change.type];
        if (!strategy) {
            console.warn(`No migration strategy for change type: ${change.type}`);
            return data;
        }
        return strategy(data, change, oldStructure, newStructure);
    }

    /**
     * Handle column deletion
     */
    handleColumnDeletion(data, change) {
        console.log(`Deleting column: ${change.columnName}`);
        return data.map(row => {
            const newRow = { ...row };
            delete newRow[change.columnName];
            return newRow;
        });
    }

    /**
     * Handle column addition
     */
    handleColumnAddition(data, change) {
        console.log(`Adding column: ${change.columnName} with default value: ${change.defaultValue}`);
        return data.map(row => ({
            ...row,
            [change.columnName]: change.defaultValue
        }));
    }

    /**
     * Handle column reordering
     */
    handleColumnReordering(data, change) {
        console.log(`Reordering columns to: ${change.newOrder.join(', ')}`);
        return data.map(row => {
            const reorderedRow = {};
            change.newOrder.forEach(colName => {
                if (row.hasOwnProperty(colName)) {
                    reorderedRow[colName] = row[colName];
                }
            });
            return reorderedRow;
        });
    }

    /**
     * Handle column type changes
     */
    handleColumnTypeChange(data, change) {
        console.log(`Changing type of column ${change.columnName} from ${change.oldType} to ${change.newType}`);
        return data.map(row => {
            const newRow = { ...row };
            if (newRow.hasOwnProperty(change.columnName)) {
                newRow[change.columnName] = this.convertValue(
                    newRow[change.columnName], 
                    change.oldType, 
                    change.newType
                );
            }
            return newRow;
        });
    }

    /**
     * Handle column renaming (for future use)
     */
    handleColumnRename(data, change) {
        console.log(`Renaming column from ${change.oldName} to ${change.newName}`);
        return data.map(row => {
            const newRow = { ...row };
            if (newRow.hasOwnProperty(change.oldName)) {
                newRow[change.newName] = newRow[change.oldName];
                delete newRow[change.oldName];
            }
            return newRow;
        });
    }

    /**
     * Get default value for a column type
     */
    getDefaultValueForType(type) {
        switch (type) {
            case 'INT':
            case 'FLOAT':
                return null; // NULL is better than 0 for new columns
            case 'BOOLEAN':
                return null; // NULL instead of false
            case 'STRING':
            case 'DATE':
                return null;
            default:
                // For ENUM types, return null
                return null;
        }
    }

    /**
     * Convert value from one type to another
     */
    convertValue(value, oldType, newType) {
        if (value === null || value === undefined) {
            return this.getDefaultValueForType(newType);
        }

        try {
            switch (newType) {
                case 'INT':
                    return parseInt(value) || null;
                case 'FLOAT':
                    return parseFloat(value) || null;
                case 'STRING':
                    return String(value);
                case 'BOOLEAN':
                    if (typeof value === 'boolean') return value;
                    if (typeof value === 'string') {
                        return value.toLowerCase() === 'true' || value === '1';
                    }
                    return Boolean(value);
                case 'DATE':
                    if (value instanceof Date) return value.toISOString().split('T')[0];
                    return String(value);
                default:
                    return String(value);
            }
        } catch (error) {
            console.warn(`Could not convert value ${value} from ${oldType} to ${newType}:`, error);
            return this.getDefaultValueForType(newType);
        }
    }

    /**
     * Generate SQL for recreating table with migrated data
     */
    generateMigrationSQL(tableName, newStructure, migratedData) {
        const createTableSQL = this.generateCreateTableSQL(tableName, newStructure);
        const insertSQL = this.generateInsertSQL(tableName, newStructure, migratedData);
        
        return {
            dropTable: `DROP TABLE IF EXISTS ${tableName}`,
            createTable: createTableSQL,
            insertData: insertSQL
        };
    }

    /**
     * Generate CREATE TABLE SQL
     */
    generateCreateTableSQL(tableName, structure) {
        const columnDefinitions = structure.map(col => {
            let def = `${col.name} ${col.type}`;
            if (col.pk) def += ' PRIMARY KEY';
            if (col.notNull && !col.pk) def += ' NOT NULL';
            return def;
        });
        
        return `CREATE TABLE ${tableName} (${columnDefinitions.join(', ')})`;
    }

    /**
     * Generate INSERT SQL for migrated data
     */
    generateInsertSQL(tableName, structure, data) {
        if (!data || data.length === 0) return [];

        const columnNames = structure.map(col => col.name);
        const insertStatements = [];

        data.forEach(row => {
            const values = columnNames.map(colName => {
                const value = row[colName];
                if (value === null || value === undefined) {
                    return 'NULL';
                }
                return typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
            });
            
            insertStatements.push(
                `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${values.join(', ')})`
            );
        });

        return insertStatements;
    }

    /**
     * Execute the complete migration process
     */
    executeMigration(tableName, oldStructure, newStructure) {
        const migrationResult = this.migrateTableData(tableName, oldStructure, newStructure);
        
        if (!migrationResult.success) {
            throw new Error(`Migration failed: ${migrationResult.error}`);
        }

        const sqlCommands = this.generateMigrationSQL(tableName, newStructure, migrationResult.migratedData);
        
        // Execute SQL commands
        try {
            ejecutarSQL(sqlCommands.dropTable);
            ejecutarSQL(sqlCommands.createTable);
            
            sqlCommands.insertData.forEach(insertSQL => {
                ejecutarSQL(insertSQL);
            });

            console.log(`Successfully migrated table ${tableName} with ${migrationResult.migratedData.length} records`);
            return {
                success: true,
                recordsMigrated: migrationResult.migratedData.length,
                changes: migrationResult.changes
            };

        } catch (error) {
            console.error(`Error executing migration SQL for ${tableName}:`, error);
            throw error;
        }
    }
}

// Make it globally available
window.TableDataMigrator = TableDataMigrator;
