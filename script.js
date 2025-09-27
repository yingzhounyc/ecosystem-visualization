// Global variables
let data = null;
let svg, g, simulation;
let nodes, links, nodeLabels;
let showLabels = true;
let nodeSize = 10;
let linkDistance = 100;

// Color scheme for different organization types
const colorScheme = {
    corporation: '#e74c3c',
    higher_ed: '#3498db',
    non_profit: '#2ecc71',
    government_agency: '#f39c12',
    international_org: '#9b59b6'
};

// Initialize the application
async function init() {
    try {
        // Load data
        const response = await fetch('organizations.json');
        data = await response.json();
        
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
    links = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.relationships)
        .enter().append('line')
        .attr('class', 'link')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
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
        .attr('r', nodeSize)
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
    // Node size control
    d3.select('#nodeSize').on('input', function() {
        nodeSize = +this.value;
        nodes.attr('r', nodeSize);
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
}

function showTooltip(event, d, type) {
    const tooltip = d3.select('#tooltip');
    
    if (type === 'organization') {
        tooltip.html(`
            <h4>${d.name}</h4>
            <p><strong>Contact:</strong> ${d.contactPerson}</p>
            <p><strong>Email:</strong> ${d.email}</p>
            <p><strong>Address:</strong> ${d.address}</p>
            <p><strong>Type:</strong> ${d.type.replace('_', ' ').toUpperCase()}</p>
            <p><strong>Description:</strong> ${d.description}</p>
        `);
    } else if (type === 'relationship') {
        const sourceOrg = data.organizations.find(org => org.id === d.source.id);
        const targetOrg = data.organizations.find(org => org.id === d.target.id);
        
        tooltip.html(`
            <h4>${d.type.replace('_', ' ').toUpperCase()}</h4>
            <p><strong>From:</strong> ${sourceOrg.name}</p>
            <p><strong>To:</strong> ${targetOrg.name}</p>
            <p><strong>Description:</strong> ${d.description}</p>
        `);
    }
    
    tooltip.style('opacity', 1)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
}

function hideTooltip() {
    d3.select('#tooltip').style('opacity', 0);
}

function highlightConnections(nodeId) {
    // Highlight connected links
    links.style('opacity', d => 
        d.source.id === nodeId || d.target.id === nodeId ? 1 : 0.3
    );
    
    // Highlight connected nodes
    nodes.style('opacity', d => {
        const isConnected = data.relationships.some(rel => 
            (rel.source.id === nodeId && rel.target.id === d.id) ||
            (rel.target.id === nodeId && rel.source.id === d.id)
        );
        return isConnected || d.id === nodeId ? 1 : 0.3;
    });
    
    // Highlight connected labels
    nodeLabels.style('opacity', d => {
        const isConnected = data.relationships.some(rel => 
            (rel.source.id === nodeId && rel.target.id === d.id) ||
            (rel.target.id === nodeId && rel.source.id === d.id)
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

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);
