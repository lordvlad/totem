import { get } from "idb-keyval";
import usePlayer from "./usePlayer";
import { useOptions } from "./useOptions";
import { useLibrary } from "./useLibrary";

export function useGmePlayer() {
  const audioPlayer = usePlayer();
  const { stopOid, replayOid, playAllOid } = useOptions()[0];
  const { value: tracks } = useLibrary("tracks");

  // eslint-disable-next-line complexity -- This function is complex by design
  async function touch(code: number) {
    if (code === stopOid) {
      return audioPlayer.stop();
    }
    if (code === replayOid) {
      return await audioPlayer.replay();
    }
    if (code === playAllOid) {
      return await Promise.reject(new Error("Not implemented"));
    }

    if (code >= 1401 && code <= 1401 + tracks.length) {
      const track = tracks[code - 1401];
      return await play(track.fileName);
    }

    throw new Error(`Unknown code: ${code}`);
  }

  const play = async (path: string) => {
    const data = await get<Uint8Array>(`data:${path}`);
    if (data == null) {
      throw new Error(`No data found for track: ${path}`);
    }
    const chunkSize = 0x8000;
    let base64String = "";
    for (let i = 0; i < data.length; i += chunkSize) {
      base64String += String.fromCharCode.apply(null, [
        ...data.subarray(i, i + chunkSize),
      ]);
    }
    base64String = btoa(base64String);
    const dataUrl = `data:audio/mpeg;base64,${base64String}`;
    return await audioPlayer.play(dataUrl);
  };

  return touch;
}
