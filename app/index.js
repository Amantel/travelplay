
var epicBuffer = "";

const express = require('express');
const bodyParser = require('body-parser')

const http = require('http');
const https = require("https");
const URIlib = require('./URI')
const url = require('url');

const nodemailer = require('nodemailer');
const later = require('later');

const request = require('request');
const async = require('async');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

const TripItApiClient = require("tripit-node");
var TripItClient = new TripItApiClient("a90d6eda3798d491a24bb57fcaa5bb4cd10642e5", "9653c259420ba6c242527151175d01ded2765f5a");
var requestTokenSecrets = {};


const app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'));
















var client_id = '75ff063399cf492199d40d630060fbce'; // Your client id
var client_secret = 'a9b8d76f15ef497aa27b8596d9b372be'; // Your secret
var redirect_uri = 'http://localhost:3000'; // Your redirect uri




var SpotifyWebApi = require('spotify-web-api-node');

// credentials are optional
var spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: redirect_uri
});
var scopes = ['user-read-private', 'user-read-email', 'user-follow-read'];
var state = 'test-state';









app.listen(3000, () => {
    buff('listening on 3000')
})


var useModules = {};
useModules.useSpotify = false;
useModules.useBandsInTown = false;
useModules.useTicketMaster = true;
useModules.useTicketMasterEurope = false;
useModules.useSongKick = false;
useModules.useTripIt = false;
useModules.useEventful = false;


var modelCurrent = {};

var settings = {};

settings.BandsInTownUrl = "http://api.bandsintown.com/artists/ARTIST_NAME/events/recommended.json?api_version=2.0&app_id=TRAVELPLAY_ID" +
    "&location=Stockholm"
    + "&radius=10&date=2017-01-01,2017-06-31";

settings.BandsInTownTimeOut = true;
settings.BandsInTownTimeOutTime = 100;


settings.TicketMasterKey = "F2JzydFhRbFjtW3DG3lNQXjDNCzzZujN";


settings.TicketMasterUrl = "https://app.ticketmaster.com/discovery/v2/events.json?apikey=" + settings.TicketMasterKey
    + "&startDateTime=2017-02-01T09:15:00Z&endDateTime=2017-02-28T20:15:00Z"
    + "&size=20"
    + "&city=New%20York"
    + "&classificationId=KZFzniwnSyZfZ7v7nJ";

    

settings.TicketMasterEuropeUrl = "https://livenation-test.apigee.net/mfxapi-stage/events?apikey=" + settings.TicketMasterKey
    + "&eventdate_from=2016-01-01T10:00:00Z"
    + "&rows=20"
    + "&domain_ids=finland"
    + "&category_ids=10001";

settings.SongKickKey = "7czFd6q870oymybH";

settings.SongKickUrl = "http://api.songkick.com/api/3.0/metro_areas/"
    + "CITY_ID" //Stockholm 32252
    + "/calendar.json"
    + "?apikey=" + settings.SongKickKey
    + "&page=PAGE_NUMBER"; 


settings.SongKickLocationUrl = "http://api.songkick.com/api/3.0/search/locations.json"
    + "?query=CITY_NAME" //Stockholm
    + "&apikey=" + settings.SongKickKey;

settings.SongKickStartDate = "2017-01-01";
settings.SongKickEndtDate = "2017-06-30";

settings.testBands = ["rage", "accept", "voltaire", "metallica", "tessa lark", "insurance test 3", "perry", "anthrax"];

settings.tripItCallback="http://localhost:3000/tripitcallback";
 

settings.eventfulApiKey="XTVn27FZsPVWTKdx"; 
settings.eventfulURL="http://api.eventful.com/json/events/search?app_key="+settings.eventfulApiKey+"&location=Stockholm&date=2017010100-2017063000&category=music&page_size=20"; //250


 
/*
app.get('/', (req, res) => {



modelCurrent.res = res;
if(modelCurrent.tripitAccessGrantedNow) {
    showTrips();
    modelCurrent.tripitAccessGrantedNow=false;
}
else
    modelCurrent.res.render('trip.ejs', {  });

})
*/
app.get('/tripitrequesttoken', (req, res) => {

    TripItClient.getRequestToken().then(function (results) {
            var token = results[0],
                secret = results[1];
            requestTokenSecrets[token] = secret;
            var request="https://www.tripit.com/oauth/authorize?oauth_token=" + token + "&oauth_callback="+settings.tripItCallback;
            res.redirect(request);
        }, function (error) {
            res.send(error);
        });

}); 


app.get('/tripitcallback', (req, res) => {
    //res.send({oauth_token:req.query.oauth_token});
	var token = req.query.oauth_token,
		    secret = requestTokenSecrets[token],
		    verifier = null;
	    TripItClient.getAccessToken(token, secret, verifier).then(function (results) {
		    var accessToken = results[0],
			accessTokenSecret = results[1];

            modelCurrent.tripItAccessToken=accessToken;
            modelCurrent.tripItAccessTokenSecret=accessTokenSecret;
            modelCurrent.tripitAccessGrantedNow = true;
            res.redirect("/");

	}, function (error) {
		res.send(error);
	});

});

 function showTrips() {
    TripItClient.requestResource("/list/trip", "GET", modelCurrent.tripItAccessToken, modelCurrent.tripItAccessTokenSecret).then(function (results) {
            var response = JSON.parse(results[0]);
             modelCurrent.res.render('trip.ejs', { result:response });
    });    
 }
 

 
app.get('/', (req, res) => {

    var code = req.query.code || null;
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    modelCurrent = {};
    modelCurrent.authorizeURL = authorizeURL;
    modelCurrent.res = res;

    if (!useModules.useSpotify) {
        findEvents(settings.testBands);
    }
    else {
        if (spotifyApi.getAccessToken()) {
            buff("getFollowedArtists");
            var andRelated = true;
            if (andRelated)
                getFollowedArtistsAndRelated();
            else
                getFollowedArtists();
        }
        else if (code) {
            spotifyApi.authorizationCodeGrant(code).then(function (authInfo) {
                spotifyApi.setAccessToken(authInfo.body['access_token']);
                spotifyApi.setRefreshToken(authInfo.body['refresh_token']);
                res.redirect('/');

            });
        } else {
            res.render('index.ejs', { auth_url: authorizeURL, other_info: {} });
        }
    }

})
 




function getFollowedArtistsAndRelated() {
    buff("*********************getFollowedArtistsAndRelated**************************");
    spotifyApi.getFollowedArtists({ limit: 20 }).then(function artistsInfo(basicInfo) {
        var found_artists = basicInfo.body.artists.items;
        var all_artists;
        Promise.all(found_artists.map(function (artist) {
            return spotifyApi.getArtistRelatedArtists(artist.id);
        })).then(function (allRelatedArtists) {
            for (i = 0; i < found_artists.length; i++)
                found_artists[i].related = allRelatedArtists[i].body.artists;


            all_artists = found_artists;
            all_artists.distinct_list = [];

            for (i = 0; i < all_artists.length; i++) {
                var artist = all_artists[i];
                if (all_artists.distinct_list.indexOf(artist.name) < 0)
                    all_artists.distinct_list.push(artist.name);
                for (j = 0; j < artist.related.length; j++) {
                    var related_artist = artist.related[j];
                    if (all_artists.distinct_list.indexOf(related_artist.name) < 0)
                        all_artists.distinct_list.push(related_artist.name);
                }

            }
            all_artists.distinct_list.sort(function (a, b) {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            })

            //buff(all_artists.distinct_list);
            buff("Followed and Related (c) Spotify: " + all_artists.distinct_list.length);

            findEvents(all_artists.distinct_list);
        });

    });
}



function getFollowedArtists() {
    buff("*********************getFollowedArtists**************************");

    spotifyApi.getFollowedArtists({ limit: 20 }).then(function artistsInfo(basicInfo) {
        var found_artists = basicInfo.body.artists.items;
        var all_artists;

        all_artists = found_artists;
        all_artists.distinct_list = all_artists.map(function (elem) { return elem.name.toLowerCase() });
        buff("Followed (c) Spotify: " + all_artists.distinct_list.length);

        findEvents(all_artists.distinct_list);
    });
}



function findEvents(artistList) {


    if (useModules.useBandsInTown) {
        buff("*********************BandsInTown**************************");
        findBandsinTownEvents(artistList, settings.BandsInTownTimeOut);

    }
    else if (useModules.useTicketMaster) {
        buff("*********************TicketMaster**************************");
        makeRequest(settings.TicketMasterUrl, artistList, findTicketsTicketMaster, callbackErrorGeneral);

    }
    else if (useModules.useTicketMasterEurope) {
        buff("*********************TicketMasterEurope**************************");
        makeRequest(settings.TicketMasterEuropeUrl, artistList, findTicketMasterEurope, callbackErrorGeneral);



    }
    else if (useModules.useSongKick) {
        buff("*********************SongKick**************************");
        findSongKickEventsStart(artistList);

    }
    else if (useModules.useEventful) {
        buff("*********************Eventful**************************");
        makeRequest(settings.eventfulURL, artistList, findEventfulStart, callbackErrorGeneral);

    }    
    else {
        buff("*********************No Event Source**************************");
        modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": [] } });
    }


}


function findSongKickEventsStart(artistList) {
    iteratorMarker = 0;
    if (!artistList)
        artistList = ["rage"];  

     

   
    var cityName = "Stockholm";
    buff("cityName "+cityName);
    

    async.waterfall([

        function (callback) {
            var url = settings.SongKickLocationUrl.replace("CITY_NAME", cityName);
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    var totalEntries = json.resultsPage.totalEntries;
                    if (!totalEntries)
                        totalEntries = 0;
                    if (totalEntries > 0) {

                        callback(null, json.resultsPage.results.location[0].metroArea.id);
                    } else {
                        callback("city not found", 0);
                    }
                }
            })
        },

        function (cityID,callback) {
            var url = settings.SongKickUrl.replace("CITY_ID", cityID).replace("PAGE_NUMBER", 1);
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    var totalEntries = json.resultsPage.totalEntries;
                    if (!totalEntries)
                        totalEntries = 0;
                    callback(null,totalEntries,cityID);
                }
            })
 
        }

    ], function (err, totalEntries, cityID) {
        buff("totalEntries "+totalEntries);
        buff("cityID "+cityID);
        
        var N = Math.ceil(totalEntries / 50);
        var pagesArray = Array(N).fill(0).map((e, i) => i + 1);
        findSongKickEventsFinal(artistList,cityID,pagesArray);

    });
} 


function findSongKickEventsFinal(artistList,cityID,pagesArray) {     
        var requestFunction = makeKickRequest;
        modelCurrent.KickcityID=cityID;
        async.map(pagesArray, requestFunction, function (err, results) {
            if (err) {
                buff("*********************FINISHED WITH ERROR**************************");
                buff("iteratorMarker " + iteratorMarker);
                buff(err);
                modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "error": err } });
    
            } else {
     
                var flattened=results.reduce(function(a, b) {
                    return a.concat(b);
                }); 
                //filter by dates
                var events = flattened.filter(function (elem, i, array) {
                    if(elem.event!==undefined && elem.event.start!==undefined)      
                    {  
                        return new Date(elem.event.start.date)>=new Date(settings.SongKickStartDate) && new Date(elem.event.start.date)<=new Date(settings.SongKickEndtDate);
                    }
                    return false;    
    
                });
                //filter by bands
                var events = events.filter(function (elem, i, array) {
                    if(elem.event_title!=undefined) {
                        return artistList.indexOf(elem.event_title.toLowerCase())>-1;
                    } 
                    return false;
    
                });            
    
                buff("Results: " + flattened.length);
                buff("Events: " + events.length);
                buff("*********************FINISHED WITH SUCCESS*********************");
    
                //console.log(events);
                modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });
    
    
            }
        });


}


function findSongKickEventsTotal(data) {
    var json = JSON.parse(data);
    var totalEntries = json.resultsPage.totalEntries;
    if (!totalEntries)
        totalEntries = 0;
    return totalEntries;
}

function getSongKickEventsCity(data) {
    var json = JSON.parse(data);
    var totalEntries = json.resultsPage.totalEntries;
    if (!totalEntries) 
        totalEntries = 0;
    if (totalEntries > 0) {
        return json.resultsPage.results.location[0].metroArea.id;
    } else {
        return 0;
    } 
}



function makeKickRequest(pageNumber, callback) {
    var cityID=modelCurrent.KickcityID;
    makeRequest(settings.SongKickUrl.replace("CITY_ID", cityID).replace("PAGE_NUMBER", encodeURI(pageNumber)), { callback: callback }, findSongKickEventsPage, callbackErrorGeneral);
}

function findSongKickEventsPage(data) {

    var foundEvents = [];
    var json = JSON.parse(data);

 
    //buff("data");
    //buff(json.length);

    //HERE BE SOME ERROR CATCHING
    foundEvents = json.resultsPage.results.event.filter(function (elem, i, array) {
        return elem.performance.length > 0;
    }).map(function (elem) {
        return { "event_title": elem.performance[0].displayName, "event": elem };
    });

    return foundEvents;
}





function findBandsinTownEvents(artistList, timeOut = true) {
    iteratorMarker = 0;
    if (!artistList)
        artistList = ["rage"]; //dummy list

    var requestFunction;
    if (timeOut)
        requestFunction = makeBandRequestTimeOut;
    else
        requestFunction = makeBandRequest;

    //Serial
    async.mapSeries(artistList, requestFunction, function (err, results) {
        //True async    
        //async.map(artistList, requestFunction, function (err, results) {
        if (err) {
            buff("*********************FINISHED WITH ERROR**************************");
            buff("iteratorMarker " + iteratorMarker);
            buff(err);
            modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "error": err } });

        } else {
            var events = results.filter(function (elem, i, array) {
                return elem.length > 0;
            });
            //remove inner arrays
            events = events.map(function (elem) {
                return elem[0];
            });


            //Filter with unique IDs
            uniqueIds = [];
            events = events.filter(function (elem, i, array) {
                if (uniqueIds.indexOf(elem.event.id) >= 0)
                    return false;
                else
                    uniqueIds.push(elem.event.id);
                return true;
            });




            buff("Results: " + results.length);
            buff("Events: " + events.length);
            buff("*********************FINISHED WITH SUCCESS*********************");

            //console.log(events);
            modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });


        }
    });


}
function makeBandRequest(artistName, callback) { //callback is callback for async
    //buff("Searching for "+artistName);    
    makeRequest(settings.BandsInTownUrl.replace("ARTIST_NAME", encodeURI(artistName)), { callback: callback }, findBrandsinTownEvent, callbackErrorGeneral);

}


function makeBandRequestTimeOut(artistName, callback) {

    setTimeout(function () {
        //buff("Searching for "+artistName);    
        makeRequest(settings.BandsInTownUrl.replace("ARTIST_NAME", encodeURI(artistName)), { callback: callback }, findBrandsinTownEvent, callbackErrorGeneral);
    }, Math.random() * settings.BandsInTownTimeOutTime);
}


function findBrandsinTownEvent(data) { //sync function

    var foundEvents = [];
    var json = JSON.parse(data);

    iteratorMarker++

    //buff("data");
    //buff(json.length);

    if (json && json.length > 0 && (typeof (json.errors) == "undefined")) {
        foundEvents = json.map(function (elem) {
            return { "event_title": elem.title, "event": elem };
        });
    } else {
        if (typeof (json) == "object" && json.errors && json.errors.length > 0) {
            //If error return immediately
            return json.errors[0]; //if not UNKNOWN ARTIST! TODO
        }
    }
    return foundEvents;
}







function makeEventfulRequest(pageNumber, callback) {
    makeRequest(settings.eventfulURL+"&page_number="+pageNumber, { callback: callback }, findEventfulEventsPage, callbackErrorGeneral);
}

function findEventfulEventsPage(data) {

    var foundEvents = [];
    var json = JSON.parse(data);

 
    //buff("data");
    //buff(json.length);

    //HERE BE SOME ERROR CATCHING
    foundEvents = json.events.event.map(function (elem) {
        return { "event_title": elem.title, "event": elem };
    });

    return foundEvents;
}

 
function findEventfulStart(data, url, artistList) {
    var json = JSON.parse(data);
    var pages=json.page_count;

    if(pages && pages==1)
        findEventfulFinish(json.events,artistList);
    if(!pages)    
        findEventfulFinish([],artistList);
    if(pages>1)    {
        var pagesArray = Array(pages*1).fill(0).map((e, i) => i + 1);

       async.map(pagesArray, makeEventfulRequest, function (err, results) {
            if (err) {
                buff("*********************FINISHED WITH ERROR**************************");
                buff("iteratorMarker " + iteratorMarker);
                buff(err);
                modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "error": err } });
    
            } else {
                var flattened=results.reduce(function(a, b) {
                    return a.concat(b);
                }); 

                //filter by bands
                var events = flattened.filter(function (elem, i, array) {
                    if(elem.event_title!=undefined) {
                        return artistList.indexOf(elem.event_title.toLowerCase())>-1;
                    } 
                    return false;
    
                });            
    
                buff("Results: " + flattened.length);
                buff("Events: " + events.length);
                buff("*********************FINISHED WITH SUCCESS*********************");
    
                //console.log(events);
                modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });
    
    
            }
        });

    }


 

}

function findEventfulFinish(eventsArray,artistList) {
    buff("Eventful Finish");
    if(eventsArray.length==0)
        modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": [] } });
    else {
        buff("Total "+eventsArray.event.length);

        foundEvents = eventsArray.event.map(function (elem) {
            return { "event_title": elem.title, "event": elem };
        });
        buff("Total foundEvents "+foundEvents.length);
        var events = foundEvents.filter(function (elem, i, array) {
            if(elem.event_title!=undefined) {
                return artistList.indexOf(elem.event_title.toLowerCase())>-1;
            } 
            return false;

        });        
        buff("Events "+events.length);
        modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });

        }

}





function makeTicketMasterRequest(pageNumber, callback) {
    makeRequest(settings.TicketMasterUrl+"&page="+pageNumber, { callback: callback }, findTicketMasterPage, callbackErrorGeneral);
}




function findTicketsTicketMaster(data, url, artistList) {

 
    var json = JSON.parse(data);
    buff("Results: " + json._embedded.events.length);
    buff("Total: " + json.page.totalElements);
    if (json.page.totalElements < 1) {
        buff("*********************FINISHED WITH SUCCESS*********************");
        buff("*********************ZERO EVENTS FOUND*********************");

        modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": [] } });

        return false;
    }


        var pages=json.page.totalPages;
        var pagesArray = Array(pages*1).fill(0).map((e, i) => i);

       async.map(pagesArray, makeTicketMasterRequest, function (err, results) {
            if (err) {
                buff("*********************FINISHED WITH ERROR**************************");
                buff("iteratorMarker " + iteratorMarker);
                buff(err);
                modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "error": err } });
    
            } else {
                var flattened=results.reduce(function(a, b) {
                    return a.concat(b);
                }); 

                //filter by bands
                 var events = flattened.filter(function (elem, i, array) {
                    if(elem.event_title!=undefined) {
                         return artistList.indexOf(elem.event_title.toLowerCase())>-1;
                    } 
                    return false;
    
                });            
    
                buff("Results: " + flattened.length);
                buff("Events: " + events.length);
                buff("*********************FINISHED WITH SUCCESS*********************");
    
                //console.log(events);
                modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });
    
    
            }
        });
 
}


function findTicketMasterPage(data) {
    var foundEvents = [];
    var json = JSON.parse(data);
 
 
    //buff("data");
    //buff(json.length);

    //HERE BE SOME ERROR CATCHING
    foundEvents =  json._embedded.events.map(function (elem) {
        return { "event_title":  elem.name, "event": elem };
    });

    return foundEvents;
}


function findTicketMasterEurope(data, url, artistList) {

    var json = JSON.parse(data);

    buff("Results: " + json.events.length);
    if (json.pagination.total < 1) {
        buff("*********************FINISHED WITH SUCCESS*********************");
        buff("*********************ZERO EVENTS FOUND*********************");

        modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": [] } });

        return false;
    }


    var concerts = json.events;

    var events = concerts.map(function (concert) {
        // buff(concert.name.toLowerCase());
        if (artistList.indexOf(concert.name.toLowerCase()) > -1) {
            event = concert;
            event.event_title = concert.name + " " + concert.eventdate.value;
            event.event = {};
            event.event.id = concert.id;
        }
        else {
            event = false;
        }

        return event;

    });
    events = events.filter(function (elem, i, array) {
        return elem !== false;
    });

    buff("*********************FINISHED WITH SUCCESS*********************");

    buff("Events: " + events.length);

    modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });
}


















/*HELPER FUNCTIONS*/
 
function makeRequest(url, params, callbackSuccess, callbackError) {
    //buff("making request to URL: "+url);

    //gather httpParams start
    var url_instance = new URIlib.URI(url);
    var transport = (url_instance.getScheme() || "").toLowerCase() === "https" ? https : http;
    var queryParams = url_instance.parseQuery();
    var httpParams = {
        host: url_instance.getAuthority(),
        headers: { 'user-agent': 'Mozilla/5.0' }
    }
    httpParams.path = (url_instance.getPath() || "") + "?" + queryParams.toString();
    //gather httpParams end



    var transpot_info = transport.get(httpParams, function (result) {
        var data = "";
        result.on("data", function (chunk) {
            data += chunk;
        }).on("end", function () {
            var result = callbackSuccess(data, url, params); //sync function - do something with data (like get city)
            if (params && typeof (params.callback) == "function") { //if we need async callback - pass result here
                var err = null;
                if (typeof (result) == "string")
                    err = result;
                params.callback(err, result); 
            }
        })

    }).on('error', function (e) { callbackError(e, url, params) });

}




function callbackErrorGeneral(e) {
    buff("Callback Error:");
    buff(e);
}









function logError(err, result) {
    if (err) {
        buff("");
        buff("Error: ");
        buff(err);
        console.trace();
        buff("");
    }
}



function buff(object) {
    console.log(object);
    if (object && typeof (object) != "string")
        epicBuffer += "\n\r" + object.toString();
    else
        epicBuffer += "\n\r" + object;
}