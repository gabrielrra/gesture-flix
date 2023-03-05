import Camera from '../../../shared/camera.js'
import { supportsWorkerType } from '../../../shared/utils.js'
import Controller from "./controller.js"
import Service from './service.js'
import View from './view.js'

async function getWorker() {
  if (supportsWorkerType()) {
    const worker = new Worker('./src/worker.js', { type: 'module' })
    return worker
  }
  console.warn("Browser doesn't support ESM Workers! Use Google Chrome for a better experience.")
  await import('https://unpkg.com/@tensorflow/tfjs-core@2.4.0/dist/tf-core.js')
  await import('https://unpkg.com/@tensorflow/tfjs-converter@2.4.0/dist/tf-converter.js')
  await import('https://unpkg.com/@tensorflow/tfjs-backend-webgl@2.4.0/dist/tf-backend-webgl.js')
  await import('https://unpkg.com/@tensorflow-models/face-landmarks-detection@0.0.1/dist/face-landmarks-detection.js')


  const { tf, faceLandmarksDetection } = window
  tf.setBackend('webgl')

  const service = new Service({
    faceLandmarksDetection
  })
  const workerMock = {
    async postMessage(video) {
      const blinked = await service.didBlink(video)
      if (!blinked) return
      workerMock.onmessage({ data: { blinked } })
    },
    onmessage(msg) { },
    mocked: true
  }

  console.log('TF_MODEL_LOADING...')
  await service.loadModel()
  return workerMock
}
const worker = await getWorker()

const camera = await Camera.init()
const [rootPath] = window.location.href.split('/pages/')
const factory = {
  async initialize() {
    return Controller.initialize({
      view: new View(),
      camera,
      worker
    })
  }
}
if (worker.mocked === true)
  setTimeout(() => worker.onmessage({ data: 'TF_MODEL_READY' }), 400)

export default factory