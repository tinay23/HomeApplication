//table and message set up
const tableBody = document.querySelector('#paymentsTable tbody');
const emptyMessage = document.getElementById('emptyMessage');

// Load payments from localStorage (till database)
const payments = JSON.parse(localStorage.getItem('demoPayments') || '[]');

//if no payments 
if (payments.length === 0) {
  emptyMessage.style.display = 'block';
} else {
	//if payments exist loop and display in table
  payments.forEach((p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.date}</td>
      <td>${p.jobTitle}</td>
      <td>${p.homeownerName}</td>
      <td>${p.contractorName}</td>
      <td>$${p.amount.toFixed(2)}</td>
      <td>**** ${p.last4}</td>
      <td>${p.status}</td>
    `;
    tableBody.appendChild(tr);
  });
}
