/**
 * common.js
 *
 * JS for common app functionality.
 *
 * Cleveland Metroparks
 */

var isMobile = /Mobi/.test(navigator.userAgent); // Simple mobile device detection.

// Markers
var MARKER_TARGET = new mapboxgl.Marker({ color: '#207FD0' });
var MARKER_START = new mapboxgl.Marker({ color: '#6BB03E' }); // Directions start
var MARKER_END = new mapboxgl.Marker({ color: '#FF7866' }); // Directions end

var SKIP_TO_DIRECTIONS = false;

var ctrlGeolocate;

var SETTINGS = [];
// We'll get this from localStorage on document ready
SETTINGS.coordinate_format = 'dms';

var currentTrailViewMarker = null;
var currTrailViewGeo = null;
var isMouseOnTrailViewLayer = false;

/**
 * Creates TrailView map layer for dots
 * @param {object} data - TrailView data
 */
 function createTrailViewMapLayer(data) {
    if (!MAP.getSource('dots')) {
        let layerData = {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
        }
        let features = [];
        for (let i = 0; i < data.length; i++) {
            let f = {
                'type': 'Feature',
                'properties': {
                    'imageID': data[i]['id']
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [data[i]['longitude'], data[i]['latitude']]
                }
            }
            features.push(f);
        }
        layerData['data']['features'] = features;
        MAP.addSource('dots', layerData);
    }
    
    MAP.addLayer({
        'id': 'dots',
        'type': 'circle',
        'source': 'dots',
        'paint': {
            'circle-radius': 10,
            'circle-color': '#00a108',
            'circle-pitch-alignment': 'viewport',
            'circle-pitch-scale': 'map',
        },
        'layout': {
            'circle-sort-key': 100,
        }
    });
    MAP.setPaintProperty('dots', 'circle-radius', [
        'interpolate',

        ['exponential', 0.5],
        ['zoom'],
        13,
        3,

        16,
        5,

        17,
        7,

        20,
        10
    ]);
    MAP.setPaintProperty('dots', 'circle-opacity', [
        'interpolate',

        ['exponential', 0.5],
        ['zoom'],
        13,
        0.05,

        15,
        0.1,

        17,
        0.25,

        20,
        1
    ]);   
 
    if (!currentTrailViewMarker) {
        // Create currentTrailViewMarker icon
        const currentTrailViewMarker_wrap = document.createElement('div');
        currentTrailViewMarker_wrap.classList.add('marker-current-wrapper');
        const currentTrailViewMarker_div = document.createElement('div');
        currentTrailViewMarker_div.classList.add('marker-current');
        const currentTrailViewMarker_view_div = document.createElement('div');
        currentTrailViewMarker_view_div.classList.add('marker-viewer');
        currentTrailViewMarker_wrap.appendChild(currentTrailViewMarker_div);
        currentTrailViewMarker_wrap.appendChild(currentTrailViewMarker_view_div);
        currentTrailViewMarker = new mapboxgl.Marker(currentTrailViewMarker_wrap)
            .setLngLat([-81.6826650, 41.4097766])
            .addTo(MAP)
            .setRotationAlignment('map')
            .setPitchAlignment('map');
        if (currTrailViewGeo != null) {
            currentTrailViewMarker.setLngLat([currTrailViewGeo.longitude, currTrailViewGeo.latitude]);
        }
    }
}

function checkTrailViewState(changeContainers = true) {
    if ($('#trailview_checkbox').is(':checked')) {
        if (!MAP.getLayer('dots')) {
            createTrailViewMapLayer(trailViewData);
        } else {
            MAP.addLayer('dots');
        }
        createTrailViewer(trailViewData);
        isTrailViewEnabled = true;
        if (changeContainers) {
            if (isMobileView == true) {
                fullElement = null;
            } else {
                fullElement = 'map';
            }
            updateContainers();
            $('#sidebar').show();
        }
    } else {
        if (MAP.getLayer('dots')) {
            MAP.removeLayer('dots');
        }
        if (currentTrailViewMarker) {
            currentTrailViewMarker.remove();
            currentTrailViewMarker = null;
        }
        clearInterval(updateMarkerRotationInterval);
        clearInterval(updateNavArrowsInterval);
        $('new_nav').remove();
        destroyTrailViewer();
        isTrailViewEnabled = false;
        if (changeContainers) {
            updateContainers();
        }
    }
}


function createTrailViewer(data) {
    if (!TRAILVIEWER) {
        TRAILVIEWER = new TrailViewer({
            'useURLHashing': false, 
            'onGeoChangeFunc': onGeoChange,
            // 'onSceneChangeFunc': onSceneChange,
            'onInitDoneFunc': onInitDone,
            'onArrowsAddedFunc': populateArrows,
            'navArrowMinAngle': -25,
            'navArrowMaxAngle': -20,
        }, 
        null, data, MAP.getCenter().lat, MAP.getCenter().lng);
        $('#viewer_container').stop().fadeIn(500);$('#viewer_container').stop().fadeIn(500);
    }
}

function destroyTrailViewer() {
    if (TRAILVIEWER) {
        TRAILVIEWER.destroy();
        TRAILVIEWER = null;
    }
    $('#viewer_container').stop().fadeOut(500);
}

function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
} 

window.addEventListener('resize', () => {
    onWindowResize();
});

var isTrailViewMobile = false;

function resizeElements() {
    if (TRAILVIEWER && TRAILVIEWER._panViewer) {
        TRAILVIEWER._panViewer.resize();
    }
    if (MAP) {
        MAP.resize();
    }
}

var isMobileView = false;
var isTrailViewEnabled = false;
var fullElement = 'map';

function updateContainers() {
    if (isTrailViewEnabled) {
        $('#map_fullscreen_btn').show();
        if (fullElement == 'map') {
            TRAILVIEWER._panViewer.setHfov(120, 500);
            $('#sidebar').show();
            $('#map_container').show();
            $('#map_container').removeClass().addClass('full-container');
            if (isMobileView) {
                $('#viewer_container').hide();
            } else {
                $('#viewer_container').show().removeClass().addClass('small-container');
                populateArrows(currentHotspots);
            }
        } else if (fullElement == 'viewer') {
            if (isMobileView) {
                TRAILVIEWER._panViewer.setHfov(90, 500);
                $('#sidebar').hide();
                $('#map_container').hide();
            } else {
                TRAILVIEWER._panViewer.setHfov(120, 500);
                $('#map_container').show().removeClass().addClass('small-container');
            }
            $('#viewer_container').show().removeClass().addClass('full-container');
            populateArrows(currentHotspots);
        } else {
            TRAILVIEWER._panViewer.setHfov(120, 500);
            $('#sidebar').show();
            $('#map_container').show().removeClass().addClass('bottom-container');
            $('#viewer_container').show().removeClass().addClass('top-container');
            populateArrows(currentHotspots);
        }
    } else {
        $('#map_fullscreen_btn').hide();
        $('#sidebar').show();
        $('#map_container').show().removeClass().addClass('full-container');
        $('#viewer_container').hide();
    }
    resizeElements();
}

function onWindowResize() {
    if (!isMobileView && window.innerWidth < 768) {
        isMobileView = true;
        fullElement = null;
        updateContainers();
    } else if (isMobileView && window.innerWidth >= 768) {
        isMobileView = false;
        fullElement = 'map';
        updateContainers();
    }
}

var is3D = false;

/**
 * Called when data has been fetched and 
 * then initializes viewer and map
 * @param {Object} data 
 */
 function initTrailView(data) {

    onWindowResize();

    $('#trailview_checkbox').on('change', () => {
        checkTrailViewState();
    });

    $('#fullscreen_btn').on('click', () => {
        toggleFullscreen(!isMapFullscreen);
    });

    $('#map_fullscreen_btn').on('click', () => {
        if (isMobileView) {
            if (fullElement == 'map') {
                fullElement = null;
            } else {
                fullElement = 'map';
            }
        } else {
            if (fullElement == 'map') {
                fullElement = 'viewer';
            } else {
                fullElement = 'map';
            }
        }
        updateContainers();
    });

    $('#viewer_fullscreen_btn').on('click', () => {
        if (isMobileView) {
            if (fullElement == 'viewer') {
                fullElement = null;
            } else {
                fullElement = 'viewer';
            }
        } else {
            if (fullElement == 'viewer') {
                fullElement = 'map';
            } else {
                fullElement = 'viewer';
            }
        }
        updateContainers();
    });

    $('#3d_btn').on('click', () => {
        if (!is3D) {
            MAP.setMaxPitch(60);
            MAP.setMinPitch(0);
            changeBasemap('photo');
            let orbit_pos = MAP.getCenter();
            if (currentTrailViewMarker) {
                orbit_pos = currentTrailViewMarker.getLngLat();
            }
            let zoom = MAP.getZoom();
            zoom = clamp(zoom, 16, 19);
            setTimeout(() => {
                MAP.easeTo({
                    center: orbit_pos,
                    pitch: 60,
                    bearing: MAP.getBearing() + 179,
                    zoom: zoom,
                    easing: (x) => (1 - Math.cos((x * Math.PI) / 2)),
                    duration: 3000,
                }).once('moveend', () => {
                    MAP.easeTo({
                        bearing: MAP.getBearing() + 179,
                        duration: 7000,
                        easing: (x) => Math.sin((x * Math.PI) / 2),
                    })
                });
            }, 500);
            is3D = true;
        } else {
            changeBasemap('map');
            MAP.stop();
            let orbit_pos = MAP.getCenter();
            if (currentTrailViewMarker) {
                orbit_pos = currentTrailViewMarker.getLngLat();
            }
            setTimeout(() => {
                MAP.easeTo({
                    center: orbit_pos,
                    pitch: 0,
                    duration: 500,
                    bearing: 0,
                });
            }, 500);
            is3D = false;
        }
    });

    $('#3d_checkbox').on('change', () => {
        if ($('#3d_checkbox').is(':checked')) {
            MAP.setMaxPitch(60);
            MAP.setMinPitch(0);
            changeBasemap('photo');
            let orbit_pos = MAP.getCenter();
            if (currentTrailViewMarker) {
                orbit_pos = currentTrailViewMarker.getLngLat();
            }
            let zoom = MAP.getZoom();
            zoom = clamp(zoom, 16, 19);
            setTimeout(() => {
                MAP.easeTo({
                    center: orbit_pos,
                    pitch: 60,
                    bearing: MAP.getBearing() + 179,
                    zoom: zoom,
                    easing: (x) => (1 - Math.cos((x * Math.PI) / 2)),
                    duration: 3000,
                }).once('moveend', () => {
                    MAP.easeTo({
                        bearing: MAP.getBearing() + 179,
                        duration: 7000,
                        easing: (x) => Math.sin((x * Math.PI) / 2),
                    })
                });
            }, 500);
        } else {
            changeBasemap('map');
            MAP.stop();
            let orbit_pos = MAP.getCenter();
            if (currentTrailViewMarker) {
                orbit_pos = currentTrailViewMarker.getLngLat();
            }
            setTimeout(() => {
                MAP.easeTo({
                    center: orbit_pos,
                    pitch: 0,
                    duration: 500,
                    bearing: 0,
                });
            }, 500);
        }
    });

    // Handle when dots are clicked
    MAP.on('click', (e) => {
        if (TRAILVIEWER) {
            let minId = TRAILVIEWER.getNearestImageId(e.lngLat.lat, e.lngLat.lng, 10);
            if (minId != null) {
                if (isMobileView && fullElement == 'map') {
                    fullElement = null;
                    updateContainers();
                }
                TRAILVIEWER.goToImageID(minId);
            }
        }
    });

    // Update visual cursor
    MAP.on("mouseenter", 'dots', () => {
        isMouseOnTrailViewLayer = true;
        MAP.getCanvas().style.cursor = "pointer";
    });

    MAP.on("mouseleave", 'dots', () => {
        isMouseOnTrailViewLayer = false;
        MAP.getCanvas().style.cursor = "grab";
    });

    MAP.on('mousedown', () => {
        if (!isMouseOnTrailViewLayer) {
            MAP.getCanvas().style.cursor = "grabbing";
        }
    });

    MAP.on('mouseup', () => {
        if (isMouseOnTrailViewLayer) {
            MAP.getCanvas().style.cursor = 'pointer';
        } else {
            MAP.getCanvas().style.cursor = 'grab';
        }
    });
}

var trailViewData = null;

/**
 * Fetches base data for points
 */
 function fetchTrailViewData() {
    $.getJSON("https://trailview.cmparks.net/api/images.php", {
        'type': 'standard'
        },
        function (data, textStatus, jqXHR) {
            trailViewData = data['imagesStandard'];
            initTrailView(data['imagesStandard']);
        }
    );
}



/**
 * Initialize the map
 *
 * @param mapOptions {object}: Custom map initialization options
 *   @TODO: Allow using any Mapbox GL native Map option.
 *   base {string}: 'photo' / 'map'
 *   trackUserLocation {boolean}: for geolocate control
 *   lat {float}
 *   lng {float}
 *   zoom {int}
 *   drop_marker {boolean}
 *   scrollZoom {boolean}
 */
function initMap(mapOptions) {
    // Base map type; URL param or map (vs photo/satellite) default
    var base = mapOptions.base || 'map';
    var basemap_style; // Mapbox base style layer

    switch (base) {
        case 'photo':
            basemap_style = STYLE_LAYER_CM_SAT;
            break;
        case 'map':
        default:
            basemap_style = STYLE_LAYER_CM_MAP;
            break;
    }

    // Map
    MAP = new mapboxgl.Map({
         container: 'map_canvas',
         style: basemap_style,
         clickTolerance: 10,
         center: START_CENTER,
         zoom: START_ZOOM,
         maxPitch: 60,
         minPitch: 0,
         preserveDrawingBuffer: false // for printing in certain browsers
     });

    // Nav (zoom/tilt) Control
    var ctrlNav = new mapboxgl.NavigationControl();
    MAP.addControl(ctrlNav, 'bottom-right');

    // Geolocate control
    ctrlGeolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
           enableHighAccuracy: true
        },
        trackUserLocation: (mapOptions.trackUserLocation == false) ? false : true,
    });
    MAP.addControl(ctrlGeolocate, 'bottom-right');

    // Scale control
    var ctrlScale = new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'imperial'
    });
    MAP.addControl(ctrlScale, 'bottom-left');

    // Zoom to the lat/lng/zoom given in the URL, or else to the max extent
    if (mapOptions.lat && mapOptions.lng && mapOptions.zoom) {
        var lat = parseFloat(mapOptions.lat);
        var lng = parseFloat(mapOptions.lng);
        var zoom = parseInt(mapOptions.zoom);
        MAP.setCenter([lng, lat]);
        MAP.setZoom(zoom);
        if (mapOptions.drop_marker) {
            MAP.addLayer(MARKER_TARGET);
            placeMarker(MARKER_TARGET, lng, lat);
        }
    } else {
        MAP.fitBounds(MAX_BOUNDS);
    }

    // Fire mapInitialized event
    $.event.trigger({
        type: 'mapInitialized',
    });
}

/**
 * Called by setInterval() and updates currentTrailViewMarker bearing
 */
 function updateMarkerRotation() {
    if (TRAILVIEWER && TRAILVIEWER._panViewer && currentTrailViewMarker) {
        let angle = TRAILVIEWER.getBearing();
        currentTrailViewMarker.setRotation((angle + 225) % 360);
    }
}

var updateMarkerRotationInterval = null;
var updateNavArrowsInterval = null;

/**
 * Called when viewer initialization is done
 * @param {TrailViewer} viewer
 */
function onInitDone(viewer) {
    viewer._panViewer.resize();
    updateMarkerRotationInterval = setInterval(updateMarkerRotation, 16);
    updateNavArrowsInterval = setInterval(updateNavArrows, 16);
}

/**
 * Updates navigation arrows transform
 * Called by setInterval()
 */
 function updateNavArrows() {
    if (TRAILVIEWER && TRAILVIEWER._panViewer) {
        // Arrow rotation
        $('.new_nav').each(function (index, element) {
            let yaw = customMod(((360 - angle180to360(TRAILVIEWER._panViewer.getYaw())) + $(element).data('yaw')), 360);
            if (fullElement == 'viewer') {
                $(element).css('transform', 'rotateZ(' + yaw + 'deg) translateY(-100px)');
            } else {
                $(element).css('transform', 'rotateZ(' + yaw + 'deg) translateY(-50px)');
            }
        });
        // Container rotation
        let rot = (TRAILVIEWER._panViewer.getPitch() + 90) / 2.5;
        if (rot > 80) {
            rot = 80
        } else if (rot < 0) {
            rot = 0;
        }
        $('#nav_container').css('transform', 'perspective(300px) rotateX(' + rot + 'deg)');
    }
}

/**
 * Called when navigation arrow is clicked
 * @param {String} id - Image ID to navigate to
 */
 function onNavArrowClicked(id) {
    TRAILVIEWER.goToImageID(id);
}

var isMapFullscreen = true;

function toggleFullscreen(setMapFullscreen) {
    if (setMapFullscreen && !isMapFullscreen) {
        $('#viewer_container').removeClass('full-container').addClass('small-container');
        $('#nav_container').removeClass('nav_container-full').addClass('nav_container-small');
        $('#map_container').removeClass('small-container').addClass('full-container');
        $('#fullscreen_btn').detach().appendTo('.small-container');
        TRAILVIEWER._panViewer.setHfov(100, 500);
        TRAILVIEWER._panViewer.resize();
        MAP.resize();
        isMapFullscreen = true;
        populateArrows(currentHotspots);
    } else if (!setMapFullscreen && isMapFullscreen) {
        $('#viewer_container').removeClass('small-container').addClass('full-container');
        $('#nav_container').removeClass('nav_container-small').addClass('nav_container-full');
        $('#map_container').removeClass('full-container').addClass('small-container');
        $('#fullscreen_btn').detach().appendTo('.small-container');
        TRAILVIEWER._panViewer.setHfov(120, 500);
        TRAILVIEWER._panViewer.resize();
        MAP.resize();
        isMapFullscreen = false;
        populateArrows(currentHotspots);
    }
    let zoom = MAP.getZoom();
    zoom = clamp(zoom, 16, 19);
    MAP.jumpTo({
        center: currentTrailViewMarker.getLngLat(),
        zoom: zoom,
    });
}

var currentHotspots;

/**
 * 
 * @param {Object} hotspots - JSON object from pannellum config
 */
 function populateArrows(hotspots) {
    currentHotspots = hotspots;
    $('.new_nav').remove();
    if (!hotspots) {
        return;
    }
    for (let i = 0; i < hotspots.length; i++) {
        let link = document.createElement('img');
        $(link).addClass('new_nav');
        if (fullElement == 'viewer') {
            $('#nav_container').removeClass('nav_container-small').addClass('nav_container-full');
            $(link).addClass('new_nav-full');
        } else {
            $('#nav_container').removeClass('nav_container-full').addClass('nav_container-small');
            $(link).addClass('new_nav-small');
        }
        $(link).attr('src', '/static/images/ui/arrow_new_small_white.png');
        $(link).data('yaw', hotspots[i].yaw);
        $(link).data('id', hotspots[i]['clickHandlerArgs']['id']);
        $(link).hide(0);
        $(link).on('click', function (e) { 
            e.preventDefault();
            onNavArrowClicked($(this).data('id'));
            $('.new_nav').fadeOut(10);
        });
        $(link).attr('draggable', false);
        //$(link).css('transform', 'rotateZ(' + hotspots[i].yaw + 'deg) translateY(-100px)');
        $('#nav_container').append($(link));
    }
    updateNavArrows();
    $('.new_nav').fadeIn(200);
}

/**
 * Called when geo is changed from viewer
 * @param {Object} geo - format {'latitude': 0, 'longitude': 0}
 */
 function onGeoChange(geo) {
    currTrailViewGeo = geo;
    if (currentTrailViewMarker != null) {
        currentTrailViewMarker.setLngLat([geo['longitude'], geo['latitude']]);
        MAP.easeTo({
            center: currentTrailViewMarker.getLngLat(),
            duration: 500,
        });
    }
}

/**
 * Place marker
 */
function placeMarker(marker, lat, lng) {
    marker.setLngLat([lng, lat])
          .addTo(MAP);
}

/**
 * Clear marker
 */
function clearMarker(marker) {
    marker.remove();
}

/**
 * Show informational popup
 */
function showInfoPopup(message, type) {
    switch (type) {
        case 'warning':
            classes = 'info-popup warning';
            break;
        case 'error':
            classes = 'info-popup error';
            break;
        default:
            classes = 'info-popup';
    }
    var info_popup = new mapboxgl.Popup({
        closeOnClick: false,
        className: classes,
    });
    info_popup
        .setLngLat(MAP.getCenter())
        .setHTML(message)
        .addTo(MAP);
}

/**
 * Enable the given base map layer.
 *
 * @param layer_key: Must refer to the key of an available layer (in STYLE_LAYERS constant).
 */
function changeBasemap(layer_key) {
    active_layer = STYLE_LAYERS[layer_key];
    MAP.setStyle(active_layer, {
        diff: false
    });
    if (active_layer == STYLE_LAYER_CM_SAT) {
        MAP.once('style.load', () => {
            MAP.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1?optimize=true',
                'tileSize': 256,
                'maxzoom': 14
            });
            MAP.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.25 });
            checkTrailViewState(false);
        });
    } else {
        MAP.once('style.load', () => {
            MAP.setTerrain(null);
            checkTrailViewState(false);
        });
    }
}

/**
 *
 */
function getBasemap() {
    style = MAP.getStyle();
    return STYLE_NAMES[style.name];
 }

/**
 * Return lat/lng as string in prescribed coordinate format.
 */
function formatCoords(lngLat, coordinate_format) {
    if (coordinate_format != null) {
        format = coordinate_format;
    } else {
        format = SETTINGS.coordinate_format;
    }
    switch (format) {
        case 'ddm':
            return formatCoordsDdm(lngLat);
        case 'dd':
            return formatCoordsDd(lngLat);
        case 'dms':
        default:
            return formatCoordsDms(lngLat);
    }
}

/**
 * Return lat/lng as Degrees Minutes Seconds (DMS) string.
 */
function formatCoordsDms(lngLat, precision) {
    // Default precision
    precision = (typeof precision !== 'undefined') ?  precision : 0;

    var ns = lngLat.lat < 0 ? 'S' : 'N';
    var ew = lngLat.lng < 0 ? 'W' : 'E';

    lat_dd = Math.abs(lngLat.lat);
    lng_dd = Math.abs(lngLat.lng);

    var lat_d = parseInt(lat_dd);
    var lat_m = parseInt(60 * (lat_dd - lat_d));
    var lat_s = ((lat_dd - lat_d - (lat_m / 60)) * 3600).toFixed(precision);

    var lng_d = parseInt(lng_dd);
    var lng_m = parseInt(60 * (lng_dd - lng_d));
    var lng_s = ((lng_dd - lng_d - (lng_m / 60)) * 3600).toFixed(precision);;

    coordsStr = lat_d + '° ' + lat_m + '\' ' + lat_s + '" ' + ns + ', ' + lng_d + '° ' + lng_m + '\' ' + lng_s + '" ' + ew;

    return coordsStr;
}

/**
 * Return lat/lng as Degrees Decimal Minutes (DDM) string.
 */
function formatCoordsDdm(lngLat, precision) {
    // Default precision
    precision = (typeof precision !== 'undefined') ?  precision : 2;

    var ns = lngLat.lat < 0 ? 'S' : 'N';
    var ew = lngLat.lng < 0 ? 'W' : 'E';

    var lat_dd = Math.abs(lngLat.lat);
    var lng_dd = Math.abs(lngLat.lng);

    var lat_d = parseInt(lat_dd);
    var lat_m = (60 * (lat_dd - lat_d)).toFixed(precision);

    var lng_d = parseInt(lng_dd);
    var lng_m = (60 * (lng_dd - lng_d)).toFixed(precision);

    coordsStr = lat_d + '° ' + lat_m + '\' ' + ns + ', ' + lng_d + '° ' + lng_m + '\' ' + ew;

    return coordsStr;
}

/**
 * Return lat/lng as Decimal Degrees (DD) string.
 */
function formatCoordsDd(lngLat, precision) {
    // Default precision
    precision = (typeof precision !== 'undefined') ?  precision : 4;

    coordsStr = lngLat.lat.toFixed(precision) + ', ' + lngLat.lng.toFixed(precision);
    return coordsStr;
}

/**
 * Shorten a string to a maximum character length, on a word/whitespace boundary.
 *
 * @param: {string} str
 * @param: {integer} maxLen
 * @param: {boolean} addEllipsis
 */
function shortenStr(str, maxLen, addEllipsis) {
    if (str.length <= maxLen) {
      return str;
    }
    var shortenedStr = str.substr(0, str.lastIndexOf(' ', maxLen));
    if (addEllipsis) {
        shortenedStr += '...';
    }
    return shortenedStr;
}

/**
 * Set query string parameters in window location.
 *
 * @param {URLSearchParams} urlParams
 * @param {Boolean} pushState: Whether to push the new URL onto the stack
 *        so that the back button can be used.
 */
function saveWindowURL(urlParams, pushState) {
    WINDOW_URL = decodeURIComponent(location.pathname + '?' + urlParams);
    WINDOW_URL_QUERYSTRING = urlParams.toString();
    if (pushState) {
        // Add this state to the window's history stack,
        // so the user can use the back button to get back to it.
        window.history.pushState(null, null, WINDOW_URL);
    } else {
        // Simply change the URL in the address bar,
        // not adding to the stack.
        window.history.replaceState(null, null, WINDOW_URL);
    }
}

/**
 * Set a bunch of query string parameters in window location.
 *
 * @param {object} params: 
 * @param {Boolean} reset: Whether to clear all existing parameters.
 * @param {Boolean} pushState: Whether to push the new URL onto the stack
 *        so that the back button can be used.
 */
function setWindowURLQueryStringParameters(params, reset, pushState) {
    var urlParams;
    if (reset) {
        urlParams = new URLSearchParams();
    } else {
        urlParams = new URLSearchParams(location.search);
    }

    $.each(params, function(index, value) {
        urlParams.set(index, value);
    });

    saveWindowURL(urlParams, pushState);
}
