// Load and display current status
document.addEventListener('DOMContentLoaded', async () => {
  // Load current settings into input field
  const result = await browser.storage.sync.get({ tabLimit: 10 });
  document.getElementById('tabLimitInput').value = result.tabLimit;
  
  await updateInfo();
  
  // Update info periodically
  setInterval(updateInfo, 1000); // this function runs every second
});

async function updateInfo() {
  // Get tab limit
  const result = await browser.storage.sync.get({ tabLimit: 10 }); // default value is 10
  // unless the tabLimit key already exists
  document.getElementById('tabLimit').textContent = result.tabLimit;
  
  // Get current tab count
  const tabs = await browser.tabs.query({ currentWindow: true });
  const regularTabs = tabs.filter(t => !t.url.startsWith('about:') && !t.url.startsWith('moz-extension://'));
  document.getElementById('currentTabs').textContent = regularTabs.length;
}

// Save settings
document.getElementById('saveBtn').addEventListener('click', async () => {
  const tabLimit = parseInt(document.getElementById('tabLimitInput').value);
  
  if (isNaN(tabLimit) || tabLimit < 1) {
    showStatus('Please enter a valid number (1 or greater)', false);
    return;
  }
  
  await browser.storage.sync.set({ tabLimit: tabLimit });
  showStatus('Settings saved successfully!', true);
  await updateInfo();
});

// Show status message
function showStatus(message, success) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + (success ? 'success' : 'error');
  statusDiv.style.display = 'block';
  
  // after three seconds the status message disappears, neat
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

