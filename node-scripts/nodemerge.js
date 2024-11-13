// Simple node.js script for writing data.json file
// In general all data processing should be done on the server end if possible

var popstructure = [
    "0...4",
    "5...9",
    "10...14",
    "15...19",
    "20...24",
    "25...29",
    "30...34",
    "35...39",
    "40...44",
    "45...49",
    "50...54",
    "55...59",
    "60...64",
    "65...69",
    "70...74",
    "75...79",
    "80...84",
    "85+"
]

var fs = require("fs")


// Merge data
var mapdata = require('./data/singmap_lower_rez.json');

    for (var i = 0; i < mapdata.features.length; i++){
        
        mapdata.features[i].properties.year = [];
        
        for(var h = 2011; h <= 2017; h++) {
            
            var population = require('./data/pop' + h + '.json');
        
            for (var j = 0; j < population.length; j++) {
                if (mapdata.features[i].properties.description == population[j].Subzone) {
                
                    var obj = population[j];
                    var keys = Object.keys(obj);
                                    
                    var yearobj = {};
                        yearobj.year = h;
                        yearobj.histogram = [];
                    
                    // Construct populaton pyramid for district
                    // Generate normalized values for charting
                    for (var k = 0; k < popstructure.length; k++) {
                        var mapobj = {};
                        mapobj.agegroup = "Age " + popstructure[k];
                        
                        var male = {};
                            male.pop = obj["Male" + popstructure[k]];
                            male.normalized = obj["Male" + popstructure[k]] / obj["MaleTotal"];

                            mapobj.male = male;

                        var female = {};
                            female.pop = obj["Female" + popstructure[k]];
                            female.normalized = obj["Female" + popstructure[k]] / obj["FemaleTotal"];
                            
                            mapobj.female = female;
                        
                        yearobj.histogram.push(mapobj);
                    }
                    
                    yearobj.totalpop = obj["MaleTotal"] + obj["FemaleTotal"];
                    mapdata.features[i].properties.year.push(yearobj);

                    // Break this loop cycle as already found and matched data
                    continue;
                }
            }
            
        }
    }
        
fs.writeFile('../assets/data/data.json', JSON.stringify(mapdata), function (err) {
  if (err) return console.log(err);
  console.log('data.json written');
});
