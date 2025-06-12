// 1. Constants and Initial Data
const cdi_rates = { // Historical CDI rates (YYYY-MM: rate)
    "2023-01": 0.0112, "2023-02": 0.0104, "2023-03": 0.0117, "2023-04": 0.0100,
    "2023-05": 0.0112, "2023-06": 0.0107, "2023-07": 0.0107, "2023-08": 0.0114,
    "2023-09": 0.0097, "2023-10": 0.0090, "2023-11": 0.0092, "2023-12": 0.0080,
    "2024-01": 0.0100, "2024-02": 0.0080, "2024-03": 0.0083, "2024-04": 0.0085,
    // Add more historical data as needed
};

const amortization_percentages = [
    0.0100, 0.0100, 0.0100, 0.0100, 0.0100, 0.0100, 0.0100, 0.0100, 0.0100, 0.0100, // 1-10
    0.0100, 0.0100, 0.0150, 0.0150, 0.0150, 0.0150, 0.0150, 0.0150, 0.0150, 0.0150, // 11-20
    0.0150, 0.0150, 0.0200, 0.0200, 0.0200, 0.0200, 0.0200, 0.0200, 0.0200, 0.0200, // 21-30
    0.0200, 0.0200, 0.0250, 0.0250, 0.0250, 0.0250, 0.0250, 0.0250, 0.0250, 0.0250, // 31-40
    0.0250, 0.0250, 0.0300, 0.0300, 0.0300, 0.0300, 0.0300, 0.0300, 0.0300, 0.0300, // 41-50
    0.0300, 0.0300, 0.0300, 0.0300, 0.0300                                          // 51-55
];

// Global store for calculation results
window.df_amortization_js = [];
window.summary_data_js = {};

// 2. DOM Element References
const valorPrincipalInput = document.getElementById('valorPrincipal');
const dataInicioInput = document.getElementById('dataInicio');
const taxaSpreadMensalInput = document.getElementById('taxaSpreadMensal');
const taxaCdiMensalProjecaoInput = document.getElementById('taxaCdiMensalProjecao');

const btnCalcularAmortizacao = document.getElementById('btnCalcularAmortizacao');
const btnExportarExcel = document.getElementById('btnExportarExcel');
const btnVisualizarResumo = document.getElementById('btnVisualizarResumo');

const corpoTabelaAmortizacao = document.getElementById('corpoTabelaAmortizacao');
const dadosResumo = document.getElementById('dadosResumo');

// 3. Event Listeners
// Ensure DOM is loaded before attaching listeners if script is in <head>
// If script is at the end of <body>, this is not strictly necessary but good practice.
document.addEventListener('DOMContentLoaded', () => {
    // Re-fetch elements inside DOMContentLoaded to ensure they are available
    const valorPrincipalInput = document.getElementById('valorPrincipal');
    const dataInicioInput = document.getElementById('dataInicio');
    const taxaSpreadMensalInput = document.getElementById('taxaSpreadMensal');
    const taxaCdiMensalProjecaoInput = document.getElementById('taxaCdiMensalProjecao');

    const btnCalcularAmortizacao = document.getElementById('btnCalcularAmortizacao');
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    const btnVisualizarResumo = document.getElementById('btnVisualizarResumo');

    const corpoTabelaAmortizacao = document.getElementById('corpoTabelaAmortizacao');
    const dadosResumo = document.getElementById('dadosResumo');

    if (!valorPrincipalInput || !dataInicioInput || !taxaSpreadMensalInput || !taxaCdiMensalProjecaoInput ||
        !btnCalcularAmortizacao || !btnExportarExcel || !btnVisualizarResumo ||
        !corpoTabelaAmortizacao || !dadosResumo) {
        console.error("Um ou mais elementos do DOM não foram encontrados. Verifique os IDs no HTML e script.js.");
        alert("Erro crítico: Elementos da página não encontrados. A aplicação pode não funcionar corretamente.");
        return;
    }

    btnCalcularAmortizacao.addEventListener('click', handleCalculateAmortization);
    btnVisualizarResumo.addEventListener('click', showSummary);
    btnExportarExcel.addEventListener('click', exportToExcel);

    // Initial state for summary
    dadosResumo.textContent = 'Preencha os campos e clique em "Calcular Amortização" para gerar a tabela.\nDepois, clique em "Visualizar Resumo" para ver os detalhes aqui.';
    console.log("script.js loaded and event listeners attached.");
});


// Helper for date iteration
function addMonths(date, months) {
    const d = new Date(date);
    const originalDay = d.getDate();
    d.setMonth(d.getMonth() + months);
    // If the month changed but the day rolled over (e.g., Jan 31 + 1 month = Mar 3 instead of Feb 28/29)
    // set the day to the last day of the correct month.
    if (d.getDate() !== originalDay) {
      d.setDate(0);
    }
    return d;
}

// Formatting helpers
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercentage(value, decimalPlaces = 4) {
    return (value * 100).toFixed(decimalPlaces) + '%';
}

function formatDate(date) {
    // Ensure date is a Date object
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}/${month}/${year}`;
}

// 4. get_cdi_rate Function
function get_cdi_rate(date, cdiProjectionRate) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // JavaScript months are 0-indexed
    const yearMonth = `${year}-${month}`;

    if (cdi_rates.hasOwnProperty(yearMonth)) {
        return cdi_rates[yearMonth];
    }
    return cdiProjectionRate;
}

// 5. handleCalculateAmortization Function
function handleCalculateAmortization() {
    // Re-fetch elements inside the handler to ensure they are the most current references
    // (though for direct ID lookups, it's usually fine, this is safer if elements could be recreated)
    const vpInput = document.getElementById('valorPrincipal');
    const diInput = document.getElementById('dataInicio');
    const tsmInput = document.getElementById('taxaSpreadMensal');
    const tcmInput = document.getElementById('taxaCdiMensalProjecao');
    const ctAmortizacao = document.getElementById('corpoTabelaAmortizacao');
    const dResumo = document.getElementById('dadosResumo');

    // Get input values
    const principal = parseFloat(vpInput.value);
    const startDateString = diInput.value; // Format YYYY-MM-DD
    const monthlySpread = parseFloat(tsmInput.value);
    const cdiProjectionPercent = parseFloat(tcmInput.value);

    // Validate inputs
    if (isNaN(principal) || principal <= 0) {
        alert("Por favor, insira um Valor Principal válido.");
        return;
    }
    if (!startDateString) {
        alert("Por favor, selecione a Data Início.");
        return;
    }
    // Safari and Firefox might parse YYYY-MM-DD as UTC, so specify local time.
    const [year, month, day] = startDateString.split('-').map(Number);
    const startDate = new Date(year, month - 1, day); // Month is 0-indexed

    if (isNaN(startDate.getTime())) {
        alert("Data Início inválida. Use o formato AAAA-MM-DD.");
        return;
    }
    if (isNaN(monthlySpread) || monthlySpread < 0) {
        // Placeholder already suggests 0.0045 for 0.45%, so direct float is expected.
        alert("Por favor, insira uma Taxa Spread Mensal válida (ex: 0.0045 para 0.45%).");
        return;
    }
    if (isNaN(cdiProjectionPercent) || cdiProjectionPercent < 0) {
        alert("Por favor, insira uma Taxa CDI mensal para projeção válida (ex: 0.90 para 0.90%).");
        return;
    }
    const cdiProjectionRate = cdiProjectionPercent / 100; // Convert 0.90 to 0.0090

    // Clear previous results
    ctAmortizacao.innerHTML = '';
    dResumo.textContent = 'Calculando...';
    window.df_amortization_js = [];
    window.summary_data_js = {};

    let currentBalance = principal;
    let currentDate = new Date(startDate); // Use the parsed local date
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let totalPayments = 0;

    const calculatedRows = [];

    for (let i = 0; i < 55; i++) {
        const installmentNumber = i + 1;
        const initialBalance = currentBalance;

        const cdiRate = get_cdi_rate(currentDate, cdiProjectionRate);
        const monthlyTotalRate = cdiRate + monthlySpread;
        const monthlyInterest = initialBalance * monthlyTotalRate;

        let amortPercentage = amortization_percentages[i];
        // Ensure amortPercentage is defined for the installment
        if (typeof amortPercentage === 'undefined') {
            console.error(`Porcentagem de amortização não definida para a parcela ${installmentNumber}. Usando 0.`);
            amortPercentage = 0; // Fallback or handle error appropriately
        }

        let principalPayment = initialBalance * amortPercentage;

        if (installmentNumber === 55) {
            principalPayment = initialBalance; // Pay off remaining balance
        }

        let totalPayment = monthlyInterest + principalPayment;
        let newBalance = initialBalance - principalPayment;

        // Final adjustment for the last installment to ensure balance is exactly zero
        if (installmentNumber === 55) {
            newBalance = 0;
            // principalPayment was already set to initialBalance
            totalPayment = monthlyInterest + initialBalance;
        } else if (newBalance < 0.005 && newBalance > -0.005 && newBalance !==0) {
            // If very close to zero (potential floating point dust), adjust to zero
            principalPayment += newBalance; // Add the remainder (if newBalance is negative) or subtract (if positive)
            newBalance = 0;
            totalPayment = monthlyInterest + principalPayment;
        }


        const rowData = {
            parcela: installmentNumber,
            vencimento: new Date(currentDate),
            amortPercentage: amortPercentage,
            cdiRate: cdiRate,
            monthlyTotalRate: monthlyTotalRate,
            initialBalance: initialBalance,
            monthlyInterest: monthlyInterest,
            principalPayment: principalPayment,
            totalPayment: totalPayment,
            newBalance: newBalance
        };
        calculatedRows.push(rowData);

        const tr = ctAmortizacao.insertRow();
        tr.insertCell().textContent = installmentNumber;
        tr.insertCell().textContent = formatDate(currentDate);
        tr.insertCell().textContent = formatPercentage(amortPercentage, 2);
        tr.insertCell().textContent = formatPercentage(cdiRate, 4);
        tr.insertCell().textContent = formatPercentage(monthlyTotalRate, 4);
        tr.insertCell().textContent = formatCurrency(initialBalance);
        tr.insertCell().textContent = formatCurrency(monthlyInterest);
        tr.insertCell().textContent = formatCurrency(principalPayment);
        tr.insertCell().textContent = formatCurrency(totalPayment);
        tr.insertCell().textContent = formatCurrency(newBalance);

        totalInterestPaid += monthlyInterest;
        totalPrincipalPaid += principalPayment;
        totalPayments += totalPayment; // Accumulate actual total payments
        currentBalance = newBalance;
        currentDate = addMonths(currentDate, 1);
    }

    window.df_amortization_js = calculatedRows;
    window.summary_data_js = {
        principal_js: principal,
        total_interest_paid_js: totalInterestPaid,
        total_principal_paid_js: totalPrincipalPaid,
        total_payments_js: totalPayments // Use the accumulated sum
    };

    dResumo.textContent = 'Cálculo de amortização concluído! Clique em "Visualizar Resumo".';
    alert("Cálculo de amortização concluído!");
}

// 6. showSummary Function
function showSummary() {
    const dResumo = document.getElementById('dadosResumo');
    if (window.df_amortization_js.length === 0) {
        alert("Calcule a amortização primeiro!");
        dResumo.textContent = 'Nenhum cálculo para resumir. Por favor, calcule a amortização primeiro.';
        return;
    }

    const { principal_js, total_interest_paid_js, total_principal_paid_js, total_payments_js } = window.summary_data_js;
    const payments = window.df_amortization_js.map(row => row.totalPayment);
    const avg_payment = total_payments_js / payments.length;
    const min_payment = Math.min(...payments);
    const max_payment = Math.max(...payments);

    const cet_efetivo_percent = (total_payments_js / principal_js - 1) * 100;

    const tsmInput = document.getElementById('taxaSpreadMensal');
    const tcmInput = document.getElementById('taxaCdiMensalProjecao');

    const summaryText = `
Resumo da Simulação de Amortização:
--------------------------------------------------
Valor Principal Financiado: ${formatCurrency(principal_js)}
Total de Juros Pagos:       ${formatCurrency(total_interest_paid_js)}
Total de Amortizações:      ${formatCurrency(total_principal_paid_js)} (Soma das amortizações puras)
Total de Pagamentos:        ${formatCurrency(total_payments_js)} (Soma de Juros + Amortizações)
--------------------------------------------------
Custo Efetivo Total (Operação): ${cet_efetivo_percent.toFixed(4)}%
--------------------------------------------------
Pagamento Médio da Parcela: ${formatCurrency(avg_payment)}
Menor Pagamento da Parcela: ${formatCurrency(min_payment)}
Maior Pagamento da Parcela: ${formatCurrency(max_payment)}
--------------------------------------------------
Número de Parcelas:         ${window.df_amortization_js.length}
Primeiro Vencimento:        ${window.df_amortization_js.length > 0 ? formatDate(window.df_amortization_js[0].vencimento) : 'N/A'}
Último Vencimento:          ${window.df_amortization_js.length > 0 ? formatDate(window.df_amortization_js[window.df_amortization_js.length - 1].vencimento) : 'N/A'}
--------------------------------------------------
Spread Mensal Aplicado:     ${formatPercentage(parseFloat(tsmInput.value), 4)}
Projeção CDI Mensal Usada:  ${formatPercentage(parseFloat(tcmInput.value) / 100, 4)}
(Nota: CDI histórico é usado para datas passadas se disponível)
    `;
    dResumo.textContent = summaryText.trim();
}

// 7. exportToExcel Function (CSV Export)
function exportToExcel() {
    if (window.df_amortization_js.length === 0) {
        alert("Calcule a amortização primeiro!");
        return;
    }

    const headers = [
        'Parcela', 'Vencimento', '% Amort.', 'CDI (%)', 'Taxa Total (%)',
        'Saldo Inicial (R$)', 'Juros (R$)', 'Amortização (R$)', 'Parcela Total (R$)', 'Saldo Final (R$)'
    ];

    const csvRows = window.df_amortization_js.map(row => {
        return [
            row.parcela,
            formatDate(row.vencimento),
            (row.amortPercentage * 100).toFixed(2).replace('.',','), // Use comma for decimal in CSV for Excel PT-BR
            (row.cdiRate * 100).toFixed(4).replace('.',','),
            (row.monthlyTotalRate * 100).toFixed(4).replace('.',','),
            row.initialBalance.toFixed(2).replace('.',','),
            row.monthlyInterest.toFixed(2).replace('.',','),
            row.principalPayment.toFixed(2).replace('.',','),
            row.totalPayment.toFixed(2).replace('.',','),
            row.newBalance.toFixed(2).replace('.',',')
        ].join(';'); // Use semicolon as delimiter for Excel PT-BR
    });

    // Add BOM for UTF-8 Excel compatibility
    const BOM = "\uFEFF";
    const csvContent = BOM + headers.join(';') + '\n' + csvRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "amortizacao_dfa_defense.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert("Exportação para CSV concluída!");
    } else {
        alert("Seu navegador não suporta a exportação direta. Tente um navegador mais moderno ou copie os dados da tabela.");
    }
}

console.log("script.js being parsed.");
