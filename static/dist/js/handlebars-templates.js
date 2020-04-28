this["CM"] = this["CM"] || {};
this["CM"]["Templates"] = this["CM"]["Templates"] || {};

this["CM"]["Templates"]["info_attraction"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "    <h4>Activities:</h4>\n    <ul class=\"activities-icon-list\">\n    </ul>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <img src=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"src") : stack1), depth0))
    + "\" width=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"width") : stack1), depth0))
    + "\" height=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"height") : stack1), depth0))
    + "\" alt=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "\">\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"feature-description\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"descr") : stack1), depth0))
    + "</div>\n";
},"7":function(container,depth0,helpers,partials,data) {
    return "    <ul class=\"nobull\">\n        <li><a href=\"\" target=\"_blank\">More Info</a></li>\n    </ul>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h2>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "</h2>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"activities") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":0},"end":{"line":18,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depth0 != null ? lookupProperty(depth0,"img") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":20,"column":0},"end":{"line":22,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"descr") : stack1),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":24,"column":0},"end":{"line":26,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"cmp_url") : stack1),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":28,"column":0},"end":{"line":32,"column":7}}})) != null ? stack1 : "")
    + "\n<h4>GPS coordinates:</h4>\n<div class=\"small-light\">\n    "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"latlng_userformatted") : stack1), depth0))
    + "\n</div>";
},"useData":true});

this["CM"]["Templates"]["info_reservation"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <img src=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"src") : stack1), depth0))
    + "\" width=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"width") : stack1), depth0))
    + "\" height=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"height") : stack1), depth0))
    + "\" alt=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "\">\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	<h4>Phone</h4>\n	<a title=\"Call "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "\" href=\"tel:"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"phone") : stack1), depth0))
    + "\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"phone") : stack1), depth0))
    + "</a>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h2>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "</h2>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depth0 != null ? lookupProperty(depth0,"img") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":0},"end":{"line":5,"column":7}}})) != null ? stack1 : "")
    + "\n<p>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"descr") : stack1), depth0))
    + "</p>\n\n<h4>Hours of Operation</h4>\n"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"hoursofoperation") : stack1), depth0))
    + "\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"phone") : stack1),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":12,"column":0},"end":{"line":15,"column":7}}})) != null ? stack1 : "")
    + "\n<div class=\"lat_driving\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"drivingdestinationlatitude") : stack1), depth0))
    + "</div>\n<div class=\"lng_driving\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"drivingdestinationlongitude") : stack1), depth0))
    + "</div>";
},"useData":true});