const assert = require('assert').strict;
const expect = require('chai').expect
const SusiRali = require('../lib/SusiRali.js');
const TestHelper = require('./TestHelper')();
const debugEnabled=true;
const warnEnabled=true;

describe("Test SusiRali parallel", function() {

  it("should rate limit parallel long queries 7/200", async function() {

    async function testParallelPromise(batchCount, counterWindows) {
      const start = new Date();
      await TestHelper.countEachWindow(start, counterWindows, batchCount, susi);

      console.log(`PARALLEL LAUNCH`)

      var promises = [];
      for (var k=0;k<batchCount;k++) {
        const businessArg = `parallel${k}`;
        promises.push(
         susi.limitedCall(()=>TestHelper.businessCode(businessArg, 200)).then((result)=>console.log(">" + result))
        );
      }
      await Promise.allSettled(promises).catch(TestHelper._expectNoError);

      const duration = new Date() - start;
      console.log(`parallel duration: ${duration}ms ${TestHelper.nbDone} / ${TestHelper.nbDoneAll}`);

      return duration;
    }

    const counterWindows=200;
    const windowsMs=200;
    const maxQueryPerWindow=7;
    const maxProcessingPerWindow=9;
    const nbEntries = 100;

    TestHelper.reset();

    const susi = new SusiRali({windowsMs, maxQueryPerWindow, maxProcessingPerWindow, debugEnabled, warnEnabled});
    var duration = await testParallelPromise(nbEntries, counterWindows);

    expect(TestHelper.maxQ).to.be.lte(maxQueryPerWindow);
    expect(TestHelper.maxP).to.be.lte(maxProcessingPerWindow);
    await TestHelper.sleep(counterWindows*4);// end of counter must be reached to start next
  });


  it("should rate limit parallel long queries 10/1000", async function() {

    async function testParallelPromise(batchCount, counterWindows) {
      const start = new Date();
      await TestHelper.countEachWindow(start, counterWindows, batchCount, susi);

      console.log(`PARALLEL LAUNCH`)

      var promises = [];
      for (var k=0;k<batchCount;k++) {
        const businessArg = `parallel${k}`;
        promises.push(
         susi.limitedCall(()=>TestHelper.businessCode(businessArg, 200)).then((result)=>console.log(">" + result))
        );
      }
      await Promise.allSettled(promises).catch(TestHelper._expectNoError);

      const duration = new Date() - start;
      console.log(`parallel duration: ${duration}ms ${TestHelper.nbDone} / ${TestHelper.nbDoneAll}`);

      return duration;
    }

    const counterWindows=1000;
    const windowsMs=1000;
    const maxQueryPerWindow=10;
    const maxProcessingPerWindow=10;
    const nbEntries = 20;

    TestHelper.reset();

    const susi = new SusiRali({windowsMs, maxQueryPerWindow, maxProcessingPerWindow, debugEnabled, warnEnabled});
    var duration = await testParallelPromise(nbEntries, counterWindows);

    expect(TestHelper.maxQ).to.be.lte(maxQueryPerWindow);
    expect(TestHelper.maxP).to.be.lte(maxProcessingPerWindow);
    await TestHelper.sleep(counterWindows*4);// end of counter must be reached to start next
  });

});
