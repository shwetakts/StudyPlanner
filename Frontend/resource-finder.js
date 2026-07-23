// Resource Finder Functionality

// Get task from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const taskFromPlan = urlParams.get('task');

// Display task context if coming from a plan
if (taskFromPlan) {
    const taskContext = document.getElementById('taskContext');
    if (taskContext) {
        taskContext.innerHTML = `<i class="fas fa-book-open"></i> Finding resources for: <strong>"${decodeURIComponent(taskFromPlan)}"</strong>`;
        document.getElementById('searchTopic').value = decodeURIComponent(taskFromPlan);
        // Auto-search when coming from plan
        setTimeout(() => {
            searchResources();
        }, 500);
    }
}

// Search function
async function searchResources() {
    const topic = document.getElementById('searchTopic').value;
    if (!topic) {
        alert('Please enter a topic to search for');
        return;
    }
    
    const resourceTypes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    if (resourceTypes.length === 0) {
        alert('Please select at least one resource type');
        return;
    }
    
    // Show loading, hide results
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    
    const requestData = {
        topic: topic,
        subject: document.getElementById('searchSubject').value,
        resource_type: resourceTypes,
        difficulty: document.getElementById('difficultySelect').value
    };
    
    try {
        const response = await fetch('http://127.0.0.1:8000/resources/find', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) throw new Error('Failed to fetch resources');
        
        const data = await response.json();
        displayResourceResults(data);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to find resources. Please try again.');
    } finally {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
    }
}

function displayResourceResults(data) {
    // Display summary
    const summaryDiv = document.getElementById('summarySection');
    summaryDiv.innerHTML = `
        <i class="fas fa-graduation-cap" style="font-size: 1.5rem;"></i>
        <h3 style="margin: 0.5rem 0; color: white;">${data.topic}</h3>
        <p style="color: rgba(255,255,255,0.9);">${data.summary}</p>
        <div style="margin-top: 1rem; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
            <i class="fas fa-chart-line"></i> ${data.resources.length} resources found
        </div>
    `;
    
    // Display resources grid
    const gridDiv = document.getElementById('resourcesGrid');
    if (data.resources.length === 0) {
        gridDiv.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: rgba(255,255,255,0.1); border-radius: 16px;">
                <i class="fas fa-folder-open" style="font-size: 3rem; color: white;"></i>
                <p style="color: white; margin-top: 1rem;">No resources found. Try different search terms or resource types.</p>
            </div>
        `;
    } else {
        gridDiv.innerHTML = data.resources.map(resource => `
            <div class="resource-card" onclick="window.open('${resource.url}', '_blank')">
                <div style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.75rem; background: ${getResourceColor(resource.type)}; color: white;">
                    ${getResourceIcon(resource.type)} ${resource.type.toUpperCase()}
                </div>
                <h4 style="margin: 0.5rem 0; font-size: 1rem; color: #333;">${escapeHtml(resource.title)}</h4>
                <div style="color: #666; font-size: 0.85rem; margin: 0.5rem 0;">
                    <i class="fas ${getSourceIcon(resource.source)}"></i> ${resource.source}
                    ${resource.duration ? ` • ${resource.duration}` : ''}
                </div>
                <p style="font-size: 0.85rem; color: #666; line-height: 1.4; margin: 0.5rem 0;">${escapeHtml(resource.description)}</p>
                <div style="margin-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                    <span style="background: #f0f0f0; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem;">
                        ${getDifficultyStars(resource.difficulty)}
                    </span>
                    <span style="color: #667eea; font-size: 0.8rem;">
                        Click to open <i class="fas fa-external-link-alt"></i>
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    // Display recommendations
    const recDiv = document.getElementById('recommendationsSection');
    recDiv.innerHTML = `
        <i class="fas fa-lightbulb" style="font-size: 1.2rem;"></i>
        <strong style="color: white;">📖 Recommended Study Path</strong>
        <p style="color: rgba(255,255,255,0.9); margin-top: 0.5rem;">${data.recommendations}</p>
    `;
}

// Helper functions
function getResourceColor(type) {
    const colors = {
        'video': '#ff4757',
        'text': '#1e90ff',
        'audio': '#2ed573'
    };
    return colors[type] || '#667eea';
}

function getResourceIcon(type) {
    const icons = {
        'video': '🎥',
        'text': '📝',
        'audio': '🎧'
    };
    return icons[type] || '📚';
}

function getSourceIcon(source) {
    const icons = {
        'YouTube': 'fa-youtube',
        'Khan Academy': 'fa-graduation-cap',
        'Coursera': 'fa-university',
        'MIT OpenCourseWare': 'fa-building',
        'Wikipedia': 'fa-wikipedia-w'
    };
    return icons[source] || 'fa-globe';
}

function getDifficultyStars(difficulty) {
    const levels = {
        'beginner': '⭐ Beginner',
        'intermediate': '⭐⭐ Intermediate',
        'advanced': '⭐⭐⭐ Advanced'
    };
    return levels[difficulty] || '⭐⭐ Intermediate';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchResourcesBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchResources);
    }
    
    const searchInput = document.getElementById('searchTopic');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchResources();
            }
        });
    }
});

// Dark mode toggle (if needed)
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    const currentTheme = localStorage.getItem('theme') || 'light-mode';
    document.body.classList.add(currentTheme);
    if (currentTheme === 'dark-mode') {
        themeToggle.checked = true;
    }
    
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light-mode');
        }
    });
}