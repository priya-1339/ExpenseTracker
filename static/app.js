let categoryChart = null;
let monthlyChart = null;

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
    
    loadDashboard();
    loadExpenses();
    
    document.getElementById('saveExpense').addEventListener('click', addExpense);
    document.getElementById('updateExpense').addEventListener('click', updateExpense);
    document.getElementById('applyFilter').addEventListener('click', applyFilters);
    
    const addModal = document.getElementById('addExpenseModal');
    addModal.addEventListener('hidden.bs.modal', function() {
        document.getElementById('expenseForm').reset();
        document.getElementById('expenseDate').value = today;
    });
    
    handleNavbarScroll();
});

function handleNavbarScroll() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const navbar = document.querySelector('.navbar-collapse');
            if (navbar.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(navbar, {
                    toggle: true
                });
            }
        });
    });
}

async function loadDashboard() {
    try {
        const response = await fetch('/dashboard');
        const data = await response.json();
        
        document.getElementById('totalExpenses').textContent = '₹' + data.total.toFixed(2);
        document.getElementById('totalCount').textContent = data.expense_count;
        
        renderCategoryChart(data.category_totals);
        renderMonthlyChart(data.monthly_totals);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadExpenses() {
    try {
        const category = document.getElementById('filterCategory').value;
        const startDate = document.getElementById('filterStartDate').value;
        const endDate = document.getElementById('filterEndDate').value;
        
        let url = '/expenses?';
        if (category !== 'all') url += `category=${category}&`;
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}&`;
        
        const response = await fetch(url);
        const expenses = await response.json();
        
        const filteredTotal = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        document.getElementById('totalExpenses').textContent = '₹' + filteredTotal.toFixed(2);
        document.getElementById('totalCount').textContent = expenses.length;
        
        const tbody = document.getElementById('expenseTableBody');
        tbody.innerHTML = '';
        
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
                </td>
            `;
            tbody.appendChild(row);
        });
        
        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No expenses found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading expenses:', error);
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                category: category,
                description: description,
                date: date
            })
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addExpenseModal')).hide();
            document.getElementById('expenseForm').reset();
            loadDashboard();
            loadExpenses();
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
        console.error('Error loading expense:', error);
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                category: category,
                description: description,
                date: date
            })
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editExpenseModal')).hide();
            loadDashboard();
            loadExpenses();
        }
    } catch (error) {
        console.error('Error updating expense:', error);
        alert('Failed to update expense');
    }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        const response = await fetch(`/expenses/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadDashboard();
            loadExpenses();
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense');
    }
}

function applyFilters() {
    loadExpenses();
}

function renderCategoryChart(categoryTotals) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ₹' + context.parsed.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

function renderMonthlyChart(monthlyTotals) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    const sortedMonths = Object.keys(monthlyTotals).sort();
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const data = sortedMonths.map(month => monthlyTotals[month]);
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Spending',
                data: data,
                backgroundColor: '#36A2EB',
                borderColor: '#2E86C1',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Total: ₹' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}
