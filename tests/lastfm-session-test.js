require('./common.js');
var LastFmSession = require('lastfm/lastfm-session');
var fakes = require("./fakes");

(function() {
  describe("a new LastFmSession");
  var session;

  before(function() {
     session = new LastFmSession(new LastFmNode());
  });

  it("has no session key", function() {
    assert.ok(!session.key);
  });

  it("has no user", function() {
    assert.ok(!session.user);
  });

  it("is not authorised", function() {
    assert.ok(!session.isAuthorised());
  });

  it("can configure key and user", function() {
    var session = new LastFmSession(new LastFmNode(), "user", "sessionkey");
    assert.equal("user", session.user);
    assert.equal("sessionkey", session.key);
  });

  it("is authorised when it has a key", function() {
    var session = new LastFmSession(new LastFmNode(), "user", "sessionkey");
    assert.ok(session.isAuthorised());
  });
})();

(function() {
  var readError, token, returndata, options, request, lastfm, session, gently;

  function setupFixture() {
    readError = "";
    token = "";
    returndata = null;
    options = null;
    request = new fakes.LastFmRequest();
    lastfm = new LastFmNode();
    session = new LastFmSession(lastfm);
    gently = new Gently();
  }

  function expectError(expectedError) {
    gently.expect(session, "emit", function(event, error) {
      assert.equal("error", event);
      assert.equal(expectedError, error.message);
    });
    session.authorise(token, options);
    if (readError) {
      request.emit("error", new Error(readError));
    }
    else {
      request.emit("success", returndata);
    }
  }

  function expectAuthorisation(assertions) {
    gently.expect(session, "emit", function(event, emittedSession) {
      assert.equal("authorised", event);
      if (assertions) {
        assertions(emittedSession);
      }
    });
    session.authorise(token, options);
    request.emit("success", returndata);
  }

  function whenReadRequestReturns(data) {
    returndata = data;
    gently.expect(lastfm, "read", function(params, signed) {
      return request;
    });
  }

  function whenReadRequestThrowsError(message) {
    readError = message;
    gently.expect(lastfm, "read", function(params, signed) {
      return request;
    });
  }
  
  function andTokenIs(setToken) {
    token = setToken;
  }

  function andOptionsAre(setOptions) {
    options = setOptions;
  }

  describe("a LastFmSession authorisation request")
  before(function() {
     setupFixture();
  });
  
  it("emits error when no token supplied", function() {
    expectError("No token supplied");
  });
  
  it("contains supplied token", function() {
    gently.expect(lastfm, "read", function(params) {
      assert.equal("token", params.token);
      return request;
    });
    session.authorise("token");
  });
  
  it("uses getSession method", function() {
    gently.expect(lastfm, "read", function(params) {
      assert.equal("auth.getsession", params.method);
      return request;
    });
    session.authorise("token");
  });
  
  it("is signed", function() {
    gently.expect(lastfm, "read", function(params, signed) {
      assert.ok(signed);
      return request;
    });
    session.authorise("token");
  });
  
  describe("a completed LastFmSession authorisation request")
  before(function() {
     setupFixture();
  });
  
  it("emits error when authorisation not successful", function() {
    whenReadRequestReturns(FakeData.AuthorisationError);
    andTokenIs("token");
    expectError("Signature is invalid");
  });
  
  it("emits error when receiving unexpected return data", function() {
    whenReadRequestReturns(FakeData.SingleRecentTrack);
    andTokenIs("token");
    expectError("Unexpected error");
  });
  
  it("emits authorised when successful", function() {
    whenReadRequestReturns(FakeData.SuccessfulAuthorisation);
    andTokenIs("token");
    expectAuthorisation();
  });
  
  it("can have error handler specified with authorise call", function() {
    var handler = { error: function(error) { } };
    gently.expect(handler, "error", function(error) {
      assert.equal("No token supplied", error.message); 
    });
    session.authorise("", {
      error: handler.error
    });
  });
  
  it("updates session key and user when successful", function() {
    whenReadRequestReturns(FakeData.SuccessfulAuthorisation);
    andTokenIs("token");
    expectAuthorisation(function(session) {
      assert.equal("username", session.user);
      assert.equal("sessionkey", session.key);
      assert.ok(session.isAuthorised());
    });
  });
  
  it("can have authorised handler specified with authorise call", function() {
    var handler = { authorised: function(session) { } };
    whenReadRequestReturns(FakeData.SuccessfulAuthorisation);
    session.authorise("token", {
      authorised: handler.authorised
    });
  });
  
  it("bubbles up errors", function() {
    var errorMessage = "Bubbled error";
    whenReadRequestThrowsError(errorMessage);
    andTokenIs("token");
    expectError(errorMessage);
  });
})();
