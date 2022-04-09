// https://wistia.com/support/developers/player-api
import VideoBaseElement from './video-base-element.js';
import { loadScript, promisify, publicPromise } from './utils.js';

const templateLightDOM = document.createElement('template');
templateLightDOM.innerHTML = `
<style class="wistia_style">
  .wistia_embed {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
<div class="wistia_embed"></div>
`;

const templateShadowDOM = document.createElement('template');
templateShadowDOM.innerHTML = `
<style>
  :host {
    display: block;
    width: 100%;
    position: relative;
    background: #000;
  }
</style>
<slot></slot>
`;

class WistiaVideoElement extends VideoBaseElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(templateShadowDOM.content.cloneNode(true));
  }

  get nativeEl() {
    return this.api?.elem();
  }

  async load() {
    if (this.hasLoaded) this.loadComplete = publicPromise();
    this.hasLoaded = true;

    const MATCH_SRC = /(?:wistia\.com|wi\.st)\/(?:medias|embed)\/(.*)$/i;
    const [, id] = this.src.match(MATCH_SRC);
    const options = {
      autoPlay: this.autoplay,
      preload: this.preload ?? 'metadata',
      playsinline: this.playsInline,
      endVideoBehavior: this.loop && 'loop',
      chromeless: !this.controls,
      playButton: this.controls,
      muted: this.muted,
    };

    // Sadly the setup/render will not work in the shadow DOM.
    this.querySelector('.wistia_style')?.remove();
    this.querySelector('.wistia_embed')?.remove();
    this.append(templateLightDOM.content.cloneNode(true));

    const div = this.querySelector('.wistia_embed');
    div.classList.add(`wistia_async_${id}`);

    const scriptUrl = 'https://fast.wistia.com/assets/external/E-v1.js';
    await loadScript(scriptUrl, 'Wistia');
    const onReadyPromise = publicPromise();
    const onReady = onReadyPromise.resolve;
    window._wq.push({
      id,
      onReady,
      options,
    });

    this.api = await onReadyPromise;

    this.dispatchEvent(new Event('loadcomplete'));
    this.loadComplete.resolve();

    await this.loadComplete;

    this.dispatchEvent(new Event('durationchange'));
  }

  async attributeChangedCallback(attrName, oldValue, newValue) {
    // This is required to come before the await for resolving loadComplete.
    if (attrName === 'src' && newValue) {
      this.load();
      return;
    }

    super.attributeChangedCallback(attrName, oldValue, newValue);

    // Don't await super.attributeChangedCallback above, it would resolve later.
    await this.loadComplete;

    switch (attrName) {
      case 'controls':
        this.api.bigPlayButtonEnabled(this.controls);
        this.controls
          ? this.api.releaseChromeless()
          : this.api.requestChromeless();
        break;
    }
  }

  // Override some methods w/ defaults if the video element is not ready yet when called.
  // Some methods require the Wistia API instead of the native video element API.

  get duration() {
    return this.api?.duration();
  }

  play() {
    // wistia.play doesn't return a play promise.
    this.api.play();
    return promisify(this.addEventListener.bind(this))('playing');
  }

  // If the getter from VideoBaseElement is overriden, it's required to define
  // the setter again too unless it's a readonly property! It's a JS thing.

  get src() {
    return this.getAttribute('src');
  }

  set src(val) {
    if (this.src == val) return;
    this.setAttribute('src', val);
  }

  get controls() {
    return this.hasAttribute('controls');
  }

  set controls(val) {
    if (this.controls == val) return;

    if (val) {
      this.setAttribute('controls', '');
    } else {
      // Remove boolean attribute if false, 0, '', null, undefined.
      this.removeAttribute('controls');
    }
  }
}

if (window.customElements.get('wistia-video') || window.WistiaVideoElement) {
  console.debug('WistiaVideoElement: <wistia-video> defined more than once.');
} else {
  window.WistiaVideoElement = WistiaVideoElement;
  window.customElements.define('wistia-video', WistiaVideoElement);
}

export default WistiaVideoElement;
