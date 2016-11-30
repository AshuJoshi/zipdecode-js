// Display: configurable parameters (see also HTML)
var width = 1200, height = 600;
var instructions = "";

// Display: geographic projection
// var proj = d3.geo.albersUsa().scale(1200)
var proj = d3.geoAlbersUsa().scale(1200)
    .translate([width / 2, height / 2]);
// var path = d3.geo.path().projection(proj);
var path = d3.geoPath().projection(proj);

// Interaction: stored state
var selectedZip = "";

// Display: AJAX load the data files, then call render()
queue()
    .defer(d3.json, "us-states.geojson")
    .defer(d3.tsv, "zips.tsv")
    .await(render);

// Interaction: handle keyboard input
function key() {
    var code = d3.event.keyCode;

    if (code == 32) {
        // Space: clear code
        updateSelection("");
    } else if (code == 37 || code == 8) {
        // Backspace / left arrow: remove one number
        if (selectedZip.length > 0) {
            updateSelection(selectedZip.substr(0, selectedZip.length - 1));
        }
        // Prevent the browser from going back in the URL history
        d3.event.preventDefault();
    } else if (code >= 48 && code <= 57) {
        // number keys
        appendToSelection(String.fromCharCode(code))
    } else if (code >= 96 && code <= 105) {
        // numeric keypad
        appendToSelection(String.fromCharCode(code-48));
    }
};

// Interaction: add a single digit to the zip if possible
function appendToSelection(digit) {
    if (selectedZip.length < 5) {
        updateSelection(selectedZip + "" + digit);
    }
}

// Data: is the given zip code in the selection?
function zipSelected(zip) {
    var l = selectedZip.length;
    return l > 0 && zip.substr(0, l) == selectedZip;
}

// Interaction: update the selected zip code
function updateSelection(n) {
    selectedZip = n;
    var l = selectedZip.length;

    // Set the text label
    var t = l > 0 ? selectedZip : instructions;
    d3.select("#selected").text(t);

    var start = Date.now();

    // Recolor all the zip dots. Sadly this is slow, a transition won't work
    d3.select("#zipdots").selectAll("rect")
        .attr("class", function(d) { return zipSelected(d.zip) ? "selected" : "unselected" });

    console.log("Update dots: " + (Date.now() - start) + "ms");
}

// Display: create the SVG, draw the map
function render(error, states, zips) {
    // Display: the main SVG container
    var svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Interaction: text box displaying the selection
    svg.append("text").attr("id", "selected")
        .text(instructions)
        .attr("x", 20).attr("y", 50);

    // Display: state outlines
    svg.append("g").attr("id", "states");
    d3.select("#states").selectAll("path")
        .data(states.features)
      .enter().append("path")
        .attr("d", path);

    var start = Date.now();

    // Display: all the dots for zip code centroids
    svg.append("g").attr("id", "zipdots");
    d3.select("#zipdots").selectAll("rect")
        .data(zips)
      .enter().append("rect")
        .attr("x", function(d) { var p = proj([d.lon, d.lat]); return p ? p[0] : null; })
        .attr("y", function(d) { var p = proj([d.lon, d.lat]); return p ? p[1] : null; })
        .attr("class", "unselected")
        .attr("width", 1).attr("height", 1);

    console.log("Draw dots: " + (Date.now() - start) + "ms");

    // Interaction: handle keyboard events (keydown to capture backspace)
    d3.select("body").on("keydown", key);
}
