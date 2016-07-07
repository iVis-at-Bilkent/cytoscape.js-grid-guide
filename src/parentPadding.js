module.exports = function (opts, cy) {

    var options = opts;

    function changeOptions(opts) {
        options = opts;
    }

    function setPaddings() {
        var padding = options.parentSpacing < 0 ? options.gridSpacing : options.parentSpacing;


        cy.style()
            .selector(':parent')
            .style("compound-sizing-wrt-labels", "exclude")
            .style("padding-left", padding)
            .style("padding-right", padding)
            .style("padding-top", padding)
            .style("padding-bottom", padding)
            .update();

    }

    return {
        changeOptions: changeOptions,
        setPaddings: setPaddings
    };
};