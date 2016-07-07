cytoscape-snap-to-grid
================================================================================


## Description

Framework for grid interactions. Provides discrete dragging, grid background, gridlines on dragging, resizing nodes 
& compounds to fit cells.


## API

 *`cy.snapToGrid(options)` Sets stated options any time wanted.
 
## Default Options
```js
        var options = {
            // On/Off Modules
            snapToGrid: true, // Snap to grid functionality
            discreteDrag: true, // Discrete Drag
            guidelines: true, // Guidelines on dragging nodes
            resize: true, // Adjust node sizes to cell sizes
            parentPadding: true, // Adjust parent sizes to cell sizes by padding
            drawGrid: true, // Draw grid background

            // Other settings

            // General
            gridSpacing: 40, // Distance between the lines of the grid.

            // Draw Grid
            zoomDash: true, // Determines whether the size of the dashes should change when the drawing is zoomed in and out if grid is drawn.
            panGrid: true, // Determines whether the grid should move then the user moves the graph if grid is drawn.
            gridStackOrder: -1, // Namely z-index
            strokeStyle: '#CCCCCC', // Color of grid lines
            lineWidth: 1.0, // Width of grid lines
            lineDash: [5,8], // Defines style of dash. Read: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash

            // Guidelines
            guidelinesStackOrder: 4, // z-index of guidelines
            guidelinesTolerance: 0.08, // Tolerance distance for rendered positions of nodes' interaction.
            guidelinesStyle: { // Set ctx properties of line. Properties are here: http://www.w3schools.com/tags/ref_canvas.asp
                strokeStyle: "black"
            },

            // Parent Padding
            parentSpacing: -1 // -1 to set paddings of parents to gridSpacing
        };
```

## Dependencies

 * Cytoscape.js ^1.6.10
 * jQuery ^1.4 || ^2.0 || ^3.0


## Usage instructions

Download the library:
 * via npm: `npm install cytoscape-snap-to-grid`,
 * via bower: `bower install cytoscape-snap-to-grid`, or
 * via direct download in the repository (probably from a tag).

`require()` the library as appropriate for your project:

CommonJS:
```js
var cytoscape = require('cytoscape');
var snap-to-grid = require('cytoscape-snap-to-grid');

snap-to-grid( cytoscape, jquery ); // register extension
```

AMD:
```js
require(['cytoscape', 'cytoscape-snap-to-grid'], function( cytoscape, snap-to-grid ){
  snap-to-grid( cytoscape ); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.


## Publishing instructions

This project is set up to automatically be published to npm and bower.  To publish:

1. Set the version number environment variable: `export VERSION=1.2.3`
1. Publish: `gulp publish`
1. If publishing to bower for the first time, you'll need to run `bower register cytoscape-snap-to-grid https://github.com/iVis-at-Bilkent/cytoscape.js-snap-to-grid.git`


## Credits
Draw grid functionality is written by [guimeira](https://github.com/guimeira).