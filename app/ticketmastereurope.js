/*NOT FOR WORK!*/

function findTicketMasterEuropeEvents(pagesArray, artistList, dates = "", city = "") {


    async.map(pagesArray, (pageNumber, callback) => {
        makeRequest(settings.TicketMasterEuropeUrl + "&start=" + pageNumber, { callback: callback }, (data) => {
            return foundEvents = JSON.parse(data).events.map(function (elem) {
                return { "event_title": elem.name, "event": elem };
            });
        }, callbackErrorGeneral);
    }, function (err, results) {
        if (err) {
            buff("*********************FINISHED WITH ERROR**************************");
            buff(err);
            modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "error": err } });

        } else {
            var flattened = results.reduce(function (a, b) {
                return a.concat(b);
            });
            //filter by bands
            var events = flattened.filter(function (elem, i, array) {
                if (elem.event_title != undefined) {
                    return artistList.indexOf(elem.event_title.toLowerCase()) > -1;
                }
                return false;

            });

            buff("Results: " + flattened.length);
            buff("Events: " + events.length);
            buff("*********************FINISHED WITH SUCCESS*********************");

            //buff(events);
            modelCurrent.res.render('index.ejs', { auth_url: modelCurrent.authorizeURL, result: { "events": events } });


        }
    });

}






function findTicketMasterEuropeEventsStart(artistList, dates = "", city = "") {

    //1 CHANGE URL WITH DATE AND CITY 
    //----

    async.waterfall([
        //2 GET TOTAL ITEMS           
        function (callback) {
            var url = settings.TicketMasterEuropeUrl;
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    if (JSON.parse(body).pagination.total > 0) {
                        callback(null, JSON.parse(body).pagination.total);
                    } else {
                        //ZERO EVENTS FOUND
                        modelCurrent.res.render('index.ejs', { result: { "events": [] } });
                        return false;
                    }
                } else {
                    if (error)
                        callback(error, 0);
                    else if (response.statusCode != 200)
                        callback("statusCode = " + response.statusCode, 0);
                }
            })
        }
        //GET EVENTS
    ], function (err, totalEntries) {
        if (!err) {

            var N = Math.ceil(totalEntries / settings.TicketMasterEuropeRows);
            var pagesArray = Array(N * 1).fill(0).map((e, i) => i * settings.TicketMasterEuropeRows);

            findTicketMasterEuropeEvents(pagesArray, artistList, dates, city);


        } else {
            buff("ERROR");
            buff(err);
        }


    });


}