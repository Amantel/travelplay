module.exports.getfakeCall = getfakeCall;
module.exports.getTopAlbums = getTopAlbums;
module.exports.getTopAlbumsFromFile = getTopAlbumsFromFile;
module.exports.getTravelsFromFile = getTravelsFromFile;
module.exports.getUsersFromFiles = getUsersFromFiles;


const request = require('request');
const async = require('async');
const fs = require('fs-extra');


/*Inner modules*/
const tech = require("./tech");
const server = require("./index");



function getfakeCall(apiUrl, trip, artistList, user, time) {
    if (artistList.length === 0) {
        for (i = 0; i < 21; i++) {
            artistList.push("band name X=" + i);
        }
    }
    //OK we have JSON with X (11-60) "events". Let us populate them.

    var bandNameFound1 = artistList[Math.floor(Math.random() * 8) + 1];
    var bandNameFound2 = artistList[Math.floor(Math.random() * 10) + 8];

    var N = Math.round(Math.random() * 50) + 10;
    var fakeEvents = [];
    var foundEvents = [];
    for (i = 0; i < N; i++) {

        var event = {};
        event.id = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
        event.text = "RANDOM TEXT FOR TEST";
        event.date = "RANDOM DATE FOR TEST";

        if (Math.floor(Math.random() * 10) + 1 == 10) {

            if (Math.round(Math.random()) == 1)
                event.text = bandNameFound1;
            else
                event.text = bandNameFound2;

            foundEvents.push(event);
        }


        fakeEvents.push(event);
    }
    if (foundEvents.length > 0)
        tech.saveEvents(user, foundEvents, trip);

    tech.logEvents(time, user, trip, apiUrl, fakeEvents, foundEvents);
}


 
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
    });
}

//getTopAlbumsFromFile();

function getTopAlbumsFromFile() {
    var array = fs.readFileSync("bands.json").toString().split(',');
    array = array.map(function (el, i) {

        return { "band": el.toLowerCase(), "additional_info": { "band_name_original": el } };


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
        var date_start = new Date(el.start);
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



function getUsersFromFiles() {
    var bandsGroups = getTopAlbumsFromFile();
    var tripsGroups = getTravelsFromFile();


    var users = tripsGroups.map(function (el, i) {
        var user = {};
        user.email = "amantels@gmail.com";
        user.password = "D12345A";
        user.active = 1;
        user.approved = 1;
        user.updateDate = "Sun Jan 24 2017 17:19:17 GMT+0300 (Russia TZ 2 Standard Time)";
        user.bands = bandsGroups[i];
        user.trips = el;

        //buff("***************");
        //buff(user);
        return user;

    });
    return users;

}