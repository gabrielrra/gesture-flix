import { prepareRunChecker } from '../../../shared/utils.js';

const { shouldRun: shouldDoBlinkAction } = prepareRunChecker({ timerDelay: 500 });
export default class Controller {
  #view;
  #worker;
  #blinkCounter;
  #camera;
  #loopInterval = null;
  constructor({ view, camera, worker }) {
    this.#view = view;
    this.#worker = this.#configureWorker(worker);
    this.#camera = camera;

    this.#view.configureOnBtnClick(this.startBlinkRecognition.bind(this));
  }


  #configureWorker(worker) {
    let ready = false;
    worker.onmessage = ({ data }) => {
      if (data === 'TF_MODEL_READY') {
        console.log('TF_MODEL_READY');
        this.#view.enableButton();
        ready = true;

        return;
      }

      const blinked = data.blinked;
      if (blinked && shouldDoBlinkAction()) {
        this.#blinkCounter += blinked;
        this.log(`Detecting eye blinks! Eye blinks: ${this.#blinkCounter}`);
        this.#view.videoTogglePlayPause();
      }
    };
    return {
      send(msg) {
        if (!ready) return;
        worker.postMessage(msg);
      }
    };
  }

  static async initialize(deps) {
    const controller = new Controller(deps);
    controller.log('Not detecting eye blink');
    return controller.init();
  }

  async init() { }

  log(text) {
    this.#view.log(text);
  }

  startBlinkRecognition() {
    this.#blinkCounter = 0;
    this.log('Initializing detection...');
    this.#view.configureOnBtnClick(this.stopBlinkRecognition.bind(this));
    this.#view.setButtonStop();
    this.loop();
  }

  stopBlinkRecognition() {
    this.log('Not yet detecting eye blink');
    this.#view.configureOnBtnClick(this.startBlinkRecognition.bind(this));
    this.#view.setButtonStart();
    clearInterval(this.#loopInterval);
    this.#loopInterval = null;
  }

  loop() {
    if (this.#loopInterval === null)
      this.#loopInterval = setInterval(() => {
        const video = this.#camera.video;
        const img = this.#view.getVideoFrame(video);
        this.#worker.send(img);
      }, 100);
  }
}