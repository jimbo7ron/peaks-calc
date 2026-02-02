// Peaks Challenge Falls Creek - Course Segments
// 235km, 4,400m+ elevation

const SEGMENTS = [
    { id: 'descent-start', name: 'Falls Creek → Mt Beauty', distance: 30, elevation: -900, type: 'descent', avgGradient: -3.0 },
    { id: 'tawonga-gap', name: 'Tawonga Gap', distance: 7.5, elevation: 476, type: 'climb', avgGradient: 6.3 },
    { id: 'descent-germantown', name: 'Tawonga → Harrietville', distance: 32.5, elevation: -350, type: 'flat', avgGradient: -1.1 },
    { id: 'mt-hotham', name: 'Mt Hotham (HC)', distance: 29.9, elevation: 1303, type: 'climb', avgGradient: 4.4 },
    { id: 'hotham-omeo', name: 'Hotham → Omeo', distance: 50, elevation: -800, type: 'descent', avgGradient: -1.6 },
    { id: 'bingo-gap', name: 'Bingo Gap', distance: 8, elevation: 180, type: 'climb', avgGradient: 2.3 },
    { id: 'anglers-rest', name: 'Omeo → Anglers Rest', distance: 30, elevation: -200, type: 'flat', avgGradient: -0.7 },
    { id: 'back-of-falls', name: 'Back of Falls (HC)', distance: 22.6, elevation: 980, type: 'climb', avgGradient: 4.3 },
    { id: 'plateau-finish', name: 'Plateau → Finish', distance: 24.4, elevation: -100, type: 'flat', avgGradient: -0.4 }
];

// Physics constants
const GRAVITY = 9.81;
const CRR = 0.004;

// DOM Elements
const climbPowerSlider = document.getElementById('climb-power');
const flatPowerSlider = document.getElementById('flat-power');
const weightSlider = document.getElementById('weight');
const stopsSlider = document.getElementById('stops');

const climbPowerValue = document.getElementById('climb-power-value');
const flatPowerValue = document.getElementById('flat-power-value');
const weightValue = document.getElementById('weight-value');
const stopsValue = document.getElementById('stops-value');

const totalTimeEl = document.getElementById('total-time');
const timeMarginEl = document.getElementById('time-margin');
const climbTimeEl = document.getElementById('climb-time');
const segmentRowsEl = document.getElementById('segment-rows');

// Calculate climbing speed from power
function climbSpeed(powerWatts, weightKg, gradientPercent) {
    const gradient = gradientPercent / 100;
    const resistanceForce = weightKg * GRAVITY * (gradient + CRR);
    const speedMs = powerWatts / resistanceForce;
    return Math.max(speedMs * 3.6, 4); // km/h, min 4
}

// Calculate flat/descent speed
function flatSpeed(powerWatts, gradientPercent) {
    if (gradientPercent < -1.5) {
        // Descent - conservative speeds
        const baseSpeed = 38;
        const bonus = Math.min(Math.abs(gradientPercent) * 3, 12);
        return Math.min(baseSpeed + bonus, 50);
    }
    // Flat/rolling - simple power-based estimate
    // ~32 km/h at 180W, scales roughly with cube root
    const baseSpeed = 32 * Math.pow(powerWatts / 180, 0.33);
    const gradientAdjust = gradientPercent * -1.5;
    return Math.max(baseSpeed + gradientAdjust, 25);
}

// Calculate segment time
function calcSegmentTime(segment, climbPower, flatPower, weight) {
    let speed;
    if (segment.type === 'climb') {
        speed = climbSpeed(climbPower, weight, segment.avgGradient);
    } else {
        speed = flatSpeed(flatPower, segment.avgGradient);
    }
    return {
        speed: speed,
        timeHours: segment.distance / speed
    };
}

// Format time
function formatTime(hours) {
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatTimeShort(hours) {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
}

// Main calculation
function calculate() {
    const climbPower = parseInt(climbPowerSlider.value);
    const flatPower = parseInt(flatPowerSlider.value);
    const weight = parseFloat(weightSlider.value);
    const stopsMinutes = parseInt(stopsSlider.value);
    
    let cumulativeTime = 0;
    let climbingTime = 0;
    
    segmentRowsEl.innerHTML = '';
    
    SEGMENTS.forEach(segment => {
        const result = calcSegmentTime(segment, climbPower, flatPower, weight);
        cumulativeTime += result.timeHours;
        
        if (segment.type === 'climb') {
            climbingTime += result.timeHours;
        }
        
        const row = document.createElement('div');
        row.className = 'segment-row';
        row.innerHTML = `
            <span class="${segment.type}">${segment.name}</span>
            <span>${segment.distance} km</span>
            <span>${segment.elevation > 0 ? '+' : ''}${segment.elevation} m</span>
            <span>${result.speed.toFixed(1)} km/h</span>
            <span>${formatTimeShort(result.timeHours)}</span>
            <span>${formatTime(cumulativeTime)}</span>
        `;
        segmentRowsEl.appendChild(row);
    });
    
    const totalTime = cumulativeTime + (stopsMinutes / 60);
    
    totalTimeEl.textContent = formatTime(totalTime);
    climbTimeEl.textContent = formatTime(climbingTime);
    
    const marginHours = 13 - totalTime;
    const marginMinutes = Math.round(marginHours * 60);
    
    if (marginHours > 1) {
        timeMarginEl.textContent = `+${formatTimeShort(marginHours)}`;
        timeMarginEl.className = 'summary-value success';
    } else if (marginHours > 0) {
        timeMarginEl.textContent = `+${marginMinutes} min`;
        timeMarginEl.className = 'summary-value warning';
    } else {
        timeMarginEl.textContent = `${marginMinutes} min`;
        timeMarginEl.className = 'summary-value danger';
    }
}

// Update displays
function updateDisplays() {
    climbPowerValue.textContent = climbPowerSlider.value;
    flatPowerValue.textContent = flatPowerSlider.value;
    weightValue.textContent = weightSlider.value;
    stopsValue.textContent = stopsSlider.value;
    calculate();
}

// Event listeners
climbPowerSlider.addEventListener('input', updateDisplays);
flatPowerSlider.addEventListener('input', updateDisplays);
weightSlider.addEventListener('input', updateDisplays);
stopsSlider.addEventListener('input', updateDisplays);

// URL params
const params = new URLSearchParams(window.location.search);
if (params.has('climb')) climbPowerSlider.value = params.get('climb');
if (params.has('flat')) flatPowerSlider.value = params.get('flat');
if (params.has('weight')) weightSlider.value = params.get('weight');
if (params.has('stops')) stopsSlider.value = params.get('stops');

updateDisplays();
