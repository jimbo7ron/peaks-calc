// Peaks Challenge Falls Creek - Course Segments
// Based on official route: 235km, 4,400m+ elevation
const SEGMENTS = [
    {
        id: 'descent-start',
        name: 'Falls Creek → Mt Beauty',
        distance: 30,
        elevation: -900,  // descent
        type: 'descent',
        avgGradient: -3.0
    },
    {
        id: 'tawonga-gap',
        name: 'Tawonga Gap',
        distance: 7.5,
        elevation: 476,
        type: 'climb',
        avgGradient: 6.3
    },
    {
        id: 'descent-germantown',
        name: 'Tawonga Gap → Harrietville',
        distance: 32.5,
        elevation: -350,
        type: 'descent',
        avgGradient: -1.1
    },
    {
        id: 'mt-hotham',
        name: 'Mt Hotham (HC)',
        distance: 29.9,
        elevation: 1303,
        type: 'climb',
        avgGradient: 4.4
    },
    {
        id: 'hotham-omeo',
        name: 'Hotham → Omeo',
        distance: 50,
        elevation: -800,
        type: 'descent',
        avgGradient: -1.6
    },
    {
        id: 'bingo-gap',
        name: 'Bingo Gap',
        distance: 8,
        elevation: 180,
        type: 'climb',
        avgGradient: 2.3
    },
    {
        id: 'anglers-rest',
        name: 'Omeo → Anglers Rest',
        distance: 25,
        elevation: -300,
        type: 'flat',
        avgGradient: -1.2
    },
    {
        id: 'back-of-falls',
        name: 'Back of Falls Creek (HC)',
        distance: 22.6,
        elevation: 980,
        type: 'climb',
        avgGradient: 4.3,
        notes: 'First 9km avg 10%!'
    },
    {
        id: 'plateau-finish',
        name: 'Plateau → Finish',
        distance: 12,
        elevation: -100,
        type: 'flat',
        avgGradient: -0.8
    }
];

// Physical constants
const GRAVITY = 9.81; // m/s²
const AIR_DENSITY = 1.1; // kg/m³ (alpine, slightly lower)
const CDA = 0.35; // drag coefficient * frontal area (drops position)
const CRR = 0.004; // rolling resistance coefficient

// DOM Elements
const ftpSlider = document.getElementById('ftp');
const weightSlider = document.getElementById('weight');
const intensitySlider = document.getElementById('intensity');
const stopsSlider = document.getElementById('stops');

const ftpValue = document.getElementById('ftp-value');
const weightValue = document.getElementById('weight-value');
const intensityValue = document.getElementById('intensity-value');
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
function calculateSpeed(powerWatts, weightKg, gradientPercent) {
    const gradient = gradientPercent / 100;
    
    // For climbs: use simplified power-based calculation
    // Power = (gravity * weight * gradient + rolling resistance + aero drag) * velocity
    // Simplified for climbing: aero drag is minimal
    
    if (gradientPercent > 2) {
        // Climbing - aero drag minimal, gravity dominant
        // v = P / (m * g * (sin(θ) + Crr))
        // sin(θ) ≈ gradient for small angles
        const resistanceForce = weightKg * GRAVITY * (gradient + CRR);
        const speedMs = powerWatts / resistanceForce;
        return Math.max(speedMs * 3.6, 5); // Convert to km/h, minimum 5 km/h
    } else if (gradientPercent < -2) {
        // Descending - limited by safety/skill, not power
        // Steeper = faster, but capped
        const baseSpeed = 45; // km/h base descent speed
        const gradientBonus = Math.min(Math.abs(gradientPercent) * 3, 20);
        return Math.min(baseSpeed + gradientBonus, 70); // Cap at 70 km/h
    } else {
        // Flat/rolling - balanced equation
        // Simplified: use a power-to-speed curve for flat terrain
        // At 250W, ~38 km/h on flat (typical)
        const flatSpeed = Math.pow(powerWatts / (0.5 * AIR_DENSITY * CDA), 1/3) * 3.6;
        // Adjust slightly for gradient
        const gradientAdjust = gradientPercent * -1.5; // km/h per % gradient
        return Math.max(flatSpeed + gradientAdjust, 20);
    }
}

// Calculate segment time
function calculateSegmentTime(segment, powerWatts, weightKg) {
    const speed = calculateSpeed(powerWatts, weightKg, segment.avgGradient);
    const timeHours = segment.distance / speed;
    return {
        speed: speed,
        timeHours: timeHours,
        timeSeconds: timeHours * 3600
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
        const result = calculateSegmentTime(segment, climbingPower, weight);
        cumulativeTime += result.timeHours;
        
        segmentResults.push({
            segment: segment,
            ...result,
            cumulativeTime: cumulativeTime
        });
        
        // Create row
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
            analysis += '⚠️ Model is optimistic. Consider reducing intensity % or FTP input.';
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
if (params.has('stops')) stopsSlider.value = params.get('stops');
updateDisplays();
