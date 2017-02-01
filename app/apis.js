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
                        callback("city not found", 0);
                    }
                } else {
                    tech.logError(err);
                    tech.logError(response);
                    callback("city finding error", 0);

                }
            });
        },

        function (cityID, callback) {
            //console.log("*****>");
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
                    tech.logError(err);
                    tech.logError(response);
                    callback("city finding error in Songkick primary search", 0);

                }
            });

        }

    ], function (err, totalEntries, cityID) {
        if (err) {
            console.log("*********************FINISHED WITH ERROR**************************");
            console.log("findSongKickEventsStart error");
            console.log(err);
        }
        else {

            //console.log("totalEntries " + totalEntries);
            //console.log("cityID " + cityID);

            var N = Math.ceil(totalEntries / 50);
            var pagesArray = Array(N).fill(0).map((e, i) => i + 1);
            findSongKickEventsFinal(artistList, cityID, pagesArray, apiUrl, trip, user, time);
        }


    });
}




function findSongKickEventsFinal(artistList, cityID, pagesArray, apiUrl, trip, user, time) {
    async.map(pagesArray,
        (function (pageNumber, callback) {
            var url = apiUrl.replace("CITY_ID", cityID).replace("PAGE_NUMBER", encodeURI(pageNumber))

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
                    tech.logError(err);
                    tech.logError(response);
                    callback("find Songkick events error", 0);

                }
            });


        })
        , function (err, results) {
            if (err) {
                console.log("*********************FINISHED WITH ERROR**************************");
                console.log("findSongKickEventsFinal error");
                console.log(err);
            } else {
                var flattened = [];
                var events = [];
                if (results.length > 0) {

                    var flattened = results.reduce(function (a, b) {
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
                        if (elem.event_title != undefined) {
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
                console.log("Results: " + flattened.length);
                console.log("Events: " + events.length);
                console.log("*********************FINISHED WITH SUCCESS*********************");

                if (events.length > 0)
                    tech.saveEvents(user, events, trip); 

                tech.logEvents(time, user, trip, apiUrl, results, events);



            }
        });


}








function findEventfulEventsStart(apiUrl, trip, artistList, user, time) {
     var cityName = encodeURI(trip.city);
     var start=trip.start.replace("-","").replace("-","")+"00";
     var end=trip.end.replace("-","").replace("-","")+"00";
     apiUrl=apiUrl.replace("CITY_NAME", cityName).replace("DATE_START", trip.start).replace("DATE_END", trip.end);

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
                        callback(null, json.page_count,json.events);
                    }
                } else {
                    tech.logError(err);
                    tech.logError(response);
                    callback("error in eventful primary search", 0);

                }
            });
        }

    ], function (err, pages, events) {
        if (err) {
            console.log("*********************FINISHED WITH ERROR**************************");
            console.log("findEventfulEventsStart error");
            console.log(err);
        }
        else {
            findEventfulFinish(pages,events, apiUrl, trip, artistList, user, time);
        }


    });
}


 



function findEventfulFinish(pages, events, apiUrl, trip, artistList, user, time) {
 
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
                    if (!json || !json.events ||json.events.event) {
                        callback("find Eventful events error inner", 0);
                    } else {
                        foundEvents = json.events.event.map(function (elem) {
                            return { "event_title": elem.title, "event": elem };
                        });

                        callback(null, foundEvents);
                    }
                } else {
                    tech.logError(err);
                    tech.logError(response);
                    callback("find Eventful events error", 0);

                }
            });


        })       
        
        , function (err, results) {
            if (err) {
                console.log("*********************FINISHED WITH ERROR**************************");
                console.log(err);
            } else {
                var flattened = [];
                var events = [];
                if(results.length>0)
                {

                    var flattened = results.reduce(function (a, b) {
                        return a.concat(b);
                    });

                    //filter by bands
                    var events = flattened.filter(function (elem, i, array) {
                        if (elem.event_title != undefined) {
                            return artistList.indexOf(elem.event_title.toLowerCase()) > -1;
                        }
                        return false;
                    });
                }
                console.log("Results: " + flattened.length);
                console.log("Events: " + events.length);
                console.log("*********************FINISHED WITH SUCCESS*********************");

                if (events.length > 0)
                    tech.saveEvents(user, events, trip); 

                tech.logEvents(time, user, trip, apiUrl, results, events);



            }
        });

    




}
 




 

function findEventsTicketMasterStart(apiUrl, trip, artistList, user, time) {
     var cityName = encodeURI(trip.city);
     var start=trip.start+"T00:00:00Z";
     var end=trip.end+"T00:00:00Z";
     apiUrl=apiUrl.replace("CITY_NAME", cityName).replace("DATE_START", trip.start).replace("DATE_END", trip.end);

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
                        callback(null, json.page.totalPages,json._embedded.events);
                    }
                } else {
                    tech.logError(err);
                    tech.logError(response);
                    callback("error in ticketmaster primary search", 0);

                }
            });
        }

    ], function (err, pages, events) {
        if (err) {
            console.log("*********************FINISHED WITH ERROR**************************");
            console.log("findEventfulEventsStart error");
            console.log(err);
        }
        else {
            findTicketMasterFinish(pages,events, apiUrl, trip, artistList, user, time);
        }


    });
}


 



function findTicketMasterFinish(pages, events, apiUrl, trip, artistList, user, time) {
 
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
                    if (!json || !json._embedded || json._embedded.events) {
                        callback("find Ticketmaster events error inner", 0);
                    } else {
  

                        foundEvents = json._embedded.events.map(function (elem) {
                            return { "event_title": elem.name, "event": elem };
                        });                        

                        callback(null, foundEvents);
                    }
                } else {
                    tech.logError(err);
                    tech.logError(response);
                    callback("find Ticketmaster events error", 0);

                }
            });


        })       
        
        , function (err, results) {
            if (err) {
                console.log("*********************FINISHED WITH ERROR**************************");
                console.log(err);
            } else {
                var flattened = [];
                var events = [];
                if(results.length>0)
                {

                    var flattened = results.reduce(function (a, b) {
                        return a.concat(b);
                    });

                    //filter by bands
                    var events = flattened.filter(function (elem, i, array) {
                        if (elem.event_title != undefined) {
                            return artistList.indexOf(elem.event_title.toLowerCase()) > -1;
                        }
                        return false;

                    });

                }
                console.log("Results: " + flattened.length);
                console.log("Events: " + events.length);
                console.log("*********************FINISHED WITH SUCCESS*********************");

                if (events.length > 0)
                    tech.saveEvents(user, events, trip); 

                tech.logEvents(time, user, trip, apiUrl, results, events);



            }
        });

    




}
 

 