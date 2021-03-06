
module.exports.saveEvents = saveEvents;
module.exports.savePerformancesToTrip = savePerformancesToTrip;
module.exports.logEvents = logEvents;
module.exports.randomString = randomString;
module.exports.sendMail = sendMail;
module.exports.generatePass = generatePass;
module.exports.logError = logError;
module.exports.randomString = randomString;
module.exports.isUS = isUS;
module.exports.addIdsToTrips = addIdsToTrips;
module.exports.checkGenres = checkGenres;
module.exports.getUserGenres = getUserGenres;
module.exports.logToFile = logToFile;
module.exports.logT = logT;


const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const mongodb = require('mongodb');
const ObjectID = mongodb.ObjectID;
const request = require('request');
const async = require('async');


/*Inner modules*/
const server = require("./index");
const settings = require("./settings");
const server_settings = require("./server_setting");





/*DB WORKS*/







function savePerformancesToTrip(user, performances, trip, callbackFunction) {
    var tripid = trip.id;
    performances = performances.map(p => {
        p.tripid = tripid;
        return p;
    });

    server.db.collection('matchesn').find({ tripid: { $eq: tripid } }).toArray(function (err, result) {
        if (result.length > 0) {
            newPerformances = performances.filter(function (newPerformance) {

                var isInDBArr = result.filter(function (oldPerformance) {
                    if (
                        oldPerformance.artist_name.toLowerCase() == newPerformance.artist_name.toLowerCase() &&
                        oldPerformance.venue_name.toLowerCase() == newPerformance.venue_name.toLowerCase() &&
                        oldPerformance.start_date.toLowerCase() == newPerformance.start_date.toLowerCase() &&
                        oldPerformance.source.toLowerCase() == newPerformance.source.toLowerCase()
                    )
                        return true;

                    return false;

                });

                if (isInDBArr.length > 0)
                    return false; //if there is one or more performances in DB   
                else
                    return true;  //if there is no performance in DB           
            });
        }
        else {
            newPerformances = performances;
        }

        if (newPerformances.length > 0) {
            server.db.collection("matchesn").insert(
                newPerformances,
                function (err, result) {
                    if (!err) {
                        console.log(trip.city + " inserted new events: " + result.insertedCount);
                        callbackFunction();
                    }
                    else {
                        console.log(err);
                        callbackFunction(err);
                    }
                   
                }.bind({ trip: trip }));
        }
        else {
            console.log("no new events for trip to " + trip.city);
            callbackFunction();
        }
    }.bind({ trip: trip }));
}


function saveEvents(user, foundEvents, trip) {
    var id = new ObjectID(user._id);
    var code = user.code || "";
    var tripid = trip.id || 0;

    foundEvents = foundEvents.map(function (el, i) {
        var match = {};
        match.event = el;
        match.date = new Date().toString();
        match.trip_id = tripid;
        return match;
    });



    server.db.collection('users').update({ _id: id }, { $push: { matches: { $each: foundEvents } } },
        (err, result) => {
            if (err) {
                console.log(err);
            }
            //console.log('saved to database')
            var html = '<html><body>' +
                'id = ' + id +
                'tripid = ' + tripid +
                ' Visit <a href="' + server_settings.appUrl + 'protected?code=' + code + '&r=my_results" target="_blank"> TravelPlay </a> for new matches' +
                ' in ' + trip.city + ' city ' +
                '</body></html>';

            sendMail(settings.adminMail, "New matches on TravelPlay", html);
        });


}

function logToFile(file_name, jsonResult) {

    fs.writeFile(file_name, JSON.stringify(jsonResult), function (err) {
        if (err) {
            console.log(err);
            return false;
        } else {
            console.log(file_name + " written");
        }
    });
}




function logEvents(time, user, trip, apiUrl, jsonResult, foundEvents, apiName) {

    var time_text = "";
    if (typeof (time.toISOString) == "function")
        time_text = time.toISOString();
    else
        time_text = time;



    var folder_name = time_text.slice(0, 19).replace(/:/g, '_').replace(/-/g, '_') + "/" + user._id + "/" + "/" + apiName + "/" + "_" + foundEvents.length + "_" + trip.city + new Date().toISOString().slice(0, 19).replace(/:/g, '_').replace(/-/g, '_');
    var dir = "./tech/" + folder_name + "/";
    fs.ensureDir(dir, function (err) {
        if (err) {
            console.log(err); // => null  
            return false;
        } else {
            fs.writeFile(dir + "result.json", JSON.stringify(jsonResult), function (err) {
                if (err) {
                    console.log(err);
                    return false;
                }

            });
            fs.writeFile(dir + "apiurl.json", apiUrl, function (err) {
                if (err) {
                    console.log(err);
                    return false;
                }

            });

            fs.writeFile(dir + "found.json", JSON.stringify(foundEvents), function (err) {
                if (err) {
                    console.log(err);
                    return false;
                }

            });
        }


    });
}


function addIdsToTrips() {
    server.db.collection('users').find().toArray(function (err, result) {

        if (!err) {
            var addTripIDtoTrips = function (trip) {
                if (!trip.id)
                    trip.id = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
                return trip;
            };
            var updateDBaction = function (err, result) {
                if (err) {
                    console.log(err);
                }

                console.log('updated database');
            };



            for (i = 0; i < result.length; i++) {
                id = new ObjectID(result[i]._id);
                var trips = result[i].trips;
                trips = trips.map(addTripIDtoTrips);

                server.db.collection('users').update(
                    { _id: id }, { $set: { trips: trips } }, updateDBaction
                );

            }
        }
    });
}


function checkGenres(url) {
    request({
        url: url,
        headers: {
            'User-Agent': 'TravelPlay Robot 1/X'
        }
    }, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            var json = JSON.parse(body);
            var genres = json.results.map(function (result) {
                var curGenres = [];
                curGenres = curGenres.concat(result.style);
                curGenres = curGenres.concat(result.genre);
                return curGenres;
            }).reduce(function (a, b) {
                return a.concat(b);
            });
            genreInfoUniq = [...new Set(genres)];

            console.log(genreInfoUniq);
        } else {
            console.log(err);

        }
    });

}

function getUserGenres(bands) {
    if (!bands || bands.length < 1)
        return [];

    genreInfo = bands.map(band => band.genres).
        reduce(function (totalArray, genreArray) {
            return (totalArray || []).concat(genreArray);
        }).filter(genre => genre !== "");



    var countedGenres = {};
    genreInfo.forEach(function (i) { countedGenres[i] = (countedGenres[i] || 0) + 1; });


    var sortable = [];
    for (var genre in countedGenres)
        sortable.push([genre, countedGenres[genre]]);

    sortable.sort(function (a, b) {
        return b[1] - a[1];
    });

    genreInfoUniq = sortable.filter(x => x[1] > Math.ceil(bands.length / 100)).map(x => x[0]);
    //logToFile("francesco_genres.json", genreInfoUniq);

    return genreInfoUniq;



}




/*HELPER FUNCTIONS*/


function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}



function sendMail(email, subject, html) {

    var transporter = nodemailer.createTransport(server_settings.smtpConfig);
    var mailData = {
        from: server_settings.mailFrom,
        to: email,
        subject: subject,
        text: 'Only HTML here, sorry',
        html: html
    };


    transporter.sendMail(mailData, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });

    return true;

}



function logError(err, result) {
    if (err) {

        console.log("-----");
        console.log(new Date().toISOString());
        console.log("Error: ");
        console.log(err);
        console.trace();
        console.log("-----");
    }
}

function logT(text,verbose)
{
    if(verbose)
        console.log(new Date().toISOString()+" >>> "+text);
}



function generatePass() {
    return Math.random().toString(36).slice(-8);
}

function isUS(country) {
    country = country.toLowerCase();
    if (country == "us" || country == "united states")
        return true;
    else
        return false;

}
