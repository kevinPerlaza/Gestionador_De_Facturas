// ============================================================================
// SISTEMA DE FACTURAS - APLICACION WEB v1.5
// ============================================================================
// Cambios v1.5:
// - Integración con Firebase para sincronización multi-dispositivo
// - Autenticación anónima
// - Datos sincronizados en tiempo real
// ============================================================================

let db, auth, currentUserId;
let isFirebaseReady = false;

// ID compartido para sincronización (todos usan el mismo)
const SHARED_INVOICE_ID = 'shared_invoices';

// Inicializar Firebase cuando esté listo
function checkFirebaseReady() {
    if (window.db && window.auth) {
        isFirebaseReady = true;
        db = window.db;
        auth = window.auth;
        initializeAuth();
    } else {
        setTimeout(checkFirebaseReady, 100);
    }
}

function initializeAuth() {
    try {
        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUserId = user.uid;
                loadInvoicesFromFirebase();
            } else {
                auth.signInAnonymously().catch((error) => {
                    console.error('Error de autenticación:', error);
                    loadInvoicesFromStorage();
                });
            }
        });
    } catch (error) {
        console.error('Error inicializando autenticación:', error);
        loadInvoicesFromStorage();
    }
}

// Estado Global
const state = {
    invoices: [],
    filters: {},
    filteredInvoices: [],
    currentTab: 'entrada'
};

// ============================================================================
// INICIALIZACION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    setupTabNavigation();
    checkFirebaseReady();
    setupProjectDropdown();
});

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function initializeEventListeners() {
    document.getElementById('invoiceForm').addEventListener('submit', handleAddInvoice);
    document.getElementById('invoiceMonto').addEventListener('input', calculateTaxes);
    document.getElementById('invoiceProject').addEventListener('change', handleProjectChange);
    document.getElementById('applyFilters').addEventListener('click', handleApplyFilters);
    document.getElementById('clearFilters').addEventListener('click', handleClearFilters);
    document.getElementById('exportJSON').addEventListener('click', () => exportData('json'));
    document.getElementById('exportExcel').addEventListener('click', () => exportData('excel'));
    document.getElementById('exportPDF').addEventListener('click', () => exportData('pdf'));
}

// ============================================================================
// NAVEGACION DE PESTAÑAS
// ============================================================================

function setupTabNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.currentTarget.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    state.currentTab = tabName;
    
    if (tabName === 'busqueda') {
        applyFilters();
    }
}

// ============================================================================
// MANEJO DE FORMULARIO
// ============================================================================

function handleAddInvoice(e) {
    e.preventDefault();

    const dateInput = document.getElementById('invoiceDate').value;
    const fecha = formatDateFromInput(dateInput);
    
    if (!dateInput) {
        showMessage('Por favor selecciona una fecha', 'error');
        return;
    }
    
    if (!isValidDate(fecha)) {
        showMessage('La fecha no es válida. Usa formato DD/MM/YYYY', 'error');
        return;
    }

    let proyecto = document.getElementById('invoiceProject').value;
    if (proyecto === 'Otro') {
        proyecto = document.getElementById('invoiceProjectOther').value;
        if (!proyecto) {
            showMessage('Por favor especifica el tipo de servicio', 'error');
            return;
        }
    }

    const cliente = document.getElementById('invoiceClient').value;
    const monto = parseFloat(document.getElementById('invoiceMonto').value);

    if (!cliente || !monto || !proyecto) {
        showMessage('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    if (monto <= 0) {
        showMessage('El monto debe ser mayor a 0', 'error');
        return;
    }

    const impuestos = monto * 0.19;
    const total = monto + impuestos;

    let id = document.getElementById('invoiceCustomId').value.trim();
    if (!id) {
        id = generateNextInvoiceId();
    }

    const invoiceData = {
        id: id,
        fecha: fecha,
        cliente: cliente,
        rut: document.getElementById('invoiceClientRUT').value || '',
        email: document.getElementById('invoiceClientEmail').value || '',
        telefono: document.getElementById('invoiceClientPhone').value || '',
        direccion: document.getElementById('invoiceClientAddress').value || '',
        monto: monto,
        proyecto: proyecto,
        impuestos: impuestos,
        total: total,
        estado: document.getElementById('invoiceStatus').value || 'pendiente'
    };

    state.invoices.push(invoiceData);
    saveInvoicesToFirebase();
    
    showMessage(`Factura ${id} agregada exitosamente`, 'success');
    
    document.getElementById('invoiceForm').reset();
    document.getElementById('invoiceProjectOther').style.display = 'none';
    document.getElementById('invoiceTaxes').value = '0.00';
    document.getElementById('invoiceTotal').value = '0.00';
    
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
    document.getElementById('filterClient').value = '';
    document.getElementById('filterMontoMin').value = '';
    document.getElementById('filterMontoMax').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('filterProject').value = '';
    
    document.querySelectorAll('.statusFilter').forEach(checkbox => {
        checkbox.checked = false;
    });

    document.querySelectorAll('.timeStatusFilter').forEach(checkbox => {
        checkbox.checked = false;
    });

    state.filters = {};
    applyFilters();
    updateUI();
}

function applyFilters() {
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

    state.filteredInvoices = state.invoices.filter(invoice => {
        if (state.filters.client && !invoice.cliente.toLowerCase().includes(state.filters.client.toLowerCase())) {
            return false;
        }

        if (state.filters.monto) {
            if (invoice.monto < state.filters.monto.min || invoice.monto > state.filters.monto.max) {
                return false;
            }
        }

        if (state.filters.date) {
            if (state.filters.date.from && !isDateGreaterOrEqual(invoice.fecha, state.filters.date.from)) {
                return false;
            }
            if (state.filters.date.to && !isDateLessOrEqual(invoice.fecha, state.filters.date.to)) {
                return false;
            }
        }

        if (state.filters.project && !invoice.proyecto.toLowerCase().includes(state.filters.project.toLowerCase())) {
            return false;
        }

        if (state.filters.status && !state.filters.status.includes(invoice.estado)) {
            return false;
        }

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

    container.innerHTML = state.filteredInvoices.map((invoice, index) => {
        const daysAgo = calculateDaysSinceService(invoice.fecha);
        const timeStatusColor = getTimeStatusColor(daysAgo);
        const timeStatusEmoji = getTimeStatusEmoji(timeStatusColor);
        
        const realIndex = state.invoices.findIndex(inv => inv.id === invoice.id);
        
        const monto = invoice.monto;
        const iva = invoice.impuestos || (monto * 0.19);
        const total = monto + iva;
        
        return `
        <div class="invoice-item">
            <div class="invoice-id">${escapeHtml(invoice.id)}</div>
            <div class="invoice-info">
                <div class="invoice-client">${escapeHtml(invoice.cliente)}</div>
                <div class="invoice-client-details">
                    ${invoice.telefono ? `📞 ${escapeHtml(invoice.telefono)}` : ''}
                    ${invoice.direccion ? `📍 ${escapeHtml(invoice.direccion)}` : ''}
                </div>
                <div class="invoice-details">
                    ${invoice.fecha} • ${escapeHtml(invoice.proyecto || 'Sin proyecto')}
                    ${invoice.estado ? `<span class="status-badge status-${escapeHtml(invoice.estado)}"> ${escapeHtml(invoice.estado)}</span>` : ''}
                </div>
                <div class="invoice-time-status">
                    <span class="time-badge time-status-${timeStatusColor}">${timeStatusEmoji} ${daysAgo} días</span>
                </div>
            </div>
            <div class="invoice-amounts">
                <div class="amount-row">
                    <span class="amount-label">Monto:</span>
                    <span class="amount-value">$${monto.toFixed(2)}</span>
                </div>
                <div class="amount-row">
                    <span class="amount-label">IVA (19%):</span>
                    <span class="amount-value">$${iva.toFixed(2)}</span>
                </div>
                <div class="amount-row total-amount">
                    <span class="amount-label">Total:</span>
                    <span class="amount-value">$${total.toFixed(2)}</span>
                </div>
            </div>
            <button class="btn-delete" onclick="deleteInvoice(${realIndex})" title="Eliminar factura">🗑️</button>
        </div>
    `;
    }).join('');
}

// ============================================================================
// ACTUALIZACION DE UI
// ============================================================================

function updateUI() {
    document.getElementById('totalInvoices').textContent = state.invoices.length;
    
    const totalAmount = state.invoices.reduce((sum, inv) => sum + inv.monto, 0);
    document.getElementById('totalAmount').textContent = `$${totalAmount.toFixed(2)}`;
    
    const totalTaxes = state.invoices.reduce((sum, inv) => sum + inv.impuestos, 0);
    document.getElementById('totalTaxes').textContent = `$${totalTaxes.toFixed(2)}`;
    
    if (state.filteredInvoices.length === 0 && state.invoices.length > 0) {
        applyFilters();
    } else if (state.invoices.length > 0) {
        renderResults();
    }
}

// ============================================================================
// ALMACENAMIENTO LOCAL Y FIREBASE
// ============================================================================

function saveInvoicesToStorage() {
    try {
        localStorage.setItem('invoices', JSON.stringify(state.invoices));
    } catch (e) {
        console.error('Error al guardar en localStorage:', e);
    }
}

function saveInvoicesToFirebase() {
    if (!isFirebaseReady || !db) {
        saveInvoicesToStorage();
        return;
    }
    
    try {
        db.ref(`invoices/${SHARED_INVOICE_ID}`).set(state.invoices).catch((error) => {
            console.error('Error guardando en Firebase:', error);
            saveInvoicesToStorage();
        });
    } catch (e) {
        console.error('Error al guardar en Firebase:', e);
        saveInvoicesToStorage();
    }
}

function loadInvoicesFromStorage() {
    try {
        const stored = localStorage.getItem('invoices');
        if (stored) {
            state.invoices = JSON.parse(stored);
            state.filteredInvoices = [...state.invoices];
            updateUI();
            applyFilters();
        }
    } catch (e) {
        console.error('Error al cargar desde localStorage:', e);
    }
}

function loadInvoicesFromFirebase() {
    if (!isFirebaseReady || !db) {
        loadInvoicesFromStorage();
        return;
    }
    
    try {
        db.ref(`invoices/${SHARED_INVOICE_ID}`).on('value', (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                state.invoices = Array.isArray(data) ? data : [];
            } else {
                state.invoices = [];
                loadInvoicesFromStorage();
                return;
            }
            state.filteredInvoices = [...state.invoices];
            updateUI();
            applyFilters();
        }, (error) => {
            console.error('Error cargando de Firebase:', error);
            loadInvoicesFromStorage();
        });
    } catch (e) {
        console.error('Error al cargar desde Firebase:', e);
        loadInvoicesFromStorage();
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
    let csv = 'ID,Fecha,Cliente,RUT,Email,Teléfono,Dirección,Monto,Impuestos (19%),Total,Tipo de Servicio,Estado\n';
    
    data.forEach(invoice => {
        const monto = invoice.monto || 0;
        const impuestos = invoice.impuestos || 0;
        const total = invoice.total || (monto + impuestos);
        const row = [
            `"${(invoice.id || '').replace(/"/g, '""')}"`,
            `"${invoice.fecha || ''}"`,
            `"${(invoice.cliente || '').replace(/"/g, '""')}"`,
            `"${(invoice.rut || '').replace(/"/g, '""')}"`,
            `"${(invoice.email || '').replace(/"/g, '""')}"`,
            `"${(invoice.telefono || '').replace(/"/g, '""')}"`,
            `"${(invoice.direccion || '').replace(/"/g, '""')}"`,
            `"${monto.toFixed(2)}"`,
            `"${impuestos.toFixed(2)}"`,
            `"${total.toFixed(2)}"`,
            `"${(invoice.proyecto || '').replace(/"/g, '""')}"`,
            `"${(invoice.estado || 'pendiente').replace(/"/g, '""')}"`
        ].join(',');
        csv += row + '\n';
    });
    
    const totalMonto = data.reduce((sum, inv) => sum + (inv.monto || 0), 0);
    const totalImpuestos = data.reduce((sum, inv) => sum + (inv.impuestos || 0), 0);
    const totalGeneral = totalMonto + totalImpuestos;
    
    csv += '\n"TOTAL","","","","","","","' + totalMonto.toFixed(2) + '","' + totalImpuestos.toFixed(2) + '","' + totalGeneral.toFixed(2) + '","",""\n';
    
    const BOM = '\uFEFF';
    const dataBlob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
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
    let html = `<html><head><meta charset="utf-8"><title>Reporte de Facturas</title><style>body { font-family: Arial, sans-serif; margin: 20px; }h1 { color: #1B5E4F; text-align: center; }table { width: 100%; border-collapse: collapse; margin-top: 20px; }th { background-color: #1B5E4F; color: white; padding: 10px; text-align: left; }td { padding: 8px; border-bottom: 1px solid #ddd; }tr:hover { background-color: #f5f5f5; }.total-row { font-weight: bold; background-color: #2A7A68; color: white; }.summary { margin-top: 20px; }.summary-item { margin: 10px 0; }</style></head><body><h1>Reporte de Facturas</h1><div class="summary"><div class="summary-item"><strong>Total Facturas:</strong> ${data.length}</div><div class="summary-item"><strong>Fecha de Generación:</strong> ${new Date().toLocaleString('es-ES')}</div><div class="summary-item"><strong>Monto Total:</strong> $${data.reduce((sum, inv) => sum + inv.monto, 0).toFixed(2)}</div><div class="summary-item"><strong>Impuestos Totales (19%):</strong> $${data.reduce((sum, inv) => sum + inv.impuestos, 0).toFixed(2)}</div><div class="summary-item"><strong>Total General:</strong> $${data.reduce((sum, inv) => sum + (inv.total || (inv.monto + inv.impuestos)), 0).toFixed(2)}</div></div><table><thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>RUT</th><th>Email</th><th>Monto</th><th>Impuestos (19%)</th><th>Total</th><th>Tipo de Servicio</th><th>Estado</th></tr></thead><tbody>`;
    
    let totalMonto = 0;
    let totalImpuestos = 0;
    
    data.forEach(invoice => {
        const total = invoice.total || (invoice.monto + invoice.impuestos);
        totalMonto += invoice.monto;
        totalImpuestos += invoice.impuestos;
        
        html += `<tr><td>${invoice.id}</td><td>${invoice.fecha}</td><td>${invoice.cliente}</td><td>${invoice.rut || '-'}</td><td>${invoice.email || '-'}</td><td>$${invoice.monto.toFixed(2)}</td><td>$${invoice.impuestos.toFixed(2)}</td><td>$${total.toFixed(2)}</td><td>${invoice.proyecto}</td><td>${invoice.estado || 'pendiente'}</td></tr>`;
    });
    
    const totalGeneral = totalMonto + totalImpuestos;
    
    html += `</tbody></table><table style="margin-top: 20px; width: 100%;"><tr class="total-row"><td colspan="5">TOTAL</td><td>$${totalMonto.toFixed(2)}</td><td>$${totalImpuestos.toFixed(2)}</td><td colspan="3">$${totalGeneral.toFixed(2)}</td></tr></table></body></html>`;
    
    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
    
    setTimeout(() => {
        newWindow.print();
    }, 250);
    
    showMessage('Abriendo vista previa para PDF. Usa Imprimir para guardar como PDF', 'success');
}

// ============================================================================
// UTILIDADES
// ============================================================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
    if (!dateString || typeof dateString !== 'string') return '00000000';
    const parts = dateString.split('/');
    if (parts.length !== 3) return '00000000';
    const [day, month, year] = parts;
    return `${year}${month}${day}`;
}

function isDateGreaterOrEqual(date1, date2) {
    return dateToComparable(date1) >= dateToComparable(date2);
}

function isDateLessOrEqual(date1, date2) {
    return dateToComparable(date1) <= dateToComparable(date2);
}

function generateNextInvoiceId() {
    let maxNumber = 0;
    state.invoices.forEach(inv => {
        const match = inv.id.match(/FAC-(\d+)/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) maxNumber = num;
        }
    });
    
    const nextId = `FAC-${String(maxNumber + 1).padStart(3, '0')}`;
    return nextId;
}

function calculateTaxes() {
    const montoInput = document.getElementById('invoiceMonto');
    const taxesInput = document.getElementById('invoiceTaxes');
    const totalInput = document.getElementById('invoiceTotal');
    
    const monto = parseFloat(montoInput.value) || 0;
    const impuestos = monto * 0.19;
    const total = monto + impuestos;
    
    taxesInput.value = impuestos.toFixed(2);
    totalInput.value = total.toFixed(2);
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

function formatDateFromInput(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function deleteInvoice(index) {
    if (index < 0 || index >= state.invoices.length) {
        showMessage('Error: No se encontró la factura', 'error');
        return;
    }
    
    const invoice = state.invoices[index];
    
    if (confirm(`¿Estás seguro de que deseas eliminar la factura ${invoice.id}?`)) {
        state.invoices.splice(index, 1);
        saveInvoicesToFirebase();
        showMessage(`Factura ${invoice.id} eliminada exitosamente`, 'success');
        updateUI();
        applyFilters();
    }
}

function calculateDaysSinceService(dateString) {
    const [day, month, year] = dateString.split('/');
    const invoiceDate = new Date(year, month - 1, day, 12, 0, 0);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const diffTime = today - invoiceDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function getTimeStatusColor(daysAgo) {
    if (daysAgo <= 14) {
        return 'green';
    } else if (daysAgo <= 29) {
        return 'orange';
    } else {
        return 'red';
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
