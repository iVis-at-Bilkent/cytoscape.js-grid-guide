module.exports = function ( cy, snap, resize, discreteDrag, drawGrid, guidelines, $) {

    var feature = function (func) {
        return function (enable) {
            func(enable);
        };
    };

    var controller = {
        discreteDrag: new feature(setDiscreteDrag),
        resize: new feature(setResize),
        snapToGrid: new feature(setSnapToGrid),
        drawGrid: new feature(setDrawGrid),
        guidelines: new feature(setGuidelines)
    };

    
    function applyToCyTarget(func) {
        return function (e) {
            if(!e.cyTarget.is(":parent"))
                func(e.cyTarget);
        }
    }
    
    function applyToAllNodes(func) {
        return function () {
            cy.nodes().not(":parent").each(function (i, ele) {
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
    var drawGridOnZoom = function () { if( latestOptions.zoomDash ) drawGrid.drawGrid() };
    var drawGridOnPan = function () { if( latestOptions.panGrid ) drawGrid.drawGrid() };

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

    // Guidelines

    function setGuidelines(enable) {
        if (enable)
            guidelines.changeOptions(currentOptions);

        cy[eventStatus(enable)]( 'zoom', guidelines.onZoom);
        cy[eventStatus(enable)]( 'drag', "node", guidelines.onDragNode);
        cy[eventStatus(enable)]( 'grab', "node", guidelines.onGrabNode);
        cy[eventStatus(enable)]( 'free', "node", guidelines.onFreeNode);


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