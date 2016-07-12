module.exports = function (cy, snap) {

    var discreteDrag = { };

    var attachedNode;
    var draggedNodes;

    var startPos;
    var endPos;


    discreteDrag.onTapStartNode = function(e) {
        if (e.cyTarget.selected())
            draggedNodes = e.cy.$(":selected");
        else
            draggedNodes = e.cyTarget;

        startPos = e.cyPosition;

        attachedNode = e.cyTarget;
        attachedNode.lock();
        attachedNode.trigger("grab");
        cy.on("tapdrag", onTapDrag);
        cy.on("tapend", onTapEndNode);

    };

    var onTapEndNode = function (e) {
        //attachedNode.trigger("free");
        cy.off("tapdrag", onTapDrag);
        cy.off("tapend", onTapEndNode);
        attachedNode.unlock();
    };

    var getDist = function () {
        return {
            x: endPos.x - startPos.x,
            y: endPos.y - startPos.y
        }
    };

    function getTopMostNodes(nodes) {
        var nodesMap = {};

        for (var i = 0; i < nodes.length; i++) {
            nodesMap[nodes[i].id()] = true;
        }

        var roots = nodes.filter(function (i, ele) {
            var parent = ele.parent()[0];
            while(parent != null){
                if(nodesMap[parent.id()]){
                    return false;
                }
                parent = parent.parent()[0];
            }
            return true;
        });

        return roots;
    }

    var moveNodesTopDown = function (nodes, dx, dy) {

        for (var i = 0; i < nodes.length; i++){
            var node = nodes[i];
            var pos = node.position();

            node.position({
                x: pos.x + dx,
                y: pos.y + dy
            });

            moveNodesTopDown(nodes.children(), dx, dy);
        }

    };

    onTapDrag = function (e) {

        var nodePos = attachedNode.position();
        endPos = e.cyPosition;
        endPos = snap.snapPos(endPos);
        if (nodePos.x != endPos.x || nodePos.y != endPos.y){
            attachedNode.unlock();
            var dist = getDist();
            var topMostNodes = getTopMostNodes(draggedNodes);
            moveNodesTopDown(topMostNodes, dist.x, dist.y);
            snap.snapNodesTopDown(topMostNodes);
            startPos = endPos;
            attachedNode.lock();
            attachedNode.trigger("drag");
        }

    };







    return discreteDrag;

    

};