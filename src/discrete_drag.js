module.exports = function (cy, snap) {

    var attachedNode;

    function moveTopDown(children, dx, dy) {
        for(var i = 0; i < children.length; i++){
            var child = children[i];
            child.position({
                x: child.position('x') + dx,
                y: child.position('y') + dy
            });
            snap.snapNode(child);

            moveTopDown(child.children(), dx, dy);
        }
    }

    function tapDrag(e) {
        var nodePos = attachedNode.position();
        var mousePos = snap.snapPos(e.cyPosition);
        if (nodePos.x != mousePos.x || nodePos.y != mousePos.y){
            attachedNode.unlock();
            moveTopDown(attachedNode, mousePos.x - nodePos.x, mousePos.y - nodePos.y);
            //snap.snapNode(attachedNode, mousePos);
            attachedNode.lock();
            attachedNode.trigger("drag");
        }
    }

    function tapStartNode(e){
        attachedNode = e.cyTarget;
        attachedNode.lock();
        attachedNode.trigger("grab");
        cy.on("tapdrag", tapDrag);
        cy.on("tapend", tapEnd);
    }

    function tapEnd(e){
        attachedNode.unlock();
        attachedNode.trigger("free");
        cy.off("tapdrag", tapDrag);
        cy.off("tapend", tapEnd);
    }

    return {
        tapStartNode: tapStartNode
    };
    

};