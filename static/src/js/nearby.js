/*********************************************
 * Radar / Nearby
 *********************************************/

// ALL_POIS:
//
// used by Near You Now and then later by Radar, a structure of all POIs
// we cannot render them all into the Radar page at the same time, but we can store them in memory
//
// Each item within has:
//     from DB:
//         lat, lng, title, categories, n, s, e, w
//     and computed:
//         meters, miles, feet, range, bearing
var ALL_POIS = [];

/**
 * Load all POIs via AJAX on window load,
 *
 * but don't render them into the DOM yet.
 * Rendering to DOM is done later by updateNearYouNow() to do only the
 * closest few POIs, so we don't overload.
 */
$(document).ready(function () {
    $.get(API_BASEPATH + 'ajax/load_pois', {}, function (pois) {
        for (var i=0, l=pois.length; i<l; i++) {
            ALL_POIS[ALL_POIS.length] = pois[i];
        }
        updateNearYouNow();
    }, 'json');
});

/**
 * Update Near You Now
 *
 * update the Near You Now listing from ALL_POIS; called on a location update
 * this is a significant exception to the sortLists() system,
 * as we need to do the distance and sorting BEFORE rendering, an unusual case
 */
function updateNearYouNow() {
    // render the Radar page, in case it hasn't happened yet
    //$('#pane-radar').page();

    var target = $('#alerts');

    // iterate over ALL_POIS and calculate their distance from our last known location
    // poi.meters   poi.miles   poi.feet   poi.range
    // this is instrumental in sorting by distance and picking the nearest
    for (var i=0, l=ALL_POIS.length; i<l; i++) {
        var poi       = ALL_POIS[i];
        var destpoint = L.latLng(poi.lat,poi.lng);
        poi.meters    = LAST_KNOWN_LOCATION.distanceTo(destpoint);
        poi.miles     = poi.meters / 1609.344;
        poi.feet      = poi.meters * 3.2808399;
        poi.range     = (poi.feet > 900) ? poi.miles.toFixed(1) + ' mi' : poi.feet.toFixed(0) + ' ft';
        poi.bearing   = LAST_KNOWN_LOCATION.bearingWordTo(destpoint);
    }

    // sort ALL_POIS by distance, then take the first (closest) few
    ALL_POIS.sort(function (p,q) {
        return p.meters - q.meters;
    });
    var render_pois = ALL_POIS.slice(0,25);

    // go over the rendering POIs, and render them to DOM
    target.empty();
    for (var i=0, l=render_pois.length; i<l; i++) {
        var poi = render_pois[i];

        var li = $('<li></li>').addClass('zoom').addClass('ui-li-has-count');
        li.attr('title', poi.title);
        li.attr('category', poi.categories);
        li.attr('type', 'poi').attr('gid', poi.gid);
        li.attr('w', poi.w).attr('s', poi.s).attr('e', poi.e).attr('n', poi.n);
        li.attr('lat', poi.lat).attr('lng', poi.lng);
        li.attr('backbutton', '#pane-radar');

        var div = $('<div></div>').addClass('ui-btn-text');
        div.append( $('<h2></h2>').text(poi.title) );
        div.append( $('<p></p>').text(poi.categories) );
        div.append( $('<span></span>').addClass('zoom_distance').addClass('ui-li-count').addClass('ui-btn-up-c').addClass('ui-btn-corner-all').text(poi.range + ' ' + poi.bearing) );

        // On click, call zoomElementClick() to load more info
        li.click(function () {
            zoomElementClick( $(this) );
        });

        li.append(div);
        target.append(li);
    }

    // done loading POIs, refresh the styling magic
    target.listview('refresh');
}
/**
 * Place circle
 */
function placeCircle(lat,lon,meters) {
    MAP.removeLayer(CIRCLE);
    CIRCLE.setLatLng(L.latLng(lat,lon));
    CIRCLE.setRadius(meters);
    MAP.addLayer(CIRCLE);
}

/**
 * Clear circle
 */
function clearCircle() {
    CIRCLE.setLatLng(L.latLng(0,0));
    CIRCLE.setRadius(1);
    MAP.removeLayer(CIRCLE);
}

/**
 * Extend Leaflet:
 * Add to LatLng the ability to calculate the bearing to another LatLng
 */
L.LatLng.prototype.bearingTo= function(other) {
    var d2r  = L.LatLng.DEG_TO_RAD;
    var r2d  = L.LatLng.RAD_TO_DEG;
    var lat1 = this.lat * d2r;
    var lat2 = other.lat * d2r;
    var dLon = (other.lng-this.lng) * d2r;
    var y    = Math.sin(dLon) * Math.cos(lat2);
    var x    = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    var brng = Math.atan2(y, x);
    brng = parseInt( brng * r2d );
    brng = (brng + 360) % 360;
    return brng;
};
L.LatLng.prototype.bearingWordTo = function(other) {
    var bearing = this.bearingTo(other);
    var bearingword = '';
     if (bearing >= 22  && bearing <= 67)  bearingword = 'NE';
    else if (bearing >= 67 && bearing <= 112)  bearingword = 'E';
    else if (bearing >= 112 && bearing <= 157) bearingword = 'SE';
    else if (bearing >= 157 && bearing <= 202) bearingword = 'S';
    else if (bearing >= 202 && bearing <= 247) bearingword = 'SW';
    else if (bearing >= 247 && bearing <= 292) bearingword = 'W';
    else if (bearing >= 292 && bearing <= 337) bearingword = 'NW';
    else if (bearing >= 337 || bearing <= 22)  bearingword = 'N';
    return bearingword;
};

/**
 * Check Radar
 */
function checkRadar(latlng,maxmeters,categories) {
    // 1: go over the Near You Now entries, find which ones are within distance and matching the filters
    maxmeters = parseFloat(maxmeters); // passed in as a .attr() string sometimes

    // iterate over ALL_POIS and calculate their distance, make sure they fit the category filters, add the distance and text, append them to alerts
    var alerts = [];
    for (var i=0, l=ALL_POIS.length; i<l; i++) {
        var poi = ALL_POIS[i];
        var meters = latlng.distanceTo( L.latLng(poi.lat,poi.lng) );

        // filter: distance
        if (meters > maxmeters) continue;

        // filter: category
        if (categories) {
            var thesecategories = poi.categories.split("; ");
            var catmatch = false;
            for (var ti=0, tl=thesecategories.length; ti<tl; ti++) {
                for (var ci=0, cl=categories.length; ci<cl; ci++) {
                    if (categories[ci] == thesecategories[ti]) { catmatch = true; break; }
                }
            }
            if (! catmatch) continue;
        }

        // if we got here, it's a match for the filters; add it to the list
        var miles  = meters / 1609.344;
        var feet   = meters * 3.2808399;
        var range  = (feet > 900) ? miles.toFixed(1) + ' mi' : feet.toFixed(0) + ' ft';
        alerts[alerts.length] = { gid:poi.gid, title:poi.title, range:range };
    }

    // 2: go over the alerts, see if any of them are not in LAST_BEEP_IDS
    // if so, then we beep and make an alert
    var beep = false;
    for (var i=0, l=alerts.length; i<l; i++) {
        var key = parseInt( alerts[i].gid );
        if (LAST_BEEP_IDS.indexOf(key) == -1 ) { beep = true; break; }
    }

    // 3: rewrite LAST_BEEP_IDS to be only the IDs in sight right now
    // this is done regardless of whether we in fact beep, so we can re-beep for the same feature if we leave and then re-enter its area
    LAST_BEEP_IDS = [];
    for (var i=0, l=alerts.length; i<l; i++) {
        var key = parseInt( alerts[i].gid );
        LAST_BEEP_IDS[LAST_BEEP_IDS.length] = key;
    }
    LAST_BEEP_IDS.sort();

    // 3: play the sound and compose an alert of what they just stumbled upon
    // the alert() is async otherwise it may block the beep from playing
    if (beep) {
        document.getElementById('alert_beep').play();
        var lines = [];
        for (var i=0, l=alerts.length; i<l; i++) {
            lines[lines.length] = alerts[i].title + ", " + alerts[i].range;
        }
        setTimeout(function () {
            alert( lines.join("\n") );
        }, 1000);
    }
}

// on page load: install event handlers for the Find and Radar panels
$(document).ready(function () {
    $('#radar_enabled').change(function () {
        // toggle the radar config: category pickers, distance selector, etc.
        var enabled = $(this).is(':checked');
        enabled ? $('#radar_config').show() : $('#radar_config').hide();

        // if it's not checked, unfilter the results listing to show everything, and remove the circle
        if (! enabled) {
            $('#alerts li').slice(0,25).show();
            $('#alerts li').slice(25).hide();
            clearCircle();
        }
    });
});
