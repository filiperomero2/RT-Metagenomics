import { Metrics } from "@/mainview/types/metrics";

export function generateFamilyDataSets(
  sampleMetrics?: Metrics["sampleMetrics"],
) {
  if (!sampleMetrics) return [];
  const keys = Object.keys(sampleMetrics);
  const familyDataSets: Record<string, number[]> = {};

  keys?.forEach((sampleKey) => {
    const pathologies = sampleMetrics[sampleKey]?.pathologies;
    pathologies?.forEach((pathology) => {
      const familyName = pathology.name;
      const nReads = pathology.nReads;

      if (!familyDataSets[familyName]) {
        familyDataSets[familyName] = Array(keys.length).fill(0);
      }
      const sampleIndex = keys.indexOf(sampleKey);
      familyDataSets[familyName][sampleIndex] = nReads;
    });
  });

  return Object.entries(familyDataSets).map(([dataSetTitle, data]) => ({
    dataSetTitle,
    data,
  }));
}

export function generateViralDataSets(
  sampleMetrics?: Metrics["sampleMetrics"],
) {
  if (!sampleMetrics) return [];
  const keys = Object.keys(sampleMetrics);
  const viralDataSets: Record<string, number[]> = {};

  keys?.forEach((sampleKey) => {
    const metrics = sampleMetrics[sampleKey];
    const viral = metrics?.nIdentifiedSequences;
    const nonViral = metrics?.nSequences - metrics?.nIdentifiedSequences;

    if (!viralDataSets["Viral"]) {
      viralDataSets["Viral"] = Array(keys.length).fill(0);
    }
    if (!viralDataSets["Non-Viral"]) {
      viralDataSets["Non-Viral"] = Array(keys.length).fill(0);
    }
    const sampleIndex = keys.indexOf(sampleKey);
    viralDataSets["Viral"][sampleIndex] = viral;
    viralDataSets["Non-Viral"][sampleIndex] = nonViral;
  });

  return Object.entries(viralDataSets).map(([dataSetTitle, data]) => ({
    dataSetTitle,
    data,
  }));
}
