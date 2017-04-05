
const express = require('express');
const bodyParser = require('body-parser');

const http = require('http');
const https = require("https");
const URIlib = require('./URI');
const url = require('url');

const later = require('later');

const request = require('request');
const async = require('async');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const session = require('express-session');

/*Inner modules*/
const apis = require("./apis");
const tech = require("./tech");
const settings = require("./settings");
const fakes = require("./fakes");
const server_settings = require("./server_setting");
const fs = require('fs-extra');


var SpotifyWebApi = require('spotify-web-api-node');
var tripItApiClient = require("tripit-node");



const app = express();
app.set('views', __dirname + "/../views");
app.set('trust proxy', 'loopback');


app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));


app.use(express.static(__dirname + '/../public'));
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 3000000 }, resave: true, saveUninitialized: true }));

//https://github.com/bartve/disconnect
var Discogs = require('disconnect').Client;



var dis = new Discogs('TravelPlay Robot 1/X', {
    consumerKey: 'dMtrXOKdWZTBkwwXKzob',
    consumerSecret: 'zqlNByDrOdMehcgarLqhoXpuChVslpsD'
});
var disDB = dis.database();

var sess;




const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;



var db;
//Test Mail
//tech.sendMail(settings.adminMail, "New matches on TravelPlay", "send");


MongoClient.connect(server_settings.mongoUrl, (err, database) => {
    if (err) return console.log(err);
    db = database;


    app.listen(server_settings.port, () => {
        module.exports.app = app;
        module.exports.db = db;

        console.log('listening on ' + server_settings.port);

        if(server_settings.startAll && server_settings.doShedule) {
           later.setInterval(launchMain, later.parse.text('every 8 h'));
        } else {
            launchMain();
        }
        



    });
});

function launchMain() {
    if(server_settings.startAll) {
        console.log("series started. Time:");
        console.log(new Date().toISOString());
        
        async.series([
            queryEvents,
            updateMatches,
            queryGenres,
            queryMatches
        ], function (err, result) {
            console.log("series finished. Time:");
            console.log(new Date().toISOString());
            console.log("Error:");
            console.log(err);
            console.log("Result:");
            console.log(result);
        });
    }
}




app.post('/change_user', (req, res) => {
    if ((req.body.save || null) && (req.body.id || null)) {
        var active = 0;
        if (req.body.active)
            active = req.body.active;

        var id = new ObjectID(req.body.id);

        db.collection('users').update({ _id: id }, { $set: { active: active } },
            (err, result) => {
                if (err) {
                    res.send({ error: err });
                }
                else {
                    res.redirect("/uchange");
                }
            });
    }

    if ((req.body.clear || null) && (req.body.id || null)) {


        db.collection('users').update({ _id: new ObjectID(req.body.id) }, { $set: { matches: [] } },
            (err, result) => {
                if (err) {
                    res.send({ error: err });
                }
                else {
                    res.redirect("/uchange");
                }
            });
    }



});



app.get('/uchange', (req, res) => {

    sess = req.session;
 
    if (sess.auth != 2) {
        res.redirect('/');
        return false;
    }

    db.collection('users').find().toArray(function (err, result) {

        if (!err) {



            res.render('uchange.ejs', { result: result });


        }
        else {
            res.send({ error: err });
        }
    });



});

app.post('/register_user', (req, res) => {
    sess = req.session;


    var json = req.body;
    json.email = json.email.trim();

    db.collection('users').find({ email: { $eq: json.email } }).toArray(function (err, result) {

        if (!err) {
            if (result.length > 0) {
                sess.actionResult = "User registred";
                console.log("user updated");
                res.redirect("/");
                return true;
            }
            else {

                var new_user = {};
                new_user.password = tech.generatePass();
                new_user.code = tech.randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
                new_user.active = 1;
                new_user.approved = 0;
                new_user.email = req.body.email;
                new_user.trips = [];
                new_user.bands = [];
                new_user.matches = [];
                new_user.update = new Date();

                db.collection('users').save(json, (err, result) => {
                    if (err) {
                        sess.actionError = "Error with database in: save user";
                        console.log(err);
                        res.redirect("/");
                        return false;
                    }

                    sess.actionResult = "User registred";

                    var html = '<html><body>Visit <a href="' + server_settings.appUrl + 'users" target="_blank"> here </a></body></html>';
                    tech.sendMail(settings.adminMail, "New registration on " + server_settings.appName + " ", html);

                    console.log(sess.actionResult);
                    res.redirect("/");
                    return true;

                });
            }

        }
        else {
            sess.actionError = "Error with database in: find user";
            console.log(err);
            res.redirect("/");
            return false;
        }

    });

});

app.post('/save_user', (req, res) => {
    var sess = req.session;


    var json = req.body;


    var saveObj = {};
    var doSave = false;
    if (json.trips !== undefined) {
        doSave = true;
        if (json.trips !== "EMPTY") {
            saveObj.trips = json.trips;
        }
        else {
            saveObj.trips = [];

        }

    }
    if (json.bands !== undefined) {
        doSave = true;
        if (json.bands !== "EMPTY") {
            saveObj.bands = json.bands;
        }
        else {
            saveObj.bands = [];
        }



        if (saveObj.bands.length > 0) {
            saveObj.bands.forEach(bandObj => {
                db.collection('bands').update(
                    { "bandName": { $eq: bandObj.band } }, //
                    { $set: bandObj },
                    { upsert: true },
                    (err, result) => {
                        if (err) {
                            console.log(err);
                            return false;
                        }
                    }
                );
            });
        }


    }
    if (json.user_id && doSave) {


        db.collection('users').findAndModify(
            { '_id': new ObjectID(json.user_id) },
            [['_id', 'asc']],
            { $set: saveObj },
            { new: true },
            (err, result) => {
                if (err) {
                    res.send({ error: err });
                    console.log(err);
                    return false;
                }
                sess.authed_user = result.value;


                res.send("OK");
            }
        );

    } else {
        res.send("USER NOT FOUND OR NOTHING TO SAVE");
    }

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
});


app.all('/login', (req, res) => {
    sess = req.session;

    if ((req.body.login || null) && (req.body.password || null) && (req.body.email || null)) {
        db.collection('users').find({
            email: { $eq: req.body.email },
            password: { $eq: req.body.password }
        }).toArray(function (err, result) {

            if (!err) {
                if (result.length > 0) {
                    console.log("USER FOUND");

                    if (result[0].approved) {
                        console.log("USER AUTHED");
                        sess.auth = "1"; //AUTH COMPLETED
                        sess.authed_user = result[0];
                        sess.authed_user.current_auth = sess.auth;
                        res.redirect("/");
                    } else {
                        sess.auth = "0";
                        sess.authed_user = {};
                        console.log("Not approved");
                        res.render('login.ejs', { authError: "User not approved", authSuccess: "" });

                    }
                }
                else {
                    sess.auth = "0";
                    sess.authed_user = {};
                    console.log("Wrong credentials");
                    res.render('login.ejs', { authError: "Wrong credentials", authSuccess: "" });
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




});




app.post("/approve_user", (req, res) => {
    if ((req.body.save || null) && (req.body.id || null)) {
        var approved = 0;
        var password = null;
        if (req.body.approved) {
            approved = 1;
            password = tech.generatePass();
        }

        var id = new ObjectID(req.body.id);

        db.collection('users').update({ _id: id }, { $set: { approved: approved, password: password } },
            (err, result) => {
                if (err) {
                    res.send({ error: err });
                }


                if ((req.body.email || null) && approved) {

                    var html = '<html><body>You can now access <a href="' + server_settings.appUrl + '" target="_blank">' + server_settings.appName + '</a> with your email and password: ' + password + ' </body></html>';

                    tech.sendMail(req.body.email, "Approved on " + server_settings.appName + "", html);
                }


                res.redirect("/users");
            });
    }

});

app.get('/users', (req, res) => {

    sess = req.session;
    if (sess.auth != 2) {
        res.redirect('/');
        return false;
    }

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



});







app.get('/my_trips', (req, res) => {
    sess = req.session;

    if (sess.auth == 1) {
        var actions = {};

        actions.actionResult = sess.actionResult;
        actions.actionError = sess.actionError;

        delete sess.actionResult;
        delete sess.actionError;

        var tripItResult = sess.tripItResult;
        delete sess.tripItResult;
        res.render('profile_trips.ejs', { session: sess, actions: actions, tripItResult: tripItResult });
    } else {
        res.redirect("/");
    }


});

app.get('/my_artists', (req, res) => {
    sess = req.session;
    if (sess.auth == 1) {
        var actions = {};

        actions.actionResult = sess.actionResult;
        actions.actionError = sess.actionError;

        delete sess.actionResult;
        delete sess.actionError;
        var spotifyResult = sess.spotifyResult;

        delete sess.spotifyResult;
        res.render('profile_artists.ejs', { session: sess, actions: actions, spotifyResult: spotifyResult, authUrl: settings.spotifyApiUrl });
    } else {
        res.redirect("/");
    }

});


app.get('/my_results', (req, res) => {
    sess = req.session;



    if (sess.auth == 1) {
        var actions = {};

        actions.actionResult = sess.actionResult;
        actions.actionError = sess.actionError;

        delete sess.actionResult;
        delete sess.actionError;


        async.map(sess.authed_user.trips, function (trip, callback) {

            db.collection('matchesn').find({ $and: [{ "tripid": { $eq: trip.id } }, { "tier": { $gte: 1 } }] }).toArray(function (err, result) {
                if (err)
                    callback(err, []);
                result.sort(function (a, b) {
                    if (a.tier < b.tier) return -1;
                    if (a.tier > b.tier) return 1;
                    return 0;
                });

                callback(null, result);
            });

        }, function (err, results) {
            matches = results.filter(tripMatches => tripMatches.length > 0);


            var matchesByTrips = [];
            matches.forEach(function (tripMatches) {
                matchesByTrips[tripMatches[0].tripid] = tripMatches;
            });
            res.render('profile_results.ejs', { session: sess, actions: actions, matches: matchesByTrips });

        });






    } else {
        res.redirect("/");
    }
});





app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.get('/', (req, res) => {
    sess = req.session;

    var actions = {};

    actions.actionResult = sess.actionResult;
    actions.actionError = sess.actionError;

    delete sess.actionResult;
    delete sess.actionError;

    if (sess.auth != 1 && sess.auth != 2)
        res.render('login.ejs', {
            session: sess,
            actions: actions,
            authUrl: settings.spotifyApiUrl,
            spotifyResult: sess.spotifyResult,
            tripItResult: sess.tripItResult
        });

    if (sess.auth == 1) {
        console.log(actions);
        res.render('profile.ejs', { session: sess, actions: actions });
    }
    if (sess.auth == 2) {
        res.render('first.ejs', {
            session: sess,
            actions: actions,
            authUrl: settings.spotifyApiUrl,
            spotifyResult: sess.spotifyResult,
            tripItResult: sess.tripItResult
        });

    }
});



app.get('/tripitrequesttoken', (req, res) => {
    var sess = req.session;



    settings.tripItClient.getRequestToken().then(function (results) {

        var token = results[0],
            secret = results[1];
        if (typeof (sess.requestTokenSecrets) == "undefined")
            sess.requestTokenSecrets = {};
        sess.requestTokenSecrets[token] = secret;
        var requestUrl = "https://www.tripit.com/oauth/authorize?oauth_token=" + token + "&oauth_callback=" + server_settings.appUrl + "tripitcallback";
        res.redirect(requestUrl);
    }, function (error) {
        res.send(error);
    });

});


app.get('/tripitcallback', (req, res) => {
    var sess = req.session;
    var token = req.query.oauth_token,
        secret = sess.requestTokenSecrets[token],
        verifier = null;
    settings.tripItClient.getAccessToken(token, secret, verifier).then(function (results) {
        var accessToken = results[0],
            accessTokenSecret = results[1];
        sess.tripItAccessToken = accessToken;
        sess.tripItAccessTokenSecret = accessTokenSecret;


        settings.tripItClient.requestResource("/list/trip", "GET", sess.tripItAccessToken, sess.tripItAccessTokenSecret).then(function (results) {
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

            sess.tripItResult = trips;
            res.redirect("/my_trips");
        }).catch(function (reason) {
            console.log(reason);
            res.redirect("/my_trips");
        });



    }, function (error) {
        console.log(error);
        res.redirect("/");
    });

});




app.get('/spotifycallback', (req, res) => {
    sess = req.session;

    if (sess.spotifyAuthed) {
        var localSpotifyApi = new SpotifyWebApi({
            accessToken: sess.spotifyAccessToken
        });


        localSpotifyApi.getFollowedArtists({ limit: 50 })
            .then(basicInfo =>
                ({ basicInfo: basicInfo, res: res, localSpotifyApi: localSpotifyApi })
            ).then(artistsInfo);
    }
    else {
        settings.spotifyApi.authorizationCodeGrant(req.query.code || null).then(function (authInfo) {
            sess.spotifyAccessToken = authInfo.body.access_token;
            sess.spotifyAuthed = true;

            var localSpotifyApi = new SpotifyWebApi({
                accessToken: sess.spotifyAccessToken
            });


            localSpotifyApi.getFollowedArtists({ limit: 50 })
                .then(basicInfo =>
                    ({ basicInfo: basicInfo, res: res, localSpotifyApi: localSpotifyApi })
                ).then(artistsInfo);


        });
    }

});


function artistsInfo(info) {
    var basicInfo = info.basicInfo;
    var res = info.res;
    var localSpotifyApi = info.localSpotifyApi;

    var found_artists = basicInfo.body.artists.items;
    var all_artists;

    Promise.all(found_artists.map(function (artist) {
        return localSpotifyApi.getArtistRelatedArtists(artist.id);
    })).then(function (allRelatedArtists) {
        for (i = 0; i < found_artists.length; i++)
            found_artists[i].related = allRelatedArtists[i].body.artists;


        all_artists = found_artists;

        var distinct = [];



        artistsDistinct = [];

        for (var i = 0; i < all_artists.length; i++) {
            var artist = all_artists[i];
            var relatedBands = artist.related;
            delete artist.related;

            if (distinct.indexOf(artist.name) < 0) {
                artist.relation = 1;
                artistsDistinct.push(artist);
                distinct.push(artist.name);
            }
            for (var j = 0; j < relatedBands.length; j++) {
                var related_artist = relatedBands[j];
                if (distinct.indexOf(related_artist.name) < 0) {
                    related_artist.relation = 2;
                    artistsDistinct.push(related_artist);
                    distinct.push(related_artist.name);
                }
            }

        }

        artistsDistinct.sort(function (a, b) {
            if (a.relation < b.relation) return -1;
            if (a.relation > b.relation) return 1;
            return 0;
        });



        console.log("Followed and Related (c) Spotify: " + artistsDistinct.length);
        sess.spotifyResult = artistsDistinct.map(function (el, i) {
            return {
                band: el.name.toLowerCase(),
                relation: el.relation,
                "additional_info": {
                    "band_name_original": el.name,
                    "total_info": el
                }
            };
        });


        res.redirect('/my_artists');

    });

}



app.get('/protected', (req, res) => {
    sess = req.session;
    var r = req.query.r || null;


    if (sess.auth > 0) {
        sess.actionResult = "Already authorized";
        console.log(sess.actionResult);
        if (r) {
            res.redirect("/" + r);
        }
        else {
            res.redirect("/");
        }
    }
    else {
        //here we try auth
        if ((req.query.code || null)) {
            var code = req.query.code;
            db.collection('users').find({
                code: { $eq: code }
            }).toArray(function (err, result) {

                if (!err) {
                    if (result.length > 0) {
                        console.log("USER FOUND");

                        if (result[0].approved) {
                            console.log("USER AUTHED");
                            sess.auth = "1"; //AUTH COMPLETED
                            sess.authed_user = result[0];
                            sess.authed_user.current_auth = sess.auth;

                            sess.actionResult = "Auto autorization completed";
                            console.log(sess.actionResult);

                            if (r)
                                res.redirect("/" + r);
                            else {
                                res.redirect("/");

                            }


                        } else {
                            sess.auth = "0";
                            sess.authed_user = {};

                            sess.actionError = "Auto autorization failed - User not approved";
                            console.log(sess.actionError);

                            if (r)
                                res.redirect("/" + r);
                            else {
                                res.redirect("/");

                            }
                        }
                    }
                    else {
                        sess.auth = "0";
                        sess.authed_user = {};

                        sess.actionError = "Auto autorization failed - Wrong credentials";
                        console.log(sess.actionError);

                        if (r)
                            res.redirect("/" + r);
                        else {
                            res.redirect("/");
                        }
                    }

                }
                else {
                    sess.actionError = "Auto autorization failed - DB error: " + err.toString();
                    console.log(sess.actionError);

                    res.redirect("/");

                }
            });
        }
        else {
            sess.actionError = "Auto autorization failed - No private code";
            console.log(sess.actionError);
        }


    }



});






app.get('/save_user_special', (req, res) => {
    var users = fakes.getUsersFromFiles();

    async.map(users, function (user, callback) {

        db.collection('users').save(user, (err, result) => {
            if (err) {
                callback(err, "NOT OK");
            }

            callback(null, "OK");
        });

    }, function (err, results) {

        res.send("OK");
    });

});







/**************/




function updateMatches(globalSeriesCallback) {
    console.log("start finding matches in DB");
    db.collection('matchesn').find(
        { $and: [{ "inDB": { $ne: 1 } }, { "discogsFailed": { $ne: 1 } }] }
    ).toArray(function (err, result) {
        console.log("found non matched matches " + result.length);
        if (!err) {
            var matchesNotInDB = result;
            if (matchesNotInDB.length > 0) { //loop
                async.each(matchesNotInDB,
                    function (match, innerCallback1) {
                        db.collection('bandsDB').find({ "artist_name": { $eq: match.artist_name } }).
                            toArray(function (err, result) {
                                if (!err) {
                                    if (result && result.length > 0) {
                                        var genres = result[0].genres;
                                        db.collection('matchesn').update(
                                            { "artist_name": { $eq: this.artistName } }, //
                                            { $set: { "inDB": 1, "genres": genres } },
                                            {
                                                multi: true,
                                                upsert: false
                                            },
                                            (err, result) => {
                                                if (err) {
                                                    console.log(err);
                                                    innerCallback1(err);

                                                }
                                                console.log(this.artistName + " modified");
                                                innerCallback1();
                                            }
                                        );
                                    } else {
                                        //do nothing
                                        innerCallback1();
                                    }
                                } else {
                                    console.log("error in matching matches to DB");
                                    console.log(err);
                                    innerCallback1(err);
                                }

                            }.bind({ artistName: match.artist_name }));
                    },
                    function (err, result) {
                        globalSeriesCallback(null, "updateBandsinMatchesFinished");
                    });

            } else {
                console.log("all matches in DB");
                globalSeriesCallback(null, "all matches in DB");
            }

        } else {
            console.log("matching to DB err");
            console.log(err);
            globalSeriesCallback("matching to DB err");
        }
    });
}






 









function findEvents(time, user, innerCallback1) {
    user.genres = tech.getUserGenres(user.bands);
    var trips = user.trips || null;
    var bands = user.bands || null;

    if (!trips || !bands) {

        tech.logT("nothing to search for",server_settings.queryEventsVerb);
        innerCallback1();
        return false;
    }


    artistList = bands.map(function (el, i) {
        return el.band;
    });
    //loop 2
    async.each(trips,
        function (trip, innerCallback2) {
            if (new Date(trip.end) > new Date()) {
                tech.logT(trip.city,server_settings.queryEventsVerb);
                if (tech.isUS(trip.country)) {
                    tech.logT("US:" + trip.city + " later",server_settings.queryEventsVerb);
                    innerCallback2();
                } else {
                    //SongKick
                    //innerCallback2();
                    apis.findSongKickEvents(settings.SongKickUrl, trip, artistList, user, time, settings.SongKickLocationUrl, innerCallback2);
                }
            } else {
                //do nothing
                innerCallback2();
            }
        },
        function (err, result) {
            console.log("***Finding Events Finished");
            console.log(err);
            console.log(result);
            innerCallback1();
        });


}

function findMatches(time, user,innerCallback1) {
    var trips = user.trips || null;
    var bands = user.bands || null;

    if (!trips || !bands) {
        tech.logT("nothing to search for",server_settings.matchEventsVerb);
        innerCallback1();
        return false;
    }

    var userGenres = tech.getUserGenres(user.bands);

    //loop 2
 

    async.map(trips,
        function (trip, innerCallback2) {

        if (new Date(trip.end) > new Date()) {
            var apiUrl = "";
            if (tech.isUS(trip.country)) {
                tech.logT("US:" + trip.city + " later",server_settings.matchEventsVerb);
                innerCallback2();
            } else {


                db.collection('matchesn').find({ tripid: { $eq: trip.id } }).toArray(function (err, result) {
                    if (!err) {
                        if (result.length > 0) {

                            var firstTier = [];
                            var secondTier = [];
                            var thirdTier = [];
                            var failedGenres = [];
                            var prevTiers=[];

                            
                            result.forEach(function (match) {
                                if(match.tier>0) 
                                 prevTiers.push(match);
                            });


                            result.forEach(function (match) {

                                if (match.artist_name !== undefined) {
                                    var findings = [];
                                    //1. First tier
                                    findings = bands.filter(function (band) {
                                        if (
                                            band.band === match.artist_name.toLowerCase() &&
                                            band.relation == 1
                                        ) return true;
                                        return false;

                                    });
                                    if (findings.length > 0)
                                        firstTier.push(match);

                                    //2. Second tier
                                    findings = bands.filter(function (band) {
                                        if (
                                            band.band === match.artist_name.toLowerCase() &&
                                            band.relation == 2
                                        ) return true;
                                        return false;

                                    });
                                    if (findings.length > 0)
                                        secondTier.push(match);


                                    //3.Third Tier - Genres
                                    if (match.genres && match.genres.length > 0) {
                                        match.genres = [].concat.apply([], match.genres);
                                        findings = match.genres.filter(function (genre) {
                                            if (
                                                userGenres.indexOf(genre.toLowerCase()) > -1
                                            ) return true;
                                            return false;

                                        });
                                        if (findings.length > 0) {
                                            thirdTier.push(match);
                                        }
                                        else {
                                            //console.log(match.genres.join()+" no in user genres");
                                            failedGenres.push(match.genres);
                                        }


                                    }



                                }


                            });
 
                            //clear thirdTier
                            //console.log(thirdTier.length);
                            if(thirdTier.length>0) {
                                tiersMatches=firstTier.map(x=>x.artist_name).concat(secondTier.map(x=>x.artist_name));
                                thirdTier=thirdTier.filter((match)=>{
                                    return tiersMatches.indexOf(match.artist_name)==-1;
                                });
                            }
                            //console.log(thirdTier.length);

                                        //send mails
                                       
                            if(user && user.active && user.email && ((firstTier.length+secondTier.length+thirdTier.length)>prevTiers.length)) {

                                var html = '<html><body>Hi,<br> we have found a few interesting concerts you can attend'+
                                ' during your upcoming trip to '+trip.city+'. Click <a href="' +
                                server_settings.appUrl +
                                'protected?code='+user.code+'&r=my_results" target="_blank">here</a> to see our recommendations!'+
                                '<br><br>BR<br>'+server_settings.appName+'</body></html>';
                                
                                
                                tech.sendMail(user.email, server_settings.appName+" - Some musical suggestions for your trip to "+trip.city+" ", html);


                                tech.sendMail(settings.adminMail, "New findings for user on " + server_settings.appName + " ", html);
                            }                            


                            //Update TIER to matches


                            async.series([
                                function (callbackm) {
                                    //zeroTier 
                                    db.collection('matchesn').update(
                                        { tripid: { $eq: trip.id } }, //only in this trip
                                        { $set: { "tier": 0 } },
                                        {
                                            upsert: false,
                                            multi: true
                                        },
                                        (err, result) => {
                                            if (err)
                                                callbackm(err);
                                            else
                                                callbackm();
                                        }
                                    );

                                }.bind({ trip: trip }),

                                function (callbackm) {

                                    async.map(thirdTier,

                                        function (performance, callback) {

                                            var id = new ObjectID(performance._id);

                                            db.collection('matchesn').update(
                                                { "_id": { $eq: performance._id } }, //
                                                { $set: { "tier": 3 } },
                                                {
                                                    upsert: false
                                                },
                                                (err, result) => {
                                                    if (err)
                                                        callback(err);
                                                    else
                                                        callback();
                                                }
                                            );

                                        },
                                        function (err, results) {
                                            callbackm();
                                        });


                                },
                                function (callbackm) {

                                    async.map(secondTier,

                                        function (performance, callback) {

                                            var id = new ObjectID(performance._id);

                                            db.collection('matchesn').update(
                                                { "_id": { $eq: performance._id } }, //
                                                { $set: { "tier": 2 } },
                                                {
                                                    upsert: false
                                                },
                                                (err, result) => {
                                                    if (err)
                                                        callback(err);
                                                    else
                                                        callback();
                                                }
                                            );

                                        },
                                        function (err, results) {
                                            callbackm();
                                        });


                                },
                                function (callbackm) {

                                    async.map(firstTier,

                                        function (performance, callback) {

                                            var id = new ObjectID(performance._id);

                                            db.collection('matchesn').update(
                                                { "_id": { $eq: performance._id } }, //
                                                { $set: { "tier": 1 } },
                                                {
                                                    upsert: false
                                                },
                                                (err, result) => {
                                                    if (err)
                                                        callback(err);
                                                    else
                                                        callback();
                                                }
                                            );

                                        },
                                        function (err, results) {
                                            callbackm();
                                        });


                                },
                            ], function (err, result) {
                                if (err) {
                                    console.log(err);
                                    innerCallback2(err);
                                }
                                else {
                                    tech.logT("Finished matching for " + trip.city,server_settings.matchEventsVerb);
                                    var obj={firstTier:firstTier,secondTier:secondTier,thirdTier:thirdTier};
                                    innerCallback2(null,obj);
                                }
                            });



                        } else {
                            tech.logT("No matches to match",server_settings.matchEventsVerb);
                            innerCallback2();
                        }


                    }
                    else {
                        //error here - do nothing
                        console.log("Error in DB in Matching");
                        innerCallback2(err);

                    }
                }.bind({ trip: trip }));





            }
        } else {
            innerCallback2();
        }

    },
    function (err, result) {
       tech.logT("***Matching Events Finished",server_settings.matchEventsVerb);
        
        if (err) {
            console.log(err);
            innerCallback1(err);
        }
        else {
            //console.log(result);
          
            innerCallback1(null,result);
        }

    }.bind({ user: user })); //add user here

}






function queryDiscogs(artistName, callback) {
    var url = settings.discogsApiUrl.replace("ARTIST_NAME", encodeURI(artistName));

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
            callback(null, genreInfoUniq);
        } else {
            callback("find Discogs genres error", 0);
        }
    });
}





function queryGenres(globalSeriesCallback) {
    console.log("starting genre finder");
    console.log(new Date().toLocaleString());

    db.collection('matchesn').find(
        { $and: [{ "inDB": { $ne: 1 } }, { "discogsFailed": { $ne: 1 } }] }
    ).toArray(


        function (err, newArtists) {
            if (!err) {
                //newArtists=newArtists.slice(100,101);
                //newArtists=['nirvana'];
                async.mapSeries(newArtists,
                    function (artist, callback) {
                        disDB.search("", { type: "release", artist: artist.artist_name }, function (err, data, rateLimit) {
                            if (!err) {
                                discongsInfo = {};
                                if (data && data.results) {
                                    tech.logT("artist found: " + this.artistName + " rateLimit.remaining:" + rateLimit.remaining,server_settings.discogsEventsVerb);
                                    var genres = data.results.map(function (result) {
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

                                    if (rateLimit.remaining > 20)
                                        callback(null, { artistName: this.artistName, artistGenres: genreInfoUniq });
                                    else {                                        tech.logT("waiting minute",server_settings.discogsEventsVerb);
                                        
                                        setTimeout(callback.bind(this, null, { artistName: this.artistName, artistGenres: genreInfoUniq, }), 65000);
                                    }
                                } else {
                                    tech.logT("***no artist found: " + this.artistName + " rateLimit.remaining:" + rateLimit.remaining,server_settings.discogsEventsVerb);


                                    if (rateLimit.remaining > 20)
                                        callback(null, { artistName: this.artistName, artistGenres: [] });
                                    else {
                                        tech.logT("waiting minute",server_settings.discogsEventsVerb);
                                        setTimeout(callback.bind(this, null, { artistName: this.artistName, artistGenres: [] }), 65000);
                                    }
                                }

                            } else {
                                callback(err);
                            }

                        }.bind({ artistName: artist.artist_name }));
                    },
                    function (err, result) {
                        tech.logT("Ending genre finder from Discogs",server_settings.discogsEventsVerb);
                        tech.logT(new Date().toLocaleString(),server_settings.discogsEventsVerb);
                        if (!err) {
                            //console.log(result.length);

                            //loop
                            async.each(result,
                                function (artist, innerCallback) {

                                    var setObj;
                                    if (artist.artistGenres.length === 0) {
                                        setObj = { "inDB": 0, "genres": [], "discogsFailed": 1 };
                                    }
                                    else {
                                        setObj = { "inDB": 1, "genres": artist.artistGenres };
                                    }

                                    async.series([
                                        function(innerCallback2) {
                                            db.collection('matchesn').update(
                                                {"artist_name":{$eq:artist.artistName}}, //
                                                { $set: setObj },
                                                { 
                                                    multi: true,
                                                    upsert: false
                                                },
                                                (err, result) => { 
                                                    if (err) {
                                                        console.log(err);
                                                        innerCallback2(err);     
                                                    }  
                                                    innerCallback2();                 
                                                }
                                            );
                                                                                
                                        },
                                        function(innerCallback2) {
                                            // bandsDB
                                            db.collection('bandsDB').update(
                                                {"artist_name":{$eq:artist.artistName}}, //
                                                { $set: {genres:artist.artistGenres} },
                                                { 
                                                    upsert: true,
                                                    multi: true 
                                                },
                                                (err, result) => { 
                                                    if (err) {
                                                        console.log(err);
                                                        innerCallback2(err);   
                                                    }  
                                                    innerCallback2();   
                                                }   
                                            );
                              
                                        },                                        
                                        
                                    ],function(err, results) {
                                       innerCallback();
                                    });


                                },
                                function (err, result) {
                                    if(err) {
                                        console.log(err);
                                    } else {
                                        tech.logT("***gGenreFindDiscogsFinished",server_settings.discogsEventsVerb);
                                    }
                                    globalSeriesCallback(null,"gGenreFindDiscogsFinished");
                                });
                        } else {
                            console.log(err);
                            globalSeriesCallback(err);
                        }
                    });


            } else {
                console.log("ScheduledGenres DB error");
                globalSeriesCallback(err);
            }
        });

}


function queryMatches(globalSeriesCallback) {

    var time = new Date();

    db.collection('users').find({ active: { $eq: 1 } }).toArray(function (err, users) {

        if (!err && (users.length > 0)) {
            //loop
            users.forEach(function (user) {
                user.genres = tech.getUserGenres(user.bands);
            });


           //loop
            async.map(users, findMatches.bind(null, time), function (err, result) {
                if(err)
                    globalSeriesCallback(err);
                else {
                    //console.log("matching without problems");
                    globalSeriesCallback(null, result);
                }    
                
            });


        }
        else {
            globalSeriesCallback(err);
        }
    });


}

function queryEvents(globalSeriesCallback) {

    tech.logT("start query Events",server_settings.queryEventsVerb);
    

    var time = new Date();

    db.collection('users').find({ active: { $eq: 1 } }).toArray(function (err, result) {

        if (!err && (result.length > 0)) {
            //loop
            async.each(result, findEvents.bind(null, time), function (err, result) {
                globalSeriesCallback(null, "findEventsFinished");
            });

        }
        else {
            globalSeriesCallback(err);
        }
    });


}


function spotTest(info) {
    console.log("*********SPOT TEST START**********");
    console.log(new Date());
    var basicInfo = info.basicInfo;
    var res = info.res;
    var localSpotifyApi = info.localSpotifyApi;
    var found_artists = basicInfo.body.artists.items.map(x => x.id);
    console.log(found_artists.length);
    found_artists = found_artists.slice(0, 10);
    console.log(found_artists.length);
    var mashArtists = [];
    for (var i = 0; i < 10; i++) {
        mashArtists = mashArtists.concat(found_artists);
    }
    console.log(mashArtists.length);

    var promises = mashArtists.map(function (artist) {
        var artistT = localSpotifyApi.getArtist(artist); //returning promise
        return artistT;         //returning promise
    });


    Promise.all(promises).then(function (foundInfo) {
        console.log(foundInfo.length);
        foundInfo = foundInfo.map(
            x =>
                x.body.name
        );
        console.log(foundInfo[foundInfo.length - 1]);
        console.log("************");

    }, function (err) {
        console.log(err);
    });



}
//testSpot();

function testSpot() {
    var artistID = "0YWKRTzA4kBceGwjywtMkh";
    console.log("************START");
    console.log(new Date());

    ids = [
        '0YWKRTzA4kBceGwjywtMkh', '0YWKRTzA4kBceGwjywtMkh', '0YWKRTzA4kBceGwjywtMkh',
        '0YWKRTzA4kBceGwjywtMkh', '0YWKRTzA4kBceGwjywtMkh', '0YWKRTzA4kBceGwjywtMkh',
        '0YWKRTzA4kBceGwjywtMkh', '0YWKRTzA4kBceGwjywtMkh', '0YWKRTzA4kBceGwjywtMkh',
        '0YWKRTzA4kBceGwjywtMkh'
    ];

    var mashArtists = [];
    for (var i = 0; i < 100; i++) {
        mashArtists = mashArtists.concat(ids);
    }


    async.mapSeries(mashArtists, loadArtist, function (err, result) {
        if (err) {
            console.log("err");
            console.log(new Date());

            console.log(err);
        } else {
            console.log("result");
            console.log(new Date());

            console.log(result[result.length - 1]);
            console.log(result.length);
            console.log("************END");


        }
    });
}

function loadArtist(artistID, callback) {
    var url = "https://api.spotify.com/v1/artists/" + artistID;
    request(url, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            var json = JSON.parse(body);
            callback(null, json);
        } else {
            callback(err, 0);

        }
    });
}
