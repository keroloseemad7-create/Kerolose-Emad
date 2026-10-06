import {Config} from '@remotion/cli/config';
import fs from 'fs';

// Use a locally installed Chromium headless shell when one is available
// (e.g. sandboxed environments where Remotion can't download its own).
const LOCAL_SHELL = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(LOCAL_SHELL)) {
  Config.setBrowserExecutable(LOCAL_SHELL);
}
Config.setVideoImageFormat('jpeg');
Config.setConcurrency(null);
