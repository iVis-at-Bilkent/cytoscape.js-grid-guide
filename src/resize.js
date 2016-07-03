module.exports = function (gridSpacing) {


    function resizeNode(node) {
        var width = node.width();
        var height = node.height();

        var newWidth = Math.round(width / gridSpacing) * gridSpacing;
        var newHeight = Math.round(height / gridSpacing) * gridSpacing;

        newWidth = newWidth > 0 ? newWidth : gridSpacing;
        newHeight = newHeight > 0 ? newHeight : gridSpacing;

        if (width != newWidth || height != newHeight)
            node.style({
                "width": newWidth,
                "height": newHeight
            });
    }

    function resizeNodes(nodes) {
        nodes.each(function (i, ele) {
            resizeNode(node);
        });
    }


    return {
        resizeNode: resizeNode,
        resizeNodes: resizeNodes
    };
   // cy.on("style", "node", onStyleChanged);


};