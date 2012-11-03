#include "runtime.h"

void con_main();

void setup() {
    Serial.begin(9600);
    pinMode(PIEZO_PIN, OUTPUT);
    con_main();
    noTone(PIEZO_PIN);
}

void loop() {
}
