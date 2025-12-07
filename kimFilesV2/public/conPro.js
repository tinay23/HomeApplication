const editBtn = document.getElementById('editBtn'); 
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const editButtons = document.getElementById('editButtons');
    const readonlyNote = document.getElementById('readonlyNote');
    const container = document.querySelector('.dashboard-container');
    const fields = container.querySelectorAll('input, select, textarea');

    //temp storage for original data
    let originalValues = {};

	editBtn.addEventListener('click', enterEditMode);
	
    function enterEditMode() {
      //store old info first just in case
      originalValues = {};
      fields.forEach((field) => {
        originalValues[field.id] = field.value;
        field.disabled = false;
      });
	  
	  document.getElementById("rating").disabled = true;
	  
	  //display edit buttons
      editButtons.classList.remove('hidden');
      editBtn.classList.add('hidden');
      readonlyNote.textContent = 'Edit mode is ON. Make your changes and click "Save Changes" or "Cancel".';
    }

    function exitEditMode(restoreOriginal) {
      if (restoreOriginal) {
        // Put back previous values, if restoreOriginal true
        fields.forEach((field) => {
			//using id as subscript for array, replace old values
          if (originalValues[field.id] !== undefined) {
            field.value = originalValues[field.id];
          }
        });
      }

      fields.forEach((field) => {
        field.disabled = true;
      });

      editButtons.classList.add('hidden');
      editBtn.classList.remove('hidden');
      readonlyNote.textContent = 'Currently in view-only mode. Click "Edit Profile" to make changes.';
    }

    saveBtn.addEventListener('click', function () {
			exitEditMode(false);
		/*
	// gather info into updated var package
	  const updated = {
	    fullName: document.getElementById('fullName').value.trim(),
	    businessName: document.getElementById('businessName').value.trim(),
	    tradeType: document.getElementById('tradeType').value,
	    email: document.getElementById('email').value.trim(),
	    phone: document.getElementById('phone').value.trim(),
	    serviceArea: document.getElementById('serviceArea').value.trim(),
	    hourlyRate: Number(document.getElementById('hourlyRate').value),
	    availability: document.getElementById('availability').value.trim(),
	    bio: document.getElementById('bio').value.trim(),
	    certs: document.getElementById('certs').value.trim(),
	    skills: document.getElementById('skills').value.trim()
	  
	  };

  try {
	  //try to make connection
    const response = await fetch(`/api/contractors/${contractorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
		 //update information
      body: JSON.stringify(updated)
    });

	  //if we dont get a good respone, throw error
    if (!response.ok) {
      throw new Error('Failed to update contractor profile');
    }
	  
 //Notify success, disable edit, reload data,keep the edited values
    alert('Profile updated successfully.');
    exitEditMode(false); 
  } catch (err) {
    console.error(err);
    alert('Error saving changes (check console).');
  } */

/*
//for server.js/app.js
// Update Contractor Profile
app.put('/api/contractors/:id', (req, res) => {
  const id = req.params.id;     // this matches :id in URL
  const updated = req.body;     // JSON body

 //create sql to run later
  const sql = `
    UPDATE Contractor
    SET FullName = ?, Email = ?, Phone = ?, ServiceArea = ?, HourlyRate = ?, Availability = ?, Status = ?, AverageRating = ?, ServiceTypeID = ?
    WHERE ContractorID = ?
  `;

 //array of params for query run
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

  //run sql with params against db, ends in err or result
  db.query(sql, params, (err, result) => {
   //error handling message
    if (err) {
      console.error('Error updating contractor profile:', err);
      return res.status(500).json({ message: 'Database error updating contractor profile' });
    }

    //possible missing contractor error 
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    //success message
    res.json({ message: 'Contractor profile updated successfully' });
  });
});

*/
	});
      
	//cancel function, exits and keeps original values
    cancelBtn.addEventListener('click', function () {
	 
      exitEditMode(true);
    });
