var popstructure = [
    "0 to 4",
    "5 to 9",
    "10 to 14",
    "15 to 19",
    "20 to 24",
    "25 to 29",
    "30 to 34",
    "35 to 39",
    "40 to 44",
    "45 to 49",
    "50 to 54",
    "55 to 59",
    "60 to 64",
    "65 to 69",
    "70 to 74",
    "75 to 79",
    "80 to 84",
    "85 to 89",
    "90+"
]

var year = [2020];


    //Initialize global variables
    // Might want to refactor
    var mapdata = [],
        mergeddata = [],
        histogramdata = [],
        district = "",
        districtindex = 113, // Macpherson
        agegroupindex = 0,
        yearindex = 0,
        gender = "male",
        mapVisible = true;

    var mapWidth = $("#map").width(),
        mapHeight = 0.6 * mapWidth;

    $("#map").css("height", mapHeight);
        
    var histogramWidth = $("#histogram").width(),
        legendWidth = 300;

    // Histogram parameters
    var histogramBarHeight = 20,
        histogramCenterWidth = 60,
        histogramSmallestBar = 30;
        
    // Colour domain
    var color_domain = [0, 0.2]

    var color = d3.scale.linear()
        .domain(color_domain)
        .range(["#fff","#00f"]);

    var color2 = d3.scale.linear()
        .domain(color_domain)
        .range(["#fff","#f00"]);
        
    // Add tooltip;
    var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    // var maxBounds = L.latLngBounds(L.latLng(1.479660, 103.584964), L.latLng(1.163888, 104.106943));
    var maxBounds = L.latLngBounds(L.latLng(1.479660, 103.584964), L.latLng(1.238029, 104.068362));
    if ($(window).width() < 768) {
        var leafletMap = L.map('map').setView([1.347833, 103.809357], 11).setMaxBounds(maxBounds);
        $("#map_legend").hide();
    } else {
        var leafletMap = L.map('map').setView([1.347833, 103.809357], 12).setMaxBounds(maxBounds);
        $("#map_legend").show();
    }
    
    var transform = d3.geo.transform({point: projectPoint});
            
    // Assign the projection to a path
    var path = d3.geo.path().projection(transform);
        
    var mapLayer = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=' + accessToken, {
        attribution: 'Map tiles <a href="http://mapbox.com">Mapbox</a> | Map data <a href="http://openstreetmap.org">OpenStreetMap</a> | Visualization <a href="htttp://www.vslashr.com">V/R</a>',
        minZoom: 11,
        maxZoom: 18,
    })
    
    mapLayer.addTo(leafletMap);
        
    // Adding Leaflet layer
    var svg = d3.select(leafletMap.getPanes().overlayPane)
        .append("svg");

    svg.append("g")
        .attr("class", "leaflet-zoom-hide");
      
    d3.select("#histogram").append("svg");
        
    // Load data before drawing
    // New URA map
    queue()
        .defer(d3.json, 'assets/data/sgmap.json')
        .defer(d3.csv, 'assets/data/genderpop2021.csv')
        .await(loadDataThenDraw);

$("#layerControl").click(function() {

    if (mapVisible) {
        leafletMap.removeLayer(mapLayer);
     
        $("#map svg").css("opacity", 1);

        mapVisible = false;
        
    } else {
        leafletMap.addLayer(mapLayer);

        $("#map svg").css("opacity", 0.6);

        mapVisible = true;
    }
});

function projectPoint(x, y) {
  var point = leafletMap.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}
        
function loadDataThenDraw(error, data, data2) {

    mapdata = data;
    population = data2;
    
    for (var i = 0; i < mapdata.features.length; i++){
        
        mapdata.features[i].properties.year = [];
    
        for (var j = 0; j < population.length; j++) {
            if (mapdata.features[i].properties.Name == population[j].Subdistrict.toUpperCase()) {
            
                var obj = population[j];
                var keys = Object.keys(obj);
                                
                var yearobj = {};
                    yearobj.year = 2020;
                    yearobj.histogram = [];
                    
                var maleTotal = 0;
                var femaleTotal = 0;
                
                // Construct populaton pyramid for district
                // Generate normalized values for charting
                for (var k = 0; k < popstructure.length; k++) {
                    var mapobj = {};
                    mapobj.agegroup = "Age " + popstructure[k];
                    
                    var male = {};
                        male.pop = parseInt(obj["Males" + popstructure[k]]);
                        //male.normalized = obj["Males" + popstructure[k]] / obj["MaleTotal"];
                        maleTotal += male.pop;

                        mapobj.male = male;

                    var female = {};
                        female.pop = parseInt(obj["Females" + popstructure[k]]);
                        //female.normalized = obj["Females" + popstructure[k]] / obj["FemaleTotal"];
                        
                        femaleTotal += female.pop;
                        mapobj.female = female;
                    
                    yearobj.histogram.push(mapobj);
                }
                
                yearobj.malepop = maleTotal;
                yearobj.femalepop = femaleTotal;
                yearobj.totalpop = maleTotal + femaleTotal;
                mapdata.features[i].properties.year.push(yearobj);

                // Break this loop cycle as already found and matched data
                continue;
            }
        }
    }

    mergeddata = data.features;
    drawChloropleth();

    // Initialize and draw stuff
    initializeLegend();
    district = mergeddata[districtindex].properties.Name;
    histogramdata = mergeddata[districtindex].properties.year[yearindex].histogram;
        
    $("#district_name").text(district.toProperCase());

    if (mergeddata[districtindex].properties.year[yearindex].totalpop == 0)
        $("#total_pop").text("Total population: No data");
    else
        $("#total_pop").text("Total population: " + d3.format(",")(mergeddata[districtindex].properties.year[yearindex].totalpop));
    
    d3.select("#map svg g").select("path:nth-child(" + (districtindex + 1) + ")").attr("class", "selected");
    
    drawHistogram();
    initializeHistogramPointer();
    
    updateLegend();
    
    leafletMap.on("viewreset", redrawLeafletLayer);
    redrawLeafletLayer();
}

function redrawLeafletLayer() {
    var bounds = path.bounds(mapdata),
        topLeft = bounds[0],
        bottomRight = bounds[1];

    var svg = d3.select(leafletMap.getPanes().overlayPane).select("svg");
        
    svg.attr("width", bottomRight[0] - topLeft[0])
       .attr("height", bottomRight[1] - topLeft[1])
       .style("left", topLeft[0] + "px")
       .style("top", topLeft[1] + "px");
       
    svg.select("g").attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
        
    d3.select("#map svg g").selectAll("path")
       .attr("d", path);
}


function drawChloropleth() {

    var chloropleth = d3.select("#map svg g").selectAll("path");
            
    chloropleth
        .data(mergeddata)
        .enter()
        .append("path")
        .attr("class", "border")
        .attr("d", path)
        .style("fill", function(d) {
            
            if (gender == "male" && d.properties.year[yearindex] != undefined && d.properties.year[yearindex].histogram[agegroupindex].male.pop !== 0) {
                return color(d.properties.year[yearindex].histogram[agegroupindex].male.pop / d.properties.year[yearindex].malepop);
            }
            else if (gender == "female" && d.properties.year[yearindex] != undefined && d.properties.year[yearindex].histogram[agegroupindex].female.pop !== 0) {
                return color2(d.properties.year[yearindex].histogram[agegroupindex].female.pop / d.properties.year[yearindex].femalepop);
            }
            else return "#999";
        })
  
      //Mouseevent handlers
      .on("mouseover", function(d) {
        if (d3.select(this).attr("class") != "selected") {
            d3.select(this)
            .attr("class", "border highlight");
        }
    
        tooltip
          .style("opacity", 1);
        
        tooltip.text(d.properties.Name.toProperCase())
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY -30) + "px");
          
      })

      .on("mouseout", function() {
        if (d3.select(this).attr("class") != "selected") {
            d3.select(this)
            .attr("class", "border");
        }
        
        tooltip
        .style("opacity", 0);
      })

      .on("click", function(d, i) {

        d3.select("#map svg g").selectAll("path").attr("class", "border");
      
        d3.select(this)
        .attr("class", "selected");
        
        district = d.properties.Name;
        districtindex = i;
        
        $("#district_name").text(district.toProperCase());
        
        if (d.properties.year[yearindex] != undefined) {
            histogramdata = d.properties.year[yearindex].histogram;

            if (d.properties.year[yearindex].totalpop == 0) {
                $("#total_pop").text("Total population: No data");
            } else {
                $("#total_pop").text("Total population: " + d3.format(",")(d.properties.year[yearindex].totalpop));
            }
        } else {
            console.log("District name does not appear in URA subzone 2019.");
            
            //179 is PLAB - empty histogram district
            histogramdata = mergeddata[179].properties.year[yearindex].histogram;
            
            $("#total_pop").text("Total population: No data");
        }
        
        drawHistogram();
        updateLegend();
      });
      
    // On update data
       chloropleth
          .transition()
          .duration(300)
          .style("fill", function(d) {
              
            if (gender == "male" && d.properties.year[yearindex] != undefined && d.properties.year[yearindex].histogram[agegroupindex].male.pop !== 0) {
                return color(d.properties.year[yearindex].histogram[agegroupindex].male.pop / d.properties.year[yearindex].malepop);
            }
            else if (gender == "female" && d.properties.year[yearindex] != undefined && d.properties.year[yearindex].histogram[agegroupindex].female.pop !== 0) {
                return color2(d.properties.year[yearindex].histogram[agegroupindex].female.pop / d.properties.year[yearindex].femalepop);
            }
            else return "#999";
            
          })
      
    // On exit data
    chloropleth.data(mergeddata).exit().remove();

}

function drawHistogram() {
        
    //Initialize histogram
    d3.select("#histogram svg")
      .attr("width", histogramWidth)
      .attr("height", histogramBarHeight * popstructure.length);
      
    var x = d3.scale.linear()
        .domain([0, d3.max(histogramdata, function(d) { return Math.max(d.male.pop, d.female.pop); })])
        .range([0, histogramWidth /2 - histogramCenterWidth]);

    var histogrambars = d3.select("#histogram svg")
        .selectAll("g");
        
    // On enter data
    var bar = histogrambars
      .data(histogramdata)
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + (18 - i) * histogramBarHeight + ")"; });

      // Create centre age row column
    bar.append("text")
      .attr("class", "agerow")
      .attr("x", histogramWidth / 2 - histogramCenterWidth /2)
      .attr("y", histogramBarHeight / 2)
      .attr("dy", ".35em")
      .text(function(d) { return d.agegroup; })

      .on("mouseover", function() {
        d3.select(this)
        .transition().duration(300)
        .attr("class", "agerow selected");
      })
      
      .on("mouseout", function() {
        d3.select(this)
        .transition().duration(300)
        .attr("class", "agerow");
      })

    .on("click", function(d, i) {
        agegroupindex = i;
        updateHistogramPointer();
        drawChloropleth();
        updateLegend();
    });
      
    // Male histogram
    bar.append("rect")
      .attr("class", "male")
      .attr("x", function(d) { return histogramWidth/2 + histogramCenterWidth; })
      .attr("width", function(d) { if (d.male.pop != undefined){ return x(d.male.pop);} })
      .attr("height", histogramBarHeight - 1)

    // Mouseevent handlers
      .on("mouseover", function() {
        d3.select(this)
        .transition().duration(300)
        .attr("class", "male selected");
      })
      
      .on("mouseout", function() {
        d3.select(this)
        .transition().duration(300)
        .attr("class", "male");
      })

    .on("click", function(d, i) {
        gender = "male";
        agegroupindex = i;
        updateHistogramPointer();
        drawChloropleth();
        updateLegend();
    });
      
    bar.append("text")
      .attr("class", "male-value")
      .attr("x", function(d) { if (d.male.pop != undefined){return histogramWidth/2 + x(d.male.pop) + histogramCenterWidth;} })
      .attr("y", histogramBarHeight / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { if (x(d.male.pop) >= histogramSmallestBar) { return "end"} else {return "start"}; })
      .text(function(d) { if (d.male.pop != undefined || d.male.pop == 0){ return d3.format(",")(d.male.pop);} else {return "No data";}});
      
    // Female histogram
    bar.append("rect")
      .attr("class", "female")
      .attr("x", function(d) { if (d.female.pop != undefined){ return histogramWidth/2 - x(d.female.pop) - histogramCenterWidth;} })
      .attr("width", function(d) { if (d.female.pop != undefined){ return x(d.female.pop); } })
      .attr("height", histogramBarHeight - 1)

      .on("mouseover", function() {
        d3.select(this)
        .transition().duration(300)
        .attr("class", "female selected");
      })
      
      .on("mouseout", function() {
        d3.select(this)
        .transition().duration(300)
        .attr("class", "female");
      })

    .on("click", function(d, i) {
        gender = "female";
        agegroupindex = i;
        updateHistogramPointer();
        drawChloropleth();
        updateLegend();
    });
            
    bar.append("text")
      .attr("class", "female-value")
      .attr("x", function(d) { if (d.female.pop != undefined){ return histogramWidth/2 - x(d.female.pop) - histogramCenterWidth;} })
      .attr("y", histogramBarHeight / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { if (x(d.female.pop) >= histogramSmallestBar) { return "start"} else {return "end"}; })
      .text(function(d) { if (d.female.pop != undefined){ return d3.format(",")(d.female.pop); } });

  
    // On update data
    histogrambars.select(".agerow")
        .transition()
        .duration(300)
        .attr("x", histogramWidth / 2 - histogramCenterWidth /2)
        .attr("y", histogramBarHeight / 2)
        .attr("dy", ".35em")
        .text(function(d) { return d.agegroup; });
    
    // Male histogram
    histogrambars.select(".male")
        .transition()
        .duration(300)
        .attr("x", function(d) { return histogramWidth/2 + histogramCenterWidth; })
        .attr("width", function(d) { if (d.male.pop != undefined){ return x(d.male.pop);} })
        .attr("height", histogramBarHeight - 1);

    histogrambars.select(".male-value")
        .transition()
        .duration(300)
        .attr("x", function(d) { if (d.male.pop != undefined){ return histogramWidth/2 + x(d.male.pop) + histogramCenterWidth;} } )
        .attr("y", histogramBarHeight / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { if (x(d.male.pop) >= histogramSmallestBar) { return "end"} else {return "start"}; })
        .text(function(d) { if (d.male.pop != undefined){ return d3.format(",")(d.male.pop);} else return "N.A"; });

    // Female histogram
    histogrambars.select(".female")
        .transition()
        .duration(300)
        .attr("x", function(d) { if (d.female.pop != undefined){ return histogramWidth/2 - x(d.female.pop) - histogramCenterWidth;} })
        .attr("width", function(d) { if (d.female.pop != undefined){ return x(d.female.pop); } })
        .attr("height", histogramBarHeight - 1);
            
    histogrambars.select(".female-value")
        .transition()
        .duration(300)
        .attr("x", function(d) { if (d.female.pop != undefined){ return histogramWidth/2 - x(d.female.pop) - histogramCenterWidth;} })
        .attr("y", histogramBarHeight / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { if (x(d.female.pop) >= histogramSmallestBar) { return "start"} else {return "end"}; })
        .text(function(d) { if (d.female.pop != undefined){ return d3.format(",")(d.female.pop); }  else return "N.A"; });
        
    //on exit data
    histogrambars.data(histogramdata).exit().remove();
    
}

function updateHistogramPointer() {
    var histogramPointer = d3.select("#histogram svg #histogram_pointer")
        .transition()
        .duration(500)
        .attr("transform", function(d) { 
                if (gender == "male"){
                    return "translate(" + (histogramWidth/2 + 50) + "," + ((18 - agegroupindex) * histogramBarHeight + 10) + ") rotate(90)";
                } else {
                    return "translate(" + (histogramWidth/2 - 50) + "," + ((18 - agegroupindex) * histogramBarHeight + 10) + ") rotate(-90)";
                }
            })
        .attr("class", function(d){
                if (gender == "male"){ 
                    return "male";
                } else { 
                    return "female"; 
                }
            })
        .style("opacity", "1");
}

function initializeHistogramPointer() {
    var histogramPointer = d3.select("#histogram svg")
        .append("path")
        .attr("id", "histogram_pointer")
        .attr("d", d3.svg.symbol()
                 .size(150)
                 .type("triangle-up"))
        .attr("transform", function(d) { 
                if (gender == "male"){
                    return "translate(" + (histogramWidth/2 + 50) + "," + ((18 - agegroupindex) * histogramBarHeight + 10) + ") rotate(90)";
                } else {
                    return "translate(" + (histogramWidth/2 - 50) + "," + ((18 - agegroupindex) * histogramBarHeight + 10) + ") rotate(-90)";
                }
            })
        .attr("class", function(d){
                if (gender == "male"){ 
                    return "male";
                } else { 
                    return "female"; 
                }
            })
        .style("opacity", "1");
}

function initializeLegend() {
    var svg = d3.select("#map_legend").append("svg")
        .attr("width", legendWidth)
        .attr("height", 70);
    
    var defs = svg.append('defs');
    
    var gradient = defs.append('linearGradient')
        .attr('id', 'gradientBar')
        .attr('x1', '0')
        .attr('x2', '1')
        .attr('y1', '0')
        .attr('y2', '0');
    
    gradient.append('stop')
        .attr('id', 'gradientStop1')
        .attr('stop-color', color(color_domain[0]))
        .attr('offset', '0%');

    gradient.append('stop')
        .attr('id', 'gradientStop2')
        .attr('stop-color', color(color_domain[1]))
        .attr('offset', '100%' );
        
    svg.append("rect")
        .attr("class", "gradientBar")
        .attr("x", 0)
        .attr("y", 15)
        .attr("width", legendWidth)
        .attr("transform", "translate(15, 0)")
        .attr("height", 20)
        .attr("fill", "url(#gradientBar)");

    svg.append("text")
        .attr("x", 0)
        .attr("y", 30)
        .attr("text-anchor", "start")
        .style("fill", "#000")
        .text(color_domain[0] * 100 + "%");

    svg.append("text")
        .attr("x", legendWidth)
        .attr("y", 30)
        .attr("text-anchor", "end")
        .style("fill", "#fff")
        .text(color_domain[1] * 100 + "%");
        
    svg.append("path")
        .attr("id", "legend_pointer")
        .attr("d", d3.svg.symbol()
                 .size(150)
                 .type("triangle-up"))
        .style("opacity", "0");
        
    svg.append("text")
        .attr("id", "legend_percentage")
        .attr("text-anchor", "middle")
        .style("opacity", "0");
}

function updateLegend() {

    var real_value, normalized_value, gendertext;

    if (gender == "male" && mergeddata[districtindex].properties.year[yearindex] != undefined) {
        real_value = histogramdata[agegroupindex].male.pop;
        normalized_value = histogramdata[agegroupindex].male.pop / mergeddata[districtindex].properties.year[yearindex].malepop;
        gendertext = " <span class='male_text'>Males(<i class='fa fa-male'></i>)</span>";

        d3.select("#map_legend #gradientBar #gradientStop1")
            .attr('stop-color', color(color_domain[0]));

        d3.select("#map_legend #gradientBar #gradientStop2")
            .attr('stop-color', color(color_domain[1]));
        
    } else if (gender == "female" && mergeddata[districtindex].properties.year[yearindex] != undefined) {
        real_value = histogramdata[agegroupindex].female.pop;
        normalized_value = histogramdata[agegroupindex].female.pop / mergeddata[districtindex].properties.year[yearindex].femalepop;
        gendertext = " <span class='female_text'>Females(<i class='fa fa-female'></i>)</span>";
        
        d3.select("#map_legend #gradientBar #gradientStop1")
            .attr('stop-color', color2(color_domain[0]));

        d3.select("#map_legend #gradientBar #gradientStop2")
            .attr('stop-color', color2(color_domain[1]));
    } 

    var pointer = d3.select("#map_legend #legend_pointer");
    var legendPercentage = d3.select("#map_legend #legend_percentage");
        
    if (!isNaN(normalized_value)) {
        var legendx = d3.scale.linear()
            .domain(color_domain)
            .range([0, legendWidth]);

        pointer
            .transition()
            .duration(300)
            .attr("transform", function(d) { 
                    if (normalized_value >= color_domain[1]) {
                        return "translate(" + (legendx(color_domain[1]) - 10)+ ", 55) rotate(90)";
                    }
                    else return "translate(" + legendx(normalized_value) + ", 45)";
                })
            .style("opacity", 1)
            .style("fill", function(d){
                    if (gender == "male"){ return color(normalized_value);} 
                    else { return color2(normalized_value); }
                });

        legendPercentage
            .transition()
            .duration(300)
            .attr("transform", function(d) { 
                    if (normalized_value >= color_domain[1]) {
                        return "translate(" + (legendx(color_domain[1]) - 40)+ ", 60)";
                    }
                    else return "translate(" + legendx(normalized_value) + ", 65)";
                })
            .style("opacity", "1")
            .text(d3.format(".2f")(normalized_value * 100) + "%");
            
        $("#histogram_description").html(
            d3.format(",")(real_value)
            + " (<b>" + d3.format(".2f")(normalized_value * 100) + "%</b>) of " 
            + "<b>" + district.toProperCase() + "</b>"
            + gendertext 
            + " are <b>aged " + popstructure[agegroupindex] + "</b>"
        );
            
        $("#map_legend_text").html(
            d3.format(",")(real_value)
            + " (<b>" + d3.format(".2f")(normalized_value * 100) + "%</b>) of " 
            + "<b>" + district.toProperCase() + "</b>"
        );
        
        $("#map_legend_district").html(
            gendertext 
            + " are <b>aged " + popstructure[agegroupindex] + "</b>"
        );

        var femalepop = mergeddata[districtindex].properties.year[yearindex].femalepop;
        var malepop = mergeddata[districtindex].properties.year[yearindex].malepop
        var totalpop = mergeddata[districtindex].properties.year[yearindex].totalpop

        $("#female_icon").html("<i class='fa fa-female'></i> (" + d3.format(".2f")(femalepop / totalpop * 100) + "%)</span>");
        $("#male_icon").html("<i class='fa fa-male'></i> (" + d3.format(".2f")(malepop / totalpop * 100) + "%)</span>");
        
    } else {
    
        pointer
            .transition()
            .duration(300)
            .style("opacity", "0");
        
        legendPercentage
            .transition()
            .duration(300)
            .style("opacity", "0");
        
            $("#histogram_description").text("Population data not available.");
            
        $("#map_legend_text").html(
            "<b>" + district.toProperCase() + "</b>"
        );
        
        $("#map_legend_district").html("");
        $("#female_icon").html("<i class='fa fa-female'></i></span>");
        $("#male_icon").html("<i class='fa fa-male'></i></span>");
        
    }
    
}

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

$("#male_icon").click(function() {
    gender = "male";
    updateHistogramPointer();
    drawChloropleth();
    updateLegend();
});

$("#female_icon").click(function() {
    gender = "female";
    updateHistogramPointer();
    drawChloropleth();
    updateLegend();
});

$("#yearControl button").on("click", function(event) {
    $("button").removeClass("btn-danger");
    $(this).addClass("btn-danger");
    
    yearindex = year.indexOf($(this).data('year'));
        
    district = mergeddata[districtindex].properties.description;
    console.log(mergeddata[districtindex].properties.year[yearindex]);
    histogramdata = mergeddata[districtindex].properties.year[yearindex].histogram;

    $("#district_name").text(district.toProperCase());
    if (mergeddata[districtindex].properties.year[yearindex].totalpop == 0)
        $("#total_pop").text("Total population: No data");
    else
        $("#total_pop").text("Total population: " + mergeddata[districtindex].properties.year[yearindex].totalpop);
    
    updateHistogramPointer();
    drawChloropleth();
    drawHistogram();
    updateLegend();

});

$( window ).resize(function() {
    mapWidth = $("#map").width();
    mapHeight = 0.6 * mapWidth;
    
    $("#map").css("height", mapHeight);
    
    histogramWidth = $("#histogram").width();
    drawHistogram();
    
    if ($(window).width() < 768) {
        $("#map_legend").hide();
    } else {
        $("#map_legend").show();
    }    
    
    updateLegend();
    updateHistogramPointer();
    
});
