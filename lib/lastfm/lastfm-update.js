var EventEmitter = require("events").EventEmitter;

var LastFmUpdate = function(lastfm, method, session, options) {
  EventEmitter.call(this);
  var that = this;

  if (options.error) {
    this.on("error", options.error);
  }
  if (options.success) {
    this.on("success", options.success);
  }
    
  if (!session.isAuthorised()) {
    this.emit("error", new Error("Session is not authorised"));
    return;
  }

  if (!options) options = {};

  if (method == "nowplaying") {
    nowPlaying(options.track, options); 
  }
  if (method == "scrobble") {
    scrobble(options.track, options);
  }
  
  function nowPlaying(track, options) {
    var params = { method: "track.updateNowPlaying", artist: track.artist["#text"], track: track.name, sk: session.key }
    if (options.duration) {
      params.duration = options.duration;
    }
    var request = lastfm.write(params, true);
    request.on("success", handleResponse);
    request.on("error", bubbleError);
  }

  function scrobble(track, options) {
    if (!options.timestamp) {
      that.emit("error", new Error("Timestamp is required for scrobbling"));
      return;
    }

    var request = lastfm.write({
      method: "track.scrobble",
      artist: track.artist["#text"],
      track: track.name,
      sk: session.key,
      timestamp: options.timestamp
    }, true);
    request.on("success", handleResponse);
    request.on("error", bubbleError);
  }

  function handleResponse(data) {
    var response = JSON.parse(data);
    if (!response) return;
    if (response.error) {
      that.emit("error", new Error(response.message));
      return;
    }
    that.emit("success", options.track);
  }

  function bubbleError(error) {
    that.emit("error", error);
  }
}

LastFmUpdate.prototype = Object.create(EventEmitter.prototype);

module.exports = LastFmUpdate;

