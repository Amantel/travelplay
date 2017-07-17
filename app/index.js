
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
const moment = require('moment');
 


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

var interval;

 
MongoClient.connect(server_settings.mongoUrl, (err, database) => {
    if (err) return console.log(err);
    db = database;


    app.listen(server_settings.port, () => {
        module.exports.app = app;
        module.exports.db = db;

        console.log('listening on ' + server_settings.port);

    //here we have to create Facebook access token    

    
    



    if(server_settings.startAll && server_settings.doSchedule) {
           //later.setInterval(launchMain, later.parse.text('every 8 h'));
		   console.log("start scheduling");
		   var schedulingTime=23*60*60*1000;
		   console.log("schedule each "+schedulingTime+" ms");
		   interval=setInterval(function(){launchMain();},schedulingTime);

        } else {
			if(server_settings.startAll) {
				console.log("start without scheduling");
				launchMain();
			}
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
    var email = json.email.trim();
    var name=json.name || "";
    var surname=json.surname || "";
    var fbId=json.fbId || "";

    if(!email) {
        sess.actionError = "Email already not submited.";                
        res.redirect("/reg");
        return false;
    }

    db.collection('users').find({ email: { $eq: json.email } }).toArray(function (err, result) {

        if (!err) {
            if (result.length > 0) {
                sess.actionError = "Email already registred. Please wait for the approval.";                
                res.redirect("/reg");
                return false;
            }
            else {

                    
                var new_user = {};
                new_user.password = tech.generatePass();
                new_user.code = tech.randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
                new_user.active = 1;
                new_user.approved = 0;
                new_user.email = email;
                new_user.trips = [];
                new_user.bands = [];
                new_user.update = new Date();
                new_user.name= name;
                new_user.surname=surname; 
                new_user.fbId=fbId;
                new_user.registrationCode="";



                async.waterfall([
                    function(callback) {
                        if(req.body.code || null) {
                            db.collection('codes').find({
                                code: { $eq: req.body.code.trim() }
                            }).toArray(function (err, result) {

                                if (!err) {                
                                    callback(null, result[0]); 
                                }
                                else {
                                    callback(err);
                                }
                            });

                            
                            
                        } else {
                            callback(null, 0); 
                        }
                    },
                ], function (err, codeInfo) {
                    if(err) {
                        res.send(err);
                    } else {
                        /*
                        If user entered CODE, but it is bad - stop registration with info
                        */
                        if(codeInfo) {

                            if(codeInfo.active!==1) {
                                sess.actionError = "This code is not active. Please try other, or register without code";
                                res.redirect("/reg");  
                                return false;                              
                            } else if(codeInfo.left<=0) {
                                sess.actionError = "This code has zero registrations left. Please try other, or register without code";
                                res.redirect("/reg");                                
                                return false;
                            } else {
                                new_user.registrationCode=codeInfo.code;
                                new_user.approved=1;


                                //id = new ObjectID(codeInfo._id);
                                id = codeInfo._id;
                                newLeft=codeInfo.left-1;

                                db.collection('codes').update(
                                            { _id: id }, //
                                            { $set: {left:newLeft} },
                                            (err, result) => {
                                                if (err) {
                                                    console.log(err);
                                                    return false;
                                                }
                                            }
                                        );                            }
                        }
                        //save
                        db.collection('users').save(new_user, (err, result) => {
                            if (err) {
                                sess.actionError = "Error with database in: save user";
                                console.log(err);
                                res.redirect("/reg");
                                return false;
                            }

                            if(new_user.approved===0) {

                            sess.actionResult = "User registred. Please wait for approval";

                            html = '<html><body>Visit <a href="' + server_settings.appUrl + 'admin_login" target="_blank"> here </a></body></html>';
                            tech.sendMail(settings.adminMail, "New registration on " + server_settings.appName + " ", html);
                            } else {
                                sess.actionResult = "User registred and approved. Check your inbox for instructions";
                                html = '<html><body>You can visit <a href="' + server_settings.appUrl + 'admin_login" target="_blank"> here </a></body></html>';
                                tech.sendMail(settings.adminMail, "New registration with code on " + server_settings.appName + " ", html);

                                
                                html = '<html><body>'+
                                    '<p><strong>Welcome to Wanderlust.cloud!</strong></p>'+
                                    '<p>You can access your account on <a href="' + server_settings.appUrl + '" target="_blank">' + server_settings.appName + '</a> using your email as username and this password: ' + new_user.password + ' (you can change the password after you login)</p>'+
                                    '<p>Wanderlust.cloud is the easiest system to get relevant suggestions for live gigs you might like during your travels.<br/>'+
                                    'You can easily link your Spotify profile or add a list of your favourite artists manually. You can then also do the same with your upcoming trips, linking your Tripit account so we can automatically retrieve your travel schedule, or adding trips manually through the interface.<br/>'+
                                    'Every time we have new suggestions for you, you will receive an email notification and you can easily check the list of events in your account on Wanderlust.cloud.</p>'+
                                    '<p><strong>Please Note</strong>: Wanderlust.cloud is currently in a very early stage of development, so we will be happy to get your feedback on your experience with it. Send your questions, comments and suggestions to <a href="mailto:info@wanderlust.cloud">info@wanderlust.cloud</a>.</p>'+
                                    '<p>Thanks!</p>'+
                                    '<p>Francesco</p>'+
                                    '</body></html>';
                                
                                tech.sendMail(new_user.email, "Welcome to " + server_settings.appName, html);



                                
                            }

                            res.redirect("/");
                            return true;

                        });

                    }
                    
                    
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

    if(sess.auth==2)
        res.redirect('/users');

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



function loginUser(res,usersArray,sess,actions) {
    if (usersArray.length > 0) {
        console.log("USER FOUND");
        if (usersArray[0].approved) {
            console.log("USER AUTHED");
            sess.freshAuth=1;
            sess.auth = "1"; //AUTH COMPLETED
            sess.authed_user = usersArray[0];
            sess.authed_user.current_auth = sess.auth;
            res.redirect("/");
            //res.redirect("/my_trips");
        } else {
            sess.auth = "0";
            sess.authed_user = {};
            console.log("Not approved");                        
            actions.actionResult="";
            actions.actionError="User not approved";
            res.render('login.ejs', {actions:actions });

        }
    }
    else {
        sess.auth = "0";
        sess.authed_user = {};
        console.log("Wrong credentials");
        actions.actionResult="";
        actions.actionError="Wrong credentials";
        
        res.render('login.ejs', {actions:actions });
    }
}


app.all('/login', (req, res) => {
    sess = req.session;
    var actions={};
    if ((req.body.login || null) && (req.body.password || null) && (req.body.email || null)) {
        db.collection('users').find({
            email: { $eq: req.body.email.trim() },
            password: { $eq: req.body.password.trim() }
        }).toArray(function (err, result) {

            if (!err) {                
                loginUser(res,result,sess,actions);
            }
            else {
                res.send({ error: err });

            }
        });

    } 
    else  if ((req.body.login || null) && (req.body.fbAccessToken || null)) {
        //We got token. Now will find user ID by it:

        var url="https://graph.facebook.com/debug_token?input_token="+
            req.body.fbAccessToken.trim()+
            "&access_token="+server_settings.FBappID+
            "|"+server_settings.FBappSecret+"";

        request({
            url: url
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var json = JSON.parse(body);
                if (!json) {
                    console.log("FB ERROR JSON");
                    res.redirect("/login");
                    return false;                    
                }

                if(json.data.app_id && json.data.user_id) {
                    if(
                        json.data.app_id==server_settings.FBappID &&
                        json.data.is_valid
                    ) {

                        db.collection('users').find({
                            fbId: { $eq: json.data.user_id },
                        }).toArray(function (err, result) {
                            if (!err) {                
                                loginUser(res,result,sess,actions);
                            }
                            else {
                                res.send({ error: err });

                            }
                        });

                    }
                } else {
                    console.log("FB ERROR JSON FORMAT");
                    console.log(json);                    
                    res.redirect("/login");
                    return false;
                }




                
            } else {
                console.log("FB ERROR");
                console.log(error);
                res.redirect("/login");
                return false;
            }
        });        




    }

    else {
        res.render('login.ejs', { actions:actions });
    }




});





app.post("/manage_code", (req, res) => {
 

    if ((req.body.save || null) && (req.body.id || null)) {
        var active = 0;
        if (req.body.active && req.body.active==1) {
            active = 1;
        }

        id = new ObjectID(req.body.id);

        db.collection('codes').update({ _id: id }, { $set: { active: active } },
            (err, result) => {
                if (err) {
                    res.send({ error: err });
                }
                res.redirect("/users");
                return true;

            });
    }

    else if ((req.body.new_code || null) && (req.body.code || null) && (req.body.total || null)) {

        


        db.collection('codes').save(
            {
                dateAdded: new Date(),
                code:req.body.code.replace(" ","_"),
                active:1,
                total:req.body.total,
                left:req.body.total
            }, (err, result) => {
                if (err) {
                    sess.actionError = "Error with database in: manage code";
                    console.log(err);
                    res.redirect("/users");
                    return false;
                }

                sess.actionResult = "New code added";
                res.redirect("/users");
                return true;

            });


    }
    else {
        res.redirect("/users");
    }




});











app.post("/approve_user", (req, res) => {
    if ((req.body.delete || null) && (req.body.id || null)) {
        id = new ObjectID(req.body.id);
        db.collection('users').remove( {"_id": id});
        res.redirect("/users");

    }


    if ((req.body.save || null) && (req.body.id || null)) {
        var approved = 0;
        if (req.body.approved && req.body.approved==1) {
            approved = 1;
        }

        id = new ObjectID(req.body.id);

        db.collection('users').update({ _id: id }, { $set: { approved: approved } },
            (err, result) => {
                if (err) {
                    res.send({ error: err });
                }


                if ((req.body.email || null) && approved) {

                    //var html = '<html><body>You can now access <a href="' + server_settings.appUrl + '" target="_blank">' + server_settings.appName + '</a> with your email and password: ' + password + ' </body></html>';
                    var html = '<html><body>'+
                        '<p><strong>Welcome to Wanderlust.cloud!</strong></p>'+
                        '<p>You can access your account on <a href="' + server_settings.appUrl + '" target="_blank">' + server_settings.appName + '</a> using your email as username and this password: ' + req.body.password + ' (you can change the password after you login)</p>'+
                        '<p>Wanderlust.cloud is the easiest system to get relevant suggestions for live gigs you might like during your travels.<br/>'+
                        'You can easily link your Spotify profile or add a list of your favourite artists manually. You can then also do the same with your upcoming trips, linking your Tripit account so we can automatically retrieve your travel schedule, or adding trips manually through the interface.<br/>'+
                        'Every time we have new suggestions for you, you will receive an email notification and you can easily check the list of events in your account on Wanderlust.cloud.</p>'+
                        '<p><strong>Please Note</strong>: Wanderlust.cloud is currently in a very early stage of development, so we will be happy to get your feedback on your experience with it. Send your questions, comments and suggestions to <a href="mailto:info@wanderlust.cloud">info@wanderlust.cloud</a>.</p>'+
                        '<p>Thanks!</p>'+
                        '<p>Francesco</p>'+
                        '</body></html>';
                    
                    tech.sendMail(req.body.email, "Welcome to " + server_settings.appName, html);
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


async.parallel([
    function(callback) {
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

                callback(null, result);


            }
            else {
                callback(err);
            }
        });


    },
    function(callback) {
        db.collection('codes').find().toArray(function (err, result) {
            if (!err) {
                callback(null, result);
            }
            else {
                callback(err);
                
            }
        });
    }
],
// optional callback
function(err, results) {
    if(err) {
        res.send(err);
    } else {
        var users=results[0];
        var codes=results[1];
        res.render('users.ejs', { users: users,codes:codes });

    }
    // the results array will equal ['one','two'] even though
    // the second function had a shorter timeout.
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
        res.render('profile_trips.ejs', { session: sess, actions: actions, tripItResult: tripItResult,moment: moment });
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

            res.render('profile_results.ejs', { session: sess, actions: actions, matches: matchesByTrips,moment: moment });

        });






    } else {
        res.redirect("/");
    }
});





app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect("/");
});




app.all('/change_pass', (req, res) => {
    
    sess = req.session;

    //req.body.save

    var actions = {};

    actions.actionResult = sess.actionResult;
    actions.actionError = sess.actionError;

    delete sess.actionResult;
    delete sess.actionError;
    if(req.body.passchange && sess.auth == 1) {
        if(!req.body.oldpass || !req.body.newpass1 || !req.body.newpass1) {
            actions.actionError="Please, fill all fields";
            res.render('change_pass.ejs', { session: sess, actions: actions });
        }
        else if(!req.body.oldpass) {
            actions.actionError="You forgot to type in your old password";
            res.render('change_pass.ejs', { session: sess, actions: actions });
        } else if(req.body.newpass1!==req.body.newpass2) {
            actions.actionError="New password mismatch. You should type your new password twice";
            res.render('change_pass.ejs', { session: sess, actions: actions });
        } else {
            //check if old pass is valid and then render  

    
            db.collection('users').find({
                email: { $eq: sess.authed_user.email },
                password: { $eq: req.body.oldpass }
            }).toArray(function (err, result) {

                if (!err) {
                    if (result.length > 0) {
                         //update this user password
                        var id = new ObjectID(sess.authed_user._id);

                        db.collection('users').update(
                            { "_id": { $eq: id } }, //
                            { $set: { "password": req.body.newpass1 } },
                            {
                                upsert: false
                            },
                            (err, result) => {
                                if (err) {
                                   actions.actionError="Database error - can not update password. Please contact us.";
                                   res.render('change_pass.ejs', { session: sess, actions: actions });
                                }                                    
                                else
                                 {
                                   if(result.result.nModified>0)  {
                                        actions.actionResult="Password updated. You can use it on your next login.";
                                   } else {
                                        actions.actionError="Can not update password. Please contact us.";
                                   }
                                   res.render('change_pass.ejs', { session: sess, actions: actions });

                                 }
                            }
                        );                         
                    }
                    else {
                        actions.actionError="Old password seems wrong";
                        res.render('change_pass.ejs', { session: sess, actions: actions });
                    }

                }
                else {
                    actions.actionError="Database error. Please contact us.";
                    res.render('change_pass.ejs', { session: sess, actions: actions });
                }
            });


 


        }
    } else {
        if (sess.auth == 1) {
            res.render('change_pass.ejs', { session: sess, actions: actions });
        }
        else {
            res.redirect("/");
        }
    }

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
        if(sess.freshAuth!=1)
            res.render('profile.ejs', { session: sess, actions: actions });
        else 
            {
                sess.freshAuth=0;
                res.redirect("/my_trips");
            }    
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




app.get('/reg', (req, res) => {
        sess = req.session;
        var actions = {};
        actions.actionResult = sess.actionResult;
        actions.actionError = sess.actionError;

        delete sess.actionResult;
        delete sess.actionError;

       res.render('first.ejs', {actions:actions});

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
            if(!(response.Trip instanceof Array))
                response.Trip=[response.Trip];			
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
	tech.logT("USER: "+user.email,server_settings.queryEventsVerb);
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
            if (new Date(trip.end).setHours(23,59) > new Date()) {
                tech.logT(trip.city,server_settings.queryEventsVerb);
                if (tech.isUS(trip.country)) {
                    //tech.logT("US:" + trip.city + " later",server_settings.queryEventsVerb);
                    //apis.findEventsTicketMaster(settings.TicketMasterUrl, trip, artistList, user, time,innerCallback2);
                    apis.findSongKickEvents(settings.SongKickUrl, trip, artistList, user, time, settings.SongKickLocationUrl, innerCallback2);

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

        if (new Date(trip.end).setHours(23,59) > new Date()) {
            var apiUrl = "";



            db.collection('matchesn').find({ tripid: { $eq: trip.id } }).toArray(function (err, result) {
                if (!err) {
                    if (result.length > 0) {

                        var firstTier = [];
                        var secondTier = [];
                        var thirdTier = [];
                        var failedGenres = [];
                        var prevTiers=[];

                        
                        result.forEach(function (match) {
                            if(match.tier>0 && match.tier<3) 
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
                                    
                        if(user && user.active && user.email && ((firstTier.length+secondTier.length)>prevTiers.length)) {

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
	//db.collection('users').find({ active: { $eq: 1 },email:{$eq: "mikael.johansson12@yahoo.se"} }).toArray(function (err, result) {
    db.collection('users').find({ active: { $eq: 1 } }).toArray(function (err, result) {
        if (!err && (result.length > 0)) {
			console.log("Active users"+result.length);
            //loop
            async.each(result, findEvents.bind(null, time), function (err, result) {
				tech.logT("queryEvents ending for all users",server_settings.queryEventsVerb);
                globalSeriesCallback(null, "findEventsFinished");
            });

        }
        else {
			tech.logT("Error in quering for Users",server_settings.queryEventsVerb);
            globalSeriesCallback(err);
        }
    });

 
}

