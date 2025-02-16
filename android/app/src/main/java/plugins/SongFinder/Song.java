package plugins.SongFinder;

import java.time.LocalDate;

public class Song {
    private final String nativeURL;
    private final int modificationTime;
    private final String mimetype;
    private final String artist;
    private final String album;
    private final String title;
    private final long length;

    public Song(String nativeURL, int modificationTime, String mimetype, String artist, String album, String title, long length) {
        this.nativeURL = nativeURL;
        this.modificationTime = modificationTime;
        this.mimetype = mimetype;
        this.artist = artist;
        this.album = album;
        this.title = title;
        this.length = length;
    }

    public String getNativeURL() {
        return nativeURL;
    }

    public int getModificationTime() {
        return modificationTime;
    }

    public String getMimetype() {
        return mimetype;
    }

    public String getArtist() {
        return artist;
    }

    public String getAlbum() {
        return album;
    }

    public String getTitle() {
        return title;
    }

    public long getLength() {
        return length;
    }
}
