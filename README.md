# `<wistia-video>`

A custom element (web component) for the JW player.

The element API matches the HTML5 `<video>` tag, so it can be easily swapped with other media, and be compatible with other UI components that work with the video tag.

One of the goals was to have `<wistia-video>` seamlessly integrate with [Media Chrome](https://github.com/muxinc/media-chrome).

> 🙋 Looking for a YouTube video element? Check out [`<youtube-video>`](https://github.com/muxinc/youtube-video-element).

## Example ([CodeSandbox](https://codesandbox.io/s/wistia-video-element-gm5qd1))

<!-- prettier-ignore -->
```html
<script type="module" src="https://unpkg.com/wistia-video-element@0"></script>
<wistia-video controls src="https://wesleyluyten.wistia.com/medias/oifkgmxnkb"></wistia-video>
```

## Installing

`<wistia-video>` is packaged as a javascript module (es6) only, which is supported by all evergreen browsers and Node v12+.

### Loading into your HTML using `<script>`

<!-- prettier-ignore -->
```html
<script type="module" src="https://unpkg.com/wistia-video-element@0"></script>
```

### Adding to your app via `npm`

```bash
npm install wistia-video-element --save
```

Or yarn

```bash
yarn add wistia-video-element
```

Include in your app javascript (e.g. src/App.js)

```js
import 'wistia-video-element';
```

This will register the custom elements with the browser so they can be used as HTML.
