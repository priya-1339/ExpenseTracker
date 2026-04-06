let categoryChart = null;
let monthlyChart = null;

document.addEventListener('DOMContentLoaded', function () {
    const today = new Date().toISOString().split('T')[0];

    // Set today's date if the add form exists (Home page)
    const expenseDateInput = document.getElementById('expenseDate');
    if (expenseDateInput) expenseDateInput.value = today;

    // Home page
    if (document.getElementById('expenseTableBody') && document.getElementById('saveExpense')) {
        loadExpenses();
        document.getElementById('saveExpense').addEventListener('click', addExpense);
        document.getElementById('updateExpense')?.addEventListener('click', updateExpense);

        const addModal = document.getElementById('addExpenseModal');
        if (addModal) {
            addModal.addEventListener('hidden.bs.modal', function () {
                document.getElementById('expenseForm').reset();
                expenseDateInput.value = today;
            });
        }
    }

    // Dashboard page
    if (document.getElementById('applyFilter')) {
        loadExpenses();
        document.getElementById('applyFilter').addEventListener('click', loadExpenses);
        document.getElementById('updateExpense')?.addEventListener('click', updateExpense);
    }

    // Summary page
    if (document.getElementById('categoryChart')) {
        loadSummary();
    }
});

async function loadExpenses() {
    try {
        const categoryEl = document.getElementById('filterCategory');
        const startEl = document.getElementById('filterStartDate');
        const endEl = document.getElementById('filterEndDate');

        const params = new URLSearchParams();
        if (categoryEl && categoryEl.value !== 'all') params.set('category', categoryEl.value);
        if (startEl && startEl.value) params.set('start_date', startEl.value);
        if (endEl && endEl.value) params.set('end_date', endEl.value);

        const url = '/expenses' + (params.toString() ? '?' + params.toString() : '');
        const response = await fetch(url);
        const expenses = await response.json();

        // Update totals if elements exist
        const totalEl = document.getElementById('totalExpenses');
        const countEl = document.getElementById('totalCount');
        if (totalEl) {
            const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            totalEl.textContent = '₹' + total.toFixed(2);
        }
        if (countEl) countEl.textContent = expenses.length;

        // Render table
        const tbody = document.getElementById('expenseTableBody');
        if (tbody) {
            tbody.innerHTML = '';
            if (expenses.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No expenses found</td></tr>';
            } else {
                expenses.forEach(expense => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${expense.date}</td>
                        <td><span class="badge bg-secondary">${expense.category}</span></td>
                        <td>${expense.description || '-'}</td>
                        <td><strong>₹${parseFloat(expense.amount).toFixed(2)}</strong></td>
                        <td>
                            <button class="btn btn-sm btn-primary btn-action" onclick="editExpense(${expense.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-action" onclick="deleteExpense(${expense.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>`;
                    tbody.appendChild(row);
                });
            }
        }
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

async function loadSummary() {
    try {
        const response = await fetch('/expenses');
        const expenses = await response.json();

        const totalEl = document.getElementById('totalExpenses');
        const countEl = document.getElementById('totalCount');
        if (totalEl) {
            const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            totalEl.textContent = '₹' + total.toFixed(2);
        }
        if (countEl) countEl.textContent = expenses.length;

        const categoryTotals = {};
        const monthlyTotals = {};
        expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + parseFloat(expense.amount);
            const monthKey = expense.date.substring(0, 7);
            monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + parseFloat(expense.amount);
        });

        renderCategoryChart(categoryTotals);
        renderMonthlyChart(monthlyTotals);
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

async function addExpense() {
    const amount = document.getElementById('expenseAmount').value;
    const category = document.getElementById('expenseCategory').value;
    const description = document.getElementById('expenseDescription').value;
    const date = document.getElementById('expenseDate').value;

    if (!amount || !category || !date) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch('/expenses/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: parseFloat(amount), category, description, date })
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addExpenseModal')).hide();
            document.getElementById('expenseForm').reset();
            loadExpenses();
        } else {
            alert('Failed to add expense');
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Failed to add expense');
    }
}

async function editExpense(id) {
    try {
        const response = await fetch(`/expenses/${id}`);
        const expense = await response.json();

        document.getElementById('editExpenseId').value = expense.id;
        document.getElementById('editExpenseAmount').value = expense.amount;
        document.getElementById('editExpenseCategory').value = expense.category;
        document.getElementById('editExpenseDescription').value = expense.description || '';
        document.getElementById('editExpenseDate').value = expense.date;

        new bootstrap.Modal(document.getElementById('editExpenseModal')).show();
    } catch (error) {
        alert('Failed to load expense for editing');
    }
}

async function updateExpense() {
    const id = document.getElementById('editExpenseId').value;
    const amount = document.getElementById('editExpenseAmount').value;
    const category = document.getElementById('editExpenseCategory').value;
    const description = document.getElementById('editExpenseDescription').value;
    const date = document.getElementById('editExpenseDate').value;

    if (!amount || !category || !date) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch(`/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: parseFloat(amount), category, description, date })
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editExpenseModal')).hide();
            loadExpenses();
        } else {
            alert('Failed to update expense');
        }
    } catch (error) {
        alert('Failed to update expense');
    }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
        const response = await fetch(`/expenses/${id}`, { method: 'DELETE' });
        if (response.ok) loadExpenses();
    } catch (error) {
        alert('Failed to delete expense');
    }
}

function renderCategoryChart(categoryTotals) {
    const ctx = document.getElementById('categoryChart')?.getContext('2d');
    if (!ctx) return;
    if (categoryChart) categoryChart.destroy();

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#B0A0E8', '#C9CBCF'];

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 2, borderColor: '#fff' }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: ctx => ctx.label + ': ₹' + ctx.parsed.toFixed(2) } }
            }
        }
    });
}

function renderMonthlyChart(monthlyTotals) {
    const ctx = document.getElementById('monthlyChart')?.getContext('2d');
    if (!ctx) return;
    if (monthlyChart) monthlyChart.destroy();

    const sortedMonths = Object.keys(monthlyTotals).sort();
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        return new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const data = sortedMonths.map(m => monthlyTotals[m]);

    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{ label: 'Monthly Spending', data, backgroundColor: '#36A2EB', borderColor: '#2E86C1', borderWidth: 1 }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => 'Total: ₹' + ctx.parsed.y.toFixed(2) } }
            },
            scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + v } } }
        }
    });
}
