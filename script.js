// Global variables
let data = null;
let svg, g, simulation;
let nodes, links, nodeLabels;
let showLabels = true;
let nodeSize = 10;
let linkDistance = 100;
let searchTerm = '';

// Color scheme for different organization types
const colorScheme = {
    corporation: '#3498db',
    education: '#ff5b00',
    non_profit: '#2ecc71',
    government_agency: '#808080',
    small_business: '#40E0D0', // Turquoise for small businesses
    investor_funder: '#9b59b6', // Purple for investors/funders
    category: '#E4a0f7', // Red for categories
};

// Initialize the application
async function init() {
    try {
        // Load data with cache busting
        const response = await fetch(`organizations.json?t=${Date.now()}`);
        data = await response.json();
        console.log('Loaded data:', data);
        
        // Setup SVG and simulation
        setupVisualization();
        
        // Create the network
        createNetwork();
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('Ecosystem visualization initialized successfully');
    } catch (error) {
        console.error('Error initializing visualization:', error);
    }
}

function setupVisualization() {
    // Get SVG element and set dimensions
    svg = d3.select('#network-svg');
    const width = parseInt(svg.style('width'));
    const height = parseInt(svg.style('height'));
    
    // Create main group for zoom/pan
    g = svg.append('g');
    
    // Setup zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // Create simulation
    simulation = d3.forceSimulation(data.organizations)
        .force('link', d3.forceLink(data.relationships).id(d => d.id).distance(linkDistance))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => nodeSize + 5));
}

function createNetwork() {
    const width = parseInt(svg.style('width'));
    const height = parseInt(svg.style('height'));
    
    // Create links
    console.log('Creating links with relationships:', data.relationships);
    links = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.relationships)
        .enter().append('line')
        .attr('class', 'link')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
            console.log('Hovering over relationship:', d);
            showTooltip(event, d, 'relationship');
        })
        .on('mouseout', hideTooltip);
    
    // Create nodes
    nodes = g.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(data.organizations)
        .enter().append('circle')
        .attr('class', 'node')
        .attr('r', d => {
            const radius = d.type === 'category' ? nodeSize * 1.3 : nodeSize;
            if (d.type === 'category') {
                console.log('Category node:', d.name, 'radius:', radius);
            }
            return radius;
        })
        .attr('fill', d => colorScheme[d.type] || '#95a5a6')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))
        .on('mouseover', function(event, d) {
            showTooltip(event, d, 'organization');
            // Highlight connected nodes and links
            highlightConnections(d.id);
        })
        .on('mouseout', function(event, d) {
            hideTooltip();
            // Remove highlighting
            removeHighlighting();
        })
        .on('click', function(event, d) {
            // Center on clicked node
            centerOnNode(d);
        });
    
    // Create node labels
    nodeLabels = g.append('g')
        .attr('class', 'node-labels')
        .selectAll('text')
        .data(data.organizations)
        .enter().append('text')
        .attr('class', 'node-label')
        .text(d => d.name)
        .attr('text-anchor', 'middle')
        .attr('dy', nodeSize + 15)
        .style('opacity', showLabels ? 1 : 0)
        .style('pointer-events', 'none');
    
    // Create legend inside SVG
    createLegend();
    
    // Update simulation
    simulation.nodes(data.organizations);
    simulation.force('link').links(data.relationships);
    
    // Update positions on tick
    simulation.on('tick', () => {
        links
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        nodes
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
        
        nodeLabels
            .attr('x', d => d.x)
            .attr('y', d => d.y);
    });
    
    // Start simulation
    simulation.alpha(1).restart();
}

function setupEventListeners() {
    // Search functionality
    d3.select('#searchInput').on('input', function() {
        searchTerm = this.value.toLowerCase();
        const clearButton = d3.select('#clearSearch');
        clearButton.style('display', searchTerm ? 'flex' : 'none');
        filterNodes();
    });
    
    // Clear search button
    d3.select('#clearSearch').on('click', function() {
        d3.select('#searchInput').property('value', '');
        searchTerm = '';
        d3.select('#clearSearch').style('display', 'none');
        filterNodes();
    });
    
    // Node size control
    d3.select('#nodeSize').on('input', function() {
        nodeSize = +this.value;
        nodes.attr('r', d => {
            const radius = d.type === 'category' ? nodeSize * 1.4 : nodeSize;
            if (d.type === 'category') {
                console.log('Updating category node:', d.name, 'radius:', radius);
            }
            return radius;
        });
        nodeLabels.attr('dy', nodeSize + 15);
        simulation.force('collision').radius(nodeSize + 5);
        simulation.alpha(0.3).restart();
    });
    
    // Link distance control
    d3.select('#linkDistance').on('input', function() {
        linkDistance = +this.value;
        simulation.force('link').distance(linkDistance);
        simulation.alpha(0.3).restart();
    });
    
    // Reset view button
    d3.select('#resetView').on('click', function() {
        svg.transition().duration(750).call(
            d3.zoom().transform,
            d3.zoomIdentity
        );
    });
    
    // Toggle labels button
    d3.select('#toggleLabels').on('click', function() {
        showLabels = !showLabels;
        nodeLabels.transition().duration(300)
            .style('opacity', showLabels ? 1 : 0);
    });
    
    // Reload data button
    d3.select('#reloadData').on('click', function() {
        reloadData();
    });
    
    // List view button
    d3.select('#listView').on('click', function() {
        window.location.href = 'list-view.html';
    });
}

function showTooltip(event, d, type) {
    console.log('showTooltip called', type, d);
    const tooltip = d3.select('#tooltip');
    
    if (type === 'organization') {
        tooltip.html(`
            <h4>${d.name}</h4>
            <p><strong>Contact:</strong> ${d.contactPerson}</p>
            <p><strong>Email:</strong> <a href="mailto:${d.email}" style="color: #667eea;">${d.email}</a></p>
            <p><strong>Phone:</strong> <a href="tel:${d.phone}" style="color: #667eea;">${d.phone}</a></p>
            <p><strong>Website:</strong> <a href="${d.website}" target="_blank" style="color: #667eea;">${d.website}</a></p>
            <p><strong>Address:</strong> ${d.address}</p>
            <p><strong>Type:</strong> ${d.type.replace('_', ' ').toUpperCase()}</p>
            <p class="tags-line"><strong>Tags:</strong> ${d.tags ? d.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('') : 'None'}</p>
            <p><strong>Description:</strong> ${d.description}</p>
        `);
    } else if (type === 'relationship') {
        console.log('Relationship tooltip data:', d);
        // Handle both string IDs and D3 objects
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        console.log('Source ID:', sourceId, 'Target ID:', targetId);
        
        const sourceOrg = data.organizations.find(org => org.id === sourceId);
        const targetOrg = data.organizations.find(org => org.id === targetId);
        console.log('Source org found:', sourceOrg);
        console.log('Target org found:', targetOrg);
        
        // Determine if this is a mutual relationship
        const isMutual = d.type.includes('mutual') || d.type.includes('collaboration') || d.type.includes('partnership');
        
        // Create relationship direction text
        let directionText = '';
        if (isMutual) {
            directionText = `
                <p><strong>Between:</strong> ${sourceOrg ? sourceOrg.name : 'Unknown'} ↔ ${targetOrg ? targetOrg.name : 'Unknown'}</p>
                <p><strong>Type:</strong> Mutual ${d.type.replace('_', ' ').toUpperCase()}</p>
            `;
        } else {
            directionText = `
                <p><strong>From:</strong> ${sourceOrg ? sourceOrg.name : 'Unknown'}</p>
                <p><strong>To:</strong> ${targetOrg ? targetOrg.name : 'Unknown'}</p>
                <p><strong>Type:</strong> ${d.type.replace('_', ' ').toUpperCase()}</p>
            `;
        }
        
        tooltip.html(`
            <h4>${d.type.replace('_', ' ').toUpperCase()}</h4>
            ${directionText}
            <p><strong>Description:</strong> ${d.description}</p>
        `);
    }
    
    // Smart tooltip positioning - place on left/right side of canvas
    const tooltipWidth = 300; // max-width from CSS
    const tooltipHeight = 200; // estimated height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get the visualization container bounds
    const visualizationContainer = document.querySelector('.visualization-container');
    const containerRect = visualizationContainer.getBoundingClientRect();
    const containerLeft = containerRect.left;
    const containerRight = containerRect.right;
    const containerTop = containerRect.top;
    const containerBottom = containerRect.bottom;
    
    // Keep tooltip at same height as the node (event.pageY)
    let top = event.pageY - tooltipHeight / 2;
    
    // Determine if we should place tooltip on left or right side
    const nodeX = event.pageX;
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const placeOnLeft = nodeX > containerCenterX;
    
    let left;
    if (placeOnLeft) {
        // Place tooltip on the left side of the canvas
        left = containerLeft - tooltipWidth - 20;
    } else {
        // Place tooltip on the right side of the canvas
        left = containerRight + 20;
    }
    
    // Ensure tooltip doesn't go off screen vertically
    if (top < containerTop) {
        top = containerTop + 10;
    } else if (top + tooltipHeight > containerBottom) {
        top = containerBottom - tooltipHeight - 10;
    }
    
    // If tooltip would go off screen horizontally, use fallback positioning
    if (left < 0) {
        // Place on right side if left side is off screen
        left = containerRight + 20;
    } else if (left + tooltipWidth > viewportWidth) {
        // Place on left side if right side is off screen
        left = containerLeft - tooltipWidth - 20;
    }
    
    // Final fallback - center in viewport if still off screen
    if (left < 0 || left + tooltipWidth > viewportWidth) {
        left = (viewportWidth - tooltipWidth) / 2;
    }
    
    // Add appropriate CSS class for arrow direction
    tooltip.classed('tooltip-left', placeOnLeft)
           .classed('tooltip-right', !placeOnLeft);
    
    tooltip.style('opacity', 1)
        .style('left', left + 'px')
        .style('top', top + 'px')
        .style('display', 'block');
}

function hideTooltip() {
    d3.select('#tooltip')
        .style('opacity', 0)
        .style('display', 'none')
        .classed('tooltip-left', false)
        .classed('tooltip-right', false);
}

function highlightConnections(nodeId) {
    // Highlight connected links
    links.style('opacity', d => 
        d.source.id === nodeId || d.target.id === nodeId ? 1 : 0.3
    );
    
    // Highlight connected nodes
    nodes.style('opacity', d => {
        const isConnected = data.relationships.some(rel => 
            (rel.source === nodeId && rel.target === d.id) ||
            (rel.target === nodeId && rel.source === d.id)
        );
        return isConnected || d.id === nodeId ? 1 : 0.3;
    });
    
    // Highlight connected labels
    nodeLabels.style('opacity', d => {
        const isConnected = data.relationships.some(rel => 
            (rel.source === nodeId && rel.target === d.id) ||
            (rel.target === nodeId && rel.source === d.id)
        );
        return isConnected || d.id === nodeId ? 1 : 0.3;
    });
}

function removeHighlighting() {
    links.style('opacity', 0.6);
    nodes.style('opacity', 1);
    nodeLabels.style('opacity', showLabels ? 1 : 0);
}

function centerOnNode(d) {
    const width = parseInt(svg.style('width'));
    const height = parseInt(svg.style('height'));
    
    svg.transition().duration(750).call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(
            width / 2 - d.x,
            height / 2 - d.y
        ).scale(1.5)
    );
}

// Drag functions
function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function createLegend() {
    const legendContainer = d3.select('#legend');
    
    // Clear existing legend
    legendContainer.selectAll('*').remove();
    
    // Legend title
    legendContainer.append('h4')
        .text('Organization Types');
    
    // Legend items
    const legendData = [
        { type: 'corporation', label: 'Corporations & Industry', color: colorScheme.corporation },
        { type: 'government_agency', label: 'Government & Public Agencies', color: colorScheme.government_agency },
        { type: 'education', label: 'Education', color: colorScheme.education },
        { type: 'non_profit', label: 'Non-Profit', color: colorScheme.non_profit },
        { type: 'small_business', label: 'Entrepreneurs & Small Businesses', color: colorScheme.small_business },
        { type: 'investor_funder', label: 'Investors & Funders', color: colorScheme.investor_funder },
        { type: 'category', label: 'Categories', color: colorScheme.category, shape: 'triangle' }
    ];
    
    // Create legend items
    const legendItems = legendContainer.selectAll('.legend-item')
        .data(legendData)
        .enter()
        .append('div')
        .attr('class', 'legend-item');
    
    // Add symbols
    legendItems.each(function(d) {
        const item = d3.select(this);
        
        if (d.shape === 'triangle') {
            item.append('div')
                .attr('class', 'legend-symbol triangle')
                .style('border-bottom-color', d.color);
        } else {
            item.append('div')
                .attr('class', 'legend-symbol')
                .style('background-color', d.color);
        }
        
        item.append('span')
            .text(d.label);
    });
}

function filterNodes() {
    if (!data || !nodes) return;
    
    // Filter organizations based on search term
    const filteredOrgs = data.organizations.filter(org => {
        if (!searchTerm) return true;
        
        return org.name.toLowerCase().includes(searchTerm) ||
               org.contactPerson.toLowerCase().includes(searchTerm) ||
               org.email.toLowerCase().includes(searchTerm) ||
               org.description.toLowerCase().includes(searchTerm) ||
               org.address.toLowerCase().includes(searchTerm) ||
               (org.tags && org.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
    });
    
    // Update search results counter
    const searchResults = d3.select('#search-results');
    if (searchTerm) {
        searchResults
            .style('display', 'block')
            .text(`Found ${filteredOrgs.length} of ${data.organizations.length} organizations`);
    } else {
        searchResults.style('display', 'none');
    }
    
    // Update node visibility
    nodes.style('opacity', d => {
        return filteredOrgs.some(org => org.id === d.id) ? 1 : 0.3;
    });
    
    // Update label visibility
    nodeLabels.style('opacity', d => {
        const isVisible = filteredOrgs.some(org => org.id === d.id);
        return isVisible && showLabels ? 1 : 0;
    });
    
    // Update link visibility
    links.style('opacity', d => {
        const sourceVisible = filteredOrgs.some(org => org.id === d.source.id);
        const targetVisible = filteredOrgs.some(org => org.id === d.target.id);
        return sourceVisible && targetVisible ? 1 : 0.1;
    });
}

// Function to reload data and refresh visualization
async function reloadData() {
    try {
        console.log('Reloading data...');
        const response = await fetch(`organizations.json?t=${Date.now()}`);
        data = await response.json();
        console.log('Reloaded data:', data);
        
        // Clear existing visualization
        d3.select('#network-svg').selectAll('*').remove();
        
        // Recreate visualization
        setupVisualization();
        createNetwork();
        
        console.log('Visualization refreshed with new data');
    } catch (error) {
        console.error('Error reloading data:', error);
    }
}

// Add keyboard shortcut to reload data (Ctrl+R or Cmd+R)
document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        reloadData();
    }
});

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);
