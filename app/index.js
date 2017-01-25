
var epicBuffer = "";

const express = require('express');
const bodyParser = require('body-parser')

const http = require('http');
const https = require("https");
const URIlib = require('./URI')
const url = require('url');
const fs = require('fs-extra');

const nodemailer = require('nodemailer');
const later = require('later');

const request = require('request');
const async = require('async');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const session = require('express-session');


const TripItApiClient = require("tripit-node");
var TripItClient = new TripItApiClient("a90d6eda3798d491a24bb57fcaa5bb4cd10642e5", "9653c259420ba6c242527151175d01ded2765f5a");
var requestTokenSecrets = {};


const app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'));
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }, resave: true, saveUninitialized: true }))


var sess;
















var client_id = '75ff063399cf492199d40d630060fbce'; // Your client id
var client_secret = 'a9b8d76f15ef497aa27b8596d9b372be'; // Your secret
var redirect_uri = 'http://localhost:3000/spotifycallback'; // Your redirect uri




var SpotifyWebApi = require('spotify-web-api-node');

// credentials are optional
var spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: redirect_uri
});
var scopes = ['user-read-private', 'user-read-email', 'user-follow-read'];
var state = 'test-state';




const MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb').ObjectID;

var mongo_url = "mongodb://root:1234@ds111589.mlab.com:11589/travel_play";

var db;


MongoClient.connect(mongo_url, (err, database) => {
    if (err) return buff(err)
    db = database
    app.listen(3000, () => {
        buff('listening on 3000');
        GetfakeCall("APIURL",{},[],{_id:"588738df79ec3c0b3409d8ef",code:"saJQKcJuLFAdAklGOrtmzjFNj5q5D6IJ"});

    })
}) 






var useModules = {};
useModules.useTripIt = true;
useModules.useSpotify = true;

useModules.useBandsInTown = false;
useModules.useTicketMaster = false;
useModules.useTicketMasterEurope = false;
useModules.useSongKick = false;
useModules.useEventful = false;


var modelCurrent = {};

var settings = {};

settings.appUrl="http://localhost:3000/";

settings.adminMail = "amantels@gmail.com";

settings.superSecretKey = "Bfsd39_ersxddg";

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


settings.TicketMasterEuropeRows = 20;
settings.TicketMasterEuropeUrl = "https://livenation-test.apigee.net/mfxapi-stage/events?apikey=" + settings.TicketMasterKey
    + "&eventdate_from=2016-01-01T10:00:00Z"
    + "&rows=" + settings.TicketMasterEuropeRows
    + "&domain_ids=sweden"
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

settings.testBands = ["rage", "accept", "voltaire", "metallica", "tessa lark", "insurance test 3", "perry", "anthrax", "sing-a-long"];

settings.tripItCallback = "http://localhost:3000/tripitcallback";


settings.eventfulApiKey = "XTVn27FZsPVWTKdx";
settings.eventfulURL = "http://api.eventful.com/json/events/search?app_key=" + settings.eventfulApiKey + "&location=Stockholm&date=2017010100-2017063000&category=music&page_size=20"; //250


settings.spotifyApiUrl = spotifyApi.createAuthorizeURL(scopes, state);






app.post('/save_user', (req, res) => {
    //check if old email


    var json = req.body;
    json.email = json.email.trim();
    //check if there is this email
    //db.users.find({active:{$eq:"1"}}).pretty()
    //
    db.collection('users').find({ email: { $eq: json.email } }).toArray(function (err, result) {

        if (!err) {
            //buff(result)
            if (result.length > 0) {
                buff("There is this email");
                json["_id"] = new ObjectID(result[0]._id);
                db.collection('users').update({ _id: json["_id"] }, { $set: { trips: json.trips, bands: json.bands } }
                    , (err, result) => {
                        if (err) {
                            res.send({ error: err });
                        }

                        buff('saved to database')
                        res.send("OK");
                    });


            }
            else {
                buff("New User. No email found");
                json.password = generatePass();
                db.collection('users').save(json, (err, result) => {
                    if (err) {
                        res.send({ error: err });
                    }

                    buff('saved to database')
                    res.send("OK");
                });
            }






        }
        else {
            res.send({ error: err });

        }
    });


})

















app.get('/tripitrequesttoken', (req, res) => {

    TripItClient.getRequestToken().then(function (results) {
        var token = results[0],
            secret = results[1];
        requestTokenSecrets[token] = secret;
        var requestUrl = "https://www.tripit.com/oauth/authorize?oauth_token=" + token + "&oauth_callback=" + settings.tripItCallback;

        res.redirect(requestUrl);
    }, function (error) {
        res.send(error);
    });

});


app.get('/tripitcallback', (req, res) => {
    var sess = req.session;
    //res.send({oauth_token:req.query.oauth_token});
    var token = req.query.oauth_token,
        secret = requestTokenSecrets[token],
        verifier = null;
    TripItClient.getAccessToken(token, secret, verifier).then(function (results) {
        var accessToken = results[0],
            accessTokenSecret = results[1];

        sess.tripItAccessToken = accessToken;
        sess.tripItAccessTokenSecret = accessTokenSecret;

        res.redirect("/");

    }, function (error) {
        res.send(error);
    });

});



app.all('/admin_login', (req, res) => {
    sess = req.session;


    if (req.body.password || null) {


        if (req.body.password == settings.superSecretKey) {
            sess.auth = "2"; //AUTH COMPLETED


            res.redirect('/users');
        } else {
            res.render('admin_login.ejs', { authError: "Wrong Password" });
        }

    }
    else {
        res.render('admin_login.ejs', { authError: "" });
    }
})


app.all('/login', (req, res) => {
    sess = req.session;

    if ((req.body.login || null) && (req.body.password || null) && (req.body.email || null)) {
        db.collection('users').find({
            email: { $eq: req.body.email },
            password: { $eq: req.body.password }
        }).toArray(function (err, result) {

            if (!err) {
                if (result.length > 0) {
                    buff("USER FOUND");

                    if (result[0].approved) {
                        buff("USER AUTHED");
                        sess.auth = "1"; //AUTH COMPLETED
                        sess.authed_user = result[0];
                        sess.authed_user.current_auth = sess.auth;
                        res.redirect("/");
                    } else {
                        sess.auth = "0";
                        sess.authed_user = {};
                        buff("Not approved");
                        res.render('login.ejs', { authError: "User not approved", authSuccess: "" })

                    }
                }
                else {
                    sess.auth = "0";
                    sess.authed_user = {};
                    buff("Wrong credentials");
                    res.render('login.ejs', { authError: "Wrong credentials", authSuccess: "" });
                }

            }
            else {
                res.send({ error: err });

            }
        });

    }
    else if ((req.body.registration || null) && (req.body.email || null)) {
        db.collection('users').find({
            email: { $eq: req.body.email }
        }).toArray(function (err, result) {

            if (!err) {
                if (result.length > 0) {
                    buff("USER FOUND");
                    res.render('login.ejs', { authError: "EMAIL IN USE", authSuccess: "" });
                }
                else {
                    var new_user = {};
                    new_user.password = generatePass();
                    new_user.active = 1;
                    new_user.approved = 0;
                    new_user.email = req.body.email;
                    new_user.trips = [];
                    new_user.bands = [];
                    new_user.update = new Date().toString();
                    db.collection('users').save(new_user, (err, result) => {
                        if (err) {
                            res.render('login.ejs', { authError: err, authSuccess: "" });
                        }

                        buff('saved to database');

                        var html = '<html><body>Visit <a href="http://localhost:3000/users" target="_blank"> here </a></body></html>';

                        sendMail(settings.adminMail, "New registration on TravelPlay", html);


                        res.render('login.ejs', { authError: "", authSuccess: "SUCCESS" });
                    });


                    //                            
                }

            }
            else {
                res.send({ error: err });
            }
        });

    }
    else {
        res.render('login.ejs', { authError: "", authSuccess: "" });
    }




})




app.post("/approve_user", (req, res) => {
    if ((req.body.save || null) && (req.body.id || null)) {
        var approved = 0;
        if (req.body.approved)
            approved = 1;
        var id = new ObjectID(req.body.id);

        db.collection('users').update({ _id: id }, { $set: { approved: approved } }
            , (err, result) => {
                if (err) {
                    res.send({ error: err });
                }

                buff('saved to database');

                if ((req.body.email || null) && approved) {
                    var password = (req.body.password || null)
                    var html = '<html><body>You can now access TravelPlay with your email and password: ' + password + ' </body></html>';

                    sendMail(req.body.email, "Approved on TravelPlay", html);
                }


                res.redirect("/users");
            });
    }

});

app.get('/users', (req, res) => {

    sess = req.session;





    db.collection('users').find().toArray(function (err, result) {

        if (!err) {

            result.sort(function (a, b) {
                if (a.approved > b.approved) {
                    return 1;
                }
                if (a.approved < b.approved) {
                    return -1;
                }
                return 0;
            });

            res.render('users.ejs', { result: result });




        }
        else {
            res.send({ error: err });
        }
    });



})



app.get('/spotifycallback', (req, res) => {
    sess = req.session;

    if (spotifyApi.getAccessToken()) {
        sess.spotifyAuthed = true;
        res.redirect('/');
    }
    else {
        spotifyApi.authorizationCodeGrant(req.query.code || null).then(function (authInfo) {
            spotifyApi.setAccessToken(authInfo.body['access_token']);
            spotifyApi.setRefreshToken(authInfo.body['refresh_token']);
            sess.spotifyAuthed = true;
            res.redirect('/');
        });
    }

});







app.get('/index', (req, res) => {
    sess = req.session;


    modelCurrent.res = res;

    res.render('index.ejs', { session: sess, auth_url: settings.spotifyApiUrl });


})

app.get('/', (req, res) => {
    sess = req.session;




    modelCurrent.res = res;




    res.render('index.ejs', { session: sess, auth_url: settings.spotifyApiUrl });


})



app.get('/tripittrips', (req, res) => {
    sess = req.session;


    TripItClient.requestResource("/list/trip", "GET", sess.tripItAccessToken, sess.tripItAccessTokenSecret).then(function (results) {
        var response = JSON.parse(results[0]);
        var trips = [];
        response.Trip.forEach(function (pre_trip) {
            var trip = {};
            trip.city = pre_trip.PrimaryLocationAddress.city.toLowerCase();
            trip.start = pre_trip.start_date;
            trip.end = pre_trip.end_date;
            trip.country = pre_trip.PrimaryLocationAddress.country.toLowerCase();
            trips.push(trip);
        });

        res.render('trips.ejs', { tripItResult: trips });
    }).catch(function (reason) {
        buff(reason);
        res.send({ result: [], err: "App not authed in TripIt" });
    });

});


app.get('/getspotifyartists', (req, res) => {
    sess = req.session;

    if (spotifyApi.getAccessToken()) {
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

                buff("Followed and Related (c) Spotify: " + all_artists.distinct_list.length);

                //res.send({result:all_artists.distinct_list, err:""});
                res.render('artists.ejs', { spotifyResult: all_artists.distinct_list });

            });

        });
    }
    else {
        res.send({ result: [], err: "App not authed in Spotify" });
    }

});



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
            sess.spotifyResult = all_artists.distinct_list;
            modelCurrent.res.redirect("/");
            //findEvents(all_artists.distinct_list);
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

        //findEvents(all_artists.distinct_list);
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
        findTicketMasterEuropeEventsStart(artistList, "", "");



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
    buff("cityName " + cityName);


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

        function (cityID, callback) {
            var url = settings.SongKickUrl.replace("CITY_ID", cityID).replace("PAGE_NUMBER", 1);
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    var totalEntries = json.resultsPage.totalEntries;
                    if (!totalEntries)
                        totalEntries = 0;
                    callback(null, totalEntries, cityID);
                }
            })

        }

    ], function (err, totalEntries, cityID) {
        buff("totalEntries " + totalEntries);
        buff("cityID " + cityID);

        var N = Math.ceil(totalEntries / 50);
        var pagesArray = Array(N).fill(0).map((e, i) => i + 1);
        findSongKickEventsFinal(artistList, cityID, pagesArray);

    });
}


function findSongKickEventsFinal(artistList, cityID, pagesArray) {
    var requestFunction = makeKickRequest;
    modelCurrent.KickcityID = cityID;
    async.map(pagesArray, requestFunction, function (err, results) {
        if (err) {
            buff("*********************FINISHED WITH ERROR**************************");
            buff("iteratorMarker " + iteratorMarker);
            buff(err);
            modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "error": err } });

        } else {

            var flattened = results.reduce(function (a, b) {
                return a.concat(b);
            });
            //filter by dates
            var events = flattened.filter(function (elem, i, array) {
                if (elem.event !== undefined && elem.event.start !== undefined) {
                    return new Date(elem.event.start.date) >= new Date(settings.SongKickStartDate) && new Date(elem.event.start.date) <= new Date(settings.SongKickEndtDate);
                }
                return false;

            });
            //filter by bands
            var events = events.filter(function (elem, i, array) {
                if (elem.event_title != undefined) {
                    return artistList.indexOf(elem.event_title.toLowerCase()) > -1;
                }
                return false;

            });

            buff("Results: " + flattened.length);
            buff("Events: " + events.length);
            buff("*********************FINISHED WITH SUCCESS*********************");

            //buff(events);
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
    var cityID = modelCurrent.KickcityID;
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

            //buff(events);
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
    makeRequest(settings.eventfulURL + "&page_number=" + pageNumber, { callback: callback }, findEventfulEventsPage, callbackErrorGeneral);
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
    var pages = json.page_count;

    if (pages && pages == 1)
        findEventfulFinish(json.events, artistList);
    if (!pages)
        findEventfulFinish([], artistList);
    if (pages > 1) {
        var pagesArray = Array(pages * 1).fill(0).map((e, i) => i + 1);

        async.map(pagesArray, makeEventfulRequest, function (err, results) {
            if (err) {
                buff("*********************FINISHED WITH ERROR**************************");
                buff("iteratorMarker " + iteratorMarker);
                buff(err);
                modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "error": err } });

            } else {
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

                buff("Results: " + flattened.length);
                buff("Events: " + events.length);
                buff("*********************FINISHED WITH SUCCESS*********************");

                //buff(events);
                modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });


            }
        });

    }




}

function findEventfulFinish(eventsArray, artistList) {
    buff("Eventful Finish");
    if (eventsArray.length == 0)
        modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": [] } });
    else {
        buff("Total " + eventsArray.event.length);

        foundEvents = eventsArray.event.map(function (elem) {
            return { "event_title": elem.title, "event": elem };
        });
        buff("Total foundEvents " + foundEvents.length);
        var events = foundEvents.filter(function (elem, i, array) {
            if (elem.event_title != undefined) {
                return artistList.indexOf(elem.event_title.toLowerCase()) > -1;
            }
            return false;

        });
        buff("Events " + events.length);
        modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });

    }

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


    var pages = json.page.totalPages;
    var pagesArray = Array(pages * 1).fill(0).map((e, i) => i);

    async.map(pagesArray, makeTicketMasterRequest, function (err, results) {
        if (err) {
            buff("*********************FINISHED WITH ERROR**************************");
            buff("iteratorMarker " + iteratorMarker);
            buff(err);
            modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "error": err } });

        } else {
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

            buff("Results: " + flattened.length);
            buff("Events: " + events.length);
            buff("*********************FINISHED WITH SUCCESS*********************");

            //buff(events);
            modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });


        }
    });

}



function makeTicketMasterRequest(pageNumber, callback) {
    makeRequest(settings.TicketMasterUrl + "&page=" + pageNumber, { callback: callback }, findTicketMasterPage, callbackErrorGeneral);
}



function findTicketMasterPage(data) {
    var foundEvents = [];
    var json = JSON.parse(data);


    //buff("data");
    //buff(json.length);

    //HERE BE SOME ERROR CATCHING
    foundEvents = json._embedded.events.map(function (elem) {
        return { "event_title": elem.name, "event": elem };
    });

    return foundEvents;
}






function findTicketMasterEuropeEvents(pagesArray, artistList, dates = "", city = "") {


    async.map(pagesArray, (pageNumber, callback) => {
        makeRequest(settings.TicketMasterEuropeUrl + "&start=" + pageNumber, { callback: callback }, (data) => {
            return foundEvents = JSON.parse(data).events.map(function (elem) {
                return { "event_title": elem.name, "event": elem };
            });
        }, callbackErrorGeneral);
    }, function (err, results) {
        if (err) {
            buff("*********************FINISHED WITH ERROR**************************");
            buff(err);
            modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "error": err } });

        } else {
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

            buff("Results: " + flattened.length);
            buff("Events: " + events.length);
            buff("*********************FINISHED WITH SUCCESS*********************");

            //buff(events);
            modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });


        }
    });

}






function findTicketMasterEuropeEventsStart(artistList, dates = "", city = "") {

    //1 CHANGE URL WITH DATE AND CITY 
    //----

    async.waterfall([
        //2 GET TOTAL ITEMS           
        function (callback) {
            var url = settings.TicketMasterEuropeUrl;
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    if (JSON.parse(body).pagination.total > 0) {
                        callback(null, JSON.parse(body).pagination.total);
                    } else {
                        //ZERO EVENTS FOUND
                        modelCurrent.res.render('index.ejs', { result: { "events": [] } });
                        return false;
                    }
                } else {
                    if (error)
                        callback(error, 0);
                    else if (response.statusCode != 200)
                        callback("statusCode = " + response.statusCode, 0);
                }
            })
        }
        //GET EVENTS
    ], function (err, totalEntries) {
        if (!err) {

            var N = Math.ceil(totalEntries / settings.TicketMasterEuropeRows);
            var pagesArray = Array(N * 1).fill(0).map((e, i) => i * settings.TicketMasterEuropeRows);

            findTicketMasterEuropeEvents(pagesArray, artistList, dates, city);


        } else {
            buff("ERROR");
            buff(err);
        }


    });


}

app.get('/deactivate', (req, res) => {
    sess = req.session;
    if(sess.auth==1)
        {
            if(sess.authed_user) {
                var id = new ObjectID(sess.authed_user._id);
                buff(id);

                db.collection('users').update({ _id: id }, { $set: { active: 0 } }
                    , (err, result) => {
                        if (err) {
                            res.send({ error: err });
                        }

                        buff('deactivated')
                        res.send("OK");
                    });
            }

        } else {
            res.redirect("/");
        }
    
});

app.get('/protected', (req, res) => {
    sess = req.session;
    var r=req.query.r || null;
    
    if(sess.auth>0)
        if(r)
            res.redirect("/"+r);
        else        
            res.send("authed");    
    else   
    {
        //here we try auth
        if ((req.query.code || null))
        {
            var code=req.query.code;
            db.collection('users').find({
                        code: { $eq: code }
                    }).toArray(function (err, result) {

                        if (!err) {
                            if (result.length > 0) {
                                buff("USER FOUND");

                                if (result[0].approved) {
                                    buff("USER AUTHED");
                                    sess.auth = "1"; //AUTH COMPLETED
                                    sess.authed_user = result[0];
                                    sess.authed_user.current_auth = sess.auth;
                                    if(r)
                                        res.redirect("/"+r);
                                    else        
                                        //res.send(sess.authed_user);   
                                        res.send(sess.authed_user.matches);   
                                    
                                } else {
                                    sess.auth = "0";
                                    sess.authed_user = {};
                                    buff("Not approved");
                                    if(r)
                                        res.redirect("/"+r);
                                    else        
                                        res.send("Found but not approved");                                    
                                }
                            }
                            else {
                                sess.auth = "0";
                                sess.authed_user = {};
                                buff("Wrong credentials");
                                if(r)
                                    res.redirect("/"+r);
                                else        
                                    res.send("Not Found");                           
                                
                            }

                        }
                        else {
                            res.send({ error: err });

                        }
                    });
        }
        else {
            res.send("error - no auth");     
        }
            
       
    }    
        
 
    //unlogin        
    sess.auth=0; 
    sess.authed_user = {};


});



//SongKick for non US, Eventful & TicketMaster for US.
function findEvents(user) {
    var trips=user.trips || null;
    var bands=user.bands || null;

    if(!(trips & bands)) {
        buff("nothing to search for");
        return false;
    }

    buff("Trips: "+trips.length+" Bands: "+bands.length);

    artistList=bands.map(function(el,i){
        return el.band;
    });
    
    if(artistList.length<20)
    {
        buff("bands to few for test");
        return false;
    }

    trips.forEach(function (trip) {
        var apiUrl="";
        apiUrl="http://testurl.text/"+"?city="+trip.city+"&start="+trip.start+"&end="+trip.end;
         
        if(isUS(el.country)) {
            //Eventful + Tickemaster
             GetfakeCall(apiUrl,trip,artistList);
            
        } else {
            //SongKick
             GetfakeCall(apiUrl,trip,artistList);
        }
       
       
        


    });

}



//GetfakeCall("APIURL",{},[],{});

function GetfakeCall(apiUrl,trip,artistList,user) {
    if(artistList.length==0) {
        for(i=0;i<21;i++) {
            artistList.push("band name X="+i);
        }
    }
    //OK we have JSON with X (11-60) "events". Let us populate them.

    var bandNameFound1=artistList[Math.floor(Math.random()*8)+1];
    var bandNameFound2=artistList[Math.floor(Math.random()*10)+8];

    var N=Math.round(Math.random()*50)+10;
    var fakeEvents=[];
    var foundEvents=[];
    for(i=0;i<N;i++) {

        var event={};
        event.id=randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');               
        event.text="RANDOM TEXT FOR TEST";
        event.date="RANDOM DATE FOR TEST";     

        if(Math.floor(Math.random()*10)+1==10) {
            
            if(Math.round(Math.random())==1)
                event.text=bandNameFound1;
            else
                event.text=bandNameFound2;   

            foundEvents.push(event);    
        }

   
        fakeEvents.push(event);   
    }
    if(foundEvents.length>0)
        saveEvents(user,foundEvents);
   // buff(fakeEvents);
    // buff("***************************");
    buff(foundEvents);    
    
    var folder_name=new Date().toISOString().slice(0,19).replace(/:/g, '_').replace(/-/g, '_');
    var dir="./tech/"+folder_name+"/";
    fs.ensureDir(dir, function (err) {
        if(err) {
            buff(err) // => null  
            return false;  
        } else {
            fs.writeFile(dir+"result.json", JSON.stringify(fakeEvents), function (err) {
                if (err) {
                    buff(err);
                    return false;
                }

                //buff("The file was saved!");
            });   
            fs.writeFile(dir+"apiurl.json", apiUrl, function (err) {
                if (err) {
                    buff(err);
                    return false;
                }

                //buff("The file was saved!");
            });              
            fs.writeFile(dir+"found.json", JSON.stringify(foundEvents), function (err) {
                if (err) {
                    buff(err);
                    return false;
                }

               // buff("The file was saved!");
            });                        
        }
    
    
    })
    

}

function saveEvents(user,foundEvents) {
    var id = new ObjectID(user._id);
    var code=user.code;
    foundEvents=foundEvents.map(function(el,i){
        var match={}; 
        match.event=el;
        match.date=new Date().toString();
        return match;
    });
     

    db.collection('users').update({ _id: id }, { $push: { matches:  { $each: foundEvents } } }
        , (err, result) => {
            if (err) {
                buff(err);
            }

            buff('saved to database')
            var html = '<html><body>Visit <a href="http://localhost:3000/protected?code='+code+'" target="_blank"> TravelPlay </a> for new matches</body></html>';

            sendMail(settings.adminMail, "New matches on TravelPlay", html);
        });
 

}


/*HELPER FUNCTIONS*/


//saJQKcJuLFAdAklGOrtmzjFNj5q5D6IJ
//buff(randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')); 
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}



function sendMail(email, subject, html) {

    var smtpConfig = {
        host: 'smtp.yandex.ru',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: 'tp@muchstudio.ru',
            pass: 'ojR5zSY3D0' 

        }
    };
    var transporter = nodemailer.createTransport(smtpConfig);
    var mailData = {
        from: 'tp@muchstudio.ru',
        to: email,
        subject: subject,
        text: 'Only HTML here, sorry',
        html: html
    };

    transporter.sendMail(mailData);

    buff('mail sent');
    return true;

};






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


function generatePass() {
    return Math.random().toString(36).slice(-8);
}



function asyncExample() {



    async.waterfall([

        function (callback) {
            var url = settings.SongKickLocationUrl.replace("CITY_NAME", cityName);
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    if (totalEntries > 0) {

                        callback(null, json.resultsPage.results.location[0].metroArea.id); //CHECK. JSON, not BODY???
                    } else {
                        callback("city not found", 0);
                    }
                }
            })
        },

        function (cityID, callback) {
            var url = settings.SongKickUrl.replace("CITY_ID", cityID).replace("PAGE_NUMBER", 1);
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    callback(null, totalEntries, cityID);
                }
            })

        }

    ], function (err, totalEntries, cityID) {
        findSongKickEventsFinal(artistList, cityID, pagesArray);

    });

}

/*FAKE FUNCTIONS*/

//- FOR TOP ALBUMS;
//getTopAlbums(200);
function getTopAlbums(n) {
    var url = "https://itunes.apple.com/us/rss/topalbums/limit=" + n + "/json";
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            var artists = [];
            json.feed.entry.forEach(function (entry) {
                artists.push(entry["im:artist"].label);
            });

            artists = Array.from(new Set(artists));

            fs.writeFile("../bands.json", artists, function (err) {
                if (err) {
                    return buff(err);
                }

                buff("The file was saved!");
            });


        }
    })
}

//getTopAlbumsFromFile();

function getTopAlbumsFromFile() {
    var array = fs.readFileSync("bands.json").toString().split(',');
    array=array.map(function(el,i){

        return {"band": el.toLowerCase(), "additional_info": {"band_name_original":el} }

        
    });

    var groupSize = Math.ceil(array.length / 5); //split to 5 users


    var groups = array.map(function (item, index) {

        return index % groupSize === 0 ? array.slice(index, index + groupSize) : null;
    })
        .filter(function (item) {
            return item;

        });
    return groups;
}



//!!! Be careful with non UTF symbols Test Them
//getTravelsFromFile();
function getTravelsFromFile() {
    var json = JSON.parse(fs.readFileSync("travelsShort.json").toString());
 

    var trips = json.map(function (el, i) {
        el.start = el.date;
        delete el.date;
        var date_start = new Date(el.start)
        var date_end = new Date(date_start.setDate(date_start.getDate() + Math.round(Math.random() * 37 + 2)));
        el.end = date_end.toISOString().substring(0, 10);
        return el;
    });

    var groupSize = Math.ceil(trips.length / 5); //split to 5 users


    var groups = trips.map(function (item, index) {

        return index % groupSize === 0 ? trips.slice(index, index + groupSize) : null;
    })
        .filter(function (item) {
            return item;

        });
   
    return groups;

}

function isUS(country) {
    country = country.toLowerCase();
    if (country = "us" || country == "united states")
        return true;
    else
        return false;

}


function getUsersFromFiles() {
    var bandsGroups=getTopAlbumsFromFile();
    var tripsGroups=getTravelsFromFile();

 
    var users=tripsGroups.map(function(el,i){
        var user={};
        user.email = "amantels@gmail.com";
        user.password = "D12345A";        
        user.active = 1;        
        user.approved = 1;        
        user.updateDate = "Sun Jan 24 2017 17:19:17 GMT+0300 (Russia TZ 2 Standard Time)";
        user.bands=bandsGroups[i];
        user.trips=el;

        //buff("***************");
        //buff(user);
        return user;

    });
    return users;

}

app.get('/save_user_special', (req, res) => {
    var users=getUsersFromFiles();

    async.map(users, function(user,callback) {
        
        db.collection('users').save(user, (err, result) => {
            if (err) {
                callback(err, "NOT OK");
            }

            buff('saved to database')
            callback(null, "OK");
        });

    }, function(err, results) {
        
        res.send("OK");
    });

})


   
