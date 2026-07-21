# SPACE POWER — Claude Code Project

## Yfirlit

Retro HTML5 canvas leikur í neon sci-fi stíl. **Ein skrá:** `space_power.html`.  
Engar dependencies, engin build skref — opna í vafra og spila.

---

## Skráarskipulag

```
space_power.html   ← Allt er hér: HTML + CSS + JavaScript
CLAUDE.md          ← Þessi skrá
```

---

## Leikur — Lýsing

Turret stendur í miðju canvas (620×460px). Óvinir koma frá öllum brúnum og stefna í miðjuna.  
Leikmaður snýr turret og skýtur. Powerups koma einnig frá brúnum og hægt er að tína þau eða eyðileggja þau með skotum.

### Stýringar
| Takki | Aðgerð |
|-------|--------|
| ◄ ► (örvatakkar) | Snúa turret |
| Bil (Space) | Skjóta |
| Enter | Byrja / Reyna aftur |
| F | Fullscreen |

---

## Kóðaskipulag (innan `<script>`)

Hlutar eru skiptir með `// ── SECTION ──` athugasemdum:

```
TRANSLATIONS   → T = {is:{...}, en:{...}}, t(key), applyLang(), showMenuOverlay()
AUDIO          → Web Audio API: sqr(), tri(), noise(), seq()
               → Hljóðföll: sndShoot, sndExplode, sndHit, sndPlayerHit,
                             sndWave, sndGameOver (sorglegt moll-lag),
                             sndStart, sndEnemyShoot, sndPowerup, sndShieldBreak, sndShieldHit
               → BGM: bgmTick(), startBGM(), stopBGM()
SETUP          → Canvas, takka handlers, fullscreen
TRANSLATIONS   → Þýðingakerfi (sjá að ofan)
STATE          → Allar global breytur
STARS          → makeStars(n) → array af stjörnum
HELPERS        → glow(), noGlow(), edgePos(), spawnParticles()
SPAWN          → spawnEnemy(), spawnPowerup()
GAME LOGIC     → startGame(), shoot(), enemyShoot(), collectPU(), update()
               → gameOver() — sýnir overlay með þýddum texta
DRAW           → drawBG(), drawTurret(), drawEnemy(), drawPU()
               → drawPUTimers() — teiknar niðurtalningu á canvas (neðst hægra)
               → draw() — aðal teiknifall, kallar á öll ofangreind
LOOP           → loop() = update() + draw() + requestAnimationFrame
```

---

## Stöður (gameState)

```
'menu'     → Upphafsskjár, overlay sýnilegur
'playing'  → Leikur í gangi, BGM spilar
'gameover' → Game over overlay, sorglegt lag spilar
```

---

## Enemies

| Tegund | Lit | HP | Kynnt í bylgju | Hegðun |
|--------|-----|----|----------------|--------|
| `chaser` | Neon orange diamond | 1 | 1 | Stefnir bara í miðjuna |
| `shooter` | Purple hexagon | 2 | 3 | Stefnir í miðjuna + skýtur kúlur |

**Spawn:** `edgePos()` velur slembinn punkt á jaðri canvas.  
**Stýring:** Velocity steering — `vx += (dx/d)*0.025`, hámark `speed = 0.65 + wave*0.1`.  
**Bylgjuþróun:** Á hverja 8 drepin → `wave++`. Óvinir verða hraðari og fleiri.

---

## Powerups

| Tegund | Líkur | Áhrif | Tími (frames/sek) |
|--------|-------|-------|-------------------|
| `life` | 18% | +1 líf (max 6) | Varanleg |
| `shield` | 28% | **Óbrjótanlegur skjöldur** | 480f / 8 sek |
| `rapid` | 27% | 2× hraðari skot (cooldown 7 vs 14) | 420f / 7 sek |
| `triple` | 27% | 3-falt skot (±0.22 rad) | 360f / 6 sek |

**Shield hegðun:** Skjöldurinn brotnar EKKI við högg — hann varir alltaf 8 sekúndur.  
Við högg: `sndShieldHit()` + hvít birting + litlir particles. `shieldHitFlash` breytan stýrir blikki.

**Powerup HP:** Hvert powerup hefur `hp:3`. Þrjú skot eyðileggja það (án verðlauna).  
**Niðurtalning:** Teiknuð á canvas neðst til hægri í `drawPUTimers()`. Verður rauð þegar < 3 sek.

---

## Tungumál

```javascript
var lang = 'is'; // eða 'en'
// Geymt í localStorage: 'spacepower_lang'

t('key')      // skilar þýðingu fyrir núverandi tungumál
applyLang()   // uppfærir allt HTML + PU_DEFS labels
```

Allir textar eru í `T.is` og `T.en` hlutum. **Aldrei hardcode-a texta beint** — alltaf nota `t('key')`.  
Til að bæta við nýjum texta: bæta við lykli í báðar tungumálatöflur og nota `t('nyr_lykill')`.

---

## localStorage

| Lykill | Innihald |
|--------|----------|
| `spacepower_hs` | Hæsta stig (tala) |
| `spacepower_lang` | Tungumál: `'is'` eða `'en'` |

---

## Hljóð — Web Audio API

**Engar external libraries.** Allt er synth-að í rauntíma.

```javascript
sqr(freq, duration, volume)   // Square wave (C64 stíll)
tri(freq, duration, volume)   // Triangle wave (mjúkari)
noise(duration, volume, cutoff) // White noise (lowpass filter)
seq([f1,f2,...], gap, dur, vol) // Arpeggio röð
```

`sndGameOver()` — Sorglegt C moll-lag með echo lagi og bass drone (~5 sek).  
BGM keyrir í `bgmTick()` með `setTimeout` loop. Stoppar þegar leikur er ekki í gangi.

---

## Grafík — Canvas 2D

Allt teiknað með `ctx`. Engar myndir eða spritesheets.

- **Stjörnur:** 120 stk, tviggandi (`twinkle`), mismunandi stærð og hraði
- **Turret:** Glowing neon kjarna + barrel með gradient + snúandi hlífðarhringur
- **Óvinir:** Rótandi vector shape (diamond / hexagon) með glow
- **Skot:** Glowing kúlur með trail (8 punktar)
- **Particles:** Kringlótt agnir sem hverfa smám saman
- **Radar hringir:** Bakgrunnslínur sem gefa tactical feel

```javascript
glow(color, radius)   // Setur ctx.shadowColor + ctx.shadowBlur
noGlow()              // Hreinsar glow (shadowBlur = 0)
```

---

## Þekktar takmarkanir

- Fullscreen stillir canvas CSS stærð en `W`/`H` (620×460) breytast ekki — `drawPUTimers()` notar alltaf pixel-koordinátur á 620×460 canvas
- Ekki stuðningur við snertiskjái (touch)
- Orbitron leturgerð krefst nettengingar (Google Fonts)

---

## Dæmi um breytingar

**Bæta við nýjum powerup:**
1. Bæta við í `PU_DEFS` með lit og `glowCol`
2. Bæta við lykli í `T.is` og `T.en`
3. Bæta við í `spawnPowerup()` líkurútreikningi
4. Bæta við timerbreytu og `collectPU()` logic
5. Bæta við í `drawPUTimers()` slots array
6. Bæta við í `update()` timer countdown

**Breyta bylgjuhraða:**
- `spawnTimer`: `Math.max(25, 90 - wave*8)` — lægra = hraðar
- `enemy.speed`: `0.65 + wave*0.1` — hærra = hraðari óvinir

**Bæta við nýjum enemy type:**
- Bæta við í `spawnEnemy()` með `type` streng
- Bæta við teiknilogic í `drawEnemy(e)` með `if(e.type==='nyrtype')`

---

## © 2026 Sigurður Ingi Kjartansson
