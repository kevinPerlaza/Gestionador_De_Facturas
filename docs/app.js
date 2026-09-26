// ============================================================================
// SISTEMA DE FACTURAS - APLICACION WEB v1.3
// ============================================================================
// Cambios v1.3:
// - Campos opcionales: Teléfono y Dirección del cliente
// - Filtro de tiempo transcurrido desde el aseo (verde/naranja/rojo)
// ============================================================================

// Estado Global
const state = {
    invoices: [],
    filters: {},
    filteredInvoices: []
};

// ============================================================================
// INICIALIZACION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadInvoicesFromStorage();
    updateUI();
    updateNextInvoiceIdDisplay();
    setupProjectDropdown();
});

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function initializeEventListeners() {
    // Formulario
    document.getElementById('invoiceForm').addEventListener('submit', handleAddInvoice);
    
    // Monto - Calcular impuestos automáticamente
    document.getElementById('invoiceMonto').addEventListener('input', calculateTaxes);
    
    // Proyecto - Mostrar/ocultar campo de "otro"
    document.getElementById('invoiceProject').addEventListener('change', handleProjectChange);
    
    // Filtros
    document.getElementById('applyFilters').addEventListener('click', handleApplyFilters);
    document.getElementById('clearFilters').addEventListener('click', handleClearFilters);
    
    // Exportación
    document.getElementById('exportJSON').addEventListener('click', () => exportData('json'));
    document.getElementById('exportExcel').addEventListener('click', () => exportData('excel'));
    document.getElementById('exportPDF').addEventListener('click', () => exportData('pdf'));
}

// ============================================================================
// MANEJO DE FORMULARIO
// ============================================================================

function handleAddInvoice(e) {
    e.preventDefault();

    // Obtener datos del formulario
    const dateInput = document.getElementById('invoiceDate').value;
    const fecha = formatDateFromInput(dateInput);
    
    // Validar fecha
    if (!dateInput) {
        showMessage('Por favor selecciona una fecha', 'error');
        return;
    }
    
    if (!isValidDate(fecha)) {
        showMessage('La fecha no es válida. Usa formato DD/MM/YYYY', 'error');
        return;
    }

    // Obtener proyecto (si es "Otro", usar el campo de entrada)
    let proyecto = document.getElementById('invoiceProject').value;
    if (proyecto === 'Otro') {
        proyecto = document.getElementById('invoiceProjectOther').value;
        if (!proyecto) {
            showMessage('Por favor especifica el tipo de aseo', 'error');
            return;
        }
    }

    const cliente = document.getElementById('invoiceClient').value;
    const monto = parseFloat(document.getElementById('invoiceMonto').value);
    const impuestos = parseFloat(document.getElementById('invoiceTaxes').value) || 0;

    // Validaciones básicas
    if (!cliente || !monto || !proyecto) {
        showMessage('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    if (monto <= 0) {
        showMessage('El monto debe ser mayor a 0', 'error');
        return;
    }

    // Generar ID automático
    const id = generateNextInvoiceId();

    // Crear datos de la factura
    const invoiceData = {
        id: id,
        fecha: fecha,
        cliente: cliente,
        telefono: document.getElementById('invoiceClientPhone').value || '',
        direccion: document.getElementById('invoiceClientAddress').value || '',
        monto: monto,
        proyecto: proyecto,
        impuestos: impuestos,
        estado: document.getElementById('invoiceStatus').value || 'pendiente'
    };

    // Agregar factura
    state.invoices.push(invoiceData);
    saveInvoicesToStorage();
    
    // Mensaje de éxito
    showMessage(`Factura ${id} agregada exitosamente`, 'success');
    
    // Limpiar formulario
    document.getElementById('invoiceForm').reset();
    document.getElementById('invoiceProjectOther').style.display = 'none';
    
    // Generar próximo ID
    generateNextInvoiceId();
    
    // Actualizar UI
    updateUI();
    applyFilters();
}

// ============================================================================
// MANEJO DE FILTROS
// ============================================================================

function handleApplyFilters() {
    applyFilters();
}

function handleClearFilters() {
    // Limpiar inputs de filtro
    document.getElementById('filterClient').value = '';
    document.getElementById('filterMontoMin').value = '';
    document.getElementById('filterMontoMax').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('filterProject').value = '';
    
    document.querySelectorAll('.statusFilter').forEach(checkbox => {
        checkbox.checked = false;
    });

    state.filters = {};
    applyFilters();
    updateUI();
}

function applyFilters() {
    // Recopilar filtros
    state.filters = {};
    
    const clientFilter = document.getElementById('filterClient').value;
    if (clientFilter) state.filters.client = clientFilter;
    
    const montoMin = document.getElementById('filterMontoMin').value;
    const montoMax = document.getElementById('filterMontoMax').value;
    if (montoMin || montoMax) {
        state.filters.monto = { min: montoMin ? parseFloat(montoMin) : 0, max: montoMax ? parseFloat(montoMax) : Infinity };
    }
    
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    if (dateFrom || dateTo) {
        state.filters.date = { from: dateFrom, to: dateTo };
    }
    
    const projectFilter = document.getElementById('filterProject').value;
    if (projectFilter) state.filters.project = projectFilter;
    
    const statusFilters = Array.from(document.querySelectorAll('.statusFilter:checked')).map(cb => cb.value);
    if (statusFilters.length > 0) state.filters.status = statusFilters;

    const timeStatusFilters = Array.from(document.querySelectorAll('.timeStatusFilter:checked')).map(cb => cb.value);
    if (timeStatusFilters.length > 0) state.filters.timeStatus = timeStatusFilters;

    // Aplicar filtros
    state.filteredInvoices = state.invoices.filter(invoice => {
        // Filtro por cliente
        if (state.filters.client && !invoice.cliente.toLowerCase().includes(state.filters.client.toLowerCase())) {
            return false;
        }

        // Filtro por monto
        if (state.filters.monto) {
            if (invoice.monto < state.filters.monto.min || invoice.monto > state.filters.monto.max) {
                return false;
            }
        }

        // Filtro por fecha
        if (state.filters.date) {
            if (state.filters.date.from && !isDateGreaterOrEqual(invoice.fecha, state.filters.date.from)) {
                return false;
            }
            if (state.filters.date.to && !isDateLessOrEqual(invoice.fecha, state.filters.date.to)) {
                return false;
            }
        }

        // Filtro por proyecto
        if (state.filters.project && !invoice.proyecto.toLowerCase().includes(state.filters.project.toLowerCase())) {
            return false;
        }

        // Filtro por estado
        if (state.filters.status && !state.filters.status.includes(invoice.estado)) {
            return false;
        }

        // Filtro por tiempo desde el aseo
        if (state.filters.timeStatus && state.filters.timeStatus.length > 0) {
            const daysAgo = calculateDaysSinceService(invoice.fecha);
            let timeStatusColor = getTimeStatusColor(daysAgo);
            if (!state.filters.timeStatus.includes(timeStatusColor)) {
                return false;
            }
        }

        return true;
    });

    renderResults();
    updateUI();
}

// ============================================================================
// RENDERIZADO DE RESULTADOS
// ============================================================================

function renderResults() {
    const container = document.getElementById('resultsContainer');
    
    if (state.filteredInvoices.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Sin resultados. Intenta ajustar los filtros.</p></div>';
        return;
    }

    container.innerHTML = state.filteredInvoices.map(invoice => {
        const daysAgo = calculateDaysSinceService(invoice.fecha);
        const timeStatusColor = getTimeStatusColor(daysAgo);
        const timeStatusEmoji = getTimeStatusEmoji(timeStatusColor);
        
        return `
        <div class="invoice-item">
            <div class="invoice-id">${invoice.id}</div>
            <div class="invoice-info">
                <div class="invoice-client">${invoice.cliente}</div>
                <div class="invoice-client-details">
                    ${invoice.telefono ? `📞 ${invoice.telefono}` : ''}
                    ${invoice.direccion ? `📍 ${invoice.direccion}` : ''}
                </div>
                <div class="invoice-details">
                    ${invoice.fecha} • ${invoice.proyecto || 'Sin proyecto'}
                    ${invoice.estado ? `<span class="status-badge status-${invoice.estado}"> ${invoice.estado}</span>` : ''}
                </div>
                <div class="invoice-time-status">
                    <span class="time-badge time-status-${timeStatusColor}">${timeStatusEmoji} ${daysAgo} días</span>
                </div>
            </div>
            <div class="invoice-monto">$${invoice.monto.toFixed(2)}</div>
        </div>
    `;
    }).join('');
}

// ============================================================================
// ACTUALIZACION DE UI
// ============================================================================

function updateUI() {
    // Total de facturas
    document.getElementById('totalInvoices').textContent = state.invoices.length;
    
    // Monto total
    const totalAmount = state.invoices.reduce((sum, inv) => sum + inv.monto, 0);
    document.getElementById('totalAmount').textContent = `$${totalAmount.toFixed(2)}`;
    
    // Filtros activos
    document.getElementById('activeFilters').textContent = Object.keys(state.filters).length;
    
    // Actualizar próximo ID disponible
    updateNextInvoiceIdDisplay();
    
    // Renderizar resultados
    if (state.filteredInvoices.length === 0 && state.invoices.length > 0) {
        applyFilters();
    } else if (state.invoices.length > 0) {
        renderResults();
    }
}

// ============================================================================
// ALMACENAMIENTO LOCAL
// ============================================================================

function saveInvoicesToStorage() {
    try {
        localStorage.setItem('invoices', JSON.stringify(state.invoices));
    } catch (e) {
        console.error('Error al guardar en localStorage:', e);
    }
}

function loadInvoicesFromStorage() {
    try {
        const stored = localStorage.getItem('invoices');
        if (stored) {
            state.invoices = JSON.parse(stored);
            state.filteredInvoices = [...state.invoices];
        }
    } catch (e) {
        console.error('Error al cargar desde localStorage:', e);
    }
}

// ============================================================================
// EXPORTACION DE DATOS
// ============================================================================

function exportData(format) {
    if (state.invoices.length === 0) {
        showMessage('No hay facturas para exportar', 'error');
        return;
    }

    const dataToExport = state.filteredInvoices.length > 0 ? state.filteredInvoices : state.invoices;

    if (format === 'json') {
        exportJSON(dataToExport);
    } else if (format === 'excel') {
        exportExcel(dataToExport);
    } else if (format === 'pdf') {
        exportPDF(dataToExport);
    }
}

function exportJSON(data) {
    const jsonData = {
        fecha_exportacion: new Date().toLocaleString('es-ES'),
        total_facturas: data.length,
        monto_total: data.reduce((sum, inv) => sum + inv.monto, 0),
        facturas: data
    };

    const dataStr = JSON.stringify(jsonData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `facturas_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showMessage('Archivo JSON descargado exitosamente', 'success');
}

function exportExcel(data) {
    // Crear CSV que Excel puede abrir
    let csv = 'ID,Fecha,Cliente,Monto,Impuestos (19%),Total,Aseo,Estado\n';
    
    data.forEach(invoice => {
        const total = invoice.monto + invoice.impuestos;
        const row = [
            `"${invoice.id}"`,
            `"${invoice.fecha}"`,
            `"${invoice.cliente}"`,
            `"${invoice.monto.toFixed(2)}"`,
            `"${invoice.impuestos.toFixed(2)}"`,
            `"${total.toFixed(2)}"`,
            `"${invoice.proyecto}"`,
            `"${invoice.estado || 'pendiente'}"`
        ].join(',');
        csv += row + '\n';
    });
    
    // Agregar totales
    const totalMonto = data.reduce((sum, inv) => sum + inv.monto, 0);
    const totalImpuestos = data.reduce((sum, inv) => sum + inv.impuestos, 0);
    const totalGeneral = totalMonto + totalImpuestos;
    
    csv += '\n"TOTAL","","","' + totalMonto.toFixed(2) + '","' + totalImpuestos.toFixed(2) + '","' + totalGeneral.toFixed(2) + '","",""\n';
    
    const dataBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `facturas_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showMessage('Archivo Excel (CSV) descargado exitosamente', 'success');
}

function exportPDF(data) {
    // Crear documento PDF usando HTML a texto
    let html = `
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reporte de Facturas</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1B5E4F; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #1B5E4F; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            tr:hover { background-color: #f5f5f5; }
            .total-row { font-weight: bold; background-color: #2A7A68; color: white; }
            .summary { margin-top: 20px; }
            .summary-item { margin: 10px 0; }
        </style>
    </head>
    <body>
        <h1>Reporte de Facturas</h1>
        <div class="summary">
            <div class="summary-item"><strong>Total Facturas:</strong> ${data.length}</div>
            <div class="summary-item"><strong>Fecha de Generación:</strong> ${new Date().toLocaleString('es-ES')}</div>
            <div class="summary-item"><strong>Monto Total:</strong> $${data.reduce((sum, inv) => sum + inv.monto, 0).toFixed(2)}</div>
            <div class="summary-item"><strong>Impuestos Totales (19%):</strong> $${data.reduce((sum, inv) => sum + inv.impuestos, 0).toFixed(2)}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Monto</th>
                    <th>Impuestos (19%)</th>
                    <th>Total</th>
                    <th>Aseo</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    let totalMonto = 0;
    let totalImpuestos = 0;
    
    data.forEach(invoice => {
        const total = invoice.monto + invoice.impuestos;
        totalMonto += invoice.monto;
        totalImpuestos += invoice.impuestos;
        
        html += `
            <tr>
                <td>${invoice.id}</td>
                <td>${invoice.fecha}</td>
                <td>${invoice.cliente}</td>
                <td>$${invoice.monto.toFixed(2)}</td>
                <td>$${invoice.impuestos.toFixed(2)}</td>
                <td>$${total.toFixed(2)}</td>
                <td>${invoice.proyecto}</td>
                <td>${invoice.estado || 'pendiente'}</td>
            </tr>
        `;
    });
    
    const totalGeneral = totalMonto + totalImpuestos;
    
    html += `
            </tbody>
        </table>
        <table style="margin-top: 20px; width: 50%;">
            <tr class="total-row">
                <td>TOTAL FACTURAS</td>
                <td>$${totalMonto.toFixed(2)}</td>
                <td>$${totalImpuestos.toFixed(2)}</td>
                <td>$${totalGeneral.toFixed(2)}</td>
            </tr>
        </table>
    </body>
    </html>
    `;
    
    // Abrir en nueva ventana para imprimir
    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
    
    // Auto-imprimir o esperar a que el usuario lo haga
    setTimeout(() => {
        newWindow.print();
    }, 250);
    
    showMessage('Abriendo vista previa para PDF. Usa Imprimir para guardar como PDF', 'success');
}

// ============================================================================
// UTILIDADES
// ============================================================================

function showMessage(message, type) {
    const messageEl = document.getElementById('formMessage');
    messageEl.textContent = message;
    messageEl.className = `form-message ${type}`;
    
    setTimeout(() => {
        messageEl.className = 'form-message';
    }, 3000);
}

function isValidDate(dateString) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);
    
    if (!match) return false;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;
    
    return true;
}

function dateToComparable(dateString) {
    const [day, month, year] = dateString.split('/');
    return `${year}${month}${day}`;
}

function isDateGreaterOrEqual(date1, date2) {
    return dateToComparable(date1) >= dateToComparable(date2);
}

function isDateLessOrEqual(date1, date2) {
    return dateToComparable(date1) <= dateToComparable(date2);
}

// ============================================================================
// NUEVAS FUNCIONES - ID AUTOMATICO, IMPUESTOS, Y DROPDOWN
// ============================================================================

function generateNextInvoiceId() {
    // Buscar el ID más alto existente
    let maxNumber = 0;
    state.invoices.forEach(inv => {
        const match = inv.id.match(/FAC-(\d+)/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) maxNumber = num;
        }
    });
    
    const nextId = `FAC-${String(maxNumber + 1).padStart(3, '0')}`;
    // NO asignar directamente, solo retornar
    return nextId;
}

function calculateTaxes() {
    const montoInput = document.getElementById('invoiceMonto');
    const taxesInput = document.getElementById('invoiceTaxes');
    
    const monto = parseFloat(montoInput.value) || 0;
    const impuestos = monto * 0.19; // 19% de impuestos
    
    taxesInput.value = impuestos.toFixed(2);
}

function handleProjectChange() {
    const projectSelect = document.getElementById('invoiceProject');
    const projectOtherInput = document.getElementById('invoiceProjectOther');
    
    if (projectSelect.value === 'Otro') {
        projectOtherInput.style.display = 'block';
        projectOtherInput.focus();
    } else {
        projectOtherInput.style.display = 'none';
        projectOtherInput.value = '';
    }
}

function setupProjectDropdown() {
    // Verificar si hay valores guardados en localStorage y recuperarlos si es necesario
    // Por ahora, la lista está hardcodeada en el HTML
}

function updateNextInvoiceIdDisplay() {
    // Buscar el ID más alto existente
    let maxNumber = 0;
    state.invoices.forEach(inv => {
        const match = inv.id.match(/FAC-(\d+)/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) maxNumber = num;
        }
    });
    
    const nextId = `FAC-${String(maxNumber + 1).padStart(3, '0')}`;
    document.getElementById('invoiceId').value = nextId;
}

function formatDateFromInput(dateString) {
    // Convertir de formato YYYY-MM-DD (input type="date") a DD/MM/YYYY
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// ============================================================================
// NUEVAS FUNCIONES v1.3 - TIEMPO TRANSCURRIDO Y DATOS DEL CLIENTE
// ============================================================================

function calculateDaysSinceService(dateString) {
    // Convertir fecha DD/MM/YYYY a Date
    const [day, month, year] = dateString.split('/');
    const invoiceDate = new Date(year, month - 1, day);
    const today = new Date();
    
    // Calcular diferencia en días
    const diffTime = today - invoiceDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function getTimeStatusColor(daysAgo) {
    if (daysAgo <= 14) {
        return 'green';  // 0-14 días
    } else if (daysAgo <= 29) {
        return 'orange'; // 15-29 días
    } else {
        return 'red';    // 30+ días
    }
}

function getTimeStatusEmoji(timeStatusColor) {
    switch(timeStatusColor) {
        case 'green':
            return '🟢';
        case 'orange':
            return '🟠';
        case 'red':
            return '🔴';
        default:
            return '⚪';
    }
}
