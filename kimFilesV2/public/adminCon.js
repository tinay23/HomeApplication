const tableBody = document.querySelector('#contractorTable tbody');
const editPanel = document.getElementById('editPanel');
const editId = document.getElementById('edit-id');
const editFullName = document.getElementById('edit-fullName');
const editBusinessName = document.getElementById('edit-businessName');
const editTradeType = document.getElementById('edit-tradeType');
const editRating = document.getElementById('edit-rating');
const editEmail = document.getElementById('edit-email');
const editPhone = document.getElementById('edit-phone');

const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

//load data
async function loadContractors() {
  try {
    const response = await fetch('/api/contractors');
    if (!response.ok) {
      throw new Error('Failed to fetch contractors');
    }

    const contractors = await response.json();
    renderTable(contractors);
  } catch (err) {
    console.error(err);
    alert('Error loading contractors (check console).');
  }
}

function renderTable(contractors) {
  tableBody.innerHTML = ''; 

  contractors.forEach(contractor => {
    const tr = document.createElement('tr');
    tr.dataset.id = contractor.id;

    tr.innerHTML = `
      <td>${contractor.id}</td>
      <td>${contractor.fullName}</td>
      <td>${contractor.businessName || ''}</td>
      <td>${contractor.tradeType || ''}</td>
      <td>${contractor.rating != null ? contractor.rating : '-'}</td>
      <td>
        <button class="btn btn-edit">Edit</button>
        <button class="btn btn-delete">Delete</button>
      </td>
    `;

    const editBtn = tr.querySelector('.btn-edit');
    const deleteBtn = tr.querySelector('.btn-delete');

    editBtn.addEventListener('click', () => {
      openEditPanel(contractor);
    });

    deleteBtn.addEventListener('click', () => {
      handleDelete(contractor.id);
    });

    tableBody.appendChild(tr);
  });
}

//contractor edit, unhide edit 
function openEditPanel(contractor) {
  editId.value = contractor.id;
  editFullName.value = contractor.fullName || '';
  editBusinessName.value = contractor.businessName || '';
  editTradeType.value = contractor.tradeType || 'Cleaning';
  editRating.value = contractor.rating != null ? contractor.rating : '';
  editEmail.value = contractor.email || '';
  editPhone.value = contractor.phone || '';

  editPanel.classList.remove('hidden');
  editPanel.scrollIntoView({ behavior: 'smooth' });
}

//save edits
saveEditBtn.addEventListener('click', async () => {
  const id = editId.value;

  const updated = {
    fullName: editFullName.value.trim(),
    businessName: editBusinessName.value.trim(),
    tradeType: editTradeType.value,
    rating: editRating.value ? Number(editRating.value) : null,
    email: editEmail.value.trim(),
    phone: editPhone.value.trim()
  };

  try {
    const response = await fetch(`/api/contractors/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updated)
    });

    if (!response.ok) {
      throw new Error('Failed to update contractor');
    }
	
	 //hide edit reload data
    alert('Contractor updated successfully.');
    editPanel.classList.add('hidden');
    loadContractors();
  } catch (err) {
    console.error(err);
    alert('Error saving changes (check console).');
  }
});

//cancel
cancelEditBtn.addEventListener('click', () => {
  editPanel.classList.add('hidden');
});

//delete
async function handleDelete(id) {
  const sure = confirm(`Are you sure you want to delete contractor #${id}?`);
  if (!sure) return;

  try {
    const response = await fetch(`/api/contractors/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete contractor');
    }

    alert('Contractor deleted.');
    loadContractors();
  } catch (err) {
    console.error(err);
    alert('Error deleting contractor (check console).');
  }
}

loadContractors();
