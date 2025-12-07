//assign elements from html to const vars in js
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
	  //try to load data, if not error message
    const response = await fetch('/api/contractors');
    if (!response.ok) {
      throw new Error('Failed to fetch contractors');
    }

	//display table once data is loaded, error if not
    const contractors = await response.json();
    renderTable(contractors);
  } catch (err) {
    console.error(err);
    alert('Error loading contractors (check console).');
  }
}

/*

//get from database table contractors
app.get('/api/contractors', (req, res) => {
  //select all from Contractors, ends in error or results
  db.query('SELECT * FROM Contractors', (err, results) => {
  //error message
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
	//if no error then json results
    res.json(results);
  });
});

*/

//function to make the table using the data we loaded
function renderTable(contractors) {
  tableBody.innerHTML = ''; 

  //loop through the contractors, adding info per row
  contractors.forEach(contractor => {
    const tr = document.createElement('tr');
    tr.dataset.id = contractor.id;

	//table row format, 2 buttons per row for edit/delete
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

	//assign btns to variable
    const editBtn = tr.querySelector('.btn-edit');
    const deleteBtn = tr.querySelector('.btn-delete');

	//when buttons clicked run functions edit/delete
    editBtn.addEventListener('click', () => {
      openEditPanel(contractor);
    });

    deleteBtn.addEventListener('click', () => {
      handleDelete(contractor.id);
    });

	//each row appended to table
    tableBody.appendChild(tr);
  });
}

//contractor edit
function openEditPanel(contractor) {
  //assign values of contractor to textboxes for editing
  // Or, || ,statments account for possible missing information
  editId.value = contractor.id;
  editFullName.value = contractor.fullName || '';
  editBusinessName.value = contractor.businessName || '';
  editTradeType.value = contractor.tradeType || 'Cleaning';
  editRating.value = contractor.rating != null ? contractor.rating : '';
  editEmail.value = contractor.email || '';
  editPhone.value = contractor.phone || '';

  //make information editable
  editPanel.classList.remove('hidden');
  editPanel.scrollIntoView({ behavior: 'smooth' });
}

//save edits
saveEditBtn.addEventListener('click', async () => {
  const id = editId.value;
  // gather info into updated var package
  const updated = {
    fullName: editFullName.value.trim(),
    businessName: editBusinessName.value.trim(),
    tradeType: editTradeType.value,
    rating: editRating.value ? Number(editRating.value) : null,
    email: editEmail.value.trim(),
    phone: editPhone.value.trim()
  };

  try {
	//try to make connection
    const response = await fetch(`/api/contractors/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
	  //update information
      body: JSON.stringify(updated)
    });

	//if we dont get a good respone, throw error
    if (!response.ok) {
      throw new Error('Failed to update contractor');
    }
	
	 //Notify success, disable edit, reload data
    alert('Contractor updated successfully.');
    editPanel.classList.add('hidden');
    loadContractors();
  } catch (err) {
    console.error(err);
    alert('Error saving changes (check console).');
  }
});

/*
// put for updates using id
app.put('/api/contractors/:id', (req, res) => {
  const id = req.params.id;   // contractor being updated
  const updated = req.body;   // JSON sent 

  //make sql for update 
  const sql = `
    UPDATE Contractor
    SET FullName = ?, Email = ?, Phone = ?, ServiceArea = ?, HourlyRate = ?, Availability = ?, Status = ?, AverageRating = ?, ServiceTypeID = ?
    WHERE ContractorID = ?
  `;

  //array for parameters
  const params = [
    updated.FullName,
    updated.Email,
    updated.Phone,
    updated.ServiceArea,
    updated.HourlyRate,
    updated.Availability,
    updated.Status,
    updated.AverageRating,
    updated.ServiceTypeID,
    id
  ];

  //run sql with params in db
  db.query(sql, params, (err, result) => {
  //error message
    if (err) {
      console.error('Error updating contractor:', err);
      return res.status(500).json({ message: 'Database error while updating contractor' });
    }

	//possible missing contractor or error 
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    //if no error then success
    res.json({ message: 'Contractor updated successfully' });
  });
});

*/

//cancel, disable edit again
cancelEditBtn.addEventListener('click', () => {
  editPanel.classList.add('hidden');
});

//delete
async function handleDelete(id) {
  //warning for user
  const sure = confirm(`Are you sure you want to delete contractor #${id}?`);
  if (!sure) return;

  try {
	//try to connect and delete
    const response = await fetch(`/api/contractors/${id}`, {
      method: 'DELETE'
    });
	
    if (!response.ok) {
      throw new Error('Failed to delete contractor');
    }

	//sucess message, reload info
    alert('Contractor deleted.');
    loadContractors();
  } catch (err) {
	//if not log error, notify user
    console.error(err);
    alert('Error deleting contractor (check console).');
  }
}

/*

// Delete contractor by id
app.delete('/api/contractors/:id', (req, res) => {
  const id = req.params.id;  // comes from /api/contractors/id

 //create sql to run
  const sql = "DELETE FROM Contractor WHERE ContractorID = ?";

 //run sql with id against db
  db.query(sql, [id], (err, result) => {
  //error message
    if (err) {
      console.error("Error deleting contractor:", err);
      return res.status(500).json({ message: "Database error while deleting contractor" });
    }

    // possible no matching id or contractor error
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Contractor not found" });
    }

    // Success
    res.json({ message: "Contractor deleted successfully" });
  });
});

*/

loadContractors();
