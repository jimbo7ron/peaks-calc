// Peaks Challenge Falls Creek - Course Segments
// Based on official route: 235km, 4,400m+ elevation
// Validated against actual results from 2024 event and cycling-inform benchmarks

const SEGMENTS = [
    {
        id: 'descent-start',
        name: 'Falls Creek → Mt Beauty',
        distance: 30,
        elevation: -900,
        type: 'descent',
        avgGradient: -3.0,
        cumulativeKm: 30
    },
    {
        id: 'tawonga-gap',
        name: 'Tawonga Gap',
        distance: 7.5,
        elevation: 476,
        type: 'climb',
        avgGradient: 6.3,
        cumulativeKm: 37.5,
        benchmark: { min: 28, max: 35, unit: 'min' }  // Cycling-Inform data
    },
    {
        id: 'descent-germantown',
        name: 'Tawonga → Harrietville',
        distance: 32.5,
        elevation: -350,
        type: 'descent',
        avgGradient: -1.1,
        cumulativeKm: 70
    },
    {
        id: 'mt-hotham',
        name: 'Mt Hotham (HC)',
        distance: 29.9,
        elevation: 1303,
        type: 'climb',
        avgGradient: 4.4,
        cumulativeKm: 100,
        benchmark: { min: 100, max: 140, unit: 'min' }  // 1:40 - 2:20
    },
    {
        id: 'hotham-omeo',
        name: 'Hotham → Omeo',
        distance: 50,
        elevation: -800,
        type: 'descent',
        avgGradient: -1.6,
        cumulativeKm: 150,
        notes: 'Includes short steep pinches'
    },
    {
        id: 'bingo-gap',
        name: 'Bingo Gap',
        distance: 8,
        elevation: 180,
        type: 'climb',
        avgGradient: 2.3,
        cumulativeKm: 158
    },
    {
        id: 'anglers-rest',
        name: 'Omeo → Anglers Rest',
        distance: 30,
        elevation: -200,
        type: 'flat',
        avgGradient: -0.7,
        cumulativeKm: 188
    },
    {
        id: 'back-of-falls-steep',
        name: 'Back of Falls (Steep)',
        distance: 9,
        elevation: 630,  // Steeper first section - adjusted based on real times
        type: 'climb',
        avgGradient: 7.0,  // First 9km averages ~7% with 10-17% sections
        cumulativeKm: 197,
        notes: 'Includes WTF Corner (17%!)'
    },
    {
        id: 'back-of-falls-upper',
        name: 'Back of Falls (Upper)',
        distance: 13.6,
        elevation: 350,
        type: 'climb',
        avgGradient: 2.6,  // Easier upper section to Trapyard Gap and beyond
        cumulativeKm: 210.6,
        benchmark: { min: 94, max: 165, unit: 'min', combined: 'back-of-falls-steep' }  // Your time: 1:34
    },
    {
        id: 'plateau-finish',
        name: 'Plateau → Finish',
        distance: 24.4,
        elevation: -100,
        type: 'flat',
        avgGradient: -0.4,
        cumulativeKm: 235
    }
];

// Physical constants
const GRAVITY = 9.81; // m/s²
const AIR_DENSITY = 1.05; // kg/m³ (alpine altitude, ~1500m avg)
const CDA = 0.35; // drag coefficient * frontal area (hoods/drops)
const CRR = 0.004; // rolling resistance coefficient

// Fatigue model - power degrades as ride progresses
// Calibrated against 2025 data: VAM dropped from 1058 to 626 m/hr (60% of start)
function getFatigueFactor(cumulativeKm, fatigueResistance) {
    // fatigueResistance: 0 = severe fatigue, 100 = elite endurance
    // At 200km with 70% resistance (good training), power ~60% of start
    // At 200km with 0% resistance, power ~40% of start
    
    const baseDegradation = 0.002; // per km at 0 resistance (more aggressive)
    const resistanceEffect = fatigueResistance / 100; // 0-1
    const adjustedDegradation = baseDegradation * (1 - resistanceEffect * 0.65);
    
    const fatigue = 1 - (cumulativeKm * adjustedDegradation);
    return Math.max(fatigue, 0.35); // Floor at 35% power (severe bonk)
}

// DOM Elements
const ftpSlider = document.getElementById('ftp');
const weightSlider = document.getElementById('weight');
const intensitySlider = document.getElementById('intensity');
const fatigueSlider = document.getElementById('fatigue');
const stopsSlider = document.getElementById('stops');

const ftpValue = document.getElementById('ftp-value');
const weightValue = document.getElementById('weight-value');
const intensityValue = document.getElementById('intensity-value');
const fatigueValue = document.getElementById('fatigue-value');
const stopsValue = document.getElementById('stops-value');

const totalTimeEl = document.getElementById('total-time');
const timeMarginEl = document.getElementById('time-margin');
const wkgEl = document.getElementById('wkg');
const segmentRowsEl = document.getElementById('segment-rows');

const toggleBacktestBtn = document.getElementById('toggle-backtest');
const backtestInputsEl = document.getElementById('backtest-inputs');
const backtestFieldsEl = document.getElementById('backtest-fields');
const runBacktestBtn = document.getElementById('run-backtest');
const backtestResultsEl = document.getElementById('backtest-results');

// State
let backtestEnabled = false;

// Calculate speed for a segment based on power and gradient
// Calibrated against actual 2025 Peaks data
function calculateSpeed(powerWatts, weightKg, gradientPercent, cumulativeKm = 0) {
    const gradient = gradientPercent / 100;
    
    if (gradientPercent > 2) {
        // Climbing - gravity dominant
        // v = P / (m * g * (gradient + Crr))
        const resistanceForce = weightKg * GRAVITY * (gradient + CRR);
        const speedMs = powerWatts / resistanceForce;
        return Math.max(speedMs * 3.6, 4); // Convert to km/h, minimum 4 km/h
    } else if (gradientPercent < -1.5) {
        // Descending - much more conservative based on real data
        // Real descent averages are ~35-45 km/h, not 50-65
        const baseSpeed = 35; // km/h base descent speed
        const gradientBonus = Math.min(Math.abs(gradientPercent) * 3, 15);
        // Fatigue slows descents too (less aggressive braking, more caution)
        const fatiguePenalty = cumulativeKm > 100 ? (cumulativeKm - 100) * 0.03 : 0;
        return Math.min(baseSpeed + gradientBonus - fatiguePenalty, 50);
    } else {
        // Flat/rolling - much slower than pure physics due to:
        // - Group dynamics, drafting inefficiency
        // - Micro-stops, intersections
        // - Mental fatigue
        // Real data: 132km of flats/descents in 5:01 = 26.4 km/h avg
        const baseFlatSpeed = 30; // km/h realistic flat cruising
        const powerBonus = (powerWatts - 150) * 0.03; // Small bonus for higher power
        const gradientAdjust = gradientPercent * -1.5;
        return Math.max(baseFlatSpeed + powerBonus + gradientAdjust, 22);
    }
}

// Calculate segment time with fatigue
function calculateSegmentTime(segment, basePowerWatts, weightKg, fatigueResistance) {
    const fatigueFactor = getFatigueFactor(segment.cumulativeKm, fatigueResistance);
    const effectivePower = basePowerWatts * fatigueFactor;
    const speed = calculateSpeed(effectivePower, weightKg, segment.avgGradient, segment.cumulativeKm);
    const timeHours = segment.distance / speed;
    
    return {
        speed: speed,
        timeHours: timeHours,
        timeSeconds: timeHours * 3600,
        effectivePower: effectivePower,
        fatigueFactor: fatigueFactor
    };
}

// Format time from hours to HH:MM:SS
function formatTime(hours) {
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Format time from hours to H:MM
function formatTimeShort(hours) {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
}

// Main calculation function
function calculate() {
    const ftp = parseInt(ftpSlider.value);
    const weight = parseFloat(weightSlider.value);
    const intensity = parseInt(intensitySlider.value) / 100;
    const fatigueResistance = parseInt(fatigueSlider.value);
    const stopsMinutes = parseInt(stopsSlider.value);
    
    const climbingPower = ftp * intensity;
    const wkg = (ftp / weight).toFixed(2);
    
    // Update W/kg display
    wkgEl.textContent = wkg;
    
    // Calculate each segment
    let cumulativeTime = 0;
    let segmentResults = [];
    
    segmentRowsEl.innerHTML = '';
    
    SEGMENTS.forEach(segment => {
        const result = calculateSegmentTime(segment, climbingPower, weight, fatigueResistance);
        cumulativeTime += result.timeHours;
        
        segmentResults.push({
            segment: segment,
            ...result,
            cumulativeTime: cumulativeTime
        });
        
        // Create row
        const row = document.createElement('div');
        row.className = 'segment-row';
        
        // Show fatigue % for climbs
        const fatigueIndicator = segment.type === 'climb' 
            ? ` <span class="fatigue-indicator">(${Math.round(result.fatigueFactor * 100)}%)</span>` 
            : '';
        
        row.innerHTML = `
            <span class="${segment.type}">${segment.name}${fatigueIndicator}</span>
            <span>${segment.distance} km</span>
            <span>${segment.elevation > 0 ? '+' : ''}${segment.elevation} m</span>
            <span>${result.speed.toFixed(1)} km/h</span>
            <span>${formatTimeShort(result.timeHours)}</span>
            <span>${formatTime(cumulativeTime)}</span>
        `;
        segmentRowsEl.appendChild(row);
    });
    
    // Add rest stops
    const totalRidingTime = cumulativeTime;
    const totalTime = cumulativeTime + (stopsMinutes / 60);
    
    // Update summary
    totalTimeEl.textContent = formatTime(totalTime);
    
    // Time margin (13 hour limit)
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
    
    return segmentResults;
}

// Update display values
function updateDisplays() {
    ftpValue.textContent = ftpSlider.value;
    weightValue.textContent = weightSlider.value;
    intensityValue.textContent = intensitySlider.value;
    fatigueValue.textContent = fatigueSlider.value;
    stopsValue.textContent = stopsSlider.value;
    calculate();
}

// Setup backtest fields
function setupBacktest() {
    backtestFieldsEl.innerHTML = '';
    SEGMENTS.forEach(segment => {
        const field = document.createElement('div');
        field.className = 'backtest-field';
        field.innerHTML = `
            <label for="bt-${segment.id}">${segment.name}</label>
            <input type="text" id="bt-${segment.id}" placeholder="H:MM" data-segment="${segment.id}">
        `;
        backtestFieldsEl.appendChild(field);
    });
}

// Parse time input (H:MM or MM)
function parseTimeInput(value) {
    if (!value || value.trim() === '') return null;
    
    const parts = value.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) + parseInt(parts[1]) / 60;
    } else if (parts.length === 1) {
        return parseInt(parts[0]) / 60;
    }
    return null;
}

// Run backtest analysis
function runBacktest() {
    const results = calculate();
    let analysis = '<h4>Backtest Analysis</h4>';
    let totalActual = 0;
    let totalPredicted = 0;
    let segmentsWithData = 0;
    
    let comparisons = [];
    
    SEGMENTS.forEach((segment, i) => {
        const input = document.querySelector(`#bt-${segment.id}`);
        const actualHours = parseTimeInput(input.value);
        
        if (actualHours !== null) {
            const predicted = results[i].timeHours;
            const diff = actualHours - predicted;
            const diffPercent = ((actualHours / predicted) - 1) * 100;
            
            totalActual += actualHours;
            totalPredicted += predicted;
            segmentsWithData++;
            
            comparisons.push({
                name: segment.name,
                actual: actualHours,
                predicted: predicted,
                diff: diff,
                diffPercent: diffPercent
            });
        }
    });
    
    if (segmentsWithData === 0) {
        analysis += '<p>Enter at least one actual segment time to compare.</p>';
    } else {
        analysis += '<table style="width:100%; font-size: 0.9rem;">';
        analysis += '<tr><th style="text-align:left">Segment</th><th>Actual</th><th>Predicted</th><th>Diff</th></tr>';
        
        comparisons.forEach(c => {
            const diffColor = c.diff > 0 ? 'var(--danger)' : 'var(--success)';
            const diffSign = c.diff > 0 ? '+' : '';
            analysis += `
                <tr>
                    <td>${c.name}</td>
                    <td style="text-align:center">${formatTimeShort(c.actual)}</td>
                    <td style="text-align:center">${formatTimeShort(c.predicted)}</td>
                    <td style="text-align:center; color:${diffColor}">${diffSign}${Math.round(c.diff * 60)}min (${diffSign}${c.diffPercent.toFixed(0)}%)</td>
                </tr>
            `;
        });
        
        // Overall
        const overallDiff = totalActual - totalPredicted;
        const overallPercent = ((totalActual / totalPredicted) - 1) * 100;
        const overallColor = overallDiff > 0 ? 'var(--danger)' : 'var(--success)';
        const overallSign = overallDiff > 0 ? '+' : '';
        
        analysis += `
            <tr style="font-weight:bold; border-top: 1px solid var(--border)">
                <td>Overall</td>
                <td style="text-align:center">${formatTime(totalActual)}</td>
                <td style="text-align:center">${formatTime(totalPredicted)}</td>
                <td style="text-align:center; color:${overallColor}">${overallSign}${Math.round(overallDiff * 60)}min (${overallSign}${overallPercent.toFixed(0)}%)</td>
            </tr>
        `;
        analysis += '</table>';
        
        // Suggestions
        analysis += '<p style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted)">';
        if (overallPercent > 10) {
            analysis += '⚠️ Model is optimistic. Try lowering fatigue resistance or intensity.';
        } else if (overallPercent < -10) {
            analysis += '✨ Model is conservative. You may be faster than predicted!';
        } else {
            analysis += '✅ Model is reasonably calibrated (within 10%).';
        }
        analysis += '</p>';
    }
    
    backtestResultsEl.innerHTML = analysis;
    backtestResultsEl.classList.remove('hidden');
}

// Event listeners
ftpSlider.addEventListener('input', updateDisplays);
weightSlider.addEventListener('input', updateDisplays);
intensitySlider.addEventListener('input', updateDisplays);
fatigueSlider.addEventListener('input', updateDisplays);
stopsSlider.addEventListener('input', updateDisplays);

toggleBacktestBtn.addEventListener('click', () => {
    backtestEnabled = !backtestEnabled;
    if (backtestEnabled) {
        backtestInputsEl.classList.remove('hidden');
        toggleBacktestBtn.textContent = 'Disable Backtest Input';
        setupBacktest();
    } else {
        backtestInputsEl.classList.add('hidden');
        toggleBacktestBtn.textContent = 'Enable Backtest Input';
        backtestResultsEl.classList.add('hidden');
    }
});

runBacktestBtn.addEventListener('click', runBacktest);

// Initial calculation
updateDisplays();

// Load from URL params if present
const params = new URLSearchParams(window.location.search);
if (params.has('ftp')) ftpSlider.value = params.get('ftp');
if (params.has('weight')) weightSlider.value = params.get('weight');
if (params.has('intensity')) intensitySlider.value = params.get('intensity');
if (params.has('fatigue')) fatigueSlider.value = params.get('fatigue');
if (params.has('stops')) stopsSlider.value = params.get('stops');
updateDisplays();
