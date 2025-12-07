
//set up variables for html elements
const grid = document.getElementById('contractorGrid');
const searchInput = document.getElementById('searchInput');
const tradeFilter = document.getElementById('tradeFilter');
const emptyMessage = document.getElementById('emptyMessage');

let allContractors = [];

// Load contractors
async function loadContractors() {
  try {
    const response = await fetch('/api/contractors'); // same endpoint admin uses
    if (!response.ok) {
      throw new Error('Failed to fetch contractors');
    }
    allContractors = await response.json();
    renderContractors();
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p>Error loading contractors.</p>';
  }
}

/*

// load all contractors
app.get('/api/contractors', (req, res) => {
	//select all contractors
  const sql = "SELECT * FROM Contractor"; 

 //run sql aginast db ends in err or results
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching contractors:', err);
      return res.status(500).json({ message: 'Database error while loading contractors' });
    }

    //if no error json results
    res.json(results); 
  });
});

*/

//display contractors
function renderContractors() {
  grid.innerHTML = '';

	//varibales for search and filter
  const searchText = searchInput.value.trim().toLowerCase();
  const selectedTrade = tradeFilter.value;

	//filter based on search/trade
  const filtered = allContractors.filter(c => {
    const matchesTrade = !selectedTrade || c.tradeType === selectedTrade;
    const textToSearch = `${c.fullName || ''} ${c.businessName || ''}`.toLowerCase();
    const matchesSearch = !searchText || textToSearch.includes(searchText);
    return matchesTrade && matchesSearch;
  });

	//if filtered is empty then unhide the emptyMessage error
  if (filtered.length === 0) {
    emptyMessage.classList.remove('hidden');
	//return to end progress
    return;
	//otherwise hide it 
  } else {
    emptyMessage.classList.add('hidden');
  }

	//if filtered is not empty then display it
  filtered.forEach(c => {
    const card = document.createElement('div');
    card.className = 'card';

	//handles case if no rating 
    const ratingText = c.rating != null ? `${c.rating.toFixed(1)} / 5` : 'No rating yet';

	//display contractor information
    card.innerHTML = `
      <h3>${c.businessName || c.fullName}</h3>
      <small>${c.fullName}${c.businessName ? ' • ' + c.tradeType : ''}</small>
      <small>Trade: ${c.tradeType || 'N/A'}</small>
      <small>Area: ${c.serviceArea || 'Not specified'}</small>
      <small class="rating">Rating: ${ratingText}</small>
      <a class="btn" href="viewContractor.html?id=${encodeURIComponent(c.id)}">View Profile</a>
    `;

	//appends information to grid
    grid.appendChild(card);
  });
}

//waits for events on search and traid and runs render to keep things updated
searchInput.addEventListener('input', renderContractors);
tradeFilter.addEventListener('change', renderContractors);

loadContractors();
