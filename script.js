const amountInput = document.getElementById("amount");
const typeSelect = document.getElementById("type");
const addBtn = document.getElementById("add-transaction");
const incomeTotal = document.getElementById("income-total");
const expenseTotal = document.getElementById("expense-total");
const savingTotal = document.getElementById("saving-total");
const charityTotal = document.getElementById("charity-total");
const balance = document.getElementById("balance");
const list = document.getElementById("transaction-list");
const toggleTheme = document.getElementById("toggle-theme");
const clearAllBtn = document.getElementById("clear-all");
const notification = document.getElementById("notification");
const monthlyBudgetInput = document.getElementById("monthly-budget");
const budgetWarning = document.getElementById("budget-warning");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

let pieChart, barChart, lineChart;

const colorsMap = {
  income: "#38b000",    // سبز
  expense: "#d00000",   // قرمز
  saving: "#FFD700",    // زرد
  charity: "#0077B6"    // آبی
};

function saveToLocalStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function showNotification(message) {
  notification.textContent = message;
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 2500);
}

function updateSummary() {
  const sums = { income: 0, expense: 0, saving: 0, charity: 0 };
  transactions.forEach(t => {
    sums[t.type] = (sums[t.type] || 0) + t.amount;
  });

  incomeTotal.textContent = `${sums.income.toLocaleString()} تومان`;
  expenseTotal.textContent = `${sums.expense.toLocaleString()} تومان`;
  savingTotal.textContent = `${sums.saving.toLocaleString()} تومان`;
  charityTotal.textContent = `${sums.charity.toLocaleString()} تومان`;
  balance.textContent = `${(sums.income - (sums.expense + sums.saving + sums.charity)).toLocaleString()} تومان`;

  // هشدار بودجه
  if (monthlyBudget <= 0) {
    budgetWarning.textContent = "";
    return;
  }

  const totalSpent = sums.expense + sums.saving + sums.charity;
  const percent = (totalSpent / monthlyBudget) * 100;

  if (percent >= 100) {
    budgetWarning.textContent = "هشدار: بودجه ماهانه تمام شده است!";
  } else if (percent >= 90) {
    budgetWarning.textContent = "هشدار: نزدیک بودجه ماهانه هستید!";
  } else {
    budgetWarning.textContent = "";
  }
}

function renderTransactions() {
  list.innerHTML = "";
  transactions.forEach((t, index) => {
    const li = document.createElement("li");
    li.classList.add(t.type);
    li.innerHTML = `
      <span>${t.amount.toLocaleString()} تومان (${labelFa(t.type)}) - توضیح: ${t.description || '-'} - تاریخ: ${t.date}</span>
      <div class="btn-group">
        <button class="edit-btn" onclick="editTransaction(${index})" title="ویرایش">✏️</button>
        <button class="delete-btn" onclick="deleteTransaction(${index})" title="حذف">❌</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function labelFa(type) {
  switch(type) {
    case "income": return "درآمد";
    case "expense": return "هزینه";
    case "saving": return "پس‌انداز";
    case "charity": return "کمک به خیریه";
    default: return "";
  }
}

function deleteTransaction(index) {
  transactions.splice(index, 1);
  saveToLocalStorage();
  renderTransactions();
  updateSummary();
  updateCharts();
  showNotification("تراکنش حذف شد ❌");
}

function editTransaction(index) {
  const t = transactions[index];
  const newAmountStr = prompt("مبلغ جدید را وارد کنید:", t.amount);
  if (newAmountStr === null) return; // لغو شد

  const newAmount = Number(newAmountStr);
  if (isNaN(newAmount) || newAmount <= 0) {
    alert("مبلغ معتبر نیست!");
    return;
  }

  const newDescription = prompt("توضیح جدید را وارد کنید:", t.description || "");
  if (newDescription === null) return;

  t.amount = newAmount;
  t.description = newDescription.trim();
  saveToLocalStorage();
  renderTransactions();
  updateSummary();
  updateCharts();
  showNotification("تراکنش ویرایش شد ✏️");
}

function addTransaction() {
  const amount = Number(amountInput.value.trim());
  if (amount <= 0 || isNaN(amount)) {
    alert("لطفاً مبلغ معتبر وارد کنید.");
    return;
  }

  const type = typeSelect.value;
  const description = descriptionInput.value.trim();
  const now = new Date();
  const date = now.toLocaleDateString("fa-IR");

  transactions.push({ amount, type, description, date });

  saveToLocalStorage();
  amountInput.value = "";
  descriptionInput.value = "";
  renderTransactions();
  updateSummary();
  updateCharts();
  showNotification("تراکنش با موفقیت ثبت شد ✅");
}

function updateCharts() {
  const labels = ["درآمد", "هزینه", "پس‌انداز", "کمک به خیریه"];
  const keys = ["income", "expense", "saving", "charity"];

  const sums = { income: 0, expense: 0, saving: 0, charity: 0 };
  transactions.forEach(t => {
    sums[t.type] = (sums[t.type] || 0) + t.amount;
  });

  const data = [
    sums.income,
    sums.expense,
    sums.saving,
    sums.charity
  ];

  const backgroundColors = [
    "rgba(56, 176, 0, 0.8)",
    "rgba(208, 0, 0, 0.8)",
    "rgba(255, 215, 0, 0.8)",
    "rgba(0, 119, 182, 0.8)"
  ];

  const hoverColors = [
    "rgba(56, 176, 0, 1)",
    "rgba(208, 0, 0, 1)",
    "rgba(255, 215, 0, 1)",
    "rgba(0, 119, 182, 1)"
  ];

  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();
  if (lineChart) lineChart.destroy();

  // Pie Chart با درصد در tooltip و بدون توخالی بودن
  const pieCtx = document.getElementById("pieChart").getContext("2d");
  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        hoverBackgroundColor: hoverColors,
        borderWidth: 2,
        borderColor: document.body.classList.contains("dark") ? "#222" : "#fff",
        hoverOffset: 20
      }]
    },
    options: {
      animation: { animateRotate: true, duration: 1200, easing: 'easeOutQuart' },
      plugins: {
        legend: { 
          position: 'bottom',
          labels: { 
            color: document.body.classList.contains("dark") ? "#fff" : "#000",
            font: { size: 14, weight: '600' }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const data = context.chart.data.datasets[0].data;
              const total = data.reduce((a, b) => a + b, 0);
              const percent = total ? ((value / total) * 100).toFixed(2) : 0;
              return `${label}: ${value.toLocaleString()} تومان (${percent}%)`;
            }
          },
          backgroundColor: '#222',
          titleColor: '#fff',
          bodyColor: '#eee',
          cornerRadius: 6,
          padding: 10
        }
      }
    }
  });

  // Bar Chart - باریک‌تر و با گرادینت بهتر
  const barCtx = document.getElementById("barChart").getContext("2d");
  const gradientFills = backgroundColors.map((color) => {
    const grad = barCtx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, color.replace("0.8", "1"));
    grad.addColorStop(1, color.replace("0.8", "0.4"));
    return grad;
  });
  barChart = new Chart(barCtx, {
    type: "bar",
    data: { 
      labels, 
      datasets: [{
        label: "مقدار (تومان)", 
        data, 
        backgroundColor: gradientFills,
        borderRadius: 12,
        borderSkipped: false,
        hoverBackgroundColor: hoverColors
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          ticks: { color: document.body.classList.contains("dark") ? "#fff" : "#000" },
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.1)' }
        },
        x: {
          ticks: { color: document.body.classList.contains("dark") ? "#fff" : "#000" },
          maxBarThickness: 12,
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          labels: { color: document.body.classList.contains("dark") ? "#fff" : "#000" }
        },
        tooltip: {
          backgroundColor: '#333',
          titleColor: '#fff',
          bodyColor: '#eee',
          cornerRadius: 6,
          padding: 8
        }
      },
      animation: {
        duration: 1200,
        easing: 'easeOutQuart'
      }
    }
  });

  // Line Chart - روند با انیمیشن و سایه و نقاط بزرگ‌تر
  const lineCtx = document.getElementById("lineChart").getContext("2d");

  const datesSet = new Set(transactions.map(t => t.date));
  const dates = [...datesSet].sort((a,b) => new Date(a) - new Date(b));

  const lineDatasets = keys.map(key => {
    const vals = dates.map(date =>
      transactions.filter(t => t.type === key && t.date === date).reduce((sum,t) => sum + t.amount, 0)
    );
    return {
      label: labels[keys.indexOf(key)],
      data: vals,
      borderColor: backgroundColors[keys.indexOf(key)],
      backgroundColor: backgroundColors[keys.indexOf(key)].replace("0.8", "0.3"),
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8,
      borderWidth: 3,
      cubicInterpolationMode: 'monotone'
    };
  });

  lineChart = new Chart(lineCtx, {
    type: "line",
    data: { labels: dates, datasets: lineDatasets },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: document.body.classList.contains("dark") ? "#fff" : "#000" },
          grid: { color: 'rgba(0,0,0,0.1)' }
        },
        x: {
          ticks: { color: document.body.classList.contains("dark") ? "#fff" : "#000" },
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          labels: { color: document.body.classList.contains("dark") ? "#fff" : "#000" },
          position: 'bottom',
          labels: { font: { size: 14, weight: '600' } }
        },
        tooltip: {
          backgroundColor: '#222',
          titleColor: '#fff',
          bodyColor: '#eee',
          cornerRadius: 6,
          padding: 10
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      }
    }
  });
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  updateCharts();
}

function loadTheme() {
  const darkMode = JSON.parse(localStorage.getItem("darkMode"));
  if (darkMode) {
    document.body.classList.add("dark");
  }
}

function clearAllTransactions() {
  if (confirm("آیا مطمئنی که می‌خوای همه تراکنش‌ها پاک بشن؟")) {
    transactions = [];
    saveToLocalStorage();
    renderTransactions();
    updateSummary();
    updateCharts();
    showNotification("همه تراکنش‌ها پاک شدند 🗑️");
  }
}

monthlyBudgetInput.value = monthlyBudget;

monthlyBudgetInput.addEventListener("input", () => {
  const val = Number(monthlyBudgetInput.value);
  if (!isNaN(val) && val >= 0) {
    monthlyBudget = val;
    localStorage.setItem("monthlyBudget", monthlyBudget.toString());
    updateSummary();
  }
});

// رویدادها
addBtn.addEventListener("click", addTransaction);
toggleTheme.addEventListener("click", toggleDarkMode);
clearAllBtn.addEventListener("click", clearAllTransactions);

loadTheme();
renderTransactions();
updateSummary();
updateCharts();

window.deleteTransaction = deleteTransaction;
window.editTransaction = editTransaction;
