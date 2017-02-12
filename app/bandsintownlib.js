
/*NOT FOR WORK!*/

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




            buff("Results: " + results.length);
            buff("Events: " + events.length);
            buff("*********************FINISHED WITH SUCCESS*********************");

            //buff(events);
            modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });


        }
    });


}
function makeBandRequest(artistName, callback) { //callback is callback for async
    //buff("Searching for "+artistName);    
    makeRequest(settings.BandsInTownUrl.replace("ARTIST_NAME", encodeURI(artistName)), { callback: callback }, findBrandsinTownEvent, callbackErrorGeneral);

}


function makeBandRequestTimeOut(artistName, callback) {

    setTimeout(function () {
        //buff("Searching for "+artistName);    
        makeRequest(settings.BandsInTownUrl.replace("ARTIST_NAME", encodeURI(artistName)), { callback: callback }, findBrandsinTownEvent, callbackErrorGeneral);
    }, Math.random() * settings.BandsInTownTimeOutTime);
}


function findBrandsinTownEvent(data) { //sync function

    var foundEvents = [];
    var json = JSON.parse(data);

    iteratorMarker++;

    //buff("data");
    //buff(json.length);

    if (json && json.length > 0 && (typeof (json.errors) == "undefined")) {
        foundEvents = json.map(function (elem) {
            return { "event_title": elem.title, "event": elem };
        });
    } else {
        if (typeof (json) == "object" && json.errors && json.errors.length > 0) {
            //If error return immediately
            return json.errors[0]; //if not UNKNOWN ARTIST! TODO
        }
    }
    return foundEvents;
}
