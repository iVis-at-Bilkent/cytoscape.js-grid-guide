module.exports = function (gridSpacing) {

    var changeOptions = function (opts) {
        gridSpacing = opts.gridSpacing;
    };

    function moveTopDown(children, dx, dy) {
        for(var i = 0; i < children.length; i++){
            var child = children[i];
            child.position({
                x: child.position('x') + dx,
                y: child.position('y') + dy
            });
            moveTopDown(child.children(), dx, dy);
        }
    }

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
            oldPos: node.position()
        };

        moveTopDown(node, newPos.x - node.position("x"), newPos.y - node.position("y"));
        console.log("asdds");
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