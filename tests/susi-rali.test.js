const assert = require('assert').strict;
const expect = require('chai').expect
const SusiRali = require('../lib/SusiRali.js');

describe("Test SusiRali", function() {

  it("should rate limit, sleep and rate limit again", async function() {
    var nbDoneAll = 0;
    var nbDone = 0;

    function sleep(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    async function countEachWindow() {
      const duration = new Date() - start;
      if (nbDoneAll > 0) {
        console.log(`duration: ${duration}ms => ${nbDone} / ${nbDoneAll}`)
        nbDone = 0;
      }
      if (nbDoneAll !== 200) {
        setTimeout(countEachWindow, counterWindows);
      }
    }

    function businessCode(extra) {
      nbDone++;nbDoneAll++;
      // console.log(`${nbDone} : businessCode(${extra})`);
      return Promise.resolve(`R[${extra}]`);
    }

    async function testPromise(batchCount, sleepTimeMs) {
      await countEachWindow();

      console.log(`FIRST LAUNCH`)
      for (var i=0;i<batchCount;i++) {
           await susi.limitedCall(() => businessCode("First"+i))
                     .then((result)=>console.log(">" + result));
      }
      const duration = new Date() - start;
      console.log(`DD duration: ${duration}ms ${nbDone} / ${nbDoneAll}`);
      await sleep(sleepTimeMs);

      console.log(`SECOND LAUNCH`)
      for (var j=0;j<batchCount;j++) {
           await susi.limitedCall(() => businessCode("Second"+j))
                     .then((result)=>console.log(">" + result));
      }
    }

    const counterWindows=1000;
    const windowsMs=1000;
    const maxQueryPerWindow=30;
    const debugEnabled=true;
    const start = new Date();

    const nbEntries = 100;
    const sleepTimeMs = 2000;

    const susi = new SusiRali({windowsMs, maxQueryPerWindow, debugEnabled});
    await testPromise(nbEntries, 2000);

    const duration = new Date() - start;
    const expectedTimeMs = ((2*nbEntries/maxQueryPerWindow)*windowsMs)+sleepTimeMs;
    expect(duration).to.be.within(expectedTimeMs-500, expectedTimeMs+500);
  });

});

function _expectNoError(err) {
  console.trace(err)
  expect.fail(err);
}
