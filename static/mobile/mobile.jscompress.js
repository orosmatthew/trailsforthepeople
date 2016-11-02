function disableClicksMomentarily(){disableClicks(),setTimeout(enableClicks,1500)}function disableClicks(){MAP&&(ENABLE_MAPCLICK=!1,MAP.dragging.removeHooks(),MAP.touchZoom.removeHooks())}function enableClicks(){MAP&&(ENABLE_MAPCLICK=!0,MAP.dragging.addHooks(),MAP.touchZoom.addHooks())}function switchToMap(a){$.mobile.changePage("#pane-map"),a&&setTimeout(a,1e3)}function updateNearYouNow(){for(var a=$("#alerts"),b=0,c=ALL_POIS.length;b<c;b++){var d=ALL_POIS[b],e=L.latLng(d.lat,d.lng);d.meters=LAST_KNOWN_LOCATION.distanceTo(e),d.miles=d.meters/1609.344,d.feet=3.2808399*d.meters,d.range=d.feet>900?d.miles.toFixed(1)+" mi":d.feet.toFixed(0)+" ft",d.bearing=LAST_KNOWN_LOCATION.bearingWordTo(e)}ALL_POIS.sort(function(a,b){return a.meters-b.meters});var f=ALL_POIS.slice(0,25);a.empty();for(var b=0,c=f.length;b<c;b++){var d=f[b],g=$("<li></li>").addClass("zoom").addClass("ui-li-has-count");g.attr("title",d.title),g.attr("category",d.categories),g.attr("type","poi").attr("gid",d.gid),g.attr("w",d.w).attr("s",d.s).attr("e",d.e).attr("n",d.n),g.attr("lat",d.lat).attr("lng",d.lng);var h=$("<div></div>").addClass("ui-btn-text");h.append($("<h2></h2>").text(d.title)),h.append($("<p></p>").text(d.categories)),h.append($("<span></span>").addClass("zoom_distance").addClass("ui-li-count").addClass("ui-btn-up-c").addClass("ui-btn-corner-all").text(d.range+" "+d.bearing)),g.tap(function(){zoomElementClick($(this))}),g.append(h),a.append(g)}a.listview("refresh")}function checkRadar(a,b,c){b=parseFloat(b);for(var d=[],e=0,f=ALL_POIS.length;e<f;e++){var g=ALL_POIS[e],h=a.distanceTo(L.latLng(g.lat,g.lng));if(!(h>b)){if(c){for(var i=g.categories.split("; "),j=!1,k=0,l=i.length;k<l;k++)for(var m=0,n=c.length;m<n;m++)if(c[m]==i[k]){j=!0;break}if(!j)continue}var o=h/1609.344,p=3.2808399*h,q=p>900?o.toFixed(1)+" mi":p.toFixed(0)+" ft";d[d.length]={gid:g.gid,title:g.title,range:q}}}for(var r=!1,e=0,f=d.length;e<f;e++){var s=parseInt(d[e].gid);if(LAST_BEEP_IDS.indexOf(s)==-1){r=!0;break}}LAST_BEEP_IDS=[];for(var e=0,f=d.length;e<f;e++){var s=parseInt(d[e].gid);LAST_BEEP_IDS[LAST_BEEP_IDS.length]=s}if(LAST_BEEP_IDS.sort(),r){document.getElementById("alert_beep").play();for(var t=[],e=0,f=d.length;e<f;e++)t[t.length]=d[e].title+", "+d[e].range;setTimeout(function(){alert(t.join("\n"))},1e3)}}function showPhoto(a){$("#photo").prop("src",a),$.mobile.changePage("#pane-photo")}function showElevation(a){$("#elevation").prop("src",a),$.mobile.changePage("#pane-elevationprofile")}function searchByKeyword(a){var b=strToLatLng(a);if(b)return MAP.setView(b,16),void placeTargetMarker(b.lat,b.lng);var c=$("#keyword_results");c.empty(),disableKeywordButton(),$("#pane-search .sortpicker").hide(),$.get("../ajax/keyword",{keyword:a,limit:100},function(b){if(enableKeywordButton(),$("#pane-search .sortpicker").show(),!b.length)return $("<li></li>").text("No Cleveland Metroparks results found. Trying an address search.").appendTo(c),void zoomToAddress(a);for(var d=0,e=b.length;d<e;d++){var f=b[d],g=$("<span></span>").addClass("ui-li-heading").text(f.name),h=$("<span></span>").addClass("ui-li-desc").text(f.description),i=$("<span></span>").addClass("zoom_distance").addClass("ui-li-count").addClass("ui-btn-up-c").addClass("ui-btn-corner-all").text("0 mi"),j=$("<div></div>").addClass("ui-btn-text").append(g).append(h).append(i),k=$("<li></li>").addClass("zoom").addClass("ui-li-has-count").append(j);k.attr("backbutton","#pane-browse"),k.attr("w",f.w),k.attr("s",f.s),k.attr("e",f.e),k.attr("n",f.n),k.attr("lat",f.lat),k.attr("lng",f.lng),k.attr("type",f.type),k.attr("gid",f.gid),k.attr("title",f.name),c.append(k),k.tap(function(){zoomElementClick($(this))})}c.listview("refresh"),sortLists(c)},"json")}function zoomElementClick(a){if(ENABLE_MAPCLICK){disableClicksMomentarily();var b=a.attr("type"),c=a.attr("gid");$("#show_on_map").data("zoomelement",a),$("#directions_target_lat").val(a.attr("lat")),$("#directions_target_lng").val(a.attr("lng")),$("#directions_target_type").val(a.attr("type")),$("#directions_target_gid").val(a.attr("gid")),$("#directions_target_title").text(a.attr("title")),$.mobile.changePage("#pane-info");var d=a.attr("backbutton");if(d||(d="#pane-browse"),$("#pane-info .ui-header .ui-btn-left").prop("href",d),$("#getdirections_disabled").hide(),$("#getdirections_enabled").show(),$("#show_on_map").data("wkt",null),$("#info-content").text("Loading..."),b&&c){var e={};e.type=b,e.gid=c,e.lat=LAST_KNOWN_LOCATION.lat,e.lng=LAST_KNOWN_LOCATION.lng,$.get("../ajax/moreinfo",e,function(a){$("#info-content").html(a);var b=$("#info-content").find("div.wkt");b&&($("#show_on_map").data("wkt",b.text()),b.remove()),SKIP_TO_DIRECTIONS&&($("#directions_car").click(),SKIP_TO_DIRECTIONS=!1)},"html")}else $("#info-content").html($("<h1></h1>").text(a.attr("title"))),$("#directions_car").click()}}function filterLoops(){$("#loops_list li").show();var a={};a.filter_type=$("#loops_filter_type").val(),a.filter_paved=$("#loops_filter_paved").val(),a.minseconds=60*parseInt($("#loops_filter_duration_min").val()),a.maxseconds=60*parseInt($("#loops_filter_duration_max").val()),a.minfeet=5280*parseInt($("#loops_filter_distance_min").val()),a.maxfeet=5280*parseInt($("#loops_filter_distance_max").val()),a.reservation=$("#loops_filter_reservation").val();var b=$("#loops_filter_button");b.button("disable"),b.closest(".ui-btn").find(".ui-btn-text").text(b.attr("value0")),$.get("../ajax/search_loops",a,function(a){b.button("enable"),b.closest(".ui-btn").find(".ui-btn-text").text(b.attr("value1"));var c=$("#loops_list");if(c.empty(),!a||!a.length)return alert("No matches found.");for(var d=0,e=a.length;d<e;d++){var f=a[d],g=$("<li></li>").addClass("zoom").addClass("ui-li-has-count");g.attr("backbutton","#pane-loops-search"),g.attr("type","loop"),g.attr("title",f.title),g.attr("gid",f.gid),g.attr("w",f.w),g.attr("s",f.s),g.attr("e",f.e),g.attr("n",f.n),g.attr("lat",f.lat),g.attr("lng",f.lng);var h=$("<div></div>").addClass("ui-btn-text");h.append($("<span></span>").addClass("ui-li-heading").text(f.title)),h.append($("<span></span>").addClass("ui-li-desc").html(f.distance+" &nbsp;&nbsp; "+f.duration)),h.append($("<span></span>").addClass("zoom_distance").addClass("ui-li-count").addClass("ui-btn-up-c").addClass("ui-btn-corner-all").text("0 mi")),g.append(h),c.append(g),g.tap(function(){zoomElementClick($(this))})}$("#pane-loops-search .sortpicker").show(),c.listview("refresh"),sortLists(c)},"json")}function sortLists(a){if(a||(a=$(":jqmData(role='page'):visible ul.distance_sortable").eq(0),a.length))switch(a.find(".zoom_distance").each(function(){var a=$(this).parent().parent(),b=L.latLng(a.attr("lat"),a.attr("lng")),c=LAST_KNOWN_LOCATION.distanceTo(b),d=LAST_KNOWN_LOCATION.bearingWordTo(b),e=c/1609.344,f=3.2808399*c,g=f>900?e.toFixed(1)+" mi":f.toFixed(0)+" ft";g+=" "+d,$(this).text(g),a.data("meters",c)}),DEFAULT_SORT){case"distance":a.children("li").sort(function(a,b){return $(a).data("meters")>$(b).data("meters")?1:-1});break;case"alphabetical":a.children("li").sort(function(a,b){return $(a).attr("title")>$(b).attr("title")?1:-1})}}function is_ios(){return/(iPad|iPhone|iPod)/g.test(navigator.userAgent)}function toggleGPS(){AUTO_CENTER_ON_LOCATION?toggleGPSOff():toggleGPSOn()}function toggleGPSOn(){AUTO_CENTER_ON_LOCATION=!0;var a=is_ios()?"/static/mobile/mapbutton_gps_ios_on.png":"/static/mobile/mapbutton_gps_on.png";$("#mapbutton_gps img").prop("src",a)}function toggleGPSOff(){AUTO_CENTER_ON_LOCATION=!1;var a=is_ios()?"/static/mobile/mapbutton_gps_ios_off.png":"/static/mobile/mapbutton_gps_off.png";$("#mapbutton_gps img").prop("src",a)}var LAST_BEEP_IDS=[],ALL_POIS=[],MOBILE=!0,LAST_KNOWN_LOCATION=L.latLng(41.3953,-81.673),AUTO_CENTER_ON_LOCATION=!1,DEFAULT_SORT="distance";$(window).bind("orientationchange pageshow resize",function(){var a=$(":jqmData(role='page'):visible"),b=$(":jqmData(role='header'):visible"),c=($(":jqmData(role='c=ontent'):visible"),$(window).height()),d=c-b.outerHeight();a.height(d+1),$(":jqmData(role='content')").first().height(d),$("#map_canvas").is(":visible")&&($("#map_canvas").height(d),MAP&&MAP.invalidateSize())}),$(document).bind("pagebeforechange",function(a,b){disableClicksMomentarily()}),$(document).ready(function(){$(".sidebar-pane-link").click(function(){link=$(this).attr("href"),"#"==link.charAt(0)&&(pane=link.substr(1)),sidebar.open(pane)}),$("#pane-browse li a").click(function(){}),$('.sidebar-tabs li a[href="#pane-radar"]').click(function(){updateNearYouNow()}),$("#pane-browse-pois-activity li a").click(function(){var a=this.hash.replace(/.*category=/,"");sidebar.open("pane-browse-results");var b=$("ul#browse_results");b.empty();var c="#pane-browse";0==a.indexOf("pois_usetype_")&&(c="#pane-browse-pois-activity"),0==a.indexOf("pois_reservation_")&&(c="#pane-browse-pois-reservation"),0==a.indexOf("loops_res_")&&(c="#pane-browse-loops-byres"),$("#pane-browse-results .sidebar-back").prop("href",c);var d=c;a&&(d="#browse-items?category="+a),$.get("../ajax/browse_items",{category:a},function(a){var c=$("#pane-browse-results h1.sidebar-header .title-text");c.text(a.title);for(var e=0,f=a.results.length;e<f;e++){var g=a.results[e],h=$("<li></li>").addClass("zoom");h.attr("title",g.name),h.attr("gid",g.gid).attr("type",g.type).attr("w",g.w).attr("s",g.s).attr("e",g.e).attr("n",g.n).attr("lat",g.lat).attr("lng",g.lng),h.attr("backbutton",d);var i=$("<div></div>").addClass("ui-btn-text");i.append($("<span></span>").addClass("ui-li-heading").text(g.name)),g.note&&i.append($("<span></span>").addClass("ui-li-desc").html(g.note)),i.append($("<span></span>").addClass("zoom_distance").addClass("ui-li-count").addClass("ui-btn-up-c").addClass("ui-btn-corner-all").text("0 mi")),h.tap(function(){zoomElementClick($(this))}),h.append(i),b.append(h)}b.listview("refresh"),sortLists(b)},"json")}),$('.sidebar-tabs a[href="#pane-share"]').click(function(){populateShareBox()}),$("#share_facebook").tap(function(){var a=$("#share_url").val()||$("#share_url").text();return a="http://www.facebook.com/share.php?u="+encodeURIComponent(a),$("#share_facebook").prop("href",a),!0}),$("#share_twitter").tap(function(){var a=$("#share_url").val()||$("#share_url").text();return a="http://twitter.com/home?status="+encodeURIComponent(a),$("#share_twitter").prop("href",a),!0})}),$(document).bind("pagechange",function(a,b){sortLists()}),$(window).load(function(){URL_PARAMS=$.url(),MIN_ZOOM=10,initMap();var a=cookieGet("show_welcome");if(URL_PARAMS.attr("query")&&(a=!1),URL_PARAMS.attr("fragment")&&(a=!1),a&&$.mobile.changePage("#pane-welcome"),MAP.on("locationfound",function(a){if(LAST_KNOWN_LOCATION=a.latlng,placeGPSMarker(a.latlng.lat,a.latlng.lng),AUTO_CENTER_ON_LOCATION){var b=MAX_BOUNDS.contains(a.latlng);b?(MAP.panTo(a.latlng),MAP.getZoom()<12&&MAP.setZoom(16)):MAP.fitBounds(MAX_BOUNDS)}if(sortLists(),updateNearYouNow(),$("#radar_enabled").is(":checked")){var c=$("#radar_radius").val(),d=[];$('input[name="radar_category"]:checked').each(function(){d[d.length]=$(this).val()}),placeCircle(a.latlng.lat,a.latlng.lng,c),checkRadar(a.latlng,c,d)}console.log("here");var e=a.latlng.lat,f=a.latlng.lng,g=e<0?"S":"N",h=f<0?"W":"E",i=Math.abs(parseInt(e)),j=Math.abs(parseInt(f)),k=(60*(Math.abs(e)-Math.abs(parseInt(e)))).toFixed(3),l=(60*(Math.abs(f)-Math.abs(parseInt(f)))).toFixed(3),m=g+" "+i+" "+k+" "+h+" "+j+" "+l;$("#gps_location").text(m)}),!URL_PARAMS.attr("query")){AUTO_CENTER_ON_LOCATION=!0;var b=function(a){AUTO_CENTER_ON_LOCATION=!1,MAP.off("locationfound",b)};MAP.on("locationfound",b)}MAP.locate({watch:!0,enableHighAccuracy:!0})}),$(window).load(function(){$("div.sortpicker span").tap(function(){DEFAULT_SORT=$(this).attr("value"),sortLists()})}),$(window).load(function(){$("#browse_keyword_button").tap(function(){$.mobile.changePage("#pane-search"),$("#search_keyword").val($("#browse_keyword").val()),$("#search_keyword_button").tap()}),$("#browse_keyword").keydown(function(a){13==a.keyCode&&$("#browse_keyword_button").tap()}),$("#search_keyword_button").tap(function(){var a=$("#search_keyword").val();searchByKeyword(a)}),$("#search_keyword").keydown(function(a){13==a.keyCode&&$("#search_keyword_button").tap()})}),$(window).load(function(){$.get("../ajax/load_pois",{},function(a){for(var b=0,c=a.length;b<c;b++)ALL_POIS[ALL_POIS.length]=a[b];updateNearYouNow()},"json")}),$(window).load(function(){$("#radar_enabled").change(function(){var a=$(this).is(":checked");a?$("#radar_config").show():$("#radar_config").hide(),a||($("#alerts li").slice(0,25).show(),$("#alerts li").slice(25).hide(),clearCircle())})}),$(window).load(function(){$.get("../ajax/autocomplete_keywords",{},function(a){$("#browse_keyword").autocomplete({target:$("#browse_keyword_autocomplete"),source:a,callback:function(a){var b=$(a.currentTarget);$("#browse_keyword").val(b.text()),$("#browse_keyword").autocomplete("clear"),$("#browse_keyword_button").click()},minLength:3,matchFromStart:!1}),$("#search_keyword").autocomplete({target:$("#search_keyword_autocomplete"),source:a,callback:function(a){var b=$(a.currentTarget);$("#search_keyword").val(b.text()),$("#search_keyword").autocomplete("clear"),$("#search_keyword_button").click()},minLength:3,matchFromStart:!1})},"json")}),$(window).load(function(){$("#directions_hike").tap(function(){$("#directions_via").val("hike"),$("#directions_via").trigger("change"),$("#pane-getdirections").page(),$("#directions_via").selectmenu("refresh"),$.mobile.changePage("#pane-getdirections")}),$("#directions_bike").tap(function(){$("#directions_via").val("bike"),$("#directions_via").trigger("change"),$("#pane-getdirections").page(),$("#directions_via").selectmenu("refresh"),$.mobile.changePage("#pane-getdirections")}),$("#directions_bridle").tap(function(){$("#directions_via").val("bridle"),$("#directions_via").trigger("change"),$("#pane-getdirections").page(),$("#directions_via").selectmenu("refresh"),$.mobile.changePage("#pane-getdirections")}),$("#directions_car").tap(function(){$("#directions_via").val("car"),$("#directions_via").trigger("change"),$("#pane-getdirections").page(),$("#directions_via").selectmenu("refresh"),$.mobile.changePage("#pane-getdirections")}),$("#directions_bus").tap(function(){$("#directions_via").val("bus"),$("#directions_via").trigger("change"),$("#pane-getdirections").page(),$("#directions_via").selectmenu("refresh"),$.mobile.changePage("#pane-getdirections")}),$("#directions_type").change(function(){var a=$(this).val(),b=$("#directions_type_geocode_wrap");"gps"==a?b.hide():b.show()}),$("#directions_reverse").change(function(){var a="to"==$(this).val()?"from":"to";$("#directions_type option").each(function(){var b=$(this).text();b=a+" "+b.replace(/^to /,"").replace(/^from /,""),$(this).text(b)}),$("#directions_type").selectmenu("refresh",!0)}),$("#directions_button").tap(function(){$("#directions_steps").empty(),processGetDirectionsForm()}),$("#directions_address").keydown(function(a){13==a.keyCode&&$("#directions_button").tap()}),$("#change_directions_target2").tap(function(){$.mobile.changePage("#pane-browse"),SKIP_TO_DIRECTIONS=!0})}),$(window).load(function(){toggleGPSOff()}),$(window).load(function(){$("#pane-loops-search").page(),$("#loops_typeicons img").tap(function(){var a=$(this),b=a.attr("data-value");$("#loops_filter_type").val(b).trigger("change"),$("#loops_typeicons img").each(function(){var b=$(this).prop("src");b=$(this).is(a)?b.replace("_off.png","_on.png"):b.replace("_on.png","_off.png"),$(this).prop("src",b)})}).first().tap(),$("#loops_filter_distancepicker img").tap(function(){var a=$(this),b=a.attr("data-min"),c=a.attr("data-max");$("#loops_filter_distance_min").val(b),$("#loops_filter_distance_max").val(c),$("#loops_filter_distancepicker img").each(function(){var b=$(this).prop("src");b=$(this).is(a)?b.replace("_off.png","_on.png"):b.replace("_on.png","_off.png"),$(this).prop("src",b)}),filterLoops()}).first().tap(),$("#loops_filter_distance_min").change(),$("#loops_filter_distance_max").change(),$("#loops_filter_duration_min").change(),$("#loops_filter_duration_max").change(),$("#loops_filter_button").tap(filterLoops),$("#loops_filter_type").change(function(){var a=$(this).val();switch(a){case"hike":$(".time_estimate").hide(),$(".time_hike").show(),$(".time_estimate_prefix").hide();break;case"bridle":$(".time_estimate").hide(),$(".time_bridle").show(),$(".time_estimate_prefix").hide();break;case"bike":$(".time_estimate").hide(),$(".time_bike").show(),$(".time_estimate_prefix").hide();break;case"bike_Novice":$(".time_estimate").hide(),$(".time_bike").show(),$(".time_estimate_prefix").hide();break;case"bike_Beginner":$(".time_estimate").hide(),$(".time_bike").show(),$(".time_estimate_prefix").hide();break;case"bike_Intermediate":$(".time_estimate").hide(),$(".time_bike").show(),$(".time_estimate_prefix").hide();break;case"bike_Advanced":$(".time_estimate").hide(),$(".time_bike").show(),$(".time_estimate_prefix").hide();break;case"mountainbike":$(".time_estimate").hide(),$(".time_bike").show(),$(".time_estimate_prefix").hide();break;case"exercise":$(".time_estimate").hide(),$(".time_hike").show(),$(".time_estimate_prefix").hide();break;default:$(".time_estimate").show(),$(".time_estimate_prefix").show()}filterLoops()})});