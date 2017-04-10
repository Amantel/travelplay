function createBand(band,genres, i) {
    /*
    return '<tr class="band" data-band>' +
        '<td><input type="checkbox" data-mass_select></td>'+    
        '<td>' +
        '<input type="hidden" ' +
        ' data-band_name_original' +
        ' value="' + band + '"> ' +
        '<span class="band_name">' + band + '</span>' +
        '</td>' +
        '<td class="text-right">' +
        '<span class="btn btn-warning" data-remove_row>Remove</span>'+
        '<span class="btn btn-danger hidden" data-remove_selected>Remove selected</span>'+
        '</td>' +
        '</tr>' +
        '';
        */
        var genresString="";
        if(genres.length>0)
            genresString=genres.join('|');

        return '<tr class="band relation_1 source_website" data-band="">'+
            '<td><input type="checkbox" data-mass_select=""></td>'+
            '<td>'+
                '<input type="hidden" data-band_name_original="" value="' + band + '">'+
                '<input type="hidden" data-band_source="" value="website">'+
                '<input type="hidden" data-band_relation="" value="1">'+
                '<input type="hidden" data-band_genre_string="" value="'+genresString+'">'+   
                '<span class="band_name" data-toggle="tooltip" data-placement="top" title="" data-original-title="'+genresString+'">' + band + '</span>'+
            '</td>'+
            '<td class="text-right">'+
                '<span class="btn btn-warning" data-remove_row="">Remove</span>'+
                '<span class="btn btn-danger hidden" data-remove_selected="">Remove selected</span>'+
            '</td>'+
        '</tr>';

}

function createTrip(city, start, end, country, i, id) {

    return '<tr class="trip" data-trip>' +
        '<td><input type="checkbox" data-mass_select></td>'+
        '<td class="">' +
        '<input type="hidden" data-trip_city value="' + city + '">' +
        '<input type="hidden" data-trip_country value="' + country + '">' +
        ' <input type="hidden" data-trip_start value="' + start + '">' +
        '<input type="hidden" data-trip_end value="' + end + '">' +
        '<input type="hidden" data-trip_id value="' + id + '">' +
        '<span class="trip_city_text">' + city + '</span>' +
        '</td>' +
        '<td>' +
        '<span class="trip_start_text">' + start + '</span> ' +
        '</td>' +
        '<td>' +
        '<span class="trip_end_text">' + end + '</span> ' +
        '</td>' +
        '<td>' +
        '<span class="trip_country_text">' + country + '</span> ' +
        '</td>' +
        '<td>' +
        '---' +
        '</td>' +
        '<td>' +
        '<span class="btn btn-warning" data-remove_row>Remove</span>'+
        '<span class="btn btn-danger hidden" data-remove_selected>Remove selected</span>'+
        '</td>' +
        '</tr>' +
        '';

}


function createCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}


function randomString(length, chars) {
    //randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');     
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
} 
 
$(function () {
    console.log($("tr").length);
    $("table").on("click", "[data-remove_row]", function (e) {
        e.preventDefault();
        $(this).parents("tr").remove();
        $(".loading").removeClass("hidden");            
        $("#brb").click();
 
    });

    $("table").on("click", "[data-mass_select]", function (e) {
        if($('[data-mass_select]:checked').length>0) {
            $('[data-remove_row]').addClass("hidden");
            $('[data-remove_selected]').removeClass("hidden");
        } else {
            $('[data-remove_selected]').addClass("hidden");
            $('[data-remove_row]').removeClass("hidden");
        }
    });
 

    $("[data-select_all]").click(function(){
        $('[data-mass_select]:not(:checked)').click();
    });

    $("table").on("click", "[data-remove_selected]", function (e) {
        e.preventDefault();
        $('[data-mass_select]:checked').parents("tr").remove();
        $('[data-remove_selected]').addClass("hidden");
        $('[data-remove_row]').removeClass("hidden");
        
        $(".loading").removeClass("hidden");           

        $("#brb").click();
 
    });

 
    $('body').tooltip({
        selector: '[data-toggle="tooltip"]'
    });
    $('[data-date_mask]').inputmask("9999-99-99");

    $("#more_trips").click(function (e) {
        e.preventDefault();
        var city = $("[data-new_city]").val();
        var country = $("[data-new_country]").val();
        var start = $("[data-new_start]").val();
        var end = $("[data-new_end]").val();

        //check all;
        var check = city && country && start && end;
        if (check) {
            var trip = createTrip(
                city,
                start,
                end,
                country,
                $("[data-trip]").length + 1,
                randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
            );
            $('[data-trips]').prepend(trip);

            $(".loading").removeClass("hidden");
            $("#brb").click();
            /*
            $("#save_call").removeClass("hidden");
            setTimeout(() => { $("#save_call").addClass("hidden"); }, 2000);
            */

        } else {
            alert("One field is empty");
        }
    });

    $("[data-show_old_trips]").click(function (e) {
        $(".trip_finished").toggle();
    });
    $("#more_bands").click(function (e) {
        e.preventDefault();
        var band = $("[data-new_band]").val();

        //check all;
        if (band) {
            
            var bandName=encodeURI(band);
            $(".loading").removeClass("hidden");            
            $.get( "https://api.spotify.com/v1/search?q="+bandName+"&type=artist", function( data ) {
                var genres=[];
                if(data.artists && data.artists.items && data.artists.items.length>0 && data.artists.items[0].genres)
                    genres=data.artists.items[0].genres;
                var bandtr = createBand(band,genres, $("[data-trip]").length + 1);                
                $('[data-bands]').prepend(bandtr);
                //$(".loading").addClass("hidden");          
                $('body').animate({scrollTop:0}, '500');  
                $("#brb").click();
            });

            

            
            /*            
            $("#save_call").removeClass("hidden");
            setTimeout(() => { $("#save_call").addClass("hidden"); }, 2000);
            */

        } else {
            alert("Artist name field is empty");
        }
    });


    $("#brb").click(function (e) {
        e.preventDefault();
        var rbody = {};
        rbody.active = 1;
        rbody.updateDate = Date();


        var tripForms = $("[data-trip]");

        var trips = [];
        $.each(tripForms, function (i, el) {
            el = $(el);
            var trip = {};
            trip.city = el.find("[data-trip_city]").val();
            trip.country = el.find("[data-trip_country]").val();
            trip.start = el.find("[data-trip_start]").val();
            trip.end = el.find("[data-trip_end]").val();
            if (el.find("[data-trip_id]").length > 0)
                trip.id = el.find("[data-trip_id]").val();
            else
                trip.id = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
            trips.push(trip);
        });


        if ($("[data-trips]").length > 0) {
            if(trips.length>0)
                rbody.trips = trips;
            else
                rbody.trips = "EMPTY";    
        }

        var bandForms = $("[data-band]"); 

        var bands = [];
        $.each(bandForms, function (i, el) {
            el = $(el);
            var band = { 
                "band": el.find("[data-band_name_original]").val().trim().toLowerCase(), 
                "additional_info": { "band_name_original": el.find("[data-band_name_original]").val().trim() },
                "source": el.find("[data-band_source]").val().trim(),
                "relation": el.find("[data-band_relation]").val().trim(),
                "genres":el.find("[data-band_genre_string]").val().trim().split("|")
            };
            bands.push(band);
        });

        if ($("[data-bands]").length > 0) {
            if(bands.length>0)
                rbody.bands = bands;
            else
                rbody.bands = "EMPTY";    
        }


        rbody.user_id = false;
        if ($("[data-user_id]").length > 0 && $("[data-user_id]").val() !== "")
            rbody.user_id = $("[data-user_id]").val();
        
        console.log(rbody);

/*
        if(bands.length>100) {
            alert("We can save only first 100 artists. Please choose.");
            bands=bands.splice(100,bands.length);
            $(".loading").addClass("hidden");                
            return false;
        }
*/
        if(trips.length>100) {
            alert("We can save only first 100 trips. Please choose.");
            trips=trips.splice(100,trips.length);
            $(".loading").addClass("hidden");                            
            return false;
        }

        $.ajax({
            type: "POST",
            url: "/save_user",
            data: rbody,
            complete: function (data) {
                console.log(data);
                window.location.reload(true);
            },
            dataType: 'json'
        });
    });

    if($('[data-hidden_reload_marker]').length>0) {
        $(".loading").removeClass("hidden");                
        $("#brb").click();
    }

    $(".action_link").click(function(){
        $(".loading").removeClass("hidden");                
    });
    
    $("[data-show_tier3]").click(function(){
        $(this).parents(".trip_content").find(".tier_3").toggle();
    });

    $("[data-show_old]").click(function(){
        $(".old_trips").toggle();
    });    

});

