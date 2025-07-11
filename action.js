document.addEventListener('DOMContentLoaded', function() {
    const manualBtn = document.getElementById('manualBtn');

    manualBtn.addEventListener('click', async function() {
        try {
            manualBtn.disabled = true;
            manualBtn.textContent = '🔄';

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                throw new Error('Cannot access this page');
            }

            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['scripts/domHelpers.js', 'scripts/injector.js']
            });

            // Call manual processing function
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    if (window.drivingTestHelper && window.drivingTestHelper.processManual) {
                        window.drivingTestHelper.processManual();
                    }
                }
            });

            manualBtn.textContent = '✅';
            setTimeout(() => {
                manualBtn.textContent = '🎯';
                manualBtn.disabled = false;
            }, 2000);

        } catch (error) {
            manualBtn.textContent = '❌';
            manualBtn.disabled = false;
            setTimeout(() => {
                manualBtn.textContent = '🎯';
            }, 2000);
        }
    });
}); 