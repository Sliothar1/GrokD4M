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
  "53% lift over seasonal climatology (0.183 → 0.280 PR-AUC)";

export const MARINE_SKILL_LIFT =
  "Brier -1.10→-0.01 after calibration, p calibrated for Galway Bay risk";

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
