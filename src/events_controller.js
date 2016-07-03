module.exports = function ( cy, snap, resize, discreteDrag, drawGrid, $) {

    var feature = function (func) {
        return function (enable) {
            func(enable);
        };
    };

    var controller = {
        discreteDrag: new feature(setDiscreteDrag),
        resize: new feature(setResize),
        snapToGrid: new feature(setSnapToGrid),
        drawGrid: new feature(setDrawGrid)
    };

    
    function applyToCyTarget(func) {
        return function (e) {
            func(e.cyTarget);
        }
    }
    
    function applyToAllNodes(func) {
        return function () {
            cy.nodes().each(function (i, ele) {
                func(ele);
            });
        };
    }
    function eventStatus(enable) {
        return enable ? "on" : "off";
    }


    // Discrete Drag
    function setDiscreteDrag(enable) {
        cy[eventStatus(enable)]("tapstart", "node", discreteDrag.tapStartNode);
    }

    // Resize
    var resizeAllNodes = applyToAllNodes(resize.resizeNode);
    var resizeNode = applyToCyTarget(resize.resizeNode);
    var recoverAllNodeDimensions = applyToAllNodes(resize.recoverNodeDimensions);

    function setResize(enable) {
        cy[eventStatus(enable)]("ready", resizeAllNodes);
        cy[eventStatus(enable)]("style", "node", resizeNode);
        enable ? resizeAllNodes() : recoverAllNodeDimensions();
    }

    // Snap To Grid
    var snapAllNodes= applyToAllNodes(snap.snapNode);
    var snapNode = applyToCyTarget(snap.snapNode);

    function setSnapToGrid(enable) {
        cy[eventStatus(enable)]("add", "node", snapNode);
        cy[eventStatus(enable)]("ready", snapAllNodes);

        cy[eventStatus(enable)]("free", "node", snapNode); // TODO: If discrete drag is disabled

        if (enable) {
            snapAllNodes();
        } else {

        }
    }
    
    // Draw Grid
    var drawGridOnZoom = function () { console.log("zoom"); if( latestOptions.zoomDash ) drawGrid.drawGrid() };
    var drawGridOnPan = function () { console.log("pan"); if( latestOptions.panGrid ) drawGrid.drawGrid() };

    function setDrawGrid(enable) {

        cy[eventStatus(enable)]( 'zoom', drawGridOnZoom );
        cy[eventStatus(enable)]( 'pan', drawGridOnPan );

        if (enable){
            drawGrid.changeOptions(currentOptions);
            drawGrid.initCanvas();
            $( window ).on( 'resize', drawGrid.resizeCanvas );
        } else {
            drawGrid.clearCanvas();
            $( window ).off( 'resize', drawGrid.resizeCanvas );
        }
    }

    // Sync with options: Enables/disables changed via options.
    var latestOptions = {};
    var currentOptions;
    function syncWithOptions(options) {
        currentOptions = options;
        for (var key in controller)
            if (latestOptions[key] != options[key])
                controller[key](options[key]);
        latestOptions = options;
    }

    function init(options) {
        currentOptions = options;
        syncWithOptions(options);
        latestOptions = options;
    }
    
    return {
        init: init,
        syncWithOptions: syncWithOptions
    };
    
};