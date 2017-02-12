
module.exports.saveEvents=saveEvents;
module.exports.logEvents=logEvents;
module.exports.randomString=randomString;
module.exports.sendMail=sendMail;
module.exports.generatePass=generatePass;
module.exports.logError=logError;
module.exports.randomString=randomString;
module.exports.isUS=isUS;
module.exports.addIdsToTrips=addIdsToTrips;

const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const mongodb=require('mongodb');
const ObjectID = mongodb.ObjectID;


/*Inner modules*/
const server = require("./index");
const settings = require("./settings");
const server_settings = require("./server_setting");





/*DB WORKS*/

function saveEvents(user, foundEvents, trip) {
    var id = new ObjectID(user._id);
    var code = user.code || "";
    var tripid=trip.id || 0;
        
    foundEvents = foundEvents.map(function (el, i) {
        var match = {};
        match.event = el;
        match.date = new Date().toString();
        match.trip_id=tripid;
        return match;
    });



    server.db.collection('users').update({ _id: id }, { $push: { matches: { $each: foundEvents } } }
        , (err, result) => {
            if (err) {
                console.log(err);
            }
            //console.log('saved to database')
            var html = '<html><body>'
                + 'id = ' + id
                + 'tripid = ' + tripid                
                + ' Visit <a href="http://localhost:8001/protected?code=' + code + '" target="_blank"> TravelPlay </a> for new matches'
                + ' in ' + trip.city + ' city '
                + '</body></html>';

            sendMail(settings.adminMail, "New matches on TravelPlay", html);
        });


}


function logEvents(time, user, trip, apiUrl, jsonResult, foundEvents,apiName) {

    var time_text="";
    if(typeof(time.toISOString)=="function")
        time_text=time.toISOString();
    else 
        time_text=time;

    

    var folder_name = time_text.toISOString().slice(0, 19).replace(/:/g, '_').replace(/-/g, '_') + "/" + user._id + "/" + "/" + apiName + "/" + "_" + foundEvents.length + "_" + trip.city + new Date().toISOString().slice(0, 19).replace(/:/g, '_').replace(/-/g, '_');
    var dir = "./tech/" + folder_name + "/";
    fs.ensureDir(dir, function (err) {
        if (err) {
            console.log(err) // => null  
            return false;
        } else {
            fs.writeFile(dir + "result.json", JSON.stringify(jsonResult), function (err) {
                if (err) {
                    console.log(err);
                    return false;
                }

                //console.log("The file was saved!");
            });
            fs.writeFile(dir + "apiurl.json", apiUrl, function (err) {
                if (err) {
                    console.log(err);
                    return false;
                }

                //console.log("The file was saved!");
            });

            fs.writeFile(dir + "found.json", JSON.stringify(foundEvents), function (err) {
                if (err) {
                    console.log(err);
                    return false;
                }

                // console.log("The file was saved!");
            });
        }


    })
}


function addIdsToTrips() {
         server.db.collection('users').find().toArray(function (err, result) {

            if (!err) {
                    for(i=0;i<result.length;i++) {
                        id = new ObjectID(result[i]._id);
                        var trips=result[i].trips;
                        trips=trips.map(function(el,i){
                            trip=el;
                            if(!el.id)
                                trip.id=randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
                            return trip;
                        });                        

                        server.db.collection('users').update({ _id: id }, { $set: { trips: trips } }
                            , (err, result) => {
                                if (err) {
                                    console.log(err);
                                }

                                console.log('updated database')
                                
                            });

                    }
            }
        });
}



/*HELPER FUNCTIONS*/


function randomString(length, chars) {
//console.log(randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'));     
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

};



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
