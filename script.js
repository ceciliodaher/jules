// 1. Constants and Initial Data
const cdi_rates = { // Historical CDI rates (YYYY-MM: rate)
    "2023-01": 0.0112, "2023-02": 0.0104, "2023-03": 0.0117, "2023-04": 0.0100,
    "2023-05": 0.0112, "2023-06": 0.0107, "2023-07": 0.0107, "2023-08": 0.0114,
    "2023-09": 0.0097, "2023-10": 0.0090, "2023-11": 0.0092, "2023-12": 0.0080,
    "2024-01": 0.0100, "2024-02": 0.0080, "2024-03": 0.0083, "2024-04": 0.0085,
};

window.df_amortization_js = [];
window.summary_data_js = {};

// --- UTILITY FUNCTIONS ---
function parseBrazilianNumber(stringValue) {
    if (typeof stringValue !== 'string' || stringValue.trim() === "") return NaN;
    // Remove "R$" prefix if present, then standardize number format
    const cleanedString = stringValue.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.');
    const number = parseFloat(cleanedString);
    return isNaN(number) ? NaN : number;
}
function formatBrazilianCurrency(numberValue) {
    if (isNaN(parseFloat(numberValue))) return "";
    return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatBrazilianPercentage(numberValue, decimals = 2) {
    if (isNaN(parseFloat(numberValue))) return "";
    const percentage = numberValue * 100;
    return percentage.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + '%';
}
function addMonths(date, months) {
    const d = new Date(date);
    const originalDay = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== originalDay) {
        d.setDate(0);
    }
    return d;
}
function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'N/A';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}/${month}/${year}`;
}

// --- DOM Element References ---
let valorPrincipalInput, dataInicioInput, taxaSpreadMensalInput, numeroParcelasInput, mesesCarenciaInput;
let tipoAmortizacaoRadios, containerAmortizacaoFixaCampos, percentualAmortizacaoFixaInput, containerAmortizacaoVariavelCampos;
let containerCdiFuturoCampos, calculationErrorsDiv; // Added calculationErrorsDiv
let btnCalcularAmortizacao, btnExportarExcel, btnVisualizarResumo;
let corpoTabelaAmortizacao, dadosResumo;


// --- CDI Rate Function ---
/**
 * Gets CDI rate for a given date, checking historical, then future inputs.
 * @param {Date} date - The date for which to find the CDI rate.
 * @param {Object} futureCdiValues - An object {'YYYY-MM': rate} from parsed future CDI inputs.
 * @returns {number} The CDI rate (decimal), or NaN if not found/invalid.
 */
function get_cdi_rate_html(date, futureCdiValues) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const yearMonthKey = `${year}-${month}`;

    if (cdi_rates.hasOwnProperty(yearMonthKey)) {
        return cdi_rates[yearMonthKey];
    }
    if (futureCdiValues.hasOwnProperty(yearMonthKey)) {
        return futureCdiValues[yearMonthKey]; // Assumes futureCdiValues stores rates as decimals
    }
    console.warn(`CDI rate for ${yearMonthKey} not found in historical or future inputs.`);
    return NaN; // Indicates missing or invalid input for a required future month
}


// --- DYNAMIC UI GENERATION (from previous step, largely unchanged) ---
function generateCdiInputs() {
    if (!dataInicioInput || !numeroParcelasInput || !containerCdiFuturoCampos) return;
    containerCdiFuturoCampos.innerHTML = '';
    const startDateString = dataInicioInput.value;
    const numParcelas = parseInt(numeroParcelasInput.value);

    if (!startDateString || isNaN(numParcelas) || numParcelas <= 0) {
        containerCdiFuturoCampos.innerHTML = '<p>Informe Data Início e Número de Parcelas válidos para gerar os campos de CDI futuro.</p>';
        return;
    }
    const [year, monthStr, day] = startDateString.split('-').map(Number);
    let currentDate = new Date(year, monthStr - 1, day);
     if (isNaN(currentDate.getTime())) {
         containerCdiFuturoCampos.innerHTML = '<p>Data Início inválida.</p>';
        return;
    }
    let futureCdiFieldsGenerated = 0;
    for (let i = 0; i < numParcelas; i++) {
        const currentYear = currentDate.getFullYear();
        const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const yearMonthKey = `${currentYear}-${currentMonth}`;
        if (!cdi_rates.hasOwnProperty(yearMonthKey)) {
            futureCdiFieldsGenerated++;
            const label = document.createElement('label');
            label.setAttribute('for', `cdiFuturo_${yearMonthKey}`);
            label.textContent = `CDI Mês ${currentMonth}/${currentYear} (%):`;
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `cdiFuturo_${yearMonthKey}`;
            input.name = `cdiFuturo_${yearMonthKey}`;
            input.className = 'cdi-futuro-input';
            input.placeholder = '0,90';
            containerCdiFuturoCampos.appendChild(label);
            containerCdiFuturoCampos.appendChild(input);
            containerCdiFuturoCampos.appendChild(document.createElement('br'));
        }
        currentDate = addMonths(currentDate, 1);
    }
    if (futureCdiFieldsGenerated === 0 && numParcelas > 0) {
        containerCdiFuturoCampos.innerHTML = '<p>Todas as parcelas utilizam CDI histórico conhecido ou não são necessárias projeções futuras.</p>';
    } else if (numParcelas <=0) {
         containerCdiFuturoCampos.innerHTML = '<p>Número de parcelas deve ser maior que zero.</p>';
    }
}

function generateAmortizacaoVariavelInputs() {
    if (!numeroParcelasInput || !containerAmortizacaoVariavelCampos) return;
    containerAmortizacaoVariavelCampos.innerHTML = '';
    const numParcelas = parseInt(numeroParcelasInput.value);
    const carencia = parseInt(mesesCarenciaInput.value) || 0;
    const numAmortParcelas = numParcelas - carencia;


    if (isNaN(numParcelas) || numParcelas <= 0) {
        containerAmortizacaoVariavelCampos.innerHTML = '<p>Informe um Número de Parcelas válido.</p>';
        return;
    }
    if (numAmortParcelas <= 0) {
        containerAmortizacaoVariavelCampos.innerHTML = '<p>Não há parcelas de amortização (Nº Parcelas <= Meses Carência).</p>';
        return;
    }


    const totalPercentageSpan = document.createElement('span');
    totalPercentageSpan.id = 'totalAmortizacaoVariavel';
    totalPercentageSpan.textContent = 'Soma dos Percentuais: 0,00%';
    const totalLabel = document.createElement('p');
    totalLabel.appendChild(totalPercentageSpan);

    for (let i = 1; i <= numAmortParcelas; i++) {
        const label = document.createElement('label');
        label.setAttribute('for', `amortVariavel_${i}`);
        label.textContent = `Amort. da Parcela de Pagamento ${i} (% sobre Principal):`;
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `amortVariavel_${i}`;
        input.name = `amortVariavel_${i}`;
        input.className = 'amort-variavel-input';
        input.placeholder = 'Ex: 1,50';
        input.addEventListener('input', updateTotalAmortizacaoVariavelSum);
        containerAmortizacaoVariavelCampos.appendChild(label);
        containerAmortizacaoVariavelCampos.appendChild(input);
         if (i % 2 === 0) { containerAmortizacaoVariavelCampos.appendChild(document.createElement('br')); }
    }
    containerAmortizacaoVariavelCampos.appendChild(document.createElement('hr'));
    containerAmortizacaoVariavelCampos.appendChild(totalLabel);
    updateTotalAmortizacaoVariavelSum();
}

function updateTotalAmortizacaoVariavelSum() {
    if (!containerAmortizacaoVariavelCampos) return;
    const inputs = containerAmortizacaoVariavelCampos.querySelectorAll('.amort-variavel-input');
    let sum = 0;
    inputs.forEach(input => {
        sum += parseBrazilianNumber(input.value) || 0;
    });
    const totalSpan = document.getElementById('totalAmortizacaoVariavel');
    if (totalSpan) {
        totalSpan.textContent = `Soma dos Percentuais: ${sum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`;
    }
}

// --- MAIN CALCULATION LOGIC ---
function handleCalculateAmortization() {
    calculationErrorsDiv.innerHTML = ''; // Clear previous errors
    corpoTabelaAmortizacao.innerHTML = '';
    dadosResumo.textContent = 'Calculando...';
    window.df_amortization_js = [];
    window.summary_data_js = {};

    // Gather Inputs
    const valorPrincipal = parseBrazilianNumber(valorPrincipalInput.value);
    const dataInicioString = dataInicioInput.value;
    const taxaSpreadMensal = parseBrazilianNumber(taxaSpreadMensalInput.value) / 100; // Convert "0,45" to 0.0045
    const numeroParcelasTotal = parseInt(numeroParcelasInput.value);
    const mesesCarencia = parseInt(mesesCarenciaInput.value);
    const tipoAmortizacao = document.querySelector('input[name="tipoAmortizacao"]:checked')?.value;

    let percentualAmortizacaoFixa = NaN;
    if (tipoAmortizacao === 'fixa') {
        percentualAmortizacaoFixa = parseBrazilianNumber(percentualAmortizacaoFixaInput.value) / 100;
    }

    const variableAmortPercentagesRaw = [];
    if (tipoAmortizacao === 'variavel') {
        document.querySelectorAll('.amort-variavel-input').forEach(input => {
            variableAmortPercentagesRaw.push(parseBrazilianNumber(input.value));
        });
    }

    const futureCdiInputs = document.querySelectorAll('.cdi-futuro-input');
    const futureCdiValues = {};
    futureCdiInputs.forEach(input => {
        const yearMonthKey = input.id.replace('cdiFuturo_', '');
        futureCdiValues[yearMonthKey] = parseBrazilianNumber(input.value) / 100; // Convert "0,90" to 0.0090
    });

    // Input Validation
    let errors = [];
    if (isNaN(valorPrincipal) || valorPrincipal <= 0) errors.push("Valor Principal inválido.");
    if (!dataInicioString) errors.push("Data Início não selecionada.");
    const [year, monthStr, day] = dataInicioString ? dataInicioString.split('-').map(Number) : [NaN, NaN, NaN];
    let dataInicioObj = new Date(year, monthStr - 1, day);
    if (isNaN(dataInicioObj.getTime())) errors.push("Data Início inválida.");

    if (isNaN(taxaSpreadMensal) || taxaSpreadMensal < 0) errors.push("Taxa Spread Mensal inválida.");
    if (isNaN(numeroParcelasTotal) || numeroParcelasTotal <= 0) errors.push("Número de Parcelas deve ser maior que zero.");
    if (isNaN(mesesCarencia) || mesesCarencia < 0) errors.push("Meses de Carência inválido.");
    if (mesesCarencia >= numeroParcelasTotal && numeroParcelasTotal > 0) errors.push("Meses de Carência deve ser menor que o Número de Parcelas.");
    if (!tipoAmortizacao) errors.push("Tipo de Amortização não selecionado.");

    if (tipoAmortizacao === 'fixa' && (isNaN(percentualAmortizacaoFixa) || percentualAmortizacaoFixa <=0)) {
        errors.push("Percentual de Amortização Fixo inválido ou não informado.");
    }

    const actualPaymentInstallments = numeroParcelasTotal - mesesCarencia;
    if (tipoAmortizacao === 'variavel') {
        if (variableAmortPercentagesRaw.length !== actualPaymentInstallments && actualPaymentInstallments > 0) {
            errors.push(`Número de percentuais de amortização variável (${variableAmortPercentagesRaw.length}) não corresponde ao número de parcelas de pagamento (${actualPaymentInstallments}).`);
        }
        let sumVariableAmort = 0;
        for(const perc of variableAmortPercentagesRaw) {
            if(isNaN(perc) || perc < 0) errors.push("Um ou mais percentuais de amortização variável são inválidos.");
            sumVariableAmort += perc;
        }
        if (Math.abs(sumVariableAmort - 100) > 0.01 && actualPaymentInstallments > 0) { // Check sum is close to 100%
            errors.push(`A soma dos percentuais de amortização variável (${sumVariableAmort.toFixed(2)}%) deve ser aproximadamente 100%.`);
        }
    }

    if (tipoAmortizacao === 'price') {
        errors.push("Cálculo Tabela Price não implementado. Selecione outro tipo de amortização.");
    }


    // Check all necessary future CDI rates
    let tempDate = new Date(dataInicioObj);
    for (let i = 0; i < numeroParcelasTotal; i++) {
        const tempYear = tempDate.getFullYear();
        const tempMonth = (tempDate.getMonth() + 1).toString().padStart(2, '0');
        const tempYearMonthKey = `${tempYear}-${tempMonth}`;
        if (!cdi_rates.hasOwnProperty(tempYearMonthKey) && (!futureCdiValues.hasOwnProperty(tempYearMonthKey) || isNaN(futureCdiValues[tempYearMonthKey]))) {
            errors.push(`CDI futuro para ${tempMonth}/${tempYear} não informado ou inválido.`);
        }
        tempDate = addMonths(tempDate, 1);
    }


    if (errors.length > 0) {
        calculationErrorsDiv.innerHTML = errors.map(e => `<div>${e}</div>`).join('');
        dadosResumo.textContent = "Cálculo falhou devido a erros nos inputs.";
        return;
    }

    // --- Calculation Loop ---
    let currentBalance = valorPrincipal;
    let currentDate = new Date(dataInicioObj);
    let dfAmortizationData = [];
    let totalJurosPagos = 0;
    let totalAmortizacaoPaga = 0;

    for (let i = 0; i < numeroParcelasTotal; i++) {
        const parcelaNum = i + 1;
        const saldoDevedorInicialLoop = currentBalance;

        const cdiMes = get_cdi_rate_html(currentDate, futureCdiValues);
        // This check should ideally be covered by the pre-loop validation, but as a safeguard:
        if (isNaN(cdiMes)) {
            calculationErrorsDiv.innerHTML = `<div>Erro crítico: CDI para o mês ${formatDate(currentDate)} não pôde ser determinado.</div>`;
            return;
        }

        const taxaJurosMensalEfetiva = cdiMes + taxaSpreadMensal;
        const jurosMes = saldoDevedorInicialLoop * taxaJurosMensalEfetiva;
        let amortizacaoMes = 0;

        const isGracePeriod = i < mesesCarencia;

        if (!isGracePeriod) {
            const paymentInstallmentNum = i - mesesCarencia; // 0-indexed for variableAmortPercentagesRaw

            if (tipoAmortizacao === 'fixa') {
                amortizacaoMes = valorPrincipal * percentualAmortizacaoFixa;
            } else if (tipoAmortizacao === 'variavel') {
                // Ensure variableAmortPercentagesRaw[paymentInstallmentNum] is valid
                const currentAmortPerc = variableAmortPercentagesRaw[paymentInstallmentNum];
                if (typeof currentAmortPerc === 'number' && !isNaN(currentAmortPerc)) {
                    amortizacaoMes = valorPrincipal * (currentAmortPerc / 100);
                } else {
                     errors.push(`Percentual de amortização para parcela de pagamento ${paymentInstallmentNum + 1} é inválido.`);
                     // This state should ideally be caught by initial validation
                }
            } else if (tipoAmortizacao === 'sac') {
                 if (actualPaymentInstallments > 0) {
                    amortizacaoMes = valorPrincipal / actualPaymentInstallments;
                } else { // Should not happen if mesesCarencia < numeroParcelasTotal
                    amortizacaoMes = 0;
                }
            }
        } // Amortization is 0 during grace period

        // Final installment adjustment to ensure balance is cleared
        // This applies to the last *overall* installment, which is also the last *payment* installment
        if (parcelaNum === numeroParcelasTotal) {
            if (actualPaymentInstallments > 0) { // Only adjust if there were payment installments
                 // For SAC, fixed, and variable, the sum of amortizations might not perfectly match principal due to rounding or fixed % of original.
                 // So, the last amortization payment should be whatever is left.
                if (tipoAmortizacao === 'sac' || tipoAmortizacao === 'fixa' || tipoAmortizacao === 'variavel') {
                    amortizacaoMes = saldoDevedorInicialLoop;
                }
            } else { // No payment installments (entire period is grace, or principal paid at once if custom)
                // If there's a final balloon payment or similar, this logic would need to be specified.
                // For now, if all grace, amort remains 0 unless specified by variable/fixed logic on last period.
                // If the loan is structured such that the entire principal is paid at the end of grace:
                if (mesesCarencia === numeroParcelasTotal -1 && (tipoAmortizacao === 'fixa' || tipoAmortizacao === 'variavel')) {
                    //This case implies last parcel is the only payment parcel.
                    //The variable/fixed % should be 100% for that single payment parcel.
                } else if (mesesCarencia === numeroParcelasTotal) { // All grace period, no amortization
                    amortizacaoMes = 0;
                }
            }
        }

        // Ensure amortization doesn't exceed current balance unless it's the last payment clearing it
        if (amortizacaoMes > saldoDevedorInicialLoop && parcelaNum < numeroParcelasTotal) {
            amortizacaoMes = saldoDevedorInicialLoop; // Cap at current balance
        }


        const parcelaMes = jurosMes + amortizacaoMes;
        currentBalance -= amortizacaoMes;

        // Mitigate floating point issues for balance, especially for the last payment
        if (parcelaNum === numeroParcelasTotal) {
            currentBalance = 0;
        } else {
            currentBalance = parseFloat(currentBalance.toFixed(2)); // Keep 2 decimal places
        }

        // Store data for summary and export
        const rowData = {
            parcela: parcelaNum,
            vencimento: new Date(currentDate),
            diasUteis: 'N/A', // Placeholder, not calculated yet
            amortPercentage: isGracePeriod ? 0 : (tipoAmortizacao === 'fixa' ? percentualAmortizacaoFixa : (tipoAmortizacao === 'variavel' && variableAmortPercentagesRaw[i-mesesCarencia] ? variableAmortPercentagesRaw[i-mesesCarencia]/100 : (tipoAmortizacao === 'sac' && actualPaymentInstallments > 0 ? (1/actualPaymentInstallments) : 0))),
            cdiRate: cdiMes,
            spreadRate: taxaSpreadMensal,
            totalRate: taxaJurosMensalEfetiva,
            initialBalance: saldoDevedorInicialLoop,
            monthlyInterest: jurosMes,
            principalPayment: amortizacaoMes,
            totalPayment: parcelaMes,
            newBalance: currentBalance
        };
        dfAmortizationData.push(rowData);

        // Populate HTML table
        const tr = corpoTabelaAmortizacao.insertRow();
        tr.insertCell().textContent = parcelaNum;
        tr.insertCell().textContent = formatDate(currentDate);
        tr.insertCell().textContent = rowData.diasUteis; // Placeholder
        tr.insertCell().textContent = formatBrazilianPercentage(rowData.amortPercentage, 4); // % Amort. Principal
        tr.insertCell().textContent = formatBrazilianPercentage(cdiMes, 4); // CDI Hist/Proj.
        tr.insertCell().textContent = formatBrazilianPercentage(taxaSpreadMensal, 4); // Spread Contratual
        tr.insertCell().textContent = formatBrazilianPercentage(taxaJurosMensalEfetiva, 4); // Taxa Final Juros
        tr.insertCell().textContent = formatBrazilianCurrency(saldoDevedorInicialLoop); // Saldo Devedor Inicial
        tr.insertCell().textContent = formatBrazilianCurrency(jurosMes); // Juros
        tr.insertCell().textContent = formatBrazilianCurrency(amortizacaoMes); // Amortização Principal
        tr.insertCell().textContent = formatBrazilianCurrency(parcelaMes); // Parcela Total
        tr.insertCell().textContent = formatBrazilianCurrency(currentBalance); // Saldo Devedor Final

        totalJurosPagos += jurosMes;
        totalAmortizacaoPaga += amortizacaoMes;
        currentDate = addMonths(currentDate, 1);
    }

     if (errors.length > 0) { // Re-check for errors that might occur mid-calculation (e.g. variable perc invalid)
        calculationErrorsDiv.innerHTML = errors.map(e => `<div>${e}</div>`).join('');
        dadosResumo.textContent = "Cálculo falhou devido a erros nos inputs.";
        return;
    }

    window.df_amortization_js = dfAmortizationData;
    window.summary_data_js = {
        principal_js: valorPrincipal,
        total_interest_paid_js: totalJurosPagos,
        total_principal_paid_js: totalAmortizacaoPaga,
        total_payments_js: totalJurosPagos + totalAmortizacaoPaga,
        numero_parcelas_js: numeroParcelasTotal,
        meses_carencia_js: mesesCarencia,
        tipo_amortizacao_js: tipoAmortizacao,
        taxa_spread_js: taxaSpreadMensal,
        data_inicio_js: dataInicioObj,
        // Store other relevant inputs for summary if needed
    };

    dadosResumo.textContent = "Cálculo de amortização concluído! Visualize o resumo ou exporte para Excel.";
    showSummary(); // Call showSummary to update the display
}


// --- Summary Logic (Placeholder - Needs Update) ---
function showSummary() {
    const dResumo = document.getElementById('dadosResumo');
    if (window.df_amortization_js.length === 0) {
        dResumo.textContent = 'Nenhum cálculo para resumir. Por favor, calcule a amortização primeiro.';
        return;
    }

    const {
        principal_js, total_interest_paid_js, total_principal_paid_js, total_payments_js,
        numero_parcelas_js, meses_carencia_js, tipo_amortizacao_js, taxa_spread_js, data_inicio_js
    } = window.summary_data_js;

    const payments = window.df_amortization_js.map(row => row.totalPayment);
    const avg_payment = payments.length > 0 ? total_payments_js / payments.length : 0;
    const min_payment = payments.length > 0 ? Math.min(...payments) : 0;
    const max_payment = payments.length > 0 ? Math.max(...payments) : 0;

    const cet_efetivo_percent = (principal_js > 0) ? (total_payments_js / principal_js - 1) * 100 : 0;

    const summaryText = `
Resumo da Simulação de Amortização:
--------------------------------------------------
Valor Principal Financiado: ${formatBrazilianCurrency(principal_js)}
Tipo de Amortização:        ${tipo_amortizacao_js.toUpperCase()}
Número de Parcelas:         ${numero_parcelas_js} (Total)
Meses de Carência:          ${meses_carencia_js} (Juros pagos, sem amortização do principal)
--------------------------------------------------
Total de Juros Pagos:       ${formatBrazilianCurrency(total_interest_paid_js)}
Total de Amortizações:      ${formatBrazilianCurrency(total_principal_paid_js)}
Total de Pagamentos:        ${formatBrazilianCurrency(total_payments_js)}
--------------------------------------------------
Custo Efetivo Total (Operação): ${cet_efetivo_percent.toLocaleString('pt-BR', {minimumFractionDigits: 4, maximumFractionDigits: 4})}%
--------------------------------------------------
Pagamento Médio da Parcela: ${formatBrazilianCurrency(avg_payment)}
Menor Pagamento da Parcela: ${formatBrazilianCurrency(min_payment)}
Maior Pagamento da Parcela: ${formatBrazilianCurrency(max_payment)}
--------------------------------------------------
Primeiro Vencimento:        ${window.df_amortization_js.length > 0 ? formatDate(window.df_amortization_js[0].vencimento) : 'N/A'}
Último Vencimento:          ${window.df_amortization_js.length > 0 ? formatDate(window.df_amortization_js[window.df_amortization_js.length - 1].vencimento) : 'N/A'}
--------------------------------------------------
Spread Mensal Aplicado:     ${formatBrazilianPercentage(taxa_spread_js, 4)}
(Nota: CDI histórico é usado para datas passadas. Projeções são usadas para datas futuras.)
    `;
    dResumo.textContent = summaryText.trim();
}

// --- Export Logic (Placeholder - Needs Update) ---
function exportToExcel() {
    if (window.df_amortization_js.length === 0) {
        alert("Calcule a amortização primeiro!");
        return;
    }

    const headers = [
        'Parcela', 'Vencimento', 'Dias Úteis', '% Amort. Principal', 'CDI Hist/Proj. (% a.m.)',
        'Spread Contratual (% a.m.)', 'Taxa Final Juros (% a.m.)', 'Saldo Devedor Inicial (R$)',
        'Juros (R$)', 'Amortização Principal (R$)', 'Parcela (Juros + Amort.) (R$)', 'Saldo Devedor Final (R$)'
    ];

    const csvRows = window.df_amortization_js.map(row => {
        return [
            row.parcela,
            formatDate(row.vencimento),
            row.diasUteis, // Placeholder
            (row.amortPercentage * 100).toLocaleString('pt-BR', {minimumFractionDigits: 4, maximumFractionDigits: 4}),
            (row.cdiRate * 100).toLocaleString('pt-BR', {minimumFractionDigits: 4, maximumFractionDigits: 4}),
            (row.spreadRate * 100).toLocaleString('pt-BR', {minimumFractionDigits: 4, maximumFractionDigits: 4}),
            (row.totalRate * 100).toLocaleString('pt-BR', {minimumFractionDigits: 4, maximumFractionDigits: 4}),
            row.initialBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
            row.monthlyInterest.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
            row.principalPayment.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
            row.totalPayment.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
            row.newBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})
        ].map(field => `"${String(field).replace(/"/g, '""')}"`) // Quote fields, escape existing quotes
         .join(';');
    });

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
        alert("Seu navegador não suporta a exportação direta.");
    }
}


// --- EVENT LISTENERS & UI CONTROL (DOM Ready) ---
document.addEventListener('DOMContentLoaded', () => {
    valorPrincipalInput = document.getElementById('valorPrincipal');
    dataInicioInput = document.getElementById('dataInicio');
    taxaSpreadMensalInput = document.getElementById('taxaSpreadMensal');
    numeroParcelasInput = document.getElementById('numeroParcelas');
    mesesCarenciaInput = document.getElementById('mesesCarencia');
    tipoAmortizacaoRadios = document.querySelectorAll('input[name="tipoAmortizacao"]');
    containerAmortizacaoFixaCampos = document.getElementById('containerAmortizacaoFixaCampos');
    percentualAmortizacaoFixaInput = document.getElementById('percentualAmortizacaoFixa');
    containerAmortizacaoVariavelCampos = document.getElementById('containerAmortizacaoVariavelCampos');
    containerCdiFuturoCampos = document.getElementById('containerCdiFuturoCampos');
    calculationErrorsDiv = document.getElementById('calculationErrors') || { innerHTML: '' }; // Fallback if not in HTML

    btnCalcularAmortizacao = document.getElementById('btnCalcularAmortizacao');
    btnExportarExcel = document.getElementById('btnExportarExcel');
    btnVisualizarResumo = document.getElementById('btnVisualizarResumo');
    corpoTabelaAmortizacao = document.getElementById('corpoTabelaAmortizacao');
    dadosResumo = document.getElementById('dadosResumo');

    // Input formatting listeners
    [valorPrincipalInput, taxaSpreadMensalInput, percentualAmortizacaoFixaInput].forEach(input => {
        if(input) input.addEventListener('blur', (e) => {
            const val = e.target.value;
            if(val.trim() === "") return;
            const num = parseBrazilianNumber(val);
            if (!isNaN(num)) {
                if (e.target.id === 'valorPrincipal') {
                     e.target.value = num.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                } else { // Percentage fields
                     e.target.value = num.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 4});
                }
            } else {
                // calculationErrorsDiv.innerHTML += `<div>Valor inválido para ${e.target.labels[0]?.textContent || e.target.id}. Use formato como 1.234,56 ou 0,45.</div>`;
            }
        });
    });

    dataInicioInput.addEventListener('change', generateCdiInputs);
    numeroParcelasInput.addEventListener('change', () => {
        generateCdiInputs();
        if (document.querySelector('input[name="tipoAmortizacao"]:checked').value === 'variavel') {
            generateAmortizacaoVariavelInputs();
        }
    });
     mesesCarenciaInput.addEventListener('change', () => { // Also regenerate variable amort. if carencia changes
        if (document.querySelector('input[name="tipoAmortizacao"]:checked').value === 'variavel') {
            generateAmortizacaoVariavelInputs();
        }
    });


    tipoAmortizacaoRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            const selectedType = event.target.value;
            containerAmortizacaoFixaCampos.style.display = 'none';
            containerAmortizacaoVariavelCampos.style.display = 'none';
            percentualAmortizacaoFixaInput.disabled = false;
            percentualAmortizacaoFixaInput.value = ''; // Clear previous value

            if (selectedType === 'fixa') {
                containerAmortizacaoFixaCampos.style.display = 'block';
            } else if (selectedType === 'variavel') {
                containerAmortizacaoVariavelCampos.style.display = 'block';
                generateAmortizacaoVariavelInputs();
            } else if (selectedType === 'sac') {
                containerAmortizacaoFixaCampos.style.display = 'block';
                percentualAmortizacaoFixaInput.value = 'Tabela SAC (Automático)';
                percentualAmortizacaoFixaInput.disabled = true;
            } else if (selectedType === 'price') {
                // calculationErrorsDiv.innerHTML = '<div>Cálculo Tabela Price ainda não implementado.</div>';
                // No specific container to show for Price inputs at this stage
            }
        });
    });

    btnCalcularAmortizacao.addEventListener('click', handleCalculateAmortization);
    btnVisualizarResumo.addEventListener('click', showSummary);
    btnExportarExcel.addEventListener('click', exportToExcel);

    // Initial UI Setup
    generateCdiInputs();
    const defaultAmortTypeRadio = document.querySelector('input[name="tipoAmortizacao"]:checked');
    if (defaultAmortTypeRadio) { // Dispatch event to set initial UI for amortization type
        defaultAmortTypeRadio.dispatchEvent(new Event('change'));
    } else if (tipoAmortizacaoRadios.length > 0) { // Default to first if none checked (should not happen with 'checked' in HTML)
        tipoAmortizacaoRadios[0].checked = true;
        tipoAmortizacaoRadios[0].dispatchEvent(new Event('change'));
    }

    dadosResumo.textContent = 'Preencha os campos e clique em "Calcular Amortização".';
    console.log("script.js loaded and event listeners attached.");
});

console.log("script.js being parsed.");
