
/*Here is decipated genre find from LastFM*/

function ScheduledGenres2() {
    var genreLag=200; //mlsc
    //db.collection('matchesn').find({ $and: [ {"inDB":{$ne:1}}, {"lastFMfailed":{$ne:1}} ] }).toArray(
        db.collection('matchesn').find().toArray(
        function (err, newArtists) {
            if (!err) {

                console.log(newArtists.length);
                //newArtists=newArtists.slice(100,150);
                newArtists=[{artist_name:"some shitty name"}];
                //console.log(newArtists);
                // return false;
                    

                    
                if(newArtists.length===0) {
                    console.log("all in DB");
                    return false;
                }
         
 
                async.mapSeries(newArtists, 
                function (artist, callback) {

                    var url = "http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=ARTIST_NAME&api_key=962b5d8275532aa2ba96bc85084964b5&format=json".
                    replace("ARTIST_NAME", encodeURI(artist.artist_name));
                    console.log(url);

                    request({url: url}, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var json = JSON.parse(body);
                            if (!json) {
                                setTimeout( callback.bind(this,"find LastFM genres inner error - json not found in request",0), genreLag);
                            }
                            if (json.error) {
                                setTimeout( callback.bind(this,"find LastFM genres inner error - "+json.message,0), genreLag);
                            }

                            var genres="";
                            if(json.artist && json.artist.tags.tag.length>0)       
                                genres = json.artist.tags.tag.map(function (tag) {
                                    return tag.name;
                                });
                            json.genres=genres;    
                            setTimeout( callback.bind(this,null,json), genreLag);
                            //callback(null,json);

                        } else {
                           setTimeout( callback.bind(this,"find LastFM genres error - bad status or error on request",0), genreLag);
                        }
                    });
               
                }.bind({ artists: 5 }),
                function (err,result) {
                    if(!err) {
                            //0. filter artists or artist_names
                            console.log("FINISHED");
                            return false;
                            result=result.filter(artist=>{
                                if(!artist.artist)
                                    return false;
                                if(!artist.artist.name)
                                    return false;                                    
                                return true;
                            });

                            
                            result.forEach(artist=>{
                            var artistIns=artist.artist.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                            artistIns=new RegExp("^" + artistIns,"i");
                                db.collection('bandsDB').update(
                                    {"artist_name":{$regex:artistIns}}, //
                                    { $set: artist },
                                    { 
                                        upsert: true,
                                        multi: true 
                                    },
                                    (err, result) => { 
                                        if (err) {
                                            console.log(err);
                                            return false;
                                        }  
                                     console.log("Last FM genre search finished");                         
                                    }   
                                );
                            });
               

                             result.forEach(artist=>{
                            var artistIns=artist.artist.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                            artistIns=new RegExp("^" + artistIns,"i");
                                db.collection('matchesn').update(
                                    {"artist_name":{$regex:artistIns}}, //
                                    { $set: { "inDB" : 1 ,"genres":artist.genres} },
                                    { 
                                        multi: true,
                                        upsert: false
                                    },
                                    (err, result) => { 
                                        if (err) {
                                            console.log(err);
                                            return false;
                                        }  
                                     console.log("result.result.ok "+result.result.ok);
                                     console.log("result.result.nModified "+result.result.nModified);
                                     console.log("Last FM match update finished");                         
                                    }   
                                );
                            });
                        
                    } else {
                        console.log("LastFM genre error");/*
                        console.log(err.length);

                        err.forEach(artist=>{
                            var artistIns=artist.artist_name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                            artistIns=new RegExp("^" + artistIns,"i");
                            db.collection('matchesn').update(
                                {"artist_name":{$regex:artistIns}}, //
                                { $set: {  "inDB" : 1 ,"lastFMfailed" : 1 } },
                                { 
                                    multi: true,
                                    upsert: false
                                },
                                (err, result) => { 
                                    if (err) {
                                        console.log(err);
                                        return false;
                                    }  
                                    console.log("result.result.ok "+result.result.ok);
                                    console.log("result.result.nModified "+result.result.nModified);
                                    console.log("Last FM failed match update finished");                         
                                }   
                            );
                        });        
                        */                

                    }
                    
                    
                }.bind(null, { newArtists: newArtists }));


            } else {
                console.log("ScheduledGenres DB error");
            }
    }); 
    
}
