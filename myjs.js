// ✅ Show a popup with title, message, and auto-dismiss
function showPopup(message = '', title = "🔔 Notification", duration = 3000) {
  const titleEl = document.getElementById('popupTitle');
  const msgEl = document.getElementById('popupMessage');
  const modalEl = document.getElementById('popupModal');

  if (!titleEl || !msgEl || !modalEl) {
    console.warn("⚠️ Popup elements not found in the DOM.");
    return;
  }

  titleEl.innerHTML = title || "🔔 Notification";
  msgEl.innerHTML = message || "";

  const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
  modalInstance.show();

  if (duration > 0) {
    setTimeout(() => {
      modalInstance.hide();
    }, duration);
  }
}

// ✅ Auto-show popup if flash message is present in body tag
window.addEventListener('DOMContentLoaded', () => {
  const flashMessage = document.body.dataset.flash || '';
  if (flashMessage.trim()) {
    showPopup(flashMessage);
  }
});

// ✅ Confirm Delete expense 
function confirmDelete(expenseId) {
  const modalEl = document.getElementById('confirmDeleteModal');
  const inputId = document.getElementById('deleteExpenseId');
  const form = document.getElementById('deleteForm');

  if (!modalEl || !inputId || !form) {
    console.warn("⚠️ Delete modal elements not found");
    return;
  }

  inputId.value = expenseId;
  form.action = `/expenses/delete/${expenseId}`;

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}
// ✅ Confirm Delete budget 
function confirmBudgetDelete(month) {
  const modalEl = document.getElementById('confirmBudgetDeleteModal');
  const monthInput = document.getElementById('deleteBudgetMonth');
  const labelEl = document.getElementById('budgetMonthLabel');
  const formEl = document.getElementById('deleteBudgetForm');

  if (!modalEl || !monthInput || !labelEl || !formEl) {
    console.warn("⚠️ Budget delete modal elements not found");
    return;
  }

  monthInput.value = month;
  labelEl.textContent = month;
  formEl.action = `/budget/delete/${month}`; 

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}
