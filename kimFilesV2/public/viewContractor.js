//get id from the search
function getIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

//try to load information via id
async function loadContractor() {
  const id = getIdFromQuery();
  if (!id) {
	  //error message incase contractor doesnt exist
    document.getElementById('profileTagline').textContent = 'No contractor id provided.';
    return;
  }

	//try catch to get data from database
  try {
    const response = await fetch(`/api/contractors/${encodeURIComponent(id)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch contractor');
    }
	//call function to load and display data via proper load
    const c = await response.json();
    fillProfile(c);
	//error message if not loaded
  } catch (err) {
    console.error(err);
    document.getElementById('profileTagline').textContent = 'Error loading contractor.';
  }
}

//function to display data 
function fillProfile(c) {
	//variables for text locations for refrence
  const title = document.getElementById('profileTitle');
  const tagline = document.getElementById('profileTagline');

	//fill title and tagline with info based on what comes back
  title.textContent = c.businessName || c.fullName || 'Contractor Profile';
  tagline.textContent = c.tradeType ? `${c.tradeType} services` : 'Contractor details';

	//fill other information spots
  document.getElementById('fullName').textContent = c.fullName || '–';
  document.getElementById('businessName').textContent = c.businessName || '–';
  document.getElementById('tradeType').textContent = c.tradeType || '–';
  document.getElementById('serviceArea').textContent = c.serviceArea || '–';

  //if raiting exsits display, if not show message
  if (c.rating != null) {
    document.getElementById('rating').textContent = `${c.rating.toFixed(1)} / 5`;
  } else {
    document.getElementById('rating').textContent = 'No rating yet';
  }
 
	//get rest of information, display messages if anything is missing
  document.getElementById('bio').textContent = c.bio || 'No description provided yet.';
  document.getElementById('skills').textContent = c.skills || 'No skills listed.';
  document.getElementById('extrasText').textContent = c.extras || 'None listed.';

  document.getElementById('email').textContent = c.email || '–';
  document.getElementById('phone').textContent = c.phone || '–';
}

loadContractor();

//NOTE: possible code for data base use
/*app.get('/api/contractors', (req, res) => {
  db.query(
    'SELECT id, full_name AS fullName, business_name AS businessName, trade_type AS tradeType, rating, service_area AS serviceArea, bio, skills, extras, email, phone FROM contractors',
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows);
    }
  );
});

app.get('/api/contractors/:id', (req, res) => {
  const id = req.params.id;
  db.query(
    'SELECT id, full_name AS fullName, business_name AS businessName, trade_type AS tradeType, rating, service_area AS serviceArea, bio, skills, extras, email, phone FROM contractors WHERE id = ?',
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(rows[0]);
    }
  );
});
*/
