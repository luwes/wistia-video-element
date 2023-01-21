import { fixture, assert, aTimeout } from "@open-wc/testing";

describe("<wistia-video>", () => {
  it("has a video like API", async function () {
    this.timeout(10000);

    const player = await fixture(`<wistia-video
      src="https://wesleyluyten.wistia.com/medias/oifkgmxnkb"
    ></wistia-video>`);

    assert.equal(player.paused, true, "is paused on initialization");

    await player.loadComplete;

    assert.equal(player.paused, true, "is paused on initialization");
    assert(!player.ended, "is not ended");

    assert(!player.loop, "loop is false by default");
    player.loop = true;
    assert(player.loop, "loop is true");

    assert.equal(player.volume, 1, "is all turned up");
    player.volume = 0.5;
    assert.equal(player.volume, 0.5, "is half volume");

    player.muted = true;
    assert(player.muted, "is muted");

    assert.equal(Math.round(player.duration), 115, `is 115s long`);

    const loadComplete = player.loadComplete;

    player.src = 'https://wesleyluyten.wistia.com/medias/oj8d7cwhbn';
    await player.loadComplete;

    assert(loadComplete != player.loadComplete, 'creates a new promise after new src');

    assert.equal(Math.round(player.duration), 20, `is 20s long`);

    player.src = 'https://wesleyluyten.wistia.com/medias/1ekn652fs5';
    await player.loadComplete;

    assert.equal(Math.round(player.duration), 90, `is 90s long`);

    try {
      await player.play();
    } catch (error) {
      console.warn(error);
    }
    assert(!player.paused, "is playing after player.play()");

    await aTimeout(1000);

    assert.equal(String(Math.round(player.currentTime)), 1, "is about 1s in");

    player.playbackRate = 2;
    await aTimeout(1000);

    assert.equal(String(Math.round(player.currentTime)), 3, "is about 3s in");
  });
});
