function openCreateEnumModal() {
    const container = document.getElementById('enumValuesContainer');
    container.innerHTML = '';
    addEnumValueInputCreate(); // Cambiado para usar función específica
    document.getElementById('enumName').value = '';
    document.getElementById('createEnumModal').style.display = 'block';

    // Hacer el contenedor desplazable
    container.style.maxHeight = '300px';
    container.style.overflowY = 'auto';
}

function closeCreateEnumModal() {
    document.getElementById('createEnumModal').style.display = 'none';
}

function addEnumValueInputCreate() {
    const container = document.getElementById('enumValuesContainer');
    const newInput = document.createElement('div');
    newInput.className = 'enum-value-input';
    newInput.innerHTML = `
        <input type="text" placeholder="Valor del Enum" class="enum-value">
        <button onclick="removeEnumValueInput(this)">Eliminar</button>
    `;
    container.appendChild(newInput);
}

function removeEnumValueInput(button) {
    button.parentElement.remove();
}

function createEnumFromForm() {
    const enumName = document.getElementById('enumName').value.trim();
    if (!enumName) {
        alert('Por favor, ingresa un nombre para el Enum.');
        return;
    }

    const values = [];
    const valueInputs = document.querySelectorAll('#enumValuesContainer .enum-value-input .enum-value');
    valueInputs.forEach(input => {
        const value = input.value.trim();
        if (value) values.push(value);
    });

    if (values.length === 0) {
        alert('Por favor, añade al menos un valor.');
        return;
    }

    if (schema.tables[enumName]) {
        alert('Ya existe una tabla o enum con este nombre.');
        return;
    }

    try {
        schema.tables[enumName] = {
            isEnum: true,
            values: values
        };
        checkForPredefinedEnumMatch(enumName);
        populateEnumDropdown(); // Añadido explícitamente
        updateClassMap();
        closeCreateEnumModal();
        alert(`Enum "${enumName}" creado exitosamente.`);
    } catch (e) {
        alert('Ocurrió un error al crear el Enum.');
    }
}
