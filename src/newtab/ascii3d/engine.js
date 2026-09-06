import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { LevelsEffect, ASCIIEffect, DitherEffect, createAsciiCharTexture, createPaletteTexture } from './shaders.js';
import { effectiveSettings } from './settings.js';

// The rendering engine of Razi's 3D ASCII & Dither Lab, ported to vanilla ES
// modules. Pass order, uniform mapping and light intensities are reproduced as
// measured, because the look depends on them: the composer chain has no tone
// mapping or sRGB encode, and the very high light intensities exist to
// compensate for exactly that.

const KEY_LIGHT_DISTANCE = 10;
const KEY_LIGHT_HEIGHT = 10;

export class AsciiLab {
  constructor(mount, options = {}) {
    this.mount = mount;
    this.width = options.width || 800;
    this.height = options.height || 600;
    this.aspectRatio = options.aspectRatio || this.width / this.height;
    this.autoRotate = options.autoRotate !== false;
    this.settings = null;
    this.running = false;
    this.frame = null;
    this.video = null;
    this.isVideo = false;
    this.isImage = false;
    this.model = null;
  }

  init() {
    if (this.renderer) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);

    this.camera = new THREE.PerspectiveCamera(50, this.aspectRatio, 0.1, 1000);
    this.camera.position.set(0, 1, 5);

    // No setPixelRatio: the ASCII pass tiles in CSS pixels while the Bayer pass
    // indexes gl_FragCoord in device pixels, and a ratio above 1 desynchronises
    // the two so the cell size stops matching the dither grid.
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 2.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.mount.appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
    this.keyLight.position.set(5, 10, 7.5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 50;
    this.keyLight.shadow.bias = -0.0001;
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.fillLight.position.set(-5, 5, -7.5);
    this.scene.add(this.fillLight);

    this.rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.rimLight.position.set(0, -5, 5);
    this.scene.add(this.rimLight);

    this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    this.scene.add(this.hemisphereLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 1.0;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.levelsPass = new ShaderPass(LevelsEffect);
    this.composer.addPass(this.levelsPass);
    this.asciiPass = new ShaderPass(ASCIIEffect);
    this.composer.addPass(this.asciiPass);
    this.ditherPass = new ShaderPass(DitherEffect);
    this.composer.addPass(this.ditherPass);
  }

  setModel(model, options = {}) {
    if (this.model) this.scene.remove(this.model);
    this.isVideo = false;
    this.isImage = false;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    model.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.5 / maxDim;
    model.scale.setScalar(scale);

    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    this.model = model;
    this.scene.add(model);

    this.controls.reset();
    this.controls.target.copy(model.position);
    this.lastFit = options.frame === 'fit' ? (options.fit || {}) : null;
    if (options.frame === 'fit') this.frameToFit(model, options.fit);
    else this.camera.position.set(0, size.y * scale * 0.5, size.z * scale * 2);
    this.camera.lookAt(this.controls.target);
    this.controls.update();
  }

  // Distance that puts the whole bounding sphere inside the frustum, on both
  // axes, with a little air around it.
  // margin backs the camera off past a tight fit; anchor says where in the
  // frame the subject should sit vertically (0 = top edge, 0.5 = centre), which
  // is how the wordmark ends up in the header band instead of over the cards.
  frameToFit(model, { margin = 1.12, anchor = 0.5 } = {}) {
    const sphere = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
    const vertical = (this.camera.fov * Math.PI) / 180;
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * this.camera.aspect);
    const distance = Math.max(
      sphere.radius / Math.sin(vertical / 2),
      sphere.radius / Math.sin(horizontal / 2),
    ) * margin;
    const frameHeight = 2 * distance * Math.tan(vertical / 2);
    const lift = (0.5 - anchor) * frameHeight;

    this.controls.target.set(sphere.center.x, sphere.center.y - lift, sphere.center.z);
    this.camera.position.set(sphere.center.x, sphere.center.y - lift, sphere.center.z + distance);
  }

  // Video and image content bypasses setModel: it is a flat plane two units
  // tall, framed so it exactly fills the viewport height.
  framePlane() {
    const fovRadians = (50 * Math.PI) / 180;
    const optimalDistance = 1 / Math.tan(fovRadians / 2);
    this.controls.reset();
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(0, 0, optimalDistance);
    this.camera.lookAt(0, 0, 0);
    this.camera.up.set(0, 1, 0);
    this.controls.update();
  }

  setPlane(texture, aspect) {
    if (this.model) this.scene.remove(this.model);
    const geometry = new THREE.PlaneGeometry(aspect * 2, 2);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, 0, 0);
    this.model = plane;
    this.scene.add(plane);
    this.framePlane();
    return plane;
  }

  stopVideo() {
    if (!this.video) return;
    this.video.pause();
    this.video.src = '';
    this.video = null;
  }

  loadFile(file) {
    if (!file) return Promise.reject(new Error('Nenhum arquivo informado'));
    const url = URL.createObjectURL(file);
    const name = file.name.toLowerCase();
    // Dispatch is by extension only, exactly as the lab does it.
    const done = (value) => {
      URL.revokeObjectURL(url);
      return value;
    };

    if (/\.(mp4|webm|mov)$/.test(name)) {
      this.stopVideo();
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = url;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.addEventListener('loadedmetadata', () => {
          this.video = video;
          this.isVideo = true;
          this.isImage = false;
          const texture = new THREE.VideoTexture(video);
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          this.setPlane(texture, video.videoWidth / video.videoHeight);
          video.play();
          resolve({ kind: 'video', width: video.videoWidth, height: video.videoHeight });
        });
        video.addEventListener('error', () => reject(done(new Error('Falha ao ler o vídeo'))));
        video.load();
      });
    }

    if (/\.(jpg|jpeg|png|gif|bmp|webp)$/.test(name)) {
      this.stopVideo();
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          this.isImage = true;
          this.isVideo = false;
          const texture = new THREE.Texture(image);
          texture.needsUpdate = true;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          this.setPlane(texture, image.naturalWidth / image.naturalHeight);
          resolve({ kind: 'image', width: image.naturalWidth, height: image.naturalHeight });
        };
        image.onerror = () => reject(done(new Error('Falha ao ler a imagem')));
        image.src = url;
      });
    }

    if (name.endsWith('.obj')) {
      this.stopVideo();
      return new Promise((resolve, reject) => {
        new OBJLoader().load(url, (object) => {
          this.setModel(object);
          resolve(done({ kind: 'model' }));
        }, undefined, () => reject(done(new Error('Falha ao ler o modelo OBJ'))));
      });
    }

    if (/\.(glb|gltf)$/.test(name)) {
      this.stopVideo();
      return new Promise((resolve, reject) => {
        new GLTFLoader().load(url, (gltf) => {
          this.setModel(gltf.scene);
          resolve(done({ kind: 'model' }));
        }, undefined, () => reject(done(new Error('Falha ao ler o modelo glTF'))));
      });
    }

    URL.revokeObjectURL(url);
    return Promise.reject(new Error('Formato não suportado'));
  }

  // Loads a model that ships with the app, as opposed to one the user drops in.
  loadModelUrl(url) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(url, (gltf) => resolve(gltf.scene), undefined, reject);
    });
  }

  setAutoRotate(enabled) {
    this.autoRotate = enabled;
    if (this.controls) this.controls.autoRotate = enabled;
  }

  resetCamera() {
    if (!this.controls) return;
    if (this.isVideo || this.isImage) {
      this.framePlane();
      return;
    }
    if (!this.model) return;
    this.controls.reset();
    this.controls.target.copy(this.model.position);
    // Recentring has to reuse the framing the model was set up with, or a flat
    // subject lands the camera inside itself all over again.
    if (this.lastFit) {
      this.frameToFit(this.model, this.lastFit);
    } else {
      const size = new THREE.Box3().setFromObject(this.model).getSize(new THREE.Vector3());
      this.camera.position.set(0, size.y * 0.5, size.z * 2);
    }
    this.camera.lookAt(this.controls.target);
    this.controls.update();
  }

  setSize(width, height, aspectRatio) {
    const reframe = this.lastFit && this.model && !this.isVideo && !this.isImage;
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    this.aspectRatio = aspectRatio || this.width / this.height;
    if (!this.renderer) return;
    this.camera.aspect = this.aspectRatio;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    if (reframe) this.frameToFit(this.model, this.lastFit);
    if (this.settings) this.apply(this.settings);
  }

  updateLighting(settings) {
    if (!this.keyLight) return;
    // The lab wrote `|| -45` and `|| 80` here, so a slider parked on zero
    // silently snapped back. Nullish coalescing keeps the zero stop meaningful.
    const angle = (settings.lighting?.directionalAngle ?? -45) * (Math.PI / 180);
    const intensity = (settings.lighting?.intensity ?? 80) / 100;

    this.keyLight.position.set(
      Math.sin(angle) * KEY_LIGHT_DISTANCE,
      KEY_LIGHT_HEIGHT,
      Math.cos(angle) * KEY_LIGHT_DISTANCE,
    );
    this.keyLight.intensity = 3.0 * intensity;
    this.ambientLight.intensity = 2.5 * intensity;
    this.fillLight.intensity = 2.0 * intensity;
    this.rimLight.intensity = 1.5 * intensity;
    this.hemisphereLight.intensity = 1.0 * intensity;
  }

  // The complete settings-to-uniform mapping. Called after any change and after
  // any resize, since two uniforms carry the canvas size.
  apply(rawSettings) {
    this.settings = rawSettings;
    if (!this.levelsPass || !this.asciiPass || !this.ditherPass || !this.scene) return;

    const settings = effectiveSettings(rawSettings);
    const { effectType, brightness, contrast, ascii, dither, colors, target } = settings;

    this.updateLighting(settings);

    this.levelsPass.enabled = false;
    this.asciiPass.enabled = false;
    this.ditherPass.enabled = false;

    if (effectType === 'none') {
      let background;
      if (target?.background?.type === 'solid') background = target.background.solidColor || '#eeeeee';
      else if (target?.background?.type === 'transparent') background = null;
      else background = settings.isDark ? '#1f2937' : '#eeeeee';
      this.scene.background = background === null ? null : new THREE.Color(background);
      return;
    }

    this.levelsPass.enabled = true;
    this.levelsPass.uniforms.uBrightness.value = brightness;
    this.levelsPass.uniforms.uContrast.value = contrast;

    const activeColors = colors.palette.filter((_, index) => colors.active[index]);

    let background;
    if (target?.background?.type === 'solid') background = target.background.solidColor || '#eeeeee';
    else if (target?.background?.type === 'transparent') background = null;
    else background = colors.background;

    if (effectType === 'ascii') {
      this.asciiPass.enabled = true;
      this.asciiPass.uniforms.uCharSize.value.set(ascii.resolution, ascii.resolution);
      this.asciiPass.uniforms.uResolution.value.set(this.width, this.height);

      const { texture, count } = createAsciiCharTexture(ascii.characters, ascii.scale, ascii.font);
      if (this.asciiPass.uniforms.uCharSet.value) this.asciiPass.uniforms.uCharSet.value.dispose();
      this.asciiPass.uniforms.uCharSet.value = texture;
      this.asciiPass.uniforms.uCharCount.value = count;

      this.asciiPass.uniforms.uColor.value.set(ascii.color);
      this.asciiPass.uniforms.uUsePalette.value = colors.usePalette;
      this.asciiPass.uniforms.uUseColorTrio.value = ascii.useColorTrio;
      if (ascii.useColorTrio && ascii.colorTrio) {
        this.asciiPass.uniforms.uColorTrio.value = ascii.colorTrio.map((color) => new THREE.Color(color));
      }

      if (colors.usePalette) {
        if (this.asciiPass.uniforms.uPaletteMap.value) this.asciiPass.uniforms.uPaletteMap.value.dispose();
        this.asciiPass.uniforms.uPaletteMap.value = createPaletteTexture(activeColors);
        this.asciiPass.uniforms.uPaletteColorCount.value = activeColors.length;
      } else {
        this.asciiPass.uniforms.uBackgroundColor.value.set(colors.background);
      }
    } else if (effectType === 'bayer' || effectType === 'noise') {
      this.ditherPass.enabled = true;
      this.ditherPass.uniforms.uResolution.value.set(this.width, this.height);
      if (this.ditherPass.uniforms.uPaletteMap.value) this.ditherPass.uniforms.uPaletteMap.value.dispose();
      this.ditherPass.uniforms.uPaletteMap.value = createPaletteTexture(activeColors);
      this.ditherPass.uniforms.uPaletteColorCount.value = activeColors.length;
      this.ditherPass.uniforms.uDitherScale.value = dither.scale;
      if (effectType === 'bayer') {
        this.ditherPass.uniforms.uDitherMode.value = 0;
        this.ditherPass.uniforms.uMatrixType.value = dither.matrixType;
      } else {
        this.ditherPass.uniforms.uDitherMode.value = 1;
      }
    }

    this.scene.background = background === null ? null : new THREE.Color(background);
  }

  start() {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      if (!this.running) return;
      this.frame = requestAnimationFrame(tick);
      this.controls.update();
      this.composer.render();
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  // Renders one frame at a multiple of the canvas size. Both size-carrying
  // uniforms have to follow, or the ASCII cells keep the on-screen scale.
  async exportImage(scale = 1) {
    const width = Math.round(this.width * scale);
    const height = Math.round(this.height * scale);
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    this.asciiPass.uniforms.uResolution.value.set(width, height);
    this.ditherPass.uniforms.uResolution.value.set(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.composer.render();
    const data = this.renderer.domElement.toDataURL('image/png');
    this.setSize(this.width, this.height, this.aspectRatio);
    return data;
  }

  async exportVideo(scale = 1, onProgress) {
    const width = Math.round(this.width * scale);
    const height = Math.round(this.height * scale);
    const durationMs = 5000;
    const fps = 30;

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    this.asciiPass.uniforms.uResolution.value.set(width, height);
    this.ditherPass.uniforms.uResolution.value.set(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const stream = this.renderer.domElement.captureStream(fps);
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find((candidate) => MediaRecorder.isTypeSupported(candidate)) || 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };

    const finished = new Promise((resolve) => { recorder.onstop = resolve; });
    recorder.start();

    const total = Math.round((durationMs / 1000) * fps);
    for (let index = 0; index < total; index += 1) {
      this.controls.update();
      this.composer.render();
      onProgress?.((index + 1) / total);
      await new Promise((resolve) => setTimeout(resolve, 1000 / fps));
    }

    recorder.stop();
    await finished;
    this.setSize(this.width, this.height, this.aspectRatio);
    return URL.createObjectURL(new Blob(chunks, { type: mime }));
  }

  dispose() {
    this.stop();
    this.stopVideo();
    if (this.renderer) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
    }
    this.renderer = null;
  }
}
