/**
 * Build Cork Ocean Hackathon marine instance JSON + D4M seed triples.
 *
 * Grounded metrics stay as published numbers.
 * Daily SST / SSTA / in_mhw / frac_mhw series are ILLUSTRATIVE context
 * calibrated to those published means — not a re-release of OISST/CRW grids.
 * HAB cell counts appear only where the brief supplies a number.
 *
 * Run: node scripts/marine/build-seed.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const outDir = join(root, "data", "marine");
const instDir = join(outDir, "instances");

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoWeekUTC(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

function eachDate(start, end) {
  const out = [];
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const cur = new Date(Date.UTC(sy, sm - 1, sd));
  const last = new Date(Date.UTC(ey, em - 1, ed));
  while (cur <= last) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(n, dp = 3) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function marineRow(year, week, locationId) {
  return `${year}-W${pad2(week)}@${locationId}`;
}

const STATIONS = {
  "irish-shelf": {
    id: "irish-shelf",
    name: "Irish shelf (OISST / CRW bbox mean)",
    lat: 53.15,
    lon: -10.35,
    kind: "satellite-bbox",
    note: "Spatial mean over the Irish-shelf / CRW Irish bbox used in PA-Marine-Model notes — not a single mooring.",
  },
  "mace-head": {
    id: "mace-head",
    name: "Mace Head",
    lat: 53.326,
    lon: -9.904,
    kind: "coastal-obs",
    note: "Coastal temperature context for Connemara / west Galway.",
  },
  gubbaros: {
    id: "gubbaros",
    name: "Gubbaros (Connemara HAB)",
    lat: 53.32,
    lon: -9.78,
    kind: "hab-station",
    note: "Marine Institute shellfish / HAB monitoring site. Map pin is approximate.",
  },
  rosmuc: {
    id: "rosmuc",
    name: "Rosmuc",
    lat: 53.355,
    lon: -9.618,
    kind: "hab-station",
    note: "Connemara HAB site. Map pin is approximate.",
  },
  mannin: {
    id: "mannin",
    name: "Mannin",
    lat: 53.46,
    lon: -10.05,
    kind: "hab-station",
    note: "Mannin Bay HAB site. Map pin is approximate.",
  },
  "lehanagh-pool": {
    id: "lehanagh-pool",
    name: "Lehanagh Pool buoy",
    lat: 53.298,
    lon: -9.9,
    kind: "buoy",
    note: "Marine Institute buoy. Near-real-time record in this demo starts 2024-05-27 — no June 2023 series.",
  },
  kilkieran: {
    id: "kilkieran",
    name: "Kilkieran (Connemara focus)",
    lat: 53.32,
    lon: -9.73,
    kind: "hab-station",
    note: "Additional Connemara focus site for 2022 local-week contrast. Map pin approximate.",
  },
};

function calibrate(values, targetMean) {
  if (!values.length) return values;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean === 0) return values.map(() => targetMean);
  const scale = targetMean / mean;
  return values.map((v) => v * scale);
}

function build2018() {
  const rng = mulberry32(20180618);
  const dates = eachDate("2018-06-01", "2018-08-31");
  const mhw = new Set([
    "2018-06-15",
    "2018-06-16",
    "2018-06-17",
    "2018-06-18",
    "2018-06-19",
    "2018-06-20",
    "2018-07-12",
    "2018-07-13",
    "2018-07-14",
    "2018-07-15",
  ]);
  // 10 / 92 ≈ 0.109 vs published JJA in_mhw ~0.111; June 6/30 = 0.200 vs ~0.194

  const doy = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Math.floor(
      (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000
    );
  };

  const rawSst = dates.map((dt) => {
    const t = (doy(dt) - 152) / 90; // 0 at 1 Jun toward late Aug
    const seasonal = 14.35 + 2.15 * t + 0.35 * Math.sin(t * Math.PI);
    const noise = (rng() - 0.5) * 0.35;
    const bump = mhw.has(dt) ? 0.55 : 0;
    return seasonal + noise + bump;
  });

  const juneIdx = dates
    .map((dt, i) => (dt.startsWith("2018-06") ? i : -1))
    .filter((i) => i >= 0);
  const juneVals = juneIdx.map((i) => rawSst[i]);
  const scaledJune = calibrate(juneVals, 14.9);
  const sst = rawSst.slice();
  juneIdx.forEach((i, k) => {
    sst[i] = scaledJune[k];
  });

  const timeseries = dates.map((date, i) => {
    const { year, week } = isoWeekUTC(date);
    const sstVal = round(sst[i], 2);
    const clim = round(13.7 + 2.0 * ((doy(date) - 152) / 90), 2);
    return {
      date,
      location_id: "irish-shelf",
      iso_year: year,
      iso_week: week,
      sst: sstVal,
      ssta: round(sstVal - clim, 2),
      in_mhw: mhw.has(date) ? 1 : 0,
      quality: "illustrative_context",
    };
  });

  timeseries.push({
    date: "2018-06-18",
    location_id: "gubbaros",
    iso_year: 2018,
    iso_week: isoWeekUTC("2018-06-18").week,
    hab_cells: 880,
    hab_exceedance: 1,
    quality: "grounded",
  });

  return {
    id: "2018-heatwave",
    tab_label: "Instance A",
    title: "Summer 2018 European / NE Atlantic MHW",
    date_range: { start: "2018-06-01", end: "2018-08-31" },
    angle:
      "Warm June on the Irish shelf plus an active Connemara Dinophysis week — HAB present with MHW, not a forecast claim.",
    narrative: [
      "June 2018 Irish-shelf OISST averaged ~14.90 °C, the #2 warmest June in the 2002–2026 window used by PA-Marine-Model notes.",
      "Hobday-style in_mhw occupancy was about 0.194 in June and about 0.111 across JJA — a warm month inside a broader European / NE Atlantic heat event.",
      "Connemara Gubbaros recorded a Dinophysis peak of ~880 cells/L in the week of 2018-06-18, during the June warmth.",
      "Nationally, Dinophysis-positive weeks in ISO weeks 22–35 ran at ~17.4% of monitored weeks — a network rate, not a single-bay forecast.",
      "This tab is storytelling from open SST and HAB bulletin metrics. It does not attach a model probability or an ‘early flag’ date.",
    ],
    key_metrics: {
      june_oisst_irish_shelf: {
        value: "14.90",
        unit: "°C",
        note: "#2 warmest June, 2002–2026",
        quality: "grounded",
      },
      june_in_mhw_rate: {
        value: "0.194",
        note: "June occupancy",
        quality: "grounded",
      },
      jja_in_mhw_rate: {
        value: "0.111",
        note: "June–August occupancy",
        quality: "grounded",
      },
      gubbaros_peak: {
        value: "880",
        unit: "cells/L",
        note: "Week of 2018-06-18",
        quality: "grounded",
      },
      national_dinophysis_weeks: {
        value: "17.4%",
        note: "ISO weeks 22–35, national network",
        quality: "grounded",
      },
    },
    highlight_station_id: "gubbaros",
    stations: [
      STATIONS["irish-shelf"],
      STATIONS.gubbaros,
      STATIONS["mace-head"],
      STATIONS.rosmuc,
      STATIONS.mannin,
    ],
    timeseries,
    data_notes: [
      "Daily SST / SSTA / in_mhw curves are illustrative monitoring context calibrated so June SST averages 14.90 °C and ~6 June + 4 later JJA days sit in MHW (10/92 ≈ 0.109 vs published JJA 0.111).",
      "They are not a pixel dump of NOAA OISST or a Hobday detect() run on the original grids.",
      "Gubbaros 880 cells/L is a grounded weekly HAB fact. Neighbouring weeks without a published count are omitted rather than invented.",
      "model_p is omitted: no real PA-Marine-Model probability artifact is shipped in this demo.",
    ],
    sources: [
      "NOAA OISST Irish-shelf June statistic as recorded in PA-Marine-Model notes (2002–2026 window).",
      "Hobday et al. (2016) MHW definition (seasonal 90th percentile, ≥5 days).",
      "Marine Institute HAB / shellfish monitoring (Gubbaros Dinophysis week of 2018-06-18).",
    ],
  };
}

function build2023() {
  const rng = mulberry32(20230619);
  const dates = eachDate("2023-05-15", "2023-08-15");
  const timeseries = [];

  // CRW Irish-bbox daily frac_mhw: June mean 0.964, peak 1.000 on 2023-06-19, max cat 5.
  const juneDates = dates.filter((d) => d.startsWith("2023-06"));
  const rawFrac = juneDates.map((dt) => {
    const day = Number(dt.slice(8));
    const dist = Math.abs(day - 19);
    const peak = 1 - dist * 0.004;
    const noise = (rng() - 0.5) * 0.01;
    return Math.min(1, Math.max(0.9, peak + noise));
  });
  const frac = calibrate(rawFrac, 0.964).map((v) => Math.min(1, v));
  const peakIdx = juneDates.indexOf("2023-06-19");
  frac[peakIdx] = 1;

  juneDates.forEach((date, i) => {
    const { year, week } = isoWeekUTC(date);
    const fracVal = round(frac[i], 3);
    const cat = fracVal >= 0.995 ? 5 : fracVal >= 0.98 ? 4 : fracVal >= 0.96 ? 3 : 2;
    timeseries.push({
      date,
      location_id: "irish-shelf",
      iso_year: year,
      iso_week: week,
      frac_mhw: fracVal,
      in_mhw: fracVal >= 0.5 ? 1 : 0,
      mhw_cat: date === "2023-06-19" ? 5 : cat,
      quality: "illustrative_context",
    });
  });

  // Shoulder months: still warm but not the flagship June occupancy
  for (const date of dates.filter((d) => !d.startsWith("2023-06"))) {
    const { year, week } = isoWeekUTC(date);
    const day = Number(date.slice(8));
    const month = Number(date.slice(5, 7));
    let fracVal =
      month === 5 ? 0.42 + day / 31 * 0.45 : 0.72 - ((day - 1) / 45) * 0.35;
    fracVal = round(Math.min(0.95, Math.max(0.12, fracVal + (rng() - 0.5) * 0.04)), 3);
    timeseries.push({
      date,
      location_id: "irish-shelf",
      iso_year: year,
      iso_week: week,
      frac_mhw: fracVal,
      in_mhw: fracVal >= 0.5 ? 1 : 0,
      quality: "illustrative_context",
    });
  }

  // Mace Head June mean 15.98 °C, +2.28 vs other Junes → clim ~13.70
  const maceRaw = juneDates.map((dt) => {
    const day = Number(dt.slice(8));
    const dist = Math.abs(day - 19);
    return 15.7 + (6 - Math.min(dist, 6)) * 0.08 + (rng() - 0.5) * 0.25;
  });
  const mace = calibrate(maceRaw, 15.98);
  juneDates.forEach((date, i) => {
    const { year, week } = isoWeekUTC(date);
    const sstVal = round(mace[i], 2);
    timeseries.push({
      date,
      location_id: "mace-head",
      iso_year: year,
      iso_week: week,
      sst: sstVal,
      ssta: round(sstVal - 13.7, 2),
      quality: "illustrative_context",
    });
  });

  const ros = isoWeekUTC("2023-05-29");
  timeseries.push({
    date: "2023-05-29",
    location_id: "rosmuc",
    iso_year: ros.year,
    iso_week: ros.week,
    hab_cells: 320,
    hab_exceedance: 1,
    quality: "grounded",
  });
  const man = isoWeekUTC("2023-07-10");
  timeseries.push({
    date: "2023-07-10",
    location_id: "mannin",
    iso_year: man.year,
    iso_week: man.week,
    hab_cells: 120,
    hab_exceedance: 1,
    quality: "grounded",
  });

  return {
    id: "2023-atlantic-mhw",
    tab_label: "Instance B",
    title: "June 2023 North Atlantic / Irish shelf flagship MHW",
    date_range: { start: "2023-05-15", end: "2023-08-15" },
    angle:
      "A severe shelf-wide MHW with Dinophysis and closures below climatology — heighten monitoring without claiming causation.",
    narrative: [
      "NOAA Coral Reef Watch Irish-bbox mean frac_mhw in June 2023 was ≈ 0.964, peaking at 1.000 on 2023-06-19, with maximum category 5.",
      "Mace Head June mean temperature was ≈ 15.98 °C, about +2.28 °C versus other Junes in the comparison set.",
      "National Dinophysis exceedance was 10.0% versus a 14.4% climatology; closure weeks were 16.3% versus 24.3% climatology — both below the seasonal baseline.",
      "Connemara bookends sit outside the June peak: Rosmuc 320 cells/L in the week of 2023-05-29, Mannin 120 cells/L in the week of 2023-07-10.",
      "Lehanagh Pool buoy has no June 2023 series here: near-real-time coverage in this demo begins 2024-05-27.",
      "Judge-facing skill line only: STRONG_OISST LightGBM test calibrated PR-AUC ~0.295 versus climatology ~0.18. No ODYSSEA or chlorophyll predictive skill is claimed.",
    ],
    key_metrics: {
      crw_june_mean_frac_mhw: {
        value: "0.964",
        note: "Irish bbox June mean",
        quality: "grounded",
      },
      crw_peak_frac_mhw: {
        value: "1.000",
        note: "2023-06-19",
        quality: "grounded",
      },
      max_mhw_category: {
        value: "5",
        note: "Hobday category",
        quality: "grounded",
      },
      mace_head_june_mean: {
        value: "15.98",
        unit: "°C",
        note: "~+2.28 °C vs other Junes",
        quality: "grounded",
      },
      national_dinophysis_exceedance: {
        value: "10.0% vs clim 14.4%",
        note: "Below climatology",
        quality: "grounded",
      },
      national_closures: {
        value: "16.3% vs clim 24.3%",
        note: "Below climatology",
        quality: "grounded",
      },
      strong_oisst_pr_auc: {
        value: "0.295 vs clim ~0.18",
        note: "Test calibrated PR-AUC. Relative lift from 0.183 → 0.295 is (0.295−0.183)/0.183 ≈ 61%, not a 53% figure from older drafts.",
        quality: "grounded",
      },
    },
    highlight_station_id: "mace-head",
    stations: [
      STATIONS["irish-shelf"],
      STATIONS["mace-head"],
      STATIONS.rosmuc,
      STATIONS.mannin,
      STATIONS["lehanagh-pool"],
    ],
    timeseries,
    data_notes: [
      "June frac_mhw daily values are illustrative context scaled to published mean 0.964 with a hard peak of 1.000 on 2023-06-19.",
      "Mace Head daily temperatures are illustrative context scaled to the published June mean 15.98 °C; SSTA uses 13.70 °C as the ‘other Junes’ baseline implied by +2.28 °C.",
      "HAB cell counts are only the two grounded Connemara bookends. No invented June bloom peak.",
      "Lehanagh Pool is listed with no June 2023 timeseries (NRT from 2024-05-27).",
      "model_p is omitted. Do not read the STRONG_OISST PR-AUC as a per-day probability on these charts.",
    ],
    sources: [
      "NOAA Coral Reef Watch MHW product (Irish bbox frac_mhw / category).",
      "Mace Head June temperature comparison as recorded in PA-Marine-Model notes.",
      "Marine Institute HAB exceedance and closure climatology (national).",
      "PA-Marine-Model STRONG_OISST LightGBM test calibrated PR-AUC only.",
    ],
  };
}

function build2022() {
  const rng = mulberry32(20220831);
  const dates = eachDate("2022-06-01", "2022-08-31");
  const timeseries = [];

  for (const date of dates) {
    const { year, week } = isoWeekUTC(date);
    const month = Number(date.slice(5, 7));
    const day = Number(date.slice(8));
    let frac;
    if (month === 6) {
      frac = 0.22 + (rng() - 0.5) * 0.08;
    } else if (month === 7) {
      frac = 0.31 + day / 31 * 0.12 + (rng() - 0.5) * 0.06;
    } else {
      // August: mean 0.521, peak 0.914 on 31 Aug
      frac = 0.38 + day / 31 * 0.4 + (rng() - 0.5) * 0.05;
    }
    timeseries.push({
      date,
      location_id: "irish-shelf",
      iso_year: year,
      iso_week: week,
      frac_mhw: round(Math.min(0.95, Math.max(0.05, frac)), 3),
      in_mhw: frac >= 0.5 ? 1 : 0,
      quality: "illustrative_context",
    });
  }

  const juneShelf = timeseries.filter(
    (p) => p.location_id === "irish-shelf" && p.date.startsWith("2022-06")
  );
  const juneFrac = calibrate(
    juneShelf.map((p) => p.frac_mhw),
    0.237
  );
  juneShelf.forEach((p, i) => {
    p.frac_mhw = round(juneFrac[i], 3);
    p.in_mhw = p.frac_mhw >= 0.5 ? 1 : 0;
  });

  const augShelf = timeseries.filter(
    (p) => p.location_id === "irish-shelf" && p.date.startsWith("2022-08")
  );
  const augFrac = calibrate(
    augShelf.map((p) => p.frac_mhw),
    0.521
  );
  augShelf.forEach((p, i) => {
    p.frac_mhw = round(Math.min(0.95, augFrac[i]), 3);
    p.in_mhw = p.frac_mhw >= 0.5 ? 1 : 0;
  });
  const aug31 = timeseries.find(
    (p) => p.location_id === "irish-shelf" && p.date === "2022-08-31"
  );
  if (aug31) {
    aug31.frac_mhw = 0.914;
    aug31.in_mhw = 1;
  }

  // Connemara focus: 27 June samples, 5 exceedances (18.5% vs clim ~4.6%).
  const focusStations = ["gubbaros", "rosmuc", "mannin", "kilkieran"];
  const juneSampleDates = [
    "2022-06-02",
    "2022-06-06",
    "2022-06-09",
    "2022-06-13",
    "2022-06-16",
    "2022-06-20",
    "2022-06-23",
    "2022-06-27",
    "2022-06-30",
  ];
  // 4 stations × 9 dates = 36; keep first 27 in station-major order
  const juneObs = [];
  for (const st of focusStations) {
    for (const date of juneSampleDates) {
      juneObs.push({ st, date });
    }
  }
  const keep = juneObs.slice(0, 27);
  const exceedIdx = new Set([2, 7, 11, 16, 22]); // exactly 5
  keep.forEach((obs, i) => {
    const { year, week } = isoWeekUTC(obs.date);
    const exceed = exceedIdx.has(i);
    timeseries.push({
      date: obs.date,
      location_id: obs.st,
      iso_year: year,
      iso_week: week,
      hab_exceedance: exceed ? 1 : 0,
      quality: "illustrative_context",
    });
  });

  // August Connemara focus: often 0 exceedances
  const augDates = ["2022-08-04", "2022-08-11", "2022-08-18", "2022-08-25"];
  for (const st of focusStations) {
    for (const date of augDates) {
      const { year, week } = isoWeekUTC(date);
      timeseries.push({
        date,
        location_id: st,
        iso_year: year,
        iso_week: week,
        hab_exceedance: 0,
        quality: "illustrative_context",
      });
    }
  }

  return {
    id: "2022-galway-bay",
    tab_label: "Instance C",
    title: "Summer 2022 Galway / Connemara contrast",
    date_range: { start: "2022-06-01", end: "2022-08-31" },
    angle:
      "Home-ground contrast with June 2023: local bay weeks can run hot for HAB while the shelf MHW fraction is only moderate — and August can reverse that.",
    narrative: [
      "June 2022 CRW Irish-bbox mean frac_mhw was only ≈ 0.237, far below the June 2023 flagship (0.964).",
      "Yet the Connemara focus exceedance rate was ~18.5% (5 of 27 samples) versus a ~4.6% climatology — local weeks mattered more than the shelf average.",
      "August 2022 flipped the pattern: CRW mean frac_mhw ≈ 0.521 with a peak ≈ 0.914 on 31 August, while Connemara focus exceedances were often zero.",
      "Read this against Instance B: a severe shelf MHW is not an automatic bloom, and a quieter shelf week is not an all-clear for Galway Bay / Connemara sites.",
    ],
    key_metrics: {
      june_crw_mean_frac_mhw: {
        value: "0.237",
        note: "Irish bbox June mean",
        quality: "grounded",
      },
      august_crw_mean_frac_mhw: {
        value: "0.521",
        note: "Irish bbox August mean",
        quality: "grounded",
      },
      august_peak_frac_mhw: {
        value: "0.914",
        note: "31 August 2022",
        quality: "grounded",
      },
      connemara_june_exceedance: {
        value: "18.5% (5/27)",
        note: "vs clim ~4.6%",
        quality: "grounded",
      },
      connemara_august_exceedance: {
        value: "often 0",
        note: "Focus sites in August samples",
        quality: "grounded",
      },
    },
    highlight_station_id: "gubbaros",
    stations: [
      STATIONS["irish-shelf"],
      STATIONS.gubbaros,
      STATIONS.rosmuc,
      STATIONS.mannin,
      STATIONS.kilkieran,
      STATIONS["mace-head"],
    ],
    timeseries,
    data_notes: [
      "Shelf frac_mhw daily values are illustrative context scaled to published June mean 0.237 and August mean 0.521, with the 31 Aug peak forced to 0.914.",
      "The 27 June Connemara samples with 5 exceedances reproduce the published 18.5% rate; exact sample dates/sites are a demo placement, not a republished MI table.",
      "August focus exceedances are set to 0 to match ‘often 0’ — not a claim that every Connemara bottle in August 2022 was zero.",
      "model_p is omitted.",
    ],
    sources: [
      "NOAA Coral Reef Watch MHW product (Irish bbox).",
      "PA-Marine-Model Connemara-focus HAB exceedance notes (June 2022 5/27 vs clim ~4.6%).",
      "Hobday et al. (2016) MHW definition.",
    ],
  };
}

function weeklyAgg(points) {
  const buckets = new Map();
  for (const p of points) {
    if (p.iso_year == null || p.iso_week == null) continue;
    const key = `${p.iso_year}|${p.iso_week}|${p.location_id}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(p);
  }
  return buckets;
}

function mean(nums) {
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function triplesFromInstances(instances) {
  const triples = [];
  const seen = new Set();
  const add = (row, col, val) => {
    const k = `${row}||${col}`;
    if (seen.has(k)) return;
    seen.add(k);
    triples.push({ row, col, val });
  };

  for (const st of Object.values(STATIONS)) {
    const row = `station:${st.id}`;
    add(row, "type", "station");
    add(row, "name", st.name);
    add(row, "lat", st.lat);
    add(row, "lon", st.lon);
    add(row, "kind", st.kind);
    if (st.note) add(row, "note", st.note);
  }

  for (const inst of instances) {
    const irow = `instance:${inst.id}`;
    add(irow, "type", "mhw_instance");
    add(irow, "title", inst.title);
    add(irow, "tab_label", inst.tab_label);
    add(irow, "start", inst.date_range.start);
    add(irow, "end", inst.date_range.end);
    add(irow, "angle", inst.angle);
    add(irow, "highlight_station", inst.highlight_station_id);

    const buckets = weeklyAgg(inst.timeseries);
    for (const [key, pts] of buckets) {
      const [year, week, loc] = key.split("|");
      const row = marineRow(Number(year), Number(week), loc);
      add(row, "instance", inst.id);
      add(row, "location_id", loc);
      add(row, "iso_year", Number(year));
      add(row, "iso_week", Number(week));

      const sst = pts.map((p) => p.sst).filter((v) => typeof v === "number");
      const ssta = pts.map((p) => p.ssta).filter((v) => typeof v === "number");
      const frac = pts.map((p) => p.frac_mhw).filter((v) => typeof v === "number");
      const inMhw = pts.map((p) => p.in_mhw).filter((v) => typeof v === "number");
      const cat = pts.map((p) => p.mhw_cat).filter((v) => typeof v === "number");
      const cells = pts.map((p) => p.hab_cells).filter((v) => typeof v === "number");
      const hab = pts.map((p) => p.hab_exceedance).filter((v) => typeof v === "number");

      if (sst.length) add(row, "sst", round(mean(sst), 2));
      if (ssta.length) add(row, "ssta", round(mean(ssta), 2));
      if (frac.length) add(row, "frac_mhw", round(mean(frac), 3));
      if (inMhw.length) add(row, "in_mhw", round(mean(inMhw), 3));
      if (cat.length) add(row, "mhw_cat", Math.max(...cat));
      if (cells.length) add(row, "hab_cells", Math.max(...cells));
      if (hab.length) add(row, "hab_exceedance", hab.some((v) => v === 1) ? 1 : 0);
    }
  }

  return triples;
}

mkdirSync(instDir, { recursive: true });
const instances = [build2018(), build2023(), build2022()];
for (const inst of instances) {
  const path = join(instDir, `${inst.id}.json`);
  writeFileSync(path, JSON.stringify(inst, null, 2) + "\n");
  console.log("wrote", path, "timeseries", inst.timeseries.length);
}

const triples = triplesFromInstances(instances);
const seedPath = join(outDir, "marine-seed.json");
writeFileSync(seedPath, JSON.stringify(triples, null, 2) + "\n");
console.log("wrote", seedPath, "nnz", triples.length);
