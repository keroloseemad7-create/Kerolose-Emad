import { Config } from '@remotion/cli/config';

// Use the Chromium already on this machine; delete this line on a machine where Remotion can download its own.
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
