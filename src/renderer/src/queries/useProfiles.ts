import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Profile } from '@shared/types/profiles'
import { queryKeys } from '../lib/queryClient'

export function useProfiles() {
  return useQuery({ queryKey: queryKeys.profilesList, queryFn: () => window.api.profiles.list() })
}

export function useProfile(id: string | null) {
  return useQuery({
    queryKey: queryKeys.profileGet(id ?? ''),
    queryFn: () => window.api.profiles.get(id as string),
    enabled: !!id
  })
}

export function useCommunityProfiles() {
  return useQuery({ queryKey: queryKeys.community, queryFn: () => window.api.profiles.community() })
}

function useInvalidatingMutation<TArgs, TResult>(mutationFn: (args: TArgs) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profilesList })
  })
}

export function useCreateProfile() {
  return useInvalidatingMutation((profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltin'>) =>
    window.api.profiles.create(profile)
  )
}

export function useUpdateProfile() {
  return useInvalidatingMutation(({ id, patch }: { id: string; patch: Partial<Profile> }) =>
    window.api.profiles.update(id, patch)
  )
}

export function useRemoveProfile() {
  return useInvalidatingMutation((id: string) => window.api.profiles.remove(id))
}

export function useInstallProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => window.api.profiles.installProfile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.queueList })
  })
}

export function useGenerateShareCode() {
  return useInvalidatingMutation((id: string) => window.api.profiles.generateShareCode(id))
}

export function useImportProfileByCode() {
  return useInvalidatingMutation((code: string) => window.api.profiles.importByCode(code))
}

export function useExportProfile() {
  return useMutation({
    mutationFn: ({ id, filePath }: { id: string; filePath: string }) => window.api.profiles.exportToFile(id, filePath)
  })
}

export function useImportProfileFromFile() {
  return useInvalidatingMutation((filePath: string) => window.api.profiles.importFromFile(filePath))
}
