// Theme Management
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const html = document.documentElement;

// Function to set theme
function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeIcon(theme);
}

// Function to update theme icon
function updateThemeIcon(theme) {
  if (theme === 'dark') {
    themeIcon.className = 'bi bi-moon-fill';
  } else {
    themeIcon.className = 'bi bi-sun-fill';
  }
}

// Function to get user's preferred theme (default to dark)
function getPreferredTheme() {
  // Check if user has previously selected a theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme;
  }
  
  // Default to dark mode, but respect system preference if light
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

// Initialize theme on page load
function initializeTheme() {
  const preferredTheme = getPreferredTheme();
  setTheme(preferredTheme);
}

// Theme toggle event listener
themeToggle.addEventListener('click', () => {
  const currentTheme = html.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  // Only auto-switch if user hasn't manually selected a theme
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'dark' : 'light');
  }
});

// Country code mapping for flag display
const countryFlags = {
  'American': 'US',
  'British': 'GB',
  'Canadian': 'CA',
  'Chinese': 'CN',
  'Croatian': 'HR',
  'Dutch': 'NL',
  'Egyptian': 'EG',
  'Filipino': 'PH',
  'French': 'FR',
  'Greek': 'GR',
  'Indian': 'IN',
  'Irish': 'IE',
  'Italian': 'IT',
  'Jamaican': 'JM',
  'Japanese': 'JP',
  'Kenyan': 'KE',
  'Malaysian': 'MY',
  'Mexican': 'MX',
  'Moroccan': 'MA',
  'Polish': 'PL',
  'Portuguese': 'PT',
  'Russian': 'RU',
  'Spanish': 'ES',
  'Thai': 'TH',
  'Tunisian': 'TN',
  'Turkish': 'TR',
  'Ukrainian': 'UA',
  'Vietnamese': 'VN'
};

// Populate the area dropdown when the page loads
window.addEventListener("DOMContentLoaded", async function () {
  // Initialize theme first
  initializeTheme();
  
  const areaSelect = document.getElementById("area-select");
  areaSelect.innerHTML = '<option value="">Select Area</option>';

  try {
    // Fetch list of available areas from the API
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list");
    const data = await response.json();
    
    if (data.meals) {
      // Add each area as an option in the dropdown
      data.meals.forEach((areaObj) => {
        const option = document.createElement("option");
        option.value = areaObj.strArea;
        option.textContent = areaObj.strArea;
        areaSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error loading areas:", error);
  }
});

// When the user selects an area, fetch and display meals for that area
document.getElementById("area-select").addEventListener("change", async function () {
  const area = this.value;
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = ""; // Clear previous results

  if (!area) return;

  try {
    // Show loading message
    resultsDiv.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    // Fetch meals for the selected area
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(area)}`);
    const data = await response.json();
    
    resultsDiv.innerHTML = ""; // Clear loading message

    if (data.meals) {
      // Create Bootstrap cards for each meal
      data.meals.forEach((meal) => {
        const colDiv = document.createElement("div");
        colDiv.className = "col-lg-3 col-md-4 col-sm-6 mb-4";

        // Create the Bootstrap card
        const cardHTML = `
          <div class="card recipe-card h-100" data-meal-id="${meal.idMeal}">
            <img src="${meal.strMealThumb}" class="card-img-top" alt="${meal.strMeal}">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${meal.strMeal}</h5>
              <div class="mt-auto">
                <small class="text-muted">Click to view recipe</small>
              </div>
            </div>
          </div>
        `;

        colDiv.innerHTML = cardHTML;
        
        // Add click event to open modal with recipe details
        const card = colDiv.querySelector('.recipe-card');
        card.addEventListener('click', () => openRecipeModal(meal.idMeal));
        
        resultsDiv.appendChild(colDiv);
      });
    } else {
      resultsDiv.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No meals found for this area.</p></div>';
    }
  } catch (error) {
    console.error("Error loading meals:", error);
    resultsDiv.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Error loading recipes. Please try again.</p></div>';
  }
});

// Function to open the recipe modal with detailed information
async function openRecipeModal(mealId) {
  const modal = new bootstrap.Modal(document.getElementById('recipeModal'));
  const modalTitle = document.getElementById('recipeModalLabel');
  const modalContent = document.getElementById('modal-content');
  const modalThumbnailContainer = document.getElementById('modal-thumbnail-container');
  const modalMediaContainer = document.getElementById('modal-media-container');

  try {
    // Show loading state
    modalTitle.textContent = 'Loading...';
    modalContent.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div></div>';
    modalThumbnailContainer.innerHTML = '';
    modalMediaContainer.innerHTML = '';
    modal.show();

    // Fetch detailed recipe information
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
    const data = await response.json();

    if (data.meals && data.meals[0]) {
      const meal = data.meals[0];
      
      // Update modal title
      modalTitle.textContent = meal.strMeal;

      // Always show the recipe thumbnail at the top left
      const thumbnailHTML = `<img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-modal-thumbnail">`;
      modalThumbnailContainer.innerHTML = thumbnailHTML;

      // Handle video content in the left column below thumbnail
      if (meal.strYoutube) {
        // Extract YouTube video ID and create embedded video
        const videoId = extractYouTubeId(meal.strYoutube);
        if (videoId) {
          // Check if video is available before showing embed
          checkYouTubeVideo(videoId).then(isAvailable => {
            if (isAvailable) {
              const videoHTML = `
                <div class="video-container">
                  <iframe src="https://www.youtube.com/embed/${videoId}" 
                          frameborder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowfullscreen
                          onerror="this.parentElement.style.display='none'">
                  </iframe>
                </div>
              `;
              modalMediaContainer.innerHTML = videoHTML;
            } else {
              // Video is not available, hide the container
              modalMediaContainer.innerHTML = '';
            }
          }).catch(() => {
            // Error checking video, hide the container
            modalMediaContainer.innerHTML = '';
          });
        } else {
          // Invalid video ID, hide the container
          modalMediaContainer.innerHTML = '';
        }
      } else {
        // No video URL provided, hide the container
        modalMediaContainer.innerHTML = '';
      }

      // Get country flag
      const flagCode = countryFlags[meal.strArea] || '';
      const flagImg = flagCode ? `<img src="https://flagcdn.com/32x24/${flagCode.toLowerCase()}.png" alt="${meal.strArea} flag" class="country-flag">` : '';

      // Extract ingredients and measurements
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        
        if (ingredient && ingredient.trim()) {
          ingredients.push({
            name: ingredient.trim(),
            measure: measure ? measure.trim() : ''
          });
        }
      }

      // Create ingredients list HTML
      const ingredientsHTML = ingredients.map(ing => 
        `<div class="ingredient-item">
          <span class="ingredient-name">${ing.name}</span>
          <span class="ingredient-measure">${ing.measure}</span>
        </div>`
      ).join('');

      // Create the modal content (without the thumbnail, as it's now separate)
      const contentHTML = `
        <div class="mb-3">
          <h4>${meal.strMeal} ${flagImg}</h4>
          <span class="category-badge">${meal.strCategory}</span>
        </div>

        <div class="ingredients-list">
          <h6><i class="bi bi-list-ul"></i> Ingredients</h6>
          ${ingredientsHTML}
        </div>

        <div class="instructions-section">
          <h6><i class="bi bi-book"></i> Instructions</h6>
          <div class="instructions-text">${meal.strInstructions}</div>
        </div>
      `;

      modalContent.innerHTML = contentHTML;
    } else {
      modalContent.innerHTML = '<div class="text-center text-danger">Recipe details not found.</div>';
    }
  } catch (error) {
    console.error("Error loading recipe details:", error);
    modalContent.innerHTML = '<div class="text-center text-danger">Error loading recipe details. Please try again.</div>';
  }
}

// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Function to check if YouTube video is available
async function checkYouTubeVideo(videoId) {
  try {
    // Use YouTube's oEmbed API to check if video exists and is available
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    // If the response is successful, the video is available
    return response.ok;
  } catch (error) {
    // If there's an error (network, CORS, etc.), assume video is not available
    console.log('Error checking YouTube video availability:', error);
    return false;
  }
}
