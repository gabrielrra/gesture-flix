export default class Camera {
  constructor() {
    this.video = document.createElement('video')
  }

  static async init() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(`Browser API navigator.mediaDevices.getUserMedia not available`)
    }

    const videoConfig = {
      audio: false,
      video: {
        width: globalThis.screen.availWidth,
        height: globalThis.screen.availHeight,
        frameRate: {
          ideal: 30
        },
        facingMode: 'user'
      }
    }
    const stream = await navigator.mediaDevices.getUserMedia(videoConfig)
    const camera = new Camera()
    camera.video.srcObject = stream

    // Video feedback for debugging
    // camera.video.width = 320
    // camera.video.height = 240
    // document.body.prepend(camera.video)

    await new Promise((resolve) => {
      camera.video.onloadedmetadata = () => {
        resolve(camera.video)
      }
    })
    camera.video.play()
    return camera
  }
}