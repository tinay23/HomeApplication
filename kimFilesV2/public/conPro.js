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
        // Put back previous values
        fields.forEach((field) => {
			//using id as subscript for array
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
      // update database
      exitEditMode(false);
    });

    cancelBtn.addEventListener('click', function () {
	  //cancel
      exitEditMode(true);
    });
