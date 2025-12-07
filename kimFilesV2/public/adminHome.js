//assign elements from html to const vars in js
const tableBody = document.querySelector('#homeownerTable tbody');
const editPanel = document.getElementById('editPanel');
const editId = document.getElementById('edit-id');
const editFullName = document.getElementById('edit-fullName');
const editAddress = document.getElementById('edit-businessName');

const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

//Load data
async function loadHomeowners() {
  try {
	  //try to load data, if not error message
    const response = await fetch('/api/homeowners');
    if (!response.ok) {
      throw new Error('Failed to fetch homeowners');
    }

	  //display table once data is loaded, error if not
    const homeowners = await response.json();
    renderTable(homeowners);
  } catch (err) {
    console.error(err);
    alert('Error loading homeowners (check console).');
  }
}
/* possible server database code
//for server.js/app.js
//gets homeowners from database
app.get('/api/homeowners', (req, res) => {

//using sql to select all homeowners
  db.query('SELECT * FROM Homeowner', (err, results) => {
  //error handling
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
	//if no error then json the sql results
    res.json(results);
  });
});
*/

//function to make the table using the data we loaded
function renderTable(homeowners) {
  tableBody.innerHTML = ''; 

	//loop through the contractors, adding info per row
  homeowners.forEach(homeowner => {
    const tr = document.createElement('tr');
    tr.dataset.id = homeowner.id;
	  
	//table row format, 2 buttons per row for edit/delete
    tr.innerHTML = `
      <td>${homeowner.id}</td>
      <td>${homeowner.fullName}</td>
      <td>${homeowner.address || ''}</td>
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
      openEditPanel(homeowner);
    });

    deleteBtn.addEventListener('click', () => {
      handleDelete(homeowner.id);
    });

	//each row appended to table
    tableBody.appendChild(tr);
  });
}

//homeowner edit
function openEditPanel(homeowner) {
	//assign values of homeowner to textboxes for editing
  // Or, || ,statments account for possible missing information
  editId.value = homeowner.id;
  editFullName.value = homeowner.fullName || '';
  editAddress.value = homeowner.address || '';

	//make information editable, unhide panel
  editPanel.classList.remove('hidden');
  editPanel.scrollIntoView({ behavior: 'smooth' });
}

//save edit
saveEditBtn.addEventListener('click', async () => {
  const id = editId.value;

// gather info into updated var package
  const updated = {
    fullName: editFullName.value.trim(),
    address: editAddress.value.trim(),
    
  };

  try {
	  //try to make connection
    const response = await fetch(`/api/homeowners/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
	//update information
      body: JSON.stringify(updated)
    });

	//if we dont get a good respone, throw error
    if (!response.ok) {
      throw new Error('Failed to update homeowner');
    }
	
	 // notify success, hide edit and reload table 
    alert('homeowner updated successfully.');
    editPanel.classList.add('hidden');
    loadHomeowners();	
  } catch (err) {
    console.error(err);
    alert('Error saving changes (check console).');
  }
});

/*
//for server.js/app.js
//using put to update, using id
app.put('/api/homeowners/:id', (req, res) => {
  const id = req.params.id;   // from URL /api/homeowners/5
  const updated = req.body;   // from body: JSON.stringify(updated)

  //creating sql with passed vars, need to add more values as db is created
  const sql = `
    UPDATE Homeowner
    SET FullName = ?, Address = ?
    WHERE HomeownerID = ?
  `;

  //array of parameters to update
  const params = [
    updated.FullName,
    updated.Address,
    id
  ];

  //attempt to run sql on db with parameters
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error updating homeowner:', err);
      return res.status(500).json({ message: 'Database error while updating homeowner' });
    }

    // if no rows were changed, error or maybe the ID doesn't exist yet
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Homeowner not found' });
    }

	//no error display success
    res.json({ message: 'Homeowner updated successfully' });
  });
});

*/

//cancel, diable and hide edit panel again
cancelEditBtn.addEventListener('click', () => {
  editPanel.classList.add('hidden');
});

//delete
async function handleDelete(id) {
	//warning for user 
  const sure = confirm(`Are you sure you want to delete homeowner #${id}?`);
  if (!sure) return;

  try {
	  //try to connect and delete
    const response = await fetch(`/api/homeowners/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete homeowner');
    }

	//success message, reload info
    alert('homeowner deleted.');
    loadHomeowners();
  } catch (err) {
	  //if not, log error, notify user
    console.error(err);
    alert('Error deleting homeowner (check console).');
  }
}

/*
//for server.js/app.js
// Delete homeowner by id
app.delete('/api/homeowners/:id', (req, res) => {
  const id = req.params.id;

  //make sql for running
  const sql = "DELETE FROM Homeowner WHERE HomeownerID = ?";

  //run sql with id on db
  db.query(sql, [id], (err, result) => {
  //error checking
    if (err) {
      console.error("Error deleting homeowner:", err);
      return res.status(500).json({ message: "Database error while deleting homeowner" });
    }

    // If no row was deleted, error or the id didn't exist
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Homeowner not found" });
    }

	//if no error then success
    res.json({ message: "Homeowner deleted successfully" });
  });
});

*/

loadHomeowners();
