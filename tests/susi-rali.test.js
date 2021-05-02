const assert = require('assert').strict;
const expect = require('chai').expect
const SusiRali = require('../lib/SusiRali.js');
const TestHelper = require('./TestHelper')();

describe("Test SusiRali pause and restart", function() {

  it("should rate limit, sleep and rate limit again", async function() {

    async function testPromise(batchCount, sleepTimeMs, counterWindows) {
      const start = new Date();
      await TestHelper.countEachWindow(start, counterWindows, batchCount*2, susi);

      console.log(`FIRST LAUNCH`)
      for (var i=0;i<batchCount;i++) {
           await susi.limitedCall(() => TestHelper.businessCode("First"+i,0))
                     .then((result)=>console.log(">" + result));
      }
      var duration = new Date() - start;
      console.log(`DD duration: ${duration}ms ${TestHelper.nbDone} / ${TestHelper.nbDoneAll}`);
      await TestHelper.sleep(sleepTimeMs);

      console.log(`SECOND LAUNCH`)
      for (var j=0;j<batchCount;j++) {
           await susi.limitedCall(() => TestHelper.businessCode("Second"+j,0))
                     .then((result)=>console.log(">" + result));
      }
      var duration = new Date() - start;

      return duration;
    }

    const counterWindows=1000;
    const windowsMs=1000;
    const maxQueryPerWindow=30;
    const debugEnabled=true;

    const nbEntries = 50;
    const sleepTimeMs = 2000;

    TestHelper.reset();

    const susi = new SusiRali({windowsMs, maxQueryPerWindow, debugEnabled});
    var duration = await testPromise(nbEntries, sleepTimeMs, counterWindows);

    expect(TestHelper.maxQ).to.be.lt(maxQueryPerWindow);
    expect(TestHelper.maxP).to.be.lt(maxQueryPerWindow);

    await TestHelper.sleep(counterWindows*4);// end of counter must be reached to start next
  });


});
