import "core-js/es6";
import "core-js/es7/reflect";
import "zone.js/dist/zone";
import "hammerjs/hammer";

if (process.env.ENV === "production") {
    // Production
} else {
    Error["stackTraceLimit"] = Infinity;
    require("zone.js/dist/long-stack-trace-zone");
}
