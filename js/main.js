/* Map of GeoJSON data from eu_country_nuclear_pct_no_nulls.geojson */

var map;

// setting an arbitrary minimum value because of -1 and 0 in dataset, a threshold
// for prop symbols is being used anyway, so this is just for scaling purposes
var minValue = 3;
var threshold = 5;
var dataStats = {};  
//constant factor adjusts symbol sizes evenly
var minRadius = 5;


// PopupContent constructor function
function PopupContent(properties, attribute){
    this.properties = properties;
    this.attribute = attribute;
    this.year = attribute.split("_")[1];
    this.country = this.properties.Country;

    //used to print % if data is a number, nothing if it's 'no data'
    var printPct = '%';

    // handling attribute data of -1 (no data)
    if(properties[attribute] === -1){
        this.percentage = "No data <b>:(</b>";
        printPct = '';
    }else {
        this.percentage = properties[attribute];
        printPct = '%';
    }

    this.formatted = "<p><b>Country: </b>" + this.properties.Country + "</p><p><b>Percent in " 
    + this.year + ":</b> " + this.percentage + printPct + "</p>";
}


// Create the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [52, 7],
        zoom: 3,
        minZoom: 3,
        maxZoom: 6
    });

    // set bounds of the map
    map.setMaxBounds(map.getBounds());
    
    //add OSM base tilelayer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    //call getData function
    getData();
};


function calcStats(data){
    // array to store all data values that are not -1 or 0
    var allValuesFiltered = []; 

    //loop through each city
    for(var country of data.features){
        //loop through each year
        for(var year = 1965; year <= 2022; year+=1){
            //get percentage for current year
            var value = country.properties["pct_"+ String(year)];
            
            // if valid value, push to filtered array
            if(value != 0 && value != -1){
                allValuesFiltered.push(value);
            }            
        }
    }

    //get min, max, mean stats for our array
    // this math works backwards from flannery appearance compensation formula and the set threshold
    dataStats.min = Math.pow(threshold/minRadius/1.0083, 1/0.5715) * minValue;

    dataStats.max = Math.max(...allValuesFiltered);

    //calculate meanValue
    var sum = allValuesFiltered.reduce(function(a, b){return a+b;});
    dataStats.mean = sum/ allValuesFiltered.length;
}    


//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    
    if(attValue === -1) {
        return threshold;
    }
    else if(attValue === 0){
        return threshold;
    }
    else {
        //Flannery Appearance Compensation formula
        var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius;

        //setting minimum threshold for prop symbols w/ radius < 5
        if(radius < 5){
            radius = threshold;
        }
    }

    return radius;
};


// Attach pop-ups to each mapped feature
function pointToLayer(feature, latlng, attributes){
    
    // attribute for scaling the proportional symbols
    var attribute = attributes[0];

    // create marker options
    var options = {
        radius: 8,
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    var attValue = Number(feature.properties[attribute]);

    // recolor prop symbols based on no data (-1), 0, or valid data
    switch(attValue) {
        case -1:
            options.fillColor = "gray";
            break;
        case 0:
            options.fillColor = "#4872b5";
            break;
        default:
            options.fillColor = "gold";
    }

    // give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    
    // create popup content
    var popupContent = new PopupContent(feature.properties, attribute);
    
    // bind the pop-up to the circle marker 
    layer.bindPopup(popupContent.formatted, {
        offset: new L.Point(0,-options.radius)
    });

    return layer;
};


function createPropSymbols(data, attr){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature,latlng){
            return pointToLayer(feature,latlng, attr);
        }
    }).addTo(map);
}


// Load data asyncronously and convert to json
async function getData(){
    await fetch("data/eu_country_nuclear_pct_no_nulls.geojson")
        .then((response) => {
            return response.json();
        }).then((json) => {
            var attributes = processData(json);
            calcStats(json);
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
            createLegend(attributes);
        });
};


// Resize, recolor, and set pop-ups for proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if(layer.feature){
            // access feature properties
            var props = layer.feature.properties;

            // update each feature's radius based on new attribute values
            layer.setRadius(calcPropRadius(props[attribute]));

            // update feature color based on attribute data
            switch(props[attribute]) {
                case -1:
                    layer.setStyle({fillColor: 'gray'});
                    break;
                case 0:
                    layer.setStyle({fillColor: '#4872b5'});
                    break;
                default:
                    layer.setStyle({fillColor: 'gold'});
            }
            
            // create popup content
            var popupContent = new PopupContent(props, attribute);

            //update popup content            
            popup = layer.getPopup();            
            popup.setContent(popupContent.formatted).update();
        }
    });
};


// Create an array of the attributes to keep track of their order (for the slider)
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("pct") > -1){
            attributes.push(attribute);
        };
    };


    return attributes;
};


//Create new sequence controls
function createSequenceControls(attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
            
            //add skip buttons
            container.insertAdjacentHTML('beforeend', 
            '<button class="step" id="reverse" title="Reverse"><img src="img/reverse.png"></button>'); 
            container.insertAdjacentHTML('beforeend', 
            '<button class="step" id="forward" title="Forward"><img src="img/forward.png"></button>');
            
            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());    // add listeners after adding control


    // storing min and max values of slider for readability and to use for listeners
    var sliderMin = attributes[0].split("_")[1]
    var sliderMax = attributes[attributes.length-1].split("_")[1];

    //set slider attributes
    document.querySelector(".range-slider").max = sliderMax;
    document.querySelector(".range-slider").min = sliderMin;
    document.querySelector(".range-slider").value = sliderMin;
    document.querySelector(".range-slider").step = 1;


    // Create listeners for slider bar and buttons

    // click forward/reverse buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;

            //increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                // if past the last attribute, wrap around to first attribute
                index = index > sliderMax ? sliderMin : index;
            } else if (step.id == 'reverse'){
                index--;
                // if past the first attribute, wrap around to last attribute
                index = index < sliderMin ? sliderMax : index;
            };

            // update slider
            document.querySelector('.range-slider').value = index;

            // update prop symbols with new index value
            updatePropSymbols("pct_" + index);

            //update temporal legend
            document.querySelector("span.year").innerHTML = index;
        })
    })

    // slide slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        var index = this.value;

        // update prop symbols with new index value
        updatePropSymbols("pct_" + index);

        //update temporal legend
        document.querySelector("span.year").innerHTML = index;
    })
}


function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            var year = attributes[0].split("_")[1];
            container.innerHTML = '<p class="temporal-legend"><b>Nuclear Energy Production in <span class="year">' 
            + year + '</b></span></p>';
            
            // Add an <svg> element to the legend
            var svg = '<svg id="attribute-legend" width="160px" height="60px">';

            //array of circle names to base loop on
            var circles = ["max", "mean", "min"];

            // add each circle and text to svg string
            for (var i=0; i<circles.length; i++){
                // assign the r and cy attributes  
                var radius = calcPropRadius(dataStats[circles[i]]);  
                var cy = 59 - radius;
                
                // circle string  
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' 
                + radius + '"cy="' + cy 
                + '" fill="gold" fill-opacity="0.8" stroke="#000000" cx="45"/>';

                //evenly space labels            
                var textY = i * 20 + 20;            

                //text string            
                svg += '<text id="' + circles[i] + '-text" x="80" y="' + textY + '">'
                + Math.round(dataStats[circles[i]]*100)/100 + "%" + '</text>';
            };

            // close svg string
            svg += "</svg>";

            // add circles for '0' and 'no data'
            // '0%' symbol and string
            var cy = 10;//spacing of elements
            svg += '<svg id="attribute-legend" width="160px" height="30px"><circle class="legend-circle" id="zero" r="' 
                + threshold + '"cy="' + (cy+10) + '" fill="#4872b5" fill-opacity="0.8" stroke="#ffffff" cx="45"/>';      
            svg += '<text id=zero-text" x="65" y="'+ (cy+14) + '">'
            + "0%" + '</text></svg>';

            // no data symbol and string
            svg += '<svg id="attribute-legend" width="160px" height="20px"><circle class="legend-circle" id="no-data" r="' 
                + threshold + '"cy="' + cy + '" fill="gray" fill-opacity="0.8" stroke="#ffffff" cx="45"/>';       
            svg += '<text id=zero-text" x="65" y="'+ (cy+4) + '">'
            + "No Data" + '</text></svg>';
         
            // add attribute legend svg to container
            container.insertAdjacentHTML('beforeend',svg);

            return container;
        }
    });

    map.addControl(new LegendControl());
};


document.addEventListener('DOMContentLoaded',createMap);
