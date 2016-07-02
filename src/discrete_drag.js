module.exports = function (options, cy, snap) {

    enable();


    var attachedNode;

    function tapDrag(e) {
        var nodePos = snap.snapPos(attachedNode.position());
        var mousePos = snap.snapPos(e.cyPosition);
        if (nodePos.x != mousePos.x || nodePos.y != mousePos.y){
            attachedNode.unlock();
            snap.snapNode(attachedNode, mousePos);
            attachedNode.lock();
        }
    }

    function tapStartNode(e){
        attachedNode = e.cyTarget;
        attachedNode.lock();
        cy.on("tapdrag", tapDrag);
        cy.on("tapend", tapEnd);
    }

    function tapEnd(e){
        attachedNode.unlock();
        cy.off("tapdrag", tapDrag);
        cy.off("tapend", tapEnd);
    }


    function enable() {
        cy.on("tapstart", "node", tapStartNode);
    }
    

};