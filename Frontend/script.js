// ========== User Authentication & Logout ==========

// Check if user is logged in, redirect if not
function checkAuth() {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        // Not logged in, redirect to index
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Display user info in header with logout button
function displayUserInfo() {
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    
    if (userName && userEmail) {
        // Check if user info already exists
        if (!document.getElementById('userInfo')) {
            const headerContent = document.querySelector('.header-content');
            
            // Create user info div
            const userInfoDiv = document.createElement('div');
            userInfoDiv.id = 'userInfo';
            userInfoDiv.style.cssText = `
                display: flex;
                align-items: center;
                gap: 1rem;
                background: rgba(102, 126, 234, 0.15);
                padding: 0.5rem 1rem;
                border-radius: 50px;
                margin-left: auto;
                backdrop-filter: blur(5px);
            `;
            
            // Get first letter of name for avatar
            const firstLetter = userName.charAt(0).toUpperCase();
            
            userInfoDiv.innerHTML = `
                <div style="
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 1rem;
                ">
                    ${escapeHtml(firstLetter)}
                </div>
                <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-color, #333);">
                    ${escapeHtml(userName)}
                </span>
                <button id="logoutBtn" style="
                    background: linear-gradient(135deg, #dc3545, #c82333);
                    color: white;
                    border: none;
                    padding: 0.4rem 1rem;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                ">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            `;
            
            headerContent.appendChild(userInfoDiv);
            
            // Add logout functionality
            document.getElementById('logoutBtn').onclick = () => {
                logout();
            };
        }
    }
}

// Logout function
function logout() {
    console.log("Logging out...");
    
    // Clear all localStorage
    localStorage.clear();
    
    // Disable Google auto-select
    if (typeof google !== 'undefined') {
        google.accounts.id.disableAutoSelect();
    }
    
    // Show logout message
    alert('Logged out successfully!');
    
    // Redirect to index page
    window.location.href = 'index.html';
}

// Run auth check on all protected pages
if (window.location.pathname.includes('main.html') || 
    window.location.pathname.includes('history.html') || 
    window.location.pathname.includes('timer.html') ||
    window.location.pathname.includes('resources.html')) {
    
    // Check authentication
    if (!checkAuth()) {
        // Redirect happens in checkAuth()
    } else {
        // Display user info after page loads
        document.addEventListener('DOMContentLoaded', function() {
            displayUserInfo();
        });
    }
}

// Theme Toggle with Animation
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    const currentTheme = localStorage.getItem('theme') || 'light-mode';
    document.body.classList.add(currentTheme);
    if (currentTheme === 'dark-mode') {
        themeToggle.checked = true;
    }
    
    themeToggle.addEventListener('change', () => {
        document.body.style.opacity = '0';
        setTimeout(() => {
            if (themeToggle.checked) {
                document.body.classList.remove('light-mode');
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
                document.body.classList.add('light-mode');
                localStorage.setItem('theme', 'light-mode');
            }
            document.body.style.opacity = '1';
        }, 200);
    });
}

// Sidebar Toggle with Animation
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarCollapse = document.getElementById('sidebarCollapse');

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        mainContent.classList.add('active');
    });
}

if (sidebarCollapse) {
    sidebarCollapse.addEventListener('click', () => {
        sidebar.classList.remove('active');
        mainContent.classList.remove('active');
    });
}

// ========== Helper Functions ==========

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Parse duration
function parseDuration(durationString) {
    const match = durationString.match(/(\d+)\s*(hrs?|hours?|mins?|minutes?)/i);
    if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        if (unit.startsWith('hr') || unit.startsWith('hour')) {
            return value * 3600;
        } else if (unit.startsWith('min')) {
            return value * 60;
        }
    }
    return null;
}

function startTaskTimer(durationString) {
    const duration = parseDuration(durationString);
    if (duration) {
        window.location.href = `timer.html?duration=${duration}`;
    } else {
        alert('Invalid duration format. Please use format like "1 hour" or "30 minutes".');
    }
}

// ========== Database API Functions ==========

// Save plan to backend
async function savePlanToDatabase(planData) {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        alert('Please sign in to save plans');
        return false;
    }
    
    try {
        const response = await fetch('/api/save-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_email: userEmail,
                ...planData
            })
        });
        
        if (!response.ok) throw new Error('Failed to save plan');
        
        const result = await response.json();
        console.log('Plan saved:', result);
        return true;
        
    } catch (error) {
        console.error('Error saving plan:', error);
        alert('Failed to save plan. Please try again.');
        return false;
    }
}

// Load plans from backend
async function loadPlansFromDatabase() {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        return [];
    }
    
    try {
        const response = await fetch(`/api/get-plans/${encodeURIComponent(userEmail)}`);
        
        if (!response.ok) throw new Error('Failed to load plans');
        
        const plans = await response.json();
        console.log('Loaded plans:', plans);
        return plans;
        
    } catch (error) {
        console.error('Error loading plans:', error);
        alert('Failed to load plans. Please refresh the page.');
        return [];
    }
}

// Delete plan from backend
async function deletePlanFromDatabase(planId) {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return false;
    
    try {
        const response = await fetch(`/api/delete-plan/${planId}?user_email=${encodeURIComponent(userEmail)}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete plan');
        
        console.log('Plan deleted');
        return true;
        
    } catch (error) {
        console.error('Error deleting plan:', error);
        alert('Failed to delete plan');
        return false;
    }
}

// Update plan progress
async function updatePlanProgressInDB(planId, progress, checkedTasks) {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return false;
    
    try {
        const response = await fetch(`/api/update-plan-progress/${planId}?user_email=${encodeURIComponent(userEmail)}&progress=${progress}&checked_tasks=${JSON.stringify(checkedTasks)}`, {
            method: 'PUT'
        });
        
        if (!response.ok) throw new Error('Failed to update progress');
        
        return true;
        
    } catch (error) {
        console.error('Error updating progress:', error);
        return false;
    }
}

// ========== Form Submission ==========

const studyPlanForm = document.getElementById('studyPlanForm');
if (studyPlanForm) {
    studyPlanForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const tasksInput = document.getElementById('tasks').value;
        const tasks = tasksInput.split(',').map(task => task.trim());
        const timeAvailable = document.getElementById('timeAvailable').value;
        
        const resultDiv = document.getElementById('studyPlanResult');
        resultDiv.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: white;"></i>
                <p style="color: white; margin-top: 1rem;">Generating your personalized study plan...</p>
            </div>
        `;
        
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        try {
            const response = await fetch('/generate-plan/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tasks: tasks,
                    time_available: timeAvailable
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate plan');
            }
            
            const data = await response.json();
            const plan = data.study_plan;
            
            if (!plan || plan === "") {
                throw new Error('Received empty plan');
            }
            
            const rows = plan.split('\n').filter(row => row.trim() !== '');
            
            if (rows.length === 0) {
                throw new Error('No plan content received');
            }
            
            const table = document.createElement('table');
            table.classList.add('study-plan-table');
            
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['', 'Time Slot', 'Task', 'Duration', 'Break', 'Action'].forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            let validRows = 0;
            
            for (let i = 0; i < rows.length; i++) {
                const cells = rows[i].split('|').map(cell => cell.trim()).filter(cell => cell !== '');
                if (cells.length >= 4) {
                    validRows++;
                    const tr = document.createElement('tr');
                    
                    const tdCheck = document.createElement('td');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.classList.add('task-checkbox');
                    tdCheck.appendChild(checkbox);
                    tr.appendChild(tdCheck);
                    
                    const tdTime = document.createElement('td');
                    tdTime.textContent = escapeHtml(cells[0]);
                    tr.appendChild(tdTime);
                    
                    const tdTask = document.createElement('td');
                    tdTask.textContent = escapeHtml(cells[1]);
                    tr.appendChild(tdTask);
                    
                    const tdDuration = document.createElement('td');
                    tdDuration.textContent = escapeHtml(cells[2]);
                    tr.appendChild(tdDuration);
                    
                    const tdBreak = document.createElement('td');
                    tdBreak.textContent = escapeHtml(cells[3] || '-');
                    tr.appendChild(tdBreak);
                    
                    const tdAction = document.createElement('td');
                    const timerBtn = document.createElement('button');
                    timerBtn.innerHTML = '<i class="fas fa-play"></i> Start Timer';
                    timerBtn.classList.add('start-timer-btn');
                    timerBtn.addEventListener('click', () => {
                        startTaskTimer(cells[2]);
                    });
                    tdAction.appendChild(timerBtn);
                    tr.appendChild(tdAction);
                    
                    tbody.appendChild(tr);
                }
            }
            
            if (validRows === 0) {
                throw new Error('No valid rows found in the plan');
            }
            
            table.appendChild(tbody);
            resultDiv.innerHTML = '';
            resultDiv.appendChild(table);
            addResourceButtonsToPlan();
            
            const saveBtn = document.getElementById('savePlanButton');
            if (saveBtn) {
                saveBtn.style.display = 'block';
                const newSaveBtn = saveBtn.cloneNode(true);
                saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
                
                newSaveBtn.addEventListener('click', async () => {
                    const userEmail = localStorage.getItem('userEmail');
                    if (!userEmail) {
                        alert('You must be signed in to save a plan.');
                        return;
                    }
                    
                    const planData = {
                        plan_name: `Plan ${new Date().toLocaleString()}`,
                        tasks: tasks,
                        time_available: timeAvailable,
                        plan_content: plan,
                        timestamp: new Date().toLocaleString(),
                        progress: 0,
                        checked_tasks: []
                    };
                    
                    const success = await savePlanToDatabase(planData);
                    
                    if (success) {
                        const successMsg = document.createElement('div');
                        successMsg.style.cssText = `
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: linear-gradient(135deg, #28a745, #20c997);
                            color: white;
                            padding: 1rem;
                            border-radius: 12px;
                            animation: slideIn 0.3s ease-out;
                            z-index: 1000;
                        `;
                        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Plan saved successfully!';
                        document.body.appendChild(successMsg);
                        setTimeout(() => successMsg.remove(), 3000);
                        
                        newSaveBtn.style.display = 'none';
                    }
                });
            }
            
        } catch (error) {
            resultDiv.innerHTML = `
                <div style="background: rgba(220, 53, 69, 0.9); padding: 1.5rem; border-radius: 12px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i>
                    <p style="margin-top: 0.5rem;">${escapeHtml(error.message)}</p>
                    <small>Make sure the backend server is running on http://127.0.0.1:8000</small>
                </div>
            `;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Smart Plan';
        }
    });
}

// ========== History Display Functions ==========

async function displayHistory() {
    const historyContent = document.getElementById('historyContent');
    if (!historyContent) return;
    
    historyContent.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: white;"></i>
            <p style="color: white; margin-top: 1rem;">Loading your plans...</p>
        </div>
    `;
    
    const savedPlans = await loadPlansFromDatabase();
    
    if (savedPlans.length === 0) {
        historyContent.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: white;">
                <i class="fas fa-folder-open" style="font-size: 3rem;"></i>
                <p style="margin-top: 1rem;">No study plans saved yet. Generate a plan to get started!</p>
            </div>
        `;
        return;
    }
    
    historyContent.innerHTML = '';
    savedPlans.forEach((plan) => {
        const planCard = document.createElement('div');
        planCard.classList.add('plan-card');
        planCard.setAttribute('data-plan-id', plan.id);
        
        planCard.innerHTML = `
            <input type="text" class="plan-name" value="${escapeHtml(plan.plan_name)}" data-plan-id="${plan.id}">
            <p><i class="fas fa-tasks"></i> <strong>Tasks:</strong> ${escapeHtml(plan.tasks.join(', '))}</p>
            <p><i class="fas fa-hourglass-half"></i> <strong>Time Available:</strong> ${escapeHtml(plan.time_available)}</p>
            <p><i class="fas fa-calendar"></i> <strong>Generated on:</strong> ${escapeHtml(plan.timestamp)}</p>
            <div class="progress-container">
                <progress class="progress-bar" value="${plan.progress || 0}" max="100"></progress>
                <span class="progress-value">${Math.round(plan.progress || 0)}%</span>
            </div>
        `;
        
        const listContainer = document.createElement('div');
        listContainer.classList.add('study-plan-list');
        
        const rows = plan.plan_content.split('\n').filter(row => row.trim() !== '');
        rows.forEach((row, rowIndex) => {
            const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            if (cells.length >= 4) {
                const listItem = document.createElement('div');
                listItem.classList.add('list-item');
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.classList.add('task-checkbox');
                if (plan.checked_tasks && plan.checked_tasks.includes(rowIndex)) {
                    checkbox.checked = true;
                }
                checkbox.addEventListener('change', () => updateProgress(plan.id, planCard, rowIndex));
                
                const content = document.createElement('div');
                content.classList.add('list-content');
                content.innerHTML = `
                    <span><i class="fas fa-clock"></i> ${escapeHtml(cells[0])}</span>
                    <span><i class="fas fa-book"></i> ${escapeHtml(cells[1])}</span>
                    <span><i class="fas fa-hourglass-start"></i> ${escapeHtml(cells[2])}</span>
                    <span><i class="fas fa-coffee"></i> ${escapeHtml(cells[3])}</span>
                `;
                
                const timerBtn = document.createElement('button');
                timerBtn.innerHTML = '<i class="fas fa-play"></i> Start Timer';
                timerBtn.classList.add('start-timer-btn');
                timerBtn.addEventListener('click', () => startTaskTimer(cells[2]));
                
                const resourceBtn = document.createElement('button');
                resourceBtn.innerHTML = '<i class="fas fa-search"></i> Find Resources';
                resourceBtn.classList.add('resource-finder-btn');
                resourceBtn.addEventListener('click', () => {
                    window.location.href = `resources.html?task=${encodeURIComponent(cells[1])}`;
                });
                
                listItem.appendChild(checkbox);
                listItem.appendChild(content);
                listItem.appendChild(timerBtn);
                listItem.appendChild(resourceBtn);
                listContainer.appendChild(listItem);
            }
        });
        
        planCard.appendChild(listContainer);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Plan';
        deleteBtn.classList.add('delete-plan-btn');
        deleteBtn.addEventListener('click', () => deletePlan(plan.id));
        planCard.appendChild(deleteBtn);
        
        historyContent.appendChild(planCard);
    });
    
    document.querySelectorAll('.plan-name').forEach(input => {
        input.addEventListener('change', async function() {
            const planId = parseInt(this.dataset.planId);
            const newName = this.value;
            console.log(`Plan ${planId} renamed to: ${newName}`);
        });
    });
}

async function updateProgress(planId, planCard, taskIndex) {
    const checkboxes = planCard.querySelectorAll('.task-checkbox');
    const progressBar = planCard.querySelector('.progress-bar');
    const progressValue = planCard.querySelector('.progress-value');
    
    let checkedCount = 0;
    const checkedTasks = [];
    checkboxes.forEach((checkbox, idx) => {
        if (checkbox.checked) {
            checkedCount++;
            checkedTasks.push(idx);
        }
    });
    
    const totalTasks = checkboxes.length;
    const progress = totalTasks > 0 ? (checkedCount / totalTasks) * 100 : 0;
    
    progressBar.value = progress;
    progressValue.textContent = `${Math.round(progress)}%`;
    
    await updatePlanProgressInDB(planId, progress, checkedTasks);
}

async function deletePlan(planId) {
    if (confirm('Are you sure you want to delete this plan?')) {
        const success = await deletePlanFromDatabase(planId);
        if (success) {
            displayHistory();
        }
    }
}

// ========== Search Functionality ==========

const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');

function filterPlans() {
    const searchText = searchInput?.value.toLowerCase() || '';
    const planCards = document.querySelectorAll('.plan-card');
    planCards.forEach(card => {
        const planName = card.querySelector('.plan-name')?.value.toLowerCase() || '';
        if (planName.includes(searchText)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

if (searchButton) {
    searchButton.addEventListener('click', filterPlans);
}
if (searchInput) {
    searchInput.addEventListener('input', filterPlans);
}

if (window.location.pathname.includes('history.html')) {
    displayHistory();
}

// ========== Resource Button Functions ==========

function addResourceButtonsToPlan() {
    const planRows = document.querySelectorAll('.study-plan-table tbody tr');
    
    planRows.forEach(row => {
        const taskCell = row.querySelector('td:nth-child(3)');
        const actionCell = row.querySelector('td:last-child');
        
        if (taskCell && actionCell) {
            const taskName = taskCell.textContent.trim();
            
            const existingBtn = actionCell.querySelector('.resource-finder-btn');
            if (existingBtn) return;
            
            const resourceBtn = document.createElement('button');
            resourceBtn.innerHTML = '<i class="fas fa-search"></i> Find Resources';
            resourceBtn.classList.add('resource-finder-btn');
            resourceBtn.style.cssText = `
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                border: none;
                padding: 0.4rem 0.8rem;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.75rem;
                margin-left: 0.5rem;
                transition: all 0.3s ease;
            `;
            
            resourceBtn.onclick = () => {
                window.location.href = `resources.html?task=${encodeURIComponent(taskName)}`;
            };
            
            const existingButtons = actionCell.querySelectorAll('button');
            if (existingButtons.length > 0) {
                existingButtons[0].insertAdjacentElement('afterend', resourceBtn);
            } else {
                actionCell.appendChild(resourceBtn);
            }
        }
    });
}

// ========== Resource Finder Functions ==========

async function searchResources() {
    const topic = document.getElementById('searchTopic')?.value;
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
    
    const loadingDiv = document.getElementById('loadingState');
    const resultsDiv = document.getElementById('resultsSection');
    
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (resultsDiv) resultsDiv.style.display = 'none';
    
    const requestData = {
        topic: topic,
        subject: document.getElementById('searchSubject')?.value || '',
        resource_type: resourceTypes,
        difficulty: document.getElementById('difficultySelect')?.value || 'intermediate'
    };
    
    try {
        const response = await fetch('/resources/find', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) throw new Error('Failed to fetch resources');
        
        const data = await response.json();
        displayResourceResults(data);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to find resources. Make sure the backend is running.');
    } finally {
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (resultsDiv) resultsDiv.style.display = 'block';
    }
}

function displayResourceResults(data) {
    const summaryDiv = document.getElementById('summarySection');
    if (summaryDiv) {
        summaryDiv.innerHTML = `
            <i class="fas fa-graduation-cap" style="font-size: 1.5rem;"></i>
            <h3 style="margin: 0.5rem 0; color: white;">${escapeHtml(data.topic)}</h3>
            <p style="color: rgba(255,255,255,0.9);">${escapeHtml(data.summary)}</p>
            <div style="margin-top: 1rem; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
                <i class="fas fa-chart-line"></i> ${data.resources.length} resources found
            </div>
        `;
    }
    
    const gridDiv = document.getElementById('resourcesGrid');
    if (gridDiv) {
        if (data.resources.length === 0) {
            gridDiv.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: rgba(255,255,255,0.1); border-radius: 16px;">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: white;"></i>
                    <p style="color: white; margin-top: 1rem;">No resources found. Try different search terms or resource types.</p>
                </div>
            `;
        } else {
            gridDiv.innerHTML = data.resources.map(resource => `
                <div class="resource-card" onclick="window.open('${escapeHtml(resource.url)}', '_blank')">
                    <div style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.75rem; background: ${getResourceColor(resource.type)}; color: white;">
                        ${getResourceIcon(resource.type)} ${resource.type.toUpperCase()}
                    </div>
                    <h4 style="margin: 0.5rem 0; font-size: 1rem; color: #333;">${escapeHtml(resource.title)}</h4>
                    <div style="color: #666; font-size: 0.85rem; margin: 0.5rem 0;">
                        <i class="fas ${getSourceIcon(resource.source)}"></i> ${escapeHtml(resource.source)}
                        ${resource.duration ? ` • ${escapeHtml(resource.duration)}` : ''}
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
    }
    
    const recDiv = document.getElementById('recommendationsSection');
    if (recDiv) {
        recDiv.innerHTML = `
            <i class="fas fa-lightbulb" style="font-size: 1.2rem;"></i>
            <strong style="color: white;">📖 Recommended Study Path</strong>
            <p style="color: rgba(255,255,255,0.9); margin-top: 0.5rem;">${escapeHtml(data.recommendations)}</p>
        `;
    }
}

// Helper functions for resource display
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

// ========== Initialize Resource Finder ==========

if (window.location.pathname.includes('resources.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const taskFromPlan = urlParams.get('task');
        
        if (taskFromPlan) {
            const taskContext = document.getElementById('taskContext');
            if (taskContext) {
                taskContext.innerHTML = `<i class="fas fa-book-open"></i> Finding resources for: <strong>"${escapeHtml(decodeURIComponent(taskFromPlan))}"</strong>`;
            }
            const searchTopic = document.getElementById('searchTopic');
            if (searchTopic) {
                searchTopic.value = decodeURIComponent(taskFromPlan);
            }
            setTimeout(() => {
                if (typeof searchResources === 'function') {
                    searchResources();
                }
            }, 500);
        }
        
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
}