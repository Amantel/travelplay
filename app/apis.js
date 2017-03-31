module.exports.findSongKickEvents = findSongKickEventsStart;


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

                        for (var i = 0; i < json.resultsPage.results.location.length; i++) {
                            location = json.resultsPage.results.location[i];
                            if (!tech.isUS(location.metroArea.country.displayName)) {
                                cityID = location.metroArea.id;
                                callback(null, cityID);
                                return false;

                            }
                        }
                        callback("city not found - " + cityName, 0);

                    } else {
                        callback("city not found - " + cityName, 0);
                    }
                } else {
                    callback("city finding error - " + cityName, 0);

                }
            });
        },

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

            console.log("SongkickFinal  " + url);

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



                } else {
                    console.log("Songkick " + trip.city + " Results: " + flattened.length + " " + "Events: " + performances.length);
                    innerCallback2();

                }


            }
        });

}



function findSongKickEventsFinalGenres(artistList, cityID, performances, apiUrl, trip, user, time) {

    async.mapLimit(performances, 10,
        (function (performance, callback) {
            var url = settings.discogsApiUrl.replace("ARTIST_NAME", encodeURI(performance.event_title));

            request({
                url: url,
                headers: {
                    'User-Agent': 'TravelPlay Robot 1/X'
                }
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    if (!json) {
                        callback("find Discogs genres error inner", 0);
                    }
                    var genres = json.results.map(function (result) {
                        var curGenres = [];
                        curGenres = curGenres.concat(result.style);
                        curGenres = curGenres.concat(result.genre);
                        return curGenres;
                    });

                    if (genres.length > 1)
                        genres = genres.reduce(function (a, b) {
                            return a.concat(b);
                        });
                    genreInfoUniq = [...new Set(genres)];
                    performance.genres = genreInfoUniq;
                    callback(null, performance);
                } else {
                    callback("find Discogs genres error", 0);

                }
            });


        }),
        function (err, results) {
            if (err && !results) {
                console.log("Discogs Genre error ZERO");
            }

            if (results && results.length > 0) {
                if (err) {
                    console.log("Discogs Genre error after " + results.length);
                }


                //toLowerCase genres
                performances = performances.map(function (performance) {
                    var genres = "";
                    if (performance.genres && performance.genres.length > 0) {
                        genres = performance.genres.
                            filter(g => typeof (g) === "string").
                            map(g => g.toLowerCase());
                    }

                    performance.genres = genres;
                    return performance;

                });


                //filter by bands
                performances12 = performances.filter(function (elem, i, array) {
                    if (elem.event_title !== undefined) {
                        return artistList.indexOf(elem.event_title.toLowerCase()) > -1;
                    }
                    return false;

                });

                performances3 = performances.filter(function (performance, i, array) {

                    final = user.genres.filter(function (el) {
                        return performance.genres.indexOf(el) !== -1;
                    });

                    return final.length;

                });

            }
            console.log("Songkick " + trip.city + " Results: " + performances.length + " " + "Events: " + performances3.length);

            if (performances3.length > 0)
                tech.saveEvents(user, performances3, trip);

            tech.logEvents(time, user, trip, apiUrl.replace("CITY_ID", cityID), performances3, performances, "songkick");




        });

}

