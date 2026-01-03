import type { Dispatch, SetStateAction } from "react";
import {
  parseAlbumList,
  parseArtistYearList,
  searchAlbum,
  findFullLengthAlbumByYear,
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
  InputMode,
} from "@/lib/types";

type StateSetters = {
  setError: Dispatch<SetStateAction<string>>;
  setStep: Dispatch<SetStateAction<Step>>;
  setProcessingPhase: Dispatch<SetStateAction<ProcessingPhase>>;
  setMatchResults: Dispatch<SetStateAction<MatchResult[]>>;
  setProgress: Dispatch<SetStateAction<Progress>>;
  setTotalTracks: Dispatch<SetStateAction<number>>;
  setPlaylistUrl: Dispatch<SetStateAction<string>>;
};

function dedupeParsedLines(
  mode: InputMode,
  parsed: ParsedLine[]
): ParsedLine[] {
  const seen = new Set<string>();
  const out: ParsedLine[] = [];

  for (const p of parsed) {
    if (mode === "album") {
      if (p.artist && p.album) {
        const key = `${p.artist.toLowerCase()}|${p.album.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
      }
      out.push(p);
      continue;
    }

    // mode === "year"
    if (p.artist && typeof p.year === "number") {
      const key = `${p.artist.toLowerCase()}|${p.year}`;
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(p);
  }

  return out;
}

export async function runCreatePlaylistFlow(
  args: {
    mode: InputMode;
    albumInput: string;
    profile: SpotifyProfile | null;
    playlistName: string;
    playlistDescription: string;
    isPublic: boolean;
    clientId: string;
  } & StateSetters
) {
  const {
    mode,
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

  const input = albumInput.trim();
  if (!input) {
    setError(
      mode === "year"
        ? "Please paste your Artist - Year list first."
        : "Please paste your album list first."
    );
    return;
  }

  setError("");
  setStep("processing");
  setProcessingPhase("parsing");
  setMatchResults([]);

  try {
    const parsed: ParsedLine[] =
      mode === "year"
        ? (parseArtistYearList(input) as ParsedLine[])
        : parseAlbumList(input);

    setProgress({
      current: 0,
      total: parsed.length,
      label: "Parsing input...",
    });

    const uniqueParsed = dedupeParsedLines(mode, parsed);

    const initialResults: MatchResult[] = uniqueParsed
      .filter((p) => p.error)
      .map((p) => ({ parsed: p, error: p.error }));

    setMatchResults(initialResults);

    const toMatch = uniqueParsed.filter((p) => !p.error);

    setProgress({
      current: 0,
      total: toMatch.length,
      label:
        mode === "year"
          ? "Matching artists to yearly albums..."
          : "Matching albums...",
    });
    setProcessingPhase("matching");

    const matchedResults = await asyncPool(1, toMatch, async (item) => {
      const album =
        mode === "year"
          ? await findFullLengthAlbumByYear(item.artist!, item.year!, clientId)
          : await searchAlbum(item.artist!, item.album!, clientId);

      setProgress((prev) => ({
        current: prev.current + 1,
        total: toMatch.length,
        label:
          mode === "year"
            ? `Matching: ${item.artist} - ${item.year}`
            : `Matching: ${item.artist} - ${item.album}`,
      }));

      const result: MatchResult = album
        ? {
            parsed:
              mode === "year"
                ? {
                    original: item.original,
                    artist: item.artist,
                    year: item.year,
                    album: album.name,
                  }
                : item,
            album,
          }
        : {
            parsed: item,
            error:
              mode === "year"
                ? `No full-length album found for ${item.year}`
                : "No good match found",
          };

      setMatchResults((prev) => [...prev, result]);
      return result;
    });

    const allResults = [...initialResults, ...matchedResults];
    const successfulMatches = allResults.filter((r) => r.album);

    if (successfulMatches.length === 0) {
      setError(
        mode === "year"
          ? "No yearly albums could be matched. Please check your input."
          : "No albums could be matched. Please check your input format."
      );
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
    await asyncPool(1, successfulMatches, async (result) => {
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
