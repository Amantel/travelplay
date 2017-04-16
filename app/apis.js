module.exports.findSongKickEvents = findSongKickEventsStart;
module.exports.findEventsTicketMaster = findEventsTicketMasterStart;


const request = require('request');
const async = require('async');
const fs = require('fs-extra');

const SpotifyWebApi = require('spotify-web-api-node');

/*Inner modules*/
const tech = require("./tech");
const server = require("./index");
const settings = require("./settings");
const server_settings = require("./server_setting");




function findSongKickEventsStart(apiUrl, trip, artistList, user, time, apiLocationUrl, innerCallback2) {
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

                        var cityID = 0;
                        var trip=this.trip;

                        if(tech.isUS(trip.country)) {
                            cityID = json.resultsPage.results.location[0].metroArea.id;
                            callback(null, cityID);
                            return false;                            
                        } else
                        {
                            //searching for non US cities
                            for (var i = 0; i < json.resultsPage.results.location.length; i++) {
                                location = json.resultsPage.results.location[i];
                                if (!tech.isUS(location.metroArea.country.displayName)) {
                                    cityID = location.metroArea.id;
                                    callback(null, cityID);
                                    return false;

                                }
                            }
                        }
                        callback("city not found - " + cityName, 0);

                    } else {
                        callback("city not found - " + cityName, 0);
                    }
                } else {
                    callback("city finding error - " + cityName, 0);

                }
            }.bind({ trip: this.trip }));
        }.bind({ trip: trip }),

        function (cityID, callback) {

            var start = trip.start;
            var end = trip.end;


            var url = apiUrl.
                replace("CITY_ID", cityID).
                replace("PAGE_NUMBER", 1).
                replace("DATE_START", start).
                replace("DATE_END", end);


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

            findSongKickEventsFinal(artistList, cityID, pagesArray, apiUrl, trip, user, time, innerCallback2);
        }


    });
}




function findSongKickEventsFinal(artistList, cityID, pagesArray, apiUrl, trip, user, time, innerCallback2) {
    async.map(pagesArray,
        (function (pageNumber, callback) {
            var start = trip.start;
            var end = trip.end;


            var url = apiUrl.
                replace("CITY_ID", cityID).
                replace("PAGE_NUMBER", encodeURI(pageNumber)).
                replace("DATE_START", start).
                replace("DATE_END", end);

            //console.log("SongkickFinal  " + url);

            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var foundEvents = [];
                    var json = JSON.parse(body);
                    if (!json) {
                        callback("find Songkick events error inner", 0);
                    } else {

                        foundEvents = json.resultsPage.results.event.filter(function (elem, i, array) {
                            return elem.performance.length > 0;
                        });

                        callback(null, foundEvents);
                    }
                } else {
                    callback("find Songkick events error", 0);

                }
            });


        }),
        function (err, results) {
            if (err) {
                console.log(trip.city + " findSongKickEventsFinal error");
                innerCallback2(trip.city + " findSongKickEventsFinal error");
            } else {
                var flattened = [];
                var performances = [];
                var foundEvents = [];
                if (results.length > 0) {

                    flattened = results.reduce(function (a, b) {
                        return a.concat(b);
                    });
                    performances = flattened.map(function (event) {
                        return event.performance.map(function (performance) {
                            return {
                                "artist_name": performance.displayName,
                                "venue_name": event.venue.displayName,
                                "uri": event.uri,
                                "start_date": event.start.date,
                                "source": "songkick"
                            };
                        });
                    }).reduce(function (a, b) {
                        return a.concat(b);
                    });


                    console.log("Songkick " + trip.city + " Results: " + flattened.length + " " + "Events: " + performances.length);
                    if (performances.length > 0)
                        tech.savePerformancesToTrip(user, performances, trip, innerCallback2);
                    else     
                        innerCallback2();


                } else {
                    console.log("Songkick " + trip.city + " Results: " + flattened.length + " " + "Events: " + performances.length);
                    innerCallback2();

                }


            }
        });

}


 




function findEventsTicketMasterStart(apiUrl, trip, artistList, user, time,innerCallback2T) {
    var cityName = encodeURI(trip.city);
    var start = trip.start + "T00:00:00Z";
    var end = trip.end + "T00:00:00Z";
    apiUrl = apiUrl.replace("CITY_NAME", cityName).replace("DATE_START", start).replace("DATE_END", end);
    async.waterfall([
        function (callback) {
            var url = apiUrl;
            request(url, function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    if (!json.page) {
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
            innerCallback2T(err);
        }
        else {
            findTicketMasterFinish(pages, apiUrl, trip, artistList, user, time,innerCallback2T);
        }
    });
}
function findTicketMasterFinish(pages, apiUrl, trip, artistList, user, time,innerCallback2T) {
    if (!pages)
        pages = 0;
    var pagesArray = Array(pages * 1).fill(0).map((e, i) => i );
    async.map(pagesArray,
        (function (pageNumber, callback) {
            var url = apiUrl + "&page=" + pageNumber;
            //console.log(url);
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var foundEvents = [];
                    var json = JSON.parse(body);
                    if (!json || !json._embedded || !json._embedded.events) {
                        if (!json) {
                            callback("find Ticketmaster events error inner", 0);
                        }
                        else {
                            callback(null, []);
                        }
                    } else {
                        if(json && json._embedded && json._embedded.events) {
                            foundEvents = json._embedded.events.filter((event)=>{return event.name;}); 

                            foundEvents = json._embedded.events.map(function (event) {
                                var venue="";
                                if(
                                    event._embedded &&
                                    event._embedded.venues &&
                                    event._embedded.venues.length>0 &&
                                    event._embedded.venues[0].name
                                )
                                    venue=event._embedded.venues[0].name;
                                return {
                                    "artist_name": event.name,
                                    "venue_name": venue,
                                    "uri": event.url,
                                    "start_date": event.dates.start.localDate,
                                    "source": "ticketmaster"
                                };

                            });
                            
                        } else {
                            foundEvents=[];
                        }
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
                innerCallback2T(err);
                console.log("ticketmaster finished with error");
            } else {
                var performances = [];
                if (results.length > 0) {
                    performances = results.reduce(function (a, b) {
                        return a.concat(b);
                    });
          
                }
                console.log("Ticketmaster " + trip.city + " Events: " + performances.length);
                if (performances.length > 0)
                    tech.savePerformancesToTrip(user, performances, trip, innerCallback2T);
                else     
                    innerCallback2T();
 
            }
        });
}
