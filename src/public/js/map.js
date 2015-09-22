(function(window) {
  var d3 = window.d3 || {};
  var topojson = window.topojson || {};
  var mapContainer = document.querySelector('.map-container');
  var containerWidth = mapContainer.clientWidth;
  var width = 938;
  var height = 500;
  var active = d3.select(null);

  var color = d3.scale.ordinal()
    .range(['#2196F3', '#E53935', '#43A047']);

  var projection = d3.geo.miller()
    .scale(160)
    .translate([width / 2, height / 1.5]);

  var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .center([width / 2, height / 2])
    .scaleExtent([1, 8])
    .size([width, height])
    .on('zoom', zoomed);

  var path = d3.geo.path()
    .projection(projection);

  var svg = d3.select('.map-container').append('svg')
    .attr('preserveAspectRatio', 'xMidYMid')
    .attr('viewBox', '0 0 ' + width + ' ' + height)
    .attr('width', containerWidth)
    .attr('height', containerWidth * height / width)
    .on('click', stopped, true);

  svg.append('rect')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height)
    .on('click', reset);

  var g = svg.append('g');

  d3.selectAll('button[data-zoom]')
    .on('click', buttonClicked);

  d3.select('button[data-reset]')
    .on('click', reset);

  svg
    .call(zoom) // delete this line to disable free zooming
    .call(zoom.event);

  // async load the topojson map data then build the map
  d3.json('/public/data/countries-topo.json', function(error, world) {
    if (error) {
      return console.error(error);
    }

    var countryData = topojson.feature(world, world.objects.countries).features;

    g.append('g')
      .attr('id', 'countries')
      .selectAll('path')
      .data(countryData)
      .enter()
      .append('path')
      .attr('id', function(d) { return d.id; })
      .attr('class', function(d) { return 'country code ' + d.id; })
      .attr('d', path)
      .on('click', countryClicked)
      .transition()
      .duration(0)
      .delay(function(d, i) { return i * 5; })
      .each(pulse);
  });

  function pulse() {
    var country = d3.select(this);
    country = country.transition()
        .duration(2000)
        .style('fill', color(Math.random() * 5 || 0));
  }

  function buttonClicked() {

    svg.call(zoom.event); // https://github.com/mbostock/d3/issues/2387

    // Record the coordinates (in data space) of the center (in screen space).
    var center0 = zoom.center();
    var translate0 = zoom.translate();
    var coordinates0 = coordinates(center0);
    zoom.scale(zoom.scale() * Math.pow(2, +this.getAttribute('data-zoom')));

    // Translate back to the center.
    var center1 = point(coordinates0);
    zoom.translate([translate0[0] + center0[0] - center1[0], translate0[1] + center0[1] - center1[1]]);

    svg.transition().duration(750).call(zoom.event);
  }

  function coordinates(point) {
    var scale = zoom.scale();
    var translate = zoom.translate();
    return [(point[0] - translate[0]) / scale, (point[1] - translate[1]) / scale];
  }

  function point(coordinates) {
    var scale = zoom.scale();
    var translate = zoom.translate();
    return [coordinates[0] * scale + translate[0], coordinates[1] * scale + translate[1]];
  }

  function countryClicked(d) {
    // if you click on an active country, reset the view
    if (active.node() === this) {
      return reset();
    }

    // remove active class from any element that has active class
    active.classed('active', false);
    // add active class to the current element
    active = d3.select(this).classed('active', true);
    // get the bounds of the active path
    var bounds = path.bounds(d);
    var dx = bounds[1][0] - bounds[0][0];
    var dy = bounds[1][1] - bounds[0][1];
    var x = (bounds[0][0] + bounds[1][0]) / 2;
    var y = (bounds[0][1] + bounds[1][1]) / 2;
    var scale = 0.9 / Math.max(dx / width, dy / height);
    var translate = [width / 2 - scale * x, height / 2 - scale * y];

    svg.transition()
      .duration(750)
      .call(zoom.translate(translate).scale(scale).event);
  }

  function reset() {
    // remove active class from any element with active class
    active.classed('active', false);
    // set active to null
    active = d3.select(null);

    svg.transition()
      .duration(750)
      .call(zoom.translate([0, 0]).scale(1).event);
  }

  function zoomed() {
    console.log('zoomed');
    g.style('stroke-width', 1.5 / d3.event.scale + 'px');
    g.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
  }

  function stopped() {
    if (d3.event.defaultPrevented) {
      d3.event.stopPropagation();
    }
  }

  window.addEventListener('resize', function() {
    var w = mapContainer.clientWidth;
    svg.attr('width', w);
    svg.attr('height', w * height / width);
  });
}(window));
