export type MarineQuality = "grounded" | "illustrative_context";

export interface MarineStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: "satellite-bbox" | "coastal-obs" | "hab-station" | "buoy";
  note?: string;
}

export interface MarineTimeseriesPoint {
  date: string;
  location_id: string;
  iso_week?: number;
  iso_year?: number;
  sst?: number;
  ssta?: number;
  in_mhw?: number;
  frac_mhw?: number;
  mhw_cat?: number;
  hab_cells?: number;
  hab_exceedance?: 0 | 1;
  /** Never invent model_p — omit unless a real artifact exists. */
  model_p?: number;
  quality: MarineQuality;
}

export interface MarineInstance {
  id: string;
  tab_label: string;
  title: string;
  date_range: { start: string; end: string };
  angle: string;
  narrative: string[];
  key_metrics: Record<
    string,
    { value: string; unit?: string; note?: string; quality: MarineQuality }
  >;
  highlight_station_id: string;
  stations: MarineStation[];
  timeseries: MarineTimeseriesPoint[];
  data_notes: string[];
  sources: string[];
}

export interface MarineDemoBundle {
  engine: {
    name: string;
    row_pattern: string;
    skill_line: string;
    skill_lift_note: string;
  };
  instances: MarineInstance[];
  nnz: number;
  cols: string[];
}
