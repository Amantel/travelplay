var BiTtestResponse=[{"id":12938812,"title":"Rage @ G\u00f6ta K\u00e4llare in Stockholm, Sweden","datetime":"2017-01-15T19:00:00","formatted_datetime":"Sunday, January 15, 2017 at 7:00PM","formatted_location":"Stockholm, Sweden","ticket_url":"http://www.bandsintown.com/event/12938812/buy_tickets?app_id=TRAVELPLAY_ID\u0026artist=Rage\u0026came_from=67","ticket_type":"Tickets","ticket_status":"available","on_sale_datetime":null,"facebook_rsvp_url":"http://www.bandsintown.com/event/12938812?app_id=TRAVELPLAY_ID\u0026artist=Rage\u0026came_from=67","description":null,"artists":[{"name":"Rage","mbid":"2a90aa9c-d2ff-49fd-a8e5-2463f657eb45","image_url":"https://s3.amazonaws.com/bit-photos/large/6724943.jpeg","thumb_url":"https://s3.amazonaws.com/bit-photos/thumb/6724943.jpeg","facebook_tour_dates_url":"http://www.bandsintown.com/Rage/facebookapp?came_from=67","facebook_page_url":"http://www.facebook.com/pages/Rage/802922219754478","tracker_count":16096,"url":"Rage","website":"http://www.rage-on.de/"}],"venue":{"name":"G\u00f6ta K\u00e4llare","place":"G\u00f6ta K\u00e4llare","city":"Stockholm","region":null,"country":"Sweden","latitude":59.315808,"longitude":18.079347}},
{"id":12768408,"title":"Accept @ Hovet in Stockholm, Sweden","datetime":"2017-03-24T19:00:00","formatted_datetime":"Friday, March 24, 2017 at 7:00PM","formatted_location":"Stockholm, Sweden","ticket_url":"http://www.bandsintown.com/event/12768408/buy_tickets?app_id=TRAVELPLAY_ID\u0026artist=Accept\u0026came_from=67","ticket_type":"Tickets","ticket_status":"available","on_sale_datetime":"2016-08-26T10:00:00","facebook_rsvp_url":"http://www.bandsintown.com/event/12768408?app_id=TRAVELPLAY_ID\u0026artist=Accept\u0026came_from=67","description":"Special guests of Sabaton.","artists":[{"name":"Accept","mbid":"41f4d85a-0bd7-4602-a3e3-8c47f36efb0a","image_url":"https://s3.amazonaws.com/bit-photos/large/7087362.jpeg","thumb_url":"https://s3.amazonaws.com/bit-photos/thumb/7087362.jpeg","facebook_tour_dates_url":"http://www.bandsintown.com/Accept/facebookapp?came_from=67","facebook_page_url":"https://www.facebook.com/accepttheband","tracker_count":127827,"url":"Accept","website":null},{"name":"Sabaton","mbid":"39a31de6-763d-48b6-a45c-f7cfad58ffd8","image_url":"https://s3.amazonaws.com/bit-photos/artistLarge.jpg","thumb_url":"https://s3.amazonaws.com/bit-photos/artistThumb.jpg","facebook_tour_dates_url":"http://www.bandsintown.com/Sabaton/facebookapp?came_from=67","facebook_page_url":"http://www.facebook.com/sabaton","tracker_count":127310},{"name":"Accept","mbid":"41f4d85a-0bd7-4602-a3e3-8c47f36efb0a","image_url":"https://s3.amazonaws.com/bit-photos/artistLarge.jpg","thumb_url":"https://s3.amazonaws.com/bit-photos/artistThumb.jpg","facebook_tour_dates_url":"http://www.bandsintown.com/Accept/facebookapp?came_from=67","facebook_page_url":"https://www.facebook.com/accepttheband","tracker_count":127827}],"venue":{"name":"Hovet","place":"Hovet","city":"Stockholm","region":"26","country":"Sweden","latitude":59.3333333,"longitude":18.05}}];

var epicBuffer="";

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
var ticketmaster_url="https://app.ticketmaster.com/discovery/v2/events.json?apikey=F2JzydFhRbFjtW3DG3lNQXjDNCzzZujN"
+"&startDateTime=2017-02-01T09:15:00Z&endDateTime=2017-02-28T20:15:00Z"
+"&size=500"
+"&city=New York"
+"&classificationId=KZFzniwnSyZfZ7v7nJ";
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









 


app.listen(3000, () => {
    buff('listening on 3000')
})

app.get('/', (req, res) => {


    var code = req.query.code || null;
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

    if(spotifyApi.getAccessToken()) {
        buff("getFollowedArtists");
        getFollowedArtists(true,res,authorizeURL); //1 true
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

             //   buff(all_artists.distinct_list);
                //findTickets(res,res,authorizeURL, all_artists);
 
                //makeRequest(ticketmaster_url,{authorizeURL:authorizeURL,res:res,all_artists:all_artists },findTicketsTicketMaster,callbackError_ex1)
                buff("followed: "+all_artists.distinct_list.length);
                 findBandsinTownEvents(all_artists.distinct_list);
               // findBandsinTownEvents(res,res,authorizeURL, all_artists);
                res.render('index.ejs', { auth_url: authorizeURL, other_info: all_artists });
            });
        } else {
             all_artists=found_artists;
             all_artists.distinct_list=all_artists.map(function(elem){return elem.name.toLowerCase()});
             //buff(all_artists.distinct_list);

             findBandsinTownEvents(all_artists.distinct_list);
             res.render('index.ejs', { auth_url: authorizeURL, other_info: all_artists });
        }


    });  
} 


var BiTurl="http://api.bandsintown.com/artists/ARTIST_NAME/events/recommended.json?api_version=2.0&app_id=TRAVELPLAY_ID&location=Stockholm&radius=10&date=2017-01-01,2017-06-31";
//var BiTurl="http://api.bandsintown.com/artists/ARTIST_NAME/events/search.json?api_version=2.0&app_id=TRAVELPLAY_ID&location=Stockholm&radius=10&date=2017-01-01,2017-06-31";



//findBandsinTownEvents(["rage","accept","voltaire","metallica"]);  
function findBandsinTownEvents(artistList) {
    iteratorMarker=0;
    if(!artistList)
        artistList=["rage"];
    //buff(artistList);
    /*
    var result=artistList.map(function(artistName){
        return {artistName: makeRequest(BiTurl.replace("ARTIST_NAME",encodeURI(artistName)),{},findBrandsinTownEvent,callbackError_ex1)}; 
    });
    */
    buff("Finding..."); 
    async.map(artistList, makeBandRequest, function(err, results) {
         
    if(err) {
       buff("FINISHED WITH ERROR"); 
        buff("iteratorMarker "+iteratorMarker);   
       buff(err);
    } else {

    

    var events=results.filter(function(elem, i, array) {
        
        return elem.length>0;
    });
   console.log(events.length);
    // events=events.reduce(function(prevVal, elem){  },[]);
    //remove inner arrays
    events=events.map(function(elem){
        return elem[0];
    }); 

    buff("FINISHED"); 
 
 
    buff(events[0]);
  
    buff(results.length);
    buff(events.length);    
    }
});
 

} 
//makeBandRequest("rage");
var iteratorMarker=1;


function makeBandRequest(artistName,callback) {
    //buff("Searching for "+artistName);
    makeRequest(BiTurl.replace("ARTIST_NAME",encodeURI(artistName)),{callback:callback},findBrandsinTownEvent,callbackError_ex1); 
} 
     

function findBrandsinTownEvent(data) { 
    //var data=BiTtestResponse;
    //buff(BiTtestResponse);
    var foundEvents =[]; 
    var json = JSON.parse(data);

    iteratorMarker++ 
    
  //  buff("data");
    //buff(json.length);
    if(json && json.length>0 && (json.errors && !json.errors.length>0)) {
        //console.log("Found JSON");
        //console.log(json);
        foundEvents = json.map(function(elem) {
            return {"event_title":elem.title,"event":elem};
        });
    } else { 
        if(typeof(json)=="object" && json.errors &&  json.errors.length>0) {
                     
            return json.errors[0];
        }
    } 
    /*
    if(foundEvents!="") { 
        buff(foundEvents);
    }
    */
    return foundEvents;
 

}




function callbackSuccess_ex1(data) {
    buff("****INNER data");
    buff(data);
}

function callbackError_ex1(e) {
    buff("e");
    buff(e);
}


function makeRequest(url,params,callbackSuccess,callbackError) {
    //buff("making request to URL: "+url);
   
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
        var test="dfsd";
        result.on("data", function (chunk) {
            data += chunk;
        }).on("end", function () {
            var result=callbackSuccess(data,url,params);
            //buff(result.length);
            if(params && typeof(params.callback)=="function")
            {
                var err=null;
                if(typeof(result)=="string")
                    err=result;
                params.callback(err,result);
            }
        }
        )

    }).on('error', function (e) {callbackError(e,url,params)}
    );

}


function findTicketsTicketMaster(data,url,params) {

            var all_artists=params.all_artists;
      
            var json = JSON.parse(data);
            buff("Total Elements: ");
            buff(json.page.totalElements);
            if(json.page.totalElements<1) {
                    all_artists.artistsWithTickets=["Zero events Found"];
                     
                    res.render('index.ejs', { auth_url: authorizeURL, other_info: all_artists });
                    return false;
            }

            buff("--------");
            buff("First Element: ");
            buff(json._embedded.events[0].name);
            buff("--------"); 
            var concerts = json._embedded.events;
            var artistList=all_artists.distinct_list;
            //Test - artistList.push("Les Liaisons Dangereuses");
            var totalFoundTickets=0;
            artistsWithTickets=artistList.map(function(artistName){
                artistName=artistName.toLowerCase();
                var foundTickets = concerts.filter(function(concert, index, array) {

                        bandName=concert.name.toLowerCase();
                        //buff(bandName);
                        return (bandName.indexOf(artistName)>-1 || artistName.indexOf(bandName)>-1);
                    });
                    totalFoundTickets+=foundTickets.length;
                 var text="Band \""+artistName+"\" found "+foundTickets.length+" in "+concerts.length+" events";   
                 if(foundTickets.length>0) {
                    buff(text);   
                    text+=" !!!"
                 }
                 return text;
     
            });
            //buff(artistsWithTickets);
            buff("Всего билетов найдено: "+totalFoundTickets);

            all_artists.artistsWithTickets=artistsWithTickets;
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
    if(object && typeof(object)!="string")
        epicBuffer+="\n\r"+object.toString();
    else
        epicBuffer+="\n\r"+object;
}