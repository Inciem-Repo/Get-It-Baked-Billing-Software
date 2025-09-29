export async function getAllExpenses({
  page,
  limit,
  fromDate,
  toDate,
  expense_payment,
}) {
  return await window.api.expenseGetAll({
    page,
    limit,
    fromDate,
    toDate,
    expense_payment,
  });
}
