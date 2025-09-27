# Ecosystem Visualization App

A beautiful, interactive network visualization tool that displays organizations and their relationships as nodes and edges in a dynamic graph.

## Features

- **Interactive Network Graph**: Visualize organizations as nodes and their relationships as connecting edges
- **Organization Details**: Hover over nodes to see detailed information including contact person, email, address, and organization type
- **Relationship Information**: Hover over edges to see relationship details between organizations
- **Customizable Visualization**: Adjust node size and link distance with interactive controls
- **Zoom & Pan**: Navigate the network with mouse wheel zoom and drag to pan
- **Node Highlighting**: Click on nodes to highlight their connections
- **Label Toggle**: Show/hide organization names on the graph
- **Responsive Design**: Works on desktop and mobile devices

## Organization Types

The visualization supports different organization types with color coding:

- 🔴 **Corporation** - Business organizations
- 🔵 **Higher Education** - Universities and colleges
- 🟢 **Non-Profit** - Non-profit organizations
- 🟠 **Government Agency** - Government institutions
- 🟣 **International Organization** - Global organizations

## How to Use

1. **Open the Application**: Open `index.html` in a web browser or serve it locally
2. **Navigate**: Use mouse wheel to zoom in/out, drag to pan around the network
3. **Explore Organizations**: Hover over nodes to see organization details
4. **View Relationships**: Hover over edges to see relationship information
5. **Customize View**: Use the controls to adjust node size and link distance
6. **Focus on Connections**: Click on any node to center the view and highlight its connections
7. **Toggle Labels**: Use the "Toggle Labels" button to show/hide organization names

## Data Structure

The application reads from `organizations.json` which contains:

- **Organizations**: Array of organization objects with properties like name, contact person, email, address, type, and description
- **Relationships**: Array of relationship objects connecting organizations with relationship types and descriptions

## Technical Details

- Built with **D3.js** for powerful data visualization
- Uses **Force Simulation** for natural node positioning
- **Responsive CSS** with modern design principles
- **Interactive Controls** for real-time customization
- **Tooltip System** for detailed information display

## Running Locally

1. Clone or download the project files
2. Start a local server (e.g., `python3 -m http.server 8000`)
3. Open `http://localhost:8000` in your browser

## Customization

To add your own organizations:

1. Edit `organizations.json`
2. Add new organization objects with the required properties
3. Add relationship objects to connect organizations
4. Refresh the browser to see changes

The visualization will automatically adapt to your data structure and create an interactive network graph.
