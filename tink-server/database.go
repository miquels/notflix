package main

import (
	"database/sql"
	"fmt"
	"os"
	"strings"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

type DbItem struct {
	Name       string
	Votes      int
	Genre      string
	Studio     string
	Rating     float32
	Year       int
	NfoTime    int64
	FirstVideo int64
	LastVideo  int64
}

var dbHandle *sqlx.DB

func dbInit(dbFile string) (err error) {
	dbHandle, err = sqlx.Connect("sqlite3", dbFile)
	if err == nil {
		_, err = dbHandle.Query("SELECT count(*) FROM items")
		if err != nil {
			// database is empty, CREATE tables.
			err = dbInitSchema()
		}
	}
	return
}

func dbInitSchema() (err error) {
	schema := `
	CREATE TABLE items(
		name TEXT NOT NULL PRIMARY KEY,
		votes INTEGER,
		year INTEGER,
		genre TEXT NOT NULL,
		studio TEXT NOT NULL,
		rating REAL,
		nfotime INTEGER NOT NULL,
		firstvideo INTEGER NOT NULL,
		lastvideo INTEGER NOT NULL
	);`
	_, err = dbHandle.Exec(schema)
	return
}

// Check NFO file.
func itemCheckNfo(item *Item) (updated bool) {
	if item.NfoPath == "" {
		return
	}
	if item.NfoTime > 0 {
		fi, err := os.Stat(item.NfoPath)
		if err == nil && TimeToUnixMS(fi.ModTime()) == item.NfoTime {
			return
		}
	}

	fh, err := os.Open(item.NfoPath)
	if err != nil {
		fmt.Printf("XXX DEBUG open %s: %s\n", item.NfoPath, err)
		return
	}
	nfo := decodeNfo(fh)
	ftime := int64(0)
	fi, err := fh.Stat()
	if err == nil {
		ftime = TimeToUnixMS(fi.ModTime())
	}
	fh.Close()
	if nfo == nil {
		fmt.Printf("XXX DEBUG XML failed %s\n", item.Name)
		return
	}
	otime := item.NfoTime

	item.NfoTime = ftime
	item.Genre = nfo.Genre
	item.Rating = nfo.Rating
	item.Votes = nfo.Votes
	item.Studio = nfo.Studio
	if nfo.Year != 0 {
		item.Year = nfo.Year
	}
	updated = ftime > otime
	return
}

func dbInsertItem(tx *sqlx.Tx, item *Item) (err error) {
	item.Genrestring = strings.Join(item.Genre, ",")
	_, err = tx.NamedExec(
		`INSERT INTO items(name, votes, genre, studio, rating, year, nfotime, `+
			`		firstvideo, lastvideo)`+
			`VALUES (:name, :votes, :genrestring, :studio, :rating, :year, :nfotime, `+
			`		:firstvideo, :lastvideo)`, item)
	return
}

func dbUpdateItem(tx *sqlx.Tx, item *Item) (err error) {
	item.Genrestring = strings.Join(item.Genre, ",")
	_, err = tx.NamedExec(
		`UPDATE items SET votes = :votes, genre = :genrestring, studio = :studio, rating = :rating, `+
			`		year = :year, nfotime = :nfotime, `+
			`		firstvideo = :firstvideo, lastvideo = :lastvideo `+
			`		WHERE name = :name`, item)
	return
}

func dbLoadItem(coll *Collection, item *Item) {
	var data DbItem

	// Find this item by name in the database.
	tx, err := dbHandle.Beginx()
	err = dbHandle.Get(&data, "SELECT * FROM items WHERE name=? LIMIT 1", item.Name)

	// Not in database yet, insert
	if err == sql.ErrNoRows {
		itemCheckNfo(item)
		err = dbInsertItem(tx, item)
		if err != nil {
			fmt.Printf("INSERT: error: %s\n", err)
			os.Exit(1)
			tx.Rollback()
			return
		}
		tx.Commit()
		return
	}

	// Error? Too bad.
	if err != nil {
		tx.Rollback()
		return
	}

	needUpdate := false

	item.Genre = strings.Split(data.Genre, ",")
	item.Studio = data.Studio
	item.Rating = data.Rating
	item.Votes = data.Votes
	item.NfoTime = data.NfoTime

	if data.Year == 0 && item.Year > 0 {
		needUpdate = true
	} else {
		item.Year = data.Year
	}

	if item.FirstVideo == 0 {
		item.FirstVideo = data.FirstVideo
	}
	if item.LastVideo == 0 {
		item.LastVideo = data.LastVideo
	}

	if item.FirstVideo != data.FirstVideo ||
		item.LastVideo != data.LastVideo {
		needUpdate = true
	}

	// Got it. See if we need to update the database.
	if itemCheckNfo(item) {
		needUpdate = true
	}

	if needUpdate {
		err = dbUpdateItem(tx, item)
		if err != nil {
			tx.Rollback()
			return
		}
	}

	tx.Commit()
	return
}
