const tableBody = document.querySelector('#homeownerTable tbody');
const editPanel = document.getElementById('editPanel');
const editId = document.getElementById('edit-id');
const editFullName = document.getElementById('edit-fullName');
const editAddress = document.getElementById('edit-businessName');

const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// 1) Load data
async function loadHomeowners() {
  try {
    const response = await fetch('/api/homeowners');
    if (!response.ok) {
      throw new Error('Failed to fetch homeowners');
    }

    const homeowners = await response.json();
    renderTable(homeowners);
  } catch (err) {
    console.error(err);
    alert('Error loading homeowners (check console).');
  }
}

function renderTable(homeowners) {
  tableBody.innerHTML = ''; 

  homeowners.forEach(homeowner => {
    const tr = document.createElement('tr');
    tr.dataset.id = homeowner.id;

    tr.innerHTML = `
      <td>${homeowner.id}</td>
      <td>${homeowner.fullName}</td>
      <td>${homeowner.address || ''}</td>
      <td>
        <button class="btn btn-edit">Edit</button>
        <button class="btn btn-delete">Delete</button>
      </td>
    `;

    const editBtn = tr.querySelector('.btn-edit');
    const deleteBtn = tr.querySelector('.btn-delete');

    editBtn.addEventListener('click', () => {
      openEditPanel(homeowner);
    });

    deleteBtn.addEventListener('click', () => {
      handleDelete(homeowner.id);
    });

    tableBody.appendChild(tr);
  });
}

//homeowner edit, unhide edit 
function openEditPanel(homeowner) {
  editId.value = homeowner.id;
  editFullName.value = homeowner.fullName || '';
  editAddress.value = homeowner.address || '';
 
  editPanel.classList.remove('hidden');
  editPanel.scrollIntoView({ behavior: 'smooth' });
}

//save edit
saveEditBtn.addEventListener('click', async () => {
  const id = editId.value;

  const updated = {
    fullName: editFullName.value.trim(),
    address: editAddress.value.trim(),
    
  };

  try {
    const response = await fetch(`/api/homeowners/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updated)
    });

    if (!response.ok) {
      throw new Error('Failed to update homeowner');
    }
	
	 // hide edit and reload table 
    alert('homeowner updated successfully.');
    editPanel.classList.add('hidden');
    loadHomeowners();	 // reload table 
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
  const sure = confirm(`Are you sure you want to delete homeowner #${id}?`);
  if (!sure) return;

  try {
    const response = await fetch(`/api/homeowners/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete homeowner');
    }

    alert('homeowner deleted.');
    loadHomeowners();
  } catch (err) {
    console.error(err);
    alert('Error deleting homeowner (check console).');
  }
}

loadHomeowners();
