const h = require("./helper");

module.exports = function (gridSpacing) {


    var changeOptions = function (opts) {
        gridSpacing = Number(opts.gridSpacing);
    };

    var getScratch = function (node) {
        if (!node.scratch("_gridGuide"))
            node.scratch("_gridGuide", {});

        return node.scratch("_gridGuide");
    };

    function resizeNode(node) {
        node = h.removeIgnored(node);
        if (node.length < 1) {
          return;
        }
        var width = node.width();
        var height = node.height();

        var newWidth = Math.round((width - gridSpacing) / (gridSpacing * 2)) * (gridSpacing * 2);
        var newHeight = Math.round((height - gridSpacing) / (gridSpacing * 2)) * (gridSpacing * 2);
        newWidth = newWidth > 0 ? newWidth + gridSpacing : gridSpacing;
        newHeight = newHeight > 0 ? newHeight + gridSpacing : gridSpacing;

        if (width != newWidth || height != newHeight) {
            node.style({
                "width": newWidth,
                "height": newHeight
            });
            getScratch(node).resize = {
                oldWidth: width,
                oldHeight: height
            };
        }
    }

    function recoverNodeDimensions(node) {
        node = h.removeIgnored(node);
        if (node.length < 1) {
          return;
        }
        var oldSizes = getScratch(node).resize;
        if (oldSizes) 
            node.style({
                "width": oldSizes.oldWidth,
                "height": oldSizes.oldHeight
            });


    }


    return {
        resizeNode: resizeNode,
        recoverNodeDimensions: recoverNodeDimensions,
        changeOptions: changeOptions
    };

};