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
            snapToGrid: true,
            discreteDrag: true,
            resize: true,
            guidelines: true,
            drawGrid: true,
            parentPadding: true,
            
            zoomDash: true,
            panGrid: true,
            gridSpacing: 40,
            gridStackOrder: -1,
            strokeStyle: '#CCCCCC',
            lineWidth: 1.0,
            lineDash: [5,8],
            guidelinesStackOrder: 4,
            guidelinesTolerance: 0.08
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