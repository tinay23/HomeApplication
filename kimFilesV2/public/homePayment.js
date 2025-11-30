//get info from html 
const paymentForm = document.getElementById('paymentForm');
const messageBox = document.getElementById('messageBox');
const jobSelect = document.getElementById('jobSelect');

//When submit is clicked start function
paymentForm.addEventListener('submit', (event) => {
  event.preventDefault(); // prevents error with form glitching when subit is hit

	//variables for the values entered in html
  const selectedOption = jobSelect.options[jobSelect.selectedIndex];
  const jobId = jobSelect.value;
  const jobTitle = selectedOption.textContent;
  //using unknown contractor if name wasnt entered correctly
  const contractorName = selectedOption.getAttribute('data-contractor') || 'Unknown Contractor';

	//get the values entered and trim any not needed spaces
  const homeownerName = document.getElementById('homeownerName').value.trim();
  const amount = document.getElementById('amount').value.trim();
  const cardName = document.getElementById('cardName').value.trim();
  const cardNumber = document.getElementById('cardNumber').value.trim();
  const expiry = document.getElementById('expiry').value.trim();
  const cvv = document.getElementById('cvv').value.trim();

	//if anything is missing show error
  if (!jobId || !homeownerName || !amount || !cardName || !cardNumber || !expiry || !cvv) {
    showMessage('Please fill in all required fields.', 'error');
    return;
  }

  //get last 4 to display later for security reasons (simulated)
  const last4 = cardNumber.slice(-4);

	//create a record ready to save or send to database
  const paymentRecord = {
    id: Date.now(),                    // test id
    jobId,
    jobTitle,
    contractorName,
    homeownerName,
    amount: parseFloat(amount),
    last4,
    date: new Date().toLocaleString(),
    status: 'Paid'
  };

  // Save to localStorage so contractor page can read it later
  const existing = JSON.parse(localStorage.getItem('demoPayments') || '[]');
  existing.push(paymentRecord);
  localStorage.setItem('demoPayments', JSON.stringify(existing));
  //storaged in browser for testing (inspect > application > local storage > site name aka ip)

  // Clear form, display message
  paymentForm.reset();
  showMessage('Payment submitted successfully ', 'success' );
});

//function for messageBox for repeated use if needed (used for debuging, keeping in case)
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = 'message ' + type;
  messageBox.style.display = 'block';
}

//possible database code
//fetch('/api/payments', { method: 'POST', body: JSON.stringify(paymentRecord) })
