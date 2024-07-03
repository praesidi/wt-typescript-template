const GLOBAL: { "IS_DEBUG"?: boolean } = {};
GLOBAL["IS_DEBUG"] = tools_web.is_true(Param.IS_DEBUG);

function Log(value: any) {
  if (GLOBAL["IS_DEBUG"]) alert(value);
}

function Main() {
  try {
    Log(GLOBAL["IS_DEBUG"]);
  } catch (e) {
    throw Error("Main -> " + e.message);
  }
}

Log("----------------Начало. Агент------------------");

let mainTimer = DateToRawSeconds(Date());
try {
  Main();
} catch (e) {
  Log(e.message);
}

mainTimer = DateToRawSeconds(Date()) - mainTimer;
Log("Агент завершил свою работу за " + mainTimer + " секунд");
Log("----------------Конец. Агент------------------");