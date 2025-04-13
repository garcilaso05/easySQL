const predefinedEnums = {
    PAISES: {
        name: 'PAISES',
        description: 'Listado completo de países del mundo',
        usableInMaps: true,
        values: [
            'Afganistán', 'Albania', 'Alemania', 'Andorra', 'Angola', 'Argentina', 
            'Armenia', 'Australia', 'Austria', 'Azerbaiyán', 'Bahamas', 'Bangladés', 
            'Bélgica', 'Belice', 'Benín', 'Bielorrusia', 'Bolivia', 'Bosnia y Herzegovina', 
            'Brasil', 'Bulgaria', 'Camboya', 'Camerún', 'Canadá', 'Chile', 'China', 
            'Colombia', 'Corea del Norte', 'Corea del Sur', 'Costa Rica', 'Croacia', 
            'Cuba', 'Dinamarca', 'Ecuador', 'Egipto', 'El Salvador', 'Emiratos Árabes Unidos', 
            'Eslovaquia', 'Eslovenia', 'España', 'Estados Unidos', 'Estonia', 'Etiopía', 
            'Filipinas', 'Finlandia', 'Francia', 'Georgia', 'Ghana', 'Grecia', 'Guatemala', 
            'Haití', 'Honduras', 'Hungría', 'India', 'Indonesia', 'Irak', 'Irán', 'Irlanda', 
            'Islandia', 'Israel', 'Italia', 'Jamaica', 'Japón', 'Jordania', 'Kazajistán', 
            'Kenia', 'Kuwait', 'Letonia', 'Líbano', 'Liberia', 'Libia', 'Liechtenstein', 
            'Lituania', 'Luxemburgo', 'Macedonia del Norte', 'Madagascar', 'Malasia', 'Malí', 
            'Malta', 'Marruecos', 'México', 'Moldavia', 'Mónaco', 'Mongolia', 'Montenegro', 
            'Mozambique', 'Namibia', 'Nepal', 'Nicaragua', 'Níger', 'Nigeria', 'Noruega', 
            'Nueva Zelanda', 'Países Bajos', 'Pakistán', 'Panamá', 'Paraguay', 'Perú', 
            'Polonia', 'Portugal', 'Qatar', 'Reino Unido', 'República Checa', 
            'República Democrática del Congo', 'República Dominicana', 'Ruanda', 'Rumanía', 
            'Rusia', 'Senegal', 'Serbia', 'Singapur', 'Siria', 'Somalia', 'Sri Lanka', 
            'Sudáfrica', 'Sudán', 'Suecia', 'Suiza', 'Tailandia', 'Tanzania', 'Túnez', 
            'Turkmenistán', 'Turquía', 'Ucrania', 'Uganda', 'Uruguay', 'Uzbekistán', 
            'Venezuela', 'Vietnam', 'Yemen', 'Yibuti', 'Zambia', 'Zimbabue'
        ]
    },
    PROVINCIAS_ESP: {
        name: 'PROVINCIAS_ESP',
        description: 'Provincias de España',
        usableInMaps: true,
        values: [
            'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 
            'Badajoz', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria',
            'Castellón', 'Ciudad Real', 'Córdoba', 'Cuenca', 'Gerona', 'Granada',
            'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca', 'Islas Baleares',
            'Jaén', 'La Coruña', 'La Rioja', 'Las Palmas', 'León', 'Lérida',
            'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Orense', 'Palencia',
            'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia',
            'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia',
            'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza', 'Ceuta', 'Melilla'
        ]
    },
    COMUNIDADES_ESP: {
        name: 'COMUNIDADES_ESP',
        description: 'Comunidades Autónomas de España',
        usableInMaps: true,
        values: ['Andalucía', 'Aragón', 'Asturias', 'Islas Baleares', 'Canarias', 
                'Cantabria', 'Castilla-La Mancha', 'Castilla y León', 'Cataluña', 
                'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarra', 
                'País Vasco', 'Comunidad Valenciana', 'Ceuta', 'Melilla'],
        divider: true  // Añadir el divisor aquí en lugar de en ESTADOS_EEUU
    },
    ESTADOS_EEUU: {
        name: 'ESTADOS_EEUU',
        description: 'Estados de Estados Unidos',
        usableInMaps: true,
        values: [
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
            'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
            'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
            'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
            'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
            'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
            'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
            'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
            'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
            'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
        ]
    },
    COLORES: {
        name: 'COLORES',
        description: 'Listado de colores comunes',
        values: [
            'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado', 'Rosa',
            'Negro', 'Blanco', 'Gris', 'Marrón', 'Celeste', 'Verde claro',
            'Verde oscuro', 'Azul marino', 'Dorado', 'Plateado', 'Violeta',
            'Turquesa', 'Beige', 'Cian', 'Magenta', 'Índigo', 'Carmesí',
            'Coral', 'Lavanda', 'Lima', 'Oliva', 'Salmón', 'Vino'
        ]
    },
    DIAS_SEMANA: {
        name: 'DIAS_SEMANA',
        description: 'Días de la semana en español',
        values: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    },
    MESES: {
        name: 'MESES',
        description: 'Meses del año en español',
        values: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 
                'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    },
    ESTADO_CIVIL: {
        name: 'ESTADO_CIVIL',
        description: 'Estados civiles comunes',
        values: ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Separado/a', 
                'Unión libre', 'Otro']
    },
    NIVEL_EDUCATIVO: {
        name: 'NIVEL_EDUCATIVO',
        description: 'Niveles de educación formal',
        values: ['Sin estudios', 'Primaria', 'Secundaria', 'Bachillerato', 'FP Medio', 
                'FP Superior', 'Grado universitario', 'Máster', 'Doctorado']
    },
    DEPARTAMENTOS: {
        name: 'DEPARTAMENTOS',
        description: 'Departamentos comunes en empresas',
        values: ['Recursos Humanos', 'Marketing', 'Ventas', 'Finanzas', 'Contabilidad', 
                'IT', 'Desarrollo', 'Producción', 'Logística', 'Legal', 'Dirección', 
                'Atención al Cliente', 'Calidad', 'Investigación']
    },
    TIPO_SANGRE: {
        name: 'TIPO_SANGRE',
        description: 'Grupos sanguíneos',
        values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    }
};

// Añadir función auxiliar para verificar si un enum es usable en mapas
function isEnumUsableInMaps(enumName) {
    return predefinedEnums[enumName]?.usableInMaps || false;
}

function getAvailablePredefinedEnums() {
    return Object.keys(predefinedEnums).map(key => ({
        name: key,
        description: predefinedEnums[key].description,
        isImported: schema.tables[key]?.isEnum || false
    }));
}

function importPredefinedEnum(enumName) {
    const enumData = predefinedEnums[enumName];
    if (!enumData) return false;

    schema.tables[enumName] = {
        isEnum: true,  // Asegurarnos de que la propiedad isEnum está establecida
        values: [...enumData.values],
        description: enumData.description,  // Opcional: mantener la descripción
        usableInMaps: enumData.usableInMaps  // Opcional: mantener si es usable en mapas
    };
    
    updateClassMap();
    populateEnumDropdown();  // Actualizar el dropdown de enums
    return true;
}

function removePredefinedEnum(enumName) {
    // Verificar si está en uso
    for (const tableName in schema.tables) {
        if (!schema.tables[tableName].isEnum) {
            const table = schema.tables[tableName];
            if (table.columns.some(col => col.type === enumName)) {
                throw new Error(`No se puede eliminar el enum "${enumName}" porque está siendo utilizado en la tabla "${tableName}"`);
            }
        }
    }

    delete schema.tables[enumName];
    updateClassMap();
    return true;
}

function checkForPredefinedEnumMatch(enumName) {
    if (predefinedEnums[enumName]) {
        showNotification(
            `Se ha detectado que el enum "${enumName}" coincide con uno predefinido. ` +
            `Puede encontrarlo en la lista de enums predefinidos.`,
            'info'
        );
        updatePredefinedEnums();
    }
}
