module.exports.findSongKickEvents = findSongKickEventsStart;
//module.exports.findEventfulEvents = findEventfulEventsStart;
//module.exports.findTicketMasterEvents = findEventsTicketMasterStart;



const request = require('request');
const async = require('async');
const fs = require('fs-extra');

const SpotifyWebApi = require('spotify-web-api-node');

/*Inner modules*/
const tech = require("./tech");
const server = require("./index");
const settings = require("./settings");
const server_settings = require("./server_setting");




function findSongKickEventsStart(apiUrl, trip, artistList, user, time, apiLocationUrl) {

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

                        var cityID = 0;

                        for(var i=0; i<json.resultsPage.results.location.length;i++) {
                            location=json.resultsPage.results.location[i];
                            if(!tech.isUS(location.metroArea.country.displayName)) {
                                cityID = location.metroArea.id;
                                callback(null, cityID);
                                return false;
                                
                            }
                        }
                        callback("city not found - " + cityName, 0);
                        
                    } else {
                        //console.log(cityName + "  " + "city not found")
                        callback("city not found - " + cityName, 0);
                    }
                } else {
                    //tech.logError(err);
                    //tech.logError(response);
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
            //var url = apiUrl.replace("CITY_ID", cityID).replace("PAGE_NUMBER", encodeURI(pageNumber));
            var start = trip.start;
            var end = trip.end;


            var url = apiUrl.
                replace("CITY_ID", cityID).
                replace("PAGE_NUMBER", encodeURI(pageNumber)).
                replace("DATE_START", start).
                replace("DATE_END", end);
             console.log("SongkickFinal  "+url);
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
                    //tech.logError(err);
                    //tech.logError(response);
                    callback("find Songkick events error", 0);

                }
            });


        }),
        function (err, results) {
            if (err) {
                console.log(trip.city + " findSongKickEventsFinal error");
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
                                "source":"songkick"
                            };
                        });
                    }).reduce(function (a, b) {
                        return a.concat(b);
                    });

 
                    console.log("Songkick " + trip.city + " Results: " + flattened.length + " " + "Events: " + performances.length);
 
                    if (performances.length > 0)
                        tech.savePerformancesToTrip(user, performances, trip);

                    tech.logEvents(time, user, trip, apiUrl.replace("CITY_ID", cityID), foundEvents, performances, "songkick");
 

                } else {
                    console.log("Songkick " + trip.city + " Results: " + flattened.length + " " + "Events: " + performances.length);

                    tech.logEvents(time, user, trip, apiUrl.replace("CITY_ID", cityID), foundEvents, performances, "songkick");
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
                    console.log("Discogs Genre error after "+results.length);
                } 


                //toLowerCase genres
                performances=performances.map(function (performance) {
                    var genres="";
                    if(performance.genres && performance.genres.length>0) {
                        genres=performance.genres.
                        filter(g=>typeof(g)==="string").
                        map(g=>g.toLowerCase());
                    }

                    performance.genres=genres;
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

                    final=user.genres.filter(function(el){
                        return performance.genres.indexOf(el)!==-1;
                    });

                    return final.length;

                });

/*
                console.log("***********performances12***********");
                console.log(performances12);
                console.log(performances12.length);
                console.log("***********performances3***********");
                tech.logToFile("events.json", performances.map(p=>p.genres));
                tech.logToFile("usergenres.json", user.genres);
                tech.logToFile("performances3.json", performances3);
                console.log(performances3);
                console.log(performances3.length);
*/

            }
            console.log("Songkick " + trip.city + " Results: " + performances.length + " " + "Events: " + performances3.length);

            if (performances3.length > 0)
                tech.saveEvents(user, performances3, trip);

            tech.logEvents(time, user, trip, apiUrl.replace("CITY_ID", cityID), performances3, performances, "songkick");



        
    });

}



/*

function findEventfulEventsStart(apiUrl, trip, artistList, user, time) {

    //artistList.push("gabrielle marlena");
    var cityName = encodeURI(trip.city);
    var start = trip.start.replace("-", "").replace("-", "") + "00";
    var end = trip.end.replace("-", "").replace("-", "") + "00";
    apiUrl = apiUrl.replace("CITY_NAME", cityName).replace("DATE_START", start).replace("DATE_END", end);
    async.waterfall([
        function (callback) {
            var url = apiUrl;

            request(url, function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    var json = JSON.parse(body);

                    if (!json.page_count) {
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
        pages = 0;

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
                console.log(trip.city + " eventful finished with error");

            } else {
                var flattened = [];
                var events = [];
                if (results.length > 0) {

                    flattened = results.reduce(function (a, b) {
                        return a.concat(b);
                    });

                    //filter by bands
                    events = flattened.filter(function (elem, i, array) {
                        //console.log(i+")"+elem.event_title.toLowerCase());
                        if (elem.event_title !== undefined) {
                            return artistList.indexOf(elem.event_title.toLowerCase()) > -1;
                        }
                        return false;
                    });
                }
                console.log("Eventful " + trip.city + " Results: " + flattened.length + " " + "Events: " + events.length);

                if (events.length > 0)
                    tech.saveEvents(user, events, trip);

                tech.logEvents(time, user, trip, apiUrl, results, events, "eventful");



            }
        });






}







function findEventsTicketMasterStart(apiUrl, trip, artistList, user, time) {

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
            console.log("findTicketMasterEventsStart error");

        }
        else {
            findTicketMasterFinish(pages, apiUrl, trip, artistList, user, time);
        }


    });
}






function findTicketMasterFinish(pages, apiUrl, trip, artistList, user, time) {

    if (!pages)
        pages = 0;

    var pagesArray = Array(pages * 1).fill(0).map((e, i) => i + 1);
    async.map(pagesArray,

        (function (pageNumber, callback) {
            var url = apiUrl + "&page=" + pageNumber;

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
                if (results.length > 0) {

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
                console.log("Ticketmaster " + trip.city + " Results: " + flattened.length + " " + "Events: " + events.length);


                if (events.length > 0)
                    tech.saveEvents(user, events, trip);

                tech.logEvents(time, user, trip, apiUrl, results, events, "ticketmaster");



            }
        });






}


*/