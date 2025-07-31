// Popup script to handle the toggle switch
document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
    const toggleSwitch = document.getElementById('toggleSwitch') as HTMLInputElement;
    const statusElement = document.getElementById('status') as HTMLElement;

    // Load current state from storage
    const result = await chrome.storage.sync.get(['extensionEnabled']);
    const isEnabled: boolean = result.extensionEnabled !== false; // Default to true

    // Update UI
    toggleSwitch.checked = isEnabled;
    updateStatus(isEnabled);

    // Handle toggle changes
    toggleSwitch.addEventListener('change', async (): Promise<void> => {
        const newState: boolean = toggleSwitch.checked;
        
        // Save state to storage
        await chrome.storage.sync.set({ extensionEnabled: newState });
        
        // Update UI
        updateStatus(newState);
        
        // Send message to content script to update behavior
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.id && tab.url?.includes('dagbladet.no')) {
                await chrome.tabs.sendMessage(tab.id, { 
                    action: 'toggleExtension', 
                    enabled: newState 
                });
            }
        } catch (error) {
            console.log('Could not send message to content script:', error);
        }
    });

    function updateStatus(enabled: boolean): void {
        if (enabled) {
            statusElement.textContent = 'Extension is ON';
            statusElement.className = 'status enabled';
        } else {
            statusElement.textContent = 'Extension is OFF';
            statusElement.className = 'status disabled';
        }
    }
});
