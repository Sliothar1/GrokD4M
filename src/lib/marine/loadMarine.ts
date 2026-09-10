import seed from "../../../data/marine/marine-seed.json";
import inst2018 from "../../../data/marine/instances/2018-heatwave.json";
import inst2023 from "../../../data/marine/instances/2023-atlantic-mhw.json";
import inst2022 from "../../../data/marine/instances/2022-galway-bay.json";
import {
  AssocMarine,
  loadAssocMarineFromJson,
} from "@/lib/marine/AssocMarine";
import type { MarineDemoBundle, MarineInstance } from "@/lib/marine/types";

const INSTANCES: MarineInstance[] = [
  inst2018 as MarineInstance,
  inst2023 as MarineInstance,
  inst2022 as MarineInstance,
];

let cached: AssocMarine | null = null;

export function getMarineAssoc(): AssocMarine {
  if (!cached) {
    cached = loadAssocMarineFromJson(seed);
  }
  return cached;
}

export function listMarineInstances(): MarineInstance[] {
  return INSTANCES;
}

export function getMarineInstance(id: string | undefined): MarineInstance {
  return INSTANCES.find((i) => i.id === id) ?? INSTANCES[0];
}

export const MARINE_SKILL_LINE =
  "STRONG_OISST ~0.295 test cal PR-AUC vs clim ~0.18";

export const MARINE_SKILL_LIFT =
  "If citing lift: 0.183 → 0.295 ≈ 61% relative ((0.295 − 0.183) / 0.183). Footnote only: older committed eval ~0.293 / calibrated ~0.280 appears in some metrics files — not the headline. No ODYSSEA/Chl skill; no per-day model_p.";

export const MARINE_ROW_PATTERN = "station:{id} / {year}-W{week}@{location}";

export function marineDemoBundle(): MarineDemoBundle {
  const A = getMarineAssoc();
  return {
    engine: {
      name: "AssocMarine / AssocArray",
      row_pattern: MARINE_ROW_PATTERN,
      skill_line: MARINE_SKILL_LINE,
      skill_lift_note: MARINE_SKILL_LIFT,
    },
    instances: INSTANCES,
    nnz: A.nnz(),
    cols: A.cols(),
  };
}
