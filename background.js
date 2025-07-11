// Background service worker for Driving Test Helper

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Driving Test Helper installed successfully!');
    } else if (details.reason === 'update') {
        console.log('Driving Test Helper updated!');
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This will be handled by the popup, but we can add additional logic here if needed
    console.log('Extension icon clicked on tab:', tab.url);
});

// Keep service worker alive
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ping') {
        sendResponse({ status: 'alive' });
    }
    return true;
}); 