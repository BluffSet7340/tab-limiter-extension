// so I specified this script under the service_worker key, which means that it runs in the background and stays active as long as it receives events and can become dormant when not needed. This is also the main event handler for all that the user does in the browser. 

// another thing to not is that it doesn't have DOM access, so you cannot access the document.*, whatever that may be. 

// Default tab limit
const DEFAULT_TAB_LIMIT = 10;

// Listen for tab creation

// so the tab.onCreated event is a part of the tabs api and gives you access to information related to the tab opened by the user, a listener is attached to this event and runs the function inside of it - new tab url is set to about:blank

// whenever this function is called, it recevies "tab" as the argument
browser.tabs.onCreated.addListener(async (tab) => {
  // Get the tab limit from storage

  // I guess the storage api is pretty obvious, it stores data needed for the extensions and can also listen to changed for stored items. This is asynchronous, meaning that while data is being saved or updated, the UI isn't paused or blocked, you can continue with clicks and whatnot. Information has to be stored in the format of a JSON file.
  
  // the await keyword is used to execution stops until this line of code runs 
  // the .sync means that this is synced to all instances of the browser, so all tabs and windows belonging to that specific profile. This requires you set a specific add-on id for your extension
  const result = await browser.storage.sync.get({ tabLimit: DEFAULT_TAB_LIMIT });

  // so the thing with .sync is that the settings will be saved across all devices on the same account. Tbh I don't see how useful it is for my extension as imo people don't rly make a firefox account for syncing data but let it be. Since I'm only storing a single number, the tab limit, will leave it in sync storage

  // so the get method is called to retrieve data stored in storage.sync if you want to access from console, inspect extension and write command in console

  const tabLimit = result.tabLimit; // key value pairs, so access the tabLimit key

  // Get all tabs in the current window
  // so the query method is used to grab tabs of specified properties
  // in this case, grab all tabs that have the same windowId that belongs
  // to the specific tab argument that was passed when the new tab is created
  const tabs = await browser.tabs.query({ windowId: tab.windowId });
  // returns an array

  // Count non-about:// and non-moz-extension:// tabs (we typically don't want to count internal pages)
  const regularTabs = tabs.filter(t => !t.url.startsWith('about:') 
  && !t.url.startsWith('moz-extension://'));
  
  // If we exceed the limit, close the newly created tab
  if (regularTabs.length == tabLimit) {
    // Find the newly created tab and close it
    // The tab might be the last one or we need to identify it
    // so using the find callback, return the tab that is equal to the new tab opened
    const newTab = tabs.find(t => t.id === tab.id);
    if (newTab) {
      browser.tabs.remove(tab.id); // remove tab based on id
      
      // Show a notification (Firefox uses browser.notifications). This requires the notification permission from the user
      browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Tab Limit Reached',
        message: `You've reached your tab limit of ${tabLimit}. Close some tabs to open new ones.`
      }).catch(() => {
        // Notifications permission might not be granted, that's okay
      });
    }
  }
});

// Also handle when tabs are moved between windows
// onAttached query is perfect for this, as per MDN documentation
// when this listener is called, two arguments are passed,
// tabId is the id of the tab attached to a new window
// and attachInfo is an object that contains info regarding
// the id of the new window
browser.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  // grab the tab limit again, in case it has changed 
  const result = await browser.storage.sync.get({ tabLimit: DEFAULT_TAB_LIMIT });
  const tabLimit = result.tabLimit;
  
  // now get all the tabs that belong to the new window
  const tabs = await browser.tabs.query({ windowId: attachInfo.newWindowId });
  // filter as always
  const regularTabs = tabs.filter(t => !t.url.startsWith('about:') && !t.url.startsWith('moz-extension://'));
  
  // now check the limit
  if (regularTabs.length > tabLimit) {
    browser.tabs.remove(tabId); // in case if the tab is moved to a window where 
    // the tab limit has already been exceeded
  }
});

// Listen for when the extension is installed, fired when first installed, updated, or browser is updated
// so it runs when those conditions are met
browser.runtime.onInstalled.addListener(() => {
  // Set default tab limit if not already set
  // initially tries to find the tabLimit and see if it is set in sync storage
  // result is the callback to that function, whether that key exists or not
  // if it doesn't exist, then boom we set the tab limit and we r good to go
  browser.storage.sync.get({ tabLimit: DEFAULT_TAB_LIMIT }, (result) => {
    if (!result.tabLimit) {
      browser.storage.sync.set({ tabLimit: DEFAULT_TAB_LIMIT });
    }
  });
});

