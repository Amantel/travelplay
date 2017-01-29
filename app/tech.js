
module.exports.saveEvents=saveEvents;
module.exports.logEvents=logEvents;
module.exports.randomString=randomString;
module.exports.sendMail=sendMail;
module.exports.generatePass=generatePass;
module.exports.logError=logError;
module.exports.randomString=randomString;

const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const mongodb=require('mongodb');
const ObjectID = mongodb.ObjectID;


/*Inner modules*/
const server = require("./index");





/*DB WORKS*/

function saveEvents(user, foundEvents, trip) {
    var id = new ObjectID(user._id);
    var code = user.code || "";
    foundEvents = foundEvents.map(function (el, i) {
        var match = {};
        match.event = el;
        match.date = new Date().toString();
        return match;
    });



    server.db.collection('users').update({ _id: id }, { $push: { matches: { $each: foundEvents } } }
        , (err, result) => {
            if (err) {
                buff(err);
            }


            //buff('saved to database')
            var html = '<html><body>'
                + 'id = ' + id
                + ' Visit <a href="http://localhost:3000/protected?code=' + code + '" target="_blank"> TravelPlay </a> for new matches'
                + ' in ' + trip.city + ' city '
                + '</body></html>';

            sendMail(server.settings.adminMail, "New matches on TravelPlay", html);
        });


}


function logEvents(time, user, trip, apiUrl, jsonResult, foundEvents) {
    //buff("logging");
    var folder_name = time.toISOString().slice(0, 19).replace(/:/g, '_').replace(/-/g, '_') + "/" + user._id + "/" + "_" + foundEvents.length + "_" + trip.city + new Date().toISOString().slice(0, 19).replace(/:/g, '_').replace(/-/g, '_');
    var dir = "./tech/" + folder_name + "/";
    fs.ensureDir(dir, function (err) {
        if (err) {
            buff(err) // => null  
            return false;
        } else {
            fs.writeFile(dir + "result.json", JSON.stringify(jsonResult), function (err) {
                if (err) {
                    buff(err);
                    return false;
                }

                //buff("The file was saved!");
            });
            fs.writeFile(dir + "apiurl.json", apiUrl, function (err) {
                if (err) {
                    buff(err);
                    return false;
                }

                //buff("The file was saved!");
            });

            fs.writeFile(dir + "found.json", JSON.stringify(foundEvents), function (err) {
                if (err) {
                    buff(err);
                    return false;
                }

                // buff("The file was saved!");
            });
        }


    })
}




/*HELPER FUNCTIONS*/


function randomString(length, chars) {
//buff(randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'));     
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

    // buff('mail sent');
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
