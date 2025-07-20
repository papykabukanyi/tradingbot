// This script adds a simple tab switcher that guarantees tab functionality
document.addEventListener('DOMContentLoaded', function() {
    // Make sure tabs work by setting direct click handlers
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Get the tab name from data-tab attribute
            const tabName = this.getAttribute('data-tab');
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            // Show the clicked tab
            const tabContent = document.getElementById(tabName);
            if (tabContent) {
                tabContent.style.display = 'block';
                tabContent.classList.add('active');
            }
            
            // Update active tab style
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Call loadTabData if it exists
            if (typeof loadTabData === 'function') {
                loadTabData(tabName);
            }
        });
    });
    
    // Show dashboard by default
    document.querySelector('.tab[data-tab="dashboard"]').click();
});
