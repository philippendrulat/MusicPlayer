import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, Observable} from 'rxjs';
import {Song} from './Song';
import {MatSort, Sort, SortDirection} from '@angular/material/sort';

export class SongRow extends Song {
    public playing = false;

    public constructor(song: Song, public readonly index: number) {
        super(
            song.metadata,  song.location, song.modificationTime
        )
    }
}

export class MusicDatasource extends DataSource<SongRow> {
    public artists = new Set<string>();
    public genres = new Set<string>();
    public filterTimeout?: number;

    private data = new BehaviorSubject<SongRow[]>([]);
    private filteredData = new BehaviorSubject<SongRow[]>([]);
    private artistFilter?: string;
    private genreFilter?: string;
    private bpmFilter?: { lower: number; upper: number };
    public refreshing = false;
    private _sort?: MatSort;
    private sorted: Sort | undefined;
    public bpmMin = Number.MAX_SAFE_INTEGER;
    public bpmMax = Number.MIN_SAFE_INTEGER;
    private rowSize?: number;

    public constructor() {
        super();
        this.data.subscribe(songs => {
            this.filteredData.next(this.calculate(songs));
        });
    }

    private calculate(songs: SongRow[]): SongRow[] {
        let length = 0;
        const result = songs.filter(song => {
            let pass = true;
            if (this.artistFilter && this.artistFilter.length > 0) {
                pass = !!song.artist && song.artist.toLowerCase().includes(this.artistFilter.toLowerCase());
            }
            if (this.genreFilter && this.genreFilter.length > 0) {
                pass = pass && !!song.genre && !!song.genre.find(genre => genre.toLowerCase().includes(this.genreFilter!.toLowerCase()));
            }
            if (this.bpmFilter) {
                pass = pass && this.getBpmFilterPredicate()(song);
            }
            if (pass) {
                length++;
            }
            return pass;
        });
        if (this.sorted) {
            result.sort((songA, songB) => {
                const active = this.sorted?.active;
                if (!this.sorted || !active) {
                    return 0;
                }
                switch (active) {
                    case 'bpm':
                    case 'length':
                        return this.sortNumbers(songA[active] || 0, songB[active] || 0, this.sorted.direction);
                    case 'genre':
                        return this.sortStrings((songA.genre || [])[0], (songB.genre || [])[0], this.sorted.direction);
                    default:
                        return this.sortStrings('' + songA[active as keyof SongRow], '' + songB[active as keyof SongRow], this.sorted.direction);
                }
            });
        }
        return result.slice(0, this.rowSize);
    }

    private getBpmFilterPredicate(): (song: SongRow) => boolean {
        return (song => {
            if (!this.bpmFilter) {
                return false;
            }
            if (this.bpmFilter.lower === this.bpmMin && !song.bpm) {
                return true;
            }
            return !!song.bpm && song.bpm >= this.bpmFilter.lower && song.bpm <= this.bpmFilter.upper;
        });
    }

    private sortNumbers(numberA: number, numberB: number, direction: SortDirection) {
        if (!numberA) {
            return Number.MAX_SAFE_INTEGER;
        }
        if (!numberB) {
            return Number.MIN_SAFE_INTEGER;
        }
        const multiplicator = direction === 'asc' ? 1 : -1;
        return multiplicator * (numberA - numberB);
    }

    private sortStrings(stringA: string, stringB: string, direction: SortDirection) {
        const multiplicator = direction === 'asc' ? 1 : -1;
        if (!stringA) {
            return Number.MAX_SAFE_INTEGER;
        } else if (!stringB) {
            return Number.MIN_SAFE_INTEGER;
        } else {
            return multiplicator * stringA.toLowerCase().localeCompare(stringB.toLowerCase());
        }
    }

    connect(collectionViewer: CollectionViewer): Observable<SongRow[] | ReadonlyArray<SongRow>> {
        return this.filteredData.asObservable();
    }

    disconnect(collectionViewer: CollectionViewer): void {
    }

    public set sort(sort: MatSort) {
        this._sort = sort;
        this._sort.sortChange.subscribe(sortChanged => this.sortData(sortChanged));
    }

    private sortData(sort: Sort) {
        this.sorted = sort;
        this.doCalculate();
    }

    public setSongs(songs: Song[]) {
        this.artists.clear();
        songs.forEach(song => {
            if (song.artist) {
                this.artists.add(song.artist);
            }
            if (song.genre) {
                song.genre.forEach(genre => this.genres.add(genre));
            }
            if (song.bpm) {
                const bpm = parseInt('' + song.bpm, 10);
                if (bpm < this.bpmMin) {
                    this.bpmMin = bpm;
                }
                if (bpm > this.bpmMax) {
                    this.bpmMax = bpm;
                }
            }
        });
        this.data.next(songs.map((song, index) => new SongRow(song, index)));
    }

    public getArtists(filter: string | null) {
        return Array.from(this.artists.values())
            .filter(artist => filter ? artist.toLowerCase().includes(filter.toLowerCase()) : true)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    }

    public getGenres(filter: string | null) {
        return Array.from(this.genres.values())
            .filter(artist => filter ? artist.toLowerCase().includes(filter.toLowerCase()): true)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    }

    public setPlaying(song: Song, playing: boolean) {
        const songRow = this.data.value.find(s => s.location === song.location);
        if (songRow) {
            songRow.playing = playing;
        }
        this.data.next(this.data.value);
    }

    public get columns(): string[] {
        return ['artist', 'name', 'bpm', 'genre', 'length', 'album'];
    }

    public get songs() {
        return this.data.value;
    }

    public setArtist(artist?: string) {
        this.artistFilter = artist;
        this.fireFilter();

    }

    public setGenre(genre?: string) {
        this.genreFilter = genre;
        this.fireFilter();
    }

    public setBpm(range: { lower: number; upper: number }) {
        this.bpmFilter = range;
        this.fireFilter();
    }

    private fireFilter() {
        if (this.filterTimeout) {
            window.clearTimeout(this.filterTimeout);
            this.filterTimeout = undefined;
        }
        this.filterTimeout = window.setTimeout(() => {
            this.doCalculate();
        }, 1000);
    }

    private doCalculate() {
        setTimeout(() => {
            this.filteredData.next(this.calculate(this.data.value));
        });
    }

    public filterImmediately() {
        if (this.filterTimeout) {
            window.clearTimeout(this.filterTimeout);
            this.filterTimeout = undefined;
        }
        this.doCalculate();
    }

    public setRowSize(rowSize: number) {
        this.rowSize = rowSize;
        if (this.data.value && this.data.value.length > 0) {
            this.doCalculate();
        }
    }

    public getRowSize() {
        return this.rowSize;
    }
}
