module.exports.findSongKickEvents = findSongKickEventsStart;

const request = require('request');
const async = require('async');

/*Inner modules*/
const tech = require("./tech");
const server = require("./index");


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
                    callback("city finding error", 0);

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

                    //here we ignore everything and just get few random events
                    /*
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
                    */

                    var N = Math.floor(Math.random() * Math.min(10, flattened.length)) + 0;
                    for (i = 0; i < N; i++) {
                        var X = Math.floor(Math.random() * flattened.length) + 1;
                        events.push(flattened[X]);
                    } 


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









