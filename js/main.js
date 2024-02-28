/* Map of GeoJSON data from eu_country_nuclear_pct.geojson */
//declare map var in global scope
var map;
var minValue = 1;


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
    for(var city of data.features){
        //loop through each year
        for(var year = 1990; year <= 2020; year+=5){
              //get population for current year
              var value = city.properties[year];
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
    
    if(attValue === null) {
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
        //fillColor: "#ff7800",
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    
    // Step 5: For each feature, determine its value for the selected attribute,
    // also recolor based on null, 0, or valid data
    var attValue;
    if(feature.properties[attribute] === null) {
        attValue = null;
        options.fillColor = "gray"; // if value is null, set marker to gray
    }
    else {
        attValue = Number(feature.properties[attribute]);

        if(attValue === 0) {
            options.fillColor = "#4872b5";
        }
        else {
            options.fillColor = "orange";
        }
    }

    //Step 6: Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    
    



    // --- make pop-ups ---
    
    // in pop-up, include country name and percentage for that year
    var popupContent = "<p><b>Country: </b>" + feature.properties.Country + "</p><p><b>" 
    + "Percent in " + attribute.split("_")[1] + ":</b> " + feature.properties[attribute] + "%</p>";
    
    //bind the pop-up to the circle marker 
    layer.bindPopup(popupContent, {
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

document.addEventListener('DOMContentLoaded',createMap)


// Import GeoJSON data and add to map with stylized point markers
function getData(){
    //load the data
    fetch("data/eu_country_nuclear_pct.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var attributes = processData(json);
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
        })
};


// Create slider widget
function createSequenceControls(attributes){
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

    console.log(attributes);

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


    // Create listeners for slider bar and buttons

    // click forward/reverse buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            // still need to implement
        })
    })

    // slide slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        var index = this.value;
        console.log(index);
    })
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



//Step 5. Listen for user input via affordances
//Step 6. For a forward step through the sequence, increment the attributes array index; 
//   for a reverse step, decrement the attributes array index
//Step 7. At either end of the sequence, return to the opposite end of the sequence on the next step
//   (wrap around)
//Step 8. Update the slider position based on the new index
//Step 9. Reassign the current attribute based on the new attributes array index
//Step 10. Resize proportional symbols according to each feature's value for the new attribute