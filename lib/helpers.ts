import {
  parseAlbumList,
  searchAlbum,
  getAllAlbumTracks,
  createPlaylist,
  addTracksToPlaylist,
  asyncPool,
  getMe,
} from "@/lib/spotify";
import type {
  Step,
  ProcessingPhase,
  SpotifyProfile,
  ParsedLine,
  MatchResult,
  Progress,
} from "@/lib/types";

export async function runCreatePlaylistFlow(args: {
  albumInput: string;
  profile: SpotifyProfile | null;
  playlistName: string;
  playlistDescription: string;
  isPublic: boolean;
  clientId: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  setProcessingPhase: React.Dispatch<React.SetStateAction<ProcessingPhase>>;
  setMatchResults: React.Dispatch<React.SetStateAction<MatchResult[]>>;
  setProgress: React.Dispatch<React.SetStateAction<Progress>>;
  setTotalTracks: React.Dispatch<React.SetStateAction<number>>;
  setPlaylistUrl: React.Dispatch<React.SetStateAction<string>>;
}) {
  const {
    albumInput,
    profile,
    playlistName,
    playlistDescription,
    isPublic,
    clientId,
    setError,
    setStep,
    setProcessingPhase,
    setMatchResults,
    setProgress,
    setTotalTracks,
    setPlaylistUrl,
  } = args;

  if (!albumInput.trim()) {
    setError("Please paste your album list first.");
    return;
  }

  setError("");
  setStep("processing");
  setProcessingPhase("parsing");
  setMatchResults([]);

  try {
    const parsed = parseAlbumList(albumInput);

    setProgress({
      current: 0,
      total: parsed.length,
      label: "Parsing input...",
    });

    const seen = new Set<string>();
    const uniqueParsed: ParsedLine[] = [];

    for (const p of parsed) {
      if (p.artist && p.album) {
        const key = `${p.artist.toLowerCase()}|${p.album.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueParsed.push(p);
        }
      } else {
        uniqueParsed.push(p);
      }
    }

    const initialResults: MatchResult[] = uniqueParsed
      .filter((p) => p.error)
      .map((p) => ({ parsed: p, error: p.error }));

    setMatchResults(initialResults);

    const toMatch = uniqueParsed.filter((p) => !p.error);

    setProgress({
      current: 0,
      total: toMatch.length,
      label: "Matching albums...",
    });
    setProcessingPhase("matching");

    const matchedResults = await asyncPool(4, toMatch, async (item) => {
      const album = await searchAlbum(item.artist!, item.album!, clientId);

      setProgress((prev) => ({
        current: prev.current + 1,
        total: toMatch.length,
        label: `Matching: ${item.artist} - ${item.album}`,
      }));

      const result: MatchResult = album
        ? { parsed: item, album }
        : { parsed: item, error: "No good match found" };

      setMatchResults((prev) => [...prev, result]);
      return result;
    });

    const allResults = [...initialResults, ...matchedResults];
    const successfulMatches = allResults.filter((r) => r.album);

    if (successfulMatches.length === 0) {
      setError("No albums could be matched. Please check your input format.");
      setStep("input");
      return;
    }

    setProcessingPhase("fetching");
    setProgress({
      current: 0,
      total: successfulMatches.length,
      label: "Fetching tracks...",
    });

    let allTrackUris: string[] = [];
    await asyncPool(4, successfulMatches, async (result) => {
      const tracks = await getAllAlbumTracks(result.album!.id, clientId);
      allTrackUris = [...allTrackUris, ...tracks];

      setProgress((prev) => ({
        current: prev.current + 1,
        total: successfulMatches.length,
        label: `Fetching tracks: ${result.album!.name}`,
      }));
    });

    allTrackUris = [...new Set(allTrackUris)];
    setTotalTracks(allTrackUris.length);

    setProcessingPhase("creating");
    setProgress({ current: 0, total: 1, label: "Creating playlist..." });

    const currentProfile = profile ?? (await getMe(clientId));
    const playlist = await createPlaylist(
      currentProfile.id,
      playlistName,
      playlistDescription,
      isPublic,
      clientId
    );

    setProcessingPhase("adding");
    setProgress({
      current: 0,
      total: allTrackUris.length,
      label: "Adding tracks...",
    });

    await addTracksToPlaylist(playlist.id, allTrackUris, clientId);

    setProgress({
      current: allTrackUris.length,
      total: allTrackUris.length,
      label: "Complete!",
    });
    setPlaylistUrl(playlist.external_urls.spotify);
    setProcessingPhase("done");
    setStep("results");
  } catch (err) {
    setError(err instanceof Error ? err.message : "An error occurred");
    setStep("input");
  }
}
