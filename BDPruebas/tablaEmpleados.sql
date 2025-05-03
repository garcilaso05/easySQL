-- ENUM: MODALIDAD_TRABAJO
CREATE TYPE MODALIDAD_TRABAJO AS ENUM ('PRESENCIAL', 'REMOTO', 'HIBRIDO');

-- ENUM: DEPARTAMENTO_EMPRESA
CREATE TYPE DEPARTAMENTO_EMPRESA AS ENUM ('CONTABILIDAD', 'RECURSOS_HUMANOS', 'VENTAS', 'MARKETING', 'IT');

-- ENUM: PAISES
CREATE TYPE PAISES AS ENUM ('Afganistán', 'Albania', 'Alemania', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaiyán', 'Bahamas', 'Bangladés', 'Bélgica', 'Belice', 'Benín', 'Bielorrusia', 'Bolivia', 'Bosnia y Herzegovina', 'Brasil', 'Bulgaria', 'Camboya', 'Camerún', 'Canadá', 'Chile', 'China', 'Colombia', 'Corea del Norte', 'Corea del Sur', 'Costa Rica', 'Croacia', 'Cuba', 'Dinamarca', 'Ecuador', 'Egipto', 'El Salvador', 'Emiratos Árabes Unidos', 'Eslovaquia', 'Eslovenia', 'España', 'Estados Unidos', 'Estonia', 'Etiopía', 'Filipinas', 'Finlandia', 'Francia', 'Georgia', 'Ghana', 'Grecia', 'Guatemala', 'Haití', 'Honduras', 'Hungría', 'India', 'Indonesia', 'Irak', 'Irán', 'Irlanda', 'Islandia', 'Israel', 'Italia', 'Jamaica', 'Japón', 'Jordania', 'Kazajistán', 'Kenia', 'Kuwait', 'Letonia', 'Líbano', 'Liberia', 'Libia', 'Liechtenstein', 'Lituania', 'Luxemburgo', 'Macedonia del Norte', 'Madagascar', 'Malasia', 'Malí', 'Malta', 'Marruecos', 'México', 'Moldavia', 'Mónaco', 'Mongolia', 'Montenegro', 'Mozambique', 'Namibia', 'Nepal', 'Nicaragua', 'Níger', 'Nigeria', 'Noruega', 'Nueva Zelanda', 'Países Bajos', 'Pakistán', 'Panamá', 'Paraguay', 'Perú', 'Polonia', 'Portugal', 'Qatar', 'Reino Unido', 'República Checa', 'República Democrática del Congo', 'República Dominicana', 'Ruanda', 'Rumanía', 'Rusia', 'Senegal', 'Serbia', 'Singapur', 'Siria', 'Somalia', 'Sri Lanka', 'Sudáfrica', 'Sudán', 'Suecia', 'Suiza', 'Tailandia', 'Tanzania', 'Túnez', 'Turkmenistán', 'Turquía', 'Ucrania', 'Uganda', 'Uruguay', 'Uzbekistán', 'Venezuela', 'Vietnam', 'Yemen', 'Yibuti', 'Zambia', 'Zimbabue');

-- ENUM: RANGO_EDAD
CREATE TYPE RANGO_EDAD AS ENUM ('18-25', '26-35', '36-45', '46-55', '+55');

-- ENUM: ESTADO_CIVIL
CREATE TYPE ESTADO_CIVIL AS ENUM ('Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Separado/a', 'Unión libre', 'Otro');

-- TABLE: EMPLEADOS
CREATE TABLE EMPLEADOS (
  DNI STRING PRIMARY KEY,
  NOMBRE STRING NOT NULL,
  EDAD RANGO_EDAD CHECK(EDAD IS NULL OR EDAD IN ('18-25', '26-35', '36-45', '46-55', '+55')),
  NACIONALIDAD PAISES CHECK(NACIONALIDAD IS NULL OR NACIONALIDAD IN ('Afganistán', 'Albania', 'Alemania', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaiyán', 'Bahamas', 'Bangladés', 'Bélgica', 'Belice', 'Benín', 'Bielorrusia', 'Bolivia', 'Bosnia y Herzegovina', 'Brasil', 'Bulgaria', 'Camboya', 'Camerún', 'Canadá', 'Chile', 'China', 'Colombia', 'Corea del Norte', 'Corea del Sur', 'Costa Rica', 'Croacia', 'Cuba', 'Dinamarca', 'Ecuador', 'Egipto', 'El Salvador', 'Emiratos Árabes Unidos', 'Eslovaquia', 'Eslovenia', 'España', 'Estados Unidos', 'Estonia', 'Etiopía', 'Filipinas', 'Finlandia', 'Francia', 'Georgia', 'Ghana', 'Grecia', 'Guatemala', 'Haití', 'Honduras', 'Hungría', 'India', 'Indonesia', 'Irak', 'Irán', 'Irlanda', 'Islandia', 'Israel', 'Italia', 'Jamaica', 'Japón', 'Jordania', 'Kazajistán', 'Kenia', 'Kuwait', 'Letonia', 'Líbano', 'Liberia', 'Libia', 'Liechtenstein', 'Lituania', 'Luxemburgo', 'Macedonia del Norte', 'Madagascar', 'Malasia', 'Malí', 'Malta', 'Marruecos', 'México', 'Moldavia', 'Mónaco', 'Mongolia', 'Montenegro', 'Mozambique', 'Namibia', 'Nepal', 'Nicaragua', 'Níger', 'Nigeria', 'Noruega', 'Nueva Zelanda', 'Países Bajos', 'Pakistán', 'Panamá', 'Paraguay', 'Perú', 'Polonia', 'Portugal', 'Qatar', 'Reino Unido', 'República Checa', 'República Democrática del Congo', 'República Dominicana', 'Ruanda', 'Rumanía', 'Rusia', 'Senegal', 'Serbia', 'Singapur', 'Siria', 'Somalia', 'Sri Lanka', 'Sudáfrica', 'Sudán', 'Suecia', 'Suiza', 'Tailandia', 'Tanzania', 'Túnez', 'Turkmenistán', 'Turquía', 'Ucrania', 'Uganda', 'Uruguay', 'Uzbekistán', 'Venezuela', 'Vietnam', 'Yemen', 'Yibuti', 'Zambia', 'Zimbabue')),
  DEPARTAMENTO DEPARTAMENTO_EMPRESA NOT NULL CHECK(DEPARTAMENTO IN ('CONTABILIDAD', 'RECURSOS_HUMANOS', 'VENTAS', 'MARKETING', 'IT')) NOT NULL,
  MODALIDAD MODALIDAD_TRABAJO CHECK(MODALIDAD IS NULL OR MODALIDAD IN ('PRESENCIAL', 'REMOTO', 'HIBRIDO')),
  ESTADO_CIVIL ESTADO_CIVIL CHECK(ESTADO_CIVIL IS NULL OR ESTADO_CIVIL IN ('Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Separado/a', 'Unión libre', 'Otro'))
);

