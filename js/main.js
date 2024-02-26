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
        var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius
        console.log(radius);
    }

    return radius;
};


/*
// Attach pop-ups to each mapped feature
function onEachFeature(feature, layer){
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };

};
*/


function createPropSymbols(data){

    
    //Step 4. Determine the attribute for scaling the proportional symbols
    var attribute = "1990";
    
    
    //create marker options
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    
    
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng){
            //Step 5: For each feature, determine its value for the selected attribute
            var attValue;
            if(feature.properties[attribute] === null) {
                attValue = null;
                geojsonMarkerOptions.fillColor = "gray"; // if value is null, set marker to gray
            }
            else {
                attValue = Number(feature.properties[attribute]);
                if(attValue === 0) {
                    geojsonMarkerOptions.fillColor = "#4872b5";
                }
                else {
                    geojsonMarkerOptions.fillColor = "orange";
                }
            }

            //Step 6: Give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);

            //create circle markers
            return L.circleMarker(latlng, geojsonMarkerOptions);
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
            
            createPropSymbols(json);
        })
};



//GOAL: Proportional symbols representing attribute values of mapped features
//STEPS:
//Step 1. Create the Leaflet map--already done in createMap()
//Step 2. Import GeoJSON data--already done in getData()
//Step 3. Add circle markers for point features to the map--already done in AJAX callback
//Step 4. Determine the attribute for scaling the proportional symbols
//Step 5. For each feature, determine its value for the selected attribute
//Step 6. Give each feature's circle marker a radius based on its attribute value