// Data opslag
let currentUser = null;
let projects = [];
let forecasts = {};
let workedDays = {};
let availableDays = {};
let holidays = {};
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
    
    // Load available days and holidays into inputs (this also calculates totals)
    loadAvailableDaysAndHolidays();
    
    // Enable editable fields for teammanager
    enableEditableFields();
    
    renderProjectTable();
    calculateTotals();
}

function loadAvailableDaysAndHolidays() {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    months.forEach(month => {
        const availableInput = document.getElementById(`available_${month}`);
        const holidayInput = document.getElementById(`holidays_${month}`);
        
        if (availableInput) {
            const value = availableDays[month] || getDefaultAvailableDays(month);
            availableInput.value = value;
        }
        if (holidayInput) {
            const value = holidays[month] || getDefaultHolidays(month);
            holidayInput.value = value;
        }
    });
    
    // Calculate totals after loading all values
    setTimeout(() => {
        updateAvailableTotal();
        updateHolidayTotals();
    }, 100); // Small delay to ensure DOM is updated
}

function getDefaultAvailableDays(month) {
    const defaults = {
        jan: 22, feb: 20, mar: 22, apr: 21, may: 18, jun: 22,
        jul: 22, aug: 22, sep: 21, oct: 22, nov: 22, dec: 18
    };
    return defaults[month] || 20;
}

function getDefaultHolidays(month) {
    const defaults = {
        jan: 1, feb: 0, mar: 2, apr: 1, may: 2, jun: 1,
        jul: 1, aug: 1, sep: 0, oct: 1, nov: 2, dec: 2
    };
    return defaults[month] || 0;
}

function renderProjectTable() {
    const tbody = document.getElementById('projectRows');
    tbody.innerHTML = '';
    
    projects.forEach(project => {
        if (!project.active) return;
        
        const canEdit = canEditProject(project);
        
        const row = document.createElement('tr');
        row.id = `project_${project.id}`;
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
            <td class="text-center fw-bold" id="total_${project.id}">${getProjectTotal(project)}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateProjectDays(projectId, month, value) {
    const project = projects.find(p => p.id === projectId);
    if (project) {
        project.months[month] = parseInt(value) || 0;
        saveData();
        
        // Update the total for this specific project using its unique ID
        const totalCell = document.getElementById(`total_${projectId}`);
        if (totalCell) {
            totalCell.textContent = getProjectTotal(project);
        }
        
        // Update overall totals
        calculateTotals();
        
        // Update forecast status for this month
        updateForecastStatus(month, forecasts[month] || 0);
    }
}

function getEmployeeTotalDays(employeeName) {
    let totalDays = 0;
    
    projects.forEach(project => {
        if (project.employees) {
            project.employees.forEach(employee => {
                if (employee.name === employeeName) {
                    totalDays += employee.days || 0;
                }
            });
        }
    });
    
    return totalDays;
}

function checkEmployeeDaysLimit(employeeName, days) {
    const totalDays = getEmployeeTotalDays(employeeName);
    const remainingDays = 260 - totalDays;
    
    return {
        totalDays: totalDays,
        remainingDays: remainingDays,
        isOverLimit: totalDays > 260,
        wouldExceedWithNewDays: (totalDays - (days || 0) + (days || 0)) > 260
    };
}

function getProjectTotal(project) {
    return Object.values(project.months).reduce((sum, days) => sum + days, 0);
}

function updateAvailableDays(month, value) {
    availableDays[month] = parseInt(value) || 0;
    saveData();
    
    // Update total by calling the proper total calculation function
    updateAvailableTotal();
    calculateTotals();
}

function updateAvailableTotal() {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    let totalAvailable = 0;
    
    months.forEach(month => {
        const input = document.getElementById(`available_${month}`);
        if (input) {
            totalAvailable += parseInt(input.value) || 0;
        }
    });
    
    const totalElement = document.getElementById('totalAvailable');
    if (totalElement) {
        totalElement.textContent = totalAvailable;
    }
}

function updateHolidays(month, value) {
    holidays[month] = parseInt(value) || 0;
    saveData();
    updateHolidayTotals();
}

function updateHolidayTotals() {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    let totalHolidays = 0;
    
    months.forEach(month => {
        const input = document.getElementById(`holidays_${month}`);
        if (input) {
            totalHolidays += parseInt(input.value) || 0;
        }
    });
    
    document.getElementById('totalHolidays').textContent = totalHolidays;
}

function enableEditableFields() {
    if (currentUser.role === 'teammanager') {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        
        months.forEach(month => {
            const availableInput = document.getElementById(`available_${month}`);
            const holidayInput = document.getElementById(`holidays_${month}`);
            
            if (availableInput) availableInput.disabled = false;
            if (holidayInput) holidayInput.disabled = false;
        });
    }
}

function calculateTotals() {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    let grandTotal = 0;
    let totalAvailable = 0;
    
    months.forEach((month, index) => {
        const total = projects.reduce((sum, project) => {
            return sum + (project.active ? project.months[month] : 0);
        }, 0);
        
        const available = availableDays[month] || 0;
        
        document.getElementById(`total${month.charAt(0).toUpperCase() + month.slice(1)}`).textContent = total;
        
        // Apply conflict detection
        const cell = document.getElementById(`total${month.charAt(0).toUpperCase() + month.slice(1)}`);
        cell.className = 'text-center';
        
        if (config.enableWarnings) {
            const difference = total - available;
            if (difference > config.redThreshold) {
                cell.classList.add('conflict-danger');
            } else if (difference > config.orangeThreshold) {
                cell.classList.add('conflict-warning');
            } else if (total <= available) {
                cell.classList.add('conflict-success');
            }
        }
        
        grandTotal += total;
        totalAvailable += available;
    });
    
    document.getElementById('grandTotal').textContent = grandTotal;
    document.getElementById('totalAvailable').textContent = totalAvailable;
}

// Project detail functies
function updateProjectDetail(project) {
    const tbody = document.getElementById('employeeRows');
    tbody.innerHTML = '';
    
    const canEdit = canEditProject(project);
    
    // Show/hide add employee button based on permissions
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    if (addEmployeeBtn) {
        addEmployeeBtn.style.display = canEdit ? 'inline-block' : 'none';
    }
    
    if (project.employees && project.employees.length > 0) {
        project.employees.forEach((employee, index) => {
            const employeeLimit = checkEmployeeDaysLimit(employee.name, employee.days);
            const isOverLimit = employeeLimit.isOverLimit;
            const row = document.createElement('tr');
            row.className = 'employee-row';
            row.innerHTML = `
                <td>${employee.name}</td>
                <td class="text-center">
                    <input type="number" value="${employee.days}" min="0" onchange="updateEmployeeDays('${project.id}', ${index}, this.value)" ${!canEdit ? 'disabled' : ''} class="${isOverLimit ? 'employee-days-overlimit' : ''}">
                    <div class="small text-muted">Totaal: ${employeeLimit.totalDays}/260</div>
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
    
    // Check if user has permission to add employees
    if (!canEditProject(project)) {
        alert('Alleen de projectmanager of teammanager kunnen medewerkers toevoegen aan dit project.');
        return;
    }
    
    const employeeName = prompt('Voer de naam van de medewerker in:');
    if (employeeName) {
        // Calculate total project planned days
        const projectTotalPlanned = getProjectTotal(project);
        
        // Calculate current total days assigned to all employees in this project
        let totalEmployeeDaysInProject = 0;
        if (project.employees) {
            project.employees.forEach(emp => {
                totalEmployeeDaysInProject += emp.days || 0;
            });
        }
        
        if (totalEmployeeDaysInProject >= projectTotalPlanned) {
            alert(`Waarschuwing: Project "${project.name}" heeft al ${totalEmployeeDaysInProject} dagen toegewezen aan medewerkers, wat gelijk is aan of meer dan de ${projectTotalPlanned} ingeplande dagen.`);
            return;
        }
        
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
        const employeeName = project.employees[employeeIndex].name;
        const newDays = parseInt(value) || 0;
        
        // Calculate total project planned days
        const projectTotalPlanned = getProjectTotal(project);
        
        // Calculate total days assigned to all employees in this project
        let totalEmployeeDaysInProject = 0;
        if (project.employees) {
            project.employees.forEach((emp, idx) => {
                if (idx !== employeeIndex) { // Exclude current employee from calculation
                    totalEmployeeDaysInProject += emp.days || 0;
                }
            });
        }
        
        const newTotalInProject = totalEmployeeDaysInProject + newDays;
        
        if (newTotalInProject > projectTotalPlanned) {
            alert(`Waarschuwing: Project "${project.name}" heeft ${projectTotalPlanned} dagen ingepland. `);
            return; // Don't save the invalid value
        }
        
        // Check if this would exceed the 260 days limit
        const currentTotal = getEmployeeTotalDays(employeeName);
        const currentProjectDays = project.employees[employeeIndex].days || 0;
        const newTotal = currentTotal - currentProjectDays + newDays;
        
        if (newTotal > 260) {
            alert(`Waarschuwing: ${employeeName} zou dan ${newTotal} dagen hebben ingepland, wat meer is dan de limiet van 260 dagen per jaar.`);
            return; // Don't save the invalid value
        }
        
        project.employees[employeeIndex].days = newDays;
        saveData();
        
        // Refresh all projects that have this employee to update their totals
        projects.forEach(p => {
            if (p.employees && p.employees.some(e => e.name === employeeName)) {
                updateProjectDetail(p);
            }
        });
    }
}

function getCurrentMonthKey() {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return monthKeys[month];
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
        
        if (planned < forecast) {
            status = 'conflict';
            statusClass = 'status-danger';
        } else {
            status = 'OK';
            statusClass = 'status-ok';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month}</td>
            <td class="text-center">
                <input type="number" value="${forecast}" min="0" class="form-control form-control-sm" id="forecast_${monthKey}" onchange="updateForecastStatus('${monthKey}', this.value)">
            </td>
            <td class="text-center">${planned}</td>
            <td class="text-center">
                <span class="status-badge ${statusClass}" id="status_${monthKey}">${status}</span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateForecastStatus(monthKey, forecastValue) {
    forecasts[monthKey] = parseInt(forecastValue) || 0;
    saveData();
    
    // Update status for this specific month
    const planned = projects.reduce((sum, project) => sum + (project.active ? project.months[monthKey] : 0), 0);
    const forecast = parseInt(forecastValue) || 0;
    
    let status = 'OK';
    let statusClass = 'status-ok';
    
    if (planned < forecast) {
        status = 'conflict';
        statusClass = 'status-danger';
    } else {
        status = 'OK';
        statusClass = 'status-ok';
    }
    
    // Update the status element
    const statusElement = document.getElementById(`status_${monthKey}`);
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = `status-badge ${statusClass}`;
    }
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
    
    months.forEach((month, index) => {
        const monthKey = monthKeys[index];
        const planned = projects.reduce((sum, project) => sum + (project.active ? project.months[monthKey] : 0), 0);
        
        // Get available days from the main page input fields
        const availableInput = document.getElementById(`available_${monthKey}`);
        const available = availableInput ? parseInt(availableInput.value) || 0 : (availableDays[monthKey] || getDefaultAvailableDays(monthKey));
        
        const worked = workedDays[monthKey] || 0;
        const difference = planned - worked;
        
        let status = 'OK';
        let statusClass = 'status-ok';
        
        if (planned > available) {
            status = 'Te veel ingepland';
            statusClass = 'status-danger';
        } else if (worked > planned) {
            status = 'Te veel gewerkt';
            statusClass = 'status-warning';
        } else if (planned === worked) {
            status = 'Goed';
            statusClass = 'status-ok';
        } else if (planned > worked) {
            status = 'Te weinig gewerkt';
            statusClass = 'status-warning';
        } else {
            status = 'Goed';
            statusClass = 'status-ok';
        }
        
        const canEditWorkedDays = currentUser.role === 'teammanager';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month}</td>
            <td class="text-center">${planned}</td>
            <td class="text-center">${available}</td>
            <td class="text-center">
                <input type="number" value="${worked}" min="0" 
                       class="form-control form-control-sm" 
                       id="worked_${monthKey}"
                       onchange="updateWorkedDays('${monthKey}', this.value)"
                       ${!canEditWorkedDays ? 'disabled' : ''}>
            </td>
            <td class="text-center">${difference > 0 ? '+' : ''}${difference}</td>
            <td class="text-center">
                <span class="status-badge ${statusClass}">${status}</span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateWorkedDays(monthKey, value) {
    workedDays[monthKey] = parseInt(value) || 0;
    saveData();

    // Direct update of the specific row for immediate feedback
    const workedInput = document.getElementById(`worked_${monthKey}`);
    if (workedInput) {
        const row = workedInput.closest('tr');
        if (row) {
            // Get the values for this specific month
            const planned = parseInt(row.cells[1].textContent) || 0;
            const available = parseInt(row.cells[2].textContent) || 0;
            const worked = parseInt(value) || 0;
            const difference = planned - worked;

            // Recalculate status for this specific row
            let status = 'OK';
            let statusClass = 'status-ok';

            if (planned > available) {
                status = 'Te veel ingepland';
                statusClass = 'status-danger';
            } else if (worked > planned) {
                status = 'Te veel gewerkt';
                statusClass = 'status-warning';
            } else if (planned === worked) {
                status = 'Goed';
                statusClass = 'status-ok';
            } else if (planned > worked) {
                status = 'Te weinig gewerkt';
                statusClass = 'status-warning';
            } else {
                status = 'Goed';
                statusClass = 'status-ok';
            }

            // Update the difference and status cells
            row.cells[4].textContent = difference > 0 ? `+${difference}` : difference;
            const statusSpan = row.cells[5].querySelector('.status-badge');
            if (statusSpan) {
                statusSpan.textContent = status;
                statusSpan.className = `status-badge ${statusClass}`;
            }
        }
    }
}

function exportData() {
    const months = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const availableDays = [22, 20, 21, 22, 20, 22, 21, 22, 21, 23, 21, 20];
    
    let csvContent = "Maand,Ingeplande dagen,Beschikbare dagen,Gewerkte dagen,Verschil (gepland - gewerkt),Status\n";
    
    months.forEach((month, index) => {
        const monthKey = monthKeys[index];
        const planned = projects.reduce((sum, project) => sum + (project.active ? project.months[monthKey] : 0), 0);
        const available = availableDays[index];
        const worked = workedDays[monthKey] || 0;
        const difference = planned - worked;
        
        let status = 'Goed';
        if (difference > 5) status = 'Te veel gepland';
        else if (difference < -5) status = 'Te weinig gepland';
        
        csvContent += `${month},${planned},${available},${worked},${difference},${status}\n`;
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
        workedDays: workedDays,
        availableDays: availableDays,
        holidays: holidays,
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
        workedDays = data.workedDays || {};
        availableDays = data.availableDays || {};
        holidays = data.holidays || {};
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
