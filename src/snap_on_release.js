module.exports = function (cy, gridSpacing) {

    var snap = { };

    snap.changeOptions = function (opts) {
        gridSpacing = opts.gridSpacing;
    };

    var getScratch = function (node) {
        if (!node.scratch("_gridGuide"))
            node.scratch("_gridGuide", {});

        return node.scratch("_gridGuide");
    };

    snap.snapPos = function (pos) {
        var newPos = {
            x: (Math.floor(pos.x / gridSpacing) + 0.5) * gridSpacing,
            y: (Math.floor(pos.y / gridSpacing) + 0.5) * gridSpacing
        };

        return newPos;
    };

    snap.snapNode = function (node) {

        var pos = node.position();
        var newPos = snap.snapPos(pos);

        node.position(newPos);
    };

    snap.snapNodesTopDown = function (nodes) {
        // getTOpMostNodes -> nodes
        cy.startBatch();
        nodes.union(nodes.descendants()).filter(":childless").positions(function (node, i) {
            if(typeof node === "number") {
              node = i;
            }
            var pos = node.position();
            return snap.snapPos(pos);
        });
        cy.endBatch();
    };

    snap.onFreeNode = function (e) {
        var nodes;
        var cyTarget = e.target || e.cyTarget;
        if (cyTarget.selected())
            nodes = e.cy.$(":selected");
        else
            nodes = cyTarget;

        snap.snapNodesTopDown(nodes);

    };


    snap.recoverSnapNode = function (node) {
        var snapScratch = getScratch(node).snap;
        if (snapScratch) {
            node.position(snapScratch.oldPos);
        }
    };

    return snap;





};
