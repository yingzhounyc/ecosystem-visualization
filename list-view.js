// Global variables
let organizations = [];
let relationships = [];
let filteredOrganizations = [];
let searchTerm = '';
let typeFilter = '';
let sortBy = 'name';

// Color scheme for organization types
const colorScheme = {
    corporation: '#e74c3c',
    higher_ed: '#3498db',
    non_profit: '#2ecc71',
    government_agency: '#f39c12'
};

// Initialize the list view
async function init() {
    try {
        // Load data
        const response = await fetch('organizations.json');
        const data = await response.json();
        organizations = data.organizations;
        relationships = data.relationships;
        
        // Initialize with all organizations
        filteredOrganizations = [...organizations];
        
        // Setup event listeners
        setupEventListeners();
        
        // Render organizations
        renderOrganizations();
        
        console.log('List view initialized successfully');
    } catch (error) {
        console.error('Error initializing list view:', error);
        showError('Failed to load organization data');
    }
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        clearSearch.style.display = searchTerm ? 'flex' : 'none';
        filterAndRender();
    });
    
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchTerm = '';
        clearSearch.style.display = 'none';
        filterAndRender();
    });
    
    // Filter functionality
    const typeFilterSelect = document.getElementById('typeFilter');
    typeFilterSelect.addEventListener('change', (e) => {
        typeFilter = e.target.value;
        filterAndRender();
    });
    
    // Sort functionality
    const sortSelect = document.getElementById('sortBy');
    sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        filterAndRender();
    });
    
    // Navigation
    const networkViewBtn = document.getElementById('networkView');
    networkViewBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Modal functionality
    const modal = document.getElementById('detailModal');
    const closeModal = document.getElementById('closeModal');
    
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

function filterAndRender() {
    // Filter organizations
    filteredOrganizations = organizations.filter(org => {
        const matchesSearch = !searchTerm || 
            org.name.toLowerCase().includes(searchTerm) ||
            org.contactPerson.toLowerCase().includes(searchTerm) ||
            org.email.toLowerCase().includes(searchTerm) ||
            org.description.toLowerCase().includes(searchTerm) ||
            org.address.toLowerCase().includes(searchTerm) ||
            (org.tags && org.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        
        const matchesType = !typeFilter || org.type === typeFilter;
        
        return matchesSearch && matchesType;
    });
    
    // Sort organizations
    filteredOrganizations.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'type':
                return a.type.localeCompare(b.type);
            case 'contact':
                return a.contactPerson.localeCompare(b.contactPerson);
            default:
                return 0;
        }
    });
    
    // Update results count
    updateResultsCount();
    
    // Render organizations
    renderOrganizations();
}

function updateResultsCount() {
    const count = filteredOrganizations.length;
    const total = organizations.length;
    const resultsCount = document.getElementById('resultsCount');
    
    if (searchTerm || typeFilter) {
        resultsCount.textContent = `Showing ${count} of ${total} organizations`;
    } else {
        resultsCount.textContent = `${total} organizations`;
    }
}

function renderOrganizations() {
    const container = document.getElementById('organizationsList');
    
    if (filteredOrganizations.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <h3>No organizations found</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button class="btn" onclick="clearFilters()">Clear Filters</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredOrganizations.map(org => createOrganizationCard(org)).join('');
}

function createOrganizationCard(org) {
    const typeColor = colorScheme[org.type] || '#95a5a6';
    const initials = getInitials(org.name);
    const orgRelationships = getOrganizationRelationships(org.id);
    
    return `
        <div class="organization-card" onclick="showOrganizationDetails('${org.id}')">
            <div class="organization-header">
                <div class="organization-icon" style="background-color: ${typeColor}">
                    ${initials}
                </div>
                <div class="organization-title">
                    <div class="organization-name">${org.name}</div>
                    <div class="organization-type" style="background-color: ${typeColor}20; color: ${typeColor}">
                        ${org.type.replace('_', ' ').toUpperCase()}
                    </div>
                </div>
            </div>
            
            <div class="organization-details">
                <div class="organization-detail">
                    <div class="organization-detail-icon">👤</div>
                    <span>${org.contactPerson}</span>
                </div>
                <div class="organization-detail">
                    <div class="organization-detail-icon">📧</div>
                    <span><a href="mailto:${org.email}" style="color: #667eea;">${org.email}</a></span>
                </div>
                <div class="organization-detail">
                    <div class="organization-detail-icon">📞</div>
                    <span><a href="tel:${org.phone}" style="color: #667eea;">${org.phone}</a></span>
                </div>
                <div class="organization-detail">
                    <div class="organization-detail-icon">🌐</div>
                    <span><a href="${org.website}" target="_blank" style="color: #667eea;">${org.website}</a></span>
                </div>
                <div class="organization-detail">
                    <div class="organization-detail-icon">📍</div>
                    <span>${org.address}</span>
                </div>
                <div class="organization-detail">
                    <div class="organization-detail-icon">🔗</div>
                    <span>${orgRelationships.length} connections</span>
                </div>
                ${org.tags ? `
                <div class="organization-detail tags-detail">
                    <div class="organization-detail-icon">🏷️</div>
                    <div class="tags-container">${org.tags.map(tag => `<span style="background: #667eea20; color: #667eea; padding: 2px 6px; border-radius: 10px; font-size: 0.8em; margin-right: 4px; display: inline-block; margin-bottom: 2px;">${tag}</span>`).join('')}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="organization-description">
                ${org.description}
            </div>
            
            <div class="organization-actions">
                <button class="btn-view-details" onclick="event.stopPropagation(); showOrganizationDetails('${org.id}')">
                    View Details
                </button>
                <a href="mailto:${org.email}" class="btn-email" onclick="event.stopPropagation()">
                    📧 Email
                </a>
            </div>
        </div>
    `;
}

function getInitials(name) {
    return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

function getOrganizationRelationships(orgId) {
    return relationships.filter(rel => 
        rel.source === orgId || rel.target === orgId
    );
}

function showOrganizationDetails(orgId) {
    const org = organizations.find(o => o.id === orgId);
    if (!org) return;
    
    const orgRelationships = getOrganizationRelationships(orgId);
    const typeColor = colorScheme[org.type] || '#95a5a6';
    
    // Get related organizations
    const relatedOrgs = orgRelationships.map(rel => {
        const relatedId = rel.source === orgId ? rel.target : rel.source;
        const relatedOrg = organizations.find(o => o.id === relatedId);
        return {
            org: relatedOrg,
            relationship: rel,
            isSource: rel.source === orgId
        };
    }).filter(item => item.org);
    
    // Update modal content
    document.getElementById('modalTitle').textContent = org.name;
    document.getElementById('modalBody').innerHTML = `
        <div class="modal-section">
            <h3>Basic Information</h3>
            <div class="modal-info">
                <div class="modal-label">Organization Type:</div>
                <div class="modal-value" style="color: ${typeColor}; font-weight: 600;">
                    ${org.type.replace('_', ' ').toUpperCase()}
                </div>
                <div class="modal-label">Contact Person:</div>
                <div class="modal-value">${org.contactPerson}</div>
                <div class="modal-label">Email:</div>
                <div class="modal-value">
                    <a href="mailto:${org.email}" style="color: #667eea;">${org.email}</a>
                </div>
                <div class="modal-label">Phone:</div>
                <div class="modal-value">
                    <a href="tel:${org.phone}" style="color: #667eea;">${org.phone}</a>
                </div>
                <div class="modal-label">Website:</div>
                <div class="modal-value">
                    <a href="${org.website}" target="_blank" style="color: #667eea;">${org.website}</a>
                </div>
                <div class="modal-label">Address:</div>
                <div class="modal-value">${org.address}</div>
                ${org.tags ? `
                <div class="modal-label">Tags:</div>
                <div class="modal-value tags-modal">
                    ${org.tags.map(tag => `<span style="background: #667eea20; color: #667eea; padding: 4px 8px; border-radius: 12px; font-size: 0.9em; margin-right: 6px; display: inline-block; margin-bottom: 4px;">${tag}</span>`).join('')}
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="modal-section">
            <h3>Description</h3>
            <p style="color: #666; line-height: 1.6;">${org.description}</p>
        </div>
        
        <div class="modal-section">
            <h3>Relationships (${relatedOrgs.length})</h3>
            <div class="modal-relationships">
                ${relatedOrgs.map(item => `
                    <div class="relationship-item">
                        <div class="relationship-type">
                            ${item.isSource ? '→' : '←'} ${item.relationship.type.replace('_', ' ').toUpperCase()}
                        </div>
                        <div style="font-weight: 600; margin-bottom: 5px;">
                            ${item.isSource ? 'To' : 'From'}: ${item.org.name}
                        </div>
                        <div class="relationship-description">
                            ${item.relationship.description}
                        </div>
                    </div>
                `).join('')}
                ${relatedOrgs.length === 0 ? '<p style="color: #999; text-align: center; padding: 20px;">No relationships found</p>' : ''}
            </div>
        </div>
    `;
    
    // Show modal
    document.getElementById('detailModal').style.display = 'block';
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('sortBy').value = 'name';
    
    searchTerm = '';
    typeFilter = '';
    sortBy = 'name';
    
    document.getElementById('clearSearch').style.display = 'none';
    filterAndRender();
}

function showError(message) {
    const container = document.getElementById('organizationsList');
    container.innerHTML = `
        <div class="no-results">
            <h3>Error</h3>
            <p>${message}</p>
            <button class="btn" onclick="location.reload()">Retry</button>
        </div>
    `;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
