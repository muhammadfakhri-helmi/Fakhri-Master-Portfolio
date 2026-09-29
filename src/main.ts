import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/sections.css";
import "./styles/work.css";
import "./styles/evidence.css";

import { defineCharacterSequence } from "./character/character-sequence";
import { initEvidenceWindows } from "./lib/evidence-window";
import { initFiscal } from "./lib/fiscal";
import { initHeader } from "./lib/header";
import { initLiveDialog } from "./lib/live-dialog";
import { initReveal } from "./lib/reveal";
import { initSteps } from "./lib/steps";
import { initTheme } from "./lib/theme";

initTheme();
defineCharacterSequence();
initHeader();
initReveal();
initSteps(initEvidenceWindows());
initFiscal();
initLiveDialog();
