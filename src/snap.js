module.exports = function (options, cy) {

    function snapCyTarget(e) {
        snapNode(e.cyTarget);
    }

    cy.on("style", "node", snapCyTarget);
    cy.on("add", "node", snapCyTarget);
    cy.on("free", "node", snapCyTarget); // If discrete drag is disabled
    cy.on("ready", snapAllNodes);


    var snapPos = function (pos) {
        var newPos = {
            x: Math.round(pos.x / options.gridSpacing) * options.gridSpacing,
            y: Math.round(pos.y / options.gridSpacing) * options.gridSpacing
        };

        return newPos;
    };

    var snapNode = function (node, toPos) {
        var pos = node.position();

        if (!toPos)
            var newPos = snapPos(pos);
        else
            newPos = snapPos(toPos);

        return node.position(newPos);

    };

    var snapAllNodes = function () {
        return cy.nodes().each(function (i, node) {
            snapNode(node);
        });
    };

    return {
        snapPos: snapPos,
        snapNode: snapNode,
        snapAllNodes: snapAllNodes
    };

};