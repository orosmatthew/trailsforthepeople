var TRAILVIEWER = null;

// Marker that indicates TrailView location on map
var currentTrailViewMarker = null;
// Current TrailView location in {'lat', 'lon'}
var currTrailViewGeo = null;
// If Mouse is over a dot (used for changing cursor style)
var isMouseOnTrailViewLayer = false;
// TrailView base image metadata (fetched on page load)
var trailViewData = null;
// If TrailView is in mobile/split view
var isMobileView = false;
// If TrailView is enabled
var isTrailViewEnabled = false;
// Whether the map or viewer is fullscreen
//     Values can be 'map', 'viewer', or null
var fullscreenElement = 'map';
// Intervals for updating current TrailView marker rotation
//     and nav arrow rotation
var updateMarkerRotationInterval = null;
var updateNavArrowsInterval = null;
// The current TrailViewer hotspots (used for updating nav arrows)
var currentHotspots;

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

/**
 * Updates TrailViewer and map layer after changes
 * regarding map state and whether it is enabled
 */
function updateTrailView() {
    if ($('#trailview_checkbox').is(':checked')) {
        if (!MAP.getLayer('dots')) {
            createTrailViewMapLayer(trailViewData);
        } else {
            MAP.addLayer('dots');
        }
        if (!TRAILVIEWER) {
            createTrailViewer();
        }
        isTrailViewEnabled = true;
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
        $('.new_nav').remove();
        destroyTrailViewer();
        isTrailViewEnabled = false;
    }
}

/**
 * Creates TrailViewer
 */
function createTrailViewer() {
    if (!TRAILVIEWER) {
        TRAILVIEWER = new TrailViewer({
            'useURLHashing': false, 
            'onGeoChangeFunc': onGeoChange,
            'onInitDoneFunc': onInitDone,
            'onArrowsAddedFunc': populateArrows,
            'navArrowMinAngle': -25,
            'navArrowMaxAngle': -20,
        }, 
        null, trailViewData, MAP.getCenter().lat, MAP.getCenter().lng);
        $('#viewer_container').stop().fadeIn(500);
    }
}

/**
 * Destroys TrailViewer
 */
function destroyTrailViewer() {
    if (TRAILVIEWER) {
        TRAILVIEWER.destroy();
        TRAILVIEWER = null;
    }
    $('#viewer_container').stop().fadeOut(500);
}

/**
 * Register event listener for window resizing
 */
window.addEventListener('resize', onWindowResize);

/**
 * Calls resize on map and TrailViewer
 */
function resizeElements() {
    if (TRAILVIEWER && TRAILVIEWER._panViewer) {
        TRAILVIEWER._panViewer.resize();
    }
    if (MAP) {
        MAP.resize();
    }
}

/**
 * Updates map and TrailViewer containers on fullscreen or mobile changes
 */
function updateContainers() {
    if (isTrailViewEnabled) {
        $('#map_fullscreen_btn').show();
        if (fullscreenElement == 'map') {
            TRAILVIEWER._panViewer.setHfov(120, 500);
            $('#sidebar').show();
            $('#map_container').show();
            $('#map_container').removeClass().addClass('full-container');
            if (isMobileView) {
                $('#viewer_container').hide();
            } else {
                $('#viewer_container').show().removeClass().addClass('small-container');
                populateArrows(currentHotspots);
                $('#map_fullscreen_btn').hide();
            }
            $('#viewer_fullscreen_btn').show();
        } else if (fullscreenElement == 'viewer') {
            if (isMobileView) {
                TRAILVIEWER._panViewer.setHfov(90, 500);
                $('#sidebar').hide();
                $('#map_container').hide();
            } else {
                TRAILVIEWER._panViewer.setHfov(120, 500);
                $('#map_container').show().removeClass().addClass('small-container');
                $('#viewer_fullscreen_btn').hide();
            }
            $('#map_fullscreen_btn').show();
            $('#viewer_container').show().removeClass().addClass('full-container');
            populateArrows(currentHotspots);
        } else {
            $('#viewer_fullscreen_btn').show();
            $('#map_fullscreen_btn').show();
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

/**
 * Called when window is resized
 */
function onWindowResize() {
    if (!isMobileView && window.innerWidth < 1024) {
        isMobileView = true;
        fullscreenElement = null;
        updateContainers();
    } else if (isMobileView && window.innerWidth >= 1024) {
        isMobileView = false;
        fullscreenElement = 'map';
        updateContainers();
    }
}



/**
 * Called when data has been fetched and 
 * then initializes viewer and map
 */
 function initTrailView() {

    onWindowResize();

    $('#trailview_checkbox').on('change', () => {
        updateTrailView();
        if (isTrailViewEnabled) {
            if (isMobileView == true) {
                fullscreenElement = null;
            } else {
                fullscreenElement = 'map';
            }
        }
        updateContainers();
        $('#sidebar').show();
    });

    $('#viewer_zoom_in_btn').on('click', () => {
        let currFov = TRAILVIEWER._panViewer.getHfov();
        TRAILVIEWER._panViewer.setHfov(currFov - 20, 200);
    });

    $('#viewer_zoom_out_btn').on('click', () => {
        let currFov = TRAILVIEWER._panViewer.getHfov();
        TRAILVIEWER._panViewer.setHfov(currFov + 20, 200);
    });

    $('#viewer_orient_btn').on('click', () => {
        if (TRAILVIEWER._panViewer) {
            if (TRAILVIEWER._panViewer.isOrientationActive()) {
                TRAILVIEWER._panViewer.stopOrientation();
                isViewerOrientationActive = false;
            } else {
                TRAILVIEWER._panViewer.startOrientation();
                isViewerOrientationActive = true;
            }
        }
    });

    // When fullscreen buttons are clicked
    $('#map_fullscreen_btn').on('click', () => {
        if (isMobileView) {
            if (fullscreenElement == 'map') {
                fullscreenElement = null;
            } else {
                fullscreenElement = 'map';
            }
        } else {
            if (fullscreenElement == 'map') {
                fullscreenElement = 'viewer';
            } else {
                fullscreenElement = 'map';
            }
        }
        updateContainers();
    });

    $('#viewer_fullscreen_btn').on('click', () => {
        if (isMobileView) {
            if (fullscreenElement == 'viewer') {
                fullscreenElement = null;
            } else {
                fullscreenElement = 'viewer';
            }
        } else {
            if (fullscreenElement == 'viewer') {
                fullscreenElement = 'map';
            } else {
                fullscreenElement = 'viewer';
            }
        }
        updateContainers();
    });

    // Handle when dots are clicked
    MAP.on('click', (e) => {
        if (TRAILVIEWER) {
            let minId = TRAILVIEWER.getNearestImageId(e.lngLat.lat, e.lngLat.lng, 10);
            if (minId != null) {
                if (isMobileView && fullscreenElement == 'map') {
                    fullscreenElement = null;
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

    $('#trailview_checkbox_container').show(500);
}

/**
 * Fetches base data for points
 */
 function fetchTrailViewData() {
    $.getJSON(TRAILVIEW_URL + '/api/images.php', {
        'type': 'standard'
        },
        function (data, textStatus, jqXHR) {
            trailViewData = data['imagesStandard'];
            initTrailView();

        }
    );
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

/**
 * Called when viewer initialization is done
 * @param {TrailViewer} viewer
 */
function onInitDone(viewer) {
    viewer._panViewer.resize();
    updateMarkerRotationInterval = setInterval(updateMarkerRotation, 16);
    updateNavArrowsInterval = setInterval(updateNavArrows, 16);
    if (viewer._panViewer.isOrientationSupported()) {
        $('#viewer_orient_btn').show(500);
    }
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
            if (fullscreenElement == 'viewer') {
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

/**
 * Populates navigation arrows
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
        if (fullscreenElement == 'viewer') {
            $('#nav_container').removeClass('nav_container-small').addClass('nav_container-full');
            $(link).addClass('new_nav-full');
        } else {
            $('#nav_container').removeClass('nav_container-full').addClass('nav_container-small');
            $(link).addClass('new_nav-small');
        }
        $(link).attr('src', '/static/images/trailview/nav_arrow.png');
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