
//pm2 restart /srv/nodeapps/tp/index.js
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


app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit:50000}));


//app.use(express.static('public'));
app.use(express.static(__dirname + '/../public'));
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 3000000 }, resave: true, saveUninitialized: true }));



var sess;




const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;



var db;


MongoClient.connect(server_settings.mongoUrl, (err, database) => {
    if (err) return console.log(err);
    db = database;


    app.listen(server_settings.port, () => {
        module.exports.app = app;
        module.exports.db = db;

        console.log('listening on ' + server_settings.port);
        if(server_settings.startFinder)
            startServer(server_settings.doShedule);

        


    });
});
//apis.findSongKickEvents(settings.SongKickUrl,  {city:"vienna",start:"2017-03-15",end:"2017-03-19"}, [], {_id:"some_user_id"}, "xxx", settings.SongKickLocationUrl);



//apis.findEventfulEvents(settings.eventfulURL, {city:"new york",start:"2017-02-01",end:"2017-02-28"}, [], {_id:"some_user_id"},"x");
//apis.findTicketMasterEvents(settings.TicketMasterUrl, {city:"new york",start:"2017-02-01",end:"2017-02-28"}, [], {},"x");







function startServer(doSchedule) {
    if (!doSchedule) {
        ScheduledFind();
    } else {
        later.setInterval(ScheduledFind, later.parse.text('every 1 h'));
    }
}


app.post('/change_user', (req, res) => {
    if ((req.body.save || null) && (req.body.id || null)) {
        var active=0;
        if(req.body.active)
            active=req.body.active;

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

});



app.get('/uchange', (req, res) => {

    sess = req.session;
    /*
    if (sess.auth != 2) {
        res.redirect('/');
        return false;
    }
*/
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
            saveObj.bands=json.bands;
            /*
            saveObj.bands = json.bands.map(band =>
                ({
                    band: band.band.toLowerCase(),
                    additional_info: { band_name_original: band.band }
                })
            );
            */
        }
        else {
            saveObj.bands = [];
        }



        if(saveObj.bands.length>0) {
            //console.log(saveObj.bands[0]);
            saveObj.bands.forEach(bandObj=>{
                db.collection('bands').update(
                    {"bandName":{$eq:bandObj.band}}, //
                    //{'$set': {"lastFound":new Date().toISOString()} }, // 
                    { $set: bandObj },
                    { upsert: true },
                    (err, result) => { 
                        if (err) {
                            //res.send({ error: err });
                            console.log(err);
                            return false;
                        }                        
                        //console.log(result);
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
        res.render('profile_results.ejs', { session: sess, actions: actions });

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

    //       var html = '<html><body>Visit <a href="'+server_settings.appUrl+'" target="_blank"> here </a></body></html>';
    //        tech.sendMail(settings.adminMail, "New registration on "+server_settings.appName+" ", html);

    var actions = {};

    actions.actionResult = sess.actionResult;
    actions.actionError = sess.actionError;

    delete sess.actionResult;
    delete sess.actionError;

    if (sess.auth != 1 && sess.auth != 2)
        res.render('first.ejs', {
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
     //   res.render('users.ejs', { session: sess, actions: actions });
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
    //res.send({oauth_token:req.query.oauth_token});
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
/*
    spotTest(info);

    res.redirect('/my_artists');

    return false;
*/
    Promise.all(found_artists.map(function (artist) {
        return localSpotifyApi.getArtistRelatedArtists(artist.id);
    })).then(function (allRelatedArtists) {
        for (i = 0; i < found_artists.length; i++)
            found_artists[i].related = allRelatedArtists[i].body.artists;


        all_artists = found_artists;
       // console.log("all_artists "+all_artists.length);
       // console.log(all_artists);

        var distinct=[];


        
        artistsDistinct = [];

        for (var i = 0; i < all_artists.length; i++) {
            var artist = all_artists[i];
            var relatedBands=artist.related;
            delete artist.related;

            if (distinct.indexOf(artist.name) < 0) {
                artist.relation=1;
                artistsDistinct.push(artist);
                distinct.push(artist.name);
            }
            for (var j = 0; j < relatedBands.length; j++) {
                var related_artist = relatedBands[j];
                if (distinct.indexOf(related_artist.name) < 0) {
                    related_artist.relation=2;
                    artistsDistinct.push(related_artist);
                    distinct.push(related_artist.name);
                }
            }

        }
        /*
        artistsDistinct.sort(function (a, b) {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        });
        */
       artistsDistinct.sort(function (a, b) {
            if (a.relation < b.relation) return -1;
            if (a.relation > b.relation) return 1;
            return 0;
        });


         
        console.log("Followed and Related (c) Spotify: " + artistsDistinct.length);
        //res.send({result:artistsDistinct, err:""});
        sess.spotifyResult = artistsDistinct.map(function (el, i) {
            return {
                band: el.name.toLowerCase(),
                relation: el.relation,
                "additional_info": {
                    "band_name_original": el.name,
                    "total_info":el
                }
            };
        });
       

        res.redirect('/my_artists');

    });

}



/*
app.get('/deactivate', (req, res) => {
    sess = req.session;
    if (sess.auth == 1) {
        if (sess.authed_user) {
            var id = new ObjectID(sess.authed_user._id);
            console.log(id);

            db.collection('users').update({ _id: id }, { $set: { active: 0 } },
                (err, result) => {
                    if (err) {
                        res.send({ error: err });
                    }

                    console.log('deactivated');
                    res.send("OK");
                });
        }

    } else {
        res.redirect("/");
    }

});
*/
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




//SongKick for non US, Eventful & TicketMaster for US.
function findEvents(user, time) {
    var trips = user.trips || null;
    var bands = user.bands || null;

    if (!trips || !bands) {
        console.log("nothing to search for");
        return false;
    }


    artistList = bands.map(function (el, i) {
        return el.band;
    });

    if (artistList.length < 1) {
        console.log("bands to few for test");
        return false;
    }
    trips.forEach(function (trip) {
        var apiUrl = "";

        if (tech.isUS(trip.country)) {
            //Eventful + Tickemaster
            apis.findEventfulEvents(settings.eventfulURL, trip, artistList, user, time);
            apis.findTicketMasterEvents(settings.TicketMasterUrl, trip, artistList, user, time);
            //console.log("US:"+trip.city); 
        } else {
            //SongKick
            //console.log("NonUS:"+trip.city);
            apis.findEventfulEvents(settings.eventfulURL, trip, artistList, user, time);
            apis.findSongKickEvents(settings.SongKickUrl, trip, artistList, user, time, settings.SongKickLocationUrl);
        }





    });

}




function ScheduledFind() {

    var time = new Date();

    db.collection('users').find({ active: { $eq: 1 } }).toArray(function (err, result) {

        if (!err && (result.length > 0)) {

            result.forEach(function (user) {
                user.genres=tech.getUserGenres(user.bands);
                //console.log(user.genres);
                findEvents(user, time);
            });

        }
        else {
            return console.log(err);
        }
    });


}

/*
function spotTest1() {
        id = new ObjectID("588738df79ec3c0b3409d8ee");

        db.collection('users').find({
            _id: { $eq: id }
        }).toArray(function (err, result) {

            if (!err) {
                if (result.length > 0) {
                    console.log("USER FOUND");
                    var user=result[0];
                    console.log("bands length "+user.bands.length)
                    fs.writeFile("bands.json", JSON.stringify(user.bands), function (err) {
                        if (err) {
                            console.log(err);
                            return false;
                        }
                    });                    
                }
            }
            else {
                console.log({ error: err });

            }
        });


 
} 
*/

function spotTest(info) {
    console.log("*********SPOT TEST START**********");
    console.log(new Date());
    var basicInfo = info.basicInfo;
    var res = info.res;
    var localSpotifyApi = info.localSpotifyApi;
    var found_artists=basicInfo.body.artists.items.map(x=>x.id);
    console.log(found_artists.length);
    found_artists=found_artists.slice(0,10);
    console.log(found_artists.length);
    var mashArtists=[];
    for(var i=0; i<10; i++) {
        mashArtists=mashArtists.concat(found_artists);
    }
    console.log(mashArtists.length);

    var promises=mashArtists.map(function (artist) {
            var artistT=localSpotifyApi.getArtist(artist); //returning promise
            return artistT;         //returning promise
    });
 
   
    Promise.all(promises).then(function (foundInfo) {
        console.log(foundInfo.length);
        foundInfo = foundInfo.map(
            x=>
            x.body.name
            );
        console.log(foundInfo[foundInfo.length-1]);
        console.log("************");
        
    },function(err){
        console.log(err);
    });
   

 
} 
//testSpot();

function testSpot() {
    var artistID="0YWKRTzA4kBceGwjywtMkh";
    console.log("************START");
    console.log(new Date());
    
    ids=[
        '0YWKRTzA4kBceGwjywtMkh','0YWKRTzA4kBceGwjywtMkh','0YWKRTzA4kBceGwjywtMkh',
        '0YWKRTzA4kBceGwjywtMkh','0YWKRTzA4kBceGwjywtMkh','0YWKRTzA4kBceGwjywtMkh',
        '0YWKRTzA4kBceGwjywtMkh','0YWKRTzA4kBceGwjywtMkh','0YWKRTzA4kBceGwjywtMkh',
        '0YWKRTzA4kBceGwjywtMkh'
    ];

    var mashArtists=[];
    for(var i=0; i<100; i++) {
        mashArtists=mashArtists.concat(ids);
    }
    

    async.mapSeries(mashArtists,loadArtist, function(err, result) {
        if(err) {
            console.log("err");
    console.log(new Date());
            
            console.log(err);
        } else {
        console.log("result");
    console.log(new Date());

           console.log(result[result.length-1]);
           console.log(result.length);
           console.log("************END");


        }
    });
} 

function loadArtist(artistID,callback) {
    var url="https://api.spotify.com/v1/artists/"+artistID;
    request(url, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            var json = JSON.parse(body);
            //console.log(json);
            callback(null,json);
        } else {
           //console.log("request error");
            //console.log(err);
            callback(err, 0);

        }
    });    
}
//tech.checkGenres(settings.discogsApiUrl.replace("ARTIST_NAME",encodeURI("Trash Talk")));
