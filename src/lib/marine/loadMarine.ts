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
  "Honest lift from 0.183 → 0.295 is (0.295 − 0.183) / 0.183 ≈ 61% relative PR-AUC, not a 53% figure from older drafts. Absolute gain +0.112. No ODYSSEA/Chl skill is claimed.";

export function marineDemoBundle(): MarineDemoBundle {
  const A = getMarineAssoc();
  return {
    engine: {
      name: "AssocMarine / AssocArray",
      row_pattern: "${year}-W${week}@${location_id}",
      skill_line: MARINE_SKILL_LINE,
      skill_lift_note: MARINE_SKILL_LIFT,
    },
    instances: INSTANCES,
    nnz: A.nnz(),
    cols: A.cols(),
  };
}
