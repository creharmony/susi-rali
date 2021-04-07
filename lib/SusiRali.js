class SusiRali {

  constructor(options) {
    this.windowsMs = 'windowsMs' in options ? options.windowsMs : 1000;
    this.maxQueryPerWindow = 'maxQueryPerWindow' in options ? options.maxQueryPerWindow : 10;
    this.maxProcessingPerWindow = 'maxProcessingPerWindow' in options ? options.maxProcessingPerWindow : this.maxQueryPerWindow;
    this.debugEnabled = 'debugEnabled' in options ? options.debugEnabled : false;
    if (this.maxQueryPerWindow < 1) { throw "invalid maxQueryPerWindow - must be greater than 0"; }
    if (this.windowsMs < 100) { throw "invalid windowsMs - must be greater than 100"; }
    //~ internal
    this.maxTicWithoutActivity = 3;
    this.ticEnabled = false;
    this.ticWithoutActivity = 0;
    this.queue = [];
    this.processing = 0;
    this.firstTic = false;
    this.tokens = 0;
    this.debug(`SusiRali ${this.maxQueryPerWindow}q,${this.maxProcessingPerWindow}p/${this.windowsMs}ms`);
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
        .then(() => {
           susi.processing++;
           promiseCallback()
                .then((result) => {
                    susi.processing--;
                    resolve(result);
                })
                .catch((err) => {
                    susi.processing--;
                    reject(err);
                })
       })
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

  getProcessing() {
    const p = this.processing;
    return p;
  }

  hasQueueContent() {
    return (this.queue.length > 0);
  }

  hasToken() {
    return (this.tokens >= 1);
  }

  hasWorkInProgress() {
    return (this.processing > 0);
  }

  isNewProcessingAllowed() {
    return (this.maxProcessingPerWindow == null || this.processing < this.maxProcessingPerWindow);
  }

  consume() {
    if (this.hasQueueContent() && this.hasToken() && this.isNewProcessingAllowed()) {
      this.tokens--;
      this.queue.shift()();
      this.ticWithoutActivity = 0;
      this.debugInline('-');
    }
    if (this.hasWorkInProgress()) {
      setTimeout(this.consume.bind(this),10);
    }
  }

  tic() {
    const batchToken = this.maxQueryPerWindow < 10 ? this.maxQueryPerWindow : this.maxQueryPerWindow/10;
    const batchWindow = this.maxQueryPerWindow < 10 ? this.windowsMs : this.windowsMs/10;
    this.debug(`T${this.ticWithoutActivity > 0 ? this.ticWithoutActivity : ""}[${this.processing}]`);
    if (this.tokens === batchToken && ++this.ticWithoutActivity >= this.maxTicWithoutActivity && this.processing < 1) {
      this.debug('tic disabled');
      this.ticEnabled = false;
      return;
    }
    if (!this.firstTic) {
      this.tokens = batchToken;
      this.consume();
    }
    this.firstTic = false;
    setTimeout(this.tic.bind(this), batchWindow);
  }

}

module.exports = SusiRali;
