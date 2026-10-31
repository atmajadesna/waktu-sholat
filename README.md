<div align="center">

# Waktu Sholat

**Five daily prayer times computed from the sun's position, with adhan reminders, qibla compass, and tasbih counter.**

[![Demo](https://img.shields.io/badge/demo-live-b07d2a?style=flat-square)](https://atmajadesna.github.io/waktu-sholat/)
![No build step](https://img.shields.io/badge/build-none-2f6f4f?style=flat-square)
![MIT License](https://img.shields.io/badge/license-MIT-1f4e79?style=flat-square)

<a href="https://atmajadesna.github.io/waktu-sholat/"><img src="docs/screenshot.jpg" alt="Waktu Sholat screenshot" width="100%"></a>

</div>

## Background

Most prayer-time apps fetch schedules from a server and stop working offline. This application computes prayer times on the device from coordinates and date, without any network requests.

## Technical notes

**Computed, not fetched.** The sun's position (declination and equation of time) is derived from the Julian Day, then hour angles are computed for each prayer: `cos t = (−sin a − sin δ · sin φ) / (cos δ · cos φ)`. Asr uses the shadow-angle formula `arccot(1 + tan|φ − δ|)`. Results are converted to the city's time zone.

**Matches Kemenag schedules.** For Surakarta using the Kemenag method (20° / 18°), all times match Aladhan API output under the same method to the minute, including Imsak, Syuruq, and Asr.

**Fajr adhan is handled separately.** The Fajr adhan adds "ash-shalatu khairun minan-naum" after "hayya 'alal-falah". This phrase is shown on the main card when the next prayer is Fajr, marked on the Fajr row in the schedule, and explained on the Fajr Notes card with its hadith source (Bukhari no. 615, Muslim no. 644).

**Great-circle qibla bearing.** `atan2(sin Δλ · cos φ₂, cos φ₁ · sin φ₂ − sin φ₁ · cos φ₂ · cos Δλ)` toward the Kaaba (21.4225° N, 39.8262° E), shown on a compass with the distance to the Kaaba. If the device has an orientation sensor, the needle follows device rotation.

**Locally stored adhan audio.** A 42-second MP3 loads from the same directory, plays when a prayer time arrives (with user permission), and is followed by an iqamah countdown.

## Features

- Imsak, Fajr, Syuruq, Dhuhr, Asr, Maghrib, and Isha schedules for 18 Indonesian cities.
- Calculation methods: Kemenag RI, Muslim World League, ISNA, Umm al-Qura, Egyptian.
- Manual minute corrections, 12/24-hour format, and device geolocation when permitted.
- Countdown to adhan, updated every second.
- Automatic adhan, pre-adhan reminders, browser notifications, and iqamah countdown.
- Qibla compass with Kaaba marker, bearing degrees, distance, and cardinal direction.
- Digital tasbih with 33 / 99 / 100 targets and a lap counter.
- Daily prayer log with streak tracking and a full monthly schedule.
- Hijri date via the browser's built-in `islamic-umalqura` calendar.
- All settings saved in `localStorage`; no data is sent externally.

## Run locally

```bash
python3 -m http.server 8000
```

No dependencies or build step required. Opening `index.html` directly also works, but audio playback and geolocation are more reliable through a local server.

## File structure

```
index.html    page structure
app.js        prayer calculation, qibla, audio, and storage
styles.css    layout and interface components
tokens.css    colors, type sizes, and spacing as variables
audio/        adhan recording (MP3)
```

## Limitations

- Reminders run only while the page is open; there are no background notifications because there is no server or service worker.
- A 1–2 minute difference from official schedules can occur due to method differences, elevation, and rounding. Official Kemenag schedules remain the reference.
- The device compass works only on devices with an orientation sensor and requires permission; without a sensor, the bearing is displayed as degrees from true north.

## Credits

Adhan recording: **Shaykh Kamil Najdi**, muezzin of Masjid Nabawi, Madinah — file `كامل نجدي` from the [*Azaan of World Mosques*](https://archive.org/details/azaan-of-world-mosques-english) collection on Internet Archive, released under [Public Domain Mark 1.0](https://creativecommons.org/publicdomain/mark/1.0/). The file was loudness-normalized and converted to MP3 without content changes.

Built with JavaScript, CSS, and HTML, without any framework.
