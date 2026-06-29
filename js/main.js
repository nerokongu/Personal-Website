import { initDevice } from "./device.js";
import { initAudioPlayer } from "./audio-player.js";
import { initPreloader } from "./preloader.js";
import { initVolume } from "./volume.js";
import { initMenu } from "./menu.js";
import { initContact } from "./contact.js";
import { initBmwEngine } from "./bmw-engine.js";

import { initDust } from "./effects/dust.js";
import { initGlow } from "./effects/glow.js";
import { initMusicBackground } from "./effects/music-bg.js";
import { initMovieBackground } from "./effects/movie-bg.js";

import { initMusicPage } from "./pages/music-page.js";
import { initMoviePage } from "./pages/movie-page.js";

initDevice();

const audioSystem = initAudioPlayer();

initPreloader(audioSystem);
initVolume(audioSystem);
initMenu();
initContact();

initDust();
initGlow(audioSystem);
initMusicBackground(audioSystem);
initMovieBackground();

initMusicPage(audioSystem);
initMoviePage();
initBmwEngine(audioSystem);