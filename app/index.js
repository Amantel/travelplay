
const express = require('express');
const bodyParser = require('body-parser')

const http = require('http');
const https = require("https");
const URIlib = require('./URI')
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


var SpotifyWebApi = require('spotify-web-api-node');
var tripItApiClient = require("tripit-node");


const app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'));
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }, resave: true, saveUninitialized: true }))
var sess;


 


const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient
const ObjectID = mongodb.ObjectID;


var mongo_url = "mongodb://root:1234@ds111589.mlab.com:11589/travel_play";

var db;


MongoClient.connect(mongo_url, (err, database) => {
    if (err) return console.log(err)
    db = database;


    app.listen(8001, () => {
        module.exports.app = app;
        module.exports.db = db;

        console.log('listening on 8001');
     
        startServer(false);
    })
})






 

var modelCurrent = {};


 

function startServer(doSchedule) {
    if (!doSchedule) {
        ScheduledFind();
    } else {
        later.setInterval(ScheduledFind, later.parse.text('every 1 h'));
    }
}



app.post('/save_user', (req, res) => {
    //check if old email


    var json = req.body;
    json.email = json.email.trim();
    //check if there is this email
    //db.users.find({active:{$eq:1}}).pretty()
    //
    //if there is no ID in trips, let's add it here;
    json.trips=json.trips.map(function(el,i){
        trip=el;
        if(!el.id)
            trip.id=tech.randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
        return trip;
    });
    if(!json.user_id) 
    {
        db.collection('users').find({ email: { $eq: json.email } }).toArray(function (err, result) {

            if (!err) {
                //console.log(result)
                if (result.length > 0) {
                    console.log("We already have this email, so let us update first with it");
                    json["_id"] = new ObjectID(result[0]._id);
                    db.collection('users').update({ _id: json["_id"] }, { $set: { trips: json.trips, bands: json.bands } }
                        , (err, result) => {
                            if (err) {
                                res.send({ error: err });
                            }

                            console.log('saved to database')
                            res.send("OK");
                        });


                }
                else {
                    console.log("New User. No email found");
                    json.password = generatePass();
                    json.code = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
                    db.collection('users').save(json, (err, result) => {
                        if (err) {
                            res.send({ error: err });
                        }

                        console.log('saved to database')
                        res.send("OK");
                    });
                }

            }
            else {
                res.send({ error: err });

            }
        });
    } else {

        db.collection('users').update({ _id: new ObjectID(json.user_id) }, { $set: { trips: json.trips, bands: json.bands } }
            , (err, result) => {
                if (err) {
                    res.send({ error: err });
                }
                console.log(result);
                console.log('saved to database')
                res.send("OK");
            });

    }

})






 



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
                        res.render('login.ejs', { authError: "User not approved", authSuccess: "" })

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
    else if ((req.body.registration || null) && (req.body.email || null)) {
        db.collection('users').find({
            email: { $eq: req.body.email }
        }).toArray(function (err, result) {

            if (!err) {
                if (result.length > 0) {
                    console.log("USER FOUND");
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
                    new_user.update = new Date();
                    db.collection('users').save(new_user, (err, result) => {
                        if (err) {
                            res.render('login.ejs', { authError: err, authSuccess: "" });
                        }

                        console.log('saved to database');

                        var html = '<html><body>Visit <a href="http://localhost:8001/users" target="_blank"> here </a></body></html>';

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

                console.log('saved to database');

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




 
 

app.get('/index', (req, res) => {
    sess = req.session;
    res.render('index.ejs', { session: sess, auth_url: settings.spotifyApiUrl });
})

app.get('/', (req, res) => {
    sess = req.session;
    res.render('index.ejs', { session: sess, 
        auth_url: settings.spotifyApiUrl, 
        spotifyResult:sess.spotifyResult,
        tripItResult:sess.tripItResult
     });
})


 
app.get('/tripitrequesttoken', (req, res) => {
    var sess = req.session;
 


    settings.tripItClient.getRequestToken().then(function (results) {
       
        var token = results[0],
            secret = results[1];
        if(typeof(sess.requestTokenSecrets)=="undefined")    
            sess.requestTokenSecrets={};
        sess.requestTokenSecrets[token] = secret;
        var requestUrl = "https://www.tripit.com/oauth/authorize?oauth_token=" + token + "&oauth_callback=" +settings.appUrl+ "tripitcallback";
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

            sess.tripItResult=trips;
            res.redirect("/");
        }).catch(function (reason) {
            console.log(reason);
             res.redirect("/");
        });



    }, function (error) {
       console.log(error);
       res.redirect("/");
    });

});
 



app.get('/spotifycallback', (req, res) => {
    sess = req.session;

    if(sess.spotifyAuthed) {
        res.redirect('/');
    }
    else {
        settings.spotifyApi.authorizationCodeGrant(req.query.code || null).then(function (authInfo) {
            sess.spotifyAccessToken=authInfo.body['access_token'];
            sess.spotifyAuthed = true;

     var localSpotifyApi = new SpotifyWebApi({
        accessToken : sess.spotifyAccessToken
        }); 


        localSpotifyApi.getFollowedArtists({ limit: 20 }).then(function artistsInfo(basicInfo) {
            var found_artists = basicInfo.body.artists.items;
            var all_artists; 
            Promise.all(found_artists.map(function (artist) {
                return localSpotifyApi.getArtistRelatedArtists(artist.id);
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

                console.log("Followed and Related (c) Spotify: " + all_artists.distinct_list.length);

                //res.send({result:all_artists.distinct_list, err:""});
                sess.spotifyResult=all_artists.distinct_list.map(function(el,i){
                    return {band:el.toLowerCase(),  "additional_info": {
                        "band_name_original": el
                    }}
                }); 
                
                ;
                res.redirect('/');
            });

        });

            
        });
    }

});


 

app.get('/deactivate', (req, res) => {
    sess = req.session;
    if (sess.auth == 1) {
        if (sess.authed_user) {
            var id = new ObjectID(sess.authed_user._id);
            console.log(id);

            db.collection('users').update({ _id: id }, { $set: { active: 0 } }
                , (err, result) => {
                    if (err) {
                        res.send({ error: err });
                    }

                    console.log('deactivated')
                    res.send("OK");
                });
        }

    } else {
        res.redirect("/");
    }

});

app.get('/protected', (req, res) => {
    sess = req.session;
    var r = req.query.r || null;


    if (sess.auth > 0)
        if (r)
            res.redirect("/" + r);
        else {
            res.send("authed");
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
                            if (r)
                                res.redirect("/" + r);
                            else
                                //res.send(sess.authed_user);   
                                res.send(sess.authed_user.matches);
                            console.log(sess.authed_user.matches.length);

                        } else {
                            sess.auth = "0";
                            sess.authed_user = {};
                            console.log("Not approved");
                            if (r)
                                res.redirect("/" + r);
                            else
                                res.send("Found but not approved");
                        }
                    }
                    else {
                        sess.auth = "0";
                        sess.authed_user = {};
                        console.log("Wrong credentials");
                        if (r)
                            res.redirect("/" + r);
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
    sess.auth = 0;
    sess.authed_user = {};


});



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

    if (artistList.length < 20) {
        console.log("bands to few for test");
        return false;
    }
    trips.forEach(function (trip) {
        var apiUrl = "";

        if (tech.isUS(trip.country)) {
            //Eventful + Tickemaster
            //GetfakeCall(apiUrl,trip,artistList,user,time);
 
            apis.findEventfulEvents(settings.eventfulURL, trip, artistList, user, time);

        } else {
            //SongKick
           // console.log("SongKick");
           // apis.findSongKickEvents(settings.SongKickUrl, trip, artistList, user, time, settings.SongKickLocationUrl);

            //GetfakeCall(apiUrl,trip,artistList,user,time);
        }





    });

}




function ScheduledFind() {

    var time = new Date();

    db.collection('users').find({ active: { $eq: 1 } }).toArray(function (err, result) {

        if (!err && (result.length > 0)) {

            result.forEach(function (user) {

                findEvents(user, time);
            })

        }
        else {
            return console.log(err);
        }
    });


}

 

 


app.get('/save_user_special', (req, res) => {
    var users = fakes.getUsersFromFiles();

    async.map(users, function (user, callback) {

        db.collection('users').save(user, (err, result) => {
            if (err) {
                callback(err, "NOT OK");
            }

            console.log('saved to database')
            callback(null, "OK");
        });

    }, function (err, results) {

        res.send("OK");
    });

})



