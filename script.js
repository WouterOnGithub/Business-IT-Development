// Data opslag
let currentUser = null;
let projects = [];
let forecasts = {};
let config = {
    orangeThreshold: 5,
    redThreshold: 10,
    enableWarnings: true
};
let currentProjectId = null;

// Gebruikers data
const users = [
    { username: 'teammanager', password: 'manager123', role: 'teammanager' },
    { username: 'projectmanager', password: 'project123', role: 'projectmanager' },
    { username: 'admin', password: 'admin123', role: 'teammanager' }
];

// Initialiseer applicatie
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadData();
    setupEventListeners();
    showPage('loginPage');
}

// Event listeners setup
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Config form
    document.getElementById('configForm').addEventListener('submit', handleConfigSave);
    
    // Year selector
    document.getElementById('yearSelect').addEventListener('change', updateDashboard);
}

// Login handling
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        errorDiv.classList.add('d-none');
        showDashboard();
    } else {
        errorDiv.textContent = 'Ongeldige gebruikersnaam of wachtwoord';
        errorDiv.classList.remove('d-none');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showPage('loginPage');
}

// Page navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('d-none');
    });
    document.getElementById(pageId).classList.remove('d-none');
    
    if (pageId === 'dashboardPage') {
        updateDashboard();
    } else if (pageId === 'projectManagementPage') {
        updateProjectManagement();
    } else if (pageId === 'forecastPage') {
        updateForecastPage();
    } else if (pageId === 'configPage') {
        updateConfigPage();
    } else if (pageId === 'reportPage') {
        updateReportPage();
    }
}

function showDashboard() {
    showPage('dashboardPage');
}

function showProjectManagement() {
    if (currentUser.role !== 'teammanager') {
        alert('Alleen teammanagers hebben toegang tot projectbeheer');
        return;
    }
    showPage('projectManagementPage');
}

function showForecastPage() {
    if (currentUser.role !== 'teammanager') {
        alert('Alleen teammanagers hebben toegang tot prognoses');
        return;
    }
    showPage('forecastPage');
}

function showConfigPage() {
    if (currentUser.role !== 'teammanager') {
        alert('Alleen teammanagers hebben toegang tot configuratie');
        return;
    }
    showPage('configPage');
}

function showReportPage() {
    showPage('reportPage');
}

function showProjectDetail(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    currentProjectId = projectId; // Store current project ID
    
    document.getElementById('projectName').textContent = project.name;
    document.getElementById('projectBillable').textContent = project.billable ? 'Ja' : 'Nee';
    document.getElementById('projectStatus').textContent = project.active ? 'Actief' : 'Inactief';
    document.getElementById('projectManager').textContent = project.projectManager || 'Niet toegewezen';
    document.getElementById('projectDescription').textContent = project.description || 'Geen beschrijving beschikbaar';
    
    // Show/hide edit button based on permissions
    const editBtn = document.getElementById('editProjectManagerBtn');
    if (editBtn) {
        const canEditManager = canEditProjectManager(project);
        console.log('Project:', project.name, 'Can edit manager:', canEditManager, 'User role:', currentUser.role);
        editBtn.style.display = canEditManager ? 'inline-block' : 'none';
    }
    
    updateProjectDetail(project);
    showPage('projectDetailPage');
}

function editProjectManager() {
    console.log('editProjectManager called');
    console.log('currentProjectId:', currentProjectId);
    console.log('currentUser:', currentUser);
    
    if (!currentProjectId) {
        console.log('No current project ID');
        return;
    }
    
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) {
        console.log('Project not found');
        return;
    }
    
    console.log('Project found:', project);
    console.log('Can edit project:', canEditProject(project));
    
    const newManager = prompt('Voer de nieuwe projectmanager username in:', project.projectManager || '');
    if (newManager !== null) {
        project.projectManager = newManager.trim() || null;
        document.getElementById('projectManager').textContent = project.projectManager || 'Niet toegewezen';
        saveData();
        alert('Projectmanager is bijgewerkt!');
    }
}

function getCurrentProjectId() {
    return currentProjectId;
}

function canEditProject(project) {
    // Teammanagers kunnen alles bewerken inclusief projectmanager wijzigen
    if (currentUser.role === 'teammanager') return true;
    
    // Projectmanagers kunnen hun eigen projecten bewerken, maar NIET de projectmanager wijzigen
    if (currentUser.role === 'projectmanager' && project.projectManager === currentUser.username) return true;
    
    return false;
}

function canEditProjectManager(project) {
    // Alleen teammanagers kunnen de projectmanager wijzigen
    return currentUser.role === 'teammanager';
}

// Dashboard functies
function updateDashboard() {
    if (!currentUser) return;
    
    document.getElementById('userRole').textContent = `${currentUser.username} (${currentUser.role})`;
    
    const yearSelect = document.getElementById('yearSelect');
    
    // Set current year
    const now = new Date();
    yearSelect.value = now.getFullYear();
    
    renderProjectTable();
    calculateTotals();
}

function renderProjectTable() {
    const tbody = document.getElementById('projectRows');
    tbody.innerHTML = '';
    
    projects.forEach(project => {
        if (!project.active) return;
        
        const canEdit = canEditProject(project);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="fw-bold" style="cursor: pointer;" onclick="showProjectDetail('${project.id}')">${project.name}</td>
            <td class="text-center"><input type="number" value="${project.months.jan}" min="0" onchange="updateProjectDays('${project.id}', 'jan', this.value)" ${!canEdit ? 'disabled' : ''}></td>
            <td class="text-center"><input type="number" value="${project.months.feb}" min="0" onchange="updateProjectDays('${project.id}', 'feb', this.value)" ${!canEdit ? 'disabled' : ''}></td>
            <td class="text-center"><input type="number" value="${project.months.mar}" min="0" onchange="updateProjectDays('${project.id}', 'mar', this.value)" ${!canEdit ? 'disabled' : ''}></td>
            <td class="text-center"><input type="number" value="${project.months.apr}" min="0" onchange="updateProjectDays('${project.id}', 'apr', this.value)" ${!canEdit ? 'disabled' : ''}></td>
            <td class="text-center"><input type="number" value="${project.months.may}" min="0" onchange="updateProjectDays('${project.id}', 'may', this.value)" ${!canEdit ? 'disabled' : ''}></td>
            <td class="text-center"><input type="number" value="${project.months.jun}" min="0" onchange="updateProjectDays('${project.id}', 'jun', this.value)" ${!canEdit ? 'disabled' : ''}></td>
            <td class="text-center"><input type="number" value="${project.months.jul}" min="0" onchange="updateProjectDays('${project.id}', 'jul', this.value)" ${!canEdit ? 'disabled' : ''}></td>
            <td class="text-center"><input type="number" value="${project.months.aug}" min="0" onchange="updateProjectDays('${project.id}', 'aug', this.value)" ${!canEdit ? 'disabled' : ''}></td>
            <td class="text-center"><input type="number" value="${project.months.sep}" min="0" onchange="updateProjectDays('${project.id}', 'sep', this.value)" ${!canEdit ? 'disabled' : ''}></td>
            <td class="text-center"><input type="number" value="${project.months.oct}" min="0" onchange="updateProjectDays('${project.id}', 'oct', this.value)" ${!canEdit ? 'disabled' : ''}></td>
            <td class="text-center"><input type="number" value="${project.months.nov}" min="0" onchange="updateProjectDays('${project.id}', 'nov', this.value)" ${!canEdit ? 'disabled' : ''}></td>
            <td class="text-center"><input type="number" value="${project.months.dec}" min="0" onchange="updateProjectDays('${project.id}', 'dec', this.value)" ${!canEdit ? 'disabled' : ''}></td>
            <td class="text-center fw-bold">${getProjectTotal(project)}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateProjectDays(projectId, month, value) {
    const project = projects.find(p => p.id === projectId);
    if (project) {
        project.months[month] = parseInt(value) || 0;
        calculateTotals();
        saveData();
    }
}

function getProjectTotal(project) {
    return Object.values(project.months).reduce((sum, days) => sum + days, 0);
}

function calculateTotals() {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const availableDays = [22, 20, 21, 22, 20, 22, 21, 22, 21, 23, 21, 20];
    
    let grandTotal = 0;
    
    months.forEach((month, index) => {
        const total = projects.reduce((sum, project) => {
            return sum + (project.active ? project.months[month] : 0);
        }, 0);
        
        document.getElementById(`total${month.charAt(0).toUpperCase() + month.slice(1)}`).textContent = total;
        
        // Apply conflict detection
        const cell = document.getElementById(`total${month.charAt(0).toUpperCase() + month.slice(1)}`);
        cell.className = 'text-center';
        
        if (config.enableWarnings) {
            const difference = total - availableDays[index];
            if (difference > config.redThreshold) {
                cell.classList.add('conflict-danger');
            } else if (difference > config.orangeThreshold) {
                cell.classList.add('conflict-warning');
            } else if (total <= availableDays[index]) {
                cell.classList.add('conflict-success');
            }
        }
        
        grandTotal += total;
    });
    
    document.getElementById('grandTotal').textContent = grandTotal;
}

// Project detail functies
function updateProjectDetail(project) {
    const tbody = document.getElementById('employeeRows');
    tbody.innerHTML = '';
    
    const canEdit = canEditProject(project);
    
    if (project.employees && project.employees.length > 0) {
        project.employees.forEach((employee, index) => {
            const isOverLimit = employee.days > 22;
            const row = document.createElement('tr');
            row.className = 'employee-row';
            row.innerHTML = `
                <td>${employee.name}</td>
                <td class="text-center">
                    <input type="number" value="${employee.days}" min="0" onchange="updateEmployeeDays('${project.id}', ${index}, this.value)" ${!canEdit ? 'disabled' : ''} class="${isOverLimit ? 'employee-days-overlimit' : ''}">
                </td>
                <td>
                    <input type="text" value="${employee.notes || ''}" placeholder="Opmerking" onchange="updateEmployeeNotes('${project.id}', ${index}, this.value)">
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-danger" onclick="removeEmployee('${project.id}', ${index})" ${!canEdit ? 'disabled' : ''}>Verwijderen</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Geen medewerkers toegewezen aan dit project</td></tr>';
    }
}

function addEmployee() {
    const projectId = getCurrentProjectId();
    if (!projectId) return;
    
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const employeeName = prompt('Voer de naam van de medewerker in:');
    if (employeeName) {
        if (!project.employees) project.employees = [];
        project.employees.push({
            name: employeeName,
            days: 0,
            notes: ''
        });
        updateProjectDetail(project);
        saveData();
    }
}

function removeEmployee(projectId, employeeIndex) {
    const project = projects.find(p => p.id === projectId);
    if (project && project.employees) {
        project.employees.splice(employeeIndex, 1);
        updateProjectDetail(project);
        saveData();
    }
}

function updateEmployeeDays(projectId, employeeIndex, value) {
    const project = projects.find(p => p.id === projectId);
    if (project && project.employees && project.employees[employeeIndex]) {
        project.employees[employeeIndex].days = parseInt(value) || 0;
        saveData();
        // Refresh the project detail to update the styling
        updateProjectDetail(project);
    }
}

function updateEmployeeNotes(projectId, employeeIndex, value) {
    const project = projects.find(p => p.id === projectId);
    if (project && project.employees && project.employees[employeeIndex]) {
        project.employees[employeeIndex].notes = value;
        saveData();
    }
}

function getCurrentProjectId() {
    // This would need to be implemented based on how you track the current project
    // For now, return the first project as an example
    return projects.length > 0 ? projects[0].id : null;
}

// Project management functies
function updateProjectManagement() {
    const tbody = document.getElementById('projectManagementRows');
    tbody.innerHTML = '';
    
    projects.forEach(project => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${project.name}</td>
            <td class="text-center">${project.projectManager || 'Niet toegewezen'}</td>
            <td class="text-center">
                <span class="badge ${project.billable ? 'bg-success' : 'bg-secondary'}">
                    ${project.billable ? 'Ja' : 'Nee'}
                </span>
            </td>
            <td class="text-center">
                <span class="badge ${project.active ? 'bg-success' : 'bg-danger'}">
                    ${project.active ? 'Actief' : 'Inactief'}
                </span>
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-primary" onclick="editProject('${project.id}')">Bewerken</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProject('${project.id}')">Verwijderen</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addProject() {
    const projectName = prompt('Voer de projectnaam in:');
    if (!projectName) return;
    
    const billable = confirm('Is dit project factureerbaar?');
    const description = prompt('Voer een projectbeschrijving in (optioneel):');
    const projectManager = prompt('Voer de projectmanager username in (optioneel):');
    
    const newProject = {
        id: 'project_' + Date.now(),
        name: projectName,
        billable: billable,
        active: true,
        description: description || '',
        projectManager: projectManager || null,
        months: {
            jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
            jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
        },
        employees: []
    };
    
    projects.push(newProject);
    updateProjectManagement();
    saveData();
}

function editProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const newName = prompt('Projectnaam:', project.name);
    if (newName && newName !== project.name) {
        project.name = newName;
    }
    
    const newDescription = prompt('Projectbeschrijving:', project.description || '');
    if (newDescription !== project.description) {
        project.description = newDescription;
    }
    
    project.billable = confirm('Is dit project factureerbaar?', project.billable);
    project.active = confirm('Is dit project actief?', project.active);
    
    updateProjectManagement();
    saveData();
}

function deleteProject(projectId) {
    if (confirm('Weet u zeker dat u dit project wilt verwijderen?')) {
        projects = projects.filter(p => p.id !== projectId);
        updateProjectManagement();
        saveData();
    }
}

// Forecast functies
function updateForecastPage() {
    const tbody = document.getElementById('forecastRows');
    tbody.innerHTML = '';
    
    const months = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    months.forEach((month, index) => {
        const monthKey = monthKeys[index];
        const planned = projects.reduce((sum, project) => sum + (project.active ? project.months[monthKey] : 0), 0);
        const forecast = forecasts[monthKey] || 0;
        
        let status = 'OK';
        let statusClass = 'status-ok';
        
        if (planned > forecast) {
            status = 'Conflict';
            statusClass = 'status-danger';
        } else if (forecast - planned < 5) {
            status = 'Waarschuwing';
            statusClass = 'status-warning';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month}</td>
            <td class="text-center">
                <input type="number" value="${forecast}" min="0" class="form-control form-control-sm" id="forecast_${monthKey}">
            </td>
            <td class="text-center">${planned}</td>
            <td class="text-center">
                <span class="status-badge ${statusClass}">${status}</span>
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-primary" onclick="saveForecast('${monthKey}')">Opslaan</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function saveForecast(monthKey) {
    const input = document.getElementById(`forecast_${monthKey}`);
    forecasts[monthKey] = parseInt(input.value) || 0;
    saveData();
    updateForecastPage();
}

function saveForecasts() {
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    monthKeys.forEach(monthKey => {
        const input = document.getElementById(`forecast_${monthKey}`);
        if (input) {
            forecasts[monthKey] = parseInt(input.value) || 0;
        }
    });
    
    saveData();
    alert('Prognoses zijn opgeslagen!');
}

// Configuratie functies
function updateConfigPage() {
    document.getElementById('orangeThreshold').value = config.orangeThreshold;
    document.getElementById('redThreshold').value = config.redThreshold;
    document.getElementById('enableWarnings').checked = config.enableWarnings;
}

function handleConfigSave(e) {
    e.preventDefault();
    
    config.orangeThreshold = parseInt(document.getElementById('orangeThreshold').value) || 5;
    config.redThreshold = parseInt(document.getElementById('redThreshold').value) || 10;
    config.enableWarnings = document.getElementById('enableWarnings').checked;
    
    saveData();
    alert('Configuratie is opgeslagen!');
    updateDashboard();
}

// Rapportage functies
function updateReportPage() {
    const tbody = document.getElementById('reportRows');
    tbody.innerHTML = '';
    
    const months = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const availableDays = [22, 20, 21, 22, 20, 22, 21, 22, 21, 23, 21, 20];
    
    months.forEach((month, index) => {
        const monthKey = monthKeys[index];
        const planned = projects.reduce((sum, project) => sum + (project.active ? project.months[monthKey] : 0), 0);
        const available = availableDays[index];
        const difference = planned - available;
        
        let status = 'OK';
        let statusClass = 'status-ok';
        
        if (difference > 0) {
            status = 'Overpland';
            statusClass = 'status-danger';
        } else if (difference < -5) {
            status = 'Onderpland';
            statusClass = 'status-warning';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month}</td>
            <td class="text-center">${planned}</td>
            <td class="text-center">${available}</td>
            <td class="text-center">${difference > 0 ? '+' : ''}${difference}</td>
            <td class="text-center">
                <span class="status-badge ${statusClass}">${status}</span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function exportData() {
    const months = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const availableDays = [22, 20, 21, 22, 20, 22, 21, 22, 21, 23, 21, 20];
    
    let csvContent = "Maand,Totaal ingeplande dagen,Totaal beschikbare dagen,Verschil,Status\n";
    
    months.forEach((month, index) => {
        const monthKey = monthKeys[index];
        const planned = projects.reduce((sum, project) => sum + (project.active ? project.months[monthKey] : 0), 0);
        const available = availableDays[index];
        const difference = planned - available;
        
        let status = 'OK';
        if (difference > 0) status = 'Overpland';
        else if (difference < -5) status = 'Onderpland';
        
        csvContent += `${month},${planned},${available},${difference},${status}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capaciteitsrapportage_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    alert('Rapportage is geëxporteerd!');
}

// Data persistence
function saveData() {
    const data = {
        projects: projects,
        forecasts: forecasts,
        config: config
    };
    localStorage.setItem('capaciteitsplanning_data', JSON.stringify(data));
}

function loadData() {
    const savedData = localStorage.getItem('capaciteitsplanning_data');
    if (savedData) {
        const data = JSON.parse(savedData);
        projects = data.projects || [];
        forecasts = data.forecasts || {};
        config = data.config || config;
    } else {
        // Initialize with sample data
        initializeSampleData();
    }
}

function initializeSampleData() {
    projects = [
        {
            id: 'project_1',
            name: 'Website Redesign',
            billable: true,
            active: true,
            description: 'Complete redesign van de bedrijfswebsite',
            projectManager: 'projectmanager',
            months: {
                jan: 15, feb: 20, mar: 18, apr: 22, may: 16, jun: 20,
                jul: 15, aug: 18, sep: 20, oct: 22, nov: 18, dec: 10
            },
            employees: [
                { name: 'Jan Jansen', days: 15, notes: 'Frontend development' },
                { name: 'Pieter de Vries', days: 10, notes: 'Backend development' }
            ]
        },
        {
            id: 'project_2',
            name: 'Mobile App',
            billable: true,
            active: true,
            description: 'Ontwikkeling van mobiele applicatie',
            projectManager: 'projectmanager',
            months: {
                jan: 10, feb: 15, mar: 20, apr: 18, may: 22, jun: 15,
                jul: 20, aug: 18, sep: 15, oct: 20, nov: 22, dec: 15
            },
            employees: [
                { name: 'Erik Bakker', days: 20, notes: 'iOS development' },
                { name: 'Lisa Visser', days: 15, notes: 'Android development' }
            ]
        },
        {
            id: 'project_3',
            name: 'Internal CRM',
            billable: false,
            active: true,
            description: 'Intern CRM systeem',
            projectManager: 'johndoe',
            months: {
                jan: 8, feb: 10, mar: 12, apr: 10, may: 8, jun: 12,
                jul: 10, aug: 8, sep: 10, oct: 12, nov: 10, dec: 8
            },
            employees: [
                { name: 'Mark Hendriks', days: 12, notes: 'Database design' }
            ]
        }
    ];
    
    forecasts = {
        jan: 40, feb: 45, mar: 50, apr: 50, may: 46, jun: 47,
        jul: 45, aug: 44, sep: 45, oct: 54, nov: 50, dec: 33
    };
    
    saveData();
}
