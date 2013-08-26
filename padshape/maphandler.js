var map;

drawStyle = 'new';

function loadMap() {
  map = new OpenLayers.Map({
      div: "map",
//      allOverlays: true,
//      fractionalZoom: true,
      controls: [],
//      minScale: 442943842,
//      maxScale: 135
  });

  var drillpads = new OpenLayers.Layer.Vector("Drill pads");
  drillpads.id = "drillpads";
  var guide = new OpenLayers.Layer.Vector("Guide");
  guide.id = "guide";

  var osm = new OpenLayers.Layer.OSM();

  map.addLayers([osm, guide, drillpads]);
  map.setBaseLayer(osm);

  if (drawStyle == 'new')
    drillpads.mod = new OpenLayers.Control.DrawFeature(drillpads, OpenLayers.Handler.Polygon);
  else
    drillpads.mod = new OpenLayers.Control.ModifyFeature(drillpads);
  map.addControls([
    new OpenLayers.Control.Navigation(),
    new OpenLayers.Control.Attribution(),
    new OpenLayers.Control.PanZoomBar(),
    drillpads.mod
  ]);
  drillpads.mod.activate();

  map.zoomToMaxExtent();
}

function setProgress(data) {
  var pct = Math.round((data.done*100)/data.total);
  $("#progress").css("width", pct.toString() +"%");
  $("#progress").attr("title", pct.toString() + "% completed!");
  $("#progress").tooltip({'placement': 'left'}); 
  $("#total").text(data.total);
  $("#done").text(data.done);
}

function clearData () {
  var drillpads = map.getLayer('drillpads');
  var info = drillpads.taskinfo;
  var bbox = OpenLayers.Bounds.fromString(info.bbox);
    var center = bbox.getCenterLonLat();

  drillpads.mod.deactivate();
  drillpads.removeAllFeatures();
  drillpads.mod.activate();

  if (drawStyle != 'new') {
    var bbox2 = new OpenLayers.Bounds();
    var radius = 125;

    bbox2.extend(OpenLayers.Util.destinationVincenty(center, 0, radius));
    bbox2.extend(OpenLayers.Util.destinationVincenty(center, 90, radius));
    bbox2.extend(OpenLayers.Util.destinationVincenty(center, 180, radius));
    bbox2.extend(OpenLayers.Util.destinationVincenty(center, 270, radius));

    var feature = new OpenLayers.Feature.Vector(
      bbox2.toGeometry(),
      null,
      {
        strokeColor: "#ff0000",
        strokeWidth: 3,
        fillOpacity: 0.1,
        fillColor: "#ff0000"
      }
    );
    drillpads.addFeatures([feature]);
    drillpads.mod.selectFeature(feature);

  }

  if (drawStyle == 'new') {
    var guide = map.getLayer('guide');
    guide.removeAllFeatures();

    guide.addFeatures([new OpenLayers.Feature.Vector(
      OpenLayers.Geometry.Polygon.createRegularPolygon(new OpenLayers.Geometry.Point(center.lon, center.lat), 125, 20, 0),
      null,
      {
        strokeColor: "#000000",
        strokeWidth: 3,
        strokeOpacity: 0.5,
        fillOpacity: 0,
        fillColor: "#000000"
      }
    )]);
  }

  map.zoomToExtent(bbox);
}

function updateMap(info) {
  map.getLayer('drillpads').taskinfo = info;

  if (map.getLayer('imagery')) map.removeLayer(map.getLayer('imagery'));

  var bboxradius = 250;
  bbox = new OpenLayers.Bounds();
  var center = new OpenLayers.LonLat(info.position);
  bbox.extend(OpenLayers.Util.destinationVincenty(center, 0, bboxradius));
  bbox.extend(OpenLayers.Util.destinationVincenty(center, 90, bboxradius));
  bbox.extend(OpenLayers.Util.destinationVincenty(center, 180, bboxradius));
  bbox.extend(OpenLayers.Util.destinationVincenty(center, 270, bboxradius));

  var imagery = new OpenLayers.Layer.Image(
    'imagery',
    info.url,
    OpenLayers.Bounds.fromString(info.bbox),
    new OpenLayers.Size(info.width, info.height),
    {
      opacity: 1.0, 
      isBaseLayer: false,
      numZoomLevels: 20,
      alwaysInRange: true
    }
  );
  map.addLayer(imagery);
  map.setLayerIndex(imagery, 1);

  clearData();
}

function getTaskData() {
  var geojson = new OpenLayers.Format.GeoJSON();
  var drillpads = map.getLayer('drillpads');
  drillpads.mod.deactivate();
  var res = {shape: JSON.parse(geojson.write(drillpads.features[0].geometry))};
  drillpads.mod.activate();
  return res;
}