module.exports = function (gridSpacing) {

    var changeOptions = function (opts) {
        gridSpacing = opts.gridSpacing;
    };

    var getScratch = function (node) {
        if (!node.scratch("_snapToGrid"))
            node.scratch("_snapToGrid", {});

        return node.scratch("_snapToGrid");
    };

    var snapPos = function (pos) {
        var newPos = {
            x: (Math.floor(pos.x / gridSpacing) + 0.5) * gridSpacing,
            y: (Math.floor(pos.y / gridSpacing) + 0.5) * gridSpacing
        };

        return newPos;
    };

    var snapNode = function (node, toPos) {
        var pos = toPos ? toPos : node.position();

        var newPos = snapPos(pos);

        getScratch(node).snap = {
            oldPos: pos
        };


        return node.position(newPos);
    };

    var recoverSnapNode = function (node) {
        var snapScratch = getScratch(node).snap;
        if (snapScratch) {
            node.position(snapScratch.oldPos);
        }
    };

    return {
        snapPos: snapPos,
        snapNode: snapNode,
        recoverSnapNode: recoverSnapNode,
        changeOptions: changeOptions
    };

};