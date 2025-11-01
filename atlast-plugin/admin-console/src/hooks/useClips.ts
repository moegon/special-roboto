import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtlasConfig } from "@/context/AtlasContext";
import { fetchClips, updateClip } from "@/services/atlasApi";
import type { AtlasClip } from "@/types";

const CLIPS_QUERY_KEY = ["atlas", "clips"];

export function useClips() {
  const { apiBaseUrl } = useAtlasConfig();
  const queryClient = useQueryClient();

  const hasPipeline = Boolean(apiBaseUrl?.trim());

  const clipsQuery = useQuery({
    queryKey: [...CLIPS_QUERY_KEY, apiBaseUrl],
    queryFn: () => fetchClips(apiBaseUrl),
    enabled: hasPipeline,
    staleTime: 15_000,
    refetchInterval: hasPipeline ? 30_000 : false
  });

  const updateMutation = useMutation({
    mutationFn: (input: { clipId: string; tags: string[]; description?: string }) =>
      updateClip(apiBaseUrl, input.clipId, {
        tags: input.tags,
        description: input.description
      }),
    onSuccess: (clip) => {
      queryClient.setQueryData<AtlasClip[]>([...CLIPS_QUERY_KEY, apiBaseUrl], (prev) => {
        if (!prev) {
          return [clip];
        }
        const index = prev.findIndex((item) => item.id === clip.id);
        if (index === -1) {
          return [clip, ...prev];
        }
        const next = [...prev];
        next[index] = clip;
        return next;
      });
    }
  });

  return {
    clipsQuery,
    updateMutation
  };
}
