// STILL NEED TO IMPLEMENT A THRESHOLD FOR SCALING, RIGHT NOW SOME SYMBOLS GET WAY TOO SMALL

/* Map of GeoJSON data from eu_country_nuclear_pct.geojson */
//declare map var in global scope
var map;
var minValue = 1;


// PopupContent constructor function
function PopupContent(properties, attribute){
    this.properties = properties;
    this.attribute = attribute;
    this.year = attribute.split("_")[1];

    // handling attribute data of -1 (no data)
    if(properties[attribute] === -1){
        this.percentage = "No data <b>:(</b>";
    }else {
        this.percentage = properties[attribute];
    }

    this.formatted = "<p><b>Country: </b>" + this.properties.Country + "</p><p><b>Percent in " 
    + this.year + ":</b> " + this.percentage + "%</p>";
}


// Create the Leaflet map
function createMap(){
    
    //create the map
    map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    //call getData function
    getData();
};


function calcMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var country of data.features){
        //loop through each year
        for(var year = 1990; year <= 2020; year+=5){
              //get population for current year
              var value = country.properties[year];
              //add value to array
              allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)

    return minValue;
}


//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    if(minValue === 0){
        minValue = 5;
    }
    
    if(attValue === -1) {
        return 5;
    }
    else if(attValue === 0){
        return 5;
    }
    else {

        //constant factor adjusts symbol sizes evenly
        var minRadius = 5;
        
        //Flannery Appearance Compensation formula
        var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius;
    }

    return radius;
};


// Attach pop-ups to each mapped feature
function pointToLayer(feature, latlng, attributes){
    
    //Step 4. Determine the attribute for scaling the proportional symbols
    var attribute = attributes[0];


    //create marker options
    var options = {
        radius: 8,
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    
    // Step 5: For each feature, determine its value for the selected attribute,
    // also recolor based on null, 0, or valid data
    var attValue = Number(feature.properties[attribute]);
    switch(attValue) {
        case -1:
            options.fillColor = "gray";
            break;
        case 0:
            options.fillColor = "#4872b5";
            break;
        default:
            options.fillColor = "orange";
    }


    //Step 6: Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    

    // create popup content
    var popupContent = new PopupContent(feature.properties, attribute);
    
    
    //bind the pop-up to the circle marker 
    layer.bindPopup(popupContent.formatted, {
        offset: new L.Point(0,-options.radius)
    });

    return layer;

};


function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature,latlng){
            return pointToLayer(feature,latlng, attributes);
        }
    }).addTo(map);
}


// Import GeoJSON data and add to map with stylized point markers
function getData(){
    //load the data
    fetch("data/eu_country_nuclear_pct_no_nulls.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var attributes = processData(json);
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
        })
};

/*
// Create slider widget
function createSequenceControls(attributes){
    
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

    // storing min and max values of slider for readability and to use for listeners
    var sliderMin = attributes[0].split("_")[1]
    var sliderMax = attributes[attributes.length-1].split("_")[1];

    //set slider attributes
    document.querySelector(".range-slider").max = sliderMax;
    document.querySelector(".range-slider").min = sliderMin;
    document.querySelector(".range-slider").value = sliderMin;
    document.querySelector(".range-slider").step = 1;

    //Step 2. Create step buttons
    // adding step buttons to the slider with images
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse"></button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward"></button>');

    //replace button content with images
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse.png'>")
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.png'>")


    // Step 5: Create listeners for slider bar and buttons

    // click forward/reverse buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;

             //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > sliderMax ? sliderMin : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < sliderMin ? sliderMax : index;
            };

            //Step 8: update slider
            document.querySelector('.range-slider').value = index;
            //console.log(index);

            //Step 9: pass new attribute to update symbols
            updatePropSymbols("pct_" + index);

        })
    })

    // slide slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        //var index = "pct_" + this.value;
        var index = this.value;

        //Step 9: pass new attribute to update symbols
        updatePropSymbols("pct_" + index);
    })
};
*/


// Resize, recolor, and set pop-ups for proportional symbols according to new attribute values
function updatePropSymbols(attribute){

    map.eachLayer(function(layer){

        if(layer.feature && layer.feature.properties[attribute]){

            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
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
                    layer.setStyle({fillColor: 'orange'});
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
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/reverse.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forward.png"></button>');
            
            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')

            return container;
        }
    });

    map.addControl(new SequenceControl());    // add listeners after adding control}
}

document.addEventListener('DOMContentLoaded',createMap);
