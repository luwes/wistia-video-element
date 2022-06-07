// https://wistia.com/support/developers/player-api
import { SuperVideoElement } from 'super-media-element';
import { loadScript, promisify, PublicPromise } from './utils.js';

const templateLightDOM = document.createElement('template');
templateLightDOM.innerHTML = `
<div class="wistia_embed"></div>
`;

const templateShadowDOM = document.createElement('template');
templateShadowDOM.innerHTML = `
<style>
  :host {
    width: 100%;
  }
</style>
`;

class WistiaVideoElement extends SuperVideoElement {
  constructor() {
    super();
    this.shadowRoot.append(templateShadowDOM.content.cloneNode(true));

    this.loadComplete = new PublicPromise();
  }

  get nativeEl() {
    return this.api?.elem();
  }

  async load() {
    if (this.hasLoaded) this.loadComplete = new PublicPromise();
    this.hasLoaded = true;

    // Wait 1 tick to allow other attributes to be set.
    await Promise.resolve();

    const MATCH_SRC = /(?:wistia\.com|wi\.st)\/(?:medias|embed)\/(.*)$/i;
    const [, id] = this.src.match(MATCH_SRC);
    const options = {
      autoPlay: this.autoplay,
      preload: this.preload ?? 'metadata',
      playsinline: this.playsInline,
      endVideoBehavior: this.loop && 'loop',
      chromeless: !this.controls,
      playButton: this.controls,
      muted: this.defaultMuted,
    };

    // Sadly the setup/render will not work in the shadow DOM.
    this.querySelector('.wistia_embed')?.remove();
    this.append(templateLightDOM.content.cloneNode(true));

    const div = this.querySelector('.wistia_embed');
    div.classList.add(`wistia_async_${id}`);

    const scriptUrl = 'https://fast.wistia.com/assets/external/E-v1.js';
    await loadScript(scriptUrl, 'Wistia');

    this.api = await new Promise((onReady) => {
      globalThis._wq.push({
        id,
        onReady,
        options,
      });
    });

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

  // If the getter from SuperVideoElement is overriden, it's required to define
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

if (
  globalThis.customElements.get('wistia-video') ||
  globalThis.WistiaVideoElement
) {
  console.debug('WistiaVideoElement: <wistia-video> defined more than once.');
} else {
  globalThis.WistiaVideoElement = WistiaVideoElement;
  globalThis.customElements.define('wistia-video', WistiaVideoElement);
}

export default WistiaVideoElement;
