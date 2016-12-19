const express = require('express');
const bodyParser = require('body-parser')

const http = require('http');
const https = require("https");
const URIlib = require('./URI')
const url = require('url');

const nodemailer = require('nodemailer');
const later = require('later');

var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');




const app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'));
//GRAB FIRST 500
var ticketmaster_url="https://app.ticketmaster.com/discovery/v2/events.json?apikey=F2JzydFhRbFjtW3DG3lNQXjDNCzzZujN&startDateTime=2017-01-17T20:15:00Z&endDateTime=2017-01-20T20:15:00Z&size=500&city=New%20York&classificationId=KZFzniwnSyZfZ7v7nJ";
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









 


app.listen(3000, () => {
    console.log('listening on 3000')
})

app.get('/', (req, res) => {


    var code = req.query.code || null;
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

    if(spotifyApi.getAccessToken()) {
        getFollowedArtists(true,res,authorizeURL);
    }
    else if(code) {
        spotifyApi.authorizationCodeGrant(code).then(function (authInfo) {
            spotifyApi.setAccessToken(authInfo.body['access_token']);
            spotifyApi.setRefreshToken(authInfo.body['refresh_token']);
            res.redirect('/');

        });
    } else {
         res.render('index.ejs', { auth_url: authorizeURL, other_info: {} });
    }






})


function getFollowedArtists(andRelated=false,res,authorizeURL) {

    spotifyApi.getFollowedArtists({ limit: 20 }).then(function artistsInfo(basicInfo) {
        var found_artists = basicInfo.body.artists.items;
        var all_artists;
        if(andRelated) {
            Promise.all(found_artists.map(function (artist) {
                return spotifyApi.getArtistRelatedArtists(artist.id);
            })).then(function (allRelatedArtists) {
                for(i=0;i<found_artists.length;i++) 
                    found_artists[i].related=allRelatedArtists[i].body.artists;


                all_artists=found_artists;
                all_artists.distinct_list=[];    

                for(i=0; i<all_artists.length; i++) {
                    var artist=all_artists[i];
                    if(all_artists.distinct_list.indexOf(artist.name)<0)
                        all_artists.distinct_list.push(artist.name);
                    for(j=0; j<artist.related.length; j++) {
                        var related_artist=artist.related[j];
                        if(all_artists.distinct_list.indexOf(related_artist.name)<0)
                            all_artists.distinct_list.push(related_artist.name);
                    }

                }
                all_artists.distinct_list.sort(function(a, b){
                    if(a < b) return -1;
                    if(a > b) return 1;
                    return 0;
                })

             //   console.log(all_artists.distinct_list);
                findTickets(res,res,authorizeURL, all_artists);
                //res.render('index.ejs', { auth_url: authorizeURL, other_info: all_artists });
            });
        } else {
             all_artists=found_artists;
             all_artists.distinct_list=[];
             res.render('index.ejs', { auth_url: authorizeURL, other_info: all_artists });
        }


    });  
}

function findTickets(res,res,authorizeURL, all_artists) {

    var url_instance = new URIlib.URI(ticketmaster_url);
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
        }).on("end", function (chunk) {
            var json = JSON.parse(data);
            console.log("the end");
            console.log("Total Elements: ");
            console.log(json.page.totalElements);
            console.log("--------");
            console.log("First Element: ");
            console.log(json._embedded.events[0].name);
            console.log("--------"); 
            var concerts = json._embedded.events;
            var artistList=all_artists.distinct_list;
            //artistList.push("Les Liaisons Dangereuses");
            var totalFoundTickets=0;
            artistsWithTickets=artistList.map(function(artistName){
                artistName=artistName.toLowerCase();
                var foundTickets = concerts.filter(function(concert, index, array) {

                        bandName=concert.name.toLowerCase();
                        //console.log(bandName);
                        return (bandName.indexOf(artistName)>-1 || artistName.indexOf(bandName)>-1);
                    });
                    totalFoundTickets+=foundTickets.length;
                 var text="Band \""+artistName+"\" found "+foundTickets.length+" in "+concerts.length+" events";   
                 //console.log("band "+artistName+" found "+foundTickets.length+" in "+concerts.length+" events");   
                 return text;
     
            });
            //console.log(artistsWithTickets);
            console.log("Всего билетов найдено: "+totalFoundTickets);

               all_artists.artistsWithTickets=artistsWithTickets;
               res.render('index.ejs', { auth_url: authorizeURL, other_info: all_artists });
       
        })

    }).on('error', function (e) {
         console.log("not ok");
         res.render('index.ejs', { auth_url: authorizeURL, other_info: {} });
    });
 
  



}

function logError(err, result) {
    if (err) {
        console.log("");
        console.log("Error: ");
        console.log(err);
        console.trace();
        console.log("");
    }
}

