import { getCurrentWindow, Window } from "@tauri-apps/api/window";

export async function showMainWindow() {
  const main = await Window.getByLabel("main");
  const companion = await Window.getByLabel("companion");
  await main?.show();
  await main?.setFocus();
  await companion?.hide();
}

export async function hideMainToCompanion() {
  const main = await Window.getByLabel("main");
  const companion = await Window.getByLabel("companion");
  await companion?.show();
  await main?.hide();
}

export async function hideCompanion() {
  await (await Window.getByLabel("companion"))?.hide();
}

export async function startCompanionDragging() {
  await getCurrentWindow().startDragging();
}
