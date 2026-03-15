# Peaks Challenge Pacing Calculator

🚴 A simple pacing calculator for [Peaks Challenge Falls Creek](https://bicyclenetwork.com.au/rides-and-events/peaks-challenge/) — Australia's toughest one-day cycling challenge.

**235km | 4,400m+ climbing | 13 hour time limit**

## Live Calculator

👉 **[jimbo7ron.github.io/peaks-calc](https://jimbo7ron.github.io/peaks-calc/)**

## Features

- **Strava Import** — pull your actual climbing power from past efforts on the three main climbs
- **Power-based predictions** — input your target climbing and flat power
- **W/kg display** — see your power-to-weight ratio
- **Segment breakdown** — predicted times for each section
- **Validated against real data** — calibrated using 2025 Peaks Challenge results

## Strava Integration

Click **"Import from Strava"** to fetch your segment efforts for:
- **Tawonga Gap** (Segment ID: 634373)
- **Mt Hotham** (Segment ID: 610370)
- **Falls Creek - East Side** aka Back of Falls (Segment ID: 639129)

The calculator weights your power data based on climb difficulty and position in the race:
- Tawonga: 15% weight (short, fresh legs)
- Hotham: 45% weight (longest climb, mid-race)
- Falls: 40% weight (final climb, fatigued)

**Getting your token:** Go to [Strava API Settings](https://www.strava.com/settings/api) → copy "Your Access Token"

*Note: Uses a CORS proxy for browser requests. For production deployment, set up your own proxy endpoint.*

## How It Works

Enter your:
- **Climbing Power** — average watts you expect to hold across all climbs (account for fatigue!)
- **Flat Power** — watts on descents and flat sections
- **System Weight** — rider + bike + gear
- **Rest Stop Time** — total time stopped at aid stations

The calculator uses physics-based modeling with real-world calibration to predict your finish time.

## Accuracy

Validated against 2025 Peaks Challenge finish data:
- At 210W climbing / 170W flat / 82kg → predicts 8:31 vs actual 8:34 (**3 min difference**)

See the "Assumptions & Methodology" section in the calculator for full details.

## Contributing

Found a bug? Have segment data to improve accuracy? Want to add a feature?

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to submit changes.

## Disclaimer

Estimates only. Actual times depend on conditions, pacing, nutrition, weather, and many other factors. Use for planning purposes only.

## License

MIT — use it, fork it, improve it.
