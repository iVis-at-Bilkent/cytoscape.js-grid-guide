module.exports = function (gridSpacing) {
/*
    function snapCyTarget(e) {
        snapNode(e.cyTarget);
    }

    //cy.on("style", "node", snapCyTarget);
    cy.on("add", "node", snapCyTarget);
    cy.on("free", "node", snapCyTarget); // If discrete drag is disabled
    cy.on("ready", snapAllNodes);
*/

    var snapPos = function (pos) {
        var newPos = {
            x: (Math.floor(pos.x / gridSpacing) + 0.5) * gridSpacing,
            y: (Math.floor(pos.y / gridSpacing) + 0.5) * gridSpacing
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

    var snapNodes = function (nodes) {
        return nodes.each(function (i, node) {
            snapNode(node);
        });
    };

    return {
        snapPos: snapPos,
        snapNode: snapNode,
        snapNodes: snapNodes
    };

};