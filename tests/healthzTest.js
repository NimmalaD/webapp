const supertest = require("supertest");
const app = require("../app");
var assert = require("assert");
const logger = require("../logger.js");

describe("Testing our Application", function () {
  it("Simple assert test", function () {
    assert.equal(1, 1);
  });

  it("GET /healthz end point of the application", (done) => {
    try {
      supertest(app)
        .get("/healthz")
        .expect(200)
        .end((err, response) => {
          if (err) return done(err);
          else {
            logger.info("/healthz successful");
            done();
            process.exit();
          }
        });
    } catch {
      logger.error("Error while testing /healthz:", error);
      done();
      process.exit();
    }
  });
});
