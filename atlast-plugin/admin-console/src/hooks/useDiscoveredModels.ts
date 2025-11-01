import { useQuery } from "@tanstack/react-query";
import { useAtlasConfig } from "@/context/AtlasContext";
import { discoverLocalModels } from "@/services/atlasApi";

const DISCOVERY_QUERY_KEY = ["atlas", "model-discovery"];

export function useDiscoveredModels(enabled: boolean) {
  const { modelDiscoveryBaseUrl } = useAtlasConfig();

  return useQuery({
    queryKey: [...DISCOVERY_QUERY_KEY, modelDiscoveryBaseUrl],
    queryFn: () => discoverLocalModels(modelDiscoveryBaseUrl),
    enabled,
    staleTime: 60_000,
    refetchInterval: enabled ? 120_000 : false
  });
}
