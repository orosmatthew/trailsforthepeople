///// replace the map layers with our own version
///// This is identical to the public-facing version, except that we must use SSL
///// because Chrome and IE can't cope with mixing HTTP and HTTPS on the same page

var MAPBASE   = new L.TileLayer("https://maps1.clemetparks.com/tilestache/tilestache.cgi/basemap/{z}/{x}/{y}.jpg", { });

var OVERLAYS  = [];
OVERLAYS[OVERLAYS.length] = new L.TileLayer.WMS("https://maps2.clemetparks.com/wms", { id:'closures', visibility:true, layers:'cm:closures,cm:markers_other,cm:markers_swgh', format:'image/png', transparent:'TRUE' });
OVERLAYS[OVERLAYS.length] = new L.TileLayer.WMS("https://maps3.clemetparks.com/gwc", { id:'labels', visibility:true, layers:'group_overlays', format:'image/png', transparent:'TRUE' });

// almost identicval: we enable the Route Debugging layer for these maps
OVERLAYS[OVERLAYS.length] = new L.TileLayer.WMS("https://maps1.clemetparks.com/wms", { id:'routedebug', visibility:false, layers:'cm:routing_barriers,cm:routing_segments,cm:routing_nodes,cm:route_problem_intersections', format:'image/png', transparent:'TRUE' });



// an addon to the Date object, to return the date in yyyy-mm-dd format
Date.prototype.yyyymmdd = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]); // padding
};


// on page load: start the map
function initContributorMap() {
    // start the map, add the basemap, zoom to the max extent
    MAP = new L.Map('map_canvas', {
        attributionControl: false, zoomControl: true, dragging: true,
        closePopupOnClick: true,
        crs: L.CRS.EPSG3857,
        maxZoom: 18,
        layers : [ MAPBASE ]
    });
    MAP.fitBounds(MAX_BOUNDS);
    MAP.addControl( new L.Control.ScaleBar() );

    // add the overlay layers
    for (var i=0, l=OVERLAYS.length; i<l; i++) {
        var layer = OVERLAYS[i];
        if (layer.options.visibility) MAP.addLayer(layer);
    }

    // the layer picker
    MAP.addControl(new L.Control.Layers({
    },{
        'Route debugging' : OVERLAYS[OVERLAYS.length-1]
    }));

    // debugging: when the viewport changes, log the current bbox and zoom
    function debugOutput () {
        console.log([ 'zoom', MAP.getZoom() ]);
        console.log([ 'center', MAP.getCenter() ]);
        console.log([ 'bounds', MAP.getBounds() ]);
    }
    //MAP.on('moveend', debugOutput);
    //MAP.on('zoomend', debugOutput);

    ///// THE REST OF THESE ELEMENTS
    ///// set up event handlers which are very common to maps in the Contributors system: the geocoder, the park features search, GPS zoom, etc.

    // the Cleveland Metroparks keyword search (cleocoding? ha ha) button
    $('#cleocode_button').click(function () {
        var keyword   = $('#cleocode_address').val();
        var targetdiv = $('#results');
        if (! keyword) return false;

        // empty the previous results
        targetdiv.empty();

        // add a fake result: Address Search, which runs that address as a Bing search
        var addrsearch = $('<li></li>').text('Run a Bing address search').appendTo(targetdiv).addClass('fakelink');
        addrsearch.click(function () {
            geocodeAndZoomContributorMap(MAP , $('#cleocode_address').val() );
        });

        // proceed to search for Cleveland features
        geocodeParkFeature(keyword,targetdiv);
    });
    $('#cleocode_address').keydown(function (event) {
        if (event.keyCode == '13') {
            $('#cleocode_button').click();
            return false;
        }
    });

    // the Current GPS Location button
    $('#gps_button').click(function () {
        MAP.locate({ setView:true, enableHighAccuracy:true });
    });

}





function geocodeAndZoomContributorMap(map, searchtext) {
    if (!searchtext) return false;

    var params = {};
    params.address  = searchtext;
    params.bing_key = BING_API_KEY;
    params.bbox     = GEOCODE_BIAS_BOX;

    $('#cleocode_button').attr('disabled',true);
    $('#cleocode_button').val('Loading');

    $.get('../../ajax/geocode', params, function (result) {
        $('#cleocode_button').removeAttr('disabled');
        $('#cleocode_button').val('Go >');
        if (! result) return alert("We couldn't find that address or city.\nPlease try again.");

        var latlng = new L.LatLng(result.lat,result.lng);
        MAP.setView(latlng,16);

        if (typeof CENTER_MARKER_AFTER_GEOCODE !== 'undefined') {
            CENTER_MARKER_AFTER_GEOCODE.setLatLng( MAP.getCenter() );
            CENTER_MARKER_AFTER_GEOCODE.fire('drag');
        }

    }, 'json');
}



// do an AJAX call to fetch a park feature (building, reservation, etc) by keyword and feature type
// see marker.phtml for a <select> element with all feature types, or see ajax.php::keyword()
// this assumes that targetdiv is a UL, and appends LIs to it with results
function geocodeParkFeature(keyword,targetdiv) {
    $('#cleocode_button').attr('disabled',true);
    $('#cleocode_button').val('Loading');

    $.get('../../ajax/keyword', { keyword:keyword, limit:20 }, function (reply) {
        $('#cleocode_button').removeAttr('disabled');
        $('#cleocode_button').val('Go >');
        if (! reply || !reply.length) {
            $('<li></li>').text("No matching park features.").appendTo(targetdiv);
            return;
        }

        // go over the results and see if any have an exact match for the "keyword"; if so, then call that our one and only result
        var matchme = keyword.replace(/\W/g,'').toLowerCase();
        for (var i=0, l=reply.length; i<l; i++) {
            var stripped = reply[i].name.replace(/\W/g,'').toLowerCase();
            if (stripped == matchme) {
                reply = [ reply[i] ];
                break;
            }
        }

        // if there was exactly 1 result, simply zoom the map and exit
        if (reply.length == 1) {
            var center = new L.LatLng(reply[0].lat,reply[0].lng);
            MAP.panTo(center);
            return;
        }

        // otherwise, iterate and populate a Did You Mean sort of listing
        for (var i=0, l=reply.length; i<l; i++) {
            var item = reply[i];

            var li = $('<li></li>').text(item.name + ' (' + item.type + ')').addClass('fakelink');
            li.attr('w', item.w);
            li.attr('s', item.s);
            li.attr('e', item.e);
            li.attr('n', item.n);

            li.click(function () {
                MAP.fitBounds(new L.LatLngBounds(new L.LatLng($(this).attr('s'),$(this).attr('w')),new L.LatLng($(this).attr('n'),$(this).attr('e'))));
                if (typeof CENTER_MARKER_AFTER_GEOCODE !== 'undefined') {
                    CENTER_MARKER_AFTER_GEOCODE.setLatLng( MAP.getCenter() );
                    CENTER_MARKER_AFTER_GEOCODE.fire('drag');
                }
            });

            targetdiv.append(li);
        }
    }, 'json');
}
