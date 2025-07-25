const amountInput = document.getElementById("amount");
const typeSelect = document.getElementById("type");
const descriptionInput = document.getElementById("description");
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

const moreInfoBtn = document.getElementById("more-info-btn");
const moreInfoModal = document.getElementById("more-info-modal");
const closeInfoBtn = document.getElementById("close-info");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

let pieChart, barChart, lineChart;

const colorsMap = {
  income: "#38b000",
  expense: "#d00000",
  saving: "#FFD700",
  charity: "#0077B6"
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
        <button class="delete-btn" onclick="deleteTransaction(${index})" title="حذف">✖️</button>
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
  if (newAmountStr === null) return;

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
  const sums = { income: 0, expense: 0, saving: 0, charity: 0 };
  transactions.forEach(t => {
    sums[t.type] = (sums[t.type] || 0) + t.amount;
  });

  // داده برای نمودار دایره‌ای (Pie)
  const pieData = {
    labels: ["درآمد", "هزینه", "پس‌انداز", "کمک به خیریه"],
    datasets: [{
      data: [sums.income, sums.expense, sums.saving, sums.charity],
      backgroundColor: [
        colorsMap.income,
        colorsMap.expense,
        colorsMap.saving,
        colorsMap.charity
      ],
      borderWidth: 0
    }]
  };

  // حذف نمودار قبلی قبل از ساخت مجدد (برای جلوگیری از خطا)
  if (pieChart) pieChart.destroy();
  const pieCtx = document.getElementById("pieChart").getContext("2d");
  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: pieData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { family: "'Vazirmatn', sans-serif", size: 14 }
          }
        },
        tooltip: { enabled: true }
      }
    }
  });

  // داده برای نمودار میله‌ای (Bar) با دسته‌بندی تراکنش‌ها
  const types = ["income", "expense", "saving", "charity"];
  const labels = types.map(t => labelFa(t));
  const values = types.map(t => sums[t]);

  if (barChart) barChart.destroy();
  const barCtx = document.getElementById("barChart").getContext("2d");
  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "مجموع (تومان)",
        data: values,
        backgroundColor: Object.values(colorsMap),
        borderRadius: 10,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => val.toLocaleString()
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      }
    }
  });

  // داده برای نمودار خطی (Line) - روند ساده بر اساس تراکنش‌ها به ترتیب تاریخ (اینجا تاریخ شمسی است ولی فرض می‌کنیم هر تراکنش به ترتیب اضافه شده)
  // برای نمودار خطی، مجموع تجمعی درآمد منهای مجموع تجمعی هزینه، پس‌انداز، خیریه به صورت روزانه ساده‌سازی شده
  const sortedTransactions = [...transactions].sort((a,b) => new Date(a.date) - new Date(b.date));
  let cumIncome = 0, cumExpense = 0, cumSaving = 0, cumCharity = 0;
  const labelsLine = [];
  const dataLine = [];

  sortedTransactions.forEach((t, i) => {
    if (t.type === "income") cumIncome += t.amount;
    else if (t.type === "expense") cumExpense += t.amount;
    else if (t.type === "saving") cumSaving += t.amount;
    else if (t.type === "charity") cumCharity += t.amount;
    labelsLine.push(t.date);
    dataLine.push(cumIncome - (cumExpense + cumSaving + cumCharity));
  });

  if (lineChart) lineChart.destroy();
  const lineCtx = document.getElementById("lineChart").getContext("2d");
  lineChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: labelsLine,
      datasets: [{
        label: "موجودی تجمعی (تومان)",
        data: dataLine,
        fill: true,
        backgroundColor: "rgba(56,176,0,0.2)",
        borderColor: colorsMap.income,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: val => val.toLocaleString()
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            font: { family: "'Vazirmatn', sans-serif", size: 14 }
          }
        },
        tooltip: { enabled: true }
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

addBtn.addEventListener("click", addTransaction);
toggleTheme.addEventListener("click", toggleDarkMode);
clearAllBtn.addEventListener("click", clearAllTransactions);

moreInfoBtn.addEventListener("click", () => {
  moreInfoModal.classList.add("modal-show");
});

closeInfoBtn.addEventListener("click", () => {
  moreInfoModal.classList.remove("modal-show");
});

moreInfoModal.addEventListener("click", (e) => {
  if (e.target === moreInfoModal) {
    moreInfoModal.classList.remove("modal-show");
  }
});

loadTheme();
renderTransactions();
updateSummary();
updateCharts();

window.deleteTransaction = deleteTransaction;
window.editTransaction = editTransaction;
