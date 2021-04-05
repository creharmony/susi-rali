class SusiRali {

  constructor(options) {
    this.windowsMs = 'windowsMs' in options ? options.windowsMs : 1000;
    this.maxQueryPerWindow = 'maxQueryPerWindow' in options ? options.maxQueryPerWindow : 10;
    this.debugEnabled = 'debugEnabled' in options ? options.debugEnabled : false;
    if (this.maxQueryPerWindow < 1) { throw "invalid maxQueryPerWindow - must be greater than 0"; }
    if (this.windowsMs < 100) { throw "invalid windowsMs - must be greater than 100"; }
    //~ internal
    this.maxTicWithoutActivity = 3;
    this.ticEnabled = false;
    this.ticWithoutActivity = 0;
    this.queue = [];
    this.firstTic = false;
    this.tokens = 0;
    if (this.maxQueryPerWindow < 10) {
        this.windowsMs = this.windowsMs * 10;
        this.maxQueryPerWindow = this.maxQueryPerWindow * 10;
    }
    this.debug(`SusiRali ${this.maxQueryPerWindow}q/${this.windowsMs}ms`);
  }

  debug(msg) {
    if (!this.debugEnabled) {
      return;
    }
    console.log(msg);
  }

  debugInline(msg) {
    if (!this.debugEnabled) {
      return;
    }
    process.stdout.write(msg);
  }

  async limitedCall(promiseCallback) {
    var susi = this;
    return new Promise(async function(resolve, reject) {
      await susi.requestPromise()
        .then(() => promiseCallback().then(resolve).catch(reject))
        .catch(reject);
    });
  }

  requestPromise() {
    var susi = this;
    return new Promise(async function(resolve, reject) {
      await susi.removeToken(resolve).catch(reject);
    });
  }

  async removeToken(callback) {
    this.debugInline('+');
    this.queue.push(callback);
    if (!this.ticEnabled) {
      this.ticStart();
    }
  }

  async ticStart() {
    this.debug('ticStart');
    this.ticEnabled = true;
    this.ticWithoutActivity = 0;
    this.tic();
  }

  consume() {
    if (this.queue.length > 0 && this.tokens > 0) {
      this.queue.shift()();
      this.tokens--;
      this.ticWithoutActivity = 0;
      this.debugInline('-');
      setTimeout(this.consume.bind(this),1);
    }
  }

  tic() {
    this.debugInline(`T${this.ticWithoutActivity}`);
    if (this.tokens === this.maxQueryPerWindow/10 && this.ticWithoutActivity++ >= this.maxTicWithoutActivity) {
      this.debug('tic disabled');
      this.ticEnabled = false;
      return;
    }
    if (!this.firstTic) {
      this.tokens = this.maxQueryPerWindow/10;
      this.consume();
    }
    this.firstTic = false;
    setTimeout(this.tic.bind(this), this.windowsMs/10);
  }

}

module.exports = SusiRali;
