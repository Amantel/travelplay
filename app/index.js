var BiTtestResponse = [{ "id": 12938812, "title": "Rage @ G\u00f6ta K\u00e4llare in Stockholm, Sweden", "datetime": "2017-01-15T19:00:00", "formatted_datetime": "Sunday, January 15, 2017 at 7:00PM", "formatted_location": "Stockholm, Sweden", "ticket_url": "http://www.bandsintown.com/event/12938812/buy_tickets?app_id=TRAVELPLAY_ID\u0026artist=Rage\u0026came_from=67", "ticket_type": "Tickets", "ticket_status": "available", "on_sale_datetime": null, "facebook_rsvp_url": "http://www.bandsintown.com/event/12938812?app_id=TRAVELPLAY_ID\u0026artist=Rage\u0026came_from=67", "description": null, "artists": [{ "name": "Rage", "mbid": "2a90aa9c-d2ff-49fd-a8e5-2463f657eb45", "image_url": "https://s3.amazonaws.com/bit-photos/large/6724943.jpeg", "thumb_url": "https://s3.amazonaws.com/bit-photos/thumb/6724943.jpeg", "facebook_tour_dates_url": "http://www.bandsintown.com/Rage/facebookapp?came_from=67", "facebook_page_url": "http://www.facebook.com/pages/Rage/802922219754478", "tracker_count": 16096, "url": "Rage", "website": "http://www.rage-on.de/" }], "venue": { "name": "G\u00f6ta K\u00e4llare", "place": "G\u00f6ta K\u00e4llare", "city": "Stockholm", "region": null, "country": "Sweden", "latitude": 59.315808, "longitude": 18.079347 } },
{ "id": 12768408, "title": "Accept @ Hovet in Stockholm, Sweden", "datetime": "2017-03-24T19:00:00", "formatted_datetime": "Friday, March 24, 2017 at 7:00PM", "formatted_location": "Stockholm, Sweden", "ticket_url": "http://www.bandsintown.com/event/12768408/buy_tickets?app_id=TRAVELPLAY_ID\u0026artist=Accept\u0026came_from=67", "ticket_type": "Tickets", "ticket_status": "available", "on_sale_datetime": "2016-08-26T10:00:00", "facebook_rsvp_url": "http://www.bandsintown.com/event/12768408?app_id=TRAVELPLAY_ID\u0026artist=Accept\u0026came_from=67", "description": "Special guests of Sabaton.", "artists": [{ "name": "Accept", "mbid": "41f4d85a-0bd7-4602-a3e3-8c47f36efb0a", "image_url": "https://s3.amazonaws.com/bit-photos/large/7087362.jpeg", "thumb_url": "https://s3.amazonaws.com/bit-photos/thumb/7087362.jpeg", "facebook_tour_dates_url": "http://www.bandsintown.com/Accept/facebookapp?came_from=67", "facebook_page_url": "https://www.facebook.com/accepttheband", "tracker_count": 127827, "url": "Accept", "website": null }, { "name": "Sabaton", "mbid": "39a31de6-763d-48b6-a45c-f7cfad58ffd8", "image_url": "https://s3.amazonaws.com/bit-photos/artistLarge.jpg", "thumb_url": "https://s3.amazonaws.com/bit-photos/artistThumb.jpg", "facebook_tour_dates_url": "http://www.bandsintown.com/Sabaton/facebookapp?came_from=67", "facebook_page_url": "http://www.facebook.com/sabaton", "tracker_count": 127310 }, { "name": "Accept", "mbid": "41f4d85a-0bd7-4602-a3e3-8c47f36efb0a", "image_url": "https://s3.amazonaws.com/bit-photos/artistLarge.jpg", "thumb_url": "https://s3.amazonaws.com/bit-photos/artistThumb.jpg", "facebook_tour_dates_url": "http://www.bandsintown.com/Accept/facebookapp?came_from=67", "facebook_page_url": "https://www.facebook.com/accepttheband", "tracker_count": 127827 }], "venue": { "name": "Hovet", "place": "Hovet", "city": "Stockholm", "region": "26", "country": "Sweden", "latitude": 59.3333333, "longitude": 18.05 } }];

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




const app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'));




//GRAB FIRST 500
var ticketmaster_url = "https://app.ticketmaster.com/discovery/v2/events.json?apikey=F2JzydFhRbFjtW3DG3lNQXjDNCzzZujN"
    + "&startDateTime=2017-02-01T09:15:00Z&endDateTime=2017-02-28T20:15:00Z"
    + "&size=500"
    + "&city=New York"
    + "&classificationId=KZFzniwnSyZfZ7v7nJ";
//buff(ticketmaster_url);
//KZFzniwnSyZfZ7v7nJ music
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




var songKey = "7czFd6q870oymybH";
var songStockId = "32252";


//var BandsInTownUrl="http://api.bandsintown.com/artists/ARTIST_NAME/events/search.json?api_version=2.0&app_id=TRAVELPLAY_ID&location=Stockholm&radius=10&date=2017-01-01,2017-06-31";




app.listen(3000, () => {
    buff('listening on 3000')
})


var useModules = {};
useModules.useSpotify = true; 
useModules.useTicketMaster = false;
useModules.useBandsInTown = true;
useModules.useTicketMasterEurope = false;
useModules.useSongKick = false;


var modelCurrent = {};
modelCurrent.BandsInTownUrl = "http://api.bandsintown.com/artists/ARTIST_NAME/events/recommended.json?api_version=2.0&app_id=TRAVELPLAY_ID&location=Stockholm&radius=10&date=2017-01-01,2017-06-31";






app.get('/', (req, res) => {

    var code = req.query.code || null;
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    modelCurrent.authorizeURL = authorizeURL;
    modelCurrent.res = res;

     if (!useModules.useSpotify) {
        findEvents(["rage", "accept", "voltaire", "metallica"]);
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

            //   buff(all_artists.distinct_list);
            buff("Followed (c) Spotify: " + all_artists.distinct_list.length);

            //findTickets(res,res,authorizeURL, all_artists);

            //makeRequest(ticketmaster_url,{authorizeURL:authorizeURL,res:res,all_artists:all_artists },findTicketsTicketMaster,callbackErrorGeneral)
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
        findBandsinTownEvents(artistList, true); //2 timeOut may be false

    }
    else if (useModules.useTicketMaster) {
        buff("*********************TicketMaster**************************");

    }
    else if (useModules.useTicketMasterEurope) {
        buff("*********************TicketMasterEurope**************************");

    }
    else if (useModules.useSongKick) {
        buff("*********************SongKick**************************");

    }
    else {
        buff("*********************No Event Source**************************");
        modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": [] } });
    }


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



            //buff(events[0]);

            buff("Results: " + results.length);
            buff("Events: " + events.length);
            buff("*********************FINISHED WITH SUCCESS*********************");

            //console.log(events);
            modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });


        }
    });


}
function makeBandRequest(artistName, callback) {
    //buff("Searching for "+artistName);    
    makeRequest(modelCurrent.BandsInTownUrl.replace("ARTIST_NAME", encodeURI(artistName)), { callback: callback }, findBrandsinTownEvent, callbackErrorGeneral);

}


function makeBandRequestTimeOut(artistName, callback) {

    setTimeout(function () {
        //buff("Searching for "+artistName);    
        makeRequest(modelCurrent.BandsInTownUrl.replace("ARTIST_NAME", encodeURI(artistName)), { callback: callback }, findBrandsinTownEvent, callbackErrorGeneral);
    }, Math.random() * 100);
}


function findBrandsinTownEvent(data) {

    var foundEvents = [];
    var json = JSON.parse(data);

    iteratorMarker++

    //buff("data");
    buff(json.length);

    if (json && json.length > 0 && (typeof (json.errors) == "undefined")) {
        foundEvents = json.map(function (elem) {
            return { "event_title": elem.title, "event": elem };
        });
    } else {
        if (typeof (json) == "object" && json.errors && json.errors.length > 0) {
            //If error return immediately
            return json.errors[0];
        }
    }
    return foundEvents;
}





function callbackErrorGeneral(e) {
    buff("Callback Error:");
    buff(e);
}


function makeRequest(url, params, callbackSuccess, callbackError) {
    // buff("making request to URL: "+url);

    var url_instance = new URIlib.URI(url);
    var transport = (url_instance.getScheme() || "").toLowerCase() === "https" ? https : http;

    var queryParams = url_instance.parseQuery();


    var httpParams = {
        host: url_instance.getAuthority(),
        headers: { 'user-agent': 'Mozilla/5.0' }
    }

    httpParams.path = (url_instance.getPath() || "") + "?" + queryParams.toString();

    var transpot_info = transport.get(httpParams, function (result) {
        var data = "";
        result.on("data", function (chunk) {
            data += chunk;
        }).on("end", function () {
            var result = callbackSuccess(data, url, params);
            //buff(result.length);
            if (params && typeof (params.callback) == "function") {
                var err = null;
                if (typeof (result) == "string")
                    err = result;
                params.callback(err, result);
            }
        }
            )

    }).on('error', function (e) { callbackError(e, url, params) });

}


















function findTicketsTicketMaster(data, url, params) {

    var all_artists = params.all_artists;

    var json = JSON.parse(data);
    buff("Total Elements: ");
    buff(json.page.totalElements);
    if (json.page.totalElements < 1) {
        all_artists.artistsWithTickets = ["Zero events Found"];

        res.render('index.ejs', { auth_url: authorizeURL, other_info: all_artists });
        return false;
    }

    buff("--------");
    buff("First Element: ");
    buff(json._embedded.events[0].name);
    buff("--------");
    var concerts = json._embedded.events;
    var artistList = all_artists.distinct_list;
    //Test - artistList.push("Les Liaisons Dangereuses");
    var totalFoundTickets = 0;
    artistsWithTickets = artistList.map(function (artistName) {
        artistName = artistName.toLowerCase();
        var foundTickets = concerts.filter(function (concert, index, array) {

            bandName = concert.name.toLowerCase();
            //buff(bandName);
            return (bandName.indexOf(artistName) > -1 || artistName.indexOf(bandName) > -1);
        });
        totalFoundTickets += foundTickets.length;
        var text = "Band \"" + artistName + "\" found " + foundTickets.length + " in " + concerts.length + " events";
        if (foundTickets.length > 0) {
            buff(text);
            text += " !!!"
        }
        return text;

    });
    //buff(artistsWithTickets);
    buff("Всего билетов найдено: " + totalFoundTickets);

    all_artists.artistsWithTickets = artistsWithTickets;
    params.res.render('index.ejs', { auth_url: params.authorizeURL, other_info: all_artists });
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