const assert = require('assert').strict;
const expect = require('chai').expect
const SusiRali = require('../lib/SusiRali.js');

var nbDoneAll = 0;
var nbDone = 0;

var maxQ = 0;// max query start per window
var maxP = 0;// max processing at a time

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function businessCode(extra, waitFactorMs=1000) {
  nbDone++;nbDoneAll++;
  // console.log(`${nbDone} : businessCode(${extra})`);
  return new Promise((resolve) => {
    sleep(getRandomInt(4)*waitFactorMs).then(() => resolve(`R[${extra}]`));
  });
}

async function countEachWindow(start, counterWindows, maxSend, susi) {
  const duration = new Date() - start;
  const p = susi.getProcessing();
  if (nbDoneAll > 0) {
    console.log(`duration: ${duration}ms => ${nbDone} / ${nbDoneAll}..${maxSend} - ${p} processing`)
    maxQ = Math.max(nbDone, maxQ);
    maxP = Math.max(p, maxP);
    nbDone = 0;
  }
  if (nbDoneAll !== maxSend && duration < 60000) {
    setTimeout(countEachWindow, counterWindows, start, counterWindows, maxSend, susi);
  } else {
    console.log(`countEachWindow done ${maxSend}`)
  }
}

describe("Test SusiRali", function() {

  it("should rate limit, sleep and rate limit again", async function() {

    async function testPromise(batchCount, sleepTimeMs, counterWindows) {
      const start = new Date();
      await countEachWindow(start, counterWindows, batchCount*2, susi);

      console.log(`FIRST LAUNCH`)
      for (var i=0;i<batchCount;i++) {
           await susi.limitedCall(() => businessCode("First"+i,0))
                     .then((result)=>console.log(">" + result));
      }
      var duration = new Date() - start;
      console.log(`DD duration: ${duration}ms ${nbDone} / ${nbDoneAll}`);
      await sleep(sleepTimeMs);

      console.log(`SECOND LAUNCH`)
      for (var j=0;j<batchCount;j++) {
           await susi.limitedCall(() => businessCode("Second"+j,0))
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

    nbDoneAll = 0;
    nbDone = 0;
    maxQ = 0;
    maxP = 0;

    const susi = new SusiRali({windowsMs, maxQueryPerWindow, debugEnabled});
    var duration = await testPromise(nbEntries, sleepTimeMs, counterWindows);

    expect(maxQ).to.be.lt(maxQueryPerWindow);
    expect(maxP).to.be.lt(maxQueryPerWindow);

    await sleep(counterWindows*4);// end of counter must be reached to start next
  });


  it("should rate limit parallel long queries", async function() {

    async function testParallelPromise(batchCount, counterWindows) {
      const start = new Date();
      await countEachWindow(start, counterWindows, batchCount, susi);

      console.log(`PARALLEL LAUNCH`)

      var promises = [];
      for (var k=0;k<batchCount;k++) {
        const businessArg = `parallel${k}`;
        promises.push(
         susi.limitedCall(()=>businessCode(businessArg, 200)).then((result)=>console.log(">" + result))
        );
      }
      await Promise.allSettled(promises).catch(_expectNoError);

      const duration = new Date() - start;
      console.log(`parallel duration: ${duration}ms ${nbDone} / ${nbDoneAll}`);

      return duration;
    }

    const counterWindows=200;
    const windowsMs=200;
    const maxQueryPerWindow=7;
    const maxProcessingPerWindow=9;
    const debugEnabled=true;
    const nbEntries = 100;

    nbDoneAll = 0;
    nbDone = 0;
    maxQ = 0;
    maxP = 0;

    const susi = new SusiRali({windowsMs, maxQueryPerWindow, maxProcessingPerWindow, debugEnabled});
    var duration = await testParallelPromise(nbEntries, counterWindows, nbEntries);

    expect(maxQ).to.be.lte(maxQueryPerWindow);
    expect(maxP).to.be.lte(maxProcessingPerWindow);
    await sleep(counterWindows*4);// end of counter must be reached to start next
  });

});

function _expectNoError(err) {
  console.trace(err)
  expect.fail(err);
}
