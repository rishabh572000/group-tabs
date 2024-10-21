// Utility function to extract the base URL (domain) from a full URL
function getBaseUrl(url) {
  try {
    // Skip internal Chrome pages and invalid URLs
    if (url.startsWith("chrome://") || url.startsWith("about:")) {
      console.warn("Skipping internal URL:", url);
      return null;
    }

    const urlObject = new URL(url);
    return urlObject.origin;
  } catch (error) {
    console.error("Invalid URL encountered:", url, error);
    return null;  // Skip invalid URLs
  }
}

// Function to group all tabs by their base URL and ensure groups are collapsed
function groupTabs() {
  console.log(chrome, 'raju',  chrome.tabGroups)
  if (!chrome.tabGroups) {
    console.error("chrome.tabGroups API is not available in this environment.");
    return;
  }


  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    const groupedTabs = {};

    // Organize tabs by their base URL
    tabs.forEach((tab) => {
      const baseUrl = getBaseUrl(tab.url);
      if (baseUrl) {  // Ensure URL is valid
        if (!groupedTabs[baseUrl]) {
          groupedTabs[baseUrl] = [];
        }
        groupedTabs[baseUrl].push(tab.id);
      }
    });

    // Create a group for each base URL and move tabs into the group
    Object.keys(groupedTabs).forEach((baseUrl) => {
      chrome.tabs.group({ tabIds: groupedTabs[baseUrl] }, (groupId) => {
        if (chrome.runtime.lastError) {
          console.error("Error creating tab group:", chrome.runtime.lastError);
        } else if (groupId) {  // Ensure groupId is valid
          // Always collapse the group after it's created, with a delay

          chrome.tabGroups.update(groupId, { title: baseUrl, collapsed: true }, () => {
            if (chrome.runtime.lastError) {
              console.error("Error updating tab group:", chrome.runtime.lastError);
            }
          });

        } else {
          console.error("Group ID is undefined. Unable to update group.");
        }
      });
    });
  });
}

// Ensure all groups are collapsed by default (with a delay to ensure success)
function collapseAllGroups() {
  chrome.tabGroups.query({}, (groups) => {
    groups.forEach((group) => {
      chrome.tabGroups.update(group.id, { collapsed: true }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error collapsing group:", chrome.runtime.lastError);
        }
      });

    });
  });
}

// Run when the extension's action button is clicked
// chrome.runtime.onInstalled.addListener(() => {
//   groupTabs();  // Group tabs when the button is clicked
// });

// Listen for new tab creation
chrome.tabs.onCreated.addListener(() => {
  groupTabs();  // Re-run the grouping logic when a new tab is created
});

// Listen for tab updates (e.g., when a tab finishes loading)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {  // Only group tabs once they have fully loaded
    groupTabs();  // Re-run the grouping logic
    
  }
});

// Listen for tab removal and regroup remaining tabs
// chrome.tabs.onRemoved.addListener(() => {
//   console.log('remove')
//   groupTabs();  // Re-run the grouping logic when a tab is removed
// });

// Collapse all groups when the extension is first loaded
chrome.runtime.onStartup.addListener(() => {
  collapseAllGroups();
});
