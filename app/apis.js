module.exports.findSongKickEvents = findSongKickEventsStart;
module.exports.findEventfulEvents = findEventfulEventsStart;
module.exports.findTicketMasterEvents = findEventsTicketMasterStart;



const request = require('request');
const async = require('async');

const SpotifyWebApi = require('spotify-web-api-node');

/*Inner modules*/
const tech = require("./tech");
const server = require("./index");
const settings = require("./settings");
const server_settings = require("./server_setting");



















function findSongKickEventsStart(apiUrl, trip, artistList, user, time,apiLocationUrl) {

    var cityName = encodeURI(trip.city);



    async.waterfall([
        function (callback) {
            var url = apiLocationUrl.replace("CITY_NAME", cityName);

            request(url, function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    var totalEntries = json.resultsPage.totalEntries;
                    if (!totalEntries)
                        totalEntries = 0;
                    if (totalEntries > 0) {
                        // console.log(cityName + "  " + json.resultsPage.results.location[0].metroArea.id)
                        callback(null, json.resultsPage.results.location[0].metroArea.id);
                    } else {
                        //console.log(cityName + "  " + "city not found")
                        callback("city not found - "+cityName, 0);
                    }
                } else {
                    //tech.logError(err);
                    //tech.logError(response);
                    callback("city finding error - "+cityName, 0);

                }
            });
        },

        function (cityID, callback) {
            var url = apiUrl.replace("CITY_ID", cityID).replace("PAGE_NUMBER", 1);
            //console.log(url);
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    if (!json) {
                        callback("find Songkick events error inner", 0);
                    } else {
                        //console.log(json);
                        var totalEntries = json.resultsPage.totalEntries;
                        if (!totalEntries)
                            totalEntries = 0;
                        callback(null, totalEntries, cityID);
                    }
                } else {
                    //tech.logError(err);
                    //tech.logError(response);
                    callback("finding error Songkick primary search", 0);

                }
            });

        }

    ], function (err, totalEntries, cityID) {
        if (err) {
            console.log(err);
             
        }
        else {
            var N = Math.ceil(totalEntries / 50);
            var pagesArray = Array(N).fill(0).map((e, i) => i + 1);
            findSongKickEventsFinal(artistList, cityID, pagesArray, apiUrl, trip, user, time);
        }
 

    });
}




function findSongKickEventsFinal(artistList, cityID, pagesArray, apiUrl, trip, user, time) {
    async.map(pagesArray,
        (function (pageNumber, callback) {
            var url = apiUrl.replace("CITY_ID", cityID).replace("PAGE_NUMBER", encodeURI(pageNumber));

            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var foundEvents = [];
                    var json = JSON.parse(body);
                    if (!json) {
                        callback("find Songkick events error inner", 0);
                    } else {
                        foundEvents = json.resultsPage.results.event.filter(function (elem, i, array) {
                            return elem.performance.length > 0;
                        }).map(function (elem) {
                            return { "event_title": elem.performance[0].displayName, "event": elem };
                        });

                        callback(null, foundEvents);
                    }
                } else {
                    //tech.logError(err);
                    //tech.logError(response);
                    callback("find Songkick events error", 0);

                }
            });


        }), 
        function (err, results) {
            if (err) {
                console.log(trip.city+" findSongKickEventsFinal error");
                
            } else {
                var flattened = [];
                var events = [];
                if (results.length > 0) {
                        flattened = results.reduce(function (a, b) {
                        return a.concat(b);
                    });

                    
                    //filter by dates
                    events = flattened.filter(function (elem, i, array) {
                        if (elem.event !== undefined && elem.event.start !== undefined) {
                            return new Date(elem.event.start.date) >= new Date(settings.SongKickStartDate) && new Date(elem.event.start.date) <= new Date(settings.SongKickEndtDate);
                        }
                        return false;
    
                    });
                    //filter by bands
                    events = events.filter(function (elem, i, array) {
                        if (elem.event_title !== undefined) {
                            return artistList.indexOf(elem.event_title.toLowerCase()) > -1;
                        }
                        return false;
    
                    });
                 

                    /*
                    TESTS
                    var N = Math.floor(Math.random() * Math.min(10, flattened.length)) + 0;
                    for (i = 0; i < N; i++) {
                        var X = Math.floor(Math.random() * flattened.length) + 1;
                        events.push(flattened[X]);
                    } 
                    */

                }
                console.log(trip.city+" Results: " + flattened.length+" "+"Events: " + events.length);

                if (events.length > 0)
                    tech.saveEvents(user, events, trip); 

                tech.logEvents(time, user, trip, apiUrl, results, events,"songkick");



            }
        });


}








function findEventfulEventsStart(apiUrl, trip, artistList, user, time) {

     //artistList.push("gabrielle marlena");
     var cityName = encodeURI(trip.city);
     var start=trip.start.replace("-","").replace("-","")+"00";
     var end=trip.end.replace("-","").replace("-","")+"00";
     apiUrl=apiUrl.replace("CITY_NAME", cityName).replace("DATE_START", start).replace("DATE_END", end);
      async.waterfall([
        function (callback) {
            var url = apiUrl;
 
            request(url, function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    var json = JSON.parse(body);

                    if(!json.page_count) {
                        tech.logError(json);                    
                        callback("error in eventful primary search in json", 0);
                    }
                    else {
                        callback(null, json.page_count);
                    }
                } else {
                    //tech.logError(err);
                    //tech.logError(response);
                    callback("error in eventful primary search", 0);

                }
            });
        }

    ], function (err, pages) {
        if (err) {
            console.log("findEventfulEventsStart error");
            
        }
        else {
            findEventfulFinish(pages, apiUrl, trip, artistList, user, time);
        }


    });
}


 



function findEventfulFinish(pages, apiUrl, trip, artistList, user, time) {
    //artistList.push("Shake and Sing with Suzi Shelton".toLowerCase());
    //artistList.push("Baelfire".toLowerCase());
        if (!pages)
            pages=0;
            
        var pagesArray = Array(pages * 1).fill(0).map((e, i) => i + 1);
         async.map(pagesArray, 
        
         (function (pageNumber, callback) {
            var url = apiUrl + "&page_number=" + pageNumber;
             request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var foundEvents = [];
                    var json = JSON.parse(body);
                    if (!json || !json.events || !json.events.event) {
                        callback("find Eventful events error inner", 0);
                    } else {

                        foundEvents = json.events.event.map(function (elem) {
                            return { "event_title": elem.title, "event": elem };
                        });

                        callback(null, foundEvents);
                    }
                } else {
                    //tech.logError(err);
                    //tech.logError(response);
                    callback("find Eventful events error", 0);

                }
            });


        }),
        function (err, results) {
            if (err) {
                console.log(err);
                console.log(trip.city+" eventful finished with error");
                
            } else { 
                var flattened = [];
                var events = [];
                if(results.length>0)
                {

                        flattened = results.reduce(function (a, b) {
                        return a.concat(b);
                    });

                    //filter by bands
                        events = flattened.filter(function (elem, i, array) {
                        console.log(i+")"+elem.event_title.toLowerCase());
                        if (elem.event_title !== undefined) {
                            return artistList.indexOf(elem.event_title.toLowerCase()) > -1;
                        }
                        return false;
                    });
                }
                //console.log(trip.city+" Results: " + flattened.length+" "+"Events: " + events.length);
 
                if (events.length > 0)
                    tech.saveEvents(user, events, trip); 

                tech.logEvents(time, user, trip, apiUrl, results, events, "eventful");
 


            }
        });

    




}
 




 

function findEventsTicketMasterStart(apiUrl, trip, artistList, user, time) {
    
     var cityName = encodeURI(trip.city);
     var start=trip.start+"T00:00:00Z";
     var end=trip.end+"T00:00:00Z";
     apiUrl=apiUrl.replace("CITY_NAME", cityName).replace("DATE_START", start).replace("DATE_END", end);

     async.waterfall([
        function (callback) {
            var url = apiUrl;

            request(url, function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    var json = JSON.parse(body);
 
                    if(!json.page) {
                        tech.logError(json);                    
                        callback("error in ticketmaster primary search in json", 0);
                    }
                    else {
                        callback(null, json.page.totalPages);
                    }
                } else {
                    //tech.logError(err);
                    //tech.logError(response);
                    callback("error in ticketmaster primary search", 0);

                }
            });
        }

    ], function (err, pages) {
        if (err) {
            console.log("findTicketMasterEventsStart error");
            
        }
        else {
            findTicketMasterFinish(pages, apiUrl, trip, artistList, user, time);
        }


    });
}


 



function findTicketMasterFinish(pages, apiUrl, trip, artistList, user, time) {

        if (!pages)
            pages=0;
            
        var pagesArray = Array(pages * 1).fill(0).map((e, i) => i + 1);
        async.map(pagesArray, 

         (function (pageNumber, callback) {
            var url = apiUrl + "&page=" + pageNumber;

            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var foundEvents = [];
                    var json = JSON.parse(body);
                    if (!json || !json._embedded || !json._embedded.events) {
                        if(!json) {
                            callback("find Ticketmaster events error inner", 0);
                        }
                        else {                    
                            callback(null, []);                           
                        }
                        
                    } else {
  

                        foundEvents = json._embedded.events.map(function (elem) {
                            return { "event_title": elem.name, "event": elem };
                        });                        

                        callback(null, foundEvents);
                    }
                } else {
                    //tech.logError(err);
                    //tech.logError(response);
                    callback("find Ticketmaster events error", 0);

                }
            });


        }),
        function (err, results) {
            if (err) {
                console.log(err);
                console.log("ticketmaster finished with error");
                
            } else {
                var flattened = [];
                var events = [];
                if(results.length>0)
                {

                        flattened = results.reduce(function (a, b) {
                        return a.concat(b);
                    });

                    //filter by bands
                        events = flattened.filter(function (elem, i, array) {
                        if (elem.event_title !== undefined) {
                            return artistList.indexOf(elem.event_title.toLowerCase()) > -1;
                        }
                        return false;

                    });

                }
                console.log("Results: " + flattened.length);
                console.log("Events: " + events.length);

                if (events.length > 0)
                    tech.saveEvents(user, events, trip); 

                tech.logEvents(time, user, trip, apiUrl, results, events, "ticketmaster");



            }
        });

    




}
 

 