var RecentTracksParser = require('../lib/lastfm-node/recenttracks-parser').RecentTracksParser;
var assert = require('assert');
var sys = require('sys');

var ntest = require('ntest');

ntest.describe("recentracks")
  ntest.before(function() { this.parser = new RecentTracksParser(); })

  ntest.it("is null when empty", function() {
    assert.equal(null, this.parser.parse(''));
    })

  ntest.it("returns object for value of recenttracks.track", function() {
    assert.equal(42, this.parser.parse('{\"recenttracks\":{\"track\":42}}'));
   })

  ntest.it("returns null for unexpected input", function() {
    assert.equal(null, this.parser.parse('{\"recentevents\":{\"event\":{}}}'));
  })

  ntest.it("returns most first track when array", function() {
    assert.equal('first', this.parser.parse('{\"recenttracks\":{\"track\":[\"first\", \"second\"]}}'));
  })