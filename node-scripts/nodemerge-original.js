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

var map = require('./data/singmap_lower_rez.json');
var pop = require('./data/pop2017.json');

mergeData(map, pop);
    
function mergeData(singmapdata, population) {

    // Merge data
    var mapdata = singmapdata;
            
    for (var i = 0; i < mapdata.features.length; i++){
        for (var j = 0; j < population.length; j++) {
            if (mapdata.features[i].properties.description == population[j].Subzone) {
            
                var obj = population[j];
                var keys = Object.keys(obj);
                                
                mapdata.features[i].properties.mapdata = [];
                
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
                    
                    mapdata.features[i].properties.mapdata.push(mapobj);
                }
                
                mapdata.features[i].properties.totalpop = obj["MaleTotal"] + obj["FemaleTotal"];

                // Break this loop cycle as already found and matched data
                continue;
            }
        }
    }    
        
    fs.writeFile('../assets/data/data.json', JSON.stringify(mapdata), function (err) {
      if (err) return console.log(err);
      console.log('data.json written');
    });
}