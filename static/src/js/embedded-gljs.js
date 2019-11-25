 /**
 * embedded-gljs.js
 *
 * Workgin pure GLJS into embedded map...
 * Requires map-embedded-base (or map-embedded-base-nojq)
 *
 * Cleveland Metroparks
 */

var API_ENDPOINT_GEOCODE = API_BASEPATH + 'ajax/geocode';
var API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES = API_BASEPATH + 'ajax/get_attractions_by_activity';
var API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES_NEARBY = API_BASEPATH + 'ajax/get_nearby_attractions_with_activities';

var userLocation;

$(document).ready(function(){

    /**
     * Initial map setup
     */
    var mapOptions = { base:'map' };

    // Load the map.
    initMap(mapOptions);

    /**
     * Process query params
     */
    var urlParams = new URLSearchParams(location.search);

    // Activities
    if (urlParams.has('activitytype')) {
        var activities = urlParams.get('activitytype').split("|");
    }

    // Location text
    var location_searchtext;
    if (urlParams.has('location')) {
        location_searchtext = urlParams.get('location');
    }

    // Geolocate
    var geolocate_enabled = (urlParams.has('nearme') && urlParams.get('nearme') == 'True');

    // Lat/Long
    if (urlParams.has('lat') && urlParams.has('long')) {
        var lat = parseFloat(urlParams.get('lat'));
        var lng = parseFloat(urlParams.get('long'));
    }

    // Within distance
    var distance_miles, distance_feet;
    if (urlParams.has('distance')) {
        distance_miles = urlParams.get('distance');
        distance_feet = 5280 * distance_miles;
    }
    distance_feet = Number.isInteger(distance_feet) ? distance_feet : 0;

    // Begin assembling API call data
    var data = {
        activity_ids: activities,
        within_feet: distance_feet
    };

    // We initially geolocate when the "Near Me" button is clicked,
    // but on form submit page reload, need to re-initiate in order
    // to show the user's marker on the map.
    if (geolocate_enabled) {
        MAP.locate({watch: false, enableHighAccuracy: true});
    }

    /**
     * Make the right call, based on options
     */
    if (activities) {
        if (geolocate_enabled) {
            data.get_attractions_url = API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES_NEARBY;

            if (userLocation) {
                data.lat = userLocation.lat;
                data.lng = userLocation.lng;
            } else if (lat && lng) {
                data.lat = lat;
                data.lng = lng;
            } else {
                // No lat/lng. Don't do nearby search.
                data.get_attractions_url = API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES;
            }
          callGetAttractions(data);
        } else if (location_searchtext) {
            // Search attractions nearby geocoded address
            data.get_attractions_url = API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES_NEARBY;
            data.searchtext = location_searchtext;

            // Geocode address
            callGeocodeAddress(data).then(function(reply, textStatus, jqXHR) {
                // Add new lat/lng to the data object.
                data.lat = reply.lat;
                data.lng = reply.lng;

                callGetAttractions(data);
            });
        } else {
            // Search activities without nearby
            data.get_attractions_url = API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES;
            delete data.within_feet;
            callGetAttractions(data);
        }
    }

    /**
     * Geolocate user
     */
    $('#nearme').click(function() {
        if ($('#nearme').prop('checked')) {
            MAP.locate({watch: false, enableHighAccuracy: true});
        } else {
            MAP.stopLocate();
            disableGeolocation();
        }
    });

    // Geolocation found handler
    MAP.on('locationfound', function(event) {
        userLocation = event.latlng;

        // Auto-center
        if (MAX_BOUNDS.contains(event.latlng)) {
            MAP.panTo(event.latlng);
        } else {
            showInfoPopup('Sorry, your current location is too far away.', 'warning');
            console.log('Geolocation out of bounds: ', userLocation);
            disableGeolocation();
        }
    });
    // Geolocation error handler
    MAP.on('locationerror', function(error) {
        showInfoPopup('We couldn\'t acquire your current location.', 'error');
        console.log('Geolocation error: ' + error.message + '(' + error.code + ')');
        disableGeolocation();
    });

    testDisplayActivities();
});

/**
* Disable geolocation:
* - ensure the button is un-checked,
* - remove our stored location, and
* - remove the marker.
*/
function disableGeolocation() {
   // $('.interactive-form-distance-near-me-input').prop('checked', false);
   userLocation = null;
}

/**
 * Get activities (AJAX)
 *
 * Works with Nearby and without.
 */
function callGetAttractions(params) {
    return $.ajax({
        url: params.get_attractions_url,
        dataType: 'json',
        data: params
        })
        .done(function(reply) {
            displayActivities(reply.results);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            console.log('callGetAttractions error');
            console.log(textStatus + ': ' + errorThrown);
        });
}

/**
 * Geocode address (AJAX)
 */
function callGeocodeAddress(params) {
    var data = {};
    data.address  = params.searchtext;
    data.bing_key = BING_API_KEY;
    data.bbox     = GEOCODE_BIAS_BOX;

    return $.ajax({
        url: API_ENDPOINT_GEOCODE,
        dataType: 'json',
        data: data
        })
        .done(function(reply) {
            var latlng = L.latLng(reply.lat, reply.lng);
            // Point outside service area
            if (! MAX_BOUNDS.contains(latlng) ) {
                showInfoPopup("The location we found for your address is too far away.", 'warning');
                return;
            }

            // @TODO: GLJS: Add a marker for their location
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            console.log(textStatus + ': ' + errorThrown);
            showInfoPopup("We couldn't find that address or city.\nPlease try again.", 'warning');
        });
}

/**
 *
 */
function testDisplayActivities() {
    var activities = JSON.parse(
        '{"results":[{"type":"attraction","name":"A.B. Williams Memorial Woods","gid":191,"record_id":192,"w":0,"s":0,"e":0,"n":0,"lat":41.56283913,"lng":-81.4252807,"thumbnail":"~\/getmedia\/a94aa4d6-3262-4423-80e2-2d0ea0d3dce0\/North_Chagrin_AB_Woods_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Wander through a dense maze of giant trees in this stunning example of an old growth beech-maple forest. A.B. Williams, Cleveland Metroparks first naturalist, embraced these woods as he conducted his doctoral studies and established the first Trails","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/North-Chagrin-Reservation\/A-B-Williams-Beech-Maple-Forest"},{"type":"attraction","name":"ALCOA Forge Overlook","gid":44,"record_id":209,"w":0,"s":0,"e":0,"n":0,"lat":41.44487123,"lng":-81.67849555,"thumbnail":null,"description":"Located along the northern end of the Towpath Trail, with the Cuyahoga River on one side and ALCOA on the other this overlook shows some of the industry in the valley.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Ohio-Erie-Canal-Reservation\/ALCOA-Forge-Overlook"},{"type":"attraction","name":"Astorhurst Trailhead","gid":418,"record_id":560,"w":0,"s":0,"e":0,"n":0,"lat":41.37196,"lng":-81.58228,"thumbnail":"~\/getmedia\/91c4df6d-2aa2-40bf-80cb-558243f8d51d\/Astorhurst.jpg.ashx?width=1296&height=864&ext=.jpg","description":"The former location of the Astorhurst Golf Course, this site is an excellent place to begin a hike through the beautiful Bedford Reservation.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Bedford-Reservation\/Astorhurst-Trailhead"},{"type":"attraction","name":"Beech Hill Pond","gid":161,"record_id":188,"w":0,"s":0,"e":0,"n":0,"lat":41.34079964,"lng":-81.83340197,"thumbnail":null,"description":"Scenic wildlife pond surrounded by beech, sugar maples, and oaks. Beautiful fall color.Beech Hill Pond is located off Big Creek Parkway, off the Valley Parkway entrance of Big Creek Reservation in Strongsville.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Big-Creek-Reservation\/Beech-Hill-Pond"},{"type":"attraction","name":"Berea Falls Scenic Overlook","gid":137,"record_id":185,"w":0,"s":0,"e":0,"n":0,"lat":41.37798536,"lng":-81.8657657,"thumbnail":"~\/getmedia\/7569d552-9831-4890-9ac8-bd1630a15ee4\/Berea_Falls_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Berea Falls is an urban waterfall with a long history.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Rocky-River-Reservation\/Berea-Falls-Scenic-Overlook"},{"type":"attraction","name":"Beyer\'s Pond","gid":31,"record_id":151,"w":0,"s":0,"e":0,"n":0,"lat":41.35584129,"lng":-81.83768151,"thumbnail":"~\/getmedia\/8678fef2-eed4-4143-bbc7-e043123e9e9c\/Beyers_Pond_Big_Creek_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Beyer\u2019s Pond is a small, secluded lake tucked away in the far reaches of Big Creek Reservation. A short, 0.7 mile hiking loop leads back to the lake, passing by wetlands and overlooking the floodplain of Baldwin Creek. This hiking loop is a great pl","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Big-Creek-Reservation\/Beyer-s-Pond"},{"type":"attraction","name":"Bluebird Point Overlook","gid":299,"record_id":196,"w":0,"s":0,"e":0,"n":0,"lat":41.38676159,"lng":-81.69352161,"thumbnail":"~\/getmedia\/7cee73f1-8bbb-4d5b-8a48-0785886208ae\/WCR_Bluebird-Point_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Bluebird Point is a trail head parking lot where guests can directly access the all purpose trail.  Not far from this point of departure is the Watershed Stewardship Center and natural surface trails: Lookout Ridge Loop, Skinner\'s Run, and Jewelwing Loop.  Bluebird Point offers tremendous bird watching opportunities.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/West-Creek-Reservation\/Bluebird-Point"},{"type":"attraction","name":"Brecksville Physical Fitness Trail","gid":423,"record_id":255,"w":0,"s":0,"e":0,"n":0,"lat":41.31822496,"lng":-81.59472998,"thumbnail":"~\/getmedia\/38b0156a-363a-4edb-abb2-17e91dc0ec76\/Breck_Physical_Fitness_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"The physical fitness trail consists of 18 exercise stations. Each station provides a different type of exercise. Located near Chippewa Ford Field, on Valley Parkway, west of Riverview Road in Brecksville.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Brecksville-Reservation\/Brecksville-Physical-Fitness-Trail"},{"type":"attraction","name":"Bridal Veil Falls Scenic Overlook","gid":58,"record_id":178,"w":0,"s":0,"e":0,"n":0,"lat":41.37354079,"lng":-81.54953406,"thumbnail":"~\/getmedia\/fc38fa6f-39bd-41f6-be49-9ab814e6750d\/Bridal_Veil_Falls_card_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"A short walk along Deerlick Creek, down the boardwalk and steps, leads to a gorgeous view of Bridal Veil Falls.These cascading waterfalls are surrounded by hardwoods and hemlocks. This is a very popular photo spot.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Bedford-Reservation\/Bridal-Veil-Falls-Scenic-Overlook"},{"type":"attraction","name":"Brooklyn Exchange Cabin","gid":67,"record_id":213,"w":0,"s":0,"e":0,"n":0,"lat":41.21129974,"lng":-81.7091027,"thumbnail":"~\/getmedia\/e76b386f-a8c4-40d8-9056-0fb9aaa452b0\/Brooklyn_Exchange_Cabin_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"The Brooklyn Exchange Club is a national service organization dedicated to serving the community and developing leadership skills. They maintain the Brooklyn Exchange Cabin, which was built in 1941, in Hinckley Reservation. The cabin is used by orga","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Hinckley-Reservation\/Brooklyn-Exchange-Cabin"},{"type":"attraction","name":"Brookside Overlook","gid":163,"record_id":189,"w":0,"s":0,"e":0,"n":0,"lat":41.44903193,"lng":-81.72020809,"thumbnail":"~\/getmedia\/57543df8-87c2-4c5e-b28f-fd78bf1eba2f\/Brookside_overlook_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"This overlook provides a sweeping view of the historic Baseball Fields of Brookside Reservation. Nestled in this urbanized section of the Old Brooklyn neighborhood of Cleveland, this reservation consists of mitigated wetlands, mature forests and man","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Brookside-Reservation\/Brookside-Overlook"},{"type":"attraction","name":"Bunns Lake","gid":63,"record_id":180,"w":0,"s":0,"e":0,"n":0,"lat":41.41741633,"lng":-81.94958749,"thumbnail":"~\/getmedia\/b0efcf2c-845b-4cd9-b528-f29d237f2f8c\/Bunns_Lake_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Bunns Lake, dedicated in 1986, was created to provide waterfowl habitat, as well as to provide fishing opportunities and serve as a pleasant spot for nature lovers.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Bradley-Woods-Reservation\/Bunns-Lake"},{"type":"attraction","name":"Burnett Historical House","gid":379,"record_id":223,"w":0,"s":0,"e":0,"n":0,"lat":41.45890567,"lng":-81.40892702,"thumbnail":null,"description":"Built in the mid to late 1800\u2019s this house bears the name of Serenus Burnett who is attributed as the founding family of Orange Township. Purchased in 1942 by the Cleveland Metroparks and later renovated by the Chagrin Valley Trails and Riding Club ","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/South-Chagrin-Reservation\/Barnett-Historical-House"},{"type":"attraction","name":"Buttermilk Falls Scenic Overlook","gid":76,"record_id":181,"w":0,"s":0,"e":0,"n":0,"lat":41.5652385,"lng":-81.43545112,"thumbnail":"~\/getmedia\/528c437e-69b6-4ecb-bcd2-491f3a2dc8a8\/Buttermilk_Falls_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"The wooded deck provides visitor a unique view of the geology of North Chagrin Reservation. Buttermilk Falls creek cascades down from Berea Sandstone through Cleveland and Chagrin Members of the Ohio Shale, over 100 million years of geologic history","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/North-Chagrin-Reservation\/Buttermilk-Falls-Scenic-Overlook"},{"type":"attraction","name":"Buzzard Roost","gid":432,"record_id":200,"w":0,"s":0,"e":0,"n":0,"lat":41.21521647,"lng":-81.70924982,"thumbnail":"~\/getmedia\/3a314409-4b64-4a87-acab-4f77bc8ebcb3\/Buzzard_Roost_01_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Located at the intersection of State Road and West Drive is the infamous Buzzard Roost. Every March 15, dating back to 1957, the buzzards are welcomed back to Hinckley Reservation by the Cleveland Metroparks official buzzard spotter.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Hinckley-Reservation\/Buzzard-Roost"},{"type":"attraction","name":"Chippewa Creek Gorge Scenic Overlook","gid":34,"record_id":173,"w":0,"s":0,"e":0,"n":0,"lat":41.31985519,"lng":-81.62176319,"thumbnail":"~\/getmedia\/80aa28e9-d128-4644-9121-e2440b6d1bc2\/ChippewaCreekGorgeListing.png.ashx?width=1440&height=864&ext=.png","description":"Chippewa Creek Gorge Scenic Overlook is located at the Route 82 entrance to Brecksville Reservation.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Brecksville-Reservation\/Chippewa-Creek-Gorge-Scenic-Overlook"},{"type":"attraction","name":"Coast Guard Station","gid":434,"record_id":226,"w":0,"s":0,"e":0,"n":0,"lat":41.50273914,"lng":-81.71250423,"thumbnail":"~\/getmedia\/27cc9515-fa60-419b-a411-06d228008c69\/Coast_Guard_Station_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"This historic location provides amazing views of Cleveland.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Lakefront-Reservation\/Coast-Guard-Station"},{"type":"attraction","name":"Deer Lick Cave","gid":10,"record_id":166,"w":0,"s":0,"e":0,"n":0,"lat":41.30517885,"lng":-81.61011265,"thumbnail":"~\/getmedia\/7f84f048-14ca-48ac-b985-d57da656147b\/Deer_Lick_Cave_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Millions of years ago an ocean covered what is now Ohio. Salt from this ocean was trapped in the sands along the ocean\u2019s shores. The salt became embedded in the sandstone that formed from these ancient sands. White-tailed deer need salt but don\u2019t ge","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Brecksville-Reservation\/Deer-Lick-Cave"},{"type":"attraction","name":"Edgewater Beach","gid":280,"record_id":243,"w":0,"s":0,"e":0,"n":0,"lat":41.48862919,"lng":-81.73997393,"thumbnail":"~\/getmedia\/01811ac8-8440-4734-9378-0af5507a73e1\/Edgewater_Beach_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Escape to the sandy beach of Edgewater to enjoy beach life in the city. A nature getaway to swim, play, picnic, and relax with your family and friends.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Lakefront-Reservation\/Edgewater-Beach"},{"type":"attraction","name":"Edgewater Beach House","gid":383,"record_id":287,"w":0,"s":0,"e":0,"n":0,"lat":41.48905,"lng":-81.73806,"thumbnail":"~\/getmedia\/69aa80f0-d46d-4a66-9aac-0ccc6f382a4e\/Edgewater_Beach_House_05.jpg.ashx?width=1440&height=864&ext=.jpg","description":"The Edgewater Beach House brings an enhanced beach-vibe through made-to-order beachside fare.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Lakefront-Reservation\/Edgewater-Beach-House"},{"type":"attraction","name":"Euclid Creek Physical Fitness Trail","gid":426,"record_id":256,"w":0,"s":0,"e":0,"n":0,"lat":41.56126689,"lng":-81.53209326,"thumbnail":null,"description":"Starts and finishes at Highland Picnic Area.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Euclid-Creek-Reservation\/Euclid-Creek-Physical-Fitness-Trail"},{"type":"attraction","name":"Fort Hill","gid":38,"record_id":175,"w":0,"s":0,"e":0,"n":0,"lat":41.40929492,"lng":-81.8884978,"thumbnail":"~\/getmedia\/ba257138-27bd-4da7-aad8-a336ac92f2d6\/Fort_Hill_01_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"This iconic landmark is one of the most picturesque locations in the Emerald Necklace. The Fort Hill Stairs ascend to stunning views 90 feet above the east and west branches of the Rocky River.After significant movement of the shale cliff alongs","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Rocky-River-Reservation\/Fort-Hill"},{"type":"attraction","name":"Foster\'s Run","gid":260,"record_id":193,"w":0,"s":0,"e":0,"n":0,"lat":41.55218518,"lng":-81.42179513,"thumbnail":null,"description":"This beautiful trail is a combination of an old roadway and a newer \u201call-purpose trail\u201d that connects Forest Picnic Area and Wilson Mills Road Trailhead parking. This delightful trail offers the outdoor enthusiast plenty of opportunities to exercise","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/North-Chagrin-Reservation\/Foster-s-Run"},{"type":"attraction","name":"Fowles Marsh","gid":420,"record_id":199,"w":0,"s":0,"e":0,"n":0,"lat":41.36664734,"lng":-81.83017943,"thumbnail":"~\/getmedia\/7f405972-5a36-43d1-b75e-37376a427bba\/Fowles-Marsh_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Once part of an extensive wetland network that included nearby Lake Abram and Lake Isaac, Fowles Marsh was historically drained for onion and celery farming. Today it has been restored to a large open marshland with mudflats that are inviting to sev","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Big-Creek-Reservation\/Fowles-Marsh"},{"type":"attraction","name":"Frostville Museum","gid":133,"record_id":217,"w":0,"s":0,"e":0,"n":0,"lat":41.40583345,"lng":-81.8912122,"thumbnail":"~\/getmedia\/f540855b-2317-4813-9cea-710004bc5310\/Frostville_Museum_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Frostville Museum is a living history of 19th century Ohio. It is located at 24101 Cedar Point Road, North Olmsted, OH 44070 at the corner of Cedar Point and Lewis Roads in Cleveland Metroparks in Rocky River Reservation.<br \/> ","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Rocky-River-Reservation\/Frostville-Museum"},{"type":"attraction","name":"Garfield Park Physical Fitness Trail","gid":429,"record_id":257,"w":0,"s":0,"e":0,"n":0,"lat":41.42958229,"lng":-81.6032764,"thumbnail":"~\/getmedia\/7a4915b6-1d3a-4db6-b169-a1ecdc98f159\/Garfield_Park_Physical_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":null,"cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Garfield-Park-Reservation\/Garfield-Park-Physical-Fitness-Trail"},{"type":"attraction","name":"Great Falls of Tinker\'s Creek","gid":28,"record_id":168,"w":0,"s":0,"e":0,"n":0,"lat":41.3837625,"lng":-81.53241265,"thumbnail":"~\/getmedia\/548adca1-c5b1-4d96-bb0b-c35c47156bb7\/Great_Falls_Card_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Great Falls of Tinkers Creek shows the natural beauty and historic relevance to the development of Bedford. ","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Bedford-Reservation\/Great-Falls-of-Tinkers-Creek"},{"type":"attraction","name":"Harriet Keeler Memorial","gid":421,"record_id":225,"w":0,"s":0,"e":0,"n":0,"lat":41.31798431,"lng":-81.61904364,"thumbnail":"~\/getmedia\/1d2338d6-7499-40dc-9b22-90aa00fed320\/Harriet_Keeler_Mem_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Harriet Keeler Memorial, located in Brecksville Reservation, honors the educator and nature enthusiast, Harriet Keeler. A nearby picnic area, also named after Keeler, allows the community to honor Keeler by interacting with nature. ","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Brecksville-Reservation\/Harriet-Keeler-Memorial"},{"type":"attraction","name":"Henry Church, Jr., Rock","gid":53,"record_id":177,"w":0,"s":0,"e":0,"n":0,"lat":41.4135165,"lng":-81.41515303,"thumbnail":"~\/getmedia\/316cf087-0d68-4fc9-8b00-05f887a3fc7f\/Henry-Church-Rock_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"This long-term ephemeral landmark is a piece of cultural history immersed in nature by the riverside. \u00a0Blacksmith, spiritualist, and artist Henry Church carved the images in the rock, dating the piece in 1885. Visit the rock, and you\'ll discover man","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/South-Chagrin-Reservation\/Henry-Church-Rock"},{"type":"attraction","name":"Hinckley Hills Trailhead","gid":433,"record_id":258,"w":0,"s":0,"e":0,"n":0,"lat":41.22173279,"lng":-81.73149124,"thumbnail":null,"description":"This rugged trail crosses ravines and streams and follows sections of the Buckeye and bridle trails. ","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Hinckley-Reservation\/Hinckley-Hills-Trailhead"},{"type":"attraction","name":"Hinckley Lake","gid":430,"record_id":162,"w":0,"s":0,"e":0,"n":0,"lat":41.22188863,"lng":-81.71581248,"thumbnail":"~\/getmedia\/cc28b0f5-4353-4fcd-9ff3-73ac8b9c8fdb\/Hinckley_Lake_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":null,"cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Hinckley-Reservation\/Hinckley-Lake"},{"type":"attraction","name":"Jackson Field","gid":377,"record_id":198,"w":0,"s":0,"e":0,"n":0,"lat":41.43297575,"lng":-81.41678139,"thumbnail":"~\/getmedia\/1cfdbfe6-daf4-4483-a2b6-a519d9f0c3cf\/Jackson-Field_feature_02.jpg.ashx?width=1920&height=1152&ext=.jpg","description":"An exceptional example of Chagrin River floodplain, Jackson Field is home to abundant plant and animal species that thrive in the rich, moist, field, wetlands, forest and the river, which is the backbone of it all. Located just North of Jackson Road","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/South-Chagrin-Reservation\/Jackson-Field"},{"type":"attraction","name":"Jack\'s Place Trailhead","gid":417,"record_id":252,"w":0,"s":0,"e":0,"n":0,"lat":41.37543657,"lng":-81.57538481,"thumbnail":null,"description":"Located off Button Road in Bedford Reservation, just east of Dunham Road in Walton Hills, this area provides horse trailer parking and quick access to the reservation\'s bridle trails near Hemlock Creek.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Bedford-Reservation\/Jack-s-Place-Trailhead"},{"type":"attraction","name":"Lake Abram Marsh","gid":32,"record_id":171,"w":0,"s":0,"e":0,"n":0,"lat":41.37977365,"lng":-81.83926441,"thumbnail":"~\/getmedia\/b5080295-a5b4-46f5-a671-c3db1ee05406\/Big_Creek_Carousel.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Lake Abram is the largest remaining glacial wetland in Cuyahoga County. With its surrounding marsh and upland areas, Lake Abram makes up 80 acres of unique and critical wildlife habitat that is home to migratory birds, waterfowl, wild turkey and muc","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Big-Creek-Reservation\/Lake-Abram-Marsh"},{"type":"attraction","name":"Lake Isaac","gid":33,"record_id":172,"w":0,"s":0,"e":0,"n":0,"lat":41.35703946,"lng":-81.82482062,"thumbnail":"~\/getmedia\/6424eb3d-5f82-431f-b71a-357124309e15\/Lake_Isaac_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Classified as a glacial pothole created thousands of years ago, Lake Isaac Waterfowl Sanctuary serves as an important refuge for migrating waterfowl. The surrounding woodlands provide habitat for red foxes, mink, deer, opossum, and countless other a","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Big-Creek-Reservation\/Lake-Isaac"},{"type":"attraction","name":"Lake Shore Electric Railway Trestle","gid":164,"record_id":219,"w":0,"s":0,"e":0,"n":0,"lat":41.48769398,"lng":-81.93664007,"thumbnail":null,"description":"Standing over Porter Creek Drive, this huge concrete structure is a mere remnant of the impressive inter-urban train system that ran from Cleveland, Lorain, Sandusky, Norwalk, Fremont, Toledo, to Detroit. Started in 1901, the Lake Shore Electric Rai","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Huntington-Reservation\/Lake-Shore-Electric-Railway-Trestle"},{"type":"attraction","name":"Lawrence Grist Mill","gid":85,"record_id":214,"w":0,"s":0,"e":0,"n":0,"lat":41.40720723,"lng":-81.88208753,"thumbnail":null,"description":"Built in 1832, the Lawrence Grist Mill provided flour and grist milling services to local residents. Evidence of the structure is still visible today.The Lawrence Grist Mill utilized the power from the water of the Rocky River to provide flour a","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Rocky-River-Reservation\/Lawrence-Grist-Mill"},{"type":"attraction","name":"Lewis Road Trailhead","gid":194,"record_id":247,"w":0,"s":0,"e":0,"n":0,"lat":41.40012614,"lng":-81.8931458,"thumbnail":null,"description":null,"cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Rocky-River-Reservation\/Lewis-Road-Trailhead"},{"type":"attraction","name":"Little Overlook","gid":30,"record_id":170,"w":0,"s":0,"e":0,"n":0,"lat":41.38288011,"lng":-81.54630528,"thumbnail":null,"description":"A short hike from Egbert Picnic Area along a woodland or all purpose trail allows for a view into Tinker\'s Creek Valley where numerous birds have been spotted flying over the creek below.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Bedford-Reservation\/Little-Overlook"},{"type":"attraction","name":"Meadows Trailhead","gid":422,"record_id":254,"w":0,"s":0,"e":0,"n":0,"lat":41.31536052,"lng":-81.62186099,"thumbnail":null,"description":"Meadows Trailhead provides easy access to a network of trails and a central parking area for equestrians and hikers. ","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Brecksville-Reservation\/Meadows-Trailhead"},{"type":"attraction","name":"Mill Creek Falls Overlook","gid":13,"record_id":167,"w":0,"s":0,"e":0,"n":0,"lat":41.44501978,"lng":-81.6253469,"thumbnail":"~\/getmedia\/26bab5d1-91b6-453b-b88b-101f2e0b74d9\/Mill_Creek_Falls_overlook_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Mill Creek Falls, Cuyahoga County\u2019s tallest waterfall, is located in Cleveland. Mill Creek Falls stands at 48 feet tall. The height and power of its flowing cascades helped Cleveland in becoming a prosperous city. The small overlook at The Yard offe","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Garfield-Park-Reservation\/Mill-Creek-Falls-Overlook"},{"type":"attraction","name":"Mill Stream Run Physical Fitness Trail","gid":439,"record_id":261,"w":0,"s":0,"e":0,"n":0,"lat":41.3547453,"lng":-81.85497672,"thumbnail":null,"description":"The physical fitness trail consists of 18 exercise stations. Each station provides a different type of exercise.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Mill-Stream-Run-Reservation\/Mill-Stream-Run-Physical-Fitness-Trail"},{"type":"attraction","name":"North Chagrin Physical Fitness Trail","gid":444,"record_id":263,"w":0,"s":0,"e":0,"n":0,"lat":41.56116214,"lng":-81.42978602,"thumbnail":null,"description":null,"cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/North-Chagrin-Reservation\/North-Chagrin-Physical-Fitness-Trail"},{"type":"attraction","name":"Old Boating Pond Bridge","gid":176,"record_id":220,"w":0,"s":0,"e":0,"n":0,"lat":41.43143716,"lng":-81.60463545,"thumbnail":"~\/getmedia\/7c8c8e76-d89e-4ed1-8c12-9b9a22cdb730\/Old_Boating_Pond_Bridge_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"The signature piece of Garfield Park Reservation days gone by. The current stone structure replaced a wooden bridge back in the 1930s when the Works Progress Administration (WPA) workers built this bridge that stands watch over Wolf Creek as it flow","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Garfield-Park-Reservation\/Old-Boating-Pond-Bridge"},{"type":"attraction","name":"Overlook Bridge","gid":298,"record_id":195,"w":0,"s":0,"e":0,"n":0,"lat":41.38556211,"lng":-81.69620296,"thumbnail":"~\/getmedia\/d3e88265-1feb-4a48-9547-bfec50ca3676\/West_Creek_Overlook_bridge_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"This quiet nook for observing wildlife and geological features of West Creek is accessible from the All Purpose Trail less than \u00bd mile from Bluebird Point.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/West-Creek-Reservation\/Overlook-Bridge"},{"type":"attraction","name":"Oxbow Lane Trailhead","gid":442,"record_id":262,"w":0,"s":0,"e":0,"n":0,"lat":41.56980774,"lng":-81.41954682,"thumbnail":null,"description":null,"cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Rocky-River-Reservation\/Oxbow-Lane-Trailhead"},{"type":"attraction","name":"Perkins Beach","gid":281,"record_id":194,"w":0,"s":0,"e":0,"n":0,"lat":41.48874116,"lng":-81.75178503,"thumbnail":null,"description":"A location where there are more shells than sand on the beach. A quiet beach with a natural surrounding with drift wood and beach glass along the shore of Lake Erie.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Lakefront-Reservation\/Perkins-Beach"},{"type":"attraction","name":"Polo Field Trailhead","gid":336,"record_id":248,"w":0,"s":0,"e":0,"n":0,"lat":41.45371504,"lng":-81.40848976,"thumbnail":"~\/getmedia\/eac605ec-736f-4726-8320-735c7bc4cd44\/Polo_Trailhead_feature_1.jpg.ashx?width=1920&height=1152&ext=.jpg","description":"This Trail head is at the Northern most point of the South Chagrin Reservation located at the Polo Field. Horse trailer parking is available at this location for access to the Bridle Trail.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/South-Chagrin-Reservation\/Polo-Field-Trailhead"},{"type":"attraction","name":"Quarry Rock","gid":160,"record_id":187,"w":0,"s":0,"e":0,"n":0,"lat":41.41204004,"lng":-81.41456847,"thumbnail":"~\/getmedia\/8dff6d69-9d54-4cdd-8759-6fdc95f35656\/South_Quarry_Rock_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Quarry Rock Picnic Area is located off Solon Rd., west of Chagrin River Rd. An overlook deck affords a picturesque view of the Aurora Branch of the Chagrin River complete with water cascades. Large icicles can be seen clinging to the rock cliffs in ","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/South-Chagrin-Reservation\/Quarry-Rock"},{"type":"attraction","name":"Rocky River Physical Fitness Trail","gid":452,"record_id":265,"w":0,"s":0,"e":0,"n":0,"lat":41.46999169,"lng":-81.83049449,"thumbnail":null,"description":null,"cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Rocky-River-Reservation\/Rocky-River-Physical-Fitness-Trail"},{"type":"attraction","name":"Rogers Meadow","gid":443,"record_id":201,"w":0,"s":0,"e":0,"n":0,"lat":41.56844382,"lng":-81.41556451,"thumbnail":null,"description":"During the warmer months, Rogers Meadow is teeming with wildflowers and insects. In the spring, marvel at the beautiful spring wildflowers. In the summer and fall, enjoy the diversity of insect life, including butterflies and grasshoppers. This site","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/North-Chagrin-Reservation\/Rogers-Meadow"},{"type":"attraction","name":"Scranton Road Peninsula","gid":468,"record_id":536,"w":0,"s":0,"e":0,"n":0,"lat":41.4904,"lng":-81.6942,"thumbnail":"~\/getmedia\/724f796b-9ec4-4af6-ba36-c95c57a128ee\/LF_Scranton_Rd_Pennisula_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Running from University Rd. to Carter Rd. this area features public fishing access, a river observation deck and fish habitat breeding areas.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Lakefront-Reservation\/Scranton-Road-Peninsula"},{"type":"attraction","name":"Smoky Memorial","gid":331,"record_id":222,"w":0,"s":0,"e":0,"n":0,"lat":41.46677787,"lng":-81.83327215,"thumbnail":"~\/getmedia\/76e0a4d7-534d-42dc-bb58-7b6d902f059c\/RR_Smokey_Memorial_thumb.jpg.ashx","description":"Smoky Memorial celebrates Smoky, a Yorkshire Terrier that aided troops during WWII and later became the world\u2019s first therapy dog on record. ","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Rocky-River-Reservation\/Smoky-Memorial"},{"type":"attraction","name":"South Chagrin Arboretum","gid":119,"record_id":184,"w":0,"s":0,"e":0,"n":0,"lat":41.41375236,"lng":-81.42247339,"thumbnail":null,"description":"The Arboretum is a 15-acre area on Arbor Lane (off Hawthorn Parkway and Cannon Rd.). Originally planted by the Cleveland Natural Science Club as a collection of woody plants from club member travels, it was replanted by Cleveland Metroparks to highl","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/South-Chagrin-Reservation\/South-Chagrin-Arboretum"},{"type":"attraction","name":"South Chagrin Physical Fitness Trail","gid":174,"record_id":246,"w":0,"s":0,"e":0,"n":0,"lat":41.41734948,"lng":-81.42041734,"thumbnail":null,"description":"Look and learn how a golf course can be restored to wild forests and wetlands as you walk the open, rolling hills of Acacia Reservation.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/South-Chagrin-Reservation\/South-Chagrin-Physical-Fitness-Trail"},{"type":"attraction","name":"Squire Rich Museum","gid":4,"record_id":205,"w":0,"s":0,"e":0,"n":0,"lat":41.30747273,"lng":-81.62641495,"thumbnail":"~\/getmedia\/a9b46c79-0387-484d-a4a7-c94aef4d058d\/Squire_Rich_Museum_02_Thumb.jpg.ashx?width=1440&height=861&ext=.jpg","description":"Squire Rich Museum is operated by the Brecksville Historical Society and is open Sunday afternoons from 1 - 5 p.m. June through October.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Brecksville-Reservation\/Squire-Rich-Museum"},{"type":"attraction","name":"Squire\'s Castle","gid":96,"record_id":215,"w":0,"s":0,"e":0,"n":0,"lat":41.58000573,"lng":-81.41925363,"thumbnail":"~\/getmedia\/81f07a4c-dbfd-4e8d-a6c2-d482f01da8ca\/Squires_Castle_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"This beautiful old gatehouse from the 1890s is modeled after German and English baronial castles and is a unique feature of North Chagrin that is a popular destination for people of all ages. Squire\u2019s Castle should be on your \u201cmust see\u201d list for Nor","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/North-Chagrin-Reservation\/Squire-s-Castle"},{"type":"attraction","name":"Stinchcomb-Groth Memorial","gid":390,"record_id":224,"w":0,"s":0,"e":0,"n":0,"lat":41.466579,"lng":-81.82988215,"thumbnail":null,"description":"Stinchcomb-Groth Memorial, a 30-foot tower made of cinder block and sandstone, was dedicated in 1958 to the first two directors of Cleveland Metroparks, William Stinchcomb and Harold Groth. Together, these two men were responsible for establishing 1","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Rocky-River-Reservation\/Stinchcomb-Groth-Memorial"},{"type":"attraction","name":"Stinchcomb-Groth Memorial Scenic Overlook","gid":0,"record_id":186,"w":0,"s":0,"e":0,"n":0,"lat":41.46742031,"lng":-81.83144814,"thumbnail":null,"description":"The Stinchcomb-Groth Memorial, a 30-foot tower made of cinder block and sandstone, was dedicated in 1958 to the first two directors of Cleveland Metroparks, William Stinchcomb and Harold Groth. Together, these two men were responsible for establishi","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Rocky-River-Reservation\/Stinchcomb-Groth-Memorial-Scenic-Overlook"},{"type":"attraction","name":"Strawberry Pond","gid":39,"record_id":176,"w":0,"s":0,"e":0,"n":0,"lat":41.57963886,"lng":-81.43104599,"thumbnail":null,"description":"This wildlife pond has been a favorite of visitors for many decades. This historic pond was a popular ice skating and fishing site for many generations. Today the pond has been deepened and enlarged with two fishing platforms to further the traditio","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/North-Chagrin-Reservation\/Strawberry-Pond"},{"type":"attraction","name":"Strongsville Wildlife Area","gid":2,"record_id":165,"w":0,"s":0,"e":0,"n":0,"lat":41.31781044,"lng":-81.80922299,"thumbnail":"~\/getmedia\/053542b0-5021-48e2-8631-1ab342590010\/Strongsville_Wildlife_area_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Strongsville Wildlife Area has wetlands, meadows and woods that make it a great place to watch for birds and other wildlife. Strongsville Wildlife Area is located off Valley Parkway in Mill Stream Run Reservation, between Routes 42 and 82 in Strongs","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Mill-Stream-Run-Reservation\/Strongsville-Wildlife-Area"},{"type":"attraction","name":"Tallgrass Prairie","gid":59,"record_id":179,"w":0,"s":0,"e":0,"n":0,"lat":41.3181274,"lng":-81.61791326,"thumbnail":"~\/getmedia\/9b3ffc02-6a78-4b59-93d8-4bd5bed8d184\/TallgrassPrairie.png.ashx?width=1440&height=864&ext=.png","description":"The tallgrass prairie is a unique ecosystem with incredible plant and animal diversity. The variety of milkweed species makes the tallgrass prairie a perfect nursery for the monarch butterfly. Through the efforts of many people, the tallgrass prairi","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Brecksville-Reservation\/Tallgrass-Prairie"},{"type":"attraction","name":"The Yard at Mill Creek Falls","gid":66,"record_id":212,"w":0,"s":0,"e":0,"n":0,"lat":41.44454412,"lng":-81.62695337,"thumbnail":null,"description":"Parking is provided during the non-winter months. The small overlook at The Yard offers an amazing view of Mill Creek Falls. You can also discover that the current location of the Falls is not the original and why it\'s not.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Garfield-Park-Reservation\/The-Yard-at-Mill-Creek-Falls"},{"type":"attraction","name":"Tinkers Creek Gorge Scenic Overlook","gid":29,"record_id":169,"w":0,"s":0,"e":0,"n":0,"lat":41.37754568,"lng":-81.55874333,"thumbnail":"~\/getmedia\/239c8a28-32b2-4e4c-9ade-4f73bc9485af\/Gorge_Scenic_Overlook_Thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Enjoy spectacular panoramic views of the valley from the rim of the gorge. ","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Bedford-Reservation\/Tinkers-Creek-Gorge-Scenic-Overlook"},{"type":"attraction","name":"Tyler Barn","gid":97,"record_id":216,"w":0,"s":0,"e":0,"n":0,"lat":41.46277144,"lng":-81.81777588,"thumbnail":null,"description":"Born in 1835, Washington S. Tyler was one of Cleveland\'s most successful businessmen and founder of the Tyler Company, a pioneer in the introduction of wire specialties. Tyler Barn was part of the family summer residence, known as Woodside, a countr","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Rocky-River-Reservation\/Tyler-Barn"},{"type":"attraction","name":"USS Maine & American Legion Memorial","gid":37,"record_id":208,"w":0,"s":0,"e":0,"n":0,"lat":41.45284239,"lng":-81.65914158,"thumbnail":null,"description":"Located at the entrance to Washington Reservation, these memorials serve as a reminder of our past.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Washington-Reservation\/USS-Maine-American-Legion-Memorial"},{"type":"attraction","name":"Viaduct Park","gid":143,"record_id":218,"w":0,"s":0,"e":0,"n":0,"lat":41.38525361,"lng":-81.53401904,"thumbnail":"~\/getmedia\/b7c2db94-48b3-4f90-81c4-414f3a05c3d5\/Viaduct_Park_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"<p>Bedford\'s history began here as the power of the Great Falls of Tinker\'s Creek was harnessed between 1821-1913 for a saw mill, grist mill and electric power plant. Families such as the Benedict\'s, Willis\', Gates\', and others all left their mark o","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Bedford-Reservation\/Viaduct-Park"},{"type":"attraction","name":"Washington Arboretum","gid":36,"record_id":174,"w":0,"s":0,"e":0,"n":0,"lat":41.45404284,"lng":-81.65932585,"thumbnail":null,"description":"This newly renovated arboretum serves both as an educational collection of trees and as an interesting location for urban wildlife watching. Located adjacent to an Audubon certified golf course, this area attracts a variety of birds and other animal","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Washington-Reservation\/Washington-Arboretum"},{"type":"attraction","name":"Water Tower","gid":22,"record_id":207,"w":0,"s":0,"e":0,"n":0,"lat":41.49063053,"lng":-81.93371297,"thumbnail":null,"description":"Though it looks like a lighthouse, this tower was actually a water-pumping structure that served to irrigate the vineyards of John Huntington\'s 100 acre estate. A brick pump-house is located below the tower, which is speculated to have been run on s","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Huntington-Reservation\/Water-Tower"},{"type":"attraction","name":"West Drive Scenic Overlook","gid":115,"record_id":183,"w":0,"s":0,"e":0,"n":0,"lat":41.21752543,"lng":-81.71044961,"thumbnail":null,"description":"This scenic overlook provides a nice view of the East branch of the Rocky River as it flows into Hinckley Lake.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Hinckley-Reservation\/West-Drive-Scenic-Overlook"},{"type":"attraction","name":"Whipp\'s Ledges","gid":187,"record_id":190,"w":0,"s":0,"e":0,"n":0,"lat":41.21971205,"lng":-81.70072102,"thumbnail":"~\/getmedia\/1456d907-a1c0-4345-b90b-75cbe48195b2\/Whipps_Ledges_thumb.jpg.ashx?width=1440&height=864&ext=.jpg","description":"Hinckley Reservation is one of the few places in northeast Ohio with exposed sandstone ledges of Sharon Conglomerate. The geology not only provides unique recreational rock climbing opportunities (by permit only), but also unique habitats.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Hinckley-Reservation\/Whipp-s-Ledges"},{"type":"attraction","name":"Wilson\'s Yard Trailhead","gid":461,"record_id":267,"w":0,"s":0,"e":0,"n":0,"lat":41.42360095,"lng":-81.41793834,"thumbnail":null,"description":null,"cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/South-Chagrin-Reservation\/Wilson-s-Yard-Trailhead"},{"type":"attraction","name":"Worden Heritage Homesite","gid":0,"record_id":206,"w":0,"s":0,"e":0,"n":0,"lat":41.20235352,"lng":-81.71833545,"thumbnail":null,"description":"The Worden Homestead is named after Hiram Worden, who settled in Hinckley Township and built the house in 1862. Today the homestead is run by the Hinckley Historical Society.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Hinckley-Reservation\/Worden-Heritage-Homesite"},{"type":"attraction","name":"Worden\'s Ledges","gid":189,"record_id":191,"w":0,"s":0,"e":0,"n":0,"lat":41.2049082,"lng":-81.71662266,"thumbnail":"~\/getmedia\/18fb68c6-9399-4665-9c3e-b91eb4dbb6e9\/WordensLedges.png.ashx?width=1440&height=864&ext=.png","description":"The carvings at Worden\'s Ledges are a unique treasure which adds to the beauty, diversity, and cultural history of Hinckley Reservation.","cmp_url":"http:\/\/www.clevelandmetroparks.com\/Parks\/Visit\/Parks\/Hinckley-Reservation\/Worden-s-Ledges"}]}'
    );
    displayActivities(activities.results);
}

/**
 * Display activities on the map.
 */
function displayActivities(activities) {
    for (var i = 0; i < activities.length; i++) {
        var activity = activities[i];

        var popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(attractionPopupMarkup(activity));

        var marker = new mapboxgl.Marker()
            .setLngLat([activity.lng, activity.lat])
            .setPopup(popup)
            .addTo(MAP);
    }

    MAP.fitBounds(MAX_BOUNDS);
}

/**
 * Make marker popup
 */
function attractionPopupMarkup(attraction) {
    // Only show description & thumbnail if we have room for tall popups
    showAll = ($("#map_canvas").height() >= 500);

    markup = "<h3>" + attraction.name + "</h3>";

    if (showAll && attraction.description) {
        markup += "<p>" + attraction.description + "</p>";
    }

    if (attraction.cmp_url) {
        markup += '<p><a href="' + attraction.cmp_url + '" title="Find out more about ' + attraction.name + '." target="_blank">More info</a></p>';
    }

    if (showAll && attraction.thumbnail) {
        // Remove "~/" and prepend CM site URL
        thumbnail_path = CM_SITE_BASEURL + attraction.thumbnail.replace('~/', '');
        // Resize image:
        thumbnail_height = 150;
        thumbnail_path = thumbnail_path.replace(/width=\d*\&height=\d*\&/, 'height=' + thumbnail_height + '&');
        markup += '<img src="' + thumbnail_path + '" height="' + thumbnail_height + '" alt="' + attraction.name + '" />';
    }

    map_link = WEBAPP_BASEPATH + 'mobile?type=attraction&gid=' + attraction.gid;
    markup += '<p><a href="' + map_link + '" target="_blank">See on full map </a></p>';

    return markup;
}