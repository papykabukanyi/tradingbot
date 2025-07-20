// Tab fixing script that runs after page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Tab fixing script loaded');
    
    // Remove any old event listeners (just to be safe)
    document.querySelectorAll('.tab').forEach(tab => {
        const tabClone = tab.cloneNode(true);
        tab.parentNode.replaceChild(tabClone, tab);
    });
    
    // Add fresh event listeners
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            console.log('Tab clicked:', tabId);
            
            // Update tab button active states
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update tab content visibility
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            // Show the clicked tab
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.style.display = 'block';
                targetTab.classList.add('active');
                
                // Load tab data
                if (typeof loadTabData === 'function') {
                    loadTabData(tabId);
                }
            } else {
                console.error('Tab content not found:', tabId);
            }
        });
    });
    
    console.log('Tab event listeners fixed');
});
