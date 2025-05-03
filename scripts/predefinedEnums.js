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
    REGION_FRANCIA: {
        name: 'REGION_FRANCIA',
        description: 'Regiones de Francia',
        usableInMaps: true,
        values: [
            'Auvergne Rhone Alpes', 'Bourgogne Franche Comte', 'Bretagne', 
            'Centre Val de Loire', 'Corse', 'Grand Est', 'Hauts de France',
            'Ile de France', 'Normandie', 'Nouvelle Aquitaine', 
            'Occitanie', 'Pays de la Loire', 'Provence Alpes Cote d Azur'
        ]
    },
    DEPARTAMENTO_FRANCIA: {
        name: 'DEPARTAMENTO_FRANCIA',
        description: 'Departamentos de Francia',
        usableInMaps: true,
        values: [
            'Ain', 'Aisne', 'Allier', 'Alpes de Haute Provence', 'Hautes Alpes', 
            'Alpes Maritimes', 'Ardeche', 'Ardennes', 'Ariege', 'Aube', 'Aude', 
            'Aveyron', 'Bouches du Rhone', 'Calvados', 'Cantal', 'Charente', 
            'Charente Maritime', 'Cher', 'Correze', 'Corse du Sud', 'Haute Corse', 
            'Cote d Or', 'Cotes d Armor', 'Creuse', 'Dordogne', 'Doubs', 'Drome',
            'Eure', 'Eure et Loir', 'Finistere', 'Gard', 'Haute Garonne', 'Gers',
            'Gironde', 'Herault', 'Ille et Vilaine', 'Indre', 'Indre et Loire',
            'Isere', 'Jura', 'Landes', 'Loir et Cher', 'Loire', 'Haute Loire',
            'Loire Atlantique', 'Loiret', 'Lot', 'Lot et Garonne', 'Lozere',
            'Maine et Loire', 'Manche', 'Marne', 'Haute Marne', 'Mayenne',
            'Meurthe et Moselle', 'Meuse', 'Morbihan', 'Moselle', 'Nievre',
            'Nord', 'Oise', 'Orne', 'Pas de Calais', 'Puy de Dome',
            'Pyrenees Atlantiques', 'Hautes Pyrenees', 'Pyrenees Orientales',
            'Bas Rhin', 'Haut Rhin', 'Rhone', 'Haute Saone', 'Saone et Loire',
            'Sarthe', 'Savoie', 'Haute Savoie', 'Paris', 'Seine Maritime',
            'Seine et Marne', 'Yvelines', 'Deux Sevres', 'Somme', 'Tarn',
            'Tarn et Garonne', 'Var', 'Vaucluse', 'Vendee', 'Vienne',
            'Haute Vienne', 'Vosges', 'Yonne', 'Territoire de Belfort',
            'Essonne', 'Hauts de Seine', 'Seine Saint Denis', 'Val de Marne',
            'Val d Oise'
        ]
    },
    REGION_ITALIA: {
        name: 'REGION_ITALIA',
        description: 'Regiones de Italia',
        usableInMaps: true,
        values: [
            'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia Romagna',
            'Friuli Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
            'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
            'Trentino Alto Adige', 'Umbria', 'Valle d Aosta', 'Veneto'
        ]
    },
    PROVINCIA_ITALIA: {
        name: 'PROVINCIA_ITALIA',
        description: 'Provincias de Italia',
        usableInMaps: true,
        values: [
            'Agrigento', 'Alessandria', 'Ancona', 'Aosta', 'Arezzo', 'Ascoli Piceno',
            'Asti', 'Avellino', 'Bari', 'Barletta Andria Trani', 'Belluno', 'Benevento',
            'Bergamo', 'Biella', 'Bologna', 'Bolzano', 'Brescia', 'Brindisi',
            'Cagliari', 'Caltanissetta', 'Campobasso', 'Carbonia Iglesias', 'Caserta',
            'Catania', 'Catanzaro', 'Chieti', 'Como', 'Cosenza', 'Cremona', 'Crotone',
            'Cuneo', 'Enna', 'Fermo', 'Ferrara', 'Firenze', 'Foggia', 'Forli Cesena',
            'Frosinone', 'Genova', 'Gorizia', 'Grosseto', 'Imperia', 'Isernia',
            'La Spezia', 'LAquila', 'Latina', 'Lecce', 'Lecco', 'Livorno', 'Lodi',
            'Lucca', 'Macerata', 'Mantova', 'Massa Carrara', 'Matera', 'Medio Campidano',
            'Messina', 'Milano', 'Modena', 'Monza e Brianza', 'Napoli', 'Novara',
            'Nuoro', 'Ogliastra', 'Olbia Tempio', 'Oristano', 'Padova', 'Palermo',
            'Parma', 'Pavia', 'Perugia', 'Pesaro e Urbino', 'Pescara', 'Piacenza',
            'Pisa', 'Pistoia', 'Pordenone', 'Potenza', 'Prato', 'Ragusa', 'Ravenna',
            'Reggio Calabria', 'Reggio Emilia', 'Rieti', 'Rimini', 'Roma', 'Rovigo',
            'Salerno', 'Sassari', 'Savona', 'Siena', 'Siracusa', 'Sondrio', 'Taranto',
            'Teramo', 'Terni', 'Torino', 'Trapani', 'Trento', 'Treviso', 'Trieste',
            'Udine', 'Varese', 'Venezia', 'Verbano Cusio Ossola', 'Vercelli', 'Verona',
            'Vibo Valentia', 'Vicenza', 'Viterbo'
        ]
    },
    ESTADO_ALEMANIA: {
        name: 'ESTADO_ALEMANIA',
        description: 'Estados de Alemania',
        usableInMaps: true,
        values: [
            'Baden Wurttemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
            'Hamburg', 'Hessen', 'Mecklenburg Vorpommern', 'Niedersachsen',
            'Nordrhein Westfalen', 'Rheinland Pfalz', 'Saarland',
            'Sachsen', 'Sachsen Anhalt', 'Schleswig Holstein', 'Thuringen'
        ]
    },
    DISTRITO_ALEMANIA: {
        name: 'DISTRITO_ALEMANIA',
        description: 'Distritos de Alemania',
        usableInMaps: true,
        values: [
            'Stuttgart', 'Karlsruhe', 'Freiburg', 'Tubingen', 'Oberbayern',
            'Niederbayern', 'Oberpfalz', 'Oberfranken', 'Mittelfranken',
            'Unterfranken', 'Schwaben', 'Berlin', 'Brandenburg an der Havel',
            'Cottbus', 'Frankfurt Oder', 'Potsdam', 'Bremen', 'Bremerhaven',
            'Hamburg', 'Darmstadt', 'Giessen', 'Kassel', 'Schwerin',
            'Braunschweig', 'Hannover', 'Luneburg', 'Weser Ems', 'Dusseldorf',
            'Koln', 'Munster', 'Detmold', 'Arnsberg', 'Koblenz', 'Trier',
            'Rheinhessen Pfalz', 'Saarbrucken', 'Chemnitz', 'Dresden',
            'Leipzig', 'Dessau', 'Halle', 'Magdeburg', 'Schleswig'
        ]
    },
    DISTRITO_PORTUGAL: {
        name: 'DISTRITO_PORTUGAL',
        description: 'Distritos de Portugal',
        usableInMaps: true,
        values: [
            'Aveiro', 'Beja', 'Braga', 'Braganca', 'Castelo Branco',
            'Coimbra', 'Evora', 'Faro', 'Guarda', 'Leiria', 'Lisboa',
            'Portalegre', 'Porto', 'Santarem', 'Setubal', 'Viana do Castelo',
            'Vila Real', 'Viseu', 'Azores', 'Madeira'
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
    },
    // Estados y Procesos
    ESTADO_PAGO: {
        name: 'ESTADO_PAGO',
        description: 'Estados posibles de un pago',
        values: ['PENDIENTE', 'PAGADO', 'VENCIDO', 'REEMBOLSADO']
    },
    ESTADO_INVENTARIO: {
        name: 'ESTADO_INVENTARIO',
        description: 'Estados posibles del inventario',
        values: ['EN_STOCK', 'AGOTADO', 'BAJA_DE_INVENTARIO', 'PEDIDO']
    },
    ESTADO_CLIENTE: {
        name: 'ESTADO_CLIENTE',
        description: 'Estados posibles de un cliente',
        values: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'VIP']
    },
    ESTADO_TICKET: {
        name: 'ESTADO_TICKET',
        description: 'Estados posibles de un ticket de soporte',
        values: ['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO', 'ESCALADO']
    },

    // Roles y Categorías
    TIPO_CONTRATO: {
        name: 'TIPO_CONTRATO',
        description: 'Tipos de contrato laboral',
        values: ['TEMPORAL', 'PERMANENTE', 'INTERINO', 'FREELANCE']
    },
    NIVEL_ACCESO: {
        name: 'NIVEL_ACCESO',
        description: 'Niveles de acceso al sistema',
        values: ['USUARIO', 'SUPERVISOR', 'ADMINISTRADOR', 'INVITADO']
    },
    CLASIFICACION_PROVEEDOR: {
        name: 'CLASIFICACION_PROVEEDOR',
        description: 'Clasificación de proveedores por alcance',
        values: ['LOCAL', 'NACIONAL', 'INTERNACIONAL', 'EXCLUSIVO']
    },
    CATEGORIA_GASTO: {
        name: 'CATEGORIA_GASTO',
        description: 'Categorías de gastos',
        values: ['FIJO', 'VARIABLE', 'OPERATIVO', 'INVERSION']
    },

    // Datos Logísticos y Financieros
    METODO_ENVIO: {
        name: 'METODO_ENVIO',
        description: 'Métodos de envío disponibles',
        values: ['EXPRESS', 'STANDARD', 'INTERNACIONAL', 'RECOGIDA_EN_TIENDA']
    },
    MONEDA: {
        name: 'MONEDA',
        description: 'Tipos de moneda',
        values: ['EURO', 'DOLAR', 'LIBRA', 'YEN', 'PESO']
    },
    IMPUESTO: {
        name: 'IMPUESTO',
        description: 'Tipos de impuesto aplicable',
        values: ['IVA_REDUCIDO', 'IVA_GENERAL', 'EXENTO', 'NO_APLICABLE']
    },
    TIPO_SEGURO: {
        name: 'TIPO_SEGURO',
        description: 'Tipos de seguro',
        values: ['SALUD', 'VIDA', 'AUTOMOVIL', 'RESPONSABILIDAD_CIVIL']
    },

    // Gestión de Recursos Humanos
    MODALIDAD_TRABAJO: {
        name: 'MODALIDAD_TRABAJO',
        description: 'Modalidades de trabajo',
        values: ['PRESENCIAL', 'REMOTO', 'HIBRIDO']
    },
    MOTIVO_AUSENCIA: {
        name: 'MOTIVO_AUSENCIA',
        description: 'Motivos de ausencia laboral',
        values: ['VACACIONES', 'ENFERMEDAD', 'BAJA_MATERNIDAD', 'PERMISO_LABORAL']
    },
    NIVEL_DESEMPENO: {
        name: 'NIVEL_DESEMPENO',
        description: 'Niveles de desempeño laboral',
        values: ['BAJO', 'MEDIO', 'ALTO', 'EXCEPCIONAL']
    },
    TIPO_INCENTIVO: {
        name: 'TIPO_INCENTIVO',
        description: 'Tipos de incentivos laborales',
        values: ['BONO', 'ASCENSO', 'DIAS_LIBRES', 'RECONOCIMIENTO']
    },

    // Marketing y Ventas
    TIPO_CAMPANA: {
        name: 'TIPO_CAMPANA',
        description: 'Tipos de campaña de marketing',
        values: ['DIGITAL', 'IMPRESA', 'RADIO_TV', 'EVENTO']
    },
    SEGMENTO_MERCADO: {
        name: 'SEGMENTO_MERCADO',
        description: 'Segmentos de mercado objetivo',
        values: ['JOVENES', 'ADULTOS', 'EMPRESAS', 'GOBIERNO']
    },
    ESTRATEGIA_PRECIO: {
        name: 'ESTRATEGIA_PRECIO',
        description: 'Estrategias de precios',
        values: ['DESCUENTO', 'OFERTA_ESPECIAL', 'PRECIO_BASE', 'SUBSCRIPCION']
    },
    CANAL_VENTA: {
        name: 'CANAL_VENTA',
        description: 'Canales de venta',
        values: ['WEB', 'TIENDA_FISICA', 'CALL_CENTER', 'REDES_SOCIALES']
    },
    ESTADO_PEDIDO: {
        name: 'ESTADO_PEDIDO',
        description: 'Estados posibles de un pedido',
        values: ['PENDIENTE', 'EN_PROCESO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']
    },

    // Otros enums empresariales
    TIPO_DOCUMENTO: {
        name: 'TIPO_DOCUMENTO',
        description: 'Tipos de documento',
        values: ['FACTURA', 'ALBARAN', 'ORDEN_COMPRA', 'RECIBO', 'CONTRATO']
    },
    CATEGORIA_EMPLEADO: {
        name: 'CATEGORIA_EMPLEADO',
        description: 'Categorías de empleado',
        values: ['ADMINISTRATIVO', 'GERENTE', 'TECNICO', 'COMERCIAL', 'DIRECTIVO']
    },
    PRIORIDAD_TAREA: {
        name: 'PRIORIDAD_TAREA',
        description: 'Niveles de prioridad de tareas',
        values: ['BAJA', 'MEDIA', 'ALTA', 'URGENTE']
    },
    METODO_PAGO: {
        name: 'METODO_PAGO',
        description: 'Métodos de pago disponibles',
        values: ['TRANSFERENCIA', 'TARJETA_CREDITO', 'EFECTIVO', 'PAYPAL']
    },
    DEPARTAMENTO_EMPRESA: {
        name: 'DEPARTAMENTO_EMPRESA',
        description: 'Departamentos de la empresa',
        values: ['CONTABILIDAD', 'RECURSOS_HUMANOS', 'VENTAS', 'MARKETING', 'IT']
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
