// Peaks Challenge Falls Creek - Course Segments
// 235km, 4,400m+ elevation

// Strava Segment IDs for the three main climbs
const STRAVA_SEGMENTS = {
    tawonga: { id: 634373, name: 'Tawonga Gap', weight: 0.15 },      // 7.5km - shortest, freshest legs
    hotham: { id: 610370, name: 'Mt Hotham', weight: 0.45 },         // 30km - longest, mid-ride
    falls: { id: 639129, name: 'Back of Falls', weight: 0.40 }       // 22km - final climb, fatigued
};

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
const climbWkgValue = document.getElementById('climb-wkg');
const flatWkgValue = document.getElementById('flat-wkg');

const totalTimeEl = document.getElementById('total-time');
const timeMarginEl = document.getElementById('time-margin');
const climbTimeEl = document.getElementById('climb-time');
const segmentRowsEl = document.getElementById('segment-rows');

// Calculate climbing speed from power
// Calibrated against real 2025 data: 250W on Tawonga = 17 km/h
function climbSpeed(powerWatts, weightKg, gradientPercent) {
    const gradient = gradientPercent / 100;
    // Add drivetrain losses (~3%) and real-world inefficiencies
    const effectivePower = powerWatts * 0.92;
    const resistanceForce = weightKg * GRAVITY * (gradient + CRR);
    const speedMs = effectivePower / resistanceForce;
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
    
    // Calculate W/kg (estimate rider weight as system - 10kg for bike/gear)
    const riderWeight = parseFloat(weightSlider.value) - 10;
    climbWkgValue.textContent = (parseInt(climbPowerSlider.value) / riderWeight).toFixed(2);
    flatWkgValue.textContent = (parseInt(flatPowerSlider.value) / riderWeight).toFixed(2);
    
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

// ============================================
// Strava OAuth
// ============================================

const STRAVA_CLIENT_ID = '204111';
const STRAVA_REDIRECT_URI = window.location.origin + window.location.pathname;
const WORKER_URL = 'https://peaks-oauth.jimbo7ron.workers.dev';

const stravaBtn = document.getElementById('strava-btn');
const stravaStatus = document.getElementById('strava-status');

// Check for stored token
const storedToken = localStorage.getItem('strava_token');
if (storedToken) {
    stravaStatus.textContent = '✓ Strava connected';
    stravaStatus.className = 'strava-status success';
}

// Handle OAuth callback - check for code in URL
const urlParams = new URLSearchParams(window.location.search);
const authCode = urlParams.get('code');
if (authCode) {
    handleOAuthCallback(authCode);
}

async function handleOAuthCallback(code) {
    stravaStatus.textContent = 'Connecting to Strava...';
    stravaStatus.className = 'strava-status loading';
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    try {
        // Exchange code for token via our worker
        const response = await fetch(WORKER_URL + '/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (!data.access_token) {
            throw new Error('No access token received');
        }
        
        // Store the token
        localStorage.setItem('strava_token', data.access_token);
        
        // Fetch segment efforts
        const efforts = await fetchStravaEfforts(data.access_token);
        
        if (Object.keys(efforts).length === 0) {
            stravaStatus.textContent = 'Connected but no efforts found for these climbs';
            stravaStatus.className = 'strava-status warning';
            return;
        }
        
        // Calculate weighted average climbing power
        const result = calculateWeightedPower(efforts);
        
        // Update the slider
        climbPowerSlider.value = Math.round(result.weightedPower);
        updateDisplays();
        
        stravaStatus.innerHTML = `✓ Imported: <strong>${Math.round(result.weightedPower)}W</strong> avg climbing power`;
        stravaStatus.className = 'strava-status success';
        
        // Show breakdown
        showStravaBreakdown(efforts, result);
        
    } catch (error) {
        console.error('OAuth error:', error);
        stravaStatus.textContent = 'Connection failed: ' + error.message;
        stravaStatus.className = 'strava-status error';
    }
}

stravaBtn.addEventListener('click', () => {
    // If already connected, fetch fresh data
    if (storedToken) {
        fetchWithStoredToken();
        return;
    }
    
    // Otherwise redirect to Strava OAuth
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&scope=read,activity:read&approval_prompt=auto`;
    window.location.href = authUrl;
});

async function fetchWithStoredToken() {
    stravaStatus.textContent = 'Fetching your segment efforts...';
    stravaStatus.className = 'strava-status loading';
    
    try {
        const efforts = await fetchStravaEfforts(storedToken);
        
        if (Object.keys(efforts).length === 0) {
            stravaStatus.textContent = 'No efforts found for these climbs';
            stravaStatus.className = 'strava-status warning';
            return;
        }
        
        const result = calculateWeightedPower(efforts);
        climbPowerSlider.value = Math.round(result.weightedPower);
        updateDisplays();
        
        stravaStatus.innerHTML = `✓ Imported: <strong>${Math.round(result.weightedPower)}W</strong> avg climbing power`;
        stravaStatus.className = 'strava-status success';
        
        showStravaBreakdown(efforts, result);
    } catch (error) {
        console.error('Fetch error:', error);
        // Token might be expired, clear it
        localStorage.removeItem('strava_token');
        stravaStatus.textContent = 'Session expired - click to reconnect';
        stravaStatus.className = 'strava-status error';
    }
}

// Use CORS proxy for browser requests (Strava API blocks direct browser access)
// For production, replace with your own proxy endpoint
const CORS_PROXY = 'https://corsproxy.io/?';

async function fetchStravaEfforts(token) {
    const efforts = {};
    
    for (const [key, segment] of Object.entries(STRAVA_SEGMENTS)) {
        try {
            const apiUrl = `https://www.strava.com/api/v3/segment_efforts?segment_id=${segment.id}&per_page=10`;
            const response = await fetch(
                CORS_PROXY + encodeURIComponent(apiUrl),
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.status === 401) {
                throw new Error('Invalid or expired token. Please get a new one from Strava.');
            }

            if (!response.ok) {
                throw new Error(`Strava API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Get best effort with power data
            const effortsWithPower = data.filter(e => e.average_watts && e.average_watts > 0);
            
            if (effortsWithPower.length > 0) {
                // Use best (highest power) effort
                const bestEffort = effortsWithPower.reduce((best, e) => 
                    e.average_watts > best.average_watts ? e : best
                );
                
                efforts[key] = {
                    name: segment.name,
                    watts: bestEffort.average_watts,
                    time: bestEffort.moving_time,
                    date: bestEffort.start_date_local,
                    weight: segment.weight
                };
            }
        } catch (error) {
            if (error.message.includes('token')) {
                throw error;
            }
            console.warn(`Failed to fetch ${segment.name}:`, error);
        }
    }
    
    return efforts;
}

function calculateWeightedPower(efforts) {
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const effort of Object.values(efforts)) {
        weightedSum += effort.watts * effort.weight;
        totalWeight += effort.weight;
    }
    
    // Normalize if we don't have all climbs
    const weightedPower = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    return {
        weightedPower,
        efforts
    };
}

function showStravaBreakdown(efforts, result) {
    // Remove existing breakdown if any
    const existing = document.querySelector('.strava-breakdown');
    if (existing) existing.remove();
    
    // Create breakdown element
    const breakdown = document.createElement('div');
    breakdown.className = 'strava-breakdown';
    
    let html = '<h4>📊 Your Strava Data</h4>';
    
    for (const [key, effort] of Object.entries(efforts)) {
        const date = new Date(effort.date).toLocaleDateString();
        const time = formatTime(effort.time / 3600);
        html += `
            <div class="strava-breakdown-row">
                <span>${effort.name}</span>
                <span>${Math.round(effort.watts)}W (${time}) — ${date}</span>
            </div>
        `;
    }
    
    html += `
        <div class="strava-breakdown-row">
            <span>Weighted Average</span>
            <span>${Math.round(result.weightedPower)}W</span>
        </div>
    `;
    
    breakdown.innerHTML = html;
    
    // Insert after strava-import div
    const stravaImport = document.querySelector('.strava-import');
    stravaImport.after(breakdown);
}
