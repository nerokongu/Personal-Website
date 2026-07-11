import { DRIVE_API_KEY, DRIVE_MUSIC_FOLDER_ID } from "./drive-config.js";

export async function loadDriveTracks() {
  const query = encodeURIComponent(
    `'${DRIVE_MUSIC_FOLDER_ID}' in parents and trashed=false`
  );

  const fields = encodeURIComponent(
    "files(id,name,mimeType,size)"
  );

  const url =
    `https://www.googleapis.com/drive/v3/files` +
    `?q=${query}` +
    `&fields=${fields}` +
    `&key=${DRIVE_API_KEY}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Drive API error: ${res.status}`);
  }

  const data = await res.json();

  const files = data.files || [];

  console.log("🎵 Drive files:", files);

  return files
    .filter(file => {
      return (
        file.mimeType === "audio/mpeg" ||
        file.mimeType === "audio/mp3" ||
        file.name.toLowerCase().endsWith(".mp3")
      );
    })
    .sort((a, b) => {
      return a.name.localeCompare(b.name, "vi", {
        numeric: true,
        sensitivity: "base"
      });
    })
    .map(file => {
    const src = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${DRIVE_API_KEY}`;

    return {
        title: cleanMusicName(file.name),
        artist: "Google Drive",
        driveId: file.id,
        src
    };
    });
}

function cleanMusicName(name) {
  return name
    .replace(/\.[^/.]+$/, "")
    .replaceAll("_", " ")
    .trim();
}