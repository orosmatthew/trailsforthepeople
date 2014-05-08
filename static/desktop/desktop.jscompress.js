function highlightToolbarButton(e){var t=$("#toolbar img.button");t.each(function(){var e=$(this).prop("src");e=e.replace("_active_","_");$(this).prop("src",e)});if(e){var n=$('#toolbar img.button[target="'+e+'"]');var r=n.prop("src");r=r.replace("_","_active_");n.prop("src",r)}}function switchToMap(e){$(".dialog").dialog("close");if(e)setTimeout(e,100)}function showPhoto(e){$("#photo").prop("src",e);$("#gallery").dialog("open")}function hidePhoto(){$("#gallery").dialog("close")}function showElevation(e){$("#elevation").prop("src",e);$("#elevationprofile").dialog("open")}function searchByKeyword(e){var t=strToLatLng(e);if(t){MAP.setView(t,16);placeTargetMarker(t.lat,t.lng);return}var n=$("#keyword_results");n.empty();var r=$("<span></span>").addClass("ui-li-heading").text(" Address search");var i=$("<span></span>").addClass("ui-li-desc").text("search as an address or landmark");var s=$("<li></li>").css({cursor:"pointer"}).append(r).append(i);n.append(s);s.data("address",e);s.click(function(){zoomToAddress($(this).data("address"))});disableKeywordButton();$.get("../ajax/keyword",{keyword:e,limit:100},function(e){enableKeywordButton();if(!e.length){$("<li></li>").text("No Cleveland Metroparks results found.").appendTo(n);return}for(var t=0,r=e.length;t<r;t++){var i=e[t];var s=$("<span></span>").addClass("ui-li-heading").text(i.name);var o=$("<span></span>").addClass("ui-li-desc").text(i.description);var u=$("<li></li>").addClass("zoom").append(s).append(o);u.attr("w",i.w);u.attr("s",i.s);u.attr("e",i.e);u.attr("n",i.n);u.attr("lat",i.lat);u.attr("lng",i.lng);u.attr("type",i.type);u.attr("gid",i.gid);u.attr("title",i.name);n.append(u);u.data("sort",i.name);u.click(function(){zoomElementClick($(this))})}n.children("li").sort(function(e,t){return $(e).data("sort")-$(t).data("sort")})},"json")}function zoomElementClick(e){var t=e.attr("type");var n=e.attr("gid");$(".dialog").dialog("close");$("#info").dialog("open");$("#show_on_map").data("zoomelement",e);$("#directions_target_lat").val(e.attr("lat"));$("#directions_target_lng").val(e.attr("lng"));$("#directions_target_type").val(e.attr("type"));$("#directions_target_gid").val(e.attr("gid"));$("#directions_target_title").text(e.attr("title"));$("#getdirections_disabled").hide();$("#getdirections_enabled").show();$("#show_on_map").data("wkt",null);$("#info-content").text("Loading...");if(t&&n){var r={};r.type=t;r.gid=n;$.get("../ajax/moreinfo",r,function(e){$("#info-content").html(e);var t=$("#info-content").find("div.wkt");if(t){$("#show_on_map").data("wkt",t.text());t.remove()}if(SKIP_TO_DIRECTIONS){$("#directions_car").click();SKIP_TO_DIRECTIONS=false}},"html")}else{$("#info-content").html($("<h1></h1>").text(e.attr("title")));$("#directions_car").click()}}function filterLoops(){$("#loops_list li").show();var e=$("#loops_filter_type").val();var t=$("#loops_filter_paved").val();var n=60*parseFloat($("#loops_filter_time_slider").slider("values",0));var r=60*parseFloat($("#loops_filter_time_slider").slider("values",1));var i=5280*parseFloat($("#loops_filter_distance_slider").slider("values",0));var s=5280*parseFloat($("#loops_filter_distance_slider").slider("values",1));var o=$("#loops_filter_reservation").val();var u=0;$("#loops_list li").each(function(){var a=$(this).attr("hike")=="Yes";var f=$(this).attr("bike")=="Yes";var l=$(this).attr("bridle")=="Yes";var c=$(this).attr("exercise")=="Yes";var h=$(this).attr("mountainbike")=="Yes";var p=$(this).attr("paved");var d=$(this).attr("difficulty");var v=$(this).attr("length_feet");var m=$(this).attr("duration_hike");var g=$(this).attr("duration_bike");var y=$(this).attr("duration_bridle");var b=0;var w=true;if(w){if(o&&-1==$.inArray(o,$(this).data("reservations")))w=false}if(w){if(t&&t!=p)w=false}if(w){if(e){switch(e){case"hike":if(!a)w=false;b=m;break;case"bridle":if(!l)w=false;b=y;break;case"bike":if(!f)w=false;b=g;break;case"bike_Novice":if(!f)w=false;if(d!="Novice")w=false;b=g;break;case"bike_Beginner":if(!f)w=false;if(d!="Novice"&&d!="Beginner")w=false;b=g;break;case"bike_Intermediate":if(!f)w=false;if(d!="Novice"&&d!="Beginner"&&d!="Intermediate")w=false;b=g;break;case"bike_Advanced":if(!f)w=false;b=g;break;case"mountainbike":if(!h)w=false;b=g;break;case"exercise":if(!c)w=false;b=m;break;default:w=false;break}}}if(w){if(b){if(b<n||b>r)w=false}}if(w){if(v<i||v>s){w=false}}if(w){u++}else{$(this).hide()}});if(u){$("#loops_nomatches").hide()}else{$("#loops_nomatches").show()}}function stopMeasure(){MARKER_FROM.setLatLng(L.latLng(0,0));MARKER_TO.setLatLng(L.latLng(0,0));MAP.removeLayer(MARKER_FROM);MAP.removeLayer(MARKER_TO);MARKER_FROM.dragging.disable();MARKER_TO.dragging.disable();clearDirectionsLine();$("#measure_steps").empty()}function startMeasure(){if(MARKER_FROM.getLatLng().lat&&MARKER_TO.getLatLng().lat)return;var e=MAP.getBounds().getSouthWest();var t=MAP.getBounds().getNorthEast();var n=(e.lat+t.lat)/2;var r=(t.lng-e.lng)*.25;var i=L.latLng(n,e.lng+r);var s=L.latLng(n,t.lng-r);MARKER_FROM.setLatLng(i).addTo(MAP);MARKER_TO.setLatLng(s).addTo(MAP);MARKER_FROM.dragging.enable();MARKER_TO.dragging.enable()}function performMeasure(e,t,n){var r=$("#measure_steps");r.empty();var i=$("#measure_button");i.prop("disabled",true);i.val(i.attr("value0"));var s={sourcelat:e.lat,sourcelng:e.lng,targetlat:t.lat,targetlng:t.lng,tofrom:"to",via:n};$.get("../ajax/directions",s,function(e){i.prop("disabled",false);i.val(i.attr("value1"));if(!e||!e.wkt){var t="Could not find directions.";if(n!="hike")t+="\nTry a different type of trail, terrain, or difficulty.";return alert(t)}renderDirectionsStructure(e,r,{noshare:true})},"json")}var MOBILE=false;var LAST_KNOWN_LOCATION=L.latLng(0,0);var EMBED_DIALOG_WIDTH=550;var EMBED_DIALOG_HEIGHT=475;$(window).load(function(){URL_PARAMS=$.url();if(URL_PARAMS.param("embed"))MIN_ZOOM-=1;if(URL_PARAMS.param("embed"))$("#toolbar img.logo").hide();if(!URL_PARAMS.param("embed"))$("#button_fullscreen").hide();if(!URL_PARAMS.param("measure"))$("#button_measure").hide();initMap()});$(window).load(function(){$(".button").click(function(){var e=$("#"+$(this).attr("target"));if(!e.length)return;if(!e.dialog("option","modal"))$(".dialog").dialog("close");e.dialog("open")});$("#welcome").dialog({modal:true,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:450,height:400,title:"Welcome",buttons:{Close:function(){$(this).dialog("close")}}});$("#share").dialog({modal:true,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:700,height:140,title:"Share your map",buttons:{Close:function(){$(this).dialog("close")}},open:function(){populateShareBox()}});$("#geocode").dialog({modal:false,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:420,height:150,title:"Zoom to an address or landmark",buttons:{Back:function(){$("#button_find").click()}},open:function(){highlightToolbarButton("directions")},close:function(){highlightToolbarButton(null)}});$("#browse").dialog({modal:false,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:550,height:550,title:"Find",buttons:{Close:function(){$(this).dialog("close")}},open:function(){highlightToolbarButton("browse")},close:function(){highlightToolbarButton(null)}});$("#search").dialog({modal:false,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:550,height:425,title:"Search by Keyword",buttons:{Back:function(){$("#button_find").click()}},open:function(){highlightToolbarButton("browse")},close:function(){highlightToolbarButton(null)}});$("#gallery").dialog({modal:true,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:825,height:575,title:"Photo",buttons:{Close:function(){$(this).dialog("close")}},open:function(){highlightToolbarButton("browse")},close:function(){highlightToolbarButton(null)}});$("#elevationprofile").dialog({modal:true,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:500,height:325,title:"Elevation Profile",buttons:{Close:function(){$(this).dialog("close")}},open:function(){highlightToolbarButton("browse")},close:function(){highlightToolbarButton(null)}});$("#settings").dialog({modal:false,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:500,height:500,title:"Map Layers & Features",buttons:{Close:function(){$(this).dialog("close")}},open:function(){highlightToolbarButton("settings")},close:function(){highlightToolbarButton(null)}});$("#info").dialog({modal:false,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:650,height:600,title:"Details",buttons:{Back:function(){$("#button_find").click()}},open:function(){highlightToolbarButton("browse")},close:function(){highlightToolbarButton(null)}});$("#getdirections").dialog({modal:false,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:500,height:500,title:"Get Directions",buttons:{Back:function(){$("#button_find").click()}},open:function(){highlightToolbarButton("directions")},close:function(){highlightToolbarButton(null)}});$("#loops").dialog({modal:false,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:550,height:500,title:"Featured Hikes and Routes",buttons:{Back:function(){$("#button_find").click()}},open:function(){highlightToolbarButton("browse")},close:function(){highlightToolbarButton(null)}});$("#loops_button").click(function(){$(".dialog").dialog("close");$("#loops").dialog("open")});$("#trailfinder").dialog({modal:false,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:550,height:500,title:"Trail Finder",buttons:{Back:function(){$("#button_find").click()}},open:function(){highlightToolbarButton("browse")},close:function(){highlightToolbarButton(null)}});$("#trailfinder_button").click(function(){$(".dialog").dialog("close");$("#trailfinder").dialog("open")});$("#print").dialog({modal:false,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:525,height:350,title:"Print",buttons:{Print:function(){printMap()},Close:function(){$(this).dialog("close")}},open:function(){highlightToolbarButton("print");$("#print_ready").hide();$("#print_waiting").hide()},close:function(){highlightToolbarButton(null)}});$("#measure").dialog({modal:false,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:575,height:450,title:"Measure distance between two points",buttons:{Close:function(){$(this).dialog("close")}},open:function(){highlightToolbarButton("measure");startMeasure()},close:function(){highlightToolbarButton(null)}});$("#credits").dialog({modal:false,closeOnEscape:true,resizable:true,autoOpen:false,zIndex:1e3,width:550,height:375,title:"About this app",buttons:{Close:function(){$(this).dialog("close")}}});if(URL_PARAMS.param("embed")){$(".dialog").each(function(){var e=$(this).dialog("option","width");var t=$(this).dialog("option","height");if(e>EMBED_DIALOG_WIDTH){$(this).dialog("option","width",EMBED_DIALOG_WIDTH)}if(t>EMBED_DIALOG_HEIGHT){$(this).dialog("option","height",EMBED_DIALOG_HEIGHT)}})}var e=cookieGet("show_welcome");if(URL_PARAMS.param("embed"))e=false;if(e)$("#welcome").dialog("open")});$(window).load(function(){function e(){$(this).parent().siblings("li").children("ul").hide();var e=$(this).siblings("ul");if(e.is(":visible")){e.hide();e.removeClass("expanded")}else{e.show();e.addClass("expanded")}}var t={Archery:"archery.png",Beach:"beach.png",Boating:"boat.png","Drinking Fountain":"drinkingfountain.png","Exploring Culture & History":"history.png","Exploring Nature":"nature.png",Facilities:"reservable.png","Fishing & Ice Fishing":"fish.png",Food:"food.png","Geologic Feature":"geology.png",Golfing:"golf.png","Horseback Riding":"horse.png",Kayaking:"kayak.png",Picnicking:"picnic.png","Play Areas":"play.png",Restroom:"restroom.png","Sledding & Tobogganing":"sled.png",Swimming:"swim.png","Viewing Wildlife":"wildlife.png"};$.get("../desktop/fetch_activitypois",{},function(n){var r=$("#activitypois");for(var i in n){var s=$("<li></li>").appendTo(r);var o="/static/wms/pois/"+t[i];var u=$("<img></img>").prop("src",o);$("<div></div>").addClass("head").text(i).prepend(u).appendTo(s).click(e);var a=$("<ul></ul>").appendTo(s).hide();var f=n[i];for(var l=0,c=f.length;l<c;l++){var h=$("<li></li>").appendTo(a).text(f[l].use_area).addClass("zoom");h.attr("type","poi");h.attr("title",f[l].use_area);h.attr("gid",f[l].gid);h.attr("lat",f[l].lat);h.attr("lng",f[l].lng);h.attr("w",f[l].boxw);h.attr("s",f[l].boxs);h.attr("e",f[l].boxe);h.attr("n",f[l].boxn);h.click(function(){zoomElementClick($(this))})}}},"json");$.get("../desktop/fetch_loops",{},function(e){var t=$("#loops_list");for(var n=0,r=e.length;n<r;n++){var i=e[n];for(var n=0,r=e.length;n<r;n++){var s=$("<li></li>").appendTo(t).addClass("zoom");s.attr("type","loop");s.attr("title",e[n].name);s.attr("gid",e[n].id);s.attr("lat",e[n].lat);s.attr("lng",e[n].lng);s.attr("w",e[n].boxw);s.attr("s",e[n].boxs);s.attr("e",e[n].boxe);s.attr("n",e[n].boxn);s.attr("hike",e[n].hike);s.attr("bike",e[n].bike);s.attr("bridle",e[n].bridle);s.attr("difficulty",e[n].difficulty);s.attr("length_feet",e[n].length_feet);s.attr("duration_hike",e[n].duration_hike);s.attr("duration_bike",e[n].duration_bike);s.attr("duration_bridle",e[n].duration_bridle);s.attr("paved",e[n].paved);s.data("reservations",e[n].reservations);$("<span></span>").addClass("ui-li-heading").text(e[n].name).appendTo(s);$("<span></span>").addClass("ui-li-desc").text("Length: "+e[n].distancetext).appendTo(s);$("<br></br>").appendTo(s);var o=$("<span></span>").addClass("ui-li-desc").addClass("time_estimate").addClass("time_hike").text(e[n].durationtext_hike).appendTo(s);var u=$("<span></span>").addClass("ui-li-desc").addClass("time_estimate").addClass("time_bike").text(e[n].durationtext_bike).appendTo(s);var a=$("<span></span>").addClass("ui-li-desc").addClass("time_estimate").addClass("time_bridle").text(e[n].durationtext_bridle).appendTo(s);$("<span></span>").addClass("time_estimate_prefix").text("Walking:").prependTo(o);$("<span></span>").addClass("time_estimate_prefix").text("Bicycling:").prependTo(u);$("<span></span>").addClass("time_estimate_prefix").text("Horseback:").prependTo(a);s.click(function(){zoomElementClick($(this))})}}},"json");$("#browse div.head").click(e);$("#browse ul").hide();$("#browse > ul").show();$("#browse_keyword_button").click(function(){$(".dialog").dialog("close");$("#search").dialog("open");$("#search_keyword").val($("#browse_keyword").val());$("#search_keyword_button").click()});$("#browse_keyword").keydown(function(e){if(e.keyCode==13)$("#browse_keyword_button").click()});$("#return_to_basic_search").click(function(){$(".dialog").dialog("close");$("#browse").dialog("open")});$("#search_keyword_button").click(function(){var e=$("#search_keyword").val();searchByKeyword(e)});$("#search_keyword").keydown(function(e){if(e.keyCode==13)$("#search_keyword_button").click()});$("#button_directions").click(function(){$(".dialog").dialog("close");$("#getdirections").dialog("open")})});$(window).load(function(){$("#directions_hike").click(function(){$("#directions_via").val("hike");$("#directions_via").trigger("change");$(".dialog").dialog("close");$("#getdirections").dialog("open")});$("#directions_bike").click(function(){$("#directions_via").val("bike");$("#directions_via").trigger("change");$(".dialog").dialog("close");$("#getdirections").dialog("open")});$("#directions_bridle").click(function(){$("#directions_via").val("bridle");$("#directions_via").trigger("change");$(".dialog").dialog("close");$("#getdirections").dialog("open")});$("#directions_car").click(function(){$("#directions_via").val("car");$("#directions_via").trigger("change");$(".dialog").dialog("close");$("#getdirections").dialog("open")});$("#directions_bus").click(function(){$("#directions_via").val("bus");$("#directions_via").trigger("change");$(".dialog").dialog("close");$("#getdirections").dialog("open")});$("#directions_type").click(function(){var e=$(this).val();var t=$("#directions_type_geocode_wrap");if(e=="gps")t.hide();else t.show()});$("#directions_reverse").change(function(){var e=$(this).val()=="to"?"from":"to";$("#directions_type option").each(function(){var t=$(this).text();t=e+" "+t.replace(/^to /,"").replace(/^from /,"");$(this).text(t)})});$("#directions_button").click(function(){$("#directions_steps").empty();processGetDirectionsForm()});$("#directions_address").keydown(function(e){if(e.keyCode==13)$("#directions_button").click()});$("#change_directions_target").click(function(){$('img[target="browse"]').click()});$("#change_directions_target2").click(function(){$('img[target="browse"]').click();SKIP_TO_DIRECTIONS=true})});$(window).load(function(){$.get("../ajax/autocomplete_keywords",{},function(e){$("#search_keyword").autocomplete({source:e,select:function(e,t){$("#search_keyword").val(t.item.value);$("#search_keyword_button").click()}});$("#browse_keyword").autocomplete({source:e,select:function(e,t){$("#browse_keyword").val(t.item.value);$("#browse_keyword_button").click()}})},"json")});$(window).load(function(){$("#loops_filter_distance_slider").slider({range:true,min:0,max:100,step:1,values:[0,100],slide:function(e,t){var n=t.values[0];var r=t.values[1];$("#loops_filter_distance_min").text(n);$("#loops_filter_distance_max").text(r)}});$("#loops_filter_time_slider").slider({range:true,min:0,max:300,step:15,values:[0,300],slide:function(e,t){var n=t.values[0];var r=t.values[1];var i=n+" minutes";var s=r+" minutes";if(n>=60)i=Math.floor(n/60)+" hours "+n%60+" minutes";if(r>=60)s=Math.floor(r/60)+" hours "+r%60+" minutes";$("#loops_filter_time_min").text(i);$("#loops_filter_time_max").text(s)}});$("#loops_filter_type").change(function(){var e=$(this).val();switch(e){case"hike":$(".time_estimate").hide();$(".time_hike").show();$(".time_estimate_prefix").hide();break;case"bridle":$(".time_estimate").hide();$(".time_bridle").show();$(".time_estimate_prefix").hide();break;case"bike":$(".time_estimate").hide();$(".time_bike").show();$(".time_estimate_prefix").hide();break;case"bike_Novice":$(".time_estimate").hide();$(".time_bike").show();$(".time_estimate_prefix").hide();break;case"bike_Beginner":$(".time_estimate").hide();$(".time_bike").show();$(".time_estimate_prefix").hide();break;case"bike_Intermediate":$(".time_estimate").hide();$(".time_bike").show();$(".time_estimate_prefix").hide();break;case"bike_Advanced":$(".time_estimate").hide();$(".time_bike").show();$(".time_estimate_prefix").hide();break;default:$(".time_estimate").show();$(".time_estimate_prefix").show();break}});$("#loops_typeicons img").click(function(){var e=$(this);var t=e.attr("data-value");$("#loops_filter_type").val(t).trigger("change");$("#loops_typeicons img").each(function(){var t=$(this).prop("src");if($(this).is(e)){t=t.replace("_off.png","_on.png")}else{t=t.replace("_on.png","_off.png")}$(this).prop("src",t)})}).first().click();$("#loops_filter_distancepicker img").click(function(){var e=$(this);var t=e.attr("data-min");var n=e.attr("data-max");$("#loops_filter_distance_slider").slider("values",[t,n]);$("#loops_filter_distancepicker img").each(function(){var t=$(this).prop("src");if($(this).is(e)){t=t.replace("_off.png","_on.png")}else{t=t.replace("_on.png","_off.png")}$(this).prop("src",t)});$("#loops_filter_button").click()}).first().click();$("#loops_filter_button").click(filterLoops);$("#loops_filter_reservation").change(filterLoops);$("#loops_filter_paved").change(filterLoops);$("#loops_filter_type").change(filterLoops)});$(window).load(function(){$("#measure_button").click(function(){var e=$("#measure_via").val();if(e=="trail")e=$("#measure_via_trail").val();performMeasure(MARKER_FROM.getLatLng(),MARKER_TO.getLatLng(),e)});$("#measure_clear").click(function(){stopMeasure();startMeasure();$("#measure_steps").empty()});$("#measure_via").change(function(){var e=$(this).val()=="trail";e?$("#measure_via_trail").show():$("#measure_via_trail").hide()})})